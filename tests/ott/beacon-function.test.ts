// Tests for functions/api/ott/e.ts, the Pages Function that forwards beacons
// to the On the Table Worker through the OTT service binding. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_BODY, OTT_BEACON_URL, onRequestPost } from '../../functions/api/ott/e.ts';

const BODY = JSON.stringify({ e: 'view', g: ['azul'], p: '/articles/azul-strategy/' });
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';

/** A browser beacon as it reaches the Function. Pass cf = null for a request without Cloudflare's data. */
function beacon(body = BODY, headers: Record<string, string> = {}, cf: { asn?: number } | null = { asn: 7922 }) {
  const request = new Request('https://theludarium.com/api/ott/e', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=UTF-8', Origin: 'https://theludarium.com', 'User-Agent': UA, 'CF-Connecting-IP': '203.0.113.7', ...headers },
    body,
  });
  return Object.assign(request, { cf: cf ?? undefined });
}

function binding(reply: Promise<Response> = Promise.resolve(new Response(null, { status: 204 }))) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  return { calls, OTT: { fetch: async (url: string, init?: RequestInit) => (calls.push({ url, init }), reply) } };
}

async function run(request: Request, env: { OTT?: ReturnType<typeof binding>['OTT'] }) {
  const waits: Promise<unknown>[] = [];
  const res = await onRequestPost({ request, env, waitUntil: (p) => void waits.push(p) });
  return { res, waits };
}

test('answers 204 at once and forwards the envelope through the binding', async () => {
  const b = binding(new Promise(() => {})); // the Worker never answers
  const { res, waits } = await run(beacon(), { OTT: b.OTT });
  assert.equal(res.status, 204);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.equal(waits.length, 1, 'the forward runs in waitUntil');
  assert.equal(b.calls.length, 1);
  assert.equal(b.calls[0]!.url, OTT_BEACON_URL);
  assert.equal(OTT_BEACON_URL, 'https://ott.internal/api/ott/e');
  assert.equal(b.calls[0]!.init?.method, 'POST');
  assert.deepEqual(JSON.parse(String(b.calls[0]!.init?.body)), {
    origin: 'https://theludarium.com',
    ua: UA,
    ip: '203.0.113.7',
    asn: 7922,
    gpc: false,
    dnt: false,
    body: BODY,
  });
});

test('puts the IP in the body, never in a forwarded header', async () => {
  const b = binding();
  await run(beacon(), { OTT: b.OTT });
  const headers = new Headers(b.calls[0]!.init?.headers);
  assert.deepEqual([...headers.keys()], ['content-type']);
});

test('passes Global Privacy Control and Do Not Track along for the Worker to drop', async () => {
  const b = binding();
  await run(beacon(BODY, { 'Sec-GPC': '1', DNT: '1' }), { OTT: b.OTT });
  const sent = JSON.parse(String(b.calls[0]!.init?.body));
  assert.equal(sent.gpc, true);
  assert.equal(sent.dnt, true);
});

test('does nothing without the binding (previews and local builds)', async () => {
  const { res, waits } = await run(beacon(), {});
  assert.equal(res.status, 204);
  assert.equal(waits.length, 0);
});

test('drops oversized or empty bodies, and requests missing Cloudflare data', async () => {
  for (const request of [beacon('x'.repeat(MAX_BODY + 1)), beacon(''), beacon(BODY, {}, null), beacon(BODY, {}, {}), beacon(BODY, { 'CF-Connecting-IP': '' })]) {
    const b = binding();
    const { res } = await run(request, { OTT: b.OTT });
    assert.equal(res.status, 204);
    assert.equal(b.calls.length, 0);
  }
});

test('swallows a failing binding so the visitor never sees an error', async () => {
  const b = binding(Promise.reject(new Error('Worker down')));
  const { res, waits } = await run(beacon(), { OTT: b.OTT });
  assert.equal(res.status, 204);
  await Promise.all(waits);
});
