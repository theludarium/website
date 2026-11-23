// GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD[&samples=1][&limit=N]
// The public calendar's list: approved and cancelled Cube Commonwealth events in
// a date range, earliest first. Sample events come only when the request asks
// for them. Pending and rejected events never appear here.
import type { EventListResponse } from '../../../src/lib/calendar/shared.ts';
import { listEvents, parseListQuery } from '../../../src/server/calendar/actions.ts';
import type { CalContext } from '../../../src/server/calendar/env.ts';
import { fail, json } from '../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ request, env }: CalContext): Promise<Response> {
  if (!env.DB) {
    console.error('The events calendar needs the DB binding');
    return fail(503, 'unavailable');
  }
  const query = parseListQuery(new URL(request.url).searchParams);
  if (!query) return fail(400, 'bad');
  try {
    const body: EventListResponse = { events: await listEvents(env.DB, query) };
    // A short cache keeps flipping between months cheap. A going count may lag by a few seconds.
    return json(body, 200, { 'Cache-Control': 'public, max-age=20' });
  } catch (err) {
    console.error('Listing events failed', err);
    return fail(503, 'unavailable');
  }
}
