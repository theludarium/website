// GET /api/where-we-play/admin/summary: counts, the group center, and map data.
import { center } from '../../../../src/lib/where-we-play/engine.ts';
import { WWP_GROUP } from '../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../src/server/where-we-play/env.ts';
import { countDriveTimes, countMembers, listMembers, listVenues, parseAvailability } from '../../../../src/server/where-we-play/db.ts';
import { json } from '../../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ env }: Context): Promise<Response> {
  const db = env.DB!;
  const [members, venues, counts, drive] = await Promise.all([
    listMembers(db, WWP_GROUP),
    listVenues(db, WWP_GROUP),
    countMembers(db, WWP_GROUP),
    countDriveTimes(db, WWP_GROUP),
  ]);
  const points = members.filter((m) => m.lat !== null && m.lng !== null).map((m) => ({ lat: m.lat!, lng: m.lng! }));
  return json({
    members: counts,
    driveTimes: drive,
    center: center(points),
    // For the map: exact points for the admin view, snapped points for the public-view toggle.
    memberPoints: members
      .filter((m) => m.lat !== null && m.lng !== null)
      .map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        publicLat: m.public_lat,
        publicLng: m.public_lng,
        source: m.geocode_source,
        availability: parseAvailability(m.availability),
      })),
    venuePoints: venues
      .filter((v) => v.lat !== null && v.lng !== null)
      .map((v) => ({ id: v.id, name: v.name, lat: v.lat, lng: v.lng, status: v.status, approved: v.approved === 1 })),
  });
}
