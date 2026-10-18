// Turns BGG facts into Ludarium suggestions. These are starting points for
// staff to confirm, stored as Ludarium's own fields. BGG values themselves are
// never edited: they are kept as-is in the thing record and shown labeled as BGG's.
import type { BggThing, LudariumSuggestion, PlayerCountVotes } from './types';

/** Minimum votes at a player count before the poll is trusted for it. */
export const MIN_COUNT_VOTES = 5;

export function summarizePlayerCounts(poll: PlayerCountVotes[]): { bestAt: number[]; recommendedAt: number[] } {
  const bestAt: number[] = [], recommendedAt: number[] = [];
  for (const r of poll) {
    if (r.count.includes('+')) continue; // "5+" means above the box maximum
    const n = Number(r.count);
    if (!Number.isInteger(n)) continue;
    const total = r.best + r.recommended + r.notRecommended;
    if (total < MIN_COUNT_VOTES) continue;
    if (r.best >= r.recommended && r.best > r.notRecommended) bestAt.push(n);
    if (r.best + r.recommended > r.notRecommended) recommendedAt.push(n);
  }
  return { bestAt, recommendedAt };
}

/** Weighted median of the community's suggested-age poll, or null with too few votes. */
export function suggestedAge(poll: { age: string; votes: number }[]): number | null {
  const rows = poll.map(p => ({ age: parseInt(p.age, 10), votes: p.votes })).filter(p => Number.isFinite(p.age) && p.votes > 0);
  const total = rows.reduce((a, b) => a + b.votes, 0);
  if (total < MIN_COUNT_VOTES) return null;
  rows.sort((a, b) => a.age - b.age);
  let run = 0;
  for (const r of rows) { run += r.votes; if (run >= total / 2) return r.age; }
  return null;
}

/** Most-voted language dependence level (1 = no text, 5 = unplayable in another language). */
export function languageLevel(poll: { level: number; votes: number }[]): number | null {
  const total = poll.reduce((a, b) => a + b.votes, 0);
  if (total < MIN_COUNT_VOTES) return null;
  return poll.reduce((a, b) => (b.votes > a.votes ? b : a)).level || null;
}

/** BGG weight (1-5) to the Learning dimension. Needs at least 10 weight votes. */
export function learningFromWeight(weight: number | null, numWeights: number | null): number | null {
  if (weight == null || !numWeights || numWeights < 10 || weight <= 0) return null;
  if (weight < 1.8) return 1;
  if (weight < 2.8) return 2;
  return 3;
}

/**
 * A user's BGG rating (1-10) as a Ludarium profile weight, on the same scale
 * as star ratings (+2 to -2). Used to build a Play Profile on import.
 */
export function ratingWeight(rating: number | null): number {
  if (rating == null) return 0;
  if (rating >= 9) return 2;
  if (rating >= 8) return 1;
  if (rating >= 6) return 0;
  if (rating >= 4) return -1;
  return -2;
}

type Rule = { shelf: string; sub: string; why: string; test: (t: BggThing, has: (m: string) => boolean, cat: (c: string) => boolean) => boolean };

// Ordered: the first rule that matches decides the shelf. Rules follow the
// Ludarium principle: shelve by the game's main activity.
const SHELF_RULES: Rule[] = [
  { shelf: '000', sub: '050', why: 'Action / Dexterity category', test: (_t, _h, c) => c('Action / Dexterity') },
  { shelf: '900', sub: '930', why: 'Legacy or campaign card game', test: (_t, h, c) => c('Card Game') && (h('Legacy Game') || h('Scenario / Mission / Campaign Game')) && h('Cooperative Game') },
  { shelf: '900', sub: '910', why: 'Campaign or dungeon-crawl play', test: (_t, h, c) => (h('Scenario / Mission / Campaign Game') || h('Legacy Game')) && (c('Adventure') || c('Fantasy') || c('Fighting')) && !h('Communication Limits') },
  { shelf: '900', sub: '920', why: 'Narrative mystery', test: (_t, h, c) => (h('Narrative Choice / Paragraph') || h('Storytelling')) && (c('Murder / Mystery') || c('Deduction')) },
  { shelf: '100', sub: '110', why: 'Hidden roles', test: (_t, h) => h('Hidden Roles') || h('Traitor Game') },
  { shelf: '200', sub: '220', why: 'Co-op with limited communication', test: (_t, h) => h('Cooperative Game') && h('Communication Limits') },
  { shelf: '200', sub: '240', why: 'Two-player co-op', test: (t, h) => h('Cooperative Game') && t.maxPlayers === 2 },
  { shelf: '100', sub: '140', why: 'Co-op deduction', test: (_t, h) => h('Cooperative Game') && h('Deduction') },
  { shelf: '200', sub: '230', why: 'Heavy co-op', test: (t, h) => h('Cooperative Game') && (t.stats?.averageWeight ?? 0) >= 3 },
  { shelf: '200', sub: '210', why: 'Cooperative game', test: (_t, h) => h('Cooperative Game') },
  { shelf: '000', sub: '030', why: 'Drawing party game', test: (_t, h, c) => c('Party Game') && h('Drawing') },
  { shelf: '000', sub: '010', why: 'Word party game', test: (_t, _h, c) => c('Party Game') && c('Word Game') },
  { shelf: '000', sub: '040', why: 'Storytelling party game', test: (_t, h, c) => c('Party Game') && h('Storytelling') },
  { shelf: '100', sub: '120', why: 'Bluffing', test: (_t, _h, c) => c('Bluffing') },
  { shelf: '000', sub: '020', why: 'Party game', test: (_t, _h, c) => c('Party Game') },
  { shelf: '100', sub: '130', why: 'Deduction', test: (_t, h, c) => h('Deduction') || c('Deduction') },
  { shelf: '300', sub: '310', why: 'Trick-taking', test: (_t, h) => h('Trick-taking') },
  { shelf: '300', sub: '330', why: 'Climbing or shedding', test: (_t, h) => h('Ladder Climbing') },
  { shelf: '700', sub: '720', why: 'Negotiation', test: (_t, h) => h('Negotiation') || h('Bribery') },
  { shelf: '700', sub: '710', why: 'Trading', test: (_t, h) => h('Trading') },
  { shelf: '700', sub: '730', why: 'Auctions', test: (t) => t.mechanics.some(m => m.startsWith('Auction')) },
  { shelf: '500', sub: '540', why: 'Worker placement', test: (t) => t.mechanics.some(m => m.startsWith('Worker Placement')) },
  { shelf: '500', sub: '510', why: 'Deck-building', test: (_t, h) => h('Deck, Bag, and Pool Building') },
  { shelf: '500', sub: '520', why: 'Tableau building', test: (_t, h) => h('Tableau Building') },
  { shelf: '400', sub: '410', why: 'Card drafting', test: (_t, h) => h('Open Drafting') || h('Closed Drafting') || h('Card Drafting') },
  { shelf: '600', sub: '650', why: 'Racing', test: (_t, h, c) => h('Race') || c('Racing') },
  { shelf: '600', sub: '630', why: 'Area majority', test: (_t, h) => h('Area Majority / Influence') },
  { shelf: '600', sub: '620', why: 'Asymmetric conflict', test: (_t, h, c) => h('Variable Player Powers') && (c('Wargame') || c('Fighting')) },
  { shelf: '600', sub: '610', why: 'Dice brawl', test: (_t, h, c) => h('Dice Rolling') && (c('Fighting') || h('Take That')) },
  { shelf: '400', sub: '420', why: 'Set collection or routes', test: (_t, h) => h('Set Collection') || h('Network and Route Building') },
  { shelf: '800', sub: '830', why: 'Abstract strategy', test: (_t, _h, c) => c('Abstract Strategy') },
  { shelf: '800', sub: '820', why: 'Spatial puzzle', test: (_t, h) => h('Grid Coverage') },
  { shelf: '800', sub: '810', why: 'Tile or pattern building', test: (_t, h) => h('Tile Placement') || h('Pattern Building') },
  { shelf: '300', sub: '320', why: 'Card game', test: (_t, _h, c) => c('Card Game') },
];

const INTERACTIVE = ['Take That', 'Negotiation', 'Trading', 'Area Majority / Influence', 'Player Elimination', 'Hidden Roles', 'Trick-taking', 'Cooperative Game', 'Bribery', 'Voting'];
const SOLITARY = ['Tableau Building', 'Grid Coverage', 'Pattern Building', 'Paper-and-Pencil', 'Roll / Spin and Move'];

export function cutter(name: string): string {
  const w = name.replace(/^(the|a|an)\s+/i, '').replace(/[^A-Za-z0-9 ]/g, '').toUpperCase();
  return (w.replace(/\s+/g, '').slice(0, 3) || 'XXX');
}

export function suggestFromThing(t: BggThing): LudariumSuggestion {
  const mech = new Set(t.mechanics), cats = new Set(t.categories);
  const has = (m: string) => mech.has(m), cat = (c: string) => cats.has(c);
  const rule = SHELF_RULES.find(r => r.test(t, has, cat)) || null;
  const weight = t.stats?.averageWeight ?? null;
  const dimReasons: LudariumSuggestion['dimReasons'] = {};

  const learn = learningFromWeight(weight, t.stats?.numWeights ?? null);
  if (learn) dimReasons.learn = `BGG weight ${weight!.toFixed(2)}`;

  let inter: number | null = null;
  const interactive = INTERACTIVE.filter(has);
  if (interactive.length) { inter = 3; dimReasons.inter = interactive.join(', '); }
  else if (SOLITARY.some(has)) { inter = 1; dimReasons.inter = 'Mostly your own board'; }

  let luck: number | null = null;
  if (has('Push Your Luck') || (has('Dice Rolling') && (weight ?? 5) < 2)) { luck = 1; dimReasons.luck = has('Push Your Luck') ? 'Push your luck' : 'Light dice game'; }
  else if (cat('Abstract Strategy') && !has('Dice Rolling')) { luck = 3; dimReasons.luck = 'Abstract, no dice'; }

  let theme: number | null = null;
  if (cat('Abstract Strategy')) { theme = 1; dimReasons.theme = 'Abstract Strategy'; }
  else if (has('Narrative Choice / Paragraph') || has('Storytelling') || has('Scenario / Mission / Campaign Game')) { theme = 3; dimReasons.theme = 'Story-driven'; }

  let tempo: number | null = null;
  if ((weight ?? 0) >= 3.5) { tempo = 3; dimReasons.tempo = 'Very heavy'; }
  else if ((t.playingTime ?? 999) <= 30 && (weight ?? 5) < 2) { tempo = 1; dimReasons.tempo = 'Short and light'; }

  const { bestAt, recommendedAt } = summarizePlayerCounts(t.playerCountPoll);
  const age = suggestedAge(t.agePoll) ?? t.minAge ?? null;
  const occasions: string[] = [];
  if (t.maxPlayers === 2 || bestAt.includes(2)) occasions.push('Two-player');
  if ((age ?? 99) <= 10 && (weight ?? 5) < 2.2) occasions.push('Family');
  if (cat('Party Game')) occasions.push('New friends');
  if ((weight ?? 0) >= 2.5) occasions.push('Game group');

  return {
    bggId: t.bggId,
    name: t.name,
    shelf: rule?.shelf ?? null,
    sub: rule?.sub ?? null,
    shelfReason: rule?.why ?? null,
    dims: { theme, luck, inter, learn, tempo, talk: null },
    dimReasons,
    players: t.minPlayers && t.maxPlayers ? [t.minPlayers, t.maxPlayers] : null,
    bestAt,
    recommendedAt,
    minutes: t.playingTime,
    suggestedAge: age,
    languageLevel: languageLevel(t.languagePoll),
    occasions,
    callCutter: cutter(t.name),
  };
}
