import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBot, parseIgnoredIps, skipReason } from '../../src/server/visitors/filters.ts';

const CHROME =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

const facts = (overrides: Partial<Parameters<typeof skipReason>[0]> = {}) => ({
  method: 'GET',
  pathname: '/corporate-events/',
  ip: '203.0.113.5',
  userAgent: CHROME,
  headers: new Headers(),
  ignoredIps: new Set<string>(),
  ...overrides,
});

test('a normal visit to a tracked page is logged', () => {
  assert.equal(skipReason(facts()), null);
});

test('other pages are never logged', () => {
  assert.equal(skipReason(facts({ pathname: '/articles/' })), 'path');
  assert.equal(skipReason(facts({ pathname: '/corporate-events' })), 'path'); // no trailing slash: a redirect, not a view
});

test('bots, scripts, and empty user agents are skipped', () => {
  assert.equal(isBot('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)'), true);
  assert.equal(isBot('curl/8.4.0'), true);
  assert.equal(isBot(null), true);
  assert.equal(isBot(CHROME), false);
  assert.equal(skipReason(facts({ userAgent: 'LinkedInBot/1.0' })), 'bot');
});

test('prefetches are skipped', () => {
  assert.equal(skipReason(facts({ headers: new Headers({ 'Sec-Purpose': 'prefetch' }) })), 'prefetch');
});

test('your own IPs are skipped', () => {
  const ignored = parseIgnoredIps('203.0.113.5, 2001:db8::1\n198.51.100.7');
  assert.equal(ignored.size, 3);
  assert.equal(skipReason(facts({ ignoredIps: ignored })), 'own-ip');
});

test('form posts and requests with no IP are skipped', () => {
  assert.equal(skipReason(facts({ method: 'POST' })), 'method');
  assert.equal(skipReason(facts({ ip: null })), 'no-ip');
});
