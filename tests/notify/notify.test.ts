// Tests for form notices: the ludarium-notify Worker's MIME builder
// (workers/notify/src/mime.ts) and the site's notify() helper. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { buildMime, encodeHeader, isEmail } from '../../workers/notify/src/mime.ts';
import { notify } from '../../src/server/notify.ts';

const base = {
  from: 'notices@theludarium.com',
  fromName: 'The Ludarium',
  to: 'owner@example.com',
  subject: 'Corporate event inquiry: Acme (10 to 25)',
  text: 'Name: Sam\nGoals: better meetings',
  replyTo: 'sam@example.com',
  messageDomain: 'theludarium.com',
};

const bodyOf = (raw: string) => {
  const [, body] = raw.split('\r\n\r\n');
  return Buffer.from(body.replace(/\r\n/g, ''), 'base64').toString('utf8');
};

test('buildMime writes the headers Email Routing needs and a base64 UTF-8 body', () => {
  const raw = buildMime(base, new Date('2026-10-27T12:00:00Z'), 'abc');
  assert.match(raw, /^From: The Ludarium <notices@theludarium\.com>\r\n/);
  assert.ok(raw.includes('\r\nTo: <owner@example.com>\r\n'));
  assert.ok(raw.includes('\r\nReply-To: <sam@example.com>\r\n'));
  assert.ok(raw.includes('\r\nSubject: Corporate event inquiry: Acme (10 to 25)\r\n'));
  assert.ok(raw.includes('\r\nMessage-ID: <abc@theludarium.com>\r\n'));
  assert.ok(raw.includes('\r\nDate: Tue, 27 Oct 2026 12:00:00 GMT\r\n'));
  assert.equal(bodyOf(raw), 'Name: Sam\r\nGoals: better meetings');
});

test('buildMime encodes non-ASCII subjects and keeps lines short', () => {
  const raw = buildMime({ ...base, subject: 'Guild capstone: Pokémon', text: 'é'.repeat(400) }, new Date(), 'x');
  const subject = raw.split('\r\n').find((l) => l.startsWith('Subject: '))!;
  assert.match(subject, /^Subject: =\?UTF-8\?B\?[A-Za-z0-9+/=]+\?=$/);
  assert.ok(raw.split('\r\n').every((line) => line.length <= 998));
  assert.equal(bodyOf(raw), 'é'.repeat(400));
});

test('header injection is impossible: newlines fold away and bad reply-to is dropped', () => {
  assert.equal(encodeHeader('Hi\r\nBcc: evil@example.com'), 'Hi Bcc: evil@example.com');
  const raw = buildMime({ ...base, replyTo: 'sam@example.com\r\nBcc: evil@example.com' }, new Date(), 'x');
  assert.ok(!raw.includes('Reply-To'));
  assert.ok(!/\r\nBcc:/.test(raw));
  assert.throws(() => buildMime({ ...base, to: 'not an address' }));
  assert.ok(isEmail('a@b.co'));
  assert.ok(!isEmail('a@b'));
});

test('notify posts the notice to the binding and reports failures without throwing', async () => {
  let seen: { url: string; body: unknown } | null = null;
  const ok = await notify(
    {
      fetch: async (url, init) => {
        seen = { url, body: JSON.parse(String(init?.body)) };
        return new Response('{"sent":true}');
      },
    },
    { subject: 'S', text: 'T', replyTo: 'r@example.com' },
  );
  assert.equal(ok, true);
  assert.deepEqual(seen!.body, { subject: 'S', text: 'T', replyTo: 'r@example.com' });

  const quiet = console.error;
  console.error = () => {};
  try {
    assert.equal(await notify(undefined, { subject: 'S', text: 'T' }), false);
    assert.equal(await notify({ fetch: async () => new Response('no', { status: 502 }) }, { subject: 'S', text: 'T' }), false);
    assert.equal(await notify({ fetch: async () => { throw new Error('down'); } }, { subject: 'S', text: 'T' }), false);
  } finally {
    console.error = quiet;
  }
});
