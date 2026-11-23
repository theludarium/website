// GET  /api/where-we-play/admin/calendar: every event of every status, samples included,
//      with the private details of who suggested each one.
// POST /api/where-we-play/admin/calendar: create an event, and one more per week when it repeats.
// Both sit under the admin middleware, so Cloudflare Access protects them and env.DB is there.
import type { AdminListResponse } from '../../../../../src/lib/calendar/shared.ts';
import { adminList, createEvents } from '../../../../../src/server/calendar/admin.ts';
import type { CalContext } from '../../../../../src/server/calendar/env.ts';
import { readObject } from '../../../../../src/server/calendar/guard.ts';
import { fail, json } from '../../../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ env }: CalContext): Promise<Response> {
  const body: AdminListResponse = { events: await adminList(env.DB!) };
  return json(body);
}

export async function onRequestPost({ request, env }: CalContext): Promise<Response> {
  const now = new Date();
  const body = await readObject(request);
  if (!body) return fail(400, 'Expected a JSON body.');
  const created = await createEvents(env.DB!, body, now);
  return 'error' in created ? fail(created.status, created.error) : json(created, 201);
}
