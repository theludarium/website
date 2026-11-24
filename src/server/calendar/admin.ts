// The admin's side of the calendar: every event of every status, creating
// (with weekly repeats), and editing. The routes under
// /api/where-we-play/admin/calendar call in here once the admin middleware has
// let the request through. Problems are full sentences for the admin page.
import { addDays, eventInstants } from '../../lib/calendar/dates.ts';
import { CAL_TZ, type AdminCreateResponse, type AdminEvent, type AdminEventDetail, type AdminEventInput } from '../../lib/calendar/shared.ts';
import { cleanRepeatWeeks, parseEventInput } from '../../lib/calendar/validate.ts';
import type { D1 } from '../where-we-play/env.ts';
import { getAdminEvent, insertEvents, isApprovedCube, listAdminEvents, listAttendees, listBallots, listSuggestions, updateEvent, type AdminEventRow, type EventFields } from './db.ts';
import { shownTally, toAdminEvent, toSuggestions } from './view.ts';

export type AdminProblem = { status: number; error: string };
const problem = (status: number, error: string): AdminProblem => ({ status, error });

export const NO_EVENT = 'No such event.';
const NOT_IN_LIBRARY = 'That Cube is not in the Cube Library.';

/** The UTC instants are stored beside the local date and times, and must always be in step with them. */
const withInstants = (input: AdminEventInput, tz: string): EventFields => ({ ...input, ...eventInstants(input.date, input.startTime, input.endTime, tz) });

/** Every event of every status, samples included, earliest first. */
export async function adminList(db: D1): Promise<AdminEvent[]> {
  return (await listAdminEvents(db)).map(toAdminEvent);
}

export async function adminDetail(db: D1, id: number): Promise<AdminEventDetail | null> {
  const event = await getAdminEvent(db, id);
  if (!event) return null;
  const [attendees, suggestions, ballots] = await Promise.all([listAttendees(db, id), listSuggestions(db, id), listBallots(db, id)]);
  return {
    event: toAdminEvent(event),
    attendees: attendees.map((a) => ({ id: a.id, name: a.name, createdAt: a.created_at })),
    suggestions: toSuggestions(suggestions, null),
    tally: shownTally(event, suggestions, ballots),
  };
}

/** Creates an event, and one more for each extra week it repeats, each 7 days after the last. */
export async function createEvents(db: D1, body: Record<string, unknown>, now: Date): Promise<AdminCreateResponse | AdminProblem> {
  const parsed = parseEventInput(body);
  if ('error' in parsed) return problem(400, parsed.error);
  // Without `partial`, parseEventInput fills in every field.
  const input = parsed.value as AdminEventInput;
  if (input.cubeId !== null && !(await isApprovedCube(db, input.cubeId))) return problem(400, NOT_IN_LIBRARY);

  // Each week gets its own instants, so a repeat that crosses a clock change keeps its local time.
  const events = Array.from({ length: cleanRepeatWeeks(body.repeatWeeks) + 1 }, (_, week) => ({
    ...withInstants({ ...input, date: addDays(input.date, 7 * week) }, CAL_TZ),
    tz: CAL_TZ,
  }));
  return { ids: await insertEvents(db, events, now) };
}

/** A stored event as the admin's form holds it. */
const inputOf = (row: AdminEventRow): AdminEventInput => ({
  title: row.title,
  kind: row.kind,
  date: row.date,
  startTime: row.start_time,
  endTime: row.end_time,
  description: row.description,
  locationName: row.location_name,
  locationAddress: row.location_address,
  cubeMode: row.cube_mode,
  cubeId: row.cube_id,
  voteCloseHours: row.vote_close_hours,
  status: row.status,
  announce: row.announce === 1,
});

/** Changes any subset of an event's fields. */
export async function patchEvent(db: D1, id: number, body: Record<string, unknown>, now: Date): Promise<{ id: number } | AdminProblem> {
  const parsed = parseEventInput(body, { partial: true });
  if ('error' in parsed) return problem(400, parsed.error);
  const stored = await getAdminEvent(db, id);
  if (!stored) return problem(404, NO_EVENT);

  // The change is checked again as a whole event, because a rule can span a field it carries and one it does not.
  const merged: AdminEventInput = { ...inputOf(stored), ...parsed.value };
  if (merged.cubeMode === 'none') merged.cubeId = null;
  if (merged.cubeMode === 'set' && merged.cubeId === null) return problem(400, 'Pick the Cube for this event, or let attendees vote.');
  if (merged.startTime === merged.endTime) return problem(400, 'The end time must be different from the start time.');
  // A newly chosen Cube must be in the library. One already on the event is left alone, so an
  // event whose Cube has since left the library can still be edited or cancelled.
  const cubeChanged = merged.cubeId !== stored.cube_id || merged.cubeMode !== stored.cube_mode;
  if (merged.cubeId !== null && cubeChanged && !(await isApprovedCube(db, merged.cubeId))) return problem(400, NOT_IN_LIBRARY);

  await updateEvent(db, id, withInstants(merged, stored.tz), now);
  return { id };
}
