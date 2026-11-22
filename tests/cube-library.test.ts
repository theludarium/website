// Tests for the Cube Library's shared code and API helpers. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { cleanListUrl, cleanLocation, cobraId, cubeCard, locationsOf, matches, parseSubmission, primerExcerpt, type PublicCube } from '../src/lib/cube-library.ts';
import { emailText, parseCobraPrefix } from '../functions/api/cubes/index.ts';
import { cubeUpdates } from '../functions/api/where-we-play/admin/cubes/[id].ts';
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
