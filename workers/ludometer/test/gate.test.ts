import { describe, it, expect } from 'vitest';
import { handleFetch } from '../src/app';
import type { Env } from '../src/env';
import { fakeD1 } from './fake-d1';

const row = (rank: number, game_id: number, prev: number | null) => ({
  week: '2026-10-19', game_id, name: `Game ${game_id}`, rank, score: 0.8 / rank, attention: 0.9, interest: 0.5, play: 0.1234,
  prev_rank: prev, bgg_hot_rank: rank + 1, days_on_list: 10,
});
const ROWS = [row(1, 11, 3), row(2, 12, 1), row(3, 13, null)];

function makeEnv(over: Partial<Env> = {}) {
  const d1 = fakeD1(sql => {
    if (sql.includes('MAX(week)')) return { first: { week: '2026-10-19' } };
    if (sql.includes('FROM weekly_scores WHERE week')) return { all: ROWS };
    if (sql.includes('FROM settings')) return { all: [{ key: 'weights', value: '{"attention":0.6,"interest":0.3,"play":0.1}' }] };
    return {};
  });
  const env: Env = {
    DB: d1.db, PUBLIC_API: 'false', ADMIN_TOKEN: 'admin-secret', EVENTS_TOKEN: 'events-secret', KIT_WEBHOOK_KEY: 'kit-key',
    ALLOWED_ORIGINS: 'https://theludarium.com', ...over,
  };
  return { env, calls: d1.calls };
}
const get = (path: string, headers: Record<string, string> = {}) => new Request(`https://theludarium.com${path}`, { headers });
const post = (path: string, body: unknown, headers: Record<string, string> = {}) =>
  new Request(`https://theludarium.com${path}`, { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json', ...headers } });
const ADMIN = { Authorization: 'Bearer admin-secret' };

describe('PUBLIC_API gate', () => {
  for (const path of ['/api/ludometer/week', '/api/ludometer/feed', '/api/ludometer/game/11']) {
    it(`closes ${path} while PUBLIC_API is "false"`, async () => {
      const { env, calls } = makeEnv();
      expect((await handleFetch(get(path), env)).status).toBe(403);
      expect((await handleFetch(get(path, { Authorization: 'Bearer wrong' }), env)).status).toBe(403);
      expect((await handleFetch(get(path, { Authorization: 'Bearer events-secret' }), env)).status).toBe(403);
      expect(calls).toHaveLength(0); // nothing read before the gate
    });
  }

  it('opens to the admin token while closed, and never caches publicly', async () => {
    const { env } = makeEnv();
    const res = await handleFetch(get('/api/ludometer/week', ADMIN), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('private, no-store');
  });

  it('stays closed when ADMIN_TOKEN is not set', async () => {
    const { env } = makeEnv({ ADMIN_TOKEN: undefined });
    expect((await handleFetch(get('/api/ludometer/week', { Authorization: 'Bearer ' }), env)).status).toBe(403);
  });

  it('opens to everyone when PUBLIC_API is "true", with attribution and no weights', async () => {
    const { env } = makeEnv({ PUBLIC_API: 'true' });
    const res = await handleFetch(get('/api/ludometer/week'), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Cache-Control')).toBe('public, max-age=300');
    const body: any = await res.json();
    expect(body.attribution).toMatchObject({ text: 'Powered by BGG', url: 'https://boardgamegeek.com' });
    expect(JSON.stringify(body)).not.toMatch(/weight/i);
    expect(body.games[0]).toEqual({
      rank: 1, movement: 2, isNew: false, name: 'Game 11', game_id: 11, score: 80, attention: 90, interest: 50, play: 12, bgg_hot_rank: 2, days_on_list: 10,
    });
    expect(body.games[2]).toMatchObject({ movement: null, isNew: true });
  });

  it('builds the feed with top 10, risers and fallers', async () => {
    const { env } = makeEnv({ PUBLIC_API: 'true' });
    const body: any = await (await handleFetch(get('/api/ludometer/feed'), env)).json();
    expect(body.top10).toHaveLength(3);
    expect(body.risers.map((r: any) => r.game_id)).toEqual([11]);
    expect(body.fallers.map((r: any) => r.game_id)).toEqual([12]);
    expect(body.newEntries.map((r: any) => r.game_id)).toEqual([13]);
    expect(body.attribution.text).toBe('Powered by BGG');
  });

  it('keeps admin routes behind the admin token even when public', async () => {
    const { env } = makeEnv({ PUBLIC_API: 'true' });
    expect((await handleFetch(get('/api/ludometer/admin/settings'), env)).status).toBe(403);
    const ok = await handleFetch(get('/api/ludometer/admin/settings', ADMIN), env);
    expect(ok.status).toBe(200);
  });

  it('rejects a bad week', async () => {
    const { env } = makeEnv();
    expect((await handleFetch(get('/api/ludometer/week?week=last-week', ADMIN), env)).status).toBe(400);
  });

  it('answers CORS preflight only for allowed origins', async () => {
    const { env } = makeEnv();
    const ok = await handleFetch(new Request('https://theludarium.com/api/ludometer/week', { method: 'OPTIONS', headers: { Origin: 'https://theludarium.com' } }), env);
    expect(ok.headers.get('Access-Control-Allow-Origin')).toBe('https://theludarium.com');
    const no = await handleFetch(new Request('https://theludarium.com/api/ludometer/week', { method: 'OPTIONS', headers: { Origin: 'https://evil.test' } }), env);
    expect(no.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});

describe('events and Kit webhook', () => {
  it('needs the events token and a known type', async () => {
    const { env, calls } = makeEnv();
    expect((await handleFetch(post('/api/ludometer/events', { type: 'play', game_id: 13 }), env)).status).toBe(403);
    const bad = await handleFetch(post('/api/ludometer/events', [{ type: 'play', game_id: 13 }, { type: 'hug', game_id: 13 }], { Authorization: 'Bearer events-secret' }), env);
    expect(bad.status).toBe(400);
    expect(((await bad.json()) as any).error).toMatch(/^Event 1: type/);
    expect(calls).toHaveLength(0);
  });

  it('stores events and learns slugs', async () => {
    const { env, calls } = makeEnv();
    const res = await handleFetch(post('/api/ludometer/events', [
      { type: 'page_view', game_id: 13, game_slug: 'catan', source: 'site' },
      { type: 'play', game_slug: 'catan', value: 2 },
    ], { Authorization: 'Bearer events-secret' }), env);
    expect(res.status).toBe(201);
    const inserts = calls.filter(c => c.sql.startsWith('INSERT INTO events'));
    expect(inserts.map(c => c.args.slice(1, 6))).toEqual([['page_view', 13, 'catan', 1, 'site'], ['play', null, 'catan', 2, 'api']]);
    expect(calls.some(c => c.sql.startsWith('UPDATE OR IGNORE games SET slug'))).toBe(true);
  });

  it('checks the Kit key and records tag hits', async () => {
    const { env, calls } = makeEnv();
    const delivery = { delivery_id: 1, events: [{ id: 'e1', type: 'subscriber.tag_added', created: '2026-10-20T10:00:00Z', data: { subscriber: { id: 9 }, tag: { id: 1, name: 'course-catan' } } }] };
    expect((await handleFetch(post('/api/ludometer/kit-webhook?key=nope', delivery), env)).status).toBe(403);
    const res = await handleFetch(post('/api/ludometer/kit-webhook?key=kit-key', delivery), env);
    expect(await res.json()).toEqual({ ok: true, recorded: 1, duplicates: 0, ignored: 0 });
    const ins = calls.find(c => c.sql.includes('INSERT INTO events'))!;
    expect(ins.args.slice(0, 4)).toEqual(['2026-10-20T10:00:00.000Z', 'course_signup', 'catan', 'catan']);
  });

  it('requires a signature when the Kit secret is set', async () => {
    const { env } = makeEnv({ KIT_WEBHOOK_SECRET: 's' });
    expect((await handleFetch(post('/api/ludometer/kit-webhook?key=kit-key', { events: [] }), env)).status).toBe(401);
  });
});

describe('admin', () => {
  it('serves the admin page without needing a token', async () => {
    const { env } = makeEnv();
    const res = await handleFetch(get('/admin/'), env);
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toMatch(/text\/html/);
    expect(await res.text()).toContain('Ludometer Admin');
  });

  it('validates settings updates', async () => {
    const { env } = makeEnv();
    const put = (body: unknown) => handleFetch(new Request('https://theludarium.com/api/ludometer/admin/settings', { method: 'PUT', body: JSON.stringify(body), headers: ADMIN }), env);
    expect((await put({ weights: { attention: 2, interest: 0, play: 0 } })).status).toBe(400);
    expect((await put({ colour: 'green' })).status).toBe(400);
    expect((await put({ weights: { attention: 0.5, interest: 0.3, play: 0.2 }, high_play_threshold: 400 })).status).toBe(200);
  });

  it('builds a broadcast draft that warns while the license is pending', async () => {
    const { env } = makeEnv();
    const body: any = await (await handleFetch(get('/api/ludometer/admin/broadcast?week=2026-10-19', ADMIN), env)).json();
    expect(body.subject).toContain('October 19');
    expect(body.warnings[0]).toMatch(/Do not send yet/);
    expect(body.html).toContain('Powered by BGG');
    expect(body.text).toContain('1. Game 11 (up 2), BGG Hotness #2');
  });
});
