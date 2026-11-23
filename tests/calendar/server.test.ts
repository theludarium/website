// Tests for the events calendar's server: the public routes, the suggest form,
// and the admin routes. They call the real handlers against real SQL
// (tests/calendar/d1.ts), with the clock fixed at Monday 2026-11-23, 10:00 am
// in Indianapolis. Run: npm test
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join as joinPath } from 'node:path';
import { test, type TestContext } from 'node:test';
import { fileURLToPath } from 'node:url';
import { onRequestGet as listRoute } from '../../functions/api/events/index.ts';
import { onRequestGet as eventRoute, onRequestPost as actionRoute } from '../../functions/api/events/[id].ts';
import { emailText, onRequestPost as suggestRoute } from '../../functions/api/events/suggest.ts';
import { onRequest as adminGuard } from '../../functions/api/where-we-play/admin/_middleware.ts';
import { onRequestGet as adminListRoute, onRequestPost as adminCreateRoute } from '../../functions/api/where-we-play/admin/calendar/index.ts';
import { onRequestDelete as adminDeleteRoute, onRequestGet as adminEventRoute, onRequestPatch as adminPatchRoute } from '../../functions/api/where-we-play/admin/calendar/[id].ts';
import { onRequestDelete as removeAttendeeRoute } from '../../functions/api/where-we-play/admin/calendar/[id]/attendees/[attendeeId].ts';
import { onRequestDelete as removeSuggestionRoute } from '../../functions/api/where-we-play/admin/calendar/[id]/suggestions/[suggestionId].ts';
import { onRequestDelete as deleteSamplesRoute } from '../../functions/api/where-we-play/admin/calendar/samples.ts';
import { addDays, eventInstants } from '../../src/lib/calendar/dates.ts';
import {
  ACTION_MESSAGES, CAL_CAPS, SUGGEST_MESSAGES,
  type AdminCreateBody, type AdminCreateResponse, type AdminEventDetail, type AdminListResponse, type AttendResponse, type EventListResponse, type EventPayload,
} from '../../src/lib/calendar/shared.ts';
import { insertEvents } from '../../src/server/calendar/db.ts';
import type { CalEnv } from '../../src/server/calendar/env.ts';
import { PER_HOUR, rateKey } from '../../src/server/calendar/guard.ts';
import { isCrossSiteWrite } from '../../src/server/where-we-play/access.ts';
import type { D1, D1Statement } from '../../src/server/where-we-play/env.ts';
import { sha256Hex } from '../../src/server/where-we-play/http.ts';
import { TOKEN_PATTERN } from '../../src/server/where-we-play/tokens.ts';
import { testDb, type TestDb } from './d1.ts';

// ---------- The world each test builds ----------

const NOW = new Date('2026-11-23T15:00:00.000Z');
const HOUR = 3_600_000;
const SITE = 'https://theludarium.com';
const TZ = 'America/Indiana/Indianapolis';
const IP = '203.0.113.7';
const ADMIN = '/api/where-we-play/admin/calendar';
// Cubes from the seeded Cube Library. 41 is the one still waiting for approval.
const [CUBE_A, CUBE_B, CUBE_C, CUBE_D, PENDING_CUBE] = [3, 5, 6, 7, 41];

type Mail = { subject: string; text: string; replyTo?: string };
type World = { db: TestDb; env: CalEnv; mail: Mail[]; notify: { status: number } };
type Answer<T> = { status: number; headers: Headers; body: T & { error?: string } };

/** A fresh database, a fixed clock, and a stand-in for the email Worker that records what it was sent. */
function world(t: TestContext, env: Partial<CalEnv> = {}, db = testDb()): World {
  t.mock.timers.enable({ apis: ['Date'], now: NOW });
  const mail: Mail[] = [];
  const notify = { status: 200 };
  const NOTIFY = {
    fetch: async (_input: string, init?: RequestInit) => {
      mail.push(JSON.parse(String(init?.body)) as Mail);
      return new Response('', { status: notify.status });
    },
  };
  return { db, mail, notify, env: { DB: db, NOTIFY, ...env } };
}

const quiet = (t: TestContext) => t.mock.method(console, 'error', () => {});

async function read<T>(res: Response): Promise<Answer<T>> {
  return { status: res.status, headers: res.headers, body: (await res.json()) as T & { error?: string } };
}

function jsonRequest(method: string, path: string, body?: unknown, headers: Record<string, string> = {}): Request {
  return new Request(SITE + path, {
    method,
    headers: { 'Content-Type': 'application/json', 'CF-Connecting-IP': IP, ...headers },
    body: body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body),
  });
}

const tokenHeader = (token?: string | null): Record<string, string> => (token ? { 'X-Attendee-Token': token } : {});

// The public routes.
const list = async (w: World, query: string) => read<EventListResponse>(await listRoute({ request: new Request(`${SITE}/api/events?${query}`), env: w.env, params: {} }));
const view = async (w: World, id: number | string, token?: string | null) =>
  read<EventPayload>(await eventRoute({ request: jsonRequest('GET', `/api/events/${id}`, undefined, tokenHeader(token)), env: w.env, params: { id: String(id) } }));
const act = async (w: World, id: number | string, body: unknown, token?: string | null, ip = IP) =>
  read<AttendResponse>(await actionRoute({ request: jsonRequest('POST', `/api/events/${id}`, body, { ...tokenHeader(token), 'CF-Connecting-IP': ip }), env: w.env, params: { id: String(id) } }));

// The admin routes, called directly. One test below puts the admin middleware in front of them.
const adminList = async (w: World) => read<AdminListResponse>(await adminListRoute({ request: jsonRequest('GET', ADMIN), env: w.env, params: {} }));
const adminCreate = async (w: World, body: unknown) => read<AdminCreateResponse>(await adminCreateRoute({ request: jsonRequest('POST', ADMIN, body), env: w.env, params: {} }));
const adminView = async (w: World, id: number | string) => read<AdminEventDetail>(await adminEventRoute({ request: jsonRequest('GET', `${ADMIN}/${id}`), env: w.env, params: { id: String(id) } }));
const adminPatch = async (w: World, id: number | string, body: unknown) =>
  read<{ id: number }>(await adminPatchRoute({ request: jsonRequest('PATCH', `${ADMIN}/${id}`, body), env: w.env, params: { id: String(id) } }));
const adminDelete = async (w: World, id: number | string) =>
  read<{ deleted: number }>(await adminDeleteRoute({ request: jsonRequest('DELETE', `${ADMIN}/${id}`), env: w.env, params: { id: String(id) } }));

const DRAFT = { title: 'Sunday Cube Draft', date: '2026-11-29', startTime: '13:00', endTime: '16:30' };

/** Creates an event through the admin route. By default: a draft next Sunday afternoon whose Cube is put to a vote. */
async function addEvent(w: World, over: AdminCreateBody = {}): Promise<number> {
  const res = await adminCreate(w, { ...DRAFT, ...over });
  assert.equal(res.status, 201, JSON.stringify(res.body));
  return res.body.ids[0];
}

/** Writes an event row directly, for states the admin form cannot make: samples, other communities, private columns. */
function rawEvent(w: World, over: Record<string, string | number | null> = {}): number {
  const row: Record<string, string | number | null> = {
    community: 'cube-commonwealth', title: 'Sunday Cube Draft', kind: 'draft', date: DRAFT.date, start_time: DRAFT.startTime, end_time: DRAFT.endTime, tz: TZ,
    cube_mode: 'vote', status: 'approved', is_sample: 0, created_at: NOW.toISOString(), updated_at: NOW.toISOString(), ...over,
  };
  const { startsAt, endsAt } = eventInstants(String(row.date), String(row.start_time), String(row.end_time), TZ);
  Object.assign(row, { starts_at: startsAt, ends_at: endsAt });
  const keys = Object.keys(row);
  const result = w.db.raw.prepare(`INSERT INTO cal_events (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...Object.values(row));
  return Number(result.lastInsertRowid);
}

/** Says "I'm going" and returns the new attendee with their private token. */
async function join(w: World, eventId: number, name: string, ip = IP): Promise<{ id: number; token: string }> {
  const res = await act(w, eventId, { action: 'attend', name }, null, ip);
  assert.equal(res.status, 200, `attend as ${name}: ${JSON.stringify(res.body)}`);
  return { id: res.body.me!.id, token: res.body.token };
}

/** Suggests a Cube and returns the suggestion's id. */
async function suggest(w: World, eventId: number, cubeId: number, token: string, canBring = false): Promise<number> {
  const res = await act(w, eventId, { action: 'suggest', cubeId, canBring }, token);
  assert.equal(res.status, 200, `suggest ${cubeId}: ${JSON.stringify(res.body)}`);
  return res.body.suggestions.find((s) => s.cube.id === cubeId)!.id;
}

const count = (w: World, sql: string, ...values: (string | number)[]) => Number((w.db.raw.prepare(`SELECT COUNT(*) AS n FROM ${sql}`).get(...values) as { n: number }).n);
const row = <T = Record<string, unknown>>(w: World, sql: string, ...values: (string | number)[]) => ({ ...(w.db.raw.prepare(sql).get(...values) as object) }) as T;
const refused = (res: Answer<unknown>, status: number, error: keyof typeof ACTION_MESSAGES, note = '') => assert.deepEqual([res.status, res.body], [status, { error }], note);

/**
 * A database where `rival` runs just after the first read whose SQL matches, the
 * way a second request would land between this one's check and its write.
 */
function withRival(db: TestDb, pattern: RegExp, rival: () => void): D1 {
  let waiting = true;
  const after = <T>(value: T): T => {
    if (waiting) {
      waiting = false;
      rival();
    }
    return value;
  };
  const wrap = (statement: D1Statement): D1Statement => ({
    bind: (...values) => wrap(statement.bind(...values)),
    first: async <T>() => after(await statement.first<T>()),
    all: async <T>() => after(await statement.all<T>()),
    run: () => statement.run(),
  });
  return { prepare: (sql) => (pattern.test(sql) ? wrap(db.prepare(sql)) : db.prepare(sql)), batch: (statements) => db.batch(statements) };
}

// ---------- GET /api/events ----------

test('the list answers approved and cancelled events in the range, earliest first', async (t) => {
  const w = world(t);
  const afternoon = await addEvent(w, { locationName: 'The Table' });
  const morning = await addEvent(w, { title: 'Cube Design Class', kind: 'class', startTime: '10:00', endTime: '12:00' });
  const twin = await addEvent(w, { title: 'Second Table' });
  const cancelled = await addEvent(w, { title: 'Called Off', date: '2026-12-02', status: 'cancelled' });
  await addEvent(w, { title: 'Waiting', date: '2026-12-03', status: 'pending' });
  await addEvent(w, { title: 'Turned Down', date: '2026-12-04', status: 'rejected' });
  await addEvent(w, { title: 'Too Late', date: '2026-12-11' });
  await addEvent(w, { title: 'Too Early', date: '2026-11-22' });
  const sample = rawEvent(w, { title: 'Sample Draft', date: '2026-11-30', is_sample: 1 });
  rawEvent(w, { title: 'Chess Night', community: 'chess-club' });

  const res = await list(w, 'from=2026-11-23&to=2026-12-10');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'public, max-age=20');
  assert.deepEqual(res.body.events.map((e) => [e.id, e.status]), [[morning, 'approved'], [afternoon, 'approved'], [twin, 'approved'], [cancelled, 'cancelled']]);
  assert.deepEqual(res.body.events[1], {
    id: afternoon, title: 'Sunday Cube Draft', kind: 'draft', date: '2026-11-29', startTime: '13:00', endTime: '16:30', locationName: 'The Table',
    status: 'approved', going: 0, cubeMode: 'vote', cubeName: null, isSample: false,
  });

  // The first and last day of the range both count.
  assert.deepEqual((await list(w, 'from=2026-11-29&to=2026-12-02')).body.events.length, 4);
  assert.deepEqual((await list(w, 'from=2026-11-30&to=2026-12-01')).body.events, []);

  // Samples come only when asked for, and say what they are.
  const withSamples = await list(w, 'from=2026-11-23&to=2026-12-10&samples=1');
  assert.deepEqual(withSamples.body.events.map((e) => [e.id, e.isSample]), [[morning, false], [afternoon, false], [twin, false], [sample, true], [cancelled, false]]);
  assert.deepEqual((await list(w, 'from=2026-11-23&to=2026-12-10&samples=yes')).body.events.length, 4);

  // The limit keeps the earliest events and stays between 1 and 500.
  assert.deepEqual((await list(w, 'from=2026-11-23&to=2026-12-10&limit=2')).body.events.map((e) => e.id), [morning, afternoon]);
  assert.deepEqual((await list(w, 'from=2026-11-23&to=2026-12-10&limit=0')).body.events.map((e) => e.id), [morning]);
  for (const limit of ['9999', 'lots', '', '2.5']) assert.equal((await list(w, `from=2026-11-23&to=2026-12-10&limit=${limit}`)).body.events.length, 4, limit);
});

test('the list counts who is going and names only an approved Cube', async (t) => {
  const w = world(t);
  const vote = await addEvent(w);
  const set = await addEvent(w, { title: 'Vintage Night', date: '2026-11-30', cubeMode: 'set', cubeId: CUBE_A });
  await join(w, vote, 'Sam');
  await join(w, vote, 'Ann');
  const name = row<{ name: string }>(w, 'SELECT name FROM cubes WHERE id = ?', CUBE_A).name;

  const events = (await list(w, 'from=2026-11-29&to=2026-11-30')).body.events;
  assert.deepEqual(events.map((e) => [e.id, e.going, e.cubeMode, e.cubeName]), [[vote, 2, 'vote', null], [set, 0, 'set', name]]);

  // A Cube that has left the library no longer shows, though the event still points at it.
  w.db.exec(`UPDATE cubes SET status = 'rejected' WHERE id = ${CUBE_A}`);
  assert.equal((await list(w, 'from=2026-11-30&to=2026-11-30')).body.events[0].cubeName, null);
});

test('the list refuses a missing, backwards, or oversized range', async (t) => {
  const w = world(t);
  const tooFar = addDays('2026-11-23', CAL_CAPS.rangeDays + 1);
  for (const query of ['', 'from=2026-11-23', 'to=2026-11-30', 'from=2026-11-31&to=2026-12-05', 'from=11/23/2026&to=2026-12-05', 'from=2026-12-05&to=2026-11-23', `from=2026-11-23&to=${tooFar}`]) {
    const res = await list(w, query);
    refused(res, 400, 'bad', query);
    assert.equal(res.headers.get('Cache-Control'), 'no-store');
  }
  assert.equal((await list(w, `from=2026-11-23&to=${addDays('2026-11-23', CAL_CAPS.rangeDays)}`)).status, 200);
  assert.equal((await list(w, 'from=2026-11-23&to=2026-11-23')).status, 200);
});

// ---------- GET /api/events/:id ----------

test('an event answers its details, with nobody going and nothing to count yet', async (t) => {
  const w = world(t);
  const id = await addEvent(w, { description: 'Bring sleeves.\n\nNew players welcome.', locationName: 'The Table', locationAddress: '1 Main St, Carmel, IN' });
  const res = await view(w, id);
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.deepEqual(res.body, {
    event: {
      id, title: 'Sunday Cube Draft', kind: 'draft', date: '2026-11-29', startTime: '13:00', endTime: '16:30', locationName: 'The Table',
      status: 'approved', going: 0, cubeMode: 'vote', cubeName: null, isSample: false,
      description: 'Bring sleeves.\n\nNew players welcome.', locationAddress: '1 Main St, Carmel, IN', tz: TZ,
      startsAt: '2026-11-29T18:00:00.000Z', endsAt: '2026-11-29T21:30:00.000Z', voteClosesAt: '2026-11-28T18:00:00.000Z',
      cube: null, rsvpOpen: true, votingOpen: true,
    },
    attendees: [],
    suggestions: [],
    tally: { ballots: 0, winner: null, tied: false, rounds: [] },
    me: null,
  });
});

test('an event with a set Cube shows the Cube and has no vote', async (t) => {
  const w = world(t);
  const id = await addEvent(w, { cubeMode: 'set', cubeId: CUBE_A });
  const cube = row<Record<string, string | number | null>>(w, 'SELECT * FROM cubes WHERE id = ?', CUBE_A);
  const { event } = (await view(w, id)).body;
  assert.deepEqual(event.cube, {
    id: CUBE_A, name: cube.name, listUrl: cube.list_url, owner: cube.owner, style: cube.style, cardCount: cube.card_count,
    lending: cube.lending, imageUrl: cube.image_url, imageArtist: cube.image_artist,
  });
  assert.ok(event.cube?.imageUrl?.startsWith('https://assets.cubecobra.com/'));
  assert.deepEqual([event.cubeMode, event.cubeName, event.voteClosesAt, event.votingOpen, event.rsvpOpen], ['set', cube.name, null, false, true]);

  const none = await addEvent(w, { title: 'Meetup', kind: 'meetup' });
  const meetup = (await view(w, none)).body.event;
  assert.deepEqual([meetup.cubeMode, meetup.cube, meetup.voteClosesAt, meetup.votingOpen], ['none', null, null, false]);
});

test('an event that is unknown, pending, or rejected is gone, and so is a bad id', async (t) => {
  const w = world(t);
  const pending = await addEvent(w, { status: 'pending' });
  const rejected = await addEvent(w, { status: 'rejected' });
  for (const id of [pending, rejected, 9999, 0, -1, '1.5', 'abc', '1 OR 1=1']) {
    refused(await view(w, id), 404, 'gone', `GET ${id}`);
    refused(await act(w, id, { action: 'attend', name: 'Sam' }), 404, 'gone', `POST ${id}`);
  }
  assert.equal(count(w, 'cal_attendees'), 0);
});

test('with a token the event knows the caller, and without a good one it does not', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const mine = await suggest(w, id, CUBE_A, sam.token, true);
  const hers = await suggest(w, id, CUBE_B, ann.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_B, CUBE_A] }, sam.token);

  const asSam = (await view(w, id, sam.token)).body;
  assert.deepEqual(asSam.me, { id: sam.id, name: 'Sam', ranking: [CUBE_B, CUBE_A] });
  assert.deepEqual(asSam.suggestions.map((s) => [s.id, s.suggestedBy, s.bringer, s.mine, s.iBring]), [[mine, 'Sam', 'Sam', true, true], [hers, 'Ann', null, false, false]]);

  const asAnn = (await view(w, id, ann.token)).body;
  assert.deepEqual(asAnn.me, { id: ann.id, name: 'Ann', ranking: [] });
  assert.deepEqual(asAnn.suggestions.map((s) => [s.mine, s.iBring]), [[false, false], [true, false]]);

  for (const token of [null, 'short', 'x'.repeat(43), `${sam.token}x`.slice(1), sam.token.toUpperCase()]) {
    const anyone = (await view(w, id, token)).body;
    assert.equal(anyone.me, null, String(token));
    assert.ok(anyone.suggestions.every((s) => !s.mine && !s.iBring));
    assert.equal(anyone.attendees.length, 2);
  }
});

// ---------- POST /api/events/:id: attend ----------

test('attend: a name is all it takes, and the answer carries a private token', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const res = await act(w, id, { action: 'attend', name: '  Sam   W. ' });
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('Cache-Control'), 'no-store');
  assert.match(res.body.token, TOKEN_PATTERN);
  assert.deepEqual(res.body.me, { id: res.body.me!.id, name: 'Sam W.', ranking: [] });
  assert.deepEqual(res.body.attendees, [{ id: res.body.me!.id, name: 'Sam W.' }]);
  assert.equal(res.body.event.going, 1);

  // Only a hash of the token is stored, and nothing about the caller's address.
  const stored = row<Record<string, string | number>>(w, 'SELECT * FROM cal_attendees');
  assert.equal(stored.token_hash, await sha256Hex(`cal-attendee:${res.body.token}`));
  assert.ok(!('ip_hash' in stored));
  assert.deepEqual([stored.event_id, stored.name, stored.created_at], [id, 'Sam W.', NOW.toISOString()]);
  assert.ok(!JSON.stringify(stored).includes(res.body.token) && !JSON.stringify(stored).includes(IP));

  // A second person joins the same list, and the first is still known by their token.
  const ann = await join(w, id, '@ann_drafts');
  const again = (await view(w, id, res.body.token)).body;
  assert.deepEqual(again.attendees.map((a) => a.name), ['Sam W.', '@ann_drafts']);
  assert.equal(again.me?.name, 'Sam W.');
  assert.notEqual(ann.token, res.body.token);
});

test('attend: a missing or unusable name is refused', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  for (const name of ['', '   ', '...', 'x'.repeat(41), null, 42, ['Sam']]) refused(await act(w, id, { action: 'attend', name }), 400, 'name', String(name));
  refused(await act(w, id, { action: 'attend' }), 400, 'name');
  assert.equal(count(w, 'cal_attendees'), 0);
});

test('attend: a name is unique within an event, ignoring case', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const other = await addEvent(w, { date: '2026-12-06' });
  await join(w, id, 'Sam W.');
  await join(w, id, 'Zoë');
  for (const name of ['Sam W.', 'sam w.', 'SAM W.', '  sam   W. ', 'ZOË', 'zoë']) refused(await act(w, id, { action: 'attend', name }), 409, 'name-taken', name);
  assert.equal(count(w, 'cal_attendees WHERE event_id = ?', id), 2);

  // The same name is free on another event, and a different one is free here.
  await join(w, other, 'sam w.');
  await join(w, id, 'Sam X.');
});

test('attend: when two people take one name at the same moment, the index lets one in', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const rival = () => w.db.exec(`INSERT INTO cal_attendees (event_id, name, token_hash, created_at) VALUES (${id}, 'SAM', 'rival', 'now')`);
  const racing: World = { ...w, env: { ...w.env, DB: withRival(w.db, /FROM cal_attendees WHERE event_id/, rival) } };
  refused(await act(racing, id, { action: 'attend', name: 'Sam' }), 409, 'name-taken');
  assert.deepEqual(w.db.raw.prepare('SELECT name FROM cal_attendees').all().map((r) => r.name), ['SAM']);

  // Two real requests side by side: one gets in, the other is told the name is taken.
  const both = await Promise.all([act(w, id, { action: 'attend', name: 'Ann' }), act(w, id, { action: 'attend', name: 'ann' })]);
  assert.deepEqual(both.map((r) => r.status).sort(), [200, 409]);
  assert.equal(both.find((r) => r.status === 409)?.body.error, 'name-taken');
  assert.equal(count(w, "cal_attendees WHERE name = 'Ann' COLLATE NOCASE"), 1);
});

test('attend: an event that is over, or full, takes nobody new', async (t) => {
  const w = world(t);
  const over = await addEvent(w, { date: '2026-11-22' });
  refused(await act(w, over, { action: 'attend', name: 'Sam' }), 409, 'rsvp-closed');
  // A closed list is reported before a bad name is.
  refused(await act(w, over, { action: 'attend', name: '' }), 409, 'rsvp-closed');

  // Under way but not over yet: still open.
  const underWay = await addEvent(w, { date: '2026-11-23', startTime: '09:00', endTime: '12:00' });
  await join(w, underWay, 'Sam');
  t.mock.timers.setTime(Date.parse('2026-11-23T17:00:00.000Z'));
  refused(await act(w, underWay, { action: 'attend', name: 'Ann' }), 409, 'rsvp-closed');
  t.mock.timers.setTime(NOW.getTime());

  const full = await addEvent(w, { date: '2026-12-06' });
  const insert = w.db.raw.prepare('INSERT INTO cal_attendees (event_id, name, token_hash, created_at) VALUES (?, ?, ?, ?)');
  for (let i = 1; i < CAL_CAPS.attendeesPerEvent; i += 1) insert.run(full, `Guest ${i}`, `hash-${i}`, NOW.toISOString());
  await join(w, full, 'The Last One');
  refused(await act(w, full, { action: 'attend', name: 'One Too Many' }), 409, 'full');
  // Full is reported before a taken name is.
  refused(await act(w, full, { action: 'attend', name: 'guest 1' }), 409, 'full');
  assert.equal(count(w, 'cal_attendees WHERE event_id = ?', full), CAL_CAPS.attendeesPerEvent);
});

test('attend: Turnstile is checked when the secret is set, and only for attend', async (t) => {
  const w = world(t, { TURNSTILE_SECRET_KEY: 'the-secret' });
  const id = await addEvent(w);
  const sent: FormData[] = [];
  let human = false;
  t.mock.method(globalThis, 'fetch', async (url: string | URL | Request, init?: RequestInit) => {
    assert.equal(String(url), 'https://challenges.cloudflare.com/turnstile/v0/siteverify');
    sent.push(init?.body as FormData);
    return new Response(JSON.stringify({ success: human }));
  });

  refused(await act(w, id, { action: 'attend', name: 'Sam' }), 403, 'verify');
  refused(await act(w, id, { action: 'attend', name: 'Sam', turnstileToken: '' }), 403, 'verify');
  refused(await act(w, id, { action: 'attend', name: 'Sam', turnstileToken: 42 }), 403, 'verify');
  assert.equal(sent.length, 0, 'no token, nothing to verify');
  refused(await act(w, id, { action: 'attend', name: 'Sam', turnstileToken: 'robot' }), 403, 'verify');
  assert.equal(sent.length, 1);
  // A bad name is caught before the token is spent.
  refused(await act(w, id, { action: 'attend', name: '', turnstileToken: 'person' }), 400, 'name');
  assert.equal(sent.length, 1);
  assert.equal(count(w, 'cal_attendees'), 0);

  human = true;
  const res = await act(w, id, { action: 'attend', name: 'Sam', turnstileToken: 'person' });
  assert.equal(res.status, 200);
  assert.deepEqual([sent[1].get('secret'), sent[1].get('response'), sent[1].get('remoteip')], ['the-secret', 'person', IP]);
  // A token works once. A taken name is caught before it is spent, so the visitor can fix the name and send again.
  refused(await act(w, id, { action: 'attend', name: 'sam', turnstileToken: 'second' }), 409, 'name-taken');
  assert.equal(sent.length, 2);
  assert.equal((await act(w, id, { action: 'attend', name: 'Sam W.', turnstileToken: 'second' })).status, 200);
  assert.equal(sent[2].get('response'), 'second');

  // Everything after attend rides on the attendee token alone.
  assert.equal((await act(w, id, { action: 'suggest', cubeId: CUBE_A }, res.body.token)).status, 200);
  assert.equal((await act(w, id, { action: 'leave' }, res.body.token)).status, 200);
  assert.equal(sent.length, 3);
});

// ---------- POST /api/events/:id: leave ----------

test('leave: the attendee and their ballot go, their suggestions stay unsigned', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const suggestion = await suggest(w, id, CUBE_A, sam.token, true);
  await act(w, id, { action: 'vote', ranking: [CUBE_A] }, sam.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_A] }, ann.token);

  const res = await act(w, id, { action: 'leave' }, sam.token);
  assert.equal(res.status, 200);
  assert.equal(res.body.me, null);
  assert.equal(Object.hasOwn(res.body, 'token'), false, 'only attend hands out a token');
  assert.deepEqual(res.body.attendees, [{ id: ann.id, name: 'Ann' }]);
  assert.equal(res.body.event.going, 1);
  assert.deepEqual(res.body.suggestions.map((s) => [s.id, s.cube.id, s.suggestedBy, s.bringer]), [[suggestion, CUBE_A, null, null]]);
  assert.equal(res.body.tally.ballots, 1);

  assert.equal(count(w, 'cal_attendees WHERE id = ?', sam.id), 0);
  assert.equal(count(w, 'cal_ballots WHERE attendee_id = ?', sam.id), 0);
  assert.deepEqual(row(w, 'SELECT suggested_by, bringer_id FROM cal_cube_suggestions WHERE id = ?', suggestion), { suggested_by: null, bringer_id: null });

  // The token is spent, and the name is free again.
  refused(await act(w, id, { action: 'leave' }, sam.token), 401, 'not-attending');
  assert.equal((await view(w, id, sam.token)).body.me, null);
  await join(w, id, 'Sam');
});

test('leave: works after the event is over, and needs a token', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  for (const token of [null, 'nonsense', 'y'.repeat(43)]) refused(await act(w, id, { action: 'leave' }, token), 401, 'not-attending', String(token));
  t.mock.timers.setTime(Date.parse('2026-12-01T00:00:00.000Z'));
  assert.equal((await view(w, id)).body.event.rsvpOpen, false);
  assert.equal((await act(w, id, { action: 'leave' }, sam.token)).status, 200);
  assert.equal(count(w, 'cal_attendees'), 0);
});

// ---------- POST /api/events/:id: suggest and withdraw ----------

test('suggest: someone going puts a Cube from the library forward', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const cube = row<Record<string, string | number | null>>(w, 'SELECT * FROM cubes WHERE id = ?', CUBE_A);

  const res = await act(w, id, { action: 'suggest', cubeId: CUBE_A }, sam.token);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.suggestions, [
    {
      id: res.body.suggestions[0].id,
      cube: { id: CUBE_A, name: cube.name, listUrl: cube.list_url, owner: cube.owner, style: cube.style, cardCount: cube.card_count, lending: cube.lending, imageUrl: cube.image_url, imageArtist: cube.image_artist },
      suggestedBy: 'Sam', bringer: null, mine: true, iBring: false,
    },
  ]);
  assert.equal(res.body.me?.name, 'Sam');

  // "I can bring it" makes the suggester the bringer. Anything but true does not.
  const brought = await act(w, id, { action: 'suggest', cubeId: CUBE_B, canBring: true }, ann.token);
  assert.deepEqual(brought.body.suggestions.map((s) => [s.cube.id, s.suggestedBy, s.bringer, s.mine, s.iBring]), [[CUBE_A, 'Sam', null, false, false], [CUBE_B, 'Ann', 'Ann', true, true]]);
  const loose = await act(w, id, { action: 'suggest', cubeId: CUBE_C, canBring: 'yes' }, ann.token);
  assert.equal(loose.body.suggestions[2].bringer, null);
  assert.equal(row<{ created_at: string }>(w, 'SELECT created_at FROM cal_cube_suggestions WHERE cube_id = ?', CUBE_C).created_at, NOW.toISOString());
});

test('suggest: each refusal has its own code', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');

  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_A }), 401, 'not-attending');
  for (const cubeId of [9999, PENDING_CUBE, 0, -3, 1.5, String(CUBE_A), null, undefined]) refused(await act(w, id, { action: 'suggest', cubeId }, sam.token), 400, 'cube', String(cubeId));
  assert.equal(count(w, 'cal_cube_suggestions'), 0);

  await suggest(w, id, CUBE_A, sam.token);
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_A }, ann.token), 409, 'duplicate');
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_A }, sam.token), 409, 'duplicate');

  // Three each.
  await suggest(w, id, CUBE_B, sam.token);
  await suggest(w, id, CUBE_C, sam.token);
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_D }, sam.token), 409, 'limit');
  // A Cube already on the list is reported as such, even at the limit.
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_B }, sam.token), 409, 'duplicate');

  // Twelve for the event. Ann has room of her own, but the event does not.
  const insert = w.db.raw.prepare('INSERT INTO cal_cube_suggestions (event_id, cube_id, created_at) VALUES (?, ?, ?)');
  for (let cubeId = 10; cubeId < 18; cubeId += 1) insert.run(id, cubeId, NOW.toISOString());
  await suggest(w, id, CUBE_D, ann.token);
  assert.equal(count(w, 'cal_cube_suggestions WHERE event_id = ?', id), CAL_CAPS.suggestionsPerEvent);
  refused(await act(w, id, { action: 'suggest', cubeId: 20 }, ann.token), 409, 'limit');

  // Withdrawing one makes room again.
  const mine = (await view(w, id, ann.token)).body.suggestions.find((s) => s.mine)!;
  assert.equal((await act(w, id, { action: 'withdraw', suggestionId: mine.id }, ann.token)).status, 200);
  await suggest(w, id, 20, ann.token);
});

test('suggest: when two people suggest one Cube at the same moment, the index keeps one', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const rival = () => w.db.exec(`INSERT INTO cal_cube_suggestions (event_id, cube_id, created_at) VALUES (${id}, ${CUBE_A}, 'now')`);
  const racing: World = { ...w, env: { ...w.env, DB: withRival(w.db, /AS approved/, rival) } };
  refused(await act(racing, id, { action: 'suggest', cubeId: CUBE_A }, sam.token), 409, 'duplicate');
  assert.equal(count(w, 'cal_cube_suggestions'), 1);
});

test('withdraw: only the person who suggested a Cube can take it back', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const other = await addEvent(w, { date: '2026-12-06' });
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const samElsewhere = await join(w, other, 'Sam');
  const mine = await suggest(w, id, CUBE_A, sam.token);
  const hers = await suggest(w, id, CUBE_B, ann.token);
  const elsewhere = await suggest(w, other, CUBE_C, samElsewhere.token);

  refused(await act(w, id, { action: 'withdraw', suggestionId: mine }), 401, 'not-attending');
  refused(await act(w, id, { action: 'withdraw', suggestionId: hers }, sam.token), 403, 'not-yours');
  // A suggestion on another event does not exist as far as this one is concerned.
  for (const suggestionId of [9999, elsewhere, String(mine), null, undefined, 1.5]) refused(await act(w, id, { action: 'withdraw', suggestionId }, sam.token), 404, 'bad', String(suggestionId));
  assert.equal(count(w, 'cal_cube_suggestions'), 3);

  const res = await act(w, id, { action: 'withdraw', suggestionId: mine }, sam.token);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.suggestions.map((s) => s.id), [hers]);
  refused(await act(w, id, { action: 'withdraw', suggestionId: mine }, sam.token), 404, 'bad');

  // Once the suggester has left, the Cube belongs to the table, so anyone going can clear it.
  await act(w, id, { action: 'leave' }, ann.token);
  assert.equal((await act(w, id, { action: 'withdraw', suggestionId: hers }, sam.token)).status, 200);
});

// ---------- POST /api/events/:id: bring ----------

test('bring: one person at a time can offer to bring a Cube', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const other = await addEvent(w, { date: '2026-12-06' });
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const samElsewhere = await join(w, other, 'Sam');
  const suggestion = await suggest(w, id, CUBE_A, sam.token);
  const elsewhere = await suggest(w, other, CUBE_B, samElsewhere.token);
  const bringer = async () => (await view(w, id)).body.suggestions[0].bringer;

  const res = await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }, ann.token);
  assert.equal(res.status, 200);
  assert.deepEqual([res.body.suggestions[0].bringer, res.body.suggestions[0].iBring, res.body.suggestions[0].mine], ['Ann', true, false]);

  // Saying it twice keeps her. Someone else cannot take it, or clear it.
  assert.equal((await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }, ann.token)).status, 200);
  refused(await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }, sam.token), 409, 'taken');
  assert.equal((await act(w, id, { action: 'bring', suggestionId: suggestion, bring: false }, sam.token)).status, 200);
  assert.equal(await bringer(), 'Ann');

  // She steps back, and then he can.
  assert.equal((await act(w, id, { action: 'bring', suggestionId: suggestion, bring: false }, ann.token)).body.suggestions[0].bringer, null);
  assert.equal((await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }, sam.token)).body.suggestions[0].bringer, 'Sam');

  refused(await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }), 401, 'not-attending');
  for (const suggestionId of [9999, elsewhere, String(suggestion), null]) refused(await act(w, id, { action: 'bring', suggestionId, bring: true }, ann.token), 404, 'bad', String(suggestionId));
  for (const bring of ['yes', 1, null, undefined]) refused(await act(w, id, { action: 'bring', suggestionId: suggestion, bring }, ann.token), 400, 'bad', String(bring));
  assert.equal(await bringer(), 'Sam');
});

test('bring: stays open after voting closes, until the event ends', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const suggestion = await suggest(w, id, CUBE_A, sam.token);

  t.mock.timers.setTime(Date.parse('2026-11-29T19:00:00.000Z')); // an hour into the event
  const during = await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }, sam.token);
  assert.deepEqual([during.status, during.body.event.votingOpen, during.body.event.rsvpOpen, during.body.suggestions[0].bringer], [200, false, true, 'Sam']);

  t.mock.timers.setTime(Date.parse('2026-11-29T21:30:00.000Z')); // the moment it ends
  refused(await act(w, id, { action: 'bring', suggestionId: suggestion, bring: false }, sam.token), 409, 'rsvp-closed');
});

test('bring: when two people offer at the same moment, one is told it is taken', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const suggestion = await suggest(w, id, CUBE_A, sam.token);
  const rival = () => w.db.exec(`UPDATE cal_cube_suggestions SET bringer_id = ${ann.id} WHERE id = ${suggestion}`);
  const racing: World = { ...w, env: { ...w.env, DB: withRival(w.db, /SELECT id, suggested_by, bringer_id/, rival) } };
  refused(await act(racing, id, { action: 'bring', suggestionId: suggestion, bring: true }, sam.token), 409, 'taken');
  assert.equal((await view(w, id)).body.suggestions[0].bringer, 'Ann');
});

// ---------- POST /api/events/:id: vote, and the count ----------

test('vote: ballots are saved, replaced, cleaned, and taken back', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  await suggest(w, id, CUBE_A, sam.token);
  await suggest(w, id, CUBE_B, sam.token);

  const first = await act(w, id, { action: 'vote', ranking: [CUBE_A, CUBE_B] }, sam.token);
  assert.equal(first.status, 200);
  assert.deepEqual(first.body.me?.ranking, [CUBE_A, CUBE_B]);
  assert.deepEqual([first.body.tally.ballots, first.body.tally.winner], [1, CUBE_A]);

  // Voting again replaces the ballot. Repeats and Cubes nobody suggested are dropped.
  t.mock.timers.setTime(NOW.getTime() + HOUR);
  const second = await act(w, id, { action: 'vote', ranking: [CUBE_B, CUBE_B, 9999, PENDING_CUBE, CUBE_A, CUBE_B] }, sam.token);
  assert.deepEqual(second.body.me?.ranking, [CUBE_B, CUBE_A]);
  assert.deepEqual([second.body.tally.ballots, second.body.tally.winner], [1, CUBE_B]);
  assert.deepEqual(w.db.raw.prepare('SELECT * FROM cal_ballots').all().map((r) => ({ ...r })), [
    { event_id: id, attendee_id: sam.id, ranking: JSON.stringify([CUBE_B, CUBE_A]), updated_at: new Date(NOW.getTime() + HOUR).toISOString() },
  ]);

  // Someone else sees the count but not Sam's ballot.
  const asAnn = (await view(w, id, ann.token)).body;
  assert.deepEqual([asAnn.me?.ranking, asAnn.tally.ballots], [[], 1]);

  // An empty ranking takes the ballot back, and doing it twice is fine.
  for (const pass of ['first', 'second']) {
    const cleared = await act(w, id, { action: 'vote', ranking: [] }, sam.token);
    assert.deepEqual([cleared.status, cleared.body.me?.ranking, cleared.body.tally], [200, [], { ballots: 0, winner: null, tied: false, rounds: [] }], pass);
  }
  assert.equal(count(w, 'cal_ballots'), 0);

  refused(await act(w, id, { action: 'vote', ranking: [CUBE_A] }), 401, 'not-attending');
  for (const ranking of ['3,5', [CUBE_A, '5'], [1.5], null, undefined, {}, Array(101).fill(CUBE_A)]) refused(await act(w, id, { action: 'vote', ranking }, sam.token), 400, 'ranking', JSON.stringify(ranking));
  assert.equal(count(w, 'cal_ballots'), 0);
});

test('the count runs ranked choice over the real ballots, fresh every time', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const voters = [];
  for (const name of ['Ann', 'Ben', 'Cy', 'Dee', 'Eve']) voters.push(await join(w, id, name));
  const [ann, ben, cy, dee, eve] = voters;
  await suggest(w, id, CUBE_A, ann.token);
  await suggest(w, id, CUBE_B, ben.token);
  const third = await suggest(w, id, CUBE_C, eve.token);

  // Round 1: A 2, B 2, C 1. C is dropped and its ballot moves to B. Round 2: B 3, A 2.
  const ballots: [string, number[]][] = [[ann.token, [CUBE_A]], [ben.token, [CUBE_A, CUBE_B]], [cy.token, [CUBE_B]], [dee.token, [CUBE_B, CUBE_A]], [eve.token, [CUBE_C, CUBE_B, CUBE_A]]];
  for (const [token, ranking] of ballots) assert.equal((await act(w, id, { action: 'vote', ranking }, token)).status, 200);
  assert.deepEqual((await view(w, id)).body.tally, {
    ballots: 5,
    winner: CUBE_B,
    tied: false,
    rounds: [
      { counts: [{ cubeId: CUBE_A, votes: 2 }, { cubeId: CUBE_B, votes: 2 }, { cubeId: CUBE_C, votes: 1 }], eliminated: CUBE_C },
      { counts: [{ cubeId: CUBE_B, votes: 3 }, { cubeId: CUBE_A, votes: 2 }], eliminated: null },
    ],
  });

  // One vote changes, and the next answer has a new count. Now A leads 3 to 2 with a majority.
  const changed = await act(w, id, { action: 'vote', ranking: [CUBE_A] }, cy.token);
  assert.deepEqual([changed.body.tally.winner, changed.body.tally.rounds.length], [CUBE_A, 1]);

  // A withdrawn Cube drops out of the count and out of every ranking shown, without touching the ballots.
  assert.equal((await act(w, id, { action: 'withdraw', suggestionId: third }, eve.token)).status, 200);
  const after = (await view(w, id, eve.token)).body;
  assert.deepEqual(after.me?.ranking, [CUBE_B, CUBE_A]);
  assert.deepEqual(after.tally.rounds, [{ counts: [{ cubeId: CUBE_A, votes: 3 }, { cubeId: CUBE_B, votes: 2 }], eliminated: null }]);

  // So does a Cube that leaves the library: only approved Cubes count.
  w.db.exec(`UPDATE cubes SET status = 'rejected' WHERE id = ${CUBE_A}`);
  const left = (await view(w, id, dee.token)).body;
  assert.deepEqual(left.suggestions.map((s) => s.cube.id), [CUBE_B]);
  assert.deepEqual(left.me?.ranking, [CUBE_B]);
  assert.deepEqual([left.tally.ballots, left.tally.winner], [3, CUBE_B]);
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_A }, cy.token), 400, 'cube');

  // A dead heat says so. The earlier suggestion wins it.
  const heat = await addEvent(w, { date: '2026-12-06' });
  const one = await join(w, heat, 'One');
  const two = await join(w, heat, 'Two');
  await suggest(w, heat, CUBE_C, one.token);
  await suggest(w, heat, CUBE_B, two.token);
  await act(w, heat, { action: 'vote', ranking: [CUBE_B] }, one.token);
  const tied = await act(w, heat, { action: 'vote', ranking: [CUBE_C] }, two.token);
  assert.deepEqual([tied.body.tally.winner, tied.body.tally.tied], [CUBE_C, true]);
});

test('a ballot that cannot be read counts as empty instead of breaking the event', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  await suggest(w, id, CUBE_A, sam.token);
  w.db.raw.prepare('INSERT INTO cal_ballots (event_id, attendee_id, ranking, updated_at) VALUES (?, ?, ?, ?)').run(id, sam.id, '{not json', NOW.toISOString());
  const res = await view(w, id, sam.token);
  assert.deepEqual([res.status, res.body.me?.ranking, res.body.tally.ballots], [200, [], 0]);
});

// ---------- Voting closes ----------

test('voting closes a set time before the start, and what was decided stays on show', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const suggestion = await suggest(w, id, CUBE_A, sam.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_A] }, sam.token);

  const closes = Date.parse('2026-11-28T18:00:00.000Z');
  t.mock.timers.setTime(closes - 1);
  assert.equal((await view(w, id)).body.event.votingOpen, true);
  assert.equal((await act(w, id, { action: 'vote', ranking: [CUBE_A] }, sam.token)).status, 200);

  t.mock.timers.setTime(closes);
  const closed = (await view(w, id, sam.token)).body;
  assert.deepEqual([closed.event.votingOpen, closed.event.rsvpOpen, closed.event.voteClosesAt, closed.event.cube], [false, true, '2026-11-28T18:00:00.000Z', null]);
  assert.deepEqual([closed.tally.winner, closed.tally.ballots, closed.me?.ranking], [CUBE_A, 1, [CUBE_A]]);
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_B }, sam.token), 409, 'vote-closed');
  refused(await act(w, id, { action: 'withdraw', suggestionId: suggestion }, sam.token), 409, 'vote-closed');
  refused(await act(w, id, { action: 'vote', ranking: [] }, sam.token), 409, 'vote-closed');
  // People can still join, and they still cannot vote.
  const late = await join(w, id, 'Late');
  refused(await act(w, id, { action: 'vote', ranking: [CUBE_A] }, late.token), 409, 'vote-closed');
  assert.equal(count(w, 'cal_ballots'), 1);
});

test('voting can close when the event starts, or days before', async (t) => {
  const w = world(t);
  const atStart = await addEvent(w, { voteCloseHours: 0 });
  const early = await addEvent(w, { title: 'Early Close', voteCloseHours: 48 });
  assert.equal((await view(w, atStart)).body.event.voteClosesAt, '2026-11-29T18:00:00.000Z');
  assert.equal((await view(w, early)).body.event.voteClosesAt, '2026-11-27T18:00:00.000Z');
  t.mock.timers.setTime(Date.parse('2026-11-29T17:59:59.000Z'));
  assert.deepEqual([(await view(w, atStart)).body.event.votingOpen, (await view(w, early)).body.event.votingOpen], [true, false]);
  t.mock.timers.setTime(Date.parse('2026-11-29T18:00:00.000Z'));
  assert.equal((await view(w, atStart)).body.event.votingOpen, false);
});

test('voting closes when the host confirms a Cube, and opens again when the host takes it back', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const suggestion = await suggest(w, id, CUBE_A, sam.token);
  await suggest(w, id, CUBE_B, sam.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_A] }, sam.token);

  // The host may overrule the vote.
  assert.equal((await adminPatch(w, id, { cubeId: CUBE_B })).status, 200);
  const confirmed = (await view(w, id, sam.token)).body;
  assert.deepEqual([confirmed.event.cubeMode, confirmed.event.cube?.id, confirmed.event.cubeName, confirmed.event.votingOpen, confirmed.event.rsvpOpen], ['vote', CUBE_B, confirmed.event.cube?.name, false, true]);
  assert.equal(confirmed.tally.winner, CUBE_A);
  refused(await act(w, id, { action: 'suggest', cubeId: CUBE_C }, sam.token), 409, 'vote-closed');
  refused(await act(w, id, { action: 'withdraw', suggestionId: suggestion }, sam.token), 409, 'vote-closed');
  refused(await act(w, id, { action: 'vote', ranking: [CUBE_B] }, sam.token), 409, 'vote-closed');
  assert.equal((await act(w, id, { action: 'bring', suggestionId: suggestion, bring: true }, sam.token)).status, 200);

  assert.equal((await adminPatch(w, id, { cubeId: null })).status, 200);
  const reopened = await act(w, id, { action: 'vote', ranking: [CUBE_B] }, sam.token);
  assert.deepEqual([reopened.status, reopened.body.event.votingOpen, reopened.body.event.cube, reopened.body.tally.winner], [200, true, null, CUBE_B]);
});

// ---------- Cancelled events, bad requests, and trouble ----------

test('a cancelled event still shows, and refuses every action except taking your name off', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  const suggestion = await suggest(w, id, CUBE_A, sam.token);
  assert.equal((await adminPatch(w, id, { status: 'cancelled' })).status, 200);

  const shown = (await view(w, id, sam.token)).body;
  assert.deepEqual([shown.event.status, shown.event.rsvpOpen, shown.event.votingOpen, shown.me?.name, shown.attendees.length], ['cancelled', false, false, 'Sam', 1]);
  assert.deepEqual((await list(w, 'from=2026-11-29&to=2026-11-29')).body.events.map((e) => [e.id, e.status]), [[id, 'cancelled']]);

  const actions = [
    { action: 'attend', name: 'Ann' }, { action: 'suggest', cubeId: CUBE_B }, { action: 'withdraw', suggestionId: suggestion },
    { action: 'bring', suggestionId: suggestion, bring: true }, { action: 'vote', ranking: [CUBE_A] },
  ];
  for (const body of actions) {
    refused(await act(w, id, body, sam.token), 409, 'rsvp-closed', body.action);
    refused(await act(w, id, body), 409, 'rsvp-closed', `${body.action} without a token`);
  }
  assert.deepEqual([count(w, 'cal_attendees'), count(w, 'cal_cube_suggestions'), count(w, 'cal_ballots')], [1, 1, 0]);

  // Restored, it works again, and Sam is still on the list.
  assert.equal((await adminPatch(w, id, { status: 'approved' })).status, 200);
  assert.equal((await act(w, id, { action: 'vote', ranking: [CUBE_A] }, sam.token)).status, 200);
});

test('a body that is not a known action is refused', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  for (const body of ['not json', '', '[]', 'null', '"attend"', '42', {}, { action: 'dance' }, { action: null }, { action: ['attend'] }, { name: 'Sam' }]) {
    refused(await act(w, id, body, sam.token), 400, 'bad', JSON.stringify(body));
  }
  // The event is checked after the body, so a good action on a missing event is "gone".
  refused(await act(w, 9999, { action: 'leave' }, sam.token), 404, 'gone');
  assert.equal(count(w, 'cal_attendees'), 1);
});

test('a token only counts for the event it was made for', async (t) => {
  const w = world(t);
  const first = await addEvent(w);
  const second = await addEvent(w, { date: '2026-12-06' });
  const sam = await join(w, first, 'Sam');
  const ann = await join(w, second, 'Ann');
  const suggestion = await suggest(w, second, CUBE_A, ann.token);

  assert.equal((await view(w, second, sam.token)).body.me, null);
  const actions = [{ action: 'leave' }, { action: 'suggest', cubeId: CUBE_B }, { action: 'withdraw', suggestionId: suggestion }, { action: 'bring', suggestionId: suggestion, bring: true }, { action: 'vote', ranking: [CUBE_A] }];
  for (const body of actions) refused(await act(w, second, body, sam.token), 401, 'not-attending', body.action);

  assert.deepEqual([count(w, 'cal_attendees'), count(w, 'cal_cube_suggestions'), count(w, 'cal_ballots')], [2, 1, 0]);
  assert.equal((await view(w, first, sam.token)).body.me?.name, 'Sam');
  assert.equal((await view(w, second)).body.suggestions[0].bringer, null);
});

test('without the database, or when it fails, the public routes say unavailable and log why', async (t) => {
  const log = quiet(t);
  const w = world(t);
  const id = await addEvent(w);
  const noDb: World = { ...w, env: { ...w.env, DB: undefined } };
  refused(await list(noDb, 'from=2026-11-23&to=2026-12-10'), 503, 'unavailable');
  refused(await view(noDb, id), 503, 'unavailable');
  refused(await act(noDb, id, { action: 'attend', name: 'Sam' }), 503, 'unavailable');
  assert.equal(log.mock.callCount(), 3);

  const broken: World = { ...w, env: { ...w.env, DB: { prepare: () => { throw new Error('D1 is down'); }, batch: async () => [] } } };
  refused(await list(broken, 'from=2026-11-23&to=2026-12-10'), 503, 'unavailable');
  refused(await view(broken, id), 503, 'unavailable');
  refused(await act(broken, id, { action: 'attend', name: 'Sam' }), 503, 'unavailable');
  assert.equal(log.mock.callCount(), 6);
  assert.ok(String(log.mock.calls[5].arguments[1]).includes('D1 is down'));
});

// ---------- Rate limits ----------

test('attend is limited to 40 an hour for one address, counting only real tries', async (t) => {
  assert.deepEqual(PER_HOUR, { attend: 40, act: 120, suggest: 5 });
  const w = world(t);
  const id = await addEvent(w);
  // Refused names, taken names, and closed events do not use up the hour.
  const over = await addEvent(w, { date: '2026-11-22' });
  for (let i = 0; i < 25; i += 1) {
    refused(await act(w, id, { action: 'attend', name: '' }), 400, 'name');
    refused(await act(w, over, { action: 'attend', name: 'Sam' }), 409, 'rsvp-closed');
  }
  for (let i = 1; i <= PER_HOUR.attend; i += 1) {
    await join(w, id, `Guest ${i}`);
    refused(await act(w, id, { action: 'attend', name: `guest ${i}` }), 409, 'name-taken');
  }
  refused(await act(w, id, { action: 'attend', name: 'One More' }), 429, 'slow');
  refused(await act(w, id, { action: 'attend', name: 'guest 1' }), 409, 'name-taken');
  assert.equal(count(w, 'cal_attendees'), PER_HOUR.attend);

  // Another address is not held back, and neither is this one's other business.
  await join(w, id, 'Elsewhere', '198.51.100.9');
  const first = (await view(w, id)).body.attendees[0];
  assert.equal(first.name, 'Guest 1');

  // The next hour starts fresh.
  t.mock.timers.setTime(NOW.getTime() + HOUR);
  await join(w, id, 'One More');
});

test('every other action counts per attendee, 120 an hour, so one tab cannot block a room on one address', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  await suggest(w, id, CUBE_A, sam.token);
  assert.equal(count(w, 'wwp_rate_limits'), 2, 'one counter for attend, one for Sam');

  const key = await rateKey(w.env, 'act', `attendee:${sam.id}`);
  w.db.raw.prepare('UPDATE wwp_rate_limits SET count = ? WHERE ip_hash = ?').run(PER_HOUR.act - 1, key);
  assert.equal((await act(w, id, { action: 'vote', ranking: [CUBE_A] }, sam.token)).status, 200);
  for (const body of [{ action: 'vote', ranking: [] }, { action: 'suggest', cubeId: CUBE_B }, { action: 'leave' }]) refused(await act(w, id, body, sam.token), 429, 'slow', body.action);
  assert.equal(count(w, 'cal_ballots'), 1);

  // Requests without a valid token are turned away before they are counted.
  const before = row<{ count: number }>(w, 'SELECT count FROM wwp_rate_limits WHERE ip_hash = ?', key).count;
  refused(await act(w, id, { action: 'leave' }), 401, 'not-attending');
  assert.equal(row<{ count: number }>(w, 'SELECT count FROM wwp_rate_limits WHERE ip_hash = ?', key).count, before);

  // Reading is never limited, and someone else on the same address is fine.
  assert.equal((await view(w, id, sam.token)).status, 200);
  const ann = await join(w, id, 'Ann');
  assert.equal((await act(w, id, { action: 'vote', ranking: [CUBE_A] }, ann.token)).status, 200);
});

// ---------- Privacy ----------

test('no public answer carries a private column, a token hash, or an unapproved event', async (t) => {
  const w = world(t);
  const secret = { submitter_name: 'PRIVATE-SUBMITTER', submitter_email: 'private@example.com' };
  const pending = rawEvent(w, { title: 'PRIVATE-PENDING-EVENT', status: 'pending', ...secret });
  const rejected = rawEvent(w, { title: 'PRIVATE-REJECTED-EVENT', status: 'rejected', ...secret });
  // An approved event that began as a visitor's suggestion still holds the private columns.
  const id = rawEvent(w, { title: 'Approved Suggestion', description: 'All welcome.', ...secret });
  const sample = rawEvent(w, { title: 'Sample Night', is_sample: 1, date: '2026-11-30', ...secret });
  // Attendees on the hidden events must not surface either.
  w.db.exec(`INSERT INTO cal_attendees (event_id, name, token_hash, created_at) VALUES (${pending}, 'PRIVATE-PENDING-GUEST', 'PRIVATE-TOKEN-HASH', 'now')`);

  const answers: Answer<unknown>[] = [];
  const keep = <T>(answer: Answer<T>) => {
    answers.push(answer);
    return answer;
  };
  const sam = keep(await act(w, id, { action: 'attend', name: 'Sam' })).body;
  const ann = keep(await act(w, id, { action: 'attend', name: 'Ann' })).body;
  const suggested = keep(await act(w, id, { action: 'suggest', cubeId: CUBE_A, canBring: true }, sam.token)).body;
  keep(await act(w, id, { action: 'suggest', cubeId: CUBE_B }, ann.token));
  keep(await act(w, id, { action: 'vote', ranking: [CUBE_A, CUBE_B] }, sam.token));
  keep(await act(w, id, { action: 'bring', suggestionId: suggested.suggestions[0].id, bring: false }, sam.token));
  keep(await act(w, id, { action: 'withdraw', suggestionId: suggested.suggestions[0].id }, sam.token));
  keep(await act(w, id, { action: 'leave' }, ann.token));
  keep(await view(w, id));
  keep(await view(w, id, sam.token));
  keep(await read<EventPayload>(await eventRoute({ request: jsonRequest('GET', `/api/events/${sample}?samples=1`), env: w.env, params: { id: String(sample) } })));
  keep(await list(w, 'from=2026-11-01&to=2026-12-31'));
  keep(await list(w, 'from=2026-11-01&to=2026-12-31&samples=1'));
  // Refusals are answers too.
  keep(await view(w, pending));
  keep(await view(w, rejected));
  keep(await act(w, pending, { action: 'attend', name: 'Sam' }));
  keep(await act(w, rejected, { action: 'leave' }, sam.token));
  keep(await act(w, id, { action: 'attend', name: 'Sam' }));
  keep(await act(w, id, { action: 'vote', ranking: 'x' }, sam.token));
  assert.equal(answers.filter((a) => a.status === 200).length, 13);

  // Every stored hash, the raw address, and the other attendee's token.
  const hashes = w.db.raw.prepare('SELECT token_hash FROM cal_attendees').all().map((r) => String(r.token_hash));
  const secrets = [...Object.values(secret), 'PRIVATE', IP, ...hashes, await sha256Hex(`cal-attendee:${sam.token}`), await sha256Hex(`cal-attendee:${ann.token}`)];
  for (const answer of answers) {
    const text = JSON.stringify(answer.body);
    for (const value of secrets) assert.ok(!text.includes(value), `${value} in ${text.slice(0, 200)}`);
    assert.ok(!/submitter|ip_?hash|token_?hash|email|created_?at|updated_?at/i.test(text), text.slice(0, 200));
  }
  // The token itself is told once, to its owner, when they join.
  const tokens = answers.map((a) => JSON.stringify(a.body)).filter((text) => text.includes(sam.token) || text.includes(ann.token));
  assert.equal(tokens.length, 2);

  // The hidden events are in no list, with or without samples.
  const listed = (await list(w, 'from=2026-11-01&to=2026-12-31&samples=1')).body.events.map((e) => e.id);
  assert.deepEqual(listed, [id, sample]);
  // And the admin, who should see them, does.
  const admin = (await adminList(w)).body.events.find((e) => e.id === pending);
  assert.deepEqual([admin?.submitterName, admin?.submitterEmail, admin?.status], ['PRIVATE-SUBMITTER', 'private@example.com', 'pending']);
  assert.ok(!JSON.stringify((await adminView(w, pending)).body).includes('HASH'));
});

// ---------- Admin: who gets in ----------

test('the admin routes are reached only through the admin middleware', async (t) => {
  const w = world(t, { WWP_ADMIN_PREVIEW_TOKEN: 'preview-secret' });
  await addEvent(w);
  let reached = 0;
  const through = (headers: Record<string, string>) => {
    const request = jsonRequest('GET', ADMIN, undefined, headers);
    const next = async () => {
      reached += 1;
      return adminListRoute({ request, env: w.env, params: {} });
    };
    return adminGuard({ request, env: w.env, params: {}, waitUntil: () => {}, next });
  };
  assert.equal((await through({})).status, 401);
  assert.equal((await through({ 'X-Admin-Token': 'a-guess' })).status, 401);
  assert.equal(reached, 0);
  const allowed = await through({ 'X-Admin-Token': 'preview-secret' });
  assert.deepEqual([allowed.status, allowed.headers.get('Cache-Control'), reached], [200, 'no-store', 1]);
  assert.equal(((await allowed.json()) as AdminListResponse).events.length, 1);
});

// ---------- Admin: create ----------

test('admin create: an event gets its defaults, its instants, and no private fields', async (t) => {
  const w = world(t);
  const res = await adminCreate(w, { title: ' Sunday  Cube Draft ', date: '2026-11-29', startTime: '13:00', endTime: '16:30' });
  assert.deepEqual([res.status, res.body], [201, { ids: [1] }]);
  assert.deepEqual(row(w, 'SELECT * FROM cal_events WHERE id = 1'), {
    id: 1, community: 'cube-commonwealth', title: 'Sunday Cube Draft', kind: 'draft', date: '2026-11-29', start_time: '13:00', end_time: '16:30', tz: TZ,
    starts_at: '2026-11-29T18:00:00.000Z', ends_at: '2026-11-29T21:30:00.000Z', description: null, location_name: null, location_address: null,
    cube_mode: 'vote', cube_id: null, vote_close_hours: 24, status: 'approved', is_sample: 0, submitter_name: null, submitter_email: null, closed_tally: null,
    created_at: NOW.toISOString(), updated_at: NOW.toISOString(),
  });

  // Everything the form can set. An event that runs past midnight ends the next day.
  const full = await adminCreate(w, {
    title: 'Cube Quarterly Celebration', kind: 'celebration', date: '2026-12-05', startTime: '19:00', endTime: '01:00', description: 'Line one\r\n\r\n\r\nLine two',
    locationName: 'The Table', locationAddress: '1 Main St, Carmel, IN', cubeMode: 'set', cubeId: CUBE_A, voteCloseHours: 48, status: 'cancelled',
  });
  const saved = row<Record<string, string | number | null>>(w, 'SELECT * FROM cal_events WHERE id = ?', full.body.ids[0]);
  assert.deepEqual(
    [saved.kind, saved.starts_at, saved.ends_at, saved.description, saved.location_name, saved.location_address, saved.cube_mode, saved.cube_id, saved.vote_close_hours, saved.status],
    ['celebration', '2026-12-06T00:00:00.000Z', '2026-12-06T06:00:00.000Z', 'Line one\n\nLine two', 'The Table', '1 Main St, Carmel, IN', 'set', CUBE_A, 48, 'cancelled'],
  );

  // A class has no Cube unless the admin says so.
  const cls = await addEvent(w, { title: 'Cube Design Class', kind: 'class' });
  assert.equal(row<{ cube_mode: string }>(w, 'SELECT cube_mode FROM cal_events WHERE id = ?', cls).cube_mode, 'none');
});

test('admin create: "repeat weekly" makes one event a week, each at the same local time', async (t) => {
  const w = world(t);
  // The clocks fall back on November 1, 2026, so 1:00 pm moves from 17:00 to 18:00 UTC.
  const res = await adminCreate(w, { ...DRAFT, date: '2026-10-25', locationName: 'The Table', repeatWeeks: 2 });
  assert.deepEqual([res.status, res.body], [201, { ids: [1, 2, 3] }]);
  assert.deepEqual(w.db.raw.prepare('SELECT id, title, date, start_time, starts_at, ends_at, location_name FROM cal_events ORDER BY id').all().map((r) => ({ ...r })), [
    { id: 1, title: 'Sunday Cube Draft', date: '2026-10-25', start_time: '13:00', starts_at: '2026-10-25T17:00:00.000Z', ends_at: '2026-10-25T20:30:00.000Z', location_name: 'The Table' },
    { id: 2, title: 'Sunday Cube Draft', date: '2026-11-01', start_time: '13:00', starts_at: '2026-11-01T18:00:00.000Z', ends_at: '2026-11-01T21:30:00.000Z', location_name: 'The Table' },
    { id: 3, title: 'Sunday Cube Draft', date: '2026-11-08', start_time: '13:00', starts_at: '2026-11-08T18:00:00.000Z', ends_at: '2026-11-08T21:30:00.000Z', location_name: 'The Table' },
  ]);

  // The repeat is capped at 12 more weeks, and junk means no repeat.
  assert.equal((await adminCreate(w, { ...DRAFT, repeatWeeks: 99 })).body.ids.length, CAL_CAPS.repeatWeeks + 1);
  assert.equal(row<{ date: string }>(w, 'SELECT MAX(date) AS date FROM cal_events').date, addDays(DRAFT.date, 7 * CAL_CAPS.repeatWeeks));
  for (const repeatWeeks of [0, -2, 'weekly', null, 1.5]) assert.equal((await adminCreate(w, { ...DRAFT, repeatWeeks })).body.ids.length, 1, String(repeatWeeks));
});

test('admin create: a problem is a sentence, and nothing is saved', async (t) => {
  const w = world(t);
  const problems: [unknown, string][] = [
    [{}, 'Add a title.'],
    [{ ...DRAFT, date: '2026-02-30' }, 'Check the date.'],
    [{ ...DRAFT, endTime: '13:00' }, 'The end time must be different from the start time.'],
    [{ ...DRAFT, kind: 'party' }, 'Check the kind of event.'],
    [{ ...DRAFT, cubeMode: 'set' }, 'Pick the Cube for this event, or let attendees vote.'],
    [{ ...DRAFT, cubeMode: 'set', cubeId: 9999, repeatWeeks: 3 }, 'That Cube is not in the Cube Library.'],
    [{ ...DRAFT, cubeId: PENDING_CUBE }, 'That Cube is not in the Cube Library.'],
    [{ ...DRAFT, status: 'live' }, 'Check the status.'],
    ['not json', 'Expected a JSON body.'],
    [[DRAFT], 'Expected a JSON body.'],
  ];
  for (const [body, error] of problems) assert.deepEqual([(await adminCreate(w, body)).status, (await adminCreate(w, body)).body], [400, { error }], error);
  assert.equal(count(w, 'cal_events'), 0);
});

test('a repeating event lands whole or not at all', async (t) => {
  const w = world(t);
  const event = { ...DRAFT, kind: 'draft' as const, tz: TZ, ...eventInstants(DRAFT.date, DRAFT.startTime, DRAFT.endTime, TZ), description: null, locationName: null, locationAddress: null, cubeMode: 'vote' as const, cubeId: null, voteCloseHours: 24, status: 'approved' as const };
  // The third week names a Cube that does not exist, so the database refuses it.
  await assert.rejects(() => insertEvents(w.db, [event, event, { ...event, cubeId: 9999 }], NOW), /FOREIGN KEY/);
  assert.equal(count(w, 'cal_events'), 0);
  assert.deepEqual(await insertEvents(w.db, [event, event], NOW), [1, 2]);
});

// ---------- Admin: list and detail ----------

test('admin list: every event of every status, samples included, with the private details', async (t) => {
  const w = world(t);
  const approved = await addEvent(w, { date: '2026-12-06' });
  const cancelled = await addEvent(w, { title: 'Called Off', date: '2026-12-02', status: 'cancelled' });
  const rejected = await addEvent(w, { title: 'Turned Down', date: '2026-12-04', status: 'rejected' });
  const pending = rawEvent(w, { title: 'Pauper Night', date: '2026-12-05', status: 'pending', submitter_name: 'Sam W.', submitter_email: 'sam@example.com' });
  const sample = rawEvent(w, { title: 'Sample Draft', date: '2026-11-30', is_sample: 1 });
  const chess = rawEvent(w, { title: 'Chess Night', date: '2026-11-28', community: 'chess-club' });
  const past = await addEvent(w, { title: 'Last Week', date: '2026-11-15' });
  const sam = await join(w, approved, 'Sam');
  const ann = await join(w, approved, 'Ann');
  await suggest(w, approved, CUBE_A, sam.token);
  await suggest(w, approved, CUBE_B, ann.token);
  await act(w, approved, { action: 'vote', ranking: [CUBE_A] }, sam.token);

  const res = await adminList(w);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.events.map((e) => [e.id, e.status, e.isSample, e.community]), [
    [past, 'approved', false, 'cube-commonwealth'], [chess, 'approved', false, 'chess-club'], [sample, 'approved', true, 'cube-commonwealth'],
    [cancelled, 'cancelled', false, 'cube-commonwealth'], [rejected, 'rejected', false, 'cube-commonwealth'], [pending, 'pending', false, 'cube-commonwealth'],
    [approved, 'approved', false, 'cube-commonwealth'],
  ]);
  assert.deepEqual(res.body.events.find((e) => e.id === pending), {
    id: pending, title: 'Pauper Night', kind: 'draft', date: '2026-12-05', startTime: '13:00', endTime: '16:30', locationName: null, status: 'pending', going: 0,
    cubeMode: 'vote', cubeName: null, isSample: false, community: 'cube-commonwealth', description: null, locationAddress: null, tz: TZ,
    startsAt: '2026-12-05T18:00:00.000Z', endsAt: '2026-12-05T21:30:00.000Z', cubeId: null, voteCloseHours: 24,
    submitterName: 'Sam W.', submitterEmail: 'sam@example.com', suggestions: 0, ballots: 0, createdAt: NOW.toISOString(),
  });
  const busy = res.body.events.find((e) => e.id === approved)!;
  assert.deepEqual([busy.going, busy.suggestions, busy.ballots, busy.submitterName, busy.submitterEmail], [2, 2, 1, null, null]);
  assert.ok(!JSON.stringify(res.body).includes('closed_tally'));
});

test('admin detail: the people going, the suggested Cubes, and the count', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  t.mock.timers.setTime(NOW.getTime() + HOUR);
  const ann = await join(w, id, 'Ann');
  const first = await suggest(w, id, CUBE_A, sam.token, true);
  const second = await suggest(w, id, CUBE_B, ann.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_B, CUBE_A] }, sam.token);
  await adminPatch(w, id, { cubeId: CUBE_B });

  const res = await adminView(w, id);
  assert.equal(res.status, 200);
  assert.deepEqual(res.body.attendees, [
    { id: sam.id, name: 'Sam', createdAt: NOW.toISOString() },
    { id: ann.id, name: 'Ann', createdAt: new Date(NOW.getTime() + HOUR).toISOString() },
  ]);
  assert.deepEqual(res.body.suggestions.map((s) => [s.id, s.cube.id, s.suggestedBy, s.bringer, s.mine, s.iBring]), [[first, CUBE_A, 'Sam', 'Sam', false, false], [second, CUBE_B, 'Ann', null, false, false]]);
  assert.deepEqual(res.body.tally, { ballots: 1, winner: CUBE_B, tied: false, rounds: [{ counts: [{ cubeId: CUBE_B, votes: 1 }, { cubeId: CUBE_A, votes: 0 }], eliminated: null }] });
  assert.deepEqual([res.body.event.id, res.body.event.going, res.body.event.suggestions, res.body.event.ballots, res.body.event.cubeId, res.body.event.cubeName !== null], [id, 2, 2, 1, CUBE_B, true]);
  assert.deepEqual(Object.keys(res.body).sort(), ['attendees', 'event', 'suggestions', 'tally']);

  // Any status opens for the admin. A missing event does not.
  const pending = await addEvent(w, { status: 'pending' });
  assert.equal((await adminView(w, pending)).body.event.status, 'pending');
  for (const missing of [9999, 'abc', 0]) assert.deepEqual([(await adminView(w, missing)).status, (await adminView(w, missing)).body], [404, { error: 'No such event.' }]);
});

// ---------- Admin: edit ----------

test('admin patch: only what is sent changes, and the instants follow the date and times', async (t) => {
  const w = world(t);
  const id = await addEvent(w, { description: 'Bring sleeves.', locationName: 'The Table' });
  const stored = () => row<Record<string, string | number | null>>(w, 'SELECT * FROM cal_events WHERE id = ?', id);
  const before = stored();

  t.mock.timers.setTime(NOW.getTime() + HOUR);
  const res = await adminPatch(w, id, { title: ' Sunday  Draft, Take Two ' });
  assert.deepEqual([res.status, res.body], [200, { id }]);
  assert.deepEqual(stored(), { ...before, title: 'Sunday Draft, Take Two', updated_at: new Date(NOW.getTime() + HOUR).toISOString() });

  // A new date moves both instants, across the summer clock change too.
  await adminPatch(w, id, { date: '2027-07-04' });
  assert.deepEqual([stored().date, stored().starts_at, stored().ends_at], ['2027-07-04', '2027-07-04T17:00:00.000Z', '2027-07-04T20:30:00.000Z']);
  await adminPatch(w, id, { date: '2026-11-29', startTime: '18:00' });
  assert.deepEqual([stored().starts_at, stored().ends_at], ['2026-11-29T23:00:00.000Z', '2026-11-30T21:30:00.000Z'], 'an end before the start means the next day');
  await adminPatch(w, id, { endTime: '21:30' });
  assert.deepEqual([stored().start_time, stored().end_time, stored().starts_at, stored().ends_at], ['18:00', '21:30', '2026-11-29T23:00:00.000Z', '2026-11-30T02:30:00.000Z']);

  // Text can be cleared, and the rest is still as it was.
  await adminPatch(w, id, { description: '', locationName: null, voteCloseHours: 2, kind: 'meetup' });
  assert.deepEqual([stored().description, stored().location_name, stored().vote_close_hours, stored().kind, stored().cube_mode, stored().status, stored().created_at], [null, null, 2, 'meetup', 'vote', 'approved', NOW.toISOString()]);
  assert.equal((await view(w, id)).body.event.voteClosesAt, '2026-11-29T21:00:00.000Z');
});

test('admin patch: the merged event has to make sense', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const cube = () => row<{ cube_mode: string; cube_id: number | null }>(w, 'SELECT cube_mode, cube_id FROM cal_events WHERE id = ?', id);
  const problem = async (body: unknown, status: number, error: string) => {
    const res = await adminPatch(w, id, body);
    assert.deepEqual([res.status, res.body], [status, { error }], JSON.stringify(body));
  };

  // "I will pick the Cube" needs a Cube, whether it arrives with the change or was already there.
  await problem({ cubeMode: 'set' }, 400, 'Pick the Cube for this event, or let attendees vote.');
  await problem({ cubeMode: 'set', cubeId: null }, 400, 'Pick the Cube for this event, or let attendees vote.');
  assert.equal((await adminPatch(w, id, { cubeMode: 'set', cubeId: CUBE_A })).status, 200);
  assert.deepEqual(cube(), { cube_mode: 'set', cube_id: CUBE_A });
  await problem({ cubeId: null }, 400, 'Pick the Cube for this event, or let attendees vote.');
  assert.equal((await adminPatch(w, id, { cubeId: CUBE_B })).status, 200);
  assert.equal((await adminPatch(w, id, { cubeMode: 'vote' })).status, 200);
  assert.deepEqual(cube(), { cube_mode: 'vote', cube_id: CUBE_B }, 'a vote with a confirmed Cube');
  assert.equal((await adminPatch(w, id, { cubeMode: 'set' })).status, 200, 'the Cube already there will do');

  // "No Cube" clears it, and a Cube sent to a no-Cube event does not stick.
  assert.equal((await adminPatch(w, id, { cubeMode: 'none' })).status, 200);
  assert.deepEqual(cube(), { cube_mode: 'none', cube_id: null });
  assert.equal((await adminPatch(w, id, { cubeId: CUBE_A })).status, 200);
  assert.deepEqual(cube(), { cube_mode: 'none', cube_id: null });

  // A Cube has to be in the library.
  await problem({ cubeMode: 'vote', cubeId: 9999 }, 400, 'That Cube is not in the Cube Library.');
  await problem({ cubeMode: 'set', cubeId: PENDING_CUBE }, 400, 'That Cube is not in the Cube Library.');

  // The times are checked against the stored ones.
  await problem({ endTime: '13:00' }, 400, 'The end time must be different from the start time.');
  await problem({ startTime: '16:30' }, 400, 'The end time must be different from the start time.');
  assert.equal((await adminPatch(w, id, { startTime: '16:30', endTime: '13:00' })).status, 200);

  await problem({}, 400, 'Nothing to change.');
  await problem({ unknown: true }, 400, 'Nothing to change.');
  await problem({ status: 'live' }, 400, 'Check the status.');
  await problem({ title: '' }, 400, 'Add a title.');
  await problem({ date: 'tomorrow' }, 400, 'Check the date.');
  await problem('not json', 400, 'Expected a JSON body.');
  for (const missing of [9999, 'abc']) assert.deepEqual([(await adminPatch(w, missing, { title: 'X' })).status, (await adminPatch(w, missing, { title: 'X' })).body], [404, { error: 'No such event.' }]);
});

test('admin patch: approving a suggestion puts it on the calendar, and rejecting hides it', async (t) => {
  const w = world(t);
  const id = rawEvent(w, { status: 'pending', submitter_name: 'Sam W.', submitter_email: 'sam@example.com' });
  refused(await view(w, id), 404, 'gone');
  assert.equal((await adminPatch(w, id, { status: 'approved', title: 'Pauper Cube Night' })).status, 200);
  assert.equal((await view(w, id)).body.event.title, 'Pauper Cube Night');
  assert.equal((await list(w, 'from=2026-11-29&to=2026-11-29')).body.events.length, 1);
  // The private details stay with the event for the admin.
  assert.equal((await adminView(w, id)).body.event.submitterEmail, 'sam@example.com');

  assert.equal((await adminPatch(w, id, { status: 'rejected' })).status, 200);
  refused(await view(w, id), 404, 'gone');
  assert.deepEqual((await list(w, 'from=2026-11-29&to=2026-11-29')).body.events, []);
});

test('admin patch: an event whose Cube has left the library can still be edited', async (t) => {
  const w = world(t);
  const id = await addEvent(w, { cubeMode: 'set', cubeId: CUBE_A });
  w.db.exec(`UPDATE cubes SET status = 'rejected' WHERE id = ${CUBE_A}`);
  assert.deepEqual([(await view(w, id)).body.event.cube, (await adminView(w, id)).body.event.cubeId, (await adminView(w, id)).body.event.cubeName], [null, CUBE_A, null]);
  assert.equal((await adminPatch(w, id, { title: 'Moved', cubeMode: 'set', cubeId: CUBE_A })).status, 200);
  assert.equal((await adminPatch(w, id, { status: 'cancelled' })).status, 200);
  // Picking it afresh for another event is refused.
  const other = await addEvent(w, { date: '2026-12-06' });
  assert.deepEqual((await adminPatch(w, other, { cubeId: CUBE_A })).body, { error: 'That Cube is not in the Cube Library.' });
});

// ---------- Admin: delete ----------

/** An event with two people going, two suggested Cubes, and two ballots. */
async function busyEvent(w: World, over: AdminCreateBody = {}) {
  const id = await addEvent(w, over);
  const sam = await join(w, id, 'Sam');
  const ann = await join(w, id, 'Ann');
  const first = await suggest(w, id, CUBE_A, sam.token, true);
  const second = await suggest(w, id, CUBE_B, ann.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_A, CUBE_B] }, sam.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_B] }, ann.token);
  return { id, sam, ann, first, second };
}
const rowsFor = (w: World, eventId: number) => ['cal_attendees', 'cal_cube_suggestions', 'cal_ballots'].map((table) => count(w, `${table} WHERE event_id = ?`, eventId));

test('admin delete: an event takes its attendees, suggestions, and ballots with it', async (t) => {
  const w = world(t);
  const gone = await busyEvent(w);
  const kept = await busyEvent(w, { date: '2026-12-06' });
  assert.deepEqual(rowsFor(w, gone.id), [2, 2, 2]);

  const res = await adminDelete(w, gone.id);
  assert.deepEqual([res.status, res.body], [200, { deleted: gone.id }]);
  assert.equal(count(w, 'cal_events WHERE id = ?', gone.id), 0);
  assert.deepEqual(rowsFor(w, gone.id), [0, 0, 0]);
  assert.deepEqual(rowsFor(w, kept.id), [2, 2, 2]);
  refused(await view(w, gone.id), 404, 'gone');
  refused(await act(w, gone.id, { action: 'leave' }, gone.sam.token), 404, 'gone');

  for (const missing of [gone.id, 9999, 'abc']) assert.deepEqual([(await adminDelete(w, missing)).status, (await adminDelete(w, missing)).body], [404, { error: 'No such event.' }]);
  assert.equal(count(w, 'cal_events'), 1);
  // The Cube Library is not part of the cascade.
  assert.equal(count(w, 'cubes'), 41);
});

test('admin remove: one attendee or one suggested Cube, only from its own event', async (t) => {
  const w = world(t);
  const here = await busyEvent(w);
  const there = await busyEvent(w, { date: '2026-12-06' });
  const removeAttendee = async (id: number | string, attendeeId: number | string) =>
    read<{ deleted: number }>(await removeAttendeeRoute({ request: jsonRequest('DELETE', `${ADMIN}/${id}/attendees/${attendeeId}`), env: w.env, params: { id: String(id), attendeeId: String(attendeeId) } }));
  const removeSuggestion = async (id: number | string, suggestionId: number | string) =>
    read<{ deleted: number }>(await removeSuggestionRoute({ request: jsonRequest('DELETE', `${ADMIN}/${id}/suggestions/${suggestionId}`), env: w.env, params: { id: String(id), suggestionId: String(suggestionId) } }));

  // The wrong event, or nothing there at all: nothing is removed.
  for (const [id, attendeeId] of [[there.id, here.sam.id], [here.id, 9999], [9999, here.sam.id], ['abc', here.sam.id], [here.id, 'abc']]) {
    const res = await removeAttendee(id, attendeeId);
    assert.deepEqual([res.status, res.body], [404, { error: 'That person is not on this event.' }]);
  }
  for (const [id, suggestionId] of [[there.id, here.first], [here.id, 9999], [9999, here.first], [here.id, 'abc']]) {
    const res = await removeSuggestion(id, suggestionId);
    assert.deepEqual([res.status, res.body], [404, { error: 'That Cube is not suggested for this event.' }]);
  }
  assert.deepEqual([rowsFor(w, here.id), rowsFor(w, there.id)], [[2, 2, 2], [2, 2, 2]]);

  // Removing Sam takes his ballot and leaves his Cube on the list, unsigned.
  const person = await removeAttendee(here.id, here.sam.id);
  assert.deepEqual([person.status, person.body], [200, { deleted: here.sam.id }]);
  assert.deepEqual(rowsFor(w, here.id), [1, 2, 1]);
  const after = (await adminView(w, here.id)).body;
  assert.deepEqual(after.attendees.map((a) => a.name), ['Ann']);
  assert.deepEqual(after.suggestions.map((s) => [s.id, s.suggestedBy, s.bringer]), [[here.first, null, null], [here.second, 'Ann', null]]);
  refused(await act(w, here.id, { action: 'vote', ranking: [CUBE_A] }, here.sam.token), 401, 'not-attending');

  // Removing a Cube drops it from the count. Ann's ballot is untouched.
  const cube = await removeSuggestion(here.id, here.second);
  assert.deepEqual([cube.status, cube.body], [200, { deleted: here.second }]);
  const counted = (await view(w, here.id, here.ann.token)).body;
  assert.deepEqual([counted.suggestions.map((s) => s.id), counted.me?.ranking, counted.tally.ballots], [[here.first], [], 0]);
  assert.deepEqual(rowsFor(w, there.id), [2, 2, 2]);
});

test('admin delete samples: every sample event goes, and nothing real does', async (t) => {
  const w = world(t);
  const real = await busyEvent(w);
  const samples = [await busyEvent(w, { date: '2026-12-06' }), await busyEvent(w, { date: '2026-12-13' })];
  w.db.exec(`UPDATE cal_events SET is_sample = 1 WHERE id IN (${samples.map((s) => s.id).join(', ')})`);
  rawEvent(w, { title: 'Sample pending', status: 'pending', is_sample: 1 });
  const remove = async () => read<{ deleted: number }>(await deleteSamplesRoute({ request: jsonRequest('DELETE', `${ADMIN}/samples`), env: w.env, params: {} }));

  const res = await remove();
  assert.deepEqual([res.status, res.body], [200, { deleted: 3 }]);
  assert.deepEqual(w.db.raw.prepare('SELECT id FROM cal_events').all().map((r) => r.id), [real.id]);
  assert.deepEqual([count(w, 'cal_attendees'), count(w, 'cal_cube_suggestions'), count(w, 'cal_ballots')], [2, 2, 2]);
  assert.deepEqual(rowsFor(w, real.id), [2, 2, 2]);
  assert.deepEqual((await remove()).body, { deleted: 0 });
});

// ---------- The sample events another file writes ----------

const SAMPLES_SQL = new URL('../../migrations/0009_calendar_samples.sql', import.meta.url);

test('the sample events show only on request, open like any event, and delete cleanly', { skip: !existsSync(SAMPLES_SQL) && 'migrations/0009_calendar_samples.sql is not there' }, async (t) => {
  const w = world(t, {}, testDb({ samples: true }));
  const total = count(w, 'cal_events WHERE is_sample = 1');
  assert.ok(total > 0);
  const real = await busyEvent(w);

  // A month grid: nothing but the real event without the flag, and a full calendar with it.
  assert.deepEqual((await list(w, 'from=2026-11-29&to=2027-01-02')).body.events.map((e) => e.id), [real.id]);
  const shown = (await list(w, 'from=2026-11-29&to=2027-01-02&samples=1')).body.events;
  assert.ok(shown.length > 35 * 2 && shown.filter((e) => !e.isSample).length === 1);

  // Every sample opens through the public route, with its count worked out.
  const ids = w.db.raw.prepare('SELECT id FROM cal_events WHERE is_sample = 1').all().map((r) => Number(r.id));
  let votes = 0;
  for (const id of ids) {
    const res = await read<EventPayload>(await eventRoute({ request: jsonRequest('GET', `/api/events/${id}?samples=1`), env: w.env, params: { id: String(id) } }));
    assert.equal(res.status, 200, `sample event ${id}`);
    assert.ok(res.body.event.isSample && res.body.event.going === res.body.attendees.length);
    if (res.body.event.cubeMode === 'set') assert.ok(res.body.event.cube, `set event ${id} has its Cube`);
    if (res.body.tally.ballots > 0) votes += 1;
  }
  assert.ok(votes > 0, 'some sample votes are under way');

  const remove = await read<{ deleted: number }>(await deleteSamplesRoute({ request: jsonRequest('DELETE', `${ADMIN}/samples`), env: w.env, params: {} }));
  assert.deepEqual(remove.body, { deleted: total });
  assert.deepEqual([count(w, 'cal_events'), count(w, 'cal_attendees'), count(w, 'cal_cube_suggestions'), count(w, 'cal_ballots')], [1, 2, 2, 2]);
  assert.deepEqual(rowsFor(w, real.id), [2, 2, 2]);
});

// ---------- POST /api/events/suggest ----------

const SUGGESTION = {
  title: 'Pauper Cube Night', kind: 'draft', date: '2026-12-05', start_time: '18:00', end_time: '21:30', location_name: 'Sam’s place',
  location_address: '12 Elm St, Carmel, IN', description: 'Bring a deck box.\r\nSnacks welcome.', has_draft: 'yes', name: 'Sam W.', email: 'sam@example.com', website: '',
};
const SENT = `${SITE}/cube-commonwealth/events/suggest/?event=sent#form`;
const problemUrl = (code: keyof typeof SUGGEST_MESSAGES) => `${SITE}/cube-commonwealth/events/suggest/?event_error=${code}#form`;

/** Posts the suggest form and answers where the visitor is sent next. */
async function sendForm(w: World, fields: Record<string, string>, ip = IP): Promise<string | null> {
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) form.append(key, value);
  const res = await suggestRoute({ request: new Request(`${SITE}/api/events/suggest`, { method: 'POST', body: form, headers: { 'CF-Connecting-IP': ip } }), env: w.env, params: {} });
  assert.equal(res.status, 303);
  return res.headers.get('location');
}

test('suggest form: the event is saved as pending and Levi gets an email', async (t) => {
  const w = world(t);
  assert.equal(await sendForm(w, SUGGESTION), SENT);

  assert.deepEqual(row(w, 'SELECT * FROM cal_events'), {
    id: 1, community: 'cube-commonwealth', title: 'Pauper Cube Night', kind: 'draft', date: '2026-12-05', start_time: '18:00', end_time: '21:30', tz: TZ,
    starts_at: '2026-12-05T23:00:00.000Z', ends_at: '2026-12-06T02:30:00.000Z', description: 'Bring a deck box.\nSnacks welcome.', location_name: 'Sam’s place',
    location_address: '12 Elm St, Carmel, IN', cube_mode: 'vote', cube_id: null, vote_close_hours: 24, status: 'pending', is_sample: 0,
    submitter_name: 'Sam W.', submitter_email: 'sam@example.com', closed_tally: null, created_at: NOW.toISOString(), updated_at: NOW.toISOString(),
  });

  assert.equal(w.mail.length, 1);
  assert.deepEqual([w.mail[0].subject, w.mail[0].replyTo], ['Event to approve: Pauper Cube Night (Sat, Dec 5)', 'sam@example.com']);
  assert.equal(w.mail[0].text, [
    'A new event is waiting for your approval.',
    '',
    'Title:    Pauper Cube Night',
    'Kind:     Draft',
    'Date:     Saturday, December 5, 2026',
    'Time:     6:00 pm to 9:30 pm',
    'Place:    Sam’s place',
    'Address:  12 Elm St, Carmel, IN',
    'Cube:     People will draft a Cube. Attendees vote on which one.',
    'From:     Sam W.',
    'Email:    sam@example.com',
    'About:    Bring a deck box.\n        | Snacks welcome.',
    '',
    'Approve, edit, or reject it here (event #1):',
    `${SITE}/cube-commonwealth/where-we-play/admin/calendar/`,
  ].join('\n'));

  // Nothing is public until Levi approves it. The admin sees who sent it.
  assert.deepEqual((await list(w, 'from=2026-12-01&to=2026-12-31&samples=1')).body.events, []);
  refused(await view(w, 1), 404, 'gone');
  const queued = (await adminList(w)).body.events[0];
  assert.deepEqual([queued.status, queued.submitterName, queued.submitterEmail], ['pending', 'Sam W.', 'sam@example.com']);
});

test('suggest form: the least a visitor can send still works, and the email says what is missing', async (t) => {
  const w = world(t);
  assert.equal(await sendForm(w, { title: 'Board Game Meetup', kind: 'meetup', date: '2026-11-23', start_time: '20:00', end_time: '01:00', name: 'Bea' }), SENT);
  const saved = row<Record<string, string | number | null>>(w, 'SELECT * FROM cal_events');
  assert.deepEqual(
    [saved.kind, saved.cube_mode, saved.status, saved.submitter_email, saved.location_name, saved.description, saved.starts_at, saved.ends_at],
    ['meetup', 'none', 'pending', null, null, null, '2026-11-24T01:00:00.000Z', '2026-11-24T06:00:00.000Z'],
  );
  assert.ok(!('replyTo' in w.mail[0]));
  assert.equal(w.mail[0].subject, 'Event to approve: Board Game Meetup (Mon, Nov 23)');
  for (const line of ['Kind:     Meetup', 'Time:     8:00 pm to 1:00 am (ends the next day)', 'Place:    (not given)', 'Address:  (not given)', 'Cube:     No Cube draft.', 'Email:    (not given)', 'About:    (none)']) {
    assert.ok(w.mail[0].text.includes(`\n${line}\n`), line);
  }

  // A long title is trimmed in the subject only, and never through the middle of an emoji.
  const long = 'A very long title that keeps going well past the sixty characters the subject line has room for';
  assert.equal(await sendForm(w, { ...SUGGESTION, title: long }), SENT);
  assert.equal(w.mail[1].subject, `Event to approve: ${long.slice(0, 60)} (Sat, Dec 5)`);
  assert.ok(w.mail[1].text.includes(`Title:    ${long}\n`));
  assert.equal(await sendForm(w, { ...SUGGESTION, title: `${'x'.repeat(59)}\u{1F3B2} and on` }), SENT);
  assert.equal(w.mail[2].subject, `Event to approve: ${'x'.repeat(59)}\u{1F3B2} (Sat, Dec 5)`);
});

test('the email lines up its fields and ends with the admin link', () => {
  const text = emailText(
    { title: 'T', kind: 'other', date: '2026-12-05', startTime: '09:00', endTime: '10:00', locationName: null, locationAddress: null, description: null, cubeMode: 'none', submitterName: 'N', submitterEmail: null },
    null,
    'https://example.com/admin/',
  );
  const fields = text.split('\n').filter((line) => /^[A-Z][a-z]+: /.test(line));
  assert.equal(fields.length, 10);
  assert.deepEqual([...new Set(fields.map((line) => line.search(/(?<=:\s+)\S/)))], [10]);
  assert.ok(text.endsWith('Approve, edit, or reject it here:\nhttps://example.com/admin/'));
});

test('suggest form: a filled honeypot pretends to work and saves nothing', async (t) => {
  const w = world(t);
  assert.equal(await sendForm(w, { ...SUGGESTION, website: 'https://spam.example' }), SENT);
  assert.deepEqual([count(w, 'cal_events'), w.mail.length, count(w, 'wwp_rate_limits')], [0, 0, 0]);
});

test('suggest form: each problem sends the visitor back with its code', async (t) => {
  const w = world(t);
  const problems: [Record<string, string>, keyof typeof SUGGEST_MESSAGES][] = [
    [{ ...SUGGESTION, title: ' ' }, 'missing'],
    [{ ...SUGGESTION, name: '' }, 'missing'],
    [{ ...SUGGESTION, date: '2026-11-22' }, 'date'],
    [{ ...SUGGESTION, date: '2029-01-01' }, 'date'],
    [{ ...SUGGESTION, date: '12/05/2026' }, 'date'],
    [{ ...SUGGESTION, end_time: '18:00' }, 'time'],
    [{ ...SUGGESTION, start_time: '6pm' }, 'time'],
    [{ ...SUGGESTION, email: 'nope' }, 'email'],
    [{ ...SUGGESTION, title: 'x'.repeat(101) }, 'long'],
    [{ ...SUGGESTION, description: 'x'.repeat(2001) }, 'long'],
  ];
  for (const [fields, code] of problems) {
    assert.ok(code in SUGGEST_MESSAGES);
    assert.equal(await sendForm(w, fields), problemUrl(code), code);
  }
  // Ten tries, nothing saved, nothing sent, and none of them counted against the hour.
  assert.deepEqual([count(w, 'cal_events'), w.mail.length, count(w, 'wwp_rate_limits')], [0, 0, 0]);
  assert.equal(await sendForm(w, SUGGESTION), SENT);

  // A post that is not a form at all.
  const res = await suggestRoute({ request: new Request(`${SITE}/api/events/suggest`, { method: 'POST', body: '{"title":"x"}', headers: { 'Content-Type': 'application/json' } }), env: w.env, params: {} });
  assert.deepEqual([res.status, res.headers.get('location')], [303, problemUrl('missing')]);
});

test('suggest form: "today" is today in Indianapolis, not in UTC', async (t) => {
  const w = world(t);
  // 10:00 pm on Sunday the 22nd in Indianapolis is already the 23rd in UTC.
  t.mock.timers.setTime(Date.parse('2026-11-23T03:00:00.000Z'));
  assert.equal(await sendForm(w, { ...SUGGESTION, date: '2026-11-22' }), SENT);
  assert.equal(await sendForm(w, { ...SUGGESTION, date: '2026-11-21' }), problemUrl('date'));
});

test('suggest form: Turnstile is checked when the secret is set', async (t) => {
  const w = world(t, { TURNSTILE_SECRET_KEY: 'the-secret' });
  const sent: FormData[] = [];
  let human = false;
  t.mock.method(globalThis, 'fetch', async (_url: string | URL | Request, init?: RequestInit) => {
    sent.push(init?.body as FormData);
    return new Response(JSON.stringify({ success: human }));
  });
  assert.equal(await sendForm(w, SUGGESTION), problemUrl('verify'));
  assert.equal(sent.length, 0);
  assert.equal(await sendForm(w, { ...SUGGESTION, 'cf-turnstile-response': 'robot' }), problemUrl('verify'));
  assert.deepEqual([count(w, 'cal_events'), w.mail.length, count(w, 'wwp_rate_limits')], [0, 0, 0]);
  human = true;
  assert.equal(await sendForm(w, { ...SUGGESTION, 'cf-turnstile-response': 'person' }), SENT);
  assert.deepEqual([sent[1].get('secret'), sent[1].get('response'), sent[1].get('remoteip')], ['the-secret', 'person', IP]);
  assert.equal(count(w, 'cal_events'), 1);
});

test('suggest form: five an hour for one address', async (t) => {
  const w = world(t);
  for (let i = 1; i <= PER_HOUR.suggest; i += 1) assert.equal(await sendForm(w, { ...SUGGESTION, title: `Event ${i}` }), SENT);
  assert.equal(await sendForm(w, { ...SUGGESTION, title: 'Event 6' }), problemUrl('slow'));
  assert.deepEqual([count(w, 'cal_events'), w.mail.length], [5, 5]);

  // The form has its own count: the same address can still join an event, and another address can still suggest.
  const id = await addEvent(w);
  await join(w, id, 'Sam');
  assert.equal(await sendForm(w, SUGGESTION, '198.51.100.9'), SENT);
  t.mock.timers.setTime(NOW.getTime() + HOUR);
  assert.equal(await sendForm(w, { ...SUGGESTION, title: 'Event 6' }), SENT);
});

test('suggest form: the event is saved even when the email fails', async (t) => {
  const log = quiet(t);
  const w = world(t);
  w.notify.status = 500;
  assert.equal(await sendForm(w, SUGGESTION), SENT);
  assert.deepEqual([count(w, "cal_events WHERE status = 'pending'"), w.mail.length], [1, 1]);

  const unbound: World = { ...w, env: { ...w.env, NOTIFY: undefined } };
  assert.equal(await sendForm(unbound, { ...SUGGESTION, title: 'No Worker' }), SENT);
  const unreachable: World = { ...w, env: { ...w.env, NOTIFY: { fetch: async () => { throw new Error('offline'); } } } };
  assert.equal(await sendForm(unreachable, { ...SUGGESTION, title: 'Offline' }), SENT);
  assert.equal(count(w, "cal_events WHERE status = 'pending'"), 3);
  assert.equal(log.mock.callCount(), 3);
});

test('suggest form: without the database, or when it fails, the visitor is told and no email goes out', async (t) => {
  const log = quiet(t);
  const w = world(t);
  const noDb: World = { ...w, env: { ...w.env, DB: undefined } };
  assert.equal(await sendForm(noDb, SUGGESTION), problemUrl('unavailable'));
  const broken: World = { ...w, env: { ...w.env, DB: { prepare: () => { throw new Error('D1 is down'); }, batch: async () => [] } } };
  assert.equal(await sendForm(broken, SUGGESTION), problemUrl('unavailable'));
  // The limiter works but the insert does not.
  const halfBroken: World = { ...w, env: { ...w.env, DB: { prepare: (sql) => w.db.prepare(sql), batch: async () => { throw new Error('batch failed'); } } } };
  assert.equal(await sendForm(halfBroken, SUGGESTION), problemUrl('unavailable'));
  assert.deepEqual([count(w, 'cal_events'), w.mail.length, log.mock.callCount()], [0, 0, 3]);
});

// ---------- House rules ----------

test('the server files carry no em dashes or en dashes', () => {
  const files = [
    'migrations/0008_calendar.sql', 'src/server/calendar/env.ts', 'src/server/calendar/guard.ts', 'src/server/calendar/db.ts', 'src/server/calendar/view.ts',
    'src/server/calendar/actions.ts', 'src/server/calendar/admin.ts', 'functions/api/events/index.ts', 'functions/api/events/[id].ts', 'functions/api/events/suggest.ts',
    'functions/api/where-we-play/admin/calendar/index.ts', 'functions/api/where-we-play/admin/calendar/[id].ts', 'functions/api/where-we-play/admin/calendar/samples.ts',
    'functions/api/where-we-play/admin/calendar/[id]/attendees/[attendeeId].ts', 'functions/api/where-we-play/admin/calendar/[id]/suggestions/[suggestionId].ts',
    'tests/calendar/server.test.ts',
  ];
  const root = fileURLToPath(new URL('../../', import.meta.url));
  for (const file of files) assert.ok(!/[\u2014\u2013]/.test(readFileSync(joinPath(root, file), 'utf8')), file);
});

// ---------- Fixes from the review ----------

const OWN_TOKEN = 'a'.repeat(43);

test('attend with a token the browser made: a retry after a lost answer finds the same sign-up', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const first = await act(w, id, { action: 'attend', name: 'Sam' }, OWN_TOKEN);
  assert.equal(first.status, 200);
  assert.equal(first.body.token, OWN_TOKEN);
  const retry = await act(w, id, { action: 'attend', name: 'Sam' }, OWN_TOKEN);
  assert.equal(retry.status, 200);
  assert.equal(retry.body.me?.id, first.body.me?.id);
  assert.equal(count(w, 'cal_attendees'), 1);
  assert.equal((await view(w, id, OWN_TOKEN)).body.me?.name, 'Sam');
  // Someone else cannot take the name.
  refused(await act(w, id, { action: 'attend', name: 'sam' }, 'b'.repeat(43)), 409, 'name-taken');
});

test('the caps hold when a rival lands between the check and the write', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  await suggest(w, id, CUBE_A, sam.token);
  await suggest(w, id, CUBE_B, sam.token);
  const [third, fourth] = (w.db.raw.prepare("SELECT id FROM cubes WHERE status = 'approved' AND id NOT IN (?, ?) LIMIT 2").all(CUBE_A, CUBE_B) as { id: number }[]).map((c) => c.id);
  const rival = () => w.db.exec(`INSERT INTO cal_cube_suggestions (event_id, cube_id, suggested_by, created_at) VALUES (${id}, ${third}, ${sam.id}, 'now')`);
  const racing: World = { ...w, env: { ...w.env, DB: withRival(w.db, /EXISTS \(SELECT 1 FROM cubes/, rival) } };
  refused(await act(racing, id, { action: 'suggest', cubeId: fourth }, sam.token), 409, 'limit');
  assert.equal(count(w, 'cal_cube_suggestions WHERE suggested_by = ?', sam.id), 3);
});

test('a closed vote keeps its result when voters drop out, until the admin changes something', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const [ann, ben, cam] = [await join(w, id, 'Ann'), await join(w, id, 'Ben'), await join(w, id, 'Cam')];
  await suggest(w, id, CUBE_A, ann.token);
  await suggest(w, id, CUBE_B, cam.token);
  for (const p of [ann, ben]) await act(w, id, { action: 'vote', ranking: [CUBE_A] }, p.token);
  await act(w, id, { action: 'vote', ranking: [CUBE_B] }, cam.token);

  t.mock.timers.setTime(Date.parse('2026-11-28T19:00:00.000Z')); // an hour after voting closed
  assert.equal((await act(w, id, { action: 'leave' }, ann.token)).body.tally.winner, CUBE_A);
  assert.equal((await act(w, id, { action: 'leave' }, ben.token)).body.tally.winner, CUBE_A);
  assert.equal((await view(w, id)).body.tally.winner, CUBE_A);

  // Any edit by the admin lets go of the kept count.
  await adminPatch(w, id, { title: 'Sunday Draft' });
  assert.equal((await view(w, id)).body.tally.winner, CUBE_B);
});

test('anyone may take their name off a cancelled event, and nothing else', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const sam = await join(w, id, 'Sam');
  await adminPatch(w, id, { status: 'cancelled' });
  refused(await act(w, id, { action: 'vote', ranking: [] }, sam.token), 409, 'rsvp-closed');
  assert.equal((await act(w, id, { action: 'leave' }, sam.token)).status, 200);
  assert.equal(count(w, 'cal_attendees'), 0);
});

test('a Cube whose suggester has left can be withdrawn by anyone going', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const [sam, ann] = [await join(w, id, 'Sam'), await join(w, id, 'Ann')];
  const cube = await suggest(w, id, CUBE_A, sam.token);
  await act(w, id, { action: 'leave' }, sam.token);
  assert.equal((await act(w, id, { action: 'withdraw', suggestionId: cube }, ann.token)).status, 200);
  assert.equal(count(w, 'cal_cube_suggestions'), 0);
});

test('a sample event answers only a request that asks for samples', async (t) => {
  const w = world(t);
  const id = rawEvent(w, { is_sample: 1 });
  refused(await view(w, id), 404, 'gone');
  refused(await act(w, id, { action: 'attend', name: 'Sam' }), 404, 'gone');
  const res = await read<EventPayload>(await eventRoute({ request: jsonRequest('GET', `/api/events/${id}?samples=1`), env: w.env, params: { id: String(id) } }));
  assert.equal(res.status, 200);
});

test('a pages.dev preview can read events but not write them', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  const request = new Request(`https://cube-events.theludarium.pages.dev/api/events/${id}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'attend', name: 'Sam' }) });
  const res = await read<AttendResponse>(await actionRoute({ request, env: w.env, params: { id: String(id) } }));
  assert.deepEqual([res.status, res.body.error], [503, 'unavailable']);
  assert.equal(count(w, 'cal_attendees'), 0);
});

test('invisible characters cannot make a second copy of a name', async (t) => {
  const w = world(t);
  const id = await addEvent(w);
  await join(w, id, 'Sam');
  for (const name of ['Sam​', '‮Sam', 'S͏am', 'Sam️']) refused(await act(w, id, { action: 'attend', name }), 409, 'name-taken', name);
});

test('the admin middleware refuses a write sent from another site', () => {
  const write = (headers: Record<string, string>) => new Request(`${SITE}${ADMIN}`, { method: 'POST', headers });
  assert.equal(isCrossSiteWrite(write({ 'Sec-Fetch-Site': 'cross-site' })), true);
  assert.equal(isCrossSiteWrite(write({ Origin: 'https://evil.example' })), true);
  assert.equal(isCrossSiteWrite(write({ 'Sec-Fetch-Site': 'same-origin', Origin: SITE })), false);
  assert.equal(isCrossSiteWrite(new Request(`${SITE}${ADMIN}`, { headers: { 'Sec-Fetch-Site': 'cross-site' } })), false);
});
