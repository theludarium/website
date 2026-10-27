// DELETE /api/where-we-play/admin/members/:id: remove a member and their drive times.
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { deleteMember, getMemberById } from '../../../../../src/server/where-we-play/db.ts';
import { fail, json } from '../../../../../src/server/where-we-play/http.ts';
import { parseId } from '../../../../../src/server/where-we-play/validate.ts';

export async function onRequestDelete({ env, params }: Context<{ id: string }>): Promise<Response> {
  const id = parseId(params.id);
  const member = id ? await getMemberById(env.DB!, id) : null;
  if (!member) return fail(404, 'No such member.');
  await deleteMember(env.DB!, member.id);
  return json({ deleted: member.id });
}
