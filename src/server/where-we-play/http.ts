// Small helpers shared by the Where We Play functions: JSON responses, form
// fields, redirects, Turnstile, and hashing.

export const json = (data: unknown, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', ...headers },
  });

export const fail = (status: number, error: string, extra: Record<string, unknown> = {}) => json({ error, ...extra }, status);

export const field = (form: FormData, key: string) => String(form.get(key) ?? '').trim();
export const oneLine = (value: string) => value.replace(/[\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
export const orNull = (value: string) => (value ? value : null);

export const redirect = (request: Request, path: string) =>
  Response.redirect(new URL(path, request.url).toString(), 303);

export const clientIp = (request: Request) => request.headers.get('CF-Connecting-IP') ?? '';

export async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyTurnstile(token: string, secret: string, ip: string | null): Promise<boolean> {
  const body = new FormData();
  body.append('secret', secret);
  body.append('response', token);
  if (ip) body.append('remoteip', ip);
  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body });
    if (!res.ok) return false;
    const data = (await res.json()) as { success?: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

/** Reads a JSON body, or returns null when it is missing or malformed. */
export async function readJson<T = Record<string, unknown>>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

/** Constant-time string comparison for tokens. */
export function sameSecret(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
