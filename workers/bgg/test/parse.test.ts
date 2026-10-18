import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { parseThings, parseCollection, parsePlays, parseSearch, bggErrorMessage } from '../src/bgg';

const fx = (n: string) => readFileSync(new URL(`./fixtures/${n}`, import.meta.url), 'utf8');

describe('parseThings', () => {
  const [a, b] = parseThings(fx('thing.xml'));
  it('reads core facts unchanged', () => {
    expect(a).toMatchObject({ bggId: 1001, name: 'Feather Engine', year: 2019, minPlayers: 1, maxPlayers: 5, playingTime: 70, minAge: 10 });
    expect(a.mechanics).toEqual(['Open Drafting', 'Set Collection', 'Tableau Building']);
    expect(a.designers).toEqual(['Test Designer']);
  });
  it('reads the player count poll, including the 5+ row', () => {
    expect(a.playerCountPoll).toHaveLength(6);
    expect(a.playerCountPoll[2]).toEqual({ count: '3', best: 120, recommended: 50, notRecommended: 2 });
    expect(a.playerCountPoll[5].count).toBe('5+');
  });
  it('reads stats and treats Not Ranked as null', () => {
    expect(a.stats).toMatchObject({ rank: 25, averageWeight: 2.45, numWeights: 800, owned: 9000 });
    expect(b.stats?.rank).toBeNull();
  });
  it('reads age and language polls', () => {
    expect(a.agePoll.find(x => x.age === '10')?.votes).toBe(20);
    expect(a.languagePoll[2]).toMatchObject({ level: 3, votes: 20 });
  });
});

describe('parseCollection', () => {
  const items = parseCollection(fx('collection.xml'));
  it('reads ownership, rating and plays', () => {
    expect(items[0]).toMatchObject({ bggId: 1001, name: 'Feather Engine', rating: 9, numPlays: 12 });
    expect(items[0].status.own).toBe(true);
  });
  it('treats N/A ratings as unrated and reads wishlist flags', () => {
    expect(items[1].rating).toBeNull();
    expect(items[1].status).toMatchObject({ own: false, wishlist: true, wantToPlay: true });
  });
});

describe('parsePlays', () => {
  const page = parsePlays(fx('plays.xml'));
  it('reads paging and plays', () => {
    expect(page).toMatchObject({ username: 'testuser', total: 150, page: 1 });
    expect(page.plays).toHaveLength(2);
  });
  it('reads players, winners and length', () => {
    const p = page.plays[0];
    expect(p).toMatchObject({ playId: 9001, date: '2026-10-10', length: 65, bggId: 1001, comments: 'Close game.' });
    expect(p.players.map(x => [x.name, x.win, x.isNew])).toEqual([['Levi', true, false], ['Kego', false, true]]);
  });
  it('treats zero length as unknown and keeps quantity', () => {
    expect(page.plays[1]).toMatchObject({ length: null, quantity: 2, players: [] });
  });
});

describe('search and messages', () => {
  it('parses search hits', () => {
    expect(parseSearch(fx('search.xml'))).toEqual([
      { bggId: 1001, type: 'boardgame', name: 'Feather Engine', year: 2019 },
      { bggId: 1003, type: 'boardgame', name: 'Feather Engine: Duel', year: null },
    ]);
  });
  it('recognizes queued and error bodies', () => {
    expect(bggErrorMessage(fx('queued.xml'))).toMatch(/accepted/);
    expect(bggErrorMessage(fx('errors.xml'))).toBe('Invalid username specified');
    expect(bggErrorMessage(fx('thing.xml'))).toBeNull();
  });
});
