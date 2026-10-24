// The Ludometer Worker: routes and jobs. src/index.ts is the entry point.
//
// Gated until BGG grants the commercial license (PUBLIC_API = "true" opens them):
//   GET  /api/ludometer/week[?week=YYYY-MM-DD]   one week's index
//   GET  /api/ludometer/game/:id                 one game's weekly history
//   GET  /api/ludometer/feed[?week=]             what the newsletter template reads
// Writers:
//   POST /api/ludometer/events                   Bearer EVENTS_TOKEN, one event or an array
//   POST /api/ludometer/kit-webhook?key=KEY      Kit tag-added webhook
// Admin (Bearer ADMIN_TOKEN):
//   GET/POST/PATCH /api/ludometer/admin/watchlist
//   GET/PUT        /api/ludometer/admin/settings
//   POST           /api/ludometer/admin/run?job=snapshot|score[&week=]
//   GET            /api/ludometer/admin/broadcast?week=
//   GET            /admin/   the admin page (put it behind Cloudflare Access)
// Cron: daily snapshot, Monday score.
import { ATTRIBUTION, type Env } from './env';
import { HttpError, corsHeaders, gatePublic, isPublic, json, parseJson, readText, requireToken } from './http';
import { addDays, isoDate, parseWeek, weekToScore } from './dates';
import { runScore, runSnapshot } from './jobs';
import { EventError, cleanEvents } from './events';
import { parseKitDelivery, safeEqual, verifyKitSignature } from './kit';
import { readSettings, settingsUpdate } from './settings';
import { cleanWatch, type WatchInput } from './watchlist';
import { buildBroadcast, feedPayload, pct, weekPayload, type WatchRow } from './views';
import type { WeeklyRow } from './score';
import { ADMIN_HTML } from './admin-page';

export const CRON_SNAPSHOT = '0 6 * * *';
export const CRON_SCORE = '0 9 * * 1';
const PREFIX = '/api/ludometer';

type Ctx = { req: Request; env: Env; url: URL; now: Date };
type Result = { body: unknown; status?: number; cache?: string };

async function resolveWeek(env: Env, raw: string | null): Promise<string> {
  if (raw != null) {
    const w = parseWeek(raw);
    if (!w) throw new HttpError(400, 'week must be a date like 2026-10-19');
    return w;
  }
  const row = await env.DB.prepare('SELECT MAX(week) AS week FROM weekly_scores').first<{ week: string | null }>();
  if (!row?.week) throw new HttpError(404, 'No week has been scored yet');
  return row.week;
}

async function weekRows(env: Env, week: string): Promise<WeeklyRow[]> {
  const { results } = await env.DB.prepare('SELECT * FROM weekly_scores WHERE week = ? ORDER BY rank').bind(week).all<WeeklyRow>();
  return results || [];
}

/** Gated routes are cached at the edge only once they are public. */
const readCache = (env: Env) => (isPublic(env) ? 'public, max-age=300' : 'private, no-store');

async function weekRoute({ env, url }: Ctx): Promise<Result> {
  const week = await resolveWeek(env, url.searchParams.get('week'));
  const rows = await weekRows(env, week);
  if (!rows.length) throw new HttpError(404, `No scores for the week of ${week}`);
  return { body: weekPayload(week, rows), cache: readCache(env) };
}

async function feedRoute({ env, url }: Ctx): Promise<Result> {
  const week = await resolveWeek(env, url.searchParams.get('week'));
  const rows = await weekRows(env, week);
  if (!rows.length) throw new HttpError(404, `No scores for the week of ${week}`);
  return { body: feedPayload(week, rows), cache: readCache(env) };
}

async function gameRoute({ env, now }: Ctx, id: number): Promise<Result> {
  const db = env.DB;
  const since7 = addDays(isoDate(now), -7);
  const [weeks, hot, game, plays] = await Promise.all([
    db.prepare(
      `SELECT week, rank, prev_rank, score, attention, interest, play, bgg_hot_rank, days_on_list, name
       FROM weekly_scores WHERE game_id = ? ORDER BY week DESC LIMIT 52`,
    ).bind(id).all<WeeklyRow>(),
    db.prepare('SELECT date, rank FROM hot_snapshots WHERE game_id = ? AND date >= ? ORDER BY date')
      .bind(id, addDays(isoDate(now), -90)).all<{ date: string; rank: number }>(),
    db.prepare('SELECT name, year FROM games WHERE game_id = ?').bind(id).first<{ name: string | null; year: number | null }>(),
    db.prepare(
      `SELECT COALESCE(SUM(value), 0) AS total, COALESCE(SUM(CASE WHEN at >= ? THEN value ELSE 0 END), 0) AS last7
       FROM events WHERE type = 'play'
       AND (game_id = ? OR (game_id IS NULL AND game_slug IN (SELECT slug FROM games WHERE game_id = ? AND slug IS NOT NULL)))`,
    ).bind(since7, id, id).first<{ total: number; last7: number }>(),
  ]);
  const history = (weeks.results || []).reverse();
  if (!history.length && !(hot.results || []).length && !game) throw new HttpError(404, 'The Ludometer has no record of that game');
  return {
    body: {
      game_id: id,
      name: game?.name || history[history.length - 1]?.name || null,
      year: game?.year ?? null,
      weeks: history.map(w => ({
        week: w.week, rank: w.rank, movement: w.prev_rank == null ? null : w.prev_rank - w.rank,
        score: pct(w.score), attention: pct(w.attention), interest: pct(w.interest), play: pct(w.play),
        bgg_hot_rank: w.bgg_hot_rank, days_on_list: w.days_on_list,
      })),
      daysOnList: history.map(w => ({ week: w.week, days: w.days_on_list })),
      hotRankDaily: hot.results || [],
      plays: { total: Number(plays?.total || 0), last7Days: Number(plays?.last7 || 0) },
      attribution: ATTRIBUTION,
    },
    cache: readCache(env),
  };
}

async function eventsRoute({ req, env, now }: Ctx): Promise<Result> {
  requireToken(req, env.EVENTS_TOKEN, 'Posting events');
  let events;
  try {
    events = cleanEvents(parseJson(await readText(req)), now);
  } catch (e) {
    if (e instanceof EventError) throw new HttpError(400, e.index >= 0 ? `Event ${e.index}: ${e.message}` : e.message);
    throw e;
  }
  const db = env.DB;
  const stmts = events.flatMap(e => {
    const s = [db.prepare('INSERT INTO events (at, type, game_id, game_slug, value, source, meta) VALUES (?, ?, ?, ?, ?, ?, ?)')
      .bind(e.at, e.type, e.game_id, e.game_slug, e.value, e.source, e.meta)];
    // An event with both an id and a slug teaches the slug map, so slug-only events (Kit tags) can be counted.
    if (e.game_id != null && e.game_slug != null) {
      s.push(db.prepare('INSERT OR IGNORE INTO games (game_id, updated_at) VALUES (?, ?)').bind(e.game_id, now.toISOString()));
      s.push(db.prepare('UPDATE OR IGNORE games SET slug = ? WHERE game_id = ? AND (slug IS NULL OR slug != ?)').bind(e.game_slug, e.game_id, e.game_slug));
    }
    return s;
  });
  await db.batch(stmts);
  return { body: { ok: true, recorded: events.length }, status: 201 };
}

async function kitRoute({ req, env, url, now }: Ctx): Promise<Result> {
  const key = url.searchParams.get('key') || '';
  if (!env.KIT_WEBHOOK_KEY || !safeEqual(key, env.KIT_WEBHOOK_KEY)) throw new HttpError(403, 'Unknown webhook key');
  const raw = await readText(req);
  if (env.KIT_WEBHOOK_SECRET) {
    const ok = await verifyKitSignature(req.headers.get('X-Kit-Signature'), raw, env.KIT_WEBHOOK_SECRET, Math.floor(now.getTime() / 1000));
    if (!ok) throw new HttpError(401, 'Signature did not match');
  }
  const { hits, ignored } = parseKitDelivery(parseJson(raw), url.searchParams.get('tag'));
  const db = env.DB;
  let recorded = 0;
  let duplicates = 0;
  for (const h of hits) {
    if (h.kitEventId) {
      const seen = await db.prepare(`SELECT 1 AS x FROM events WHERE source = 'kit' AND json_extract(meta, '$.kit_event_id') = ? LIMIT 1`)
        .bind(h.kitEventId).first();
      if (seen) { duplicates++; continue; }
    }
    const meta = JSON.stringify({ tag: h.tag, kit_event_id: h.kitEventId, kit_subscriber_id: h.kitSubscriberId });
    await db.prepare(
      `INSERT INTO events (at, type, game_id, game_slug, value, source, meta)
       VALUES (?, ?, (SELECT game_id FROM games WHERE slug = ?), ?, 1, 'kit', ?)`,
    ).bind(h.at || now.toISOString(), h.type, h.slug, h.slug, meta).run();
    recorded++;
  }
  // Always 200 for a valid key, so Kit does not retry deliveries we chose to ignore.
  return { body: { ok: true, recorded, duplicates, ignored } };
}

async function watchlistRoute({ req, env, url, now }: Ctx): Promise<Result> {
  const db = env.DB;
  if (req.method === 'GET') {
    const status = url.searchParams.get('status');
    const kind = url.searchParams.get('kind');
    const where: string[] = [];
    const args: unknown[] = [];
    if (status) { where.push('status = ?'); args.push(status); }
    if (kind) { where.push('kind = ?'); args.push(kind); }
    const { results } = await db.prepare(
      `SELECT * FROM watchlist ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY updated_at DESC, id DESC LIMIT 500`,
    ).bind(...args).all<WatchRow>();
    return { body: { items: results || [] } };
  }
  const body = parseJson(await readText(req)) as Record<string, unknown>;
  if (req.method === 'POST') {
    const w = cleanWatch(body, true);
    const row = await db.prepare(
      `INSERT INTO watchlist (name, kind, bgg_id, release_window, status, signals, notes, trigger, verdict, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING *`,
    ).bind(w.name, w.kind, w.bgg_id ?? null, w.release_window ?? null, w.status ?? null, w.signals ?? null,
      w.notes ?? null, w.trigger ?? null, w.verdict ?? null, now.toISOString()).first<WatchRow>();
    return { body: { item: row }, status: 201 };
  }
  if (req.method === 'PATCH') {
    const id = Number(body?.id ?? url.searchParams.get('id'));
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Give the id of the row to change');
    const { id: _drop, ...rest } = body || {};
    const w: WatchInput = cleanWatch(rest, false);
    const keys = Object.keys(w) as (keyof WatchInput)[];
    if (!keys.length) throw new HttpError(400, 'Nothing to change');
    const row = await db.prepare(
      `UPDATE watchlist SET ${keys.map(k => `${k} = ?`).join(', ')}, updated_at = ? WHERE id = ? RETURNING *`,
    ).bind(...keys.map(k => w[k] ?? null), now.toISOString(), id).first<WatchRow>();
    if (!row) throw new HttpError(404, 'No watchlist row with that id');
    return { body: { item: row } };
  }
  throw new HttpError(405, 'Use GET, POST or PATCH');
}

async function settingsRoute({ req, env }: Ctx): Promise<Result> {
  if (req.method === 'PUT') {
    const rows = settingsUpdate(parseJson(await readText(req)));
    await env.DB.batch(rows.map(([k, v]) => env.DB.prepare('INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)').bind(k, v)));
  } else if (req.method !== 'GET') {
    throw new HttpError(405, 'Use GET or PUT');
  }
  return { body: { settings: await readSettings(env.DB) } };
}

async function runRoute({ req, env, url, now }: Ctx): Promise<Result> {
  if (req.method !== 'POST') throw new HttpError(405, 'Use POST');
  const job = url.searchParams.get('job');
  if (job === 'snapshot') return { body: { job, result: await runSnapshot(env, now) } };
  if (job === 'score') {
    const raw = url.searchParams.get('week');
    const week = raw ? parseWeek(raw) : weekToScore(now);
    if (!week) throw new HttpError(400, 'week must be a date like 2026-10-19');
    return { body: { job, result: await runScore(env, week) } };
  }
  throw new HttpError(400, 'job must be snapshot or score');
}

async function broadcastRoute({ env, url }: Ctx): Promise<Result> {
  const week = await resolveWeek(env, url.searchParams.get('week'));
  const rows = await weekRows(env, week);
  // Notes for this reading: rows with a trigger and verdict, touched from the week's Monday through the Tuesday it is published.
  const { results } = await env.DB.prepare(
    `SELECT * FROM watchlist WHERE trigger IS NOT NULL AND trigger != '' AND verdict IS NOT NULL AND verdict != ''
     AND updated_at >= ? AND updated_at < ? ORDER BY updated_at`,
  ).bind(week, addDays(week, 9)).all<WatchRow>();
  return { body: buildBroadcast(week, rows, results || [], isPublic(env)) };
}

async function route(ctx: Ctx): Promise<Result | Response> {
  const { req, env, url } = ctx;
  const path = url.pathname.replace(/\/+$/, '') || '/';
  const m = req.method;

  if (path === '/admin') {
    if (m !== 'GET') throw new HttpError(405, 'Use GET');
    return new Response(ADMIN_HTML, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; style-src 'unsafe-inline'; script-src 'unsafe-inline'; connect-src 'self'; frame-ancestors 'none'",
        'X-Robots-Tag': 'noindex',
      },
    });
  }
  if (!path.startsWith(PREFIX)) throw new HttpError(404, 'Not found');
  const sub = path.slice(PREFIX.length) || '/';

  if (sub === '/health' && m === 'GET') return { body: { ok: true, public: isPublic(env), attribution: ATTRIBUTION } };

  if (sub === '/week' || sub === '/feed' || sub.startsWith('/game/')) {
    if (m !== 'GET') throw new HttpError(405, 'Use GET');
    gatePublic(req, env);
    if (sub === '/week') return weekRoute(ctx);
    if (sub === '/feed') return feedRoute(ctx);
    const id = Number(sub.slice('/game/'.length));
    if (!Number.isInteger(id) || id <= 0) throw new HttpError(400, 'Game id must be a BGG id');
    return gameRoute(ctx, id);
  }

  if (sub === '/events') {
    if (m !== 'POST') throw new HttpError(405, 'Use POST');
    return eventsRoute(ctx);
  }
  if (sub === '/kit-webhook') {
    if (m !== 'POST') throw new HttpError(405, 'Use POST');
    return kitRoute(ctx);
  }

  if (sub.startsWith('/admin/')) {
    requireToken(req, env.ADMIN_TOKEN, 'The admin API');
    switch (sub) {
      case '/admin/watchlist': return watchlistRoute(ctx);
      case '/admin/settings': return settingsRoute(ctx);
      case '/admin/run': return runRoute(ctx);
      case '/admin/broadcast':
        if (m !== 'GET') throw new HttpError(405, 'Use GET');
        return broadcastRoute(ctx);
    }
  }
  throw new HttpError(404, 'Not found');
}

export async function handleFetch(req: Request, env: Env, now = new Date()): Promise<Response> {
  const cors = corsHeaders(req, env);
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
  const url = new URL(req.url);
  try {
    const out = await route({ req, env, url, now });
    if (out instanceof Response) return out;
    return json(out.body, out.status ?? 200, cors, out.cache);
  } catch (e) {
    if (e instanceof HttpError) return json({ error: e.message }, e.status, cors);
    console.error(e);
    return json({ error: 'Something went wrong on our side' }, 500, cors);
  }
}

export async function handleScheduled(cron: string, env: Env, now: Date): Promise<void> {
  if (cron === CRON_SNAPSHOT) {
    const s = await runSnapshot(env, now);
    console.log(`Ludometer snapshot ${s.date}: ${s.hot} hot, ${s.statsStored}/${s.statsRequested} stats, ${s.failedBatches.length} failed batches`);
  } else if (cron === CRON_SCORE) {
    const s = await runScore(env, weekToScore(now));
    console.log(`Ludometer score ${s.week}: ${s.rows} rows from ${s.candidates} candidates, ${s.weightSet}`);
  } else {
    console.warn(`Ludometer: no job for cron "${cron}"`);
  }
}
