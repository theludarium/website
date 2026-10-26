// Seeds the LOCAL Where We Play tables with sample members and venues so the
// admin page and the member results have something to show. It only ever
// talks to the local D1 database (`wrangler d1 execute --local`); there is
// no flag for the remote one on purpose.
//
//   npm run wwp:seed            add the sample rows (idempotent: clears first)
//   npm run wwp:seed -- --clear remove every wwp_ row locally
//
// Points come from the bundled Census zip centroids with a small nudge, so
// nothing here is a real address. Drive times are straight-line estimates;
// "Retry OSRM" on the admin page replaces them with routed times.
import { execFileSync } from 'node:child_process';
import { writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { straightLineSeconds } from '../src/lib/where-we-play/engine.ts';
import zips from '../src/data/indiana-zips.json' with { type: 'json' };

const DB = 'ludarium-site';
const GROUP = 'cube-commonwealth';
const ZIPS = zips as Record<string, [number, number]>;

const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);
const nudge = (zip: string, dLat: number, dLng: number) => {
  const [lat, lng] = ZIPS[zip];
  return { lat: +(lat + dLat).toFixed(5), lng: +(lng + dLng).toFixed(5) };
};

const members = [
  { first: 'Ada', handle: 'ada', zip: '46032', d: [0.012, -0.01], src: 'address', slots: ['tue-eve', 'thu-eve', 'sat-aft'] },
  { first: 'Ben', handle: 'ben_drafts', zip: '46033', d: [-0.008, 0.006], src: 'address', slots: ['wed-eve', 'sat-eve'] },
  { first: 'Cal', handle: null, zip: '46037', d: [0.004, 0.012], src: 'zip', slots: ['tue-eve', 'sun-aft'] },
  { first: 'Dee', handle: 'dee', zip: '46038', d: [0.01, -0.004], src: 'cross_street', slots: ['thu-eve', 'fri-eve', 'sat-aft'] },
  { first: null, handle: 'ezra', zip: '46074', d: [-0.006, 0.008], src: 'address', slots: ['sat-aft', 'sun-aft'] },
  { first: 'Fay', handle: 'fay', zip: '46077', d: [0.003, -0.011], src: 'zip', slots: ['tue-eve', 'wed-eve'] },
  { first: 'Gus', handle: 'gus', zip: '46060', d: [0.009, 0.009], src: 'address', slots: ['fri-eve', 'sat-eve', 'sun-eve'] },
  { first: 'Hal', handle: null, zip: '46220', d: [-0.005, 0.004], src: 'address', slots: ['tue-eve', 'thu-eve'] },
  { first: 'Ivy', handle: 'ivy', zip: '46240', d: [0.006, -0.007], src: 'cross_street', slots: ['wed-eve', 'sat-aft'] },
  { first: 'Jo', handle: 'jo_cubes', zip: '46256', d: [-0.009, 0.003], src: 'address', slots: ['thu-eve', 'sat-aft', 'sun-aft'] },
  { first: 'Kit', handle: 'kit', zip: '46112', d: [0.005, 0.01], src: 'zip', slots: ['sat-aft'] },
  { first: 'Lou', handle: 'lou', zip: '46204', d: [0.002, -0.003], src: 'address', slots: ['tue-eve', 'wed-eve', 'thu-eve', 'fri-eve'] },
];

const venues = [
  { name: 'Sample Game Store (Carmel)', address: '100 Sample St, Carmel, IN 46032', hood: 'Carmel', zip: '46032', d: [-0.004, 0.006], tables: 10, hours: 'Daily 11 to 10', status: 'confirmed', pub: 1 },
  { name: 'Sample Library Meeting Room (Fishers)', address: '200 Sample Ave, Fishers, IN 46038', hood: 'Fishers', zip: '46038', d: [0.003, 0.003], tables: 6, hours: 'Mon to Thu until 9, Sat until 5', status: 'played here', pub: 1 },
  { name: 'Sample Brewery (Broad Ripple)', address: '300 Sample Blvd, Indianapolis, IN 46220', hood: 'Broad Ripple', zip: '46220', d: [0.002, -0.004], tables: 8, hours: 'Tue to Sun, 4 to 11', status: 'contacted', pub: 0 },
  { name: 'Sample Cafe (Westfield)', address: '400 Sample Rd, Westfield, IN 46074', hood: 'Westfield', zip: '46074', d: [-0.002, 0.002], tables: 4, hours: 'Daily 7 to 8', status: 'idea', pub: 0 },
  { name: 'Sample Pub (Downtown)', address: '500 Sample St, Indianapolis, IN 46204', hood: 'Downtown', zip: '46204', d: [0.001, 0.002], tables: 12, hours: 'Daily 11 to midnight', status: 'confirmed', pub: 0 },
];

const now = new Date().toISOString();
const clear = ['wwp_drive_times', 'wwp_events', 'wwp_venues', 'wwp_members', 'wwp_geocode_cache', 'wwp_rate_limits'].map((t) => `DELETE FROM ${t};`);

let sql = clear;
if (!process.argv.includes('--clear')) {
  const memberPoints = members.map((m) => nudge(m.zip, m.d[0], m.d[1]));
  const venuePoints = venues.map((v) => nudge(v.zip, v.d[0], v.d[1]));
  members.forEach((m, i) => {
    const p = memberPoints[i];
    const zc = ZIPS[m.zip];
    const pub = m.src === 'zip' ? { lat: zc[0], lng: zc[1] } : m.src === 'cross_street' ? p : { lat: zc[0], lng: zc[1] };
    sql.push(
      `INSERT INTO wwp_members (id, "group", email, discord_handle, first_name, zip, street_address, cross_street, lat, lng, geocode_source, public_lat, public_lng, availability, edit_token_hash, created_at, updated_at) VALUES (${i + 1}, ${q(GROUP)}, ${q(`sample${i + 1}@example.com`)}, ${q(m.handle)}, ${q(m.first)}, ${q(m.zip)}, ${q(m.src === 'address' || m.src === 'cross_street' ? `${100 + i} Sample Ln` : null)}, ${q(m.src === 'cross_street' ? 'Sample St and Example Rd' : null)}, ${p.lat}, ${p.lng}, ${q(m.src)}, ${pub.lat}, ${pub.lng}, ${q(JSON.stringify(m.slots))}, ${q(`seed-${i + 1}`)}, ${q(now)}, ${q(now)});`,
    );
  });
  venues.forEach((v, i) => {
    const p = venuePoints[i];
    sql.push(
      `INSERT INTO wwp_venues (id, "group", name, address, lat, lng, neighborhood, table_count, hours, website, call_ahead, notes, status, address_public, approved, created_at, updated_at) VALUES (${i + 1}, ${q(GROUP)}, ${q(v.name)}, ${q(v.address)}, ${p.lat}, ${p.lng}, ${q(v.hood)}, ${v.tables}, ${q(v.hours)}, NULL, ${i === 2 ? 1 : 0}, ${q('Sample venue from the seed script.')}, ${q(v.status)}, ${v.pub}, 1, ${q(now)}, ${q(now)});`,
    );
  });
  // One suggestion waiting in the queue.
  sql.push(
    `INSERT INTO wwp_venues ("group", name, address, neighborhood, status, approved, suggestion_note, created_at, updated_at) VALUES (${q(GROUP)}, 'Sample Suggested Spot (Noblesville)', '600 Sample Way, Noblesville, IN 46060', 'Noblesville', 'idea', 0, 'Big back room, owner is a Cube player.', ${q(now)}, ${q(now)});`,
  );
  members.forEach((_, i) => {
    venues.forEach((_, j) => {
      sql.push(`INSERT INTO wwp_drive_times (member_id, venue_id, seconds, source, computed_at) VALUES (${i + 1}, ${j + 1}, ${straightLineSeconds(memberPoints[i], venuePoints[j])}, 'straight_line', ${q(now)});`);
    });
  });
  sql.push(`INSERT INTO wwp_events ("group", venue_id, date, headcount, notes, created_at) VALUES (${q(GROUP)}, 2, '2026-10-17', 9, 'First sample draft night.', ${q(now)});`);
}

const dir = mkdtempSync(join(tmpdir(), 'wwp-seed-'));
const file = join(dir, 'seed.sql');
writeFileSync(file, sql.join('\n'));
execFileSync('npx', ['wrangler', 'd1', 'execute', DB, '--local', '--file', file], { stdio: 'inherit' });
console.log(process.argv.includes('--clear') ? 'Cleared the local Where We Play tables.' : `Seeded ${members.length} members, ${venues.length} venues, one suggestion, and one event locally.`);
