// Small HTTP helpers: errors, JSON responses, CORS and bearer checks.
import type { Env } from './env';
import { safeEqual } from './kit';

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  return allowed.includes(origin)
    ? {
        'Access-Control-Allow-Origin': origin,
        Vary: 'Origin',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      }
    : { Vary: 'Origin' };
}

export function json(body: unknown, status: number, headers: Record<string, string>, cache = 'no-store'): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': cache, ...headers },
  });
}

export function bearer(req: Request): string | null {
  const h = req.headers.get('Authorization') || '';
  const m = /^Bearer\s+(.+)$/i.exec(h.trim());
  return m ? m[1].trim() : null;
}

/** True when the request carries the expected secret. An unset secret never matches. */
export function hasToken(req: Request, secret: string | undefined): boolean {
  const got = bearer(req);
  return !!secret && !!got && safeEqual(got, secret);
}

export function requireToken(req: Request, secret: string | undefined, what = 'This route'): void {
  if (!hasToken(req, secret)) throw new HttpError(403, `${what} needs a valid token`);
}

export function isPublic(env: Env): boolean {
  return env.PUBLIC_API === 'true';
}

/**
 * The licensing gate. While PUBLIC_API is not "true", the week, game and feed
 * routes answer only to the ADMIN_TOKEN, because they show BGG-derived data.
 */
export function gatePublic(req: Request, env: Env): void {
  if (isPublic(env)) return;
  if (!hasToken(req, env.ADMIN_TOKEN)) throw new HttpError(403, 'The Ludometer is not public yet');
}

const MAX_BODY = 256 * 1024;

export async function readText(req: Request): Promise<string> {
  const text = await req.text();
  if (text.length > MAX_BODY) throw new HttpError(413, 'Body is too large');
  return text;
}

export function parseJson(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    throw new HttpError(400, 'Body must be JSON');
  }
}
