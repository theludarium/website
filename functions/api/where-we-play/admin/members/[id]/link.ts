// POST /api/where-we-play/admin/members/:id/link: a fresh private edit link
// for a member who lost theirs. The old link stops working. Nothing is sent:
// the admin copies the link and passes it on by hand.
import type { Context } from '../../../../../../src/server/where-we-play/env.ts';
import { getMemberById } from '../../../../../../src/server/where-we-play/db.ts';
import { fail, json } from '../../../../../../src/server/where-we-play/http.ts';
import { editUrl, reissueToken } from '../../../../../../src/server/where-we-play/members.ts';
import { parseId } from '../../../../../../src/server/where-we-play/validate.ts';

export async function onRequestPost({ request, env, params }: Context<{ id: string }>): Promise<Response> {
  const id = parseId(params.id);
  const member = id ? await getMemberById(env.DB!, id) : null;
  if (!member) return fail(404, 'No such member.');
  const token = await reissueToken(env, member);
  return json({ url: editUrl(request, token) });
}
