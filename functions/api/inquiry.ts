// Corporate event inquiries: POST /api/inquiry
//
// A Cloudflare Pages Function. It runs on Cloudflare, not in the browser.
// 1. Drops obvious bots (hidden honeypot field) and checks Cloudflare Turnstile.
// 2. Validates the fields.
// 3. Emails the inquiry to Levi through the ludarium-notify Worker (Cloudflare
//    Email Routing), with reply-to set to the sender.
// 4. Redirects to /corporate-events/thanks/, or back to the form with an error code.
//
// Settings live in the Cloudflare Pages project (Settings > Bindings, Variables and Secrets):
//   NOTIFY                service  binding to the ludarium-notify Worker (workers/notify/)
//   TURNSTILE_SECRET_KEY  secret   Turnstile widget secret key
import { notify, type NotifyBinding } from '../../src/server/notify.ts';

export interface Env {
  NOTIFY?: NotifyBinding;
  TURNSTILE_SECRET_KEY?: string;
}

interface Context {
  request: Request;
  env: Env;
}

export const TEAM_SIZES = ['Under 10', '10 to 25', '26 to 50', '51 to 100', 'More than 100'];
export const TIMINGS = ['Within a month', '1 to 3 months', '3 to 6 months', 'Just exploring'];

const LIMITS = { name: 100, email: 200, company: 150, role: 100, goals: 3000 };
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type Inquiry = {
  name: string;
  email: string;
  company: string;
  role: string;
  teamSize: string;
  goals: string;
  timing: string;
};

const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ');

/** Returns the cleaned inquiry, or the name of the first problem. */
export function parseInquiry(form: FormData): Inquiry | { error: string } {
  const inquiry: Inquiry = {
    name: oneLine(field(form, 'name')),
    email: oneLine(field(form, 'email')),
    company: oneLine(field(form, 'company')),
    role: oneLine(field(form, 'role')),
    teamSize: field(form, 'team_size'),
    goals: field(form, 'goals'),
    timing: field(form, 'timing'),
  };

  if (!inquiry.name || !inquiry.email || !inquiry.company || !inquiry.role || !inquiry.goals) {
    return { error: 'missing' };
  }
  if (!EMAIL_PATTERN.test(inquiry.email)) return { error: 'email' };
  if (!TEAM_SIZES.includes(inquiry.teamSize) || !TIMINGS.includes(inquiry.timing)) return { error: 'missing' };
  if (
    inquiry.name.length > LIMITS.name ||
    inquiry.email.length > LIMITS.email ||
    inquiry.company.length > LIMITS.company ||
    inquiry.role.length > LIMITS.role ||
    inquiry.goals.length > LIMITS.goals
  ) {
    return { error: 'long' };
  }
  return inquiry;
}

export function emailText(inquiry: Inquiry): string {
  return [
    'New corporate event inquiry from theludarium.com',
    '',
    `Name:       ${inquiry.name}`,
    `Email:      ${inquiry.email}`,
    `Company:    ${inquiry.company}`,
    `Role:       ${inquiry.role}`,
    `Team size:  ${inquiry.teamSize}`,
    `Timing:     ${inquiry.timing}`,
    '',
    'Goals:',
    inquiry.goals,
    '',
    'Reply to this email to answer them directly.',
  ].join('\n');
}

async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
  if (!res.ok) return false;
  const data = (await res.json()) as { success?: boolean };
  return data.success === true;
}

const redirect = (request: Request, path: string) =>
  Response.redirect(new URL(path, request.url).toString(), 303);

const back = (request: Request, error: string) => redirect(request, `/corporate-events/?error=${error}#inquire`);

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, 'missing');
  }

  // Honeypot: people never see this field; bots tend to fill it. Pretend it worked.
  if (field(form, 'website')) return redirect(request, '/corporate-events/thanks/');

  if (!env.NOTIFY || !env.TURNSTILE_SECRET_KEY) {
    console.error('Inquiry form is missing the NOTIFY binding or TURNSTILE_SECRET_KEY');
    return back(request, 'unavailable');
  }

  const token = field(form, 'cf-turnstile-response');
  const human = token && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, request.headers.get('CF-Connecting-IP')));
  if (!human) return back(request, 'verify');

  const inquiry = parseInquiry(form);
  if ('error' in inquiry) return back(request, inquiry.error);

  const sent = await notify(env.NOTIFY, {
    replyTo: inquiry.email,
    subject: `Corporate event inquiry: ${inquiry.company} (${inquiry.teamSize})`,
    text: emailText(inquiry),
  });
  if (!sent) return back(request, 'unavailable');

  return redirect(request, '/corporate-events/thanks/');
}
