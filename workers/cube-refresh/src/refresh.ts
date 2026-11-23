// Refreshes card counts and last-updated dates for approved Cubes. It never touches
// names, owners, or descriptions, so Levi's edits stay put. If Cube Cobra does not
// answer for a Cube, that Cube keeps its current values until the next day.
import { fetchCobra, type CobraDetails } from '../../../functions/api/cubes/index.ts';
import { cobraId } from '../../../src/lib/cube-library.ts';
import type { D1 } from '../../../src/server/where-we-play/env.ts';

export interface Env {
  DB: D1;
}
type Row = { id: number; listUrl: string; cardCount: number | null; updatedAt: string | null };

export const SLOTS = 4;

/** Which quarter of the Cubes this run covers: 00:00, 06:00, 12:00, or 18:00 UTC. */
export const slotFor = (ms: number) => Math.floor(new Date(ms).getUTCHours() / 6) % SLOTS;

export async function refreshCubes(env: Env, slot: number, details: (id: string) => Promise<CobraDetails | null> = fetchCobra) {
  const { results } = await env.DB.prepare(
    "SELECT id, list_url AS listUrl, card_count AS cardCount, list_updated_at AS updatedAt FROM cubes WHERE status = 'approved' AND id % ? = ?",
  )
    .bind(SLOTS, slot)
    .all<Row>();

  const summary = { checked: 0, changed: 0, failed: 0 };
  const updates = [];
  for (const row of results) {
    const id = cobraId(row.listUrl);
    if (!id) continue;
    summary.checked += 1;
    const fresh = await details(id);
    if (!fresh) {
      summary.failed += 1;
      continue;
    }
    const cardCount = fresh.cardCount ?? row.cardCount;
    const updatedAt = fresh.updatedAt ?? row.updatedAt;
    if (cardCount === row.cardCount && updatedAt === row.updatedAt) continue;
    summary.changed += 1;
    updates.push(env.DB.prepare('UPDATE cubes SET card_count = ?, list_updated_at = ? WHERE id = ?').bind(cardCount, updatedAt, row.id));
  }
  if (updates.length) await env.DB.batch(updates);
  return summary;
}
