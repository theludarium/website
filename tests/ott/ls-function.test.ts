// Tests for functions/api/ott/ls.ts, which passes Lemon Squeezy webhooks to
// the On the Table Worker through the OTT service binding. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { MAX_BODY, OTT_LS_URL, onRequestPost } from '../../functions/api/ott/ls.ts';

const BODY = JSON.stringify({ meta: { event_name: 'order_created' }, data: { type: 'orders', id: '1' } });

function hook(body = BODY, headers: Record<string, string> = { 'X-Signature': 'ab'.repeat(32), 'X-Event-Name': 'order_created' }) {
  return new Request('https://theludarium.com/api/ott/ls', { method: 'POST', headers: { 'Content-Type': 'application/json', ...headers }, body });
}

function binding(reply: Response | Error = new Response('OK')) {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  return {
    calls,
    OTT: {
      fetch: async (url: string, init?: RequestInit) => {
        calls.push({ url, init });
        if (reply instanceof Error) throw reply;
        return reply;
      },
    },
  };
}

test('passes the raw body and signature headers through the binding', async () => {
  const b = binding();
  const res = await onRequestPost({ request: hook(), env: { OTT: b.OTT } });
  assert.equal(res.status, 200);
  assert.equal(b.calls.length, 1);
  assert.equal(OTT_LS_URL, 'https://ott.internal/api/ott/ls');
  assert.equal(b.calls[0]!.url, OTT_LS_URL);
  assert.equal(b.calls[0]!.init?.body, BODY);
  const h = new Headers(b.calls[0]!.init?.headers);
  assert.equal(h.get('X-Signature'), 'ab'.repeat(32));
  assert.equal(h.get('X-Event-Name'), 'order_created');
});

test("returns the Worker's status, so Lemon Squeezy retries a failure", async () => {
  assert.equal((await onRequestPost({ request: hook(), env: { OTT: binding(new Response('Bad signature', { status: 401 })).OTT } })).status, 401);
  assert.equal((await onRequestPost({ request: hook(), env: { OTT: binding(new Response('', { status: 500 })).OTT } })).status, 500);
  assert.equal((await onRequestPost({ request: hook(), env: { OTT: binding(new Error('down')).OTT } })).status, 502);
});

test('answers 503 without the binding, and refuses an oversized body', async () => {
  assert.equal((await onRequestPost({ request: hook(), env: {} })).status, 503);
  const b = binding();
  assert.equal((await onRequestPost({ request: hook('x'.repeat(MAX_BODY + 1)), env: { OTT: b.OTT } })).status, 413);
  assert.equal(b.calls.length, 0);
});
