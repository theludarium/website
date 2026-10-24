// The two scheduled jobs: the daily BGG snapshot and the Monday score.
import type { Env } from './env';
import { addDays, isoDate } from './dates';
import {
  BggFetchError, MAX_THING_IDS, bggErrorMessage, fetchBggXml, hotUrl, parseHot, parseThingStats, realSleep, thingUrl,
  type Sleep,
} from './bgg';
import { computeWeek, type EventTotal, type SnapshotRow, type StatRow } from './score';
import { readSettings } from './settings';

export interface JobDeps {
  fetchImpl?: typeof fetch;
  sleep?: Sleep;
  /** Pause between BGG thing calls. BGG asks for gentle use. */
  delayMs?: number;
  backoffMs?: number[];
}

/** Extra games to track stats for: ones with recent events but not on the Hotness list. */
const MAX_EXTRA_STAT_IDS = 100;

export interface SnapshotSummary {
  date: string;
  hot: number;
  statsRequested: number;
  statsStored: number;
  failedBatches: { ids: number[]; error: string }[];
}

/**
 * Daily: store today's BGG Hotness list, then stats for those games.
 * Safe to run twice in a day: today's rows are replaced, not duplicated.
 */
export async function runSnapshot(env: Env, now = new Date(), deps: JobDeps = {}): Promise<SnapshotSummary> {
  const date = isoDate(now);
  const stamp = now.toISOString();
  const sleep = deps.sleep || realSleep;
  const delay = deps.delayMs ?? 5000;
  const opts = { token: env.BGG_TOKEN, userAgent: env.USER_AGENT, fetchImpl: deps.fetchImpl, sleep, backoffMs: deps.backoffMs };

  const hotXml = await fetchBggXml(hotUrl(), opts);
  const hot = parseHot(hotXml);
  if (!hot.length) throw new Error(`BGG Hotness list was empty: ${bggErrorMessage(hotXml) || 'no items'}`);

  const db = env.DB;
  await db.batch([
    db.prepare('DELETE FROM hot_snapshots WHERE date = ?').bind(date),
    ...hot.map(h => db.prepare('INSERT INTO hot_snapshots (date, rank, game_id, name, year) VALUES (?, ?, ?, ?, ?)')
      .bind(date, h.rank, h.gameId, h.name, h.year)),
    ...hot.map(h => db.prepare(
      `INSERT INTO games (game_id, name, year, updated_at) VALUES (?, ?, ?, ?)
       ON CONFLICT(game_id) DO UPDATE SET name = excluded.name, year = excluded.year, updated_at = excluded.updated_at`,
    ).bind(h.gameId, h.name, h.year, stamp)),
  ]);

  const extra = await db.prepare(
    `SELECT DISTINCT COALESCE(e.game_id, g.game_id) AS game_id
     FROM events e LEFT JOIN games g ON e.game_id IS NULL AND g.slug = e.game_slug
     WHERE e.at >= ? AND COALESCE(e.game_id, g.game_id) IS NOT NULL
     LIMIT ?`,
  ).bind(addDays(date, -8), MAX_EXTRA_STAT_IDS).all<{ game_id: number }>();
  const ids = [...new Set([...hot.map(h => h.gameId), ...(extra.results || []).map(r => r.game_id)])];

  const summary: SnapshotSummary = { date, hot: hot.length, statsRequested: ids.length, statsStored: 0, failedBatches: [] };
  for (let i = 0; i < ids.length; i += MAX_THING_IDS) {
    const batch = ids.slice(i, i + MAX_THING_IDS);
    if (i > 0) await sleep(delay);
    try {
      const stats = parseThingStats(await fetchBggXml(thingUrl(batch), opts));
      if (!stats.length) throw new Error('BGG returned no items for this batch');
      await db.batch([
        ...stats.map(s => db.prepare(
          `INSERT OR REPLACE INTO game_stats (date, game_id, users_rated, average, bayes_average, owned, bgg_rank)
           VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ).bind(date, s.gameId, s.usersRated, s.average, s.bayesAverage, s.owned, s.bggRank)),
        ...stats.map(s => db.prepare(
          `INSERT INTO games (game_id, name, year, updated_at) VALUES (?, ?, ?, ?)
           ON CONFLICT(game_id) DO UPDATE SET name = excluded.name, year = excluded.year, updated_at = excluded.updated_at`,
        ).bind(s.gameId, s.name, s.year, stamp)),
      ]);
      summary.statsStored += stats.length;
    } catch (e) {
      // One bad batch never stops the rest.
      const msg = e instanceof BggFetchError || e instanceof Error ? e.message : String(e);
      console.error(`Ludometer snapshot: stats batch failed (${batch.join(',')}): ${msg}`);
      summary.failedBatches.push({ ids: batch, error: msg });
    }
  }
  return summary;
}

export interface ScoreSummary {
  week: string;
  rows: number;
  candidates: number;
  totalPlays: number;
  weightSet: string;
  unresolvedSlugs: string[];
}

/** Weekly: score the 7 days starting on `week` (a Monday) and store the top 50. Safe to rerun. */
export async function runScore(env: Env, week: string): Promise<ScoreSummary> {
  const db = env.DB;
  const end = addDays(week, 7);
  const [snaps, stats, events, plays, prev, days, names, unresolved, settings] = await Promise.all([
    db.prepare('SELECT date, rank, game_id, name FROM hot_snapshots WHERE date >= ? AND date < ?').bind(week, end).all<SnapshotRow>(),
    db.prepare('SELECT date, game_id, users_rated FROM game_stats WHERE date >= ? AND date < ?').bind(addDays(week, -1), end).all<StatRow>(),
    db.prepare(
      `SELECT COALESCE(e.game_id, g.game_id) AS game_id, e.type AS type, SUM(e.value) AS total
       FROM events e LEFT JOIN games g ON e.game_id IS NULL AND g.slug = e.game_slug
       WHERE e.at >= ? AND e.at < ? AND COALESCE(e.game_id, g.game_id) IS NOT NULL
       GROUP BY 1, 2`,
    ).bind(week, end).all<EventTotal>(),
    db.prepare(`SELECT COALESCE(SUM(value), 0) AS total FROM events WHERE type = 'play' AND at >= ? AND at < ?`).bind(week, end).first<{ total: number }>(),
    db.prepare('SELECT game_id, rank FROM weekly_scores WHERE week = ?').bind(addDays(week, -7)).all<{ game_id: number; rank: number }>(),
    db.prepare('SELECT game_id, COUNT(DISTINCT date) AS days FROM hot_snapshots WHERE date < ? GROUP BY game_id').bind(end).all<{ game_id: number; days: number }>(),
    db.prepare(
      `SELECT game_id, name FROM games WHERE name IS NOT NULL
       UNION ALL SELECT bgg_id AS game_id, name FROM watchlist WHERE bgg_id IS NOT NULL`,
    ).all<{ game_id: number; name: string }>(),
    db.prepare(
      `SELECT DISTINCT e.game_slug AS slug FROM events e LEFT JOIN games g ON g.slug = e.game_slug
       WHERE e.at >= ? AND e.at < ? AND e.game_id IS NULL AND g.game_id IS NULL`,
    ).bind(week, end).all<{ slug: string }>(),
    readSettings(db),
  ]);

  const nameMap: Record<number, string> = {};
  for (const n of names.results || []) if (!(n.game_id in nameMap)) nameMap[n.game_id] = n.name;

  const result = computeWeek({
    week,
    snapshots: snaps.results || [],
    stats: stats.results || [],
    events: events.results || [],
    totalPlays: Number(plays?.total || 0),
    prevRanks: Object.fromEntries((prev.results || []).map(r => [r.game_id, r.rank])),
    cumulativeDays: Object.fromEntries((days.results || []).map(r => [r.game_id, r.days])),
    names: nameMap,
    settings,
  });

  await db.batch([
    db.prepare('DELETE FROM weekly_scores WHERE week = ?').bind(week),
    ...result.rows.map(r => db.prepare(
      `INSERT INTO weekly_scores (week, game_id, name, rank, score, attention, interest, play, prev_rank, bgg_hot_rank, days_on_list)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    ).bind(r.week, r.game_id, r.name, r.rank, r.score, r.attention, r.interest, r.play, r.prev_rank, r.bgg_hot_rank, r.days_on_list)),
  ]);

  return {
    week,
    rows: result.rows.length,
    candidates: result.candidates,
    totalPlays: result.totalPlays,
    weightSet: result.weightSet,
    unresolvedSlugs: (unresolved.results || []).map(r => r.slug).filter(Boolean),
  };
}
