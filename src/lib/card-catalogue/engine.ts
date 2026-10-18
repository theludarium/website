// The Card Catalogue engine: catalog constants, the Play Profile, personal fit,
// group picks, and stats. Pure functions with no browser APIs, so the same code
// runs in the page and in tests. The rules follow docs/card-catalog/catalog-system.md.

export type DimKey = 'theme' | 'luck' | 'inter' | 'learn' | 'tempo' | 'talk';
export type Level = 1 | 2 | 3;

export type Game = {
  name: string;
  shelf: string;
  sub: string;
  call: string;
  year?: number;
  dims: Record<DimKey, Level>;
  players: [number, number];
  best: number[];
  minutes: number;
  occasions: string[];
  custom?: boolean;
};

export type Catalog = Record<string, Game>;

/** What one person has said about a game. */
export type Mine = {
  rating?: number;
  own?: boolean;
  teach?: boolean;
  learn?: boolean;
  veto?: boolean;
  custom?: Game;
};

export type Result = 'won' | 'lost' | 'coopwin' | 'cooplost' | 'none' | '';

export type Play = {
  id: string;
  slug: string;
  date: string;
  players: number;
  minutes: number;
  taught: boolean;
  result: Result;
  with: string[];
  again: 'yes' | 'maybe' | 'no' | '';
  energy: 0 | 1 | 2 | 3;
  note: string;
};

export type Guest = { id: string; name: string; prefs: Partial<Record<DimKey, Level>> };

/** A friend's shared profile, pasted in as a table code. */
export type Friend = { id: string; name: string; digest: Digest };

export type State = {
  mine: Record<string, Mine>;
  plays: Play[];
  guests: Record<string, Guest>;
  friends: Record<string, Friend>;
};

export type PrefRows = Record<DimKey, [number, number, number]>;
export type Profile = { pref: PrefRows; shelfW: Record<string, number>; n: number };

/** The shareable part of a profile. Never includes notes or ratings. */
export type Digest = {
  pref: PrefRows;
  n: number;
  veto: string[];
  teach: string[];
  learn: string[];
  owned: string[];
  played: string[];
};

export const DIMS: { k: DimKey; name: string; abbr: string; lv: [string, string, string]; q: string }[] = [
  { k: 'theme', name: 'Theme', abbr: 'Theme', lv: ['Abstract', 'Themed', 'Immersive'], q: 'How much does the story matter?' },
  { k: 'luck', name: 'Chance', abbr: 'Chance', lv: ['Luck-driven', 'Tactical', 'Skill-driven'], q: 'Does the dice or the deck decide?' },
  { k: 'inter', name: 'Interaction', abbr: 'Interact', lv: ['Solo-ish', 'Indirect', 'Direct'], q: 'How much do other players change your plans?' },
  { k: 'learn', name: 'Learning', abbr: 'Learn', lv: ['Intuitive', 'Moderate', 'Heavy'], q: 'How long until a new player gets it?' },
  { k: 'tempo', name: 'Tempo', abbr: 'Tempo', lv: ['Light', 'Thoughtful', 'Intense'], q: 'How much brain does a turn take?' },
  { k: 'talk', name: 'Table Talk', abbr: 'Talk', lv: ['Quiet', 'Chatty', 'Raucous'], q: 'How much talking and laughing does it create?' },
];

export const SHELVES: Record<string, { n: string; subs: Record<string, string> }> = {
  '000': { n: 'Party & Dexterity', subs: { '010': 'Word games', '020': 'Guessing & wavelength', '030': 'Drawing', '040': 'Storytelling', '050': 'Dexterity' } },
  '100': { n: 'Deduction & Hidden Roles', subs: { '110': 'Hidden roles', '120': 'Bluffing & clue-giving', '130': 'Logic deduction', '140': 'Co-op deduction' } },
  '200': { n: 'Cooperative', subs: { '210': 'Crisis management', '220': 'Limited communication', '230': 'Heavy co-op', '240': 'Two-player co-op' } },
  '300': { n: 'Classic Cards', subs: { '310': 'Trick-taking', '320': 'Pegging & melding', '330': 'Shedding & climbing' } },
  '400': { n: 'Drafting & Collecting', subs: { '410': 'Card drafting', '420': 'Sets & routes' } },
  '500': { n: 'Engines & Tableaus', subs: { '510': 'Deck-building', '520': 'Tableau engines', '530': 'Economic engines', '540': 'Worker placement' } },
  '600': { n: 'Head-to-Head', subs: { '610': 'Dice brawls', '620': 'Asymmetric conflict', '630': 'Area control', '650': 'Racing' } },
  '700': { n: 'Trade & Negotiation', subs: { '710': 'Trading', '720': 'Negotiation & bribes', '730': 'Auctions' } },
  '800': { n: 'Abstract & Puzzle', subs: { '810': 'Tile & pattern', '820': 'Spatial puzzles', '830': 'Classic abstracts' } },
  '900': { n: 'Story & Campaign', subs: { '910': 'Dungeon campaigns', '920': 'Mystery & narrative', '930': 'Living card campaigns' } },
};

export const OCCASIONS = ['Date night', 'Family', 'New friends', 'Team building', 'Game group', 'Two-player'];

export const RESULTS: [Exclude<Result, ''>, string][] = [
  ['won', 'I won'],
  ['lost', 'I lost'],
  ['coopwin', 'We won (co-op)'],
  ['cooplost', 'We lost (co-op)'],
  ['none', 'No winner'],
];

export const emptyState = (): State => ({ mine: {}, plays: [], guests: {}, friends: {} });

// ---------- small helpers ----------

export function median(values: number[]): number | null {
  if (!values.length) return null;
  const s = [...values].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
}

export function playersText(g: Game): { range: string; best: string } {
  const [a, b] = g.players ?? [];
  const best = g.best ?? [];
  const range = a ? (a === b ? `${a}` : `${a} to ${b}`) : '?';
  const bestText = best.length ? (best.length > 1 ? `${best[0]} to ${best[best.length - 1]}` : `${best[0]}`) : '';
  return { range, best: bestText };
}

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/^the\s+/, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60);

/** Call number cutter: first three letters of the title, without a leading The, A or An. */
export const cutter = (name: string) =>
  name
    .replace(/^(the|a|an)\s+/i, '')
    .replace(/[^a-z]/gi, '')
    .slice(0, 3)
    .toUpperCase();

export const confidenceLabel = (n: number) => (n < 3 ? 'Getting to know you' : n < 10 ? 'Taking shape' : 'Confident');

export function allGames(catalog: Catalog, state: State): Catalog {
  const out: Catalog = { ...catalog };
  for (const [slug, m] of Object.entries(state.mine)) {
    if (m.custom && !out[slug]) out[slug] = { ...m.custom, custom: true };
  }
  return out;
}

// ---------- the Play Profile ----------

/** How much one game says about your taste. See the weights table in the spec. */
export function gameWeight(slug: string, state: State): number {
  const m = state.mine[slug] ?? {};
  if (m.veto) return -3;
  let w = 0;
  if (m.rating) w += m.rating - 3;
  if (m.teach) w += 1;
  if (m.learn) w += 0.5;
  const plays = state.plays.filter((p) => p.slug === slug);
  for (const p of plays) {
    if (p.again === 'yes') w += 0.5;
    else if (p.again === 'no') w -= 0.5;
  }
  if (!m.rating && plays.length) w += Math.min(plays.length, 4) * 0.15;
  return w;
}

const blankRows = (): PrefRows =>
  Object.fromEntries(DIMS.map((d) => [d.k, [0, 0, 0]])) as unknown as PrefRows;

export function profile(games: Catalog, state: State): Profile {
  const pref = blankRows();
  const shelfW: Record<string, number> = {};
  let n = 0;
  const slugs = new Set([...Object.keys(state.mine), ...state.plays.map((p) => p.slug)]);
  for (const slug of slugs) {
    const g = games[slug];
    if (!g) continue;
    const w = gameWeight(slug, state);
    if (!w) continue;
    n++;
    for (const d of DIMS) {
      const lv = g.dims?.[d.k];
      if (lv >= 1 && lv <= 3) pref[d.k][lv - 1] += w;
    }
    shelfW[g.shelf] = (shelfW[g.shelf] ?? 0) + w;
  }
  return { pref, shelfW, n };
}

/**
 * How well one level matches a preference row, centered on the row's mean so a
 * miss counts against the game. Table Talk weighs 1.5 times: it is the
 * dimension most tied to togethering.
 */
export function dimScore(row: [number, number, number], lv: Level, k: DimKey): number {
  const total = row.reduce((a, b) => a + Math.abs(b), 0);
  if (!total) return 0;
  const mean = (row[0] + row[1] + row[2]) / 3;
  return ((row[lv - 1] - mean) / (total + 1)) * (k === 'talk' ? 1.5 : 1);
}

export function fitScore(g: Game, P: Profile): number {
  let s = 0;
  for (const d of DIMS) {
    const lv = g.dims?.[d.k];
    if (lv) s += dimScore(P.pref[d.k], lv, d.k);
  }
  const shelf = P.shelfW[g.shelf] ?? 0;
  s += Math.max(-1, Math.min(1, shelf / 4)) * 0.5;
  return s;
}

const sigmoid = (score: number) => 1 / (1 + Math.exp(-2.2 * score));

/** Personal fit as 0 to 1, or null until the profile has 3 games. */
export const myFit = (g: Game, P: Profile): number | null => (P.n >= 3 ? sigmoid(fitScore(g, P)) : null);

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function reasonFor(g: Game, P: Profile): string {
  const hits: string[] = [];
  for (const d of DIMS) {
    const row = P.pref[d.k];
    const lv = g.dims?.[d.k];
    if (!lv) continue;
    const best = row.indexOf(Math.max(...row));
    if (row[best] > 0 && best === lv - 1) hits.push(d.lv[lv - 1].toLowerCase());
  }
  if (hits.length >= 2) return `${cap(hits[0])} and ${hits[1]}, like the games you rate highest.`;
  if (hits.length === 1) return `${cap(hits[0])}, which matches your best-loved games.`;
  return 'A close fit across your profile.';
}

export type Scored = { slug: string; g: Game; s: number };

/** Three personal picks plus a Discovery pick from the shelf you visit least. */
export function recommendations(games: Catalog, state: State, P: Profile): { picks: Scored[]; disc?: Scored } {
  const seen = new Set([
    ...Object.keys(state.mine).filter((k) => state.mine[k].rating || state.mine[k].veto),
    ...state.plays.map((p) => p.slug),
  ]);
  const scored = Object.entries(games)
    .filter(([slug]) => !seen.has(slug) && !state.mine[slug]?.veto)
    .map(([slug, g]) => ({ slug, g, s: fitScore(g, P) }))
    .sort((a, b) => b.s - a.s);
  const picks = scored.slice(0, 3);
  const visits: Record<string, number> = Object.fromEntries(Object.keys(SHELVES).map((k) => [k, 0]));
  for (const p of state.plays) {
    const g = games[p.slug];
    if (g) visits[g.shelf] = (visits[g.shelf] ?? 0) + 1;
  }
  const pickSlugs = new Set(picks.map((p) => p.slug));
  const disc = scored
    .filter((x) => !pickSlugs.has(x.slug) && x.s > -0.5)
    .sort((a, b) => (visits[a.g.shelf] ?? 0) - (visits[b.g.shelf] ?? 0) || b.s - a.s)[0];
  return { picks, disc };
}

// ---------- sharing a profile for game night ----------

export function shareDigest(games: Catalog, state: State): Digest {
  const P = profile(games, state);
  const flagged = (f: keyof Mine) => Object.keys(state.mine).filter((s) => state.mine[s][f]);
  return {
    pref: P.pref,
    n: P.n,
    veto: flagged('veto'),
    teach: flagged('teach'),
    learn: flagged('learn'),
    owned: flagged('own'),
    played: [...new Set(state.plays.map((p) => p.slug))],
  };
}

const CODE_PREFIX = 'LUD1.';

/** A table code: a friend's name and digest, base64url encoded. */
export function encodeTableCode(name: string, digest: Digest): string {
  const rows = DIMS.map((d) => digest.pref[d.k].map((v) => Math.round(v * 100) / 100));
  const json = JSON.stringify({ v: 1, name, n: digest.n, r: rows, x: digest.veto, t: digest.teach, l: digest.learn, o: digest.owned, p: digest.played });
  const b64 = btoa(String.fromCharCode(...new TextEncoder().encode(json)));
  return CODE_PREFIX + b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

export function decodeTableCode(code: string): { name: string; digest: Digest } | null {
  try {
    const raw = code.trim();
    if (!raw.startsWith(CODE_PREFIX)) return null;
    let b64 = raw.slice(CODE_PREFIX.length).replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4) b64 += '=';
    const json = new TextDecoder().decode(Uint8Array.from(atob(b64), (c) => c.charCodeAt(0)));
    const d = JSON.parse(json);
    if (d.v !== 1 || !Array.isArray(d.r) || d.r.length !== DIMS.length) return null;
    const strings = (v: unknown) => (Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string').slice(0, 500) : []);
    const pref = Object.fromEntries(
      DIMS.map((dim, i) => [dim.k, [0, 1, 2].map((j) => Number(d.r[i]?.[j]) || 0)]),
    ) as unknown as PrefRows;
    return {
      name: String(d.name ?? 'Friend').slice(0, 40),
      digest: { pref, n: Number(d.n) || 0, veto: strings(d.x), teach: strings(d.t), learn: strings(d.l), owned: strings(d.o), played: strings(d.p) },
    };
  } catch {
    return null;
  }
}

// ---------- game night: group picks ----------

export type Night = { me: boolean; selected: Record<string, boolean>; players: string; minutes: string; occasion: string; ownedOnly: boolean };

export type Member = {
  key: string;
  label: string;
  guest?: boolean;
  pref: Partial<PrefRows>;
  n: number;
  veto: Set<string>;
  teach: Set<string>;
  learn: Set<string>;
  played: Set<string>;
  owned: Set<string>;
};

/** A guest's picks become a preference row: +2 on the chosen level, -1 on the opposite extreme. */
export function guestPref(guest: Guest): PrefRows {
  const pref = blankRows();
  for (const d of DIMS) {
    const v = guest.prefs?.[d.k];
    if (!v) continue;
    pref[d.k][v - 1] = 2;
    if (v === 1) pref[d.k][2] = -1;
    if (v === 3) pref[d.k][0] = -1;
  }
  return pref;
}

const fromDigest = (key: string, label: string, d: Digest): Member => ({
  key,
  label,
  pref: d.pref,
  n: d.n,
  veto: new Set(d.veto),
  teach: new Set(d.teach),
  learn: new Set(d.learn),
  played: new Set(d.played),
  owned: new Set(d.owned),
});

export function tableMembers(games: Catalog, state: State, night: Night): Member[] {
  const out: Member[] = [];
  if (night.me) out.push(fromDigest('me', 'You', shareDigest(games, state)));
  for (const [id, f] of Object.entries(state.friends)) {
    if (night.selected[`f:${id}`]) out.push(fromDigest(`f:${id}`, f.name, f.digest));
  }
  for (const [id, g] of Object.entries(state.guests)) {
    if (!night.selected[`g:${id}`]) continue;
    const set = Object.values(g.prefs ?? {}).filter(Boolean).length;
    out.push({
      key: `g:${id}`,
      label: g.name,
      guest: true,
      pref: guestPref(g),
      n: set ? 3 : 0,
      veto: new Set(),
      teach: new Set(),
      learn: new Set(),
      played: new Set(),
      owned: new Set(),
    });
  }
  return out;
}

export function memberFit(m: Member, g: Game): number | null {
  if ((m.n ?? 0) < 3) return null;
  let raw = 0;
  let used = 0;
  for (const d of DIMS) {
    const row = m.pref?.[d.k];
    const lv = g.dims?.[d.k];
    if (!row || !lv || !row.reduce((a, b) => a + Math.abs(b), 0)) continue;
    raw += dimScore(row, lv, d.k);
    used++;
  }
  return used ? sigmoid(raw) : null;
}

/** Median logged minutes at this player count, or the box time. */
export function estMinutes(slug: string, g: Game, players: number, state: State): { m: number; real: boolean } {
  const logged = state.plays.filter((p) => p.slug === slug && +p.players === players && +p.minutes > 0).map((p) => +p.minutes);
  const m = median(logged);
  return m != null ? { m, real: true } : { m: +g.minutes || 0, real: false };
}

export type GroupPick = { slug: string; g: Game; score: number; fits: { m: Member; f: number | null }[]; est: { m: number; real: boolean }; notes: string[] };

export function groupPicks(games: Catalog, state: State, night: Night) {
  const members = tableMembers(games, state, night);
  const N = +night.players || members.length;
  const limit = +night.minutes || 0;
  const results: GroupPick[] = [];
  const dropped = { count: 0, veto: 0, time: 0, teach: 0, own: 0 };
  const ownedAny = new Set(members.flatMap((m) => [...m.owned]));

  for (const [slug, g] of Object.entries(games)) {
    const [min, max] = g.players ?? [1, 99];
    if (N < min || N > max) {
      dropped.count++;
      continue;
    }
    if (night.occasion && !(g.occasions ?? []).includes(night.occasion)) continue;
    if (night.ownedOnly && !ownedAny.has(slug)) {
      dropped.own++;
      continue;
    }
    if (members.some((m) => m.veto.has(slug))) {
      dropped.veto++;
      continue;
    }
    const est = estMinutes(slug, g, N, state);
    if (limit && est.m > limit) {
      dropped.time++;
      continue;
    }
    const canRun = members.filter((m) => m.teach.has(slug) || m.played.has(slug));
    if (g.dims?.learn === 3 && !canRun.length) {
      dropped.teach++;
      continue;
    }

    const fits = members.map((m) => ({ m, f: memberFit(m, g) }));
    const confident = fits.filter((x): x is { m: Member; f: number } => x.f != null);
    let score = confident.length
      ? Math.exp(confident.reduce((a, x) => a + Math.log(Math.max(0.02, x.f)), 0) / confident.length)
      : 0.5;

    const notes: string[] = [];
    const teachers = members.filter((m) => m.teach.has(slug));
    const learners = members.filter((m) => m.learn.has(slug));
    if (teachers.length && learners.length) {
      score += 0.06;
      const learner = learners[0].label === teachers[0].label ? 'someone' : learners[0].label;
      notes.push(`${teachers[0].label} can teach it and ${learner} wants to learn it.`);
    } else if (learners.length) {
      score += 0.03;
      notes.push(`${learners[0].label} ${learners[0].key === 'me' ? 'want' : 'wants'} to learn this one.`);
    }
    if ((g.best ?? []).includes(N)) score += 0.05;
    else if ((g.best ?? []).length) score -= 0.03;
    if (members.length && members.every((m) => m.played.has(slug))) score -= 0.03;

    results.push({ slug, g, score: Math.max(0, Math.min(1, score)), fits, est, notes });
  }

  results.sort((a, b) => b.score - a.score);
  const picks = results.slice(0, 5);
  const shelves = new Set(picks.map((p) => p.g.shelf));
  const disc = results.slice(5).find((r) => !shelves.has(r.g.shelf) && r.score >= 0.4);
  return { members, N, picks, disc, total: results.length, dropped, ownedAny };
}

// ---------- stats ----------

export const isoToday = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};

function weekKey(date: string): string | null {
  const d = new Date(`${date}T12:00:00`);
  if (Number.isNaN(d.getTime())) return null;
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7));
  return d.toISOString().slice(0, 10);
}

/** Weeks in a row with at least one logged play, counting back from this week or last. */
export function weekStreak(plays: Play[], today = isoToday()): number {
  const weeks = new Set(plays.map((p) => weekKey(p.date)).filter(Boolean));
  if (!weeks.size) return 0;
  const cur = new Date(`${weekKey(today)}T12:00:00`);
  if (!weeks.has(cur.toISOString().slice(0, 10))) cur.setDate(cur.getDate() - 7);
  let n = 0;
  while (weeks.has(cur.toISOString().slice(0, 10))) {
    n++;
    cur.setDate(cur.getDate() - 7);
  }
  return n;
}

export function tableStats(games: Catalog, state: State, label: (key: string) => string) {
  const companions: Record<string, number> = {};
  for (const p of state.plays) for (const k of p.with ?? []) companions[label(k)] = (companions[label(k)] ?? 0) + 1;
  const counts: Record<string, number> = {};
  for (const p of state.plays) counts[p.slug] = (counts[p.slug] ?? 0) + 1;
  const r = (k: Result) => state.plays.filter((p) => p.result === k).length;
  return {
    companions: Object.entries(companions).sort((a, b) => b[1] - a[1]).slice(0, 5),
    most: Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([slug, n]) => [games[slug]?.name ?? slug, n] as [string, number]),
    won: r('won'),
    lost: r('lost'),
    coopWon: r('coopwin'),
    coopLost: r('cooplost'),
    streak: weekStreak(state.plays),
  };
}

const csvCell = (v: unknown) => {
  const t = String(v ?? '');
  return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
};

export function playsCSV(games: Catalog, state: State, label: (key: string) => string): string {
  const head = ['date', 'game', 'call_number', 'players', 'minutes', 'someone_learning', 'result', 'played_with', 'play_again', 'table_energy', 'note'];
  const rows = [...state.plays]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((p) => {
      const g = games[p.slug];
      return [
        p.date,
        g?.name ?? p.slug,
        g?.call ?? '',
        p.players,
        p.minutes || '',
        p.taught ? 'yes' : 'no',
        RESULTS.find((r) => r[0] === p.result)?.[1] ?? '',
        (p.with ?? []).map(label).join('; '),
        p.again,
        ['', 'quiet', 'chatty', 'raucous'][p.energy ?? 0],
        p.note,
      ]
        .map(csvCell)
        .join(',');
    });
  return [head.join(','), ...rows].join('\n');
}
