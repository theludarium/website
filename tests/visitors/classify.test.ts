// Runs sample networks through the filter. The IPinfo Lite shapes below are
// recorded from the documented response format; names and domains are the
// well-known owners of each range. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { classify } from '../../src/server/visitors/classify.ts';
import { lookupFromCf, mergeLookup, type IpinfoResponse } from '../../src/server/visitors/lookup.ts';

// Each sample: what Cloudflare hands us, and what IPinfo Lite answers for that IP.
const samples = {
  corporate: {
    ip: '198.51.100.10', // a company that runs its own network
    cf: { asn: 54321, asOrganization: 'Cummins Inc.', country: 'US', regionCode: 'IN', city: 'Columbus' },
    lite: { ip: '198.51.100.10', asn: 'AS54321', as_name: 'Cummins Inc.', as_domain: 'cummins.com' },
  },
  residential: {
    ip: '73.0.0.1', // Comcast home internet
    cf: { asn: 7922, asOrganization: 'Comcast Cable Communications, LLC', country: 'US', regionCode: 'IN', city: 'Indianapolis' },
    lite: { ip: '73.0.0.1', asn: 'AS7922', as_name: 'Comcast Cable Communications, LLC', as_domain: 'comcast.net' },
  },
  aws: {
    ip: '3.5.140.2', // Amazon Web Services
    cf: { asn: 16509, asOrganization: 'Amazon.com, Inc.', country: 'US', regionCode: 'OH', city: 'Columbus' },
    lite: { ip: '3.5.140.2', asn: 'AS16509', as_name: 'Amazon.com, Inc.', as_domain: 'amazon.com' },
  },
  university: {
    ip: '129.79.0.1', // Indiana University
    cf: { asn: 87, asOrganization: 'Indiana University', country: 'US', regionCode: 'IN', city: 'Bloomington' },
    lite: { ip: '129.79.0.1', asn: 'AS87', as_name: 'Indiana University', as_domain: 'iu.edu' },
  },
  mobile: {
    ip: '172.58.0.1', // T-Mobile phone
    cf: { asn: 21928, asOrganization: 'T-Mobile USA, Inc.', country: 'US', regionCode: 'IN', city: 'Carmel' },
    lite: { ip: '172.58.0.1', asn: 'AS21928', as_name: 'T-Mobile USA, Inc.', as_domain: 't-mobile.com' },
  },
} satisfies Record<string, { ip: string; cf: Record<string, unknown>; lite: IpinfoResponse }>;

const run = (s: { cf: Record<string, unknown>; lite: IpinfoResponse }) => classify(mergeLookup(lookupFromCf(s.cf), s.lite));

test('a company with its own network is kept as a business', () => {
  const verdict = run(samples.corporate);
  assert.equal(verdict.keep, true);
  assert.equal(verdict.kind, 'business');
});

test('a residential ISP is dropped', () => {
  const verdict = run(samples.residential);
  assert.equal(verdict.keep, false);
  assert.match(verdict.reason, /isp/);
});

test('a cloud provider is dropped', () => {
  const verdict = run(samples.aws);
  assert.equal(verdict.keep, false);
  assert.match(verdict.reason, /hosting/);
});

test('a university is kept and marked education', () => {
  const verdict = run(samples.university);
  assert.equal(verdict.keep, true);
  assert.equal(verdict.kind, 'education');
});

test('a mobile carrier is dropped', () => {
  assert.equal(run(samples.mobile).keep, false);
});

test('Cloudflare data alone is enough when IPinfo is down', () => {
  const verdict = classify(mergeLookup(lookupFromCf(samples.corporate.cf), null));
  assert.equal(verdict.keep, true);
  assert.equal(classify(mergeLookup(lookupFromCf(samples.residential.cf), null)).keep, false);
});

test('IPinfo Core type and flags win over the name lists', () => {
  const core: IpinfoResponse = { as: { asn: 'AS1', name: 'Some Fine Company', domain: 'fine.example', type: 'isp' } };
  assert.equal(classify(mergeLookup(lookupFromCf(undefined), core)).keep, false);
  const vpn: IpinfoResponse = { as: { name: 'Some Fine Company', type: 'business' }, is_anonymous: true };
  assert.equal(classify(mergeLookup(lookupFromCf(undefined), vpn)).keep, false);
  const biz: IpinfoResponse = { as: { name: 'Some Fine Company', type: 'business' } };
  assert.equal(classify(mergeLookup(lookupFromCf(undefined), biz)).reason, 'business (type)');
});

test('no organization at all is dropped', () => {
  assert.equal(classify({ asn: null, org: null, domain: null, type: null }).keep, false);
});
