// POST /api/cubes/request: a Cube owner asks for a change to their listing, or its removal.
// This only emails Levi. Nothing on the list changes until Levi acts in the approval queue,
// because anyone can fill out this form. Nothing is stored, and no email goes to the sender.
import { notify, type NotifyBinding } from '../../../src/server/notify.ts';
import type { D1, WwpEnv } from '../../../src/server/where-we-play/env.ts';
import { clientIp, field, redirect, verifyTurnstile } from '../../../src/server/where-we-play/http.ts';
import { CUBES_ADMIN, parseOwnerRequest, type OwnerRequest } from '../../../src/lib/cube-library.ts';

interface Env extends WwpEnv {
  DB?: D1;
  NOTIFY?: NotifyBinding;
}
interface Context {
  request: Request;
  env: Env;
}
type Listed = { name: string; listUrl: string; owner: string; location: string };

const FORM = '/cube-commonwealth/cubes/request/';

export function requestEmail(r: OwnerRequest, cube: Listed, adminUrl: string): string {
  return [
    r.kind === 'remove' ? 'Someone asked to remove a Cube from the library.' : 'Someone asked to change a Cube in the library.',
    'Nothing has changed yet. Check that this is the owner before you act.',
    '',
    `Cube:           ${cube.name} (#${r.cubeId})`,
    `List:           ${cube.listUrl}`,
    `Owner listed:   ${cube.owner}`,
    `Location:       ${cube.location}`,
    '',
    `From:           ${r.name}`,
    `Email:          ${r.email}`,
    `Details:        ${r.details ?? '(none)'}`,
    '',
    r.kind === 'remove' ? 'To remove it, open Approved in the queue and choose Remove from library:' : 'To edit it, open Approved in the queue:',
    adminUrl,
    '',
    'Reply to this email to write to them directly.',
  ].join('\n');
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const back = (code: string) => redirect(request, `${FORM}?request_error=${code}#form`);
  const sent = () => redirect(request, `${FORM}?request=sent#form`);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back('missing');
  }
  if (field(form, 'website')) return sent();
  if (!env.DB || !env.TURNSTILE_SECRET_KEY) return back('unavailable');

  const token = field(form, 'cf-turnstile-response');
  if (!token || !(await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, clientIp(request) || null))) return back('verify');

  const parsed = parseOwnerRequest(form);
  if ('error' in parsed) return back(parsed.error);

  let cube: Listed | null;
  try {
    cube = await env.DB.prepare("SELECT name, list_url AS listUrl, owner, location FROM cubes WHERE id = ? AND status = 'approved'")
      .bind(parsed.cubeId)
      .first<Listed>();
  } catch (err) {
    console.error('Looking up a Cube failed', err);
    return back('unavailable');
  }
  if (!cube) return back('cube');

  // The email is the only record, so a failed send must tell the person to try again.
  const delivered = await notify(env.NOTIFY, {
    replyTo: parsed.email,
    subject: `Cube ${parsed.kind === 'remove' ? 'removal' : 'change'} request: ${cube.name.slice(0, 60)}`,
    text: requestEmail(parsed, cube, new URL(CUBES_ADMIN, request.url).toString()),
  });
  return delivered ? sent() : back('unavailable');
}
