// Server pieces that need no database: form parsing, routing with a fake
// router, the confirmation email, and the Access token check. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseEventBody, parseMemberForm, parseSuggestion, parseVenueBody } from '../../src/server/where-we-play/validate.ts';
import { driveTimeMatrix, routePairs } from '../../src/server/where-we-play/routing.ts';
import { confirmationText, confirmationHtml } from '../../src/server/where-we-play/email.ts';
import { requireAdmin, verifyAccessJwt } from '../../src/server/where-we-play/access.ts';
import { zipCentroid, neighborhoodFromAddress, normalizeQuery } from '../../src/server/where-we-play/geocode.ts';
import { hashToken, newToken, TOKEN_PATTERN } from '../../src/server/where-we-play/tokens.ts';

const form = (fields: Record<string, string | string[]>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) for (const value of Array.isArray(v) ? v : [v]) f.append(k, value);
  return f;
};

test('parseMemberForm: cleans, lowercases the email, keeps only known slots', () => {
  const parsed = parseMemberForm(form({ email: ' Ada@Example.com ', zip: '46032', discord_handle: '@ada', availability: ['tue-eve', 'bogus'] }));
  assert.ok(!('error' in parsed));
  assert.equal(parsed.email, 'ada@example.com');
  assert.equal(parsed.discordHandle, 'ada');
  assert.deepEqual(parsed.availability, ['tue-eve']);
  assert.equal(parsed.crossStreet, null);
});

test('parseMemberForm: names the first problem', () => {
  assert.deepEqual(parseMemberForm(form({ email: '', zip: '46032' })), { error: 'missing' });
  assert.deepEqual(parseMemberForm(form({ email: 'nope', zip: '46032' })), { error: 'email' });
  assert.deepEqual(parseMemberForm(form({ email: 'a@b.co', zip: '4603' })), { error: 'zip' });
  assert.deepEqual(parseMemberForm(form({ email: 'a@b.co', zip: '46032', first_name: 'x'.repeat(81) })), { error: 'long' });
});

test('parseMemberForm: a cross street without a street address is dropped', () => {
  const parsed = parseMemberForm(form({ email: 'a@b.co', zip: '46032', cross_street: 'Main and 1st' }));
  assert.ok(!('error' in parsed) && parsed.crossStreet === null);
});

test('parseSuggestion needs a name and an address', () => {
  assert.deepEqual(parseSuggestion(form({ venue_name: 'Spot', venue_address: '' })), { error: 'missing' });
  const ok = parseSuggestion(form({ venue_name: ' Spot ', venue_address: '1 Main St', venue_note: 'quiet' }));
  assert.deepEqual(ok, { name: 'Spot', address: '1 Main St', note: 'quiet' });
});

test('parseVenueBody checks only the keys present and normalizes the website', () => {
  const ok = parseVenueBody({ status: 'confirmed', website: 'example.com', table_count: '8', call_ahead: true, ignored: 1 });
  assert.deepEqual(ok, { status: 'confirmed', website: 'https://example.com', table_count: 8, call_ahead: true });
  assert.deepEqual(parseVenueBody({ status: 'maybe' }), { error: 'invalid: status' });
  assert.deepEqual(parseVenueBody({ name: '' }), { error: 'invalid: name' });
  assert.deepEqual(parseVenueBody({ lat: 200 }), { error: 'invalid: lat' });
});

test('parseEventBody', () => {
  assert.deepEqual(parseEventBody({ date: '2026-10-24', venue_id: '3', headcount: 8.4, notes: ' hi ' }), { venue_id: 3, date: '2026-10-24', headcount: 8, notes: 'hi' });
  assert.deepEqual(parseEventBody({ date: '2026-10-24', headcount: 0, venue_id: null, notes: null }), { venue_id: null, date: '2026-10-24', headcount: 0, notes: null });
  assert.deepEqual(parseEventBody({ date: 'soon', headcount: 1 }), { error: 'invalid: date' });
});

const a = { lat: 39.97, lng: -86.12 };
const b = { lat: 39.96, lng: -86.01 };
const c = { lat: 39.77, lng: -86.16 };

const fakeOsrm = (durations: (number | null)[][]) =>
  (async (url: string | URL | Request) => {
    const u = String(url);
    assert.ok(u.startsWith('https://router.project-osrm.org/table/v1/driving/'));
    assert.ok(u.includes('annotations=duration'));
    return new Response(JSON.stringify({ code: 'Ok', durations }), { status: 200 });
  }) as unknown as typeof fetch;

test('driveTimeMatrix returns rounded seconds from the table service', async () => {
  const matrix = await driveTimeMatrix([a], [b, c], fakeOsrm([[600.4, 1800.6]]));
  assert.deepEqual(matrix, [[600, 1801]]);
});

test('routePairs falls back to straight-line estimates when OSRM is down or has no route', async () => {
  const down = (async () => {
    throw new Error('offline');
  }) as unknown as typeof fetch;
  const pairs = await routePairs([a], [b, c], down);
  assert.equal(pairs.length, 2);
  assert.ok(pairs.every((p) => p.source === 'straight_line' && p.seconds > 0));

  const partial = await routePairs([a], [b, c], fakeOsrm([[600, null]]));
  assert.equal(partial[0].source, 'osrm');
  assert.equal(partial[0].seconds, 600);
  assert.equal(partial[1].source, 'straight_line');
});

test('confirmation email carries the link, the privacy line, and no em dashes', () => {
  const c = { to: 'a@b.co', firstName: 'Ada', editUrl: 'https://theludarium.com/cube-commonwealth/where-we-play/edit/?t=abc', updated: false };
  const text = confirmationText(c);
  assert.ok(text.startsWith('Hi Ada,'));
  assert.ok(text.includes(c.editUrl));
  assert.ok(text.includes("Only the app's admin can see your address"));
  assert.ok(!text.includes('—'));
  const html = confirmationHtml({ ...c, firstName: '<b>' });
  assert.ok(html.includes('Hi &lt;b&gt;,'));
  assert.ok(confirmationText({ ...c, updated: true }).includes('is updated'));
});

test('geocode helpers: zip centroids, neighborhoods, query normalization', () => {
  const carmel = zipCentroid('46032')!;
  assert.ok(Math.abs(carmel.lat - 39.97) < 0.05 && Math.abs(carmel.lng - -86.17) < 0.05);
  assert.equal(zipCentroid('90210'), null);
  assert.equal(neighborhoodFromAddress('100 Main St, Carmel, IN 46032'), 'Carmel');
  assert.equal(neighborhoodFromAddress('100 Main St'), null);
  assert.equal(normalizeQuery('  100  Main St,\nCarmel '), '100 main st, carmel');
});

test('edit tokens are long, url-safe, and hashed', async () => {
  const token = newToken();
  assert.match(token, TOKEN_PATTERN);
  assert.notEqual(newToken(), token);
  const hash = await hashToken(token);
  assert.match(hash, /^[0-9a-f]{64}$/);
  assert.notEqual(hash, await hashToken(newToken()));
});

// Access: sign a token with a throwaway RSA key and serve its public half as the team's certs.
const b64url = (bytes: Uint8Array | string) => {
  const s = typeof bytes === 'string' ? btoa(bytes) : btoa(String.fromCharCode(...bytes));
  return s.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

// Certs are cached per team for an hour, so every signed token gets a team of its own.
async function makeAccess(claims: Record<string, unknown>, kid = 'test-key') {
  const team = `team${Math.random().toString(36).slice(2)}`;
  const pair = await crypto.subtle.generateKey({ name: 'RSASSA-PKCS1-v1_5', modulusLength: 2048, publicExponent: new Uint8Array([1, 0, 1]), hash: 'SHA-256' }, true, ['sign', 'verify']);
  const jwk = (await crypto.subtle.exportKey('jwk', pair.publicKey)) as JsonWebKey;
  const head = b64url(JSON.stringify({ alg: 'RS256', kid, typ: 'JWT' }));
  const full = { iss: `https://${team}.cloudflareaccess.com`, ...claims };
  const body = b64url(JSON.stringify(full));
  const sig = new Uint8Array(await crypto.subtle.sign('RSASSA-PKCS1-v1_5', pair.privateKey, new TextEncoder().encode(`${head}.${body}`)));
  const jwt = `${head}.${body}.${b64url(sig)}`;
  const certs = (async () => new Response(JSON.stringify({ keys: [{ kid, kty: jwk.kty, n: jwk.n, e: jwk.e, alg: 'RS256' }] }))) as unknown as typeof fetch;
  return { jwt, certs, team, claims: full };
}

const good = { aud: ['aud-1'], exp: Math.floor(Date.now() / 1000) + 600, email: 'levi@example.com' };

test('verifyAccessJwt accepts a well-signed token for the right audience', async () => {
  const { jwt, certs, team } = await makeAccess(good);
  const claims = await verifyAccessJwt(jwt, team, 'aud-1', certs);
  assert.equal(claims?.email, 'levi@example.com');
});

test('verifyAccessJwt rejects the wrong audience, an expired token, a tampered token, and an unknown key', async () => {
  const { jwt, certs, team, claims } = await makeAccess(good);
  assert.equal(await verifyAccessJwt(jwt, team, 'aud-2', certs), null);
  const expired = await makeAccess({ ...good, exp: Math.floor(Date.now() / 1000) - 5 });
  assert.equal(await verifyAccessJwt(expired.jwt, expired.team, 'aud-1', expired.certs), null);
  const [h, , s] = jwt.split('.');
  const tampered = `${h}.${b64url(JSON.stringify({ ...claims, email: 'mallory@example.com' }))}.${s}`;
  assert.equal(await verifyAccessJwt(tampered, team, 'aud-1', certs), null);
  const other = await makeAccess(good, 'other-key');
  // Right team, but signed by a key the team's certs do not list.
  assert.equal(await verifyAccessJwt(other.jwt, team, 'aud-1', certs), null);
});

test('requireAdmin fails closed and honors the preview token', async () => {
  const req = (headers: Record<string, string> = {}) => new Request('https://x.test/api/where-we-play/admin/summary', { headers });
  const refused = await requireAdmin(req(), {});
  assert.equal(refused?.status, 401);
  const unconfigured = await requireAdmin(req({ 'Cf-Access-Jwt-Assertion': 'a.b.c' }), {});
  assert.equal(unconfigured?.status, 503);
  assert.equal(await requireAdmin(req({ 'X-Admin-Token': 'secret' }), { WWP_ADMIN_PREVIEW_TOKEN: 'secret' }), null);
  const wrong = await requireAdmin(req({ 'X-Admin-Token': 'nope' }), { WWP_ADMIN_PREVIEW_TOKEN: 'secret' });
  assert.equal(wrong?.status, 401);
  const { jwt, certs, team } = await makeAccess(good);
  assert.equal(await requireAdmin(req({ 'Cf-Access-Jwt-Assertion': jwt }), { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: 'aud-1' }, certs), null);
  const bad = await requireAdmin(req({ 'Cf-Access-Jwt-Assertion': jwt }), { ACCESS_TEAM_DOMAIN: team, ACCESS_AUD: 'other' }, certs);
  assert.equal(bad?.status, 403);
});
