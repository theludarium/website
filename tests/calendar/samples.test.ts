// Tests for the sample events: migrations/0009_calendar_samples.sql, written by
// scripts/calendar-samples.ts. They load the real migration files into SQLite,
// so they check the SQL that will run on D1, not a copy of it.
// Run: node --test tests/calendar/samples.test.ts
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { test } from 'node:test';
import { sampleSql } from '../../scripts/calendar-samples.ts';
import { addDays, eventInstants, weekday } from '../../src/lib/calendar/dates.ts';
import { CAL_COMMUNITY, CAL_TZ, EVENT_KIND_KEYS } from '../../src/lib/calendar/shared.ts';
import { tallyRankedChoice } from '../../src/lib/calendar/tally.ts';
import { testDb, type TestDb } from './d1.ts';

const FILE = new URL('../../migrations/0009_calendar_samples.sql', import.meta.url);
const SQL = readFileSync(FILE, 'utf8');
const FIRST = '2026-11-01';
const LAST = '2027-01-31';
const LEVI_CUBES = ['Mono Blue', 'MTGO Vintage Cube', 'Abecedarian Cube - 1st Draft for New Mages', "Levi's Commander Cube #1"];
/** The four Sundays after Monday 2026-11-23, the fixed "today" of the script. */
const VOTE_SUNDAYS = ['2026-11-29', '2026-12-06', '2026-12-13', '2026-12-20'];

type EventRow = {
  id: number; community: string; title: string; kind: string; date: string; start_time: string; end_time: string; tz: string; starts_at: string; ends_at: string;
  description: string; location_name: string; location_address: string | null; cube_mode: string; cube_id: number | null; vote_close_hours: number;
  status: string; is_sample: number; submitter_name: string | null; submitter_email: string | null;
};

const rows = <T>(db: TestDb, sql: string, ...values: (string | number)[]) => db.raw.prepare(sql).all(...values) as T[];
const count = (db: TestDb, table: string, where = '1 = 1') => rows<{ n: number }>(db, `SELECT COUNT(*) AS n FROM ${table} WHERE ${where}`)[0].n;
const events = (db: TestDb) => rows<EventRow>(db, 'SELECT * FROM cal_events WHERE is_sample = 1 ORDER BY date, start_time, id');
const daysInRange = () => {
  const days: string[] = [];
  for (let day = FIRST; day <= LAST; day = addDays(day, 1)) days.push(day);
  return days;
};
/** Everything the samples added, as counts. */
const totals = (db: TestDb) => ({
  events: count(db, 'cal_events', 'is_sample = 1'),
  attendees: count(db, 'cal_attendees'),
  suggestions: count(db, 'cal_cube_suggestions'),
  ballots: count(db, 'cal_ballots'),
});

const db = testDb({ samples: true });
const all = events(db);

test('the file on disk is exactly what the script writes, every time', () => {
  assert.equal(SQL, sampleSql(), 'run: node scripts/calendar-samples.ts');
  assert.equal(sampleSql(), sampleSql());
});

test('the file is plain SQL that D1 will take', () => {
  // D1 runs a file in its own transaction and refuses statements over 100 KB.
  assert.ok(!/^\s*(BEGIN|COMMIT|ROLLBACK|SAVEPOINT|PRAGMA|ATTACH|CREATE|DROP|ALTER)\b/im.test(SQL));
  for (const statement of SQL.split(/;\n/)) assert.ok(Buffer.byteLength(statement) < 100_000);
  // It may read the Cube Library but never write to it, and it only writes cal_ tables.
  const written = [...SQL.matchAll(/\b(?:INSERT INTO|UPDATE|DELETE FROM)\s+(\w+)/g)].map((m) => m[1]);
  assert.deepEqual([...new Set(written)].sort(), ['cal_attendees', 'cal_ballots', 'cal_cube_suggestions', 'cal_events']);
  // Comments stay free of quotes and semicolons, which trip simple SQL splitters.
  for (const line of SQL.split('\n').filter((l) => l.startsWith('--'))) assert.ok(!/[';"]/.test(line), line);
});

test('every day from November 1 through January 31 has at least two events, and weekends have more', () => {
  const perDay = new Map(daysInRange().map((day) => [day, 0]));
  for (const e of all) {
    assert.ok(perDay.has(e.date), `${e.date} is outside the range`);
    perDay.set(e.date, perDay.get(e.date)! + 1);
  }
  assert.equal(perDay.size, 92);
  for (const [day, n] of perDay) assert.ok(n >= 2, `${day} has ${n}`);
  const average = (weekend: boolean) => {
    const days = [...perDay].filter(([day]) => (weekday(day) === 0 || weekday(day) === 6) === weekend);
    return days.reduce((sum, [, n]) => sum + n, 0) / days.length;
  };
  assert.ok(average(true) > average(false) + 0.4, `weekends ${average(true)}, weekdays ${average(false)}`);
});

test('every sample is flagged, approved, at the sample venue, and says it is a sample', () => {
  assert.equal(count(db, 'cal_events', 'is_sample = 0'), 0);
  for (const e of all) {
    assert.equal(e.is_sample, 1);
    assert.equal(e.status, 'approved');
    assert.equal(e.community, CAL_COMMUNITY);
    assert.equal(e.location_name, 'Sample venue, Indianapolis');
    assert.equal(e.location_address, null);
    assert.ok(e.description.startsWith('Sample event. ') && e.description.length > 30, e.description);
    assert.ok(EVENT_KIND_KEYS.includes(e.kind as (typeof EVENT_KIND_KEYS)[number]), e.kind);
    assert.equal(e.vote_close_hours, 24);
    assert.deepEqual([e.submitter_name, e.submitter_email], [null, null]);
  }
  // The SQL finds each event again by its date and start time, so that pair must be unique.
  assert.equal(new Set(all.map((e) => `${e.date} ${e.start_time}`)).size, all.length);
});

test('nothing a person can read has an em dash, an en dash, or a lowercase cube', () => {
  const names = rows<{ name: string }>(db, 'SELECT DISTINCT name FROM cal_attendees').map((r) => r.name);
  const text = [SQL, ...names, ...all.flatMap((e) => [e.title, e.description, e.location_name])].join('\n');
  assert.ok(!/[\u2014\u2013]/.test(text));
  for (const e of all) assert.ok(!/\bcubes?\b/.test(`${e.title} ${e.description}`), e.title);
  assert.ok(!/non-gamer/i.test(text));
});

test('the stored instants match the local times', () => {
  for (const e of all) {
    assert.equal(e.tz, CAL_TZ);
    assert.deepEqual({ startsAt: e.starts_at, endsAt: e.ends_at }, eventInstants(e.date, e.start_time, e.end_time, e.tz), `${e.title} on ${e.date}`);
    // Checked a second way: all of this range is standard time in Indianapolis, five hours behind UTC.
    const endDate = e.end_time <= e.start_time ? addDays(e.date, 1) : e.date;
    assert.equal(e.starts_at, new Date(`${e.date}T${e.start_time}:00-05:00`).toISOString());
    assert.equal(e.ends_at, new Date(`${endDate}T${e.end_time}:00-05:00`).toISOString());
    assert.ok(e.ends_at > e.starts_at);
  }
  assert.ok(all.some((e) => e.end_time < e.start_time), 'at least one event runs past midnight');
});

test('every Sunday has its 1:00 pm draft, and the Cube Quarterly Celebration is on December 5', () => {
  const sundays = daysInRange().filter((day) => weekday(day) === 0);
  assert.equal(sundays.length, 14);
  for (const day of sundays) {
    const draft = all.filter((e) => e.date === day && e.title === 'Sunday Cube Draft');
    assert.equal(draft.length, 1, day);
    assert.deepEqual([draft[0].kind, draft[0].start_time, draft[0].end_time, draft[0].cube_mode], ['draft', '13:00', '16:30', 'vote']);
  }
  assert.equal(all.filter((e) => e.title === 'Sunday Cube Draft').length, sundays.length);
  const cqc = all.filter((e) => e.title === 'Cube Quarterly Celebration');
  assert.equal(cqc.length, 1);
  assert.deepEqual([cqc[0].date, cqc[0].kind, weekday(cqc[0].date)], ['2026-12-05', 'celebration', 6]);
  // The all-day party has the daytime to itself.
  for (const e of all.filter((x) => x.date === '2026-12-05' && x !== cqc[0])) assert.ok(e.start_time >= cqc[0].end_time, e.title);
});

test('titles fit their time of day', () => {
  for (const e of all) {
    const at = `${e.title} at ${e.start_time}`;
    if (/Lunch/.test(e.title)) assert.ok(e.start_time >= '11:00' && e.start_time <= '13:00', at);
    if (/Night/.test(e.title)) assert.ok(e.start_time >= '18:00', at);
    if (/Late Night/.test(e.title)) assert.ok(e.start_time >= '20:00', at);
    if (/Morning|Coffee/.test(e.title)) assert.ok(e.start_time <= '12:00', at);
    if (/Sunday/.test(e.title)) assert.equal(weekday(e.date), 0, at);
  }
  // No title twice on one day.
  assert.equal(new Set(all.map((e) => `${e.date} ${e.title}`)).size, all.length);
});

test('the kinds are mixed, so every mini-Cube color shows up', () => {
  const byKind = new Map<string, number>();
  for (const e of all) byKind.set(e.kind, (byKind.get(e.kind) ?? 0) + 1);
  for (const kind of EVENT_KIND_KEYS) assert.ok((byKind.get(kind) ?? 0) >= 3, `${kind}: ${byKind.get(kind) ?? 0}`);
  // Drafts lead, but stay under two thirds of the calendar.
  const drafts = byKind.get('draft')! / all.length;
  assert.ok(drafts > 0.3 && drafts < 0.66, `drafts are ${drafts}`);
  // Most days show more than one color.
  const mixedDays = daysInRange().filter((day) => new Set(all.filter((e) => e.date === day).map((e) => e.kind)).size > 1).length;
  assert.ok(mixedDays >= 70, `${mixedDays} of 92 days mix kinds`);
});

test('about two thirds of the drafts are a vote, and the rest have a Cube that Levi owns', () => {
  const drafts = all.filter((e) => e.kind === 'draft');
  const votes = drafts.filter((e) => e.cube_mode === 'vote');
  const share = votes.length / drafts.length;
  assert.ok(share > 0.6 && share < 0.73, `vote share is ${share}`);
  for (const e of all) {
    if (e.kind !== 'draft') assert.deepEqual([e.cube_mode, e.cube_id], ['none', null], e.title);
    else assert.ok(e.cube_mode === 'vote' || e.cube_mode === 'set', e.title);
    assert.equal(e.cube_mode === 'set', e.cube_id !== null, `${e.title} on ${e.date}`);
  }
  const set = rows<{ title: string; name: string; owner: string; status: string }>(
    db,
    "SELECT e.title, c.name, c.owner, c.status FROM cal_events e JOIN cubes c ON c.id = e.cube_id WHERE e.is_sample = 1 AND e.cube_mode = 'set'",
  );
  assert.equal(set.length, drafts.length - votes.length);
  for (const s of set) {
    assert.ok(LEVI_CUBES.includes(s.name) && s.owner === 'Levi Wilson' && s.status === 'approved', `${s.title}: ${s.name}`);
    // A title that names a Cube gets that Cube.
    if (/Vintage/.test(s.title)) assert.equal(s.name, 'MTGO Vintage Cube');
    if (/Commander/.test(s.title)) assert.equal(s.name, "Levi's Commander Cube #1");
    if (/New Player/.test(s.title)) assert.equal(s.name, 'Abecedarian Cube - 1st Draft for New Mages');
    assert.ok(!/Pauper|Peasant|Legacy|Set Cube|Sunday/.test(s.title), s.title);
  }
  assert.deepEqual([...new Set(set.map((s) => s.name))].sort(), [...LEVI_CUBES].sort());
});

test('every event has a few sample people going, with tokens no visitor can match', () => {
  const going = new Map(rows<{ event_id: number; n: number }>(db, 'SELECT event_id, COUNT(*) AS n FROM cal_attendees GROUP BY event_id').map((r) => [r.event_id, r.n]));
  for (const e of all) {
    const n = going.get(e.id) ?? 0;
    assert.ok(n >= 2 && n <= 24, `${e.title} on ${e.date} has ${n} going`);
    if (e.title === 'Sunday Cube Draft') assert.ok(n >= 8 && n <= 12, `${e.date}: ${n}`);
    if (e.title === 'Cube Quarterly Celebration') assert.equal(n, 24);
  }
  const people = rows<{ event_id: number; name: string; token_hash: string }>(db, 'SELECT event_id, name, token_hash FROM cal_attendees');
  assert.equal(people.length, [...going.values()].reduce((a, b) => a + b, 0));
  for (const p of people) {
    assert.ok(/^Sample [A-Z][a-z]+$/.test(p.name), p.name);
    // A real token hash is 64 hex characters. These never are.
    assert.ok(p.token_hash.startsWith(`sample:${p.event_id}:`) && !/^[0-9a-f]{64}$/.test(p.token_hash), p.token_hash);
  }
  assert.equal(new Set(people.map((p) => p.token_hash)).size, people.length);
});

test('the next four Sunday drafts have a vote under way: three Cubes, ballots, and a winner', () => {
  const outcomes: { rounds: number; tied: boolean; ballots: number }[] = [];
  for (const day of VOTE_SUNDAYS) {
    const event = all.find((e) => e.date === day && e.title === 'Sunday Cube Draft')!;
    const going = rows<{ id: number }>(db, 'SELECT id FROM cal_attendees WHERE event_id = ?', event.id).map((r) => r.id);
    const suggestions = rows<{ cube_id: number; name: string; owner: string; suggested_by: number | null; bringer_id: number | null }>(
      db,
      'SELECT s.cube_id, c.name, c.owner, s.suggested_by, s.bringer_id FROM cal_cube_suggestions s JOIN cubes c ON c.id = s.cube_id WHERE s.event_id = ? ORDER BY s.id',
      event.id,
    );
    assert.equal(suggestions.length, 3, day);
    for (const s of suggestions) {
      assert.ok(LEVI_CUBES.includes(s.name) && s.owner === 'Levi Wilson', s.name);
      assert.ok(s.suggested_by !== null && going.includes(s.suggested_by));
      assert.ok(s.bringer_id === null || going.includes(s.bringer_id));
    }
    assert.ok(suggestions.some((s) => s.bringer_id !== null) && suggestions.some((s) => s.bringer_id === null), 'one Cube has a bringer and one still needs one');

    const ballots = rows<{ attendee_id: number; ranking: string }>(db, 'SELECT attendee_id, ranking FROM cal_ballots WHERE event_id = ?', event.id);
    const candidates = suggestions.map((s) => s.cube_id);
    for (const b of ballots) {
      assert.ok(going.includes(b.attendee_id));
      const ranking = JSON.parse(b.ranking) as number[];
      assert.deepEqual([...ranking].sort((x, y) => x - y), [...candidates].sort((x, y) => x - y), 'each ballot ranks the three suggested Cubes once');
    }
    const tally = tallyRankedChoice(candidates, ballots.map((b) => JSON.parse(b.ranking) as number[]));
    assert.ok(tally.ballots >= 2 && tally.ballots < going.length, `${day}: ${tally.ballots} ballots`);
    assert.ok(tally.winner !== null && candidates.includes(tally.winner));
    outcomes.push({ rounds: tally.rounds.length, tied: tally.tied, ballots: tally.ballots });
  }
  // The four votes show different states: a runoff, a first-round win, a tie-break, and an early count.
  assert.ok(outcomes.some((o) => o.rounds === 1) && outcomes.some((o) => o.rounds > 1));
  assert.ok(outcomes.some((o) => o.tied) && outcomes.some((o) => !o.tied));
  assert.ok(Math.max(...outcomes.map((o) => o.ballots)) >= 6 && Math.min(...outcomes.map((o) => o.ballots)) <= 3);

  // Votes only hang on vote events, and nowhere else.
  assert.equal(count(db, 'cal_cube_suggestions s JOIN cal_events e ON e.id = s.event_id', "e.cube_mode <> 'vote'"), 0);
  assert.equal(count(db, 'cal_ballots b JOIN cal_events e ON e.id = b.event_id', "e.cube_mode <> 'vote'"), 0);
  assert.ok(rows<{ date: string }>(db, 'SELECT DISTINCT e.date FROM cal_cube_suggestions s JOIN cal_events e ON e.id = s.event_id').every((r) => VOTE_SUNDAYS.includes(r.date)));
});

test('deleting the samples leaves no attendees, suggestions, or ballots behind', () => {
  const fresh = testDb({ samples: true });
  const before = totals(fresh);
  assert.ok(before.events >= 184 && before.attendees > before.events && before.suggestions === 12 && before.ballots > 0);
  const cubes = count(fresh, 'cubes');
  // The same statement the admin route runs. The foreign keys do the rest.
  fresh.exec('DELETE FROM cal_events WHERE is_sample = 1');
  assert.deepEqual(totals(fresh), { events: 0, attendees: 0, suggestions: 0, ballots: 0 });
  assert.equal(count(fresh, 'cal_events'), 0);
  assert.equal(count(fresh, 'cubes'), cubes);
});

test('real events are left alone, on the way in and on the way out', () => {
  const fresh = testDb();
  const cubes = rows<Record<string, unknown>>(fresh, 'SELECT * FROM cubes ORDER BY id');
  fresh.exec(`
    INSERT INTO cal_events (title, date, start_time, end_time, starts_at, ends_at, created_at, updated_at)
      VALUES ('Real Sunday Draft', '2026-11-29', '13:00', '16:30', '2026-11-29T18:00:00.000Z', '2026-11-29T21:30:00.000Z', '2026-11-23T00:00:00.000Z', '2026-11-23T00:00:00.000Z');
    INSERT INTO cal_attendees (event_id, name, token_hash, created_at) VALUES (1, 'Sample Ann', 'real-token-hash', '2026-11-23T00:00:00.000Z');
    INSERT INTO cal_cube_suggestions (event_id, cube_id, suggested_by, created_at) SELECT 1, id, 1, '2026-11-23T00:00:00.000Z' FROM cubes WHERE name = 'Mono Blue';
    INSERT INTO cal_ballots (event_id, attendee_id, ranking, updated_at) SELECT 1, 1, json_array(cube_id), '2026-11-23T00:00:00.000Z' FROM cal_cube_suggestions;
  `);
  const real = () => ({
    event: rows(fresh, 'SELECT * FROM cal_events WHERE is_sample = 0'),
    attendees: rows(fresh, 'SELECT * FROM cal_attendees WHERE event_id = 1'),
    suggestions: rows(fresh, 'SELECT * FROM cal_cube_suggestions WHERE event_id = 1'),
    ballots: rows(fresh, 'SELECT * FROM cal_ballots WHERE event_id = 1'),
  });
  const before = real();
  assert.deepEqual([before.event.length, before.attendees.length, before.suggestions.length, before.ballots.length], [1, 1, 1, 1]);

  fresh.exec(SQL);
  assert.equal(count(fresh, 'cal_events', 'is_sample = 1'), all.length);
  assert.deepEqual(real(), before);
  // The real event shares a date and start time with a sample. The sample people went to the sample only.
  assert.equal(count(fresh, 'cal_attendees', 'event_id = 1'), 1);
  assert.deepEqual(rows(fresh, 'SELECT * FROM cubes ORDER BY id'), cubes);

  fresh.exec('DELETE FROM cal_events WHERE is_sample = 1');
  assert.deepEqual(real(), before);
  assert.deepEqual(totals(fresh), { events: 0, attendees: 1, suggestions: 1, ballots: 1 });
});

test('running the file twice does not double anything', () => {
  const fresh = testDb({ samples: true });
  const once = totals(fresh);
  const picture = () => rows(fresh, 'SELECT title, date, start_time, cube_mode, (SELECT COUNT(*) FROM cal_attendees a WHERE a.event_id = e.id) AS going FROM cal_events e ORDER BY date, start_time');
  const first = picture();
  fresh.exec(SQL);
  assert.deepEqual(totals(fresh), once);
  assert.deepEqual(picture(), first);
});

test('a missing Cube never stops the file: those drafts just stay a vote', () => {
  // One of the named Cubes is gone, and one is waiting for approval again.
  const partly = testDb();
  partly.exec("DELETE FROM cubes WHERE name = 'Mono Blue'; UPDATE cubes SET status = 'pending' WHERE name = 'MTGO Vintage Cube';");
  partly.exec(SQL);
  const left = events(partly);
  assert.equal(left.length, all.length);
  const cubeNames = rows<{ name: string }>(partly, "SELECT DISTINCT c.name FROM cal_events e JOIN cubes c ON c.id = e.cube_id WHERE e.cube_mode = 'set'").map((r) => r.name);
  assert.deepEqual(cubeNames.sort(), ['Abecedarian Cube - 1st Draft for New Mages', "Levi's Commander Cube #1"]);
  for (const e of left) assert.equal(e.cube_mode === 'set', e.cube_id !== null);
  assert.ok(left.filter((e) => e.cube_mode === 'set').length < all.filter((e) => e.cube_mode === 'set').length);
  // Only the Cubes still in the library are suggested, and a ballot that ranks a missing Cube is left out.
  const suggested = rows<{ name: string; status: string }>(partly, 'SELECT c.name, c.status FROM cal_cube_suggestions s JOIN cubes c ON c.id = s.cube_id');
  assert.ok(suggested.length > 0 && suggested.length < 12);
  assert.ok(suggested.every((s) => s.status === 'approved' && s.name !== 'MTGO Vintage Cube'));
  for (const b of rows<{ event_id: number; ranking: string }>(partly, 'SELECT event_id, ranking FROM cal_ballots')) {
    const here = rows<{ cube_id: number }>(partly, 'SELECT cube_id FROM cal_cube_suggestions WHERE event_id = ?', b.event_id).map((r) => r.cube_id);
    assert.ok((JSON.parse(b.ranking) as number[]).every((id) => here.includes(id)));
  }

  // None of Levi's Cubes at all, and then no Cube Library at all.
  for (const wipe of ["DELETE FROM cubes WHERE owner = 'Levi Wilson'", 'DELETE FROM cubes']) {
    const bare = testDb();
    bare.exec(wipe);
    bare.exec(SQL);
    assert.deepEqual(totals(bare), { events: all.length, attendees: count(db, 'cal_attendees'), suggestions: 0, ballots: 0 });
    assert.equal(count(bare, 'cal_events', "cube_mode = 'set' OR cube_id IS NOT NULL"), 0);
    assert.equal(count(bare, 'cal_events', "kind = 'draft' AND cube_mode <> 'vote'"), 0);
  }
});

test('a second Cube with the same name does not double a suggestion or break a ballot', () => {
  const fresh = testDb();
  fresh.exec(`INSERT INTO cubes (name, list_url, owner, location, status, ip_hash, created_at)
    VALUES ('Mono Blue', 'https://example.com/another-mono-blue', 'Levi Wilson', 'Indianapolis', 'approved', 'test', '2026-11-23T00:00:00.000Z')`);
  fresh.exec(SQL);
  assert.deepEqual(totals(fresh), totals(db));
});
