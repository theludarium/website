// Shirt ideas: POST /api/shirt-idea
//
// A visitor suggests a tee or hoodie design from the form at /store/suggest-a-shirt/.
// 1. Drops obvious bots (hidden honeypot field) and checks Cloudflare Turnstile.
// 2. Validates the fields and limits each visitor to 5 ideas an hour.
// 3. Saves the idea to D1 (table shirt_ideas, migrations/0004_shirt_ideas.sql).
// 4. Emails it to Levi through the ludarium-notify Worker, reply-to the visitor when they gave an email.
// 5. Redirects back to the form with ?idea=sent, or ?idea_error=<code>.
//
// Settings (Cloudflare Pages project): DB (D1 ludarium-site), NOTIFY (service binding),
// TURNSTILE_SECRET_KEY (secret), optional WWP_HASH_SALT (reused to hash IPs for the rate limit).
// No automated email goes to the visitor. If their shirt gets made, Levi writes to them.
import { notify, type NotifyBinding } from '../../src/server/notify.ts';

interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  run(): Promise<unknown>;
}
interface D1Database {
  prepare(sql: string): D1Statement;
}

export interface Env {
  DB?: D1Database;
  NOTIFY?: NotifyBinding;
  TURNSTILE_SECRET_KEY?: string;
  WWP_HASH_SALT?: string;
}

interface Context {
  request: Request;
  env: Env;
}

export type ShirtIdea = {
  game: string;
  idea: string;
  meaning: string | null;
  creditName: string | null;
  email: string | null;
  notifyIfMade: boolean;
};

export const LIMITS = { game: 100, idea: 200, meaning: 600, creditName: 60, email: 200 };
const PER_HOUR = 5;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ');
const orNull = (value: string) => (value ? value : null);

/** Returns the cleaned idea, or the name of the first problem. */
export function parseIdea(form: FormData): ShirtIdea | { error: string } {
  const game = oneLine(field(form, 'game'));
  const idea = oneLine(field(form, 'idea'));
  const meaning = field(form, 'meaning');
  const creditName = oneLine(field(form, 'credit_name'));
  const email = oneLine(field(form, 'email'));
  const notifyIfMade = field(form, 'notify_if_made') === 'yes';

  if (!game || !idea) return { error: 'missing' };
  if (email && !EMAIL_PATTERN.test(email)) return { error: 'email' };
  if (notifyIfMade && !email) return { error: 'email' };
  if (
    game.length > LIMITS.game ||
    idea.length > LIMITS.idea ||
    meaning.length > LIMITS.meaning ||
    creditName.length > LIMITS.creditName ||
    email.length > LIMITS.email
  ) {
    return { error: 'long' };
  }
  return { game, idea, meaning: orNull(meaning), creditName: orNull(creditName), email: orNull(email), notifyIfMade };
}

export function emailText(idea: ShirtIdea, id: number | null): string {
  return [
    'New shirt idea from theludarium.com',
    '',
    `Game:     ${idea.game}`,
    `Idea:     ${idea.idea}`,
    `Meaning:  ${idea.meaning ?? '(not given)'}`,
    `Credit:   ${idea.creditName ?? '(not given)'}`,
    `Email:    ${idea.email ?? '(not given)'}`,
    `Tell them if it is made: ${idea.notifyIfMade ? 'yes' : 'no'}`,
    '',
    id ? `Saved as idea #${id}. Ask Claude for the full list any time (scripts/shirt-ideas.mjs).` : 'Saved to the shirt ideas list.',
    idea.email ? 'Reply to this email to write to them directly.' : '',
  ]
    .filter((line, i, all) => !(line === '' && i === all.length - 1))
    .join('\n');
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

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const redirect = (request: Request, path: string) => Response.redirect(new URL(path, request.url).toString(), 303);
const back = (request: Request, error: string) => redirect(request, `/store/suggest-a-shirt/?idea_error=${error}#form`);

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, 'missing');
  }

  // Honeypot: people never see this field; bots tend to fill it. Pretend it worked.
  if (field(form, 'website')) return redirect(request, '/store/suggest-a-shirt/?idea=sent#form');

  if (!env.DB || !env.TURNSTILE_SECRET_KEY) {
    console.error('Shirt idea form is missing the DB binding or TURNSTILE_SECRET_KEY');
    return back(request, 'unavailable');
  }

  const ip = request.headers.get('CF-Connecting-IP');
  const token = field(form, 'cf-turnstile-response');
  const human = token && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip));
  if (!human) return back(request, 'verify');

  const idea = parseIdea(form);
  if ('error' in idea) return back(request, idea.error);

  const ipHash = await sha256Hex(`${env.WWP_HASH_SALT ?? 'wwp'}:shirt:${ip ?? ''}`);
  const now = new Date();
  const hourAgo = new Date(now.getTime() - 3600_000).toISOString();
  let id: number | null = null;
  try {
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM shirt_ideas WHERE ip_hash = ? AND created_at > ?')
      .bind(ipHash, hourAgo)
      .first<{ n: number }>();
    if ((recent?.n ?? 0) >= PER_HOUR) return back(request, 'slow');
    const row = await env.DB.prepare(
      'INSERT INTO shirt_ideas (game, idea, meaning, credit_name, email, notify_if_made, ip_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id',
    )
      .bind(idea.game, idea.idea, idea.meaning, idea.creditName, idea.email, idea.notifyIfMade ? 1 : 0, ipHash, now.toISOString())
      .first<{ id: number }>();
    id = row?.id ?? null;
  } catch (err) {
    console.error('Saving a shirt idea failed', err);
    return back(request, 'unavailable');
  }

  // The idea is saved either way; a failed notice only means no email this time.
  await notify(env.NOTIFY, {
    replyTo: idea.email ?? undefined,
    subject: `Shirt idea: ${idea.idea.slice(0, 60)} (${idea.game.slice(0, 40)})`,
    text: emailText(idea, id),
  });

  return redirect(request, '/store/suggest-a-shirt/?idea=sent#form');
}
