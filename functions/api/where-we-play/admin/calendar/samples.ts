// DELETE /api/where-we-play/admin/calendar/samples: remove every sample event at once.
// Their sample attendees, suggestions, and ballots go with them. Real events are not touched.
import { deleteSampleEvents } from '../../../../../src/server/calendar/db.ts';
import type { CalContext } from '../../../../../src/server/calendar/env.ts';
import { json } from '../../../../../src/server/where-we-play/http.ts';

export async function onRequestDelete({ env }: CalContext): Promise<Response> {
  return json({ deleted: await deleteSampleEvents(env.DB!) });
}
