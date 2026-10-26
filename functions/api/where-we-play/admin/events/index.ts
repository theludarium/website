// GET  /api/where-we-play/admin/events: meetups, newest first.
// POST /api/where-we-play/admin/events: record one.
import { WWP_GROUP } from '../../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { insertEvent, listEvents } from '../../../../../src/server/where-we-play/db.ts';
import { fail, json, readJson } from '../../../../../src/server/where-we-play/http.ts';
import { parseEventBody } from '../../../../../src/server/where-we-play/validate.ts';

export async function onRequestGet({ env }: Context): Promise<Response> {
  return json({ events: await listEvents(env.DB!, WWP_GROUP) });
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const body = await readJson(request);
  if (!body) return fail(400, 'Expected a JSON body.');
  const parsed = parseEventBody(body);
  if ('error' in parsed) return fail(400, parsed.error);
  const id = await insertEvent(env.DB!, WWP_GROUP, parsed);
  return json({ id }, 201);
}
