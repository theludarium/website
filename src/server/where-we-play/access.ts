// Who may call the admin routes. In production, Cloudflare Access guards
// /cube-commonwealth/where-we-play/admin and /api/where-we-play/admin at the
// edge and adds a signed JWT to every request it lets through. This module
// checks that JWT itself, so a misconfigured Access policy fails closed:
// no valid token, no data. On previews and locally, where Access is not set
// up, WWP_ADMIN_PREVIEW_TOKEN in an X-Admin-Token header is accepted instead.
import type { WwpEnv } from './env.ts';
import { fail, sameSecret } from './http.ts';

interface Jwk {
  kid: string;
  kty: string;
  n: string;
  e: string;
  alg?: string;
}

const certCache = new Map<string, { keys: Jwk[]; fetchedAt: number }>();
const CERT_TTL_MS = 60 * 60 * 1000;

async function accessKeys(teamDomain: string, fetchImpl: typeof fetch): Promise<Jwk[]> {
  const cached = certCache.get(teamDomain);
  if (cached && Date.now() - cached.fetchedAt < CERT_TTL_MS) return cached.keys;
  const res = await fetchImpl(`https://${teamDomain}.cloudflareaccess.com/cdn-cgi/access/certs`, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`Access certs answered ${res.status}`);
  const data = (await res.json()) as { keys?: Jwk[] };
  const keys = data.keys ?? [];
  certCache.set(teamDomain, { keys, fetchedAt: Date.now() });
  return keys;
}

const b64urlToBytes = (s: string) => {
  const padded = s.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - (s.length % 4)) % 4);
  return Uint8Array.from(atob(padded), (c) => c.charCodeAt(0));
};

const decodeJson = (s: string) => JSON.parse(new TextDecoder().decode(b64urlToBytes(s)));

export interface AccessClaims {
  email?: string;
  aud?: string | string[];
  exp?: number;
  iss?: string;
}

/** Verifies an Access JWT: signature against the team's keys, audience, expiry, issuer. */
export async function verifyAccessJwt(jwt: string, teamDomain: string, aud: string, fetchImpl: typeof fetch = fetch, now = Date.now()): Promise<AccessClaims | null> {
  const parts = jwt.split('.');
  if (parts.length !== 3) return null;
  let header: { kid?: string; alg?: string };
  let claims: AccessClaims;
  try {
    header = decodeJson(parts[0]);
    claims = decodeJson(parts[1]);
  } catch {
    return null;
  }
  if (header.alg !== 'RS256' || !header.kid) return null;

  const keys = await accessKeys(teamDomain, fetchImpl);
  const jwk = keys.find((k) => k.kid === header.kid);
  if (!jwk) return null;
  const key = await crypto.subtle.importKey('jwk', { kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256', ext: true }, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
  const valid = await crypto.subtle.verify(
    'RSASSA-PKCS1-v1_5',
    key,
    b64urlToBytes(parts[2]),
    new TextEncoder().encode(`${parts[0]}.${parts[1]}`),
  );
  if (!valid) return null;

  const audiences = Array.isArray(claims.aud) ? claims.aud : claims.aud ? [claims.aud] : [];
  if (!audiences.includes(aud)) return null;
  if (typeof claims.exp !== 'number' || claims.exp * 1000 < now) return null;
  if (claims.iss !== `https://${teamDomain}.cloudflareaccess.com`) return null;
  return claims;
}

const cookie = (request: Request, name: string) =>
  request.headers.get('Cookie')?.split(';').map((c) => c.trim()).find((c) => c.startsWith(`${name}=`))?.slice(name.length + 1) ?? null;

/**
 * Null when the request may use the admin routes; otherwise the response to
 * send instead. Fails closed: with neither Access settings nor a preview
 * token configured, nothing gets in.
 */
export async function requireAdmin(request: Request, env: WwpEnv, fetchImpl: typeof fetch = fetch): Promise<Response | null> {
  const preview = request.headers.get('X-Admin-Token');
  if (env.WWP_ADMIN_PREVIEW_TOKEN && preview && sameSecret(preview, env.WWP_ADMIN_PREVIEW_TOKEN)) return null;

  const jwt = request.headers.get('Cf-Access-Jwt-Assertion') ?? cookie(request, 'CF_Authorization');
  if (!jwt) return fail(401, 'Sign in through Cloudflare Access to use the admin routes.');
  if (!env.ACCESS_TEAM_DOMAIN || !env.ACCESS_AUD) {
    console.error('Admin routes need ACCESS_TEAM_DOMAIN and ACCESS_AUD (or WWP_ADMIN_PREVIEW_TOKEN on previews)');
    return fail(503, 'The admin routes are not configured yet.');
  }
  try {
    const claims = await verifyAccessJwt(jwt, env.ACCESS_TEAM_DOMAIN, env.ACCESS_AUD, fetchImpl);
    if (!claims) return fail(403, 'That Access token is not valid for this application.');
  } catch (err) {
    console.error('Access verification failed', err);
    return fail(503, 'Could not verify the Access token right now.');
  }
  return null;
}
