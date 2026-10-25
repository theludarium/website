// POST /api/ott/e: the game interest beacon from /ott.js.
//
// A Cloudflare Pages Function. It answers 204 at once and hands the event to
// the private On the Table Worker through the OTT service binding, which does
// all the checking, hashing and counting (repo theludarium/on-the-table,
// src/beacon.ts). It stores nothing and logs nothing itself.
//
// The Worker gets one JSON envelope in the request body: the visitor's IP and
// network (from Cloudflare's CF-Connecting-IP and request.cf.asn, which a
// visitor can't set), user agent, Origin, privacy signals, and the browser's
// payload as sent. Keeping the IP in the body keeps it out of request logs.
// The Worker serves this only for the internal host ott.internal, so the
// beacon can't be reached any other way.
//
// Setting in the Cloudflare Pages project (Settings > Bindings, Production only):
//   OTT   service binding to the Worker `on-the-table`
// Without it (previews, local builds) the beacon answers 204 and does nothing.

interface ServiceBinding {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export interface Env {
  OTT?: ServiceBinding;
}

interface Context {
  request: Request & { cf?: { asn?: number } };
  env: Env;
  waitUntil(promise: Promise<unknown>): void;
}

export const OTT_BEACON_URL = 'https://ott.internal/api/ott/e';
export const MAX_BODY = 2048;

const noContent = () => new Response(null, { status: 204, headers: { 'Cache-Control': 'no-store' } });

/** The envelope the Worker expects, or null when there is nothing worth sending. */
export function envelope(request: Context['request'], body: string): string | null {
  const ip = request.headers.get('CF-Connecting-IP');
  const asn = request.cf?.asn;
  if (!ip || typeof asn !== 'number' || !body || body.length > MAX_BODY) return null;
  return JSON.stringify({
    origin: request.headers.get('Origin') ?? '',
    ua: request.headers.get('User-Agent') ?? '',
    ip,
    asn,
    gpc: request.headers.get('Sec-GPC') === '1',
    dnt: request.headers.get('DNT') === '1',
    body,
  });
}

export async function onRequestPost(context: Context): Promise<Response> {
  const { request, env } = context;
  if (!env.OTT) return noContent();
  const length = Number(request.headers.get('Content-Length') ?? '0');
  if (length > MAX_BODY) return noContent();

  let body: string;
  try {
    body = await request.text();
  } catch {
    return noContent();
  }

  const payload = envelope(request, body);
  if (payload) {
    const ott = env.OTT;
    context.waitUntil(
      ott
        .fetch(OTT_BEACON_URL, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload })
        .then((res) => res.body?.cancel())
        .catch(() => undefined),
    );
  }
  return noContent();
}
