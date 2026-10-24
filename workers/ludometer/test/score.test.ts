import { describe, it, expect } from 'vitest';
import {
  computeWeek, chooseWeights, hotRankPoints, normalizeWeights, ratingGrowth, scaleToMax, movement,
  DEFAULT_WEIGHTS, type ScoreInput,
} from '../src/score';
import { mondayOf, parseWeek, weekToScore, addDays } from '../src/dates';

describe('building blocks', () => {
  it('turns Hotness rank into points', () => {
    expect(hotRankPoints(1)).toBe(1);
    expect(hotRankPoints(50)).toBeCloseTo(0.02);
    expect(hotRankPoints(null)).toBe(0);
  });
  it('measures rating growth across the week and never goes negative', () => {
    expect(ratingGrowth([{ date: '2026-10-20', game_id: 1, users_rated: 150 }, { date: '2026-10-18', game_id: 1, users_rated: 100 }])).toBe(50);
    expect(ratingGrowth([{ date: '2026-10-18', game_id: 1, users_rated: 100 }, { date: '2026-10-20', game_id: 1, users_rated: 90 }])).toBe(0);
    expect(ratingGrowth([{ date: '2026-10-18', game_id: 1, users_rated: 100 }])).toBe(0);
  });
  it('scales to the largest value and keeps all zeros at zero', () => {
    expect([...scaleToMax(new Map([[1, 2], [2, 4]])).values()]).toEqual([0.5, 1]);
    expect([...scaleToMax(new Map([[1, 0], [2, 0]])).values()]).toEqual([0, 0]);
  });
  it('cleans weights so they add to 1, with a fallback', () => {
    expect(normalizeWeights({ attention: 2, interest: 1, play: 1 }, DEFAULT_WEIGHTS)).toEqual({ attention: 0.5, interest: 0.25, play: 0.25 });
    expect(normalizeWeights({ attention: -1 }, DEFAULT_WEIGHTS)).toEqual(DEFAULT_WEIGHTS);
    expect(normalizeWeights(null, DEFAULT_WEIGHTS)).toEqual(DEFAULT_WEIGHTS);
  });
  it('switches to the high-play weights only above the threshold', () => {
    const s = { weights: { attention: 0.6, interest: 0.3, play: 0.1 }, weights_high_play: { attention: 0.4, interest: 0.3, play: 0.3 } };
    expect(chooseWeights(s, 500).weightSet).toBe('weights');
    const hi = chooseWeights(s, 501);
    expect(hi.weightSet).toBe('weights_high_play');
    expect(hi.weights.play).toBeCloseTo(0.3);
    expect(chooseWeights({ ...s, high_play_threshold: 10 }, 11).weightSet).toBe('weights_high_play');
  });
  it('reports movement as places climbed', () => {
    expect(movement(3, 7)).toBe(4);
    expect(movement(7, 3)).toBe(-4);
    expect(movement(1, null)).toBeNull();
  });
});

describe('week dates', () => {
  it('scores the last full Monday to Sunday', () => {
    expect(mondayOf('2026-10-24')).toBe('2026-10-19'); // a Saturday
    expect(weekToScore(new Date('2026-10-26T09:00:00Z'))).toBe('2026-10-19'); // Monday run
    expect(addDays('2026-10-19', 7)).toBe('2026-10-26');
  });
  it('reads ?week= and snaps to Monday', () => {
    expect(parseWeek('2026-10-22')).toBe('2026-10-19');
    expect(parseWeek('2026-02-30')).toBeNull();
    expect(parseWeek('soon')).toBeNull();
  });
});

describe('computeWeek', () => {
  const week = '2026-10-19';
  const days = ['2026-10-19', '2026-10-20', '2026-10-21', '2026-10-22', '2026-10-23', '2026-10-24', '2026-10-25'];
  const base: ScoreInput = {
    week,
    snapshots: [
      // Game 1 sits at #1 all week. Game 2 climbs from #10 to #2. Game 3 shows up once at #40.
      ...days.map(d => ({ date: d, rank: 1, game_id: 1, name: 'Alpha' })),
      ...days.map((d, i) => ({ date: d, rank: 10 - i - (i === 6 ? 1 : 0), game_id: 2, name: 'Beta' })),
      { date: '2026-10-21', rank: 40, game_id: 3, name: 'Gamma' },
    ],
    stats: [
      { date: '2026-10-18', game_id: 1, users_rated: 1000 }, { date: '2026-10-25', game_id: 1, users_rated: 1010 },
      { date: '2026-10-18', game_id: 2, users_rated: 100 }, { date: '2026-10-25', game_id: 2, users_rated: 400 },
    ],
    events: [
      { game_id: 2, type: 'page_view', total: 300 },
      { game_id: 2, type: 'course_signup', total: 12 },
      { game_id: 4, type: 'play', total: 40 },        // not on the Hotness list at all
      { game_id: 4, type: 'table_seated', total: 9 },
      { game_id: 1, type: 'mystery', total: 999 },    // unknown types are ignored
    ],
    totalPlays: 40,
    prevRanks: { 1: 1, 2: 5 },
    cumulativeDays: { 1: 120, 2: 7, 3: 1 },
    names: { 4: 'Delta' },
    settings: { weights: { attention: 0.6, interest: 0.3, play: 0.1 } },
  };

  const res = computeWeek(base);
  const byId = Object.fromEntries(res.rows.map(r => [r.game_id, r]));

  it('takes every game on the list or with events as a candidate', () => {
    expect(res.candidates).toBe(4);
    expect(res.rows.map(r => r.game_id).sort()).toEqual([1, 2, 3, 4]);
    expect(byId[4].name).toBe('Delta');
  });

  it('keeps every part between 0 and 1, with a leader at 1 in each family', () => {
    for (const r of res.rows) for (const k of ['score', 'attention', 'interest', 'play'] as const) {
      expect(r[k]).toBeGreaterThanOrEqual(0);
      expect(r[k]).toBeLessThanOrEqual(1);
    }
    expect(Math.max(...res.rows.map(r => r.attention))).toBeCloseTo(1);
    expect(byId[2].interest).toBeCloseTo(1);
    expect(byId[4].play).toBeCloseTo(1);
    expect(byId[4].attention).toBe(0);
  });

  it('adds the families with the weights', () => {
    for (const r of res.rows) expect(r.score).toBeCloseTo(0.6 * r.attention + 0.3 * r.interest + 0.1 * r.play);
  });

  it('ranks Beta first: strong attention plus all the interest', () => {
    expect(res.rows[0].game_id).toBe(2);
    expect(res.rows.map(r => r.rank)).toEqual([1, 2, 3, 4]);
  });

  it('carries prev rank, the last snapshot Hotness rank and total days on list', () => {
    expect(byId[2]).toMatchObject({ prev_rank: 5, bgg_hot_rank: 3, days_on_list: 7 });
    expect(byId[1]).toMatchObject({ prev_rank: 1, bgg_hot_rank: 1, days_on_list: 120 });
    expect(byId[3]).toMatchObject({ prev_rank: null, bgg_hot_rank: null, days_on_list: 1 });
  });

  it('leans on play once logged plays pass the threshold', () => {
    const heavy = computeWeek({ ...base, totalPlays: 900, settings: { ...base.settings, weights_high_play: { attention: 0.2, interest: 0.2, play: 0.6 } } });
    expect(heavy.weightSet).toBe('weights_high_play');
    expect(heavy.rows.find(r => r.game_id === 4)!.rank).toBeLessThan(byId[4].rank);
  });

  it('stops at the limit', () => {
    expect(computeWeek({ ...base, limit: 2 }).rows).toHaveLength(2);
  });

  it('returns no rows for an empty week', () => {
    const empty = computeWeek({ ...base, snapshots: [], stats: [], events: [], totalPlays: 0 });
    expect(empty.rows).toEqual([]);
  });
});
