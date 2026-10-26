// Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  availableIn,
  center,
  chunk,
  countUnder,
  haversineMeters,
  histogram,
  median,
  minutes,
  percentile,
  publicPoint,
  rankVenues,
  straightLineSeconds,
  venueStats,
} from '../../src/lib/where-we-play/engine.ts';

const carmel = { lat: 39.9784, lng: -86.118 };
const fishers = { lat: 39.9568, lng: -86.0134 };
const downtown = { lat: 39.7684, lng: -86.1581 };

test('haversine: Carmel to Fishers is about 9 kilometers', () => {
  const m = haversineMeters(carmel, fishers);
  assert.ok(m > 8500 && m < 9700, `got ${m}`);
  assert.equal(haversineMeters(carmel, carmel), 0);
});

test('straight-line fallback: Carmel to downtown is about forty minutes', () => {
  const s = straightLineSeconds(carmel, downtown);
  // About 23.5 km as the crow flies, times 1.3, at 28 mph: 41 minutes. The real
  // drive is nearer 30 on the highway; the fallback is meant to be cautious.
  assert.ok(s > 38 * 60 && s < 44 * 60, `got ${s / 60} minutes`);
});

test('median handles odd, even, and empty lists', () => {
  assert.equal(median([5, 1, 3]), 3);
  assert.equal(median([4, 1, 3, 2]), 2.5);
  assert.equal(median([]), null);
});

test('percentile is nearest rank', () => {
  const values = [10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  assert.equal(percentile(values, 0.75), 80);
  assert.equal(percentile(values, 0.5), 50);
  assert.equal(percentile([7], 0.75), 7);
  assert.equal(percentile([], 0.75), null);
});

test('countUnder is strict', () => {
  assert.equal(countUnder([600, 1200, 1199, 3000], 1200), 2);
});

test('center is the plain average', () => {
  assert.equal(center([]), null);
  const c = center([carmel, fishers])!;
  assert.ok(Math.abs(c.lat - 39.9676) < 0.001);
  assert.ok(Math.abs(c.lng - -86.0657) < 0.001);
});

test('histogram buckets by five minutes with an open top', () => {
  const buckets = histogram([0, 4 * 60, 5 * 60, 59 * 60, 60 * 60, 200 * 60], 5, 60);
  assert.equal(buckets.length, 13);
  assert.equal(buckets[0].count, 2);
  assert.equal(buckets[1].count, 1);
  assert.equal(buckets[11].count, 1);
  assert.equal(buckets[12].label, '60+');
  assert.equal(buckets[12].count, 2);
});

test('venueStats summarizes one venue', () => {
  const s = venueStats(7, [5 * 60, 15 * 60, 25 * 60, 45 * 60]);
  assert.equal(s.routed, 4);
  assert.equal(s.medianSeconds, 20 * 60);
  assert.equal(s.p75Seconds, 25 * 60);
  assert.equal(s.underNear, 2);
  assert.equal(s.underNearPct, 50);
  const empty = venueStats(8, []);
  assert.equal(empty.medianSeconds, null);
  assert.equal(empty.underNearPct, 0);
});

test('rankVenues sorts by median, puts unrouted venues last, and honors a member filter', () => {
  const pairs = [
    { memberId: 1, venueId: 10, seconds: 600 },
    { memberId: 2, venueId: 10, seconds: 1800 },
    { memberId: 1, venueId: 20, seconds: 300 },
    { memberId: 2, venueId: 20, seconds: 400 },
  ];
  const all = rankVenues(pairs, [10, 20, 30]);
  assert.deepEqual(
    all.map((v) => v.venueId),
    [20, 10, 30],
  );
  assert.equal(all[2].routed, 0);

  const onlyMember2 = rankVenues(pairs, [10, 20], new Set([2]));
  assert.equal(onlyMember2[0].venueId, 20);
  assert.equal(onlyMember2[0].medianSeconds, 400);
  assert.equal(onlyMember2[1].medianSeconds, 1800);
  assert.equal(onlyMember2[1].routed, 1);
});

test('publicPoint prefers the cross street and never needs the house', () => {
  const cross = { lat: 1, lng: 1 };
  const zip = { lat: 2, lng: 2 };
  assert.equal(publicPoint(cross, zip), cross);
  assert.equal(publicPoint(null, zip), zip);
  assert.equal(publicPoint(null, null), null);
});

test('minutes rounds and passes null through', () => {
  assert.equal(minutes(89), 1);
  assert.equal(minutes(90), 2);
  assert.equal(minutes(null), null);
});

test('chunk splits evenly with a remainder', () => {
  assert.deepEqual(chunk([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
  assert.deepEqual(chunk([], 3), []);
});

test('availableIn picks the members who checked the slot', () => {
  const members = [
    { id: 1, availability: ['tue-eve', 'sat-aft'] },
    { id: 2, availability: [] },
    { id: 3, availability: ['sat-aft'] },
  ];
  assert.deepEqual([...availableIn(members, 'sat-aft')], [1, 3]);
  assert.deepEqual([...availableIn(members, 'mon-eve')], []);
});
