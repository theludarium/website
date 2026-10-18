// The Ludarium x BoardGameGeek Worker.
// Routes (all GET, JSON):
//   /api/bgg/collection?username=NAME        a user's base-game collection with their ratings
//   /api/bgg/plays?username=NAME&page=N       one page (100) of a user's logged plays
//   /api/bgg/things?ids=1,2,3                 game details + community polls (up to 20 ids)
//   /api/bgg/search?q=TEXT[&exact=1]          find games by name
//   /api/catalog/suggest?ids=1,2,3            Ludarium card suggestions built from BGG facts
//   /api/health                               config check (no BGG call)
import { BggGate, type Env, type FetchOutcome } from './gate';
import {
  thingUrl, collectionUrl, playsUrl, searchUrl, parseThings, parseCollection, parsePlays, parseSearch,
  bggErrorMessage, MAX_THING_IDS,
} from './bgg';
import { suggestFromThing } from './mapping';
import type { BggThing, Envelope } from './types';

export { BggGate };

const HOUR = 3_600_000;
const TTL = { thing: 7 * 24 * HOUR, collection: 12 * HOUR, plays: 6 * HOUR, search: 24 * HOUR };
const USERNAME = /^[A-Za-z0-9_][A-Za-z0-9_ .\-]{0,49}$/;

const ATTRIBUTION = {
  text: 'Powered by BGG',
  url: 'https://boardgamegeek.com',
  termsOfUse: 'https://boardgamegeek.com/xmlapi/termsofuse',
};

class HttpError extends Error {
  constructor(public status: number, message: string, public extra: Record<string, unknown> = {}) { super(message); }
}

function corsHeaders(req: Request, env: Env): Record<string, string> {
  const origin = req.headers.get('Origin') || '';
  const allowed = (env.ALLOWED_ORIGINS || '').split(',').map(s => s.trim()).filter(Boolean);
  const ok = allowed.includes(origin);
  return ok ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin', 'Access-Control-Allow-Methods': 'GET, OPTIONS', 'Access-Control-Allow-Headers': 'Content-Type' } : { Vary: 'Origin' };
}

function json(body: unknown, status: number, headers: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': status === 200 ? 'public, max-age=300' : 'no-store', ...headers },
  });
}

function envelope<T>(data: T, cached: boolean, fetchedAt: number): Envelope<T> {
  return { data, source: 'BoardGameGeek', attribution: ATTRIBUTION, cached, fetchedAt: new Date(fetchedAt).toISOString() };
}

function unwrap(out: FetchOutcome): string {
  if (out.ok) {
    if (out.xml.includes('<item') || out.xml.includes('<play ')) return out.xml;
    const msg = bggErrorMessage(out.xml);
    if (msg) throw new HttpError(404, msg);
    return out.xml;
  }
  if (out.status === 'queued') throw new HttpError(202, 'BoardGameGeek is preparing this collection. Try again shortly.', { retryAfter: out.retryAfter });
  throw new HttpError(out.code, out.message);
}

function parseIds(raw: string | null): number[] {
  const ids = [...new Set((raw || '').split(',').map(s => s.trim()).filter(Boolean).map(Number))];
  if (!ids.length || ids.some(n => !Number.isInteger(n) || n <= 0)) throw new HttpError(400, 'ids must be a comma-separated list of BGG game ids');
  if (ids.length > 100) throw new HttpError(400, 'Ask for at most 100 ids at a time');
  return ids;
}

/** Things are cached one id per row, so overlapping requests reuse each other's work. */
async function getThings(gate: DurableObjectStub<BggGate>, ids: number[]): Promise<{ things: BggThing[]; cached: boolean; fetchedAt: number }> {
  const found = new Map<number, BggThing>();
  let oldest = Date.now();
  for (const id of ids) {
    const hit = await gate.cacheGet(`thing:${id}`);
    if (hit) { found.set(id, JSON.parse(hit.body)); oldest = Math.min(oldest, hit.fetchedAt); }
  }
  const missing = ids.filter(id => !found.has(id));
  for (let i = 0; i < missing.length; i += MAX_THING_IDS) {
    const batch = missing.slice(i, i + MAX_THING_IDS);
    const things = parseThings(unwrap(await gate.fetchXml(thingUrl(batch), 0)));
    for (const t of things) { found.set(t.bggId, t); await gate.cachePut(`thing:${t.bggId}`, JSON.stringify(t), TTL.thing); }
  }
  return { things: ids.map(id => found.get(id)).filter((t): t is BggThing => !!t), cached: missing.length === 0, fetchedAt: missing.length ? Date.now() : oldest };
}

async function cachedFetch<T>(gate: DurableObjectStub<BggGate>, key: string, ttl: number, url: string, parse: (xml: string) => T, queuedRetries = 0) {
  const hit = await gate.cacheGet(key);
  if (hit) return envelope<T>(JSON.parse(hit.body), true, hit.fetchedAt);
  const data = parse(unwrap(await gate.fetchXml(url, queuedRetries)));
  await gate.cachePut(key, JSON.stringify(data), ttl);
  return envelope(data, false, Date.now());
}

async function route(req: Request, env: Env, ctx: ExecutionContext): Promise<unknown> {
  const url = new URL(req.url);
  // Optional per-visitor limit so the public endpoint can't drain the BGG allowance.
  if (env.RATE_LIMITER && url.pathname !== '/api/health') {
    const ip = req.headers.get('CF-Connecting-IP') || 'unknown';
    const { success } = await env.RATE_LIMITER.limit({ key: ip });
    if (!success) throw new HttpError(429, 'Too many requests. Wait a minute and try again.');
  }
  const gate = env.BGG_GATE.get(env.BGG_GATE.idFromName('bgg'));
  const p = url.searchParams;

  switch (url.pathname) {
    case '/api/health':
      return { ok: true, tokenConfigured: !!env.BGG_TOKEN, attribution: ATTRIBUTION };

    case '/api/bgg/collection': {
      const u = (p.get('username') || '').trim();
      if (!USERNAME.test(u)) throw new HttpError(400, 'Enter a valid BoardGameGeek username');
      return cachedFetch(gate, `collection:${u.toLowerCase()}`, TTL.collection, collectionUrl(u), parseCollection, 3);
    }

    case '/api/bgg/plays': {
      const u = (p.get('username') || '').trim();
      if (!USERNAME.test(u)) throw new HttpError(400, 'Enter a valid BoardGameGeek username');
      const page = Math.max(1, Math.min(50, Number(p.get('page') || '1') | 0));
      const env1 = await cachedFetch(gate, `plays:${u.toLowerCase()}:${page}`, TTL.plays, playsUrl(u, page), parsePlays);
      const d = env1.data;
      return { ...env1, data: { ...d, hasMore: page * 100 < d.total } };
    }

    case '/api/bgg/things': {
      const { things, cached, fetchedAt } = await getThings(gate, parseIds(p.get('ids')));
      return envelope(things, cached, fetchedAt);
    }

    case '/api/bgg/search': {
      const q = (p.get('q') || '').trim();
      if (q.length < 2 || q.length > 100) throw new HttpError(400, 'Search needs 2 to 100 characters');
      const exact = p.get('exact') === '1';
      return cachedFetch(gate, `search:${exact ? 'x' : 'f'}:${q.toLowerCase()}`, TTL.search, searchUrl(q, exact), parseSearch);
    }

    case '/api/catalog/suggest': {
      const { things, cached, fetchedAt } = await getThings(gate, parseIds(p.get('ids')));
      ctx.waitUntil(gate.prune());
      return {
        ...envelope(things.map(t => ({ bgg: t, suggestion: suggestFromThing(t) })), cached, fetchedAt),
        note: 'Suggestions are The Ludarium’s starting points for staff to confirm. Table Talk is always filed by hand.',
      };
    }

    default:
      throw new HttpError(404, 'Not found');
  }
}

export default {
  async fetch(req: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const cors = corsHeaders(req, env);
    if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });
    if (req.method !== 'GET') return json({ error: 'Only GET is supported' }, 405, cors);
    try {
      return json(await route(req, env, ctx), 200, cors);
    } catch (e) {
      if (e instanceof HttpError) {
        const headers = { ...cors, ...(e.status === 202 && e.extra.retryAfter ? { 'Retry-After': String(e.extra.retryAfter) } : {}) };
        return json({ error: e.message, ...e.extra }, e.status, headers);
      }
      console.error(e);
      return json({ error: 'Something went wrong on our side' }, 500, cors);
    }
  },
} satisfies ExportedHandler<Env>;
