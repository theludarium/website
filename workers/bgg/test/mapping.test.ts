import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseThings } from '../src/bgg';
import { summarizePlayerCounts, suggestedAge, languageLevel, learningFromWeight, ratingWeight, suggestFromThing, cutter } from '../src/mapping';

const [feather, crew] = parseThings(readFileSync(new URL('./fixtures/thing.xml', import.meta.url), 'utf8'));

describe('player count poll', () => {
  it('finds best and recommended counts, skipping 5+', () => {
    expect(summarizePlayerCounts(feather.playerCountPoll)).toEqual({ bestAt: [3, 4], recommendedAt: [1, 2, 3, 4] });
  });
  it('ignores counts with too few votes', () => {
    expect(summarizePlayerCounts(crew.playerCountPoll)).toEqual({ bestAt: [], recommendedAt: [] });
  });
});

describe('family helpers', () => {
  it('takes the weighted median age', () => expect(suggestedAge(feather.agePoll)).toBe(10));
  it('takes the most-voted language level', () => expect(languageLevel(feather.languagePoll)).toBe(3));
});

describe('weights', () => {
  it('maps BGG weight to Learning only with enough votes', () => {
    expect(learningFromWeight(1.5, 50)).toBe(1);
    expect(learningFromWeight(2.45, 50)).toBe(2);
    expect(learningFromWeight(3.9, 50)).toBe(3);
    expect(learningFromWeight(3.9, 3)).toBeNull();
  });
  it('maps BGG user ratings onto the Ludarium +2..-2 scale', () => {
    expect([10, 9, 8, 7, 6, 5, 4, 3, 1, null].map(ratingWeight)).toEqual([2, 2, 1, 0, 0, -1, -1, -2, -2, 0]);
  });
});

describe('suggestFromThing', () => {
  it('shelves a drafting tableau game as a tableau engine, its main activity', () => {
    const s = suggestFromThing(feather);
    expect(s).toMatchObject({ shelf: '500', sub: '520', shelfReason: 'Tableau building', bestAt: [3, 4], minutes: 70, suggestedAge: 10 });
    expect(s.dims).toEqual({ theme: null, luck: null, inter: 1, learn: 2, tempo: null, talk: null });
  });
  it('sends limited-communication co-ops to 220 and marks Direct interaction', () => {
    const s = suggestFromThing(crew);
    expect(s).toMatchObject({ shelf: '200', sub: '220' });
    expect(s.dims.inter).toBe(3);
    expect(s.dims.tempo).toBe(1);
    expect(s.dims.talk).toBeNull();
  });
  it('never fills Table Talk and builds a cutter', () => {
    expect(cutter('The Quiet Crew')).toBe('QUI');
    expect(cutter('7 Wonders')).toBe('7WO');
  });
});
