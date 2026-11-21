import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDigest, rankCompanies } from '../../src/server/visitors/digest.ts';
import { scoreCompany } from '../../src/server/visitors/score.ts';
import type { CompanyActivity } from '../../src/server/visitors/db.ts';

const now = new Date('2026-10-26T12:00:00Z');

const company = (overrides: Partial<CompanyActivity>): CompanyActivity => ({
  id: 1,
  name: 'Cummins Inc.',
  domain: 'cummins.com',
  kind: 'business',
  country: 'US',
  region: 'Indiana',
  region_code: 'IN',
  city: 'Columbus',
  first_seen: '2026-10-21T14:00:00Z',
  last_seen: '2026-10-25T09:00:00Z',
  visits: 3,
  distinct_pages: 2,
  paths: '/corporate-events/,/corporate-events/thanks/',
  source: 'linkedin.com',
  ...overrides,
});

test('Indiana outranks the same activity elsewhere', () => {
  const indiana = scoreCompany({ visits: 2, pages: 1, lastSeen: now.toISOString(), country: 'US', regionCode: 'IN' }, now);
  const ohio = scoreCompany({ visits: 2, pages: 1, lastSeen: now.toISOString(), country: 'US', regionCode: 'OH' }, now);
  const abroad = scoreCompany({ visits: 2, pages: 1, lastSeen: now.toISOString(), country: 'DE', regionCode: 'BE' }, now);
  assert.ok(indiana.total > ohio.total && ohio.total > abroad.total);
  assert.equal(indiana.region, 40);
});

test('recency fades to zero after 30 days', () => {
  const fresh = scoreCompany({ visits: 1, pages: 1, lastSeen: now.toISOString(), country: null, regionCode: null }, now);
  const stale = scoreCompany({ visits: 1, pages: 1, lastSeen: '2026-08-01T00:00:00Z', country: null, regionCode: null }, now);
  assert.equal(fresh.recency, 30);
  assert.equal(stale.recency, 0);
});

test('companies are ranked by score, local ones first when activity ties', () => {
  const ranked = rankCompanies(
    [company({ id: 2, name: 'Far Away Co', domain: 'faraway.example', region_code: 'CA', region: 'California', city: 'Fresno' }), company({})],
    now,
  );
  assert.equal(ranked[0]!.name, 'Cummins Inc.');
  assert.equal(ranked[0]!.local, true);
  assert.match(ranked[0]!.linkedIn, /linkedin\.com\/search\/results\/people/);
});

test('the digest lists every detail asked for', () => {
  const digest = formatDigest(rankCompanies([company({})], now), 7, now);
  assert.match(digest.subject, /1 this week/);
  for (const expected of ['Cummins Inc.', 'cummins.com', 'Columbus, Indiana, US', '3 visits, 2 pages', '/corporate-events/thanks/', 'First seen Oct 21', 'last seen Oct 25', 'Source: linkedin.com', 'LinkedIn: https://', 'INDIANA']) {
    assert.ok(digest.text.includes(expected), `missing: ${expected}\n${digest.text}`);
  }
});

test('an empty week sends a one-line note', () => {
  const digest = formatDigest([], 7, now);
  assert.match(digest.subject, /none this week/);
  assert.equal(digest.text.split('\n').filter(Boolean).length, 1);
});
