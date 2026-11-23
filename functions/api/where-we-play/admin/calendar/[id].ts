// GET    /api/where-we-play/admin/calendar/:id: one event with the people going, the suggested Cubes, and the count.
// PATCH  /api/where-we-play/admin/calendar/:id: change any of its fields. Approve, reject, cancel, and
//        restore are status changes; confirming a Cube sets cubeId, and reopening the vote clears it.
// DELETE /api/where-we-play/admin/calendar/:id: remove it, with its attendees, suggestions, and ballots.
import { NO_EVENT, adminDetail, patchEvent } from '../../../../../src/server/calendar/admin.ts';
import { deleteEvent } from '../../../../../src/server/calendar/db.ts';
import type { CalContext } from '../../../../../src/server/calendar/env.ts';
import { readObject } from '../../../../../src/server/calendar/guard.ts';
import { fail, json } from '../../../../../src/server/where-we-play/http.ts';
import { parseId } from '../../../../../src/server/where-we-play/validate.ts';

type Ctx = CalContext<{ id: string }>;

export async function onRequestGet({ env, params }: Ctx): Promise<Response> {
  const id = parseId(params.id);
  const detail = id ? await adminDetail(env.DB!, id) : null;
  return detail ? json(detail) : fail(404, NO_EVENT);
}

export async function onRequestPatch({ request, env, params }: Ctx): Promise<Response> {
  const now = new Date();
  const id = parseId(params.id);
  if (!id) return fail(404, NO_EVENT);
  const body = await readObject(request);
  if (!body) return fail(400, 'Expected a JSON body.');
  const result = await patchEvent(env.DB!, id, body, now);
  return 'error' in result ? fail(result.status, result.error) : json(result);
}

export async function onRequestDelete({ env, params }: Ctx): Promise<Response> {
  const id = parseId(params.id);
  if (!id || !(await deleteEvent(env.DB!, id))) return fail(404, NO_EVENT);
  return json({ deleted: id });
}
