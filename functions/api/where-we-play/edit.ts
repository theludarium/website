// GET  /api/where-we-play/edit?t=<token>: the member's own entry, for prefilling the edit form.
// POST /api/where-we-play/edit: save changes from the edit form (token in the t field).
import { WWP_BASE } from '../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../src/server/where-we-play/env.ts';
import { getMemberByTokenHash, parseAvailability, type MemberRow } from '../../../src/server/where-we-play/db.ts';
import { fail, field, json, redirect } from '../../../src/server/where-we-play/http.ts';
import { routeMemberLater, saveMember } from '../../../src/server/where-we-play/members.ts';
import { hashToken, TOKEN_PATTERN } from '../../../src/server/where-we-play/tokens.ts';
import { parseMemberForm } from '../../../src/server/where-we-play/validate.ts';

export async function memberForToken(env: Context['env'], token: string | null): Promise<MemberRow | null> {
  if (!env.DB || !token || !TOKEN_PATTERN.test(token)) return null;
  return getMemberByTokenHash(env.DB, await hashToken(token));
}

export async function onRequestGet({ request, env }: Context): Promise<Response> {
  const token = new URL(request.url).searchParams.get('t');
  const member = await memberForToken(env, token);
  if (!member) return fail(404, 'This link is not valid.');
  return json({
    email: member.email,
    discord_handle: member.discord_handle,
    first_name: member.first_name,
    zip: member.zip,
    street_address: member.street_address,
    cross_street: member.cross_street,
    availability: parseAvailability(member.availability),
    geocode_source: member.geocode_source,
    updated_at: member.updated_at,
  });
}

const back = (request: Request, token: string, error: string) => redirect(request, `${WWP_BASE}/edit/?t=${token}&error=${error}`);

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return redirect(request, `${WWP_BASE}/edit/`);
  }
  const token = field(form, 't');
  const member = await memberForToken(env, token);
  if (!member) return redirect(request, `${WWP_BASE}/edit/`);

  const parsed = parseMemberForm(form);
  if ('error' in parsed) return back(request, token, parsed.error);
  // The email on the link wins; the field is shown read-only and ignored here.
  parsed.email = member.email;

  try {
    const saved = await saveMember(env, parsed, member);
    if (saved.relocated) waitUntil(routeMemberLater(env, saved.member));
    return redirect(request, `${WWP_BASE}/edit/?t=${token}&saved=1`);
  } catch (err) {
    console.error('Where We Play edit failed', err);
    return back(request, token, 'unavailable');
  }
}
