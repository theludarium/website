// POST /api/where-we-play/submit: the member location form.
//
// 1. Drops bots (honeypot, Turnstile) and rate limits by hashed IP.
// 2. Validates the fields, geocodes the location, stores the member.
// 3. Emails the private edit link through Resend.
// 4. Redirects to the thanks page; drive times are routed afterwards in waitUntil.
//
// Settings: DB (D1 binding), RESEND_API_KEY, INQUIRY_FROM, TURNSTILE_SECRET_KEY,
// WWP_HASH_SALT (optional). See README.md, "Where We Play".
import { WWP_BASE } from '../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../src/server/where-we-play/env.ts';
import { allowSubmission } from '../../../src/server/where-we-play/db.ts';
import { clientIp, field, redirect, sha256Hex, verifyTurnstile } from '../../../src/server/where-we-play/http.ts';
import { editUrl, findByEmail, reissueToken, routeMemberLater, saveMember, sendConfirmation } from '../../../src/server/where-we-play/members.ts';
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
    const existing = await findByEmail(env, parsed.email);
    const saved = await saveMember(env, parsed, existing);
    // A returning member gets a fresh link; the old one stops working.
    const token = saved.token ?? (await reissueToken(env, saved.member));
    const sent = await sendConfirmation(env, {
      to: saved.member.email,
      firstName: saved.member.first_name,
      editUrl: editUrl(request, token),
      updated: !saved.created,
    });
    if (saved.relocated) waitUntil(routeMemberLater(env, saved.member));
    const query = new URLSearchParams();
    if (!saved.created) query.set('updated', '1');
    if (!sent) query.set('email', 'failed');
    if (saved.member.geocode_source === 'failed') query.set('geocode', 'failed');
    const qs = query.toString();
    return redirect(request, `${WWP_BASE}/thanks/${qs ? `?${qs}` : ''}`);
  } catch (err) {
    console.error('Where We Play submission failed', err);
    return back(request, 'unavailable');
  }
}
