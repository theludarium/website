// Finds what the calendar owes the Discord events channel and posts it. The rules
// and the words are in src/lib/calendar/discord.ts. A post is claimed in the
// database before it is sent and released if Discord refuses it, so each one goes
// out once even if two runs overlap.
import { announceMessage, cancelMessage, duePosts, isWebhookUrl, resultMessage, type DiscordEvent, type DiscordMessage, type PostKind } from '../../../src/lib/calendar/discord.ts';
import { CAL_COMMUNITY } from '../../../src/lib/calendar/shared.ts';
import { listBallots, listSuggestions } from '../../../src/server/calendar/db.ts';
import { shownTally } from '../../../src/server/calendar/view.ts';
import type { D1 } from '../../../src/server/where-we-play/env.ts';

export interface Env {
  DB: D1;
  DISCORD_EVENTS_WEBHOOK?: string;
  SITE_URL?: string;
}

const COLUMN: Record<PostKind, string> = { announce: 'announced_at', result: 'result_posted_at', cancel: 'cancel_posted_at' };
/** Discord allows about five webhook posts every two seconds. */
const GAP_MS = 600;
const WEEK_MS = 7 * 86_400_000;

/** Upcoming real events within a week (cancelled ones too, for their notice). */
async function upcoming(db: D1, now: Date): Promise<(DiscordEvent & { closed_tally: string | null })[]> {
  const { results } = await db
    .prepare(
      `SELECT e.id, e.title, e.kind, e.date, e.start_time, e.end_time, e.starts_at, e.description, e.location_name, e.location_address,
              e.cube_mode, e.cube_id, c.name AS cube_name, e.vote_close_hours, e.status, e.announce, e.announced_at, e.result_posted_at,
              e.cancel_posted_at, e.closed_tally
       FROM cal_events e LEFT JOIN cubes c ON c.id = e.cube_id AND c.status = 'approved'
       WHERE e.community = ?1 AND e.is_sample = 0 AND e.status IN ('approved', 'cancelled') AND e.starts_at > ?2 AND e.starts_at <= ?3
       ORDER BY e.starts_at, e.id`,
    )
    .bind(CAL_COMMUNITY, now.toISOString(), new Date(now.getTime() + WEEK_MS + 3_600_000).toISOString())
    .all<DiscordEvent & { closed_tally: string | null }>();
  return results;
}

/** Marks a post as sent. False when another run already did. */
async function claim(db: D1, id: number, kind: PostKind, now: Date): Promise<boolean> {
  return Boolean(await db.prepare(`UPDATE cal_events SET ${COLUMN[kind]} = ?2 WHERE id = ?1 AND ${COLUMN[kind]} IS NULL RETURNING id`).bind(id, now.toISOString()).first());
}

async function release(db: D1, id: number, kind: PostKind): Promise<void> {
  await db.prepare(`UPDATE cal_events SET ${COLUMN[kind]} = NULL WHERE id = ?1`).bind(id).run();
}

export type Report = { posted: string[]; failed: string[]; skipped?: string };

export async function postDue(env: Env, now: Date, send: typeof fetch = fetch, wait = (ms: number) => new Promise((r) => setTimeout(r, ms))): Promise<Report> {
  const report: Report = { posted: [], failed: [] };
  if (!isWebhookUrl(env.DISCORD_EVENTS_WEBHOOK)) return { ...report, skipped: 'DISCORD_EVENTS_WEBHOOK is not set to a Discord webhook address' };
  const site = env.SITE_URL ?? 'https://theludarium.com';
  const events = await upcoming(env.DB, now);
  for (const { kind, event } of duePosts(events, now)) {
    let message: DiscordMessage;
    if (kind === 'announce') message = announceMessage(event, site);
    else if (kind === 'cancel') message = cancelMessage(event, site);
    else {
      const [suggestions, ballots] = await Promise.all([listSuggestions(env.DB, event.id), listBallots(env.DB, event.id)]);
      const tally = shownTally(event, suggestions, ballots);
      const winner = tally.winner === null ? null : (suggestions.find((s) => s.cube_id === tally.winner)?.c_name ?? null);
      message = resultMessage(event, site, tally, winner);
    }
    if (!(await claim(env.DB, event.id, kind, now))) continue;
    const label = `${kind} ${event.id}`;
    try {
      const res = await send(`${env.DISCORD_EVENTS_WEBHOOK}?wait=true`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(message) });
      if (!res.ok) throw new Error(`Discord answered ${res.status}`);
      report.posted.push(label);
    } catch (err) {
      await release(env.DB, event.id, kind);
      report.failed.push(`${label}: ${err instanceof Error ? err.message : String(err)}`);
    }
    await wait(GAP_MS);
  }
  return report;
}
