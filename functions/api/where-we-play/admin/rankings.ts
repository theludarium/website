// GET /api/where-we-play/admin/rankings?slot=<key>: every venue not marked
// "not a fit", ranked by median drive time, over all members or those
// available in the slot.
import { availableIn, minutes, rankVenues } from '../../../../src/lib/where-we-play/engine.ts';
import { NEAR_MINUTES, SLOT_KEYS, WWP_GROUP } from '../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../src/server/where-we-play/env.ts';
import { listDriveTimes, listMembers, listVenues, parseAvailability, toPairs } from '../../../../src/server/where-we-play/db.ts';
import { json } from '../../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const db = env.DB!;
  const slot = new URL(request.url).searchParams.get('slot');
  const [venues, members, rows] = await Promise.all([listVenues(db, WWP_GROUP), listMembers(db, WWP_GROUP), listDriveTimes(db, WWP_GROUP)]);
  // Suggestions still in the queue belong to the venues section, not the rankings.
  const candidates = venues.filter((v) => v.status !== 'not a fit' && v.approved === 1);
  const filter =
    slot && (SLOT_KEYS as string[]).includes(slot)
      ? availableIn(
          members.map((m) => ({ id: m.id, availability: parseAvailability(m.availability) })),
          slot,
        )
      : undefined;
  const ranked = rankVenues(toPairs(rows), candidates.map((v) => v.id), filter, NEAR_MINUTES);
  const byId = new Map(candidates.map((v) => [v.id, v]));
  const estimated = new Set(rows.filter((r) => r.source === 'straight_line').map((r) => `${r.member_id}:${r.venue_id}`));

  return json({
    slot: filter ? slot : null,
    membersConsidered: filter ? filter.size : members.filter((m) => m.lat !== null).length,
    nearMinutes: NEAR_MINUTES,
    venues: ranked.map((r) => {
      const v = byId.get(r.venueId)!;
      return {
        id: v.id,
        name: v.name,
        status: v.status,
        approved: v.approved === 1,
        neighborhood: v.neighborhood,
        located: v.lat !== null,
        medianMinutes: minutes(r.medianSeconds),
        p75Minutes: minutes(r.p75Seconds),
        underNear: r.underNear,
        underNearPct: r.underNearPct,
        routed: r.routed,
        estimated: rows.filter((row) => row.venue_id === v.id && estimated.has(`${row.member_id}:${row.venue_id}`)).length,
      };
    }),
  });
}
