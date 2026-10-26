// GET  /api/where-we-play/admin/venues: every venue, queue first.
// POST /api/where-we-play/admin/venues: add a venue (geocoded, routed afterwards).
import { WWP_GROUP } from '../../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { computeForVenue } from '../../../../../src/server/where-we-play/compute.ts';
import { getVenue, insertVenue, listVenues } from '../../../../../src/server/where-we-play/db.ts';
import { geocodeVenue, neighborhoodFromAddress } from '../../../../../src/server/where-we-play/geocode.ts';
import { fail, json, readJson } from '../../../../../src/server/where-we-play/http.ts';
import { parseVenueBody } from '../../../../../src/server/where-we-play/validate.ts';

export async function onRequestGet({ env }: Context): Promise<Response> {
  return json({ venues: await listVenues(env.DB!, WWP_GROUP) });
}

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  const body = await readJson(request);
  if (!body) return fail(400, 'Expected a JSON body.');
  const parsed = parseVenueBody(body);
  if ('error' in parsed) return fail(400, parsed.error);
  if (!parsed.name || !parsed.address) return fail(400, 'A venue needs a name and an address.');

  const db = env.DB!;
  const point = parsed.lat != null && parsed.lng != null ? { lat: parsed.lat, lng: parsed.lng } : await geocodeVenue(db, parsed.address);
  const id = await insertVenue(db, {
    group: WWP_GROUP,
    name: parsed.name,
    address: parsed.address,
    lat: point?.lat ?? null,
    lng: point?.lng ?? null,
    neighborhood: parsed.neighborhood ?? neighborhoodFromAddress(parsed.address),
    table_count: parsed.table_count ?? null,
    hours: parsed.hours ?? null,
    website: parsed.website ?? null,
    call_ahead: parsed.call_ahead ?? false,
    notes: parsed.notes ?? null,
    status: parsed.status ?? 'idea',
    address_public: parsed.address_public ?? false,
    suggested_by_member_id: null,
    suggestion_note: null,
    approved: true,
  });
  const venue = (await getVenue(db, id))!;
  waitUntil(computeForVenue(db, venue).catch((err) => console.error('Routing new venue failed', err)));
  return json({ venue, geocoded: Boolean(point) }, 201);
}
