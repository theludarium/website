// POST /api/where-we-play/delete: a member removes their own entry (token in the t field).
import { WWP_BASE } from '../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../src/server/where-we-play/env.ts';
import { deleteMember } from '../../../src/server/where-we-play/db.ts';
import { field, redirect } from '../../../src/server/where-we-play/http.ts';
import { memberForToken } from './edit.ts';

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect(request, `${WWP_BASE}/edit/`);
  }
  const member = await memberForToken(env, field(form, 't'));
  if (!member) return redirect(request, `${WWP_BASE}/edit/`);
  await deleteMember(env.DB!, member.id);
  return redirect(request, `${WWP_BASE}/edit/?deleted=1`);
}
