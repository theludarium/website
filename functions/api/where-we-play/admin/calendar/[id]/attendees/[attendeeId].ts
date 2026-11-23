// DELETE /api/where-we-play/admin/calendar/:id/attendees/:attendeeId: take one person off an event.
// Their ballot goes with them. Cubes they suggested stay on the event, unsigned.
import { clearFrozenTally, deleteAttendee } from '../../../../../../../src/server/calendar/db.ts';
import type { CalContext } from '../../../../../../../src/server/calendar/env.ts';
import { fail, json } from '../../../../../../../src/server/where-we-play/http.ts';
import { parseId } from '../../../../../../../src/server/where-we-play/validate.ts';

export async function onRequestDelete({ env, params }: CalContext<{ id: string; attendeeId: string }>): Promise<Response> {
  const eventId = parseId(params.id);
  const attendeeId = parseId(params.attendeeId);
  if (!eventId || !attendeeId || !(await deleteAttendee(env.DB!, eventId, attendeeId))) return fail(404, 'That person is not on this event.');
  await clearFrozenTally(env.DB!, eventId); // The admin's change counts, so the result is worked out again.
  return json({ deleted: attendeeId });
}
