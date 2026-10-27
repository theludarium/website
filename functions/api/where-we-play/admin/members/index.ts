// GET /api/where-we-play/admin/members: every member, addresses included.
// Only the admin page calls this, behind the Access check in _middleware.ts.
import { WWP_GROUP } from '../../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { listMembers, parseAvailability } from '../../../../../src/server/where-we-play/db.ts';
import { json } from '../../../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ env }: Context): Promise<Response> {
  const members = await listMembers(env.DB!, WWP_GROUP);
  return json({
    members: members.map(({ edit_token_hash: _hash, availability, ...m }) => ({ ...m, availability: parseAvailability(availability) })),
  });
}
