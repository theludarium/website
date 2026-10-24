// BGG XML API2: URLs, polite fetching, and parsers.
// Parsing only reshapes XML into rows. It never edits BGG's values.
import { XMLParser } from 'fast-xml-parser';

export const BGG_BASE = 'https://boardgamegeek.com/xmlapi2';
export const MAX_THING_IDS = 20;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  // Attributes stay plain strings, so only tags are forced into arrays.
  isArray: (name, _jpath, _isLeaf, isAttribute) => !isAttribute && ['item', 'name', 'rank'].includes(name),
});

const arr = <T>(v: T | T[] | undefined | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);
const num = (v: unknown): number | null => {
  if (v == null || v === '') return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const attr = (node: any, key = 'value'): string | null => (node && node[key] != null ? String(node[key]) : null);
const text = (node: any): string | null => {
  if (node == null) return null;
  if (typeof node === 'string') return node || null;
  if (Array.isArray(node)) return text(node[0]);
  if (typeof node === 'object' && '#text' in node) return String(node['#text']) || null;
  return null;
};

export interface HotItem { rank: number; gameId: number; name: string; year: number | null }
export interface ThingStats {
  gameId: number;
  name: string;
  year: number | null;
  usersRated: number | null;
  average: number | null;
  bayesAverage: number | null;
  owned: number | null;
  /** BGG's overall board game rank, or null when BGG says Not Ranked. */
  bggRank: number | null;
}

export function hotUrl(): string {
  return `${BGG_BASE}/hot?type=boardgame`;
}
export function thingUrl(ids: number[]): string {
  return `${BGG_BASE}/thing?id=${ids.join(',')}&stats=1`;
}

/** BGG answers some calls with <message> or <errors> instead of data. */
export function bggErrorMessage(xml: string): string | null {
  const doc = parser.parse(xml);
  if (doc.errors) return text(arr(doc.errors.error)[0]?.message) || 'BGG returned an error';
  if (doc.error) return attr(doc.error, 'message') || 'BGG returned an error';
  if (doc.message) return text(doc.message);
  return null;
}

export function parseHot(xml: string): HotItem[] {
  const doc = parser.parse(xml);
  return arr(doc.items?.item)
    .map((it: any): HotItem => ({
      rank: Number(it.rank),
      gameId: Number(it.id),
      name: attr(arr(it.name)[0]) || '',
      year: num(attr(it.yearpublished)),
    }))
    .filter(h => Number.isInteger(h.gameId) && h.gameId > 0 && Number.isInteger(h.rank) && h.rank > 0);
}

export function parseThingStats(xml: string): ThingStats[] {
  const doc = parser.parse(xml);
  return arr(doc.items?.item).map((it: any): ThingStats => {
    const names = arr(it.name);
    const primary = names.find((n: any) => n.type === 'primary') || names[0];
    const ratings = it.statistics?.ratings;
    const overall = arr(ratings?.ranks?.rank).find((r: any) => r.name === 'boardgame');
    return {
      gameId: Number(it.id),
      name: primary ? String(primary.value) : '',
      year: num(attr(it.yearpublished)),
      usersRated: num(attr(ratings?.usersrated)),
      average: num(attr(ratings?.average)),
      bayesAverage: num(attr(ratings?.bayesaverage)),
      owned: num(attr(ratings?.owned)),
      bggRank: overall && overall.value !== 'Not Ranked' ? num(overall.value) : null,
    };
  }).filter(t => Number.isInteger(t.gameId) && t.gameId > 0);
}

export type Sleep = (ms: number) => Promise<void>;
export const realSleep: Sleep = ms => new Promise(r => setTimeout(r, ms));

export interface FetchOptions {
  token?: string;
  userAgent?: string;
  fetchImpl?: typeof fetch;
  sleep?: Sleep;
  /** Waits before each retry. Its length is the number of retries. */
  backoffMs?: number[];
}

export class BggFetchError extends Error {
  constructor(message: string, public status: number | null) { super(message); }
}

/**
 * Fetch one BGG URL politely. Retries 202 (BGG is preparing the answer),
 * 429 and 5xx with backoff, honoring Retry-After up to a minute.
 */
export async function fetchBggXml(url: string, opts: FetchOptions): Promise<string> {
  if (!opts.token) throw new BggFetchError('BGG_TOKEN is not set', null);
  const doFetch = opts.fetchImpl || fetch;
  const sleep = opts.sleep || realSleep;
  const backoff = opts.backoffMs || [2000, 5000, 15000, 30000];
  let lastProblem = 'no answer';
  let lastStatus: number | null = null;
  for (let attempt = 0; attempt <= backoff.length; attempt++) {
    let res: Response | null = null;
    try {
      res = await doFetch(url, {
        headers: {
          Authorization: `Bearer ${opts.token}`,
          'User-Agent': opts.userAgent || 'TheLudarium-Ludometer/1.0 (+https://theludarium.com)',
          Accept: 'application/xml',
        },
      });
    } catch {
      lastProblem = 'could not reach BoardGameGeek';
      lastStatus = null;
    }
    if (res) {
      if (res.status === 200) return await res.text();
      lastStatus = res.status;
      lastProblem = `BoardGameGeek answered ${res.status}`;
      if (res.status === 401 || res.status === 403) throw new BggFetchError('BoardGameGeek refused the token', res.status);
      const retryable = res.status === 202 || res.status === 429 || res.status >= 500;
      if (!retryable) throw new BggFetchError(lastProblem, res.status);
      if (attempt < backoff.length) {
        const ra = Number(res.headers.get('Retry-After'));
        const wait = Number.isFinite(ra) && ra > 0 ? Math.min(ra * 1000, 60_000) : backoff[attempt];
        await sleep(wait);
        continue;
      }
      break;
    }
    if (attempt < backoff.length) await sleep(backoff[attempt]);
  }
  throw new BggFetchError(`Gave up: ${lastProblem}`, lastStatus);
}
