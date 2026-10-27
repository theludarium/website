// PATCH  /api/where-we-play/admin/events/:id: change a meetup record.
// DELETE /api/where-we-play/admin/events/:id: remove it.
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { deleteEvent, updateEvent } from '../../../../../src/server/where-we-play/db.ts';
import { fail, json, readJson } from '../../../../../src/server/where-we-play/http.ts';
import { parseEventBody, parseId } from '../../../../../src/server/where-we-play/validate.ts';

export async function onRequestPatch({ request, env, params }: Context<{ id: string }>): Promise<Response> {
  const id = parseId(params.id);
  if (!id) return fail(404, 'No such event.');
  const body = await readJson(request);
  if (!body) return fail(400, 'Expected a JSON body.');
  const parsed = parseEventBody(body);
  if ('error' in parsed) return fail(400, parsed.error);
  await updateEvent(env.DB!, id, parsed);
  return json({ id });
}

export async function onRequestDelete({ env, params }: Context<{ id: string }>): Promise<Response> {
  const id = parseId(params.id);
  if (!id) return fail(404, 'No such event.');
  await deleteEvent(env.DB!, id);
  return json({ deleted: id });
}
