// POST /api/ott/ls: the Lemon Squeezy order webhook for On the Table.
//
// A Cloudflare Pages Function. It checks nothing and stores nothing itself:
// it passes the raw body and the X-Signature and X-Event-Name headers through
// the OTT service binding to the private On the Table Worker (repo
// theludarium/on-the-table, src/lemonsqueezy.ts), which verifies the
// signature, drops customer details and keeps only counts. The Worker's
// answer goes back to Lemon Squeezy, so a failure there gets retried.
//
// Setting in the Cloudflare Pages project (Settings > Bindings, Production only):
//   OTT   service binding to the Worker `on-the-table` (already set for the beacon)
// Without it (previews, local builds) this answers 503 and does nothing.

interface ServiceBinding {
  fetch(input: string, init?: RequestInit): Promise<Response>;
}

export interface Env {
  OTT?: ServiceBinding;
}

interface Context {
  request: Request;
  env: Env;
}

export const OTT_LS_URL = 'https://ott.internal/api/ott/ls';
export const MAX_BODY = 256 * 1024;

const reply = (status: number, body = '') => new Response(body, { status, headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain' } });

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  if (!env.OTT) return reply(503, 'Not configured');
  if (Number(request.headers.get('Content-Length') ?? '0') > MAX_BODY) return reply(413);
  const body = await request.text();
  if (body.length > MAX_BODY) return reply(413);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  for (const name of ['X-Signature', 'X-Event-Name']) {
    const v = request.headers.get(name);
    if (v) headers[name] = v.slice(0, 200);
  }
  try {
    const res = await env.OTT.fetch(OTT_LS_URL, { method: 'POST', headers, body });
    return reply(res.status, res.status < 300 ? 'OK' : '');
  } catch {
    return reply(502);
  }
}
