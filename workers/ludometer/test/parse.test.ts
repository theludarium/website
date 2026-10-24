import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseHot, parseThingStats, bggErrorMessage, fetchBggXml, hotUrl, thingUrl } from '../src/bgg';

const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

describe('parseHot', () => {
  const hot = parseHot(fx('hot.xml'));
  it('reads rank, id, name and year as BGG gives them', () => {
    expect(hot).toEqual([
      { rank: 1, gameId: 1001, name: 'Feather Engine', year: 2019 },
      { rank: 2, gameId: 1002, name: 'The Quiet Crew & Friends', year: 2021 },
      { rank: 3, gameId: 1005, name: 'Lantern Harbor', year: null },
    ]);
  });
  it('returns nothing for an error body', () => {
    expect(parseHot(fx('errors.xml'))).toEqual([]);
  });
});

describe('parseThingStats', () => {
  const [a, b] = parseThingStats(fx('thing-stats.xml'));
  it('reads the stats unchanged, using the primary name', () => {
    expect(a).toEqual({ gameId: 1001, name: 'Feather Engine', year: 2019, usersRated: 51234, average: 8.05123, bayesAverage: 7.90211, owned: 90012, bggRank: 25 });
  });
  it('treats Not Ranked as null', () => {
    expect(b).toMatchObject({ gameId: 1005, usersRated: 87, owned: 310, bggRank: null });
  });
});

describe('BGG messages and URLs', () => {
  it('recognizes queued and error bodies', () => {
    expect(bggErrorMessage(fx('queued.xml'))).toMatch(/accepted/);
    expect(bggErrorMessage(fx('errors.xml'))).toBe('Invalid username specified');
    expect(bggErrorMessage(fx('hot.xml'))).toBeNull();
  });
  it('builds the URLs without www', () => {
    expect(hotUrl()).toBe('https://boardgamegeek.com/xmlapi2/hot?type=boardgame');
    expect(thingUrl([1, 2])).toBe('https://boardgamegeek.com/xmlapi2/thing?id=1,2&stats=1');
  });
});

describe('fetchBggXml', () => {
  const noSleep = async () => {};
  function fakeFetch(answers: (Response | Error)[]) {
    const calls: { url: string; init?: RequestInit }[] = [];
    const impl = (async (url: string, init?: RequestInit) => {
      calls.push({ url, init });
      const a = answers.shift();
      if (!a) throw new Error('no more answers');
      if (a instanceof Error) throw a;
      return a;
    }) as unknown as typeof fetch;
    return { impl, calls };
  }

  it('sends the token and User-Agent', async () => {
    const f = fakeFetch([new Response('<items/>', { status: 200 })]);
    await fetchBggXml(hotUrl(), { token: 'tok', userAgent: 'UA/1', fetchImpl: f.impl, sleep: noSleep });
    const h = f.calls[0].init!.headers as Record<string, string>;
    expect(h.Authorization).toBe('Bearer tok');
    expect(h['User-Agent']).toBe('UA/1');
  });

  it('retries 202, 429 and 5xx, honoring Retry-After', async () => {
    const waits: number[] = [];
    const f = fakeFetch([
      new Response('', { status: 202 }),
      new Response('', { status: 429, headers: { 'Retry-After': '7' } }),
      new Response('', { status: 503 }),
      new Error('network'),
      new Response('<items/>', { status: 200 }),
    ]);
    const xml = await fetchBggXml(hotUrl(), { token: 't', fetchImpl: f.impl, sleep: async ms => { waits.push(ms); }, backoffMs: [1, 2, 3, 4] });
    expect(xml).toBe('<items/>');
    expect(waits).toEqual([1, 7000, 3, 4]);
  });

  it('gives up after the last retry', async () => {
    const f = fakeFetch([new Response('', { status: 500 }), new Response('', { status: 500 }), new Response('', { status: 500 })]);
    await expect(fetchBggXml(hotUrl(), { token: 't', fetchImpl: f.impl, sleep: noSleep, backoffMs: [1, 1] })).rejects.toThrow(/Gave up/);
    expect(f.calls).toHaveLength(3);
  });

  it('stops at once when the token is refused or missing', async () => {
    const f = fakeFetch([new Response('', { status: 401 })]);
    await expect(fetchBggXml(hotUrl(), { token: 't', fetchImpl: f.impl, sleep: noSleep })).rejects.toThrow(/refused/);
    expect(f.calls).toHaveLength(1);
    await expect(fetchBggXml(hotUrl(), { fetchImpl: f.impl })).rejects.toThrow(/BGG_TOKEN/);
  });
});
