// Private settings stored in D1. Never returned by public routes.
import { DEFAULT_HIGH_PLAY_THRESHOLD, DEFAULT_HIGH_PLAY_WEIGHTS, DEFAULT_WEIGHTS, type ScoreSettings, type Weights } from './score';
import { HttpError } from './http';

export const SETTING_KEYS = ['weights', 'weights_high_play', 'high_play_threshold'] as const;

export interface StoredSettings {
  weights: Weights;
  weights_high_play: Weights;
  high_play_threshold: number;
}

function parseOr<T>(raw: string | undefined, fallback: T): T {
  if (raw == null) return fallback;
  try { return JSON.parse(raw) as T; } catch { return fallback; }
}

export async function readSettings(db: D1Database): Promise<StoredSettings & ScoreSettings> {
  const { results } = await db.prepare(
    `SELECT key, value FROM settings WHERE key IN (${SETTING_KEYS.map(() => '?').join(',')})`,
  ).bind(...SETTING_KEYS).all<{ key: string; value: string }>();
  const m = new Map((results || []).map(r => [r.key, r.value]));
  const threshold = Number(parseOr(m.get('high_play_threshold'), DEFAULT_HIGH_PLAY_THRESHOLD));
  return {
    weights: parseOr(m.get('weights'), DEFAULT_WEIGHTS),
    weights_high_play: parseOr(m.get('weights_high_play'), DEFAULT_HIGH_PLAY_WEIGHTS),
    high_play_threshold: Number.isFinite(threshold) ? threshold : DEFAULT_HIGH_PLAY_THRESHOLD,
  };
}

function checkWeights(v: unknown, key: string): Weights {
  if (!v || typeof v !== 'object' || Array.isArray(v)) throw new HttpError(400, `${key} must be an object with attention, interest and play`);
  const o = v as Record<string, unknown>;
  const out = {} as Weights;
  for (const k of ['attention', 'interest', 'play'] as const) {
    const n = Number(o[k]);
    if (!Number.isFinite(n) || n < 0 || n > 1) throw new HttpError(400, `${key}.${k} must be a number from 0 to 1`);
    out[k] = n;
  }
  const extra = Object.keys(o).filter(k => !['attention', 'interest', 'play'].includes(k));
  if (extra.length) throw new HttpError(400, `${key} has unknown keys: ${extra.join(', ')}`);
  if (out.attention + out.interest + out.play <= 0) throw new HttpError(400, `${key} must not be all zero`);
  return out;
}

/** Validates a partial settings update and returns the rows to write. */
export function settingsUpdate(body: unknown): [string, string][] {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Send an object');
  const b = body as Record<string, unknown>;
  const rows: [string, string][] = [];
  if ('weights' in b) rows.push(['weights', JSON.stringify(checkWeights(b.weights, 'weights'))]);
  if ('weights_high_play' in b) rows.push(['weights_high_play', JSON.stringify(checkWeights(b.weights_high_play, 'weights_high_play'))]);
  if ('high_play_threshold' in b) {
    const n = Number(b.high_play_threshold);
    if (!Number.isInteger(n) || n < 0) throw new HttpError(400, 'high_play_threshold must be a whole number, 0 or more');
    rows.push(['high_play_threshold', String(n)]);
  }
  const unknown = Object.keys(b).filter(k => !(SETTING_KEYS as readonly string[]).includes(k));
  if (unknown.length) throw new HttpError(400, `Unknown settings: ${unknown.join(', ')}`);
  if (!rows.length) throw new HttpError(400, 'Nothing to update');
  return rows;
}
