// The Ludometer score. Pure functions only: no database, no clock, no network.
//
// How a week is scored:
// 1. Candidates are every game on the BGG Hotness list during the week, plus
//    every game with first-party events in the week.
// 2. Each raw signal is turned into a number (counts go through log(1 + x) so
//    one huge number cannot drown the rest), then divided by the largest value
//    among the candidates. Every signal ends up 0..1.
// 3. Signals are averaged into three families with the weights in FAMILIES,
//    and each family is again divided by its largest value, so the leader in
//    each family scores 1.
// 4. Score = weighted sum of the families. The weights come from the private
//    `weights` setting. When logged plays in the week pass the threshold
//    (default 500), the `weights_high_play` setting is used instead, so the
//    index leans on real plays once there are enough of them to trust.

export const EVENT_TYPES = [
  'play', 'shelf_add', 'like', 'course_signup', 'sheet_download',
  'watch_signup', 'page_view', 'return_visit', 'youtube_views', 'table_seated',
] as const;
export type EventType = typeof EVENT_TYPES[number];

export type Family = 'attention' | 'interest' | 'play';
export type Weights = Record<Family, number>;

export const DEFAULT_WEIGHTS: Weights = { attention: 0.6, interest: 0.3, play: 0.1 };
export const DEFAULT_HIGH_PLAY_WEIGHTS: Weights = { attention: 0.45, interest: 0.3, play: 0.25 };
export const DEFAULT_HIGH_PLAY_THRESHOLD = 500;
export const TOP_N = 50;
/** BGG's Hotness list has 50 places. */
export const HOT_LIST_SIZE = 50;

/** Signals inside each family and their share of it. */
export const FAMILIES: Record<Family, Record<string, number>> = {
  attention: { hot_best_rank: 0.4, hot_days: 0.3, rating_growth: 0.3 },
  interest: { page_view: 1, return_visit: 1, watch_signup: 1, sheet_download: 1, course_signup: 1, youtube_views: 1 },
  play: { play: 1, shelf_add: 1, like: 1, table_seated: 1 },
};

export interface SnapshotRow { date: string; rank: number; game_id: number; name: string }
export interface StatRow { date: string; game_id: number; users_rated: number | null }
export interface EventTotal { game_id: number; type: string; total: number }

export interface ScoreSettings {
  weights?: Partial<Weights> | null;
  weights_high_play?: Partial<Weights> | null;
  high_play_threshold?: number | null;
}

export interface ScoreInput {
  week: string;
  /** Hotness rows dated inside the week. */
  snapshots: SnapshotRow[];
  /** Stats rows from the day before the week through its last day. */
  stats: StatRow[];
  /** Event totals per game and type inside the week, already resolved to BGG ids. */
  events: EventTotal[];
  /** All logged plays in the week, including any that could not be tied to a game. */
  totalPlays: number;
  prevRanks: Record<number, number>;
  /** Days on the Hotness list, all time, through the week's last day. */
  cumulativeDays: Record<number, number>;
  names: Record<number, string>;
  settings: ScoreSettings;
  limit?: number;
}

export interface WeeklyRow {
  week: string;
  game_id: number;
  name: string;
  rank: number;
  score: number;
  attention: number;
  interest: number;
  play: number;
  prev_rank: number | null;
  bgg_hot_rank: number | null;
  days_on_list: number;
}

export interface ScoreResult {
  rows: WeeklyRow[];
  weights: Weights;
  weightSet: 'weights' | 'weights_high_play';
  totalPlays: number;
  candidates: number;
}

/** Cleans a weights object: known keys only, non-negative numbers, summing to 1. Falls back when unusable. */
export function normalizeWeights(w: Partial<Weights> | null | undefined, fallback: Weights): Weights {
  const pick = (k: Family) => {
    const v = Number(w?.[k]);
    return Number.isFinite(v) && v >= 0 ? v : 0;
  };
  const raw = { attention: pick('attention'), interest: pick('interest'), play: pick('play') };
  const sum = raw.attention + raw.interest + raw.play;
  if (!w || sum <= 0) return { ...fallback };
  return { attention: raw.attention / sum, interest: raw.interest / sum, play: raw.play / sum };
}

export function chooseWeights(settings: ScoreSettings, totalPlays: number): { weights: Weights; weightSet: ScoreResult['weightSet'] } {
  const threshold = Number.isFinite(Number(settings.high_play_threshold)) && settings.high_play_threshold != null
    ? Number(settings.high_play_threshold) : DEFAULT_HIGH_PLAY_THRESHOLD;
  if (totalPlays > threshold) {
    return { weights: normalizeWeights(settings.weights_high_play, DEFAULT_HIGH_PLAY_WEIGHTS), weightSet: 'weights_high_play' };
  }
  return { weights: normalizeWeights(settings.weights, DEFAULT_WEIGHTS), weightSet: 'weights' };
}

/** Divide every value by the largest one. All zeros stay zeros. */
export function scaleToMax(values: Map<number, number>): Map<number, number> {
  let max = 0;
  for (const v of values.values()) if (v > max) max = v;
  const out = new Map<number, number>();
  for (const [k, v] of values) out.set(k, max > 0 ? Math.max(0, v) / max : 0);
  return out;
}

/** BGG Hotness rank to points: 1st place 1.0, 50th place 0.02, off the list 0. */
export function hotRankPoints(bestRank: number | null | undefined): number {
  if (bestRank == null || bestRank < 1) return 0;
  return Math.max(0, (HOT_LIST_SIZE + 1 - bestRank) / HOT_LIST_SIZE);
}

/** Growth in BGG rating count across the week: last reading minus first. Never negative. */
export function ratingGrowth(rows: StatRow[]): number {
  const usable = rows.filter(r => r.users_rated != null).sort((a, b) => a.date.localeCompare(b.date));
  if (usable.length < 2) return 0;
  return Math.max(0, (usable[usable.length - 1].users_rated as number) - (usable[0].users_rated as number));
}

export function computeWeek(input: ScoreInput): ScoreResult {
  const limit = input.limit ?? TOP_N;
  const ids = new Set<number>();
  for (const s of input.snapshots) ids.add(s.game_id);
  for (const e of input.events) if (e.total > 0 && (EVENT_TYPES as readonly string[]).includes(e.type)) ids.add(e.game_id);

  // Raw signals per game.
  const raw: Record<string, Map<number, number>> = {};
  const signal = (name: string) => (raw[name] ||= new Map(Array.from(ids, id => [id, 0])));
  for (const fam of Object.values(FAMILIES)) for (const name of Object.keys(fam)) signal(name);

  const bestRank = new Map<number, number>();
  const daysInWeek = new Map<number, Set<string>>();
  for (const s of input.snapshots) {
    bestRank.set(s.game_id, Math.min(bestRank.get(s.game_id) ?? Infinity, s.rank));
    if (!daysInWeek.has(s.game_id)) daysInWeek.set(s.game_id, new Set());
    daysInWeek.get(s.game_id)!.add(s.date);
  }
  const statsByGame = new Map<number, StatRow[]>();
  for (const r of input.stats) {
    if (!statsByGame.has(r.game_id)) statsByGame.set(r.game_id, []);
    statsByGame.get(r.game_id)!.push(r);
  }
  for (const id of ids) {
    signal('hot_best_rank').set(id, hotRankPoints(bestRank.get(id)));
    signal('hot_days').set(id, daysInWeek.get(id)?.size ?? 0);
    signal('rating_growth').set(id, Math.log1p(ratingGrowth(statsByGame.get(id) || [])));
  }
  for (const e of input.events) {
    if (!ids.has(e.game_id) || !raw[e.type]) continue;
    const m = raw[e.type];
    m.set(e.game_id, (m.get(e.game_id) || 0) + Math.max(0, e.total));
  }
  // Counts are compressed before scaling. Rank points and days are already bounded.
  for (const name of Object.keys(raw)) {
    if (name === 'hot_best_rank' || name === 'hot_days' || name === 'rating_growth') continue;
    for (const [k, v] of raw[name]) raw[name].set(k, Math.log1p(v));
  }

  const scaled: Record<string, Map<number, number>> = {};
  for (const name of Object.keys(raw)) scaled[name] = scaleToMax(raw[name]);

  const familyScores = {} as Record<Family, Map<number, number>>;
  for (const fam of Object.keys(FAMILIES) as Family[]) {
    const parts = FAMILIES[fam];
    const total = Object.values(parts).reduce((a, b) => a + b, 0);
    const m = new Map<number, number>();
    for (const id of ids) {
      let s = 0;
      for (const [name, w] of Object.entries(parts)) s += (scaled[name].get(id) || 0) * w;
      m.set(id, s / total);
    }
    familyScores[fam] = scaleToMax(m);
  }

  const { weights, weightSet } = chooseWeights(input.settings, input.totalPlays);
  const lastDate = input.snapshots.reduce((d, s) => (s.date > d ? s.date : d), '');
  const lastRank = new Map(input.snapshots.filter(s => s.date === lastDate).map(s => [s.game_id, s.rank]));
  const snapshotName = new Map<number, string>();
  for (const s of [...input.snapshots].sort((a, b) => a.date.localeCompare(b.date))) snapshotName.set(s.game_id, s.name);

  const scored = Array.from(ids, id => {
    const attention = familyScores.attention.get(id) || 0;
    const interest = familyScores.interest.get(id) || 0;
    const play = familyScores.play.get(id) || 0;
    return {
      id, attention, interest, play,
      score: weights.attention * attention + weights.interest * interest + weights.play * play,
    };
  })
    .filter(g => g.score > 0)
    .sort((a, b) => b.score - a.score || b.attention - a.attention || b.play - a.play || a.id - b.id)
    .slice(0, limit);

  const rows: WeeklyRow[] = scored.map((g, i) => ({
    week: input.week,
    game_id: g.id,
    name: input.names[g.id] || snapshotName.get(g.id) || `BGG ${g.id}`,
    rank: i + 1,
    score: g.score,
    attention: g.attention,
    interest: g.interest,
    play: g.play,
    prev_rank: input.prevRanks[g.id] ?? null,
    bgg_hot_rank: lastRank.get(g.id) ?? null,
    days_on_list: input.cumulativeDays[g.id] ?? 0,
  }));

  return { rows, weights, weightSet, totalPlays: input.totalPlays, candidates: ids.size };
}

/** Movement for display: positive means the game climbed. Null for new entries. */
export function movement(rank: number, prevRank: number | null): number | null {
  return prevRank == null ? null : prevRank - rank;
}
