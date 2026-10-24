import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { runSnapshot } from '../src/jobs';
import type { Env } from '../src/env';
import { fakeD1 } from './fake-d1';

const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

describe('runSnapshot', () => {
  it('replaces today\'s rows, fetches stats in batches, and survives a failed batch', async () => {
    // 3 hot games plus 25 games with recent events: two thing batches (20 + 8).
    const extra = Array.from({ length: 25 }, (_, i) => ({ game_id: 2000 + i }));
    const d1 = fakeD1(sql => (sql.includes('FROM events') ? { all: extra } : {}));
    const urls: string[] = [];
    let thingCalls = 0;
    const fetchImpl = (async (url: string) => {
      urls.push(url);
      if (url.includes('/hot')) return new Response(fx('hot.xml'));
      thingCalls++;
      return thingCalls === 1 ? new Response(fx('thing-stats.xml')) : new Response('', { status: 500 });
    }) as unknown as typeof fetch;
    const waits: number[] = [];
    const env = { DB: d1.db, BGG_TOKEN: 't', USER_AGENT: 'UA' } as Env;

    const s = await runSnapshot(env, new Date('2026-10-24T06:00:00Z'), { fetchImpl, sleep: async ms => { waits.push(ms); }, delayMs: 5000, backoffMs: [1] });

    expect(s).toMatchObject({ date: '2026-10-24', hot: 3, statsRequested: 28, statsStored: 2 });
    expect(s.failedBatches).toHaveLength(1);
    expect(s.failedBatches[0].ids).toHaveLength(8);
    expect(waits).toContain(5000);
    expect(urls[1]).toContain('thing?id=1001,1002,1005,2000');
    const sqls = d1.calls.map(c => c.sql);
    expect(sqls[0]).toBe('DELETE FROM hot_snapshots WHERE date = ?');
    expect(d1.calls[0].args).toEqual(['2026-10-24']);
    expect(sqls.filter(q => q.startsWith('INSERT INTO hot_snapshots'))).toHaveLength(3);
    expect(sqls.filter(q => q.includes('INSERT OR REPLACE INTO game_stats'))).toHaveLength(2);
  });

  it('fails loudly when the Hotness list is empty', async () => {
    const d1 = fakeD1();
    const fetchImpl = (async () => new Response(fx('errors.xml'))) as unknown as typeof fetch;
    await expect(runSnapshot({ DB: d1.db, BGG_TOKEN: 't' } as Env, new Date(), { fetchImpl })).rejects.toThrow(/empty/);
    expect(d1.calls).toHaveLength(0);
  });
});
