// The Discord posts for the events calendar: what is due when, the words, and
// the Worker's run against real SQL with a stand-in for Discord.
import assert from 'node:assert/strict';
import test from 'node:test';
import { announceMessage, cancelMessage, duePosts, isWebhookUrl, plain, resultMessage, type DiscordEvent } from '../../src/lib/calendar/discord.ts';
import { eventInstants } from '../../src/lib/calendar/dates.ts';
import { postDue } from '../../workers/calendar-discord/src/post.ts';
import { testDb } from './d1.ts';

const TZ = 'America/Indiana/Indianapolis';
const SITE = 'https://theludarium.com';
const HOOK = 'https://discord.com/api/webhooks/123456/abc-DEF_789';
const NOW = new Date('2026-11-23T15:00:00.000Z'); // Monday, 10:00 am in Indianapolis

const event = (over: Partial<DiscordEvent> = {}): DiscordEvent => {
  const date = over.date ?? '2026-11-29';
  return {
    id: 1, title: 'Sunday Cube Draft', kind: 'draft', date, start_time: '13:00', end_time: '16:30',
    starts_at: eventInstants(date, '13:00', '16:30', TZ).startsAt, description: null, location_name: null, location_address: null,
    cube_mode: 'vote', cube_id: null, cube_name: null, vote_close_hours: 24, status: 'approved', announce: 1,
    announced_at: null, result_posted_at: null, cancel_posted_at: null, ...over,
  };
};

test('an event is announced once it is within a week, and never after it starts', () => {
  assert.deepEqual(duePosts([event()], NOW).map((p) => p.kind), ['announce']);
  assert.deepEqual(duePosts([event({ date: '2026-12-06' })], NOW), [], 'more than a week out');
  assert.deepEqual(duePosts([event({ date: '2026-11-22' })], NOW), [], 'already over');
  assert.deepEqual(duePosts([event({ announce: 0 })], NOW), [], 'the organizer said no');
  assert.deepEqual(duePosts([event({ announced_at: 'x' })], NOW), [], 'already posted');
  assert.deepEqual(duePosts([event({ status: 'cancelled' })], NOW), [], 'a cancelled event that was never announced says nothing');
});

test('the vote result follows an announced event once voting closes, and a cancellation once', () => {
  const closed = new Date('2026-11-28T18:30:00.000Z'); // Saturday, half an hour after voting closed
  assert.deepEqual(duePosts([event({ announced_at: 'x' })], closed).map((p) => p.kind), ['result']);
  assert.deepEqual(duePosts([event({ announced_at: 'x' })], NOW), [], 'still open');
  assert.deepEqual(duePosts([event({ announced_at: 'x', result_posted_at: 'y' })], closed), []);
  assert.deepEqual(duePosts([event({ announced_at: 'x', cube_mode: 'none' })], closed), []);
  assert.deepEqual(duePosts([event({ announced_at: 'x', status: 'cancelled' })], NOW).map((p) => p.kind), ['cancel']);
  assert.deepEqual(duePosts([event({ announced_at: 'x', status: 'cancelled', cancel_posted_at: 'z' })], NOW), []);
});

test('messages link the event and can never ping anyone or fake formatting', () => {
  const hostile = event({ title: '@everyone **FREE** [click](https://evil.example)', description: '<@123> hi @here', location_name: 'Back room' });
  const a = announceMessage(hostile, SITE);
  assert.deepEqual(a.allowed_mentions, { parse: [] });
  assert.ok(!a.content.includes('@everyone') && !a.embeds![0].description.includes('@here'));
  assert.ok(a.content.includes('\\*\\*FREE\\*\\*') && a.content.includes('\\[click\\]'));
  assert.equal(a.embeds![0].url, `${SITE}/cube-commonwealth/events/?event=1`);
  assert.ok(a.embeds![0].description.startsWith('**Sunday, November 29, 1:00 pm to 4:30 pm**'));
  assert.ok(a.embeds![0].description.includes('suggest and rank the Cube'));
  assert.equal(plain('a_b'), 'a\\_b');

  const tally = { ballots: 5, winner: 24, tied: false, rounds: [] };
  assert.match(resultMessage(event(), SITE, tally, 'Mono Blue').content, /The vote picked \*\*Mono Blue\*\* \(5 ballots\)/);
  assert.match(resultMessage(event({ cube_name: 'Star Wars Cube' }), SITE, tally, 'Mono Blue').content, /The Cube to draft is \*\*Star Wars Cube\*\*/);
  assert.match(resultMessage(event(), SITE, { ballots: 0, winner: null, tied: false, rounds: [] }, null).content, /No votes came in/);
  assert.match(cancelMessage(event(), SITE).content, /^Cancelled: \*\*Sunday Cube Draft\*\* on Sunday, November 29/);
  const text = JSON.stringify([a, cancelMessage(event(), SITE)]);
  assert.ok(!/[\u2014\u2013]/.test(text), 'no em or en dashes');
});

test('only a real Discord webhook address is called', () => {
  assert.ok(isWebhookUrl(HOOK));
  for (const bad of [undefined, '', 'https://evil.example/api/webhooks/1/x', 'http://discord.com/api/webhooks/1/x', `${HOOK}/../x`]) assert.ok(!isWebhookUrl(bad), String(bad));
});

// ---------- The Worker against real SQL ----------

function setup() {
  const db = testDb();
  const insert = (title: string, date: string, over: Record<string, string | number | null> = {}) => {
    const { startsAt, endsAt } = eventInstants(date, '13:00', '16:30', TZ);
    const row: Record<string, string | number | null> = { community: 'cube-commonwealth', title, kind: 'draft', date, start_time: '13:00', end_time: '16:30', tz: TZ, starts_at: startsAt, ends_at: endsAt, cube_mode: 'vote', status: 'approved', is_sample: 0, created_at: NOW.toISOString(), updated_at: NOW.toISOString(), ...over };
    const keys = Object.keys(row);
    return Number(db.raw.prepare(`INSERT INTO cal_events (${keys.join(', ')}) VALUES (${keys.map(() => '?').join(', ')})`).run(...Object.values(row)).lastInsertRowid);
  };
  const sent: { url: string; body: { content: string } }[] = [];
  let status = 204;
  const send = (async (url: string, init?: RequestInit) => {
    sent.push({ url, body: JSON.parse(String(init?.body)) });
    return new Response(null, { status });
  }) as typeof fetch;
  return { db, insert, sent, send, fail: () => (status = 500), heal: () => (status = 204) };
}
const noWait = async () => {};
const col = (db: ReturnType<typeof testDb>, id: number, name: string) => (db.raw.prepare(`SELECT ${name} AS v FROM cal_events WHERE id = ?`).get(id) as { v: unknown }).v;

test('the Worker posts each event once, skips samples and far-off events, and tries again after a failure', async () => {
  const w = setup();
  const soon = w.insert('Sunday Cube Draft', '2026-11-29');
  w.insert('Sample Draft', '2026-11-28', { is_sample: 1 });
  w.insert('Later Draft', '2026-12-13');
  w.insert('Quiet Draft', '2026-11-27', { announce: 0 });

  const env = { DB: w.db, DISCORD_EVENTS_WEBHOOK: HOOK };
  w.fail();
  const first = await postDue(env, NOW, w.send, noWait);
  assert.deepEqual(first.posted, []);
  assert.equal(first.failed.length, 1);
  assert.equal(col(w.db, soon, 'announced_at'), null, 'released for the next run');

  w.heal();
  assert.deepEqual((await postDue(env, NOW, w.send, noWait)).posted, [`announce ${soon}`]);
  assert.deepEqual((await postDue(env, NOW, w.send, noWait)).posted, [], 'never twice');
  assert.equal(w.sent.at(-1)!.url, `${HOOK}?wait=true`);
  assert.match(w.sent.at(-1)!.body.content, /Sunday Cube Draft/);
});

test('the Worker posts the vote result when voting closes, and does nothing without a webhook', async () => {
  const w = setup();
  const id = w.insert('Sunday Cube Draft', '2026-11-29', { announced_at: NOW.toISOString() });
  const cube = (w.db.raw.prepare("SELECT id, name FROM cubes WHERE status = 'approved' ORDER BY id LIMIT 1").get() as { id: number; name: string });
  w.db.raw.prepare("INSERT INTO cal_attendees (event_id, name, token_hash, created_at) VALUES (?, 'Ann', 'h1', 'now')").run(id);
  w.db.raw.prepare("INSERT INTO cal_cube_suggestions (event_id, cube_id, suggested_by, created_at) VALUES (?, ?, 1, 'now')").run(id, cube.id);
  w.db.raw.prepare('INSERT INTO cal_ballots (event_id, attendee_id, ranking, updated_at) VALUES (?, 1, ?, ?)').run(id, JSON.stringify([cube.id]), 'now');

  assert.match(String((await postDue({ DB: w.db }, NOW, w.send, noWait)).skipped), /not set/);
  const closed = new Date('2026-11-28T18:30:00.000Z');
  const report = await postDue({ DB: w.db, DISCORD_EVENTS_WEBHOOK: HOOK }, closed, w.send, noWait);
  assert.deepEqual(report.posted, [`result ${id}`]);
  assert.ok(w.sent[0].body.content.includes(`The vote picked **${plain(cube.name)}** (1 ballot)`), w.sent[0].body.content);
});
