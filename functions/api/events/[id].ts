// GET  /api/events/:id  one public event: details, who is going, the suggested Cubes, and the count.
// POST /api/events/:id  one action on it: attend, leave, suggest, withdraw, bring, or vote.
//
// No accounts. The browser makes a private token, keeps it, and sends it in the
// X-Attendee-Token header, so a retried "attend" finds its own sign-up. It only counts for this event.
// A sample event answers only with ?samples=1. Preview addresses can read but not write.
// Every success answers the fresh event, so the page always redraws from the truth.
// Problems answer { error: <code> } with the codes in ACTION_MESSAGES.
import { act, eventPayload } from '../../../src/server/calendar/actions.ts';
import type { CalContext } from '../../../src/server/calendar/env.ts';
import { attendeeToken, attendeeTokenHash, isPreviewHost, readObject } from '../../../src/server/calendar/guard.ts';
import { clientIp, fail, json } from '../../../src/server/where-we-play/http.ts';
import { parseId } from '../../../src/server/where-we-play/validate.ts';

type Ctx = CalContext<{ id: string }>;

/** Logs why, and tells the page only that events are not working. */
function unavailable(...why: unknown[]): Response {
  console.error(...why);
  return fail(503, 'unavailable');
}

export async function onRequestGet({ request, env, params }: Ctx): Promise<Response> {
  const now = new Date();
  if (!env.DB) return unavailable('The events calendar needs the DB binding');
  const id = parseId(params.id);
  if (!id) return fail(404, 'gone');
  try {
    const samples = new URL(request.url).searchParams.get('samples') === '1';
    const payload = await eventPayload(env.DB, id, await attendeeTokenHash(request), now, samples);
    return payload ? json(payload) : fail(404, 'gone');
  } catch (err) {
    return unavailable('Reading an event failed', err);
  }
}

export async function onRequestPost({ request, env, params }: Ctx): Promise<Response> {
  const now = new Date();
  if (!env.DB) return unavailable('The events calendar needs the DB binding');
  if (isPreviewHost(request)) return fail(503, 'unavailable');
  const id = parseId(params.id);
  if (!id) return fail(404, 'gone');
  try {
    const caller = {
      token: attendeeToken(request),
      tokenHash: await attendeeTokenHash(request),
      ip: clientIp(request),
      samples: new URL(request.url).searchParams.get('samples') === '1',
    };
    const result = await act(env.DB, env, id, await readObject(request), caller, now);
    return 'error' in result ? fail(result.status, result.error) : json(result.payload);
  } catch (err) {
    return unavailable('An event action failed', err);
  }
}
