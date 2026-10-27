// GET /api/where-we-play/admin/venues/:id/detail?slot=<key>: histogram and
// the member list by drive time for one venue.
import { availableIn, histogram, minutes, venueStats } from '../../../../../../src/lib/where-we-play/engine.ts';
import { NEAR_MINUTES, SLOT_KEYS, WWP_GROUP } from '../../../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../../../src/server/where-we-play/env.ts';
import { getVenue, listDriveTimes, listMembers, parseAvailability } from '../../../../../../src/server/where-we-play/db.ts';
import { fail, json } from '../../../../../../src/server/where-we-play/http.ts';
import { parseId } from '../../../../../../src/server/where-we-play/validate.ts';

export async function onRequestGet({ request, env, params }: Context<{ id: string }>): Promise<Response> {
  const id = parseId(params.id);
  const db = env.DB!;
  const venue = id ? await getVenue(db, id) : null;
  if (!venue) return fail(404, 'No such venue.');

  const slot = new URL(request.url).searchParams.get('slot');
  const members = await listMembers(db, WWP_GROUP);
  const withAvailability = members.map((m) => ({ ...m, slots: parseAvailability(m.availability) }));
  const filter = slot && (SLOT_KEYS as string[]).includes(slot) ? availableIn(withAvailability.map((m) => ({ id: m.id, availability: m.slots })), slot) : null;
  const byId = new Map(withAvailability.map((m) => [m.id, m]));

  const rows = (await listDriveTimes(db, WWP_GROUP)).filter((r) => r.venue_id === venue.id && (!filter || filter.has(r.member_id)));
  const seconds = rows.map((r) => r.seconds);
  const stats = venueStats(venue.id, seconds, NEAR_MINUTES);

  return json({
    venue,
    slot: filter ? slot : null,
    stats: {
      routed: stats.routed,
      medianMinutes: minutes(stats.medianSeconds),
      p75Minutes: minutes(stats.p75Seconds),
      underNear: stats.underNear,
      underNearPct: stats.underNearPct,
      estimated: rows.filter((r) => r.source === 'straight_line').length,
    },
    histogram: histogram(seconds, 5, 60),
    members: rows
      .map((r) => {
        const m = byId.get(r.member_id);
        return {
          id: r.member_id,
          label: m?.first_name || (m?.discord_handle ? `@${m.discord_handle}` : `Member ${r.member_id}`),
          zip: m?.zip ?? null,
          minutes: minutes(r.seconds),
          source: r.source,
          availability: m?.slots ?? [],
        };
      })
      .sort((a, b) => (a.minutes ?? 0) - (b.minutes ?? 0)),
  });
}
