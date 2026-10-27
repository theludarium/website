// POST /api/where-we-play/submit: the member location form.
//
// 1. Drops bots (honeypot, Turnstile) and rate limits by hashed IP.
// 2. Validates the fields, geocodes the location, stores the member.
// 3. Redirects to the thanks page with the private edit token in the URL
//    fragment, which browsers never send to a server. Nothing is emailed.
// 4. Drive times are routed afterwards in waitUntil.
//
// An email that already has an entry is turned away rather than replaced:
// the new link shows on screen, so replacing would let anyone who knows a
// member's email take over their entry and see their address.
//
// Settings: DB (D1 binding), TURNSTILE_SECRET_KEY, WWP_HASH_SALT (optional).
// See README.md, "Where We Play".
import { WWP_BASE } from '../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../src/server/where-we-play/env.ts';
import { allowSubmission } from '../../../src/server/where-we-play/db.ts';
import { clientIp, field, redirect, sha256Hex, verifyTurnstile } from '../../../src/server/where-we-play/http.ts';
import { findByEmail, routeMemberLater, saveMember } from '../../../src/server/where-we-play/members.ts';
import { parseMemberForm } from '../../../src/server/where-we-play/validate.ts';

const SUBMISSIONS_PER_HOUR = 8;
const TEST_SITE_KEY_SECRET = '1x0000000000000000000000000000000AA'; // Turnstile's always-pass secret

const back = (request: Request, error: string) => redirect(request, `${WWP_BASE}/?error=${error}#join`);

export async function onRequestPost({ request, env, waitUntil }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, 'missing');
  }

  // Honeypot: people never see this field; bots tend to fill it. Pretend it worked.
  if (field(form, 'website')) return redirect(request, `${WWP_BASE}/thanks/`);

  if (!env.DB) {
    console.error('Where We Play needs the DB binding');
    return back(request, 'unavailable');
  }

  const ip = clientIp(request);
  const secret = env.TURNSTILE_SECRET_KEY || TEST_SITE_KEY_SECRET;
  const token = field(form, 'cf-turnstile-response');
  if (env.TURNSTILE_SECRET_KEY && !(token && (await verifyTurnstile(token, secret, ip || null)))) return back(request, 'verify');

  const allowed = await allowSubmission(env.DB, await sha256Hex(`${env.WWP_HASH_SALT ?? 'wwp'}:${ip}`), SUBMISSIONS_PER_HOUR);
  if (!allowed) return back(request, 'slow');

  const parsed = parseMemberForm(form);
  if ('error' in parsed) return back(request, parsed.error);

  try {
    if (await findByEmail(env, parsed.email)) return back(request, 'exists');
    const saved = await saveMember(env, parsed, null);
    waitUntil(routeMemberLater(env, saved.member));
    const qs = saved.member.geocode_source === 'failed' ? '?geocode=failed' : '';
    return redirect(request, `${WWP_BASE}/thanks/${qs}#t=${saved.token}`);
  } catch (err) {
    console.error('Where We Play submission failed', err);
    return back(request, 'unavailable');
  }
}
