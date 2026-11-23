// Tests for workers/cube-refresh, the daily Cube Cobra refresh. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import { refreshCubes, slotFor } from '../workers/cube-refresh/src/refresh.ts';

const rows = [
  { id: 4, listUrl: 'https://cubecobra.com/cube/overview/changed', cardCount: 360, updatedAt: '2026-01-01' },
  { id: 8, listUrl: 'https://cubecobra.com/cube/overview/same', cardCount: 450, updatedAt: '2026-02-02' },
  { id: 12, listUrl: 'https://cubecobra.com/cube/overview/gone', cardCount: 540, updatedAt: '2026-03-03' },
  { id: 16, listUrl: 'https://www.moxfield.com/decks/abc', cardCount: null, updatedAt: null },
];
const fresh = (cardCount: number, updatedAt: string) => ({ name: 'x', cardCount, updatedAt, description: 'new text', style: 'Other' });

test('every 6-hour run covers a different quarter of the Cubes', () => {
  assert.deepEqual([0, 6, 12, 18].map((h) => slotFor(Date.UTC(2026, 10, 23, h))), [0, 1, 2, 3]);
});

test('only changed counts and dates are written, and a failed Cube is left alone', async () => {
  const writes: { sql: string; values: unknown[] }[] = [];
  const DB = {
    prepare(sql: string) {
      const st = { sql, values: [] as unknown[], bind(...v: unknown[]) { st.values = v; return st; }, all: async () => ({ results: rows }) };
      return st;
    },
    batch: async (list: { sql: string; values: unknown[] }[]) => { writes.push(...list); return []; },
  };
  const answers: Record<string, (ReturnType<typeof fresh> & { imageUrl?: string; imageArtist?: string }) | null> = { changed: { ...fresh(380, '2026-11-20'), imageUrl: 'https://assets.cubecobra.com/new.webp', imageArtist: 'Ann' }, same: fresh(450, '2026-02-02'), gone: null };
  const summary = await refreshCubes({ DB } as never, 0, async (id) => answers[id]);
  assert.deepEqual(summary, { checked: 3, changed: 1, failed: 1 });
  assert.equal(writes.length, 1);
  assert.deepEqual(writes[0].values, [380, '2026-11-20', 'https://assets.cubecobra.com/new.webp', 'Ann', 4]);
  assert.ok(!writes[0].sql.includes('description') && !writes[0].sql.includes('name'));
});
