// Tests for the Cube Library's shared code and API helpers. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanListUrl, cleanLocation, cobraId, cubeCard, cubeTable, sortCubes, DEFAULT_SORT, firstSortDir, parseOwnerRequest, locationsOf, matches, parseSubmission, primerExcerpt, type PublicCube } from '../src/lib/cube-library.ts';
import { emailText, parseCobraPrefix } from '../functions/api/cubes/index.ts';
import { cubeUpdates } from '../functions/api/where-we-play/admin/cubes/[id].ts';
import { onRequestPost as sendRequest } from '../functions/api/cubes/request.ts';
import seed from '../src/data/cube-library.json' with { type: 'json' };

const form = (v: Record<string, string>) => {
  const f = new FormData();
  for (const [k, x] of Object.entries(v)) f.append(k, x);
  return f;
};
const base = { list_url: 'https://cubecobra.com/cube/list/mono-blue?x=1', owner: 'Sam', location: 'kansas city' };

test('Cube Cobra links become one standard form', () => {
  assert.equal(cleanListUrl('cubecobra.com/cube/list/mono-blue'), 'https://cubecobra.com/cube/overview/mono-blue');
  assert.equal(cobraId('https://cubecobra.com/cube/overview/9rcl'), '9rcl');
  assert.equal(cleanListUrl('https://cubecobra.com/user/view/x'), null);
  assert.equal(cleanListUrl('javascript:alert(1)'), null);
});

test('a Cube Cobra link needs no typed name, any other link does', () => {
  const ok = parseSubmission(form(base));
  assert.ok(!('error' in ok));
  assert.equal(ok.location, 'Kansas City');
  assert.deepEqual(parseSubmission(form({ ...base, list_url: 'https://www.moxfield.com/decks/abc' })), { error: 'name' });
});

test('required fields and bad emails are refused', () => {
  assert.deepEqual(parseSubmission(form({ ...base, owner: '' })), { error: 'missing' });
  assert.deepEqual(parseSubmission(form({ ...base, email: 'nope' })), { error: 'email' });
});

test('primers become short plain text and placeholders are skipped', () => {
  assert.equal(primerExcerpt('This is a brand new cube!'), null);
  const text = primerExcerpt('# Title here is long enough to keep\n\nPlay [[Squadron Hawk]] and [this](https://x.y) — fun {W}.');
  assert.ok(text && !text.includes('[') && !text.includes('—'));
  assert.ok((primerExcerpt('Word. '.repeat(200)) ?? '').length <= 240);
});

test('only the start of the Cube Cobra response is needed', () => {
  const d = parseCobraPrefix('{"name":"Test","cardCount":360,"dateLastUpdated":1700000000000,"categoryOverride":"Vintage","primerTabs":[{"content":"A Cube that says \\"cards\\": in its long primer text."}],"cards":{"mainboard":[');
  assert.equal(d?.name, 'Test');
  assert.equal(d?.cardCount, 360);
  assert.equal(d?.style, 'Vintage');
});

test('cards escape everything people type', () => {
  const c: PublicCube = { name: '<img src=x onerror=1>', listUrl: 'javascript:alert(1)', owner: '"o', location: 'Indy', description: '<b>', note: null, style: 'Other', cardCount: 1, updatedAt: null, lending: null, format: null, discord: null };
  const html = cubeCard(c);
  assert.ok(!html.includes('<img') && !html.includes('javascript:') && !html.includes('<b>'));
});

test('tabs and filters', () => {
  const cubes = [{ location: 'Indianapolis' }, { location: 'Kansas City' }, { location: 'Indianapolis' }];
  assert.deepEqual(locationsOf(cubes)[0], { name: 'Indianapolis', count: 2 });
  const c = (seed as PublicCube[])[0];
  assert.ok(matches(c, 'Indianapolis', '', c.name.slice(0, 4)));
  assert.ok(!matches(c, 'Kansas City', '', ''));
});

test('admin edits are checked', () => {
  assert.ok('error' in cubeUpdates({ status: 'live' }));
  assert.ok('error' in cubeUpdates({ listUrl: 'nope' }));
  const ok = cubeUpdates({ status: 'approved', discord: '@sam', location: 'chicago' });
  assert.ok('updates' in ok);
  assert.equal(ok.updates.discord, 'sam');
  assert.equal(ok.updates.location, 'Chicago');
});

test('the seed list has no private fields, em dashes,', () => {
  const text = JSON.stringify(seed);
  assert.ok(!text.includes('—') && !text.includes('"email"'));
  assert.equal(seed.length, 40);
});

test('the email to Levi has the details and the queue link', () => {
  const s = parseSubmission(form(base));
  assert.ok(!('error' in s));
  const t = emailText({ ...s, name: 'Mono Blue' }, 7, 360, true, 'https://theludarium.com/q/');
  for (const part of ['Mono Blue', 'Sam', 'Kansas City', '360', 'https://theludarium.com/q/']) assert.ok(t.includes(part), part);
});

test('the table sorts with blanks last and escapes what people type', () => {
  const make = (name: string, cardCount: number | null): PublicCube => ({ name, listUrl: 'https://example.com/x', owner: 'o', location: 'Indy', description: null, note: null, style: 'Other', cardCount, updatedAt: null, lending: null, format: null, discord: null });
  const cubes = [make('B', 360), make('A', null), make('<i>C', 540)];
  assert.deepEqual(sortCubes(cubes, 'cardCount', 1).map((c) => c.cardCount), [360, 540, null]);
  assert.deepEqual(sortCubes(cubes, 'cardCount', -1).map((c) => c.cardCount), [540, 360, null]);
  const html = cubeTable(cubes, 'name', 1);
  assert.ok(html.includes('aria-sort="ascending"') && !html.includes('<i>'));
});

test('owner requests need a reason for a change but not for a removal', () => {
  const base = { cube_id: '7', name: 'Sam', email: 'sam@example.com' };
  assert.deepEqual(parseOwnerRequest(form({ ...base, kind: 'change' })), { error: 'details' });
  assert.ok(!('error' in parseOwnerRequest(form({ ...base, kind: 'remove' }))));
  assert.deepEqual(parseOwnerRequest(form({ ...base, cube_id: 'x', kind: 'remove' })), { error: 'missing' });
});

test('an owner request emails Levi, changes nothing, and reports a failed send', async (t) => {
  t.mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify({ success: true })));
  const sql: string[] = [];
  const DB = { prepare(q: string) { sql.push(q); const st = { bind: () => st, first: async () => ({ name: 'Mono Blue', listUrl: 'https://cubecobra.com/cube/overview/mono-blue', owner: 'Levi Wilson', location: 'Indianapolis' }) }; return st; } };
  const sentMail: { subject: string; text: string; replyTo: string }[] = [];
  let works = true;
  const NOTIFY = { fetch: async (_: string, init?: RequestInit) => { sentMail.push(JSON.parse(String(init?.body))); return new Response('', { status: works ? 200 : 500 }); } };
  const post = () => sendRequest({ env: { DB, NOTIFY, TURNSTILE_SECRET_KEY: 'x' } as never, request: new Request('https://theludarium.com/api/cubes/request', { method: 'POST', body: form({ cube_id: '7', kind: 'remove', name: 'Sam', email: 'sam@example.com', 'cf-turnstile-response': 't' }) }) });
  assert.ok((await post()).headers.get('location')?.includes('request=sent'));
  assert.ok(sentMail[0].subject.includes('removal') && sentMail[0].text.includes('Mono Blue') && sentMail[0].replyTo === 'sam@example.com');
  assert.ok(sql.every((q) => q.trim().startsWith('SELECT')));
  works = false;
  assert.ok((await post()).headers.get('location')?.includes('request_error=unavailable'));
});

test('the library opens newest first, with undated Cubes last', () => {
  const sorted = sortCubes(seed as PublicCube[], DEFAULT_SORT.key, DEFAULT_SORT.dir);
  const dates = sorted.map((c) => c.updatedAt).filter((d): d is string => Boolean(d));
  assert.deepEqual(dates, [...dates].sort().reverse());
  assert.equal(sorted.at(-1)?.updatedAt, null);
  assert.equal(firstSortDir('updatedAt'), -1);
  assert.equal(firstSortDir('name'), 1);
});
