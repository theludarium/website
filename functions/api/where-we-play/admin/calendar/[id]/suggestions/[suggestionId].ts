// DELETE /api/where-we-play/admin/calendar/:id/suggestions/:suggestionId: take one suggested Cube off an event.
// Ballots that ranked it simply stop counting it.
import { clearFrozenTally, deleteSuggestion } from '../../../../../../../src/server/calendar/db.ts';
import type { CalContext } from '../../../../../../../src/server/calendar/env.ts';
import { fail, json } from '../../../../../../../src/server/where-we-play/http.ts';
import { parseId } from '../../../../../../../src/server/where-we-play/validate.ts';

export async function onRequestDelete({ env, params }: CalContext<{ id: string; suggestionId: string }>): Promise<Response> {
  const eventId = parseId(params.id);
  const suggestionId = parseId(params.suggestionId);
  if (!eventId || !suggestionId || !(await deleteSuggestion(env.DB!, eventId, suggestionId))) return fail(404, 'That Cube is not suggested for this event.');
  await clearFrozenTally(env.DB!, eventId); // The admin's change counts, so the result is worked out again.
  return json({ deleted: suggestionId });
}
