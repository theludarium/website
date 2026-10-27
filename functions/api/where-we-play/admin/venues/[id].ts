// PATCH  /api/where-we-play/admin/venues/:id: edit fields, approve, or move a venue.
// DELETE /api/where-we-play/admin/venues/:id: discard it (drive times go with it).
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { computeForVenue } from '../../../../../src/server/where-we-play/compute.ts';
import { deleteDriveTimesForVenue, deleteVenue, getVenue, updateVenue } from '../../../../../src/server/where-we-play/db.ts';
import { geocodeVenue } from '../../../../../src/server/where-we-play/geocode.ts';
import { fail, json, readJson } from '../../../../../src/server/where-we-play/http.ts';
import { parseId, parseVenueBody } from '../../../../../src/server/where-we-play/validate.ts';

type Ctx = Context<{ id: string }>;

export async function onRequestPatch({ request, env, params, waitUntil }: Ctx): Promise<Response> {
  const id = parseId(params.id);
  const db = env.DB!;
  const venue = id ? await getVenue(db, id) : null;
  if (!venue) return fail(404, 'No such venue.');
  const body = await readJson(request);
  if (!body) return fail(400, 'Expected a JSON body.');
  const patch = parseVenueBody(body);
  if ('error' in patch) return fail(400, patch.error);

  // A new address, or an explicit regeocode, moves the venue and resets its drive times.
  // Member suggestions are not geocoded until they are approved, so approval looks them up too.
  const addressChanged = patch.address !== undefined && patch.address !== venue.address;
  const approving = patch.approved === true && venue.approved === 0;
  const regeocode = addressChanged || body.regeocode === true || (approving && venue.lat === null);
  if (regeocode && patch.lat === undefined) {
    const point = await geocodeVenue(db, patch.address ?? venue.address);
    patch.lat = point?.lat ?? null;
    patch.lng = point?.lng ?? null;
  }
  await updateVenue(db, venue.id, patch);
  const updated = (await getVenue(db, venue.id))!;

  const movedTo = (patch.lat !== undefined || patch.lng !== undefined) && (updated.lat !== venue.lat || updated.lng !== venue.lng);
  if (movedTo) await deleteDriveTimesForVenue(db, venue.id);
  if (movedTo || approving || regeocode) {
    waitUntil(computeForVenue(db, updated).catch((err) => console.error('Routing venue failed', err)));
  }
  return json({ venue: updated });
}

export async function onRequestDelete({ env, params }: Ctx): Promise<Response> {
  const id = parseId(params.id);
  const venue = id ? await getVenue(env.DB!, id) : null;
  if (!venue) return fail(404, 'No such venue.');
  await deleteVenue(env.DB!, venue.id);
  return json({ deleted: venue.id });
}
