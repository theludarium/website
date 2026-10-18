// BGG XML API2: URL builders and parsers. Parsing only reshapes; it never edits values.
import { XMLParser } from 'fast-xml-parser';
import type {
  BggThing, BggCollectionItem, BggPlaysPage, BggPlay, BggSearchHit, PlayerCountVotes,
} from './types';

export const BGG_BASE = 'https://boardgamegeek.com/xmlapi2';
export const MAX_THING_IDS = 20;

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '',
  parseAttributeValue: false,
  parseTagValue: false,
  trimValues: true,
  // Attributes such as name="..." must stay plain strings, so only tags are forced into arrays.
  isArray: (name, _jpath, _isLeaf, isAttribute) => !isAttribute && ['item', 'name', 'link', 'poll', 'results', 'result', 'rank', 'play', 'player', 'subtype'].includes(name),
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

export function thingUrl(ids: number[]): string {
  return `${BGG_BASE}/thing?id=${ids.join(',')}&stats=1`;
}
export function collectionUrl(username: string): string {
  // Base games only; expansions are excluded by BGG unless asked for.
  return `${BGG_BASE}/collection?username=${encodeURIComponent(username)}&stats=1&subtype=boardgame&excludesubtype=boardgameexpansion`;
}
export function playsUrl(username: string, page: number): string {
  return `${BGG_BASE}/plays?username=${encodeURIComponent(username)}&type=thing&subtype=boardgame&page=${page}`;
}
export function searchUrl(query: string, exact: boolean): string {
  return `${BGG_BASE}/search?query=${encodeURIComponent(query)}&type=boardgame${exact ? '&exact=1' : ''}`;
}

/** BGG answers some calls with <message> or <errors> instead of data. */
export function bggErrorMessage(xml: string): string | null {
  const doc = parser.parse(xml);
  if (doc.errors) return text(arr(doc.errors.error)[0]?.message) || 'BGG returned an error';
  if (doc.error) return attr(doc.error, 'message') || 'BGG returned an error';
  if (doc.message) return text(doc.message);
  return null;
}

export function parseThings(xml: string): BggThing[] {
  const doc = parser.parse(xml);
  return arr(doc.items?.item).map((it: any): BggThing => {
    const names = arr(it.name);
    const primary = names.find((n: any) => n.type === 'primary') || names[0];
    const links = arr(it.link);
    const linkValues = (type: string) => links.filter((l: any) => l.type === type).map((l: any) => String(l.value));
    const polls = arr(it.poll);
    const pollNamed = (n: string) => polls.find((p: any) => p.name === n);

    const pc = pollNamed('suggested_numplayers');
    const playerCountPoll: PlayerCountVotes[] = arr(pc?.results).map((r: any) => {
      const votes = (label: string) => num(arr(r.result).find((x: any) => x.value === label)?.numvotes) ?? 0;
      return { count: String(r.numplayers), best: votes('Best'), recommended: votes('Recommended'), notRecommended: votes('Not Recommended') };
    });
    const ap = pollNamed('suggested_playerage');
    const agePoll = arr(arr(ap?.results)[0]?.result).map((r: any) => ({ age: String(r.value), votes: num(r.numvotes) ?? 0 }));
    const lp = pollNamed('language_dependence');
    const languagePoll = arr(arr(lp?.results)[0]?.result).map((r: any) => ({ level: num(r.level) ?? 0, label: String(r.value), votes: num(r.numvotes) ?? 0 }));

    const ratings = it.statistics?.ratings;
    const ranks = arr(ratings?.ranks?.rank);
    const overall = ranks.find((r: any) => r.name === 'boardgame');
    const stats = ratings ? {
      usersRated: num(attr(ratings.usersrated)),
      average: num(attr(ratings.average)),
      bayesAverage: num(attr(ratings.bayesaverage)),
      rank: overall && overall.value !== 'Not Ranked' ? num(overall.value) : null,
      owned: num(attr(ratings.owned)),
      averageWeight: num(attr(ratings.averageweight)),
      numWeights: num(attr(ratings.numweights)),
    } : null;

    return {
      bggId: Number(it.id),
      type: String(it.type || ''),
      name: primary ? String(primary.value) : '',
      year: num(attr(it.yearpublished)),
      image: text(it.image),
      thumbnail: text(it.thumbnail),
      minPlayers: num(attr(it.minplayers)),
      maxPlayers: num(attr(it.maxplayers)),
      playingTime: num(attr(it.playingtime)),
      minPlayTime: num(attr(it.minplaytime)),
      maxPlayTime: num(attr(it.maxplaytime)),
      minAge: num(attr(it.minage)),
      categories: linkValues('boardgamecategory'),
      mechanics: linkValues('boardgamemechanic'),
      families: linkValues('boardgamefamily'),
      designers: linkValues('boardgamedesigner'),
      publishers: linkValues('boardgamepublisher'),
      playerCountPoll,
      playerCountPollTotal: num(pc?.totalvotes) ?? 0,
      agePoll,
      languagePoll,
      stats,
    };
  });
}

export function parseCollection(xml: string): BggCollectionItem[] {
  const doc = parser.parse(xml);
  return arr(doc.items?.item).map((it: any): BggCollectionItem => {
    const st = it.status || {};
    const flag = (k: string) => String(st[k] ?? '0') === '1';
    const s = it.stats || {};
    const ratingVal = s.rating ? attr(s.rating) : null;
    return {
      bggId: Number(it.objectid),
      collId: num(it.collid),
      subtype: String(it.subtype || ''),
      name: text(arr(it.name)[0]) || '',
      year: num(text(it.yearpublished)),
      image: text(it.image),
      thumbnail: text(it.thumbnail),
      numPlays: num(text(it.numplays)) ?? 0,
      rating: ratingVal && ratingVal !== 'N/A' ? num(ratingVal) : null,
      status: {
        own: flag('own'), prevOwned: flag('prevowned'), wantToPlay: flag('wanttoplay'),
        wishlist: flag('wishlist'), forTrade: flag('fortrade'), preordered: flag('preordered'),
      },
      minPlayers: num(s.minplayers),
      maxPlayers: num(s.maxplayers),
      playingTime: num(s.playingtime),
    };
  });
}

export function parsePlays(xml: string): BggPlaysPage {
  const doc = parser.parse(xml);
  const root = doc.plays || {};
  const plays = arr(root.play).map((p: any): BggPlay => {
    const item = arr(p.item)[0] || {};
    return {
      playId: Number(p.id),
      date: p.date ? String(p.date) : null,
      quantity: num(p.quantity) ?? 1,
      length: num(p.length) || null,
      incomplete: String(p.incomplete) === '1',
      location: p.location ? String(p.location) : null,
      bggId: num(item.objectid),
      gameName: item.name ? String(item.name) : null,
      comments: text(p.comments),
      players: arr(p.players?.player).map((pl: any) => ({
        username: pl.username ? String(pl.username) : null,
        name: pl.name ? String(pl.name) : null,
        score: pl.score ? String(pl.score) : null,
        win: String(pl.win) === '1',
        isNew: String(pl.new) === '1',
      })),
    };
  });
  return { username: String(root.username || ''), total: num(root.total) ?? plays.length, page: num(root.page) ?? 1, plays };
}

export function parseSearch(xml: string): BggSearchHit[] {
  const doc = parser.parse(xml);
  return arr(doc.items?.item).map((it: any) => {
    const n = arr(it.name)[0];
    return { bggId: Number(it.id), type: String(it.type || ''), name: n ? String(n.value) : '', year: num(attr(it.yearpublished)) };
  });
}
