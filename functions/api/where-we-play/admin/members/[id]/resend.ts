// POST /api/where-we-play/admin/members/:id/resend: email the member a fresh edit link.
import type { Context } from '../../../../../../src/server/where-we-play/env.ts';
import { getMemberById } from '../../../../../../src/server/where-we-play/db.ts';
import { fail, json } from '../../../../../../src/server/where-we-play/http.ts';
import { editUrl, reissueToken, sendConfirmation } from '../../../../../../src/server/where-we-play/members.ts';
import { parseId } from '../../../../../../src/server/where-we-play/validate.ts';

export async function onRequestPost({ request, env, params }: Context<{ id: string }>): Promise<Response> {
  const id = parseId(params.id);
  const member = id ? await getMemberById(env.DB!, id) : null;
  if (!member) return fail(404, 'No such member.');
  const token = await reissueToken(env, member);
  const sent = await sendConfirmation(env, { to: member.email, firstName: member.first_name, editUrl: editUrl(request, token), updated: true });
  return sent ? json({ sent: true }) : fail(502, 'The email could not be sent.');
}
