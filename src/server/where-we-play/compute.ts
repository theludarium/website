// Keeping the drive-time cache complete. Only missing pairs are ever routed;
// a pair is deleted (and so recomputed) only when its member or venue moves.
import type { D1 } from './env.ts';
import { deleteEstimatedDriveTimes, listDriveTimes, listMembers, listVenues, upsertDriveTimes, type MemberRow, type VenueRow } from './db.ts';
import { routePairs } from './routing.ts';

type Located<T> = T & { lat: number; lng: number };
const located = <T extends { lat: number | null; lng: number | null }>(rows: T[]) =>
  rows.filter((r): r is Located<T> => r.lat !== null && r.lng !== null);

/**
 * Routes every member-to-venue pair that has no cached drive time, one OSRM
 * call per venue that needs any. With retryEstimates, straight-line estimates
 * are dropped first so OSRM gets another go at them.
 */
export async function fillDriveTimes(db: D1, group: string, options: { retryEstimates?: boolean; fetchImpl?: typeof fetch } = {}) {
  if (options.retryEstimates) await deleteEstimatedDriveTimes(db, group);

  const members = located(await listMembers(db, group));
  const venues = located(await listVenues(db, group));
  const existing = new Set((await listDriveTimes(db, group)).map((d) => `${d.member_id}:${d.venue_id}`));

  let routed = 0;
  let estimated = 0;
  for (const venue of venues) {
    const missing = members.filter((m) => !existing.has(`${m.id}:${venue.id}`));
    if (!missing.length) continue;
    const pairs = await routePairs(missing, [venue], options.fetchImpl);
    await upsertDriveTimes(
      db,
      pairs.map((p) => ({ member_id: missing[p.sourceIndex].id, venue_id: venue.id, seconds: p.seconds, source: p.source })),
    );
    for (const p of pairs) p.source === 'osrm' ? routed++ : estimated++;
  }
  return { routed, estimated, members: members.length, venues: venues.length };
}

/** After a member joins or moves: route them against every located venue. */
export async function computeForMember(db: D1, member: MemberRow, fetchImpl?: typeof fetch) {
  if (member.lat === null || member.lng === null) return { routed: 0, estimated: 0 };
  const venues = located(await listVenues(db, member.group));
  if (!venues.length) return { routed: 0, estimated: 0 };
  const pairs = await routePairs([{ lat: member.lat, lng: member.lng }], venues, fetchImpl);
  await upsertDriveTimes(
    db,
    pairs.map((p) => ({ member_id: member.id, venue_id: venues[p.destIndex].id, seconds: p.seconds, source: p.source })),
  );
  return { routed: pairs.filter((p) => p.source === 'osrm').length, estimated: pairs.filter((p) => p.source !== 'osrm').length };
}

/** After a venue is approved or moves: route every located member to it. */
export async function computeForVenue(db: D1, venue: VenueRow, fetchImpl?: typeof fetch) {
  if (venue.lat === null || venue.lng === null) return { routed: 0, estimated: 0 };
  const members = located(await listMembers(db, venue.group));
  if (!members.length) return { routed: 0, estimated: 0 };
  const pairs = await routePairs(members, [{ lat: venue.lat, lng: venue.lng }], fetchImpl);
  await upsertDriveTimes(
    db,
    pairs.map((p) => ({ member_id: members[p.sourceIndex].id, venue_id: venue.id, seconds: p.seconds, source: p.source })),
  );
  return { routed: pairs.filter((p) => p.source === 'osrm').length, estimated: pairs.filter((p) => p.source !== 'osrm').length };
}
