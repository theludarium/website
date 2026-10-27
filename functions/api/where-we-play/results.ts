// GET /api/where-we-play/results: the member-facing summary. Approved venues
// with a public status, ranked by median drive time, with nothing that could
// identify a member. Cached for five minutes at the edge and in browsers.
import { minutes, rankVenues } from '../../../src/lib/where-we-play/engine.ts';
import { MIN_MEMBERS_FOR_RESULTS, NEAR_MINUTES, PUBLIC_STATUSES, WWP_GROUP } from '../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../src/server/where-we-play/env.ts';
import { countMembers, listDriveTimes, listVenues, toPairs } from '../../../src/server/where-we-play/db.ts';
import { json } from '../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ env }: Context): Promise<Response> {
  const headers = { 'Cache-Control': 'public, max-age=300' };
  if (!env.DB) return json({ ready: false, members: 0, minimum: MIN_MEMBERS_FOR_RESULTS, venues: [] }, 200, headers);

  const counts = await countMembers(env.DB, WWP_GROUP);
  if (counts.located < MIN_MEMBERS_FOR_RESULTS) {
    return json({ ready: false, members: counts.located, minimum: MIN_MEMBERS_FOR_RESULTS, venues: [] }, 200, headers);
  }

  const venues = await listVenues(env.DB, WWP_GROUP, { approvedOnly: true, statuses: PUBLIC_STATUSES, located: true });
  const pairs = toPairs(await listDriveTimes(env.DB, WWP_GROUP));
  const ranked = rankVenues(pairs, venues.map((v) => v.id), undefined, NEAR_MINUTES);
  const byId = new Map(venues.map((v) => [v.id, v]));

  return json(
    {
      ready: true,
      members: counts.located,
      minimum: MIN_MEMBERS_FOR_RESULTS,
      nearMinutes: NEAR_MINUTES,
      venues: ranked
        .filter((r) => r.routed > 0)
        .map((r) => {
          const v = byId.get(r.venueId)!;
          return {
            name: v.name,
            neighborhood: v.neighborhood,
            address: v.address_public ? v.address : null,
            website: v.website,
            status: v.status,
            tableCount: v.table_count,
            hours: v.hours,
            medianMinutes: minutes(r.medianSeconds),
            routed: r.routed,
            underNearPct: r.underNearPct,
          };
        }),
    },
    200,
    headers,
  );
}
