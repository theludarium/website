// What a calendar request brings with it, and how far to trust it: the JSON
// body, hashed IPs, hourly rate limits, the human check, and the private
// attendee token. The event actions and the suggest form share these so both
// count and check the same way.
import { ATTENDEE_HEADER } from '../../lib/calendar/shared.ts';
import { allowSubmission } from '../where-we-play/db.ts';
import type { D1 } from '../where-we-play/env.ts';
import { readJson, sha256Hex, verifyTurnstile } from '../where-we-play/http.ts';
import { TOKEN_PATTERN } from '../where-we-play/tokens.ts';
import type { CalEnv } from './env.ts';

/** The JSON object a request carries. Null when the body is missing, malformed, or not an object. */
export async function readObject(request: Request): Promise<Record<string, unknown> | null> {
  const body = await readJson<unknown>(request);
  return typeof body === 'object' && body !== null && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

/**
 * Tries allowed per hour. Sign-ups and event suggestions count per hashed IP. A
 * whole venue on one Wi-Fi shares one address, so the attend limit leaves room
 * for a full room. Every other action needs a valid token, so it counts per
 * attendee, and one stuck tab cannot use up the hour for the rest of the table.
 */
export const PER_HOUR = { attend: 40, act: 120, suggest: 5 } as const;
export type Limited = keyof typeof PER_HOUR;

const salted = (env: CalEnv, scope: string, ip: string) => sha256Hex(`${env.WWP_HASH_SALT ?? 'wwp'}:${scope}:${ip}`);

/** The key the rate limiter counts one kind of request under: a hashed IP, or `attendee:<id>`. */
export const rateKey = (env: CalEnv, what: Limited, who: string) => salted(env, `cal-${what}`, who);

/** False once this caller has used up the hour's tries for this kind of request. */
export async function allow(db: D1, env: CalEnv, what: Limited, who: string, now: Date): Promise<boolean> {
  return allowSubmission(db, await rateKey(env, what, who), PER_HOUR[what], now);
}

/**
 * True on a pages.dev preview address. Previews use Cloudflare's always-pass human
 * check and share the production database, so they may read events but never write them.
 */
export const isPreviewHost = (request: Request) => new URL(request.url).hostname.endsWith('.pages.dev');

/** The Turnstile check, as Where We Play does it: with no secret set (local dev) it is skipped. */
export async function isHuman(env: CalEnv, token: string, ip: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return true;
  return Boolean(token) && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip || null));
}

/** The database keeps only this hash, so reading the table cannot forge a token. */
export const hashAttendeeToken = (token: string) => sha256Hex(`cal-attendee:${token}`);

/** The attendee token a request carries, or null when it carries nothing worth looking up. */
export function attendeeToken(request: Request): string | null {
  const token = request.headers.get(ATTENDEE_HEADER) ?? '';
  return TOKEN_PATTERN.test(token) ? token : null;
}

/** The hash of the attendee token a request carries, or null. */
export async function attendeeTokenHash(request: Request): Promise<string | null> {
  const token = attendeeToken(request);
  return token ? hashAttendeeToken(token) : null;
}
