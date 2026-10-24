// Private watch app: validation for watchlist rows.
import { HttpError } from './http';

export const WATCH_KINDS = ['boardgame', 'crowdfunding', 'tcg'] as const;
export const WATCH_STATUSES = ['watching', 'rising', 'covered', 'passed', 'archived'] as const;
const TEXT_FIELDS = { name: 200, release_window: 80, notes: 4000, trigger: 500, verdict: 1000, signals: 4000 } as const;

export type WatchInput = Partial<{
  name: string; kind: string; bgg_id: number | null; release_window: string | null; status: string | null;
  signals: string | null; notes: string | null; trigger: string | null; verdict: string | null;
}>;

/** Validates the fields given. `creating` requires name and kind. */
export function cleanWatch(body: unknown, creating: boolean): WatchInput {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw new HttpError(400, 'Send an object');
  const b = body as Record<string, unknown>;
  const out: WatchInput = {};
  for (const [k, max] of Object.entries(TEXT_FIELDS) as [keyof typeof TEXT_FIELDS, number][]) {
    if (!(k in b)) continue;
    let v = b[k];
    if (k === 'signals' && v != null && typeof v === 'object') v = JSON.stringify(v);
    if (v == null || v === '') { (out as any)[k] = null; continue; }
    const s = String(v).trim();
    if (s.length > max) throw new HttpError(400, `${k} is too long (max ${max})`);
    (out as any)[k] = s;
  }
  if ('kind' in b) {
    if (!(WATCH_KINDS as readonly string[]).includes(String(b.kind))) throw new HttpError(400, `kind must be one of: ${WATCH_KINDS.join(', ')}`);
    out.kind = String(b.kind);
  }
  if ('status' in b) {
    if (b.status == null || b.status === '') out.status = null;
    else if (!(WATCH_STATUSES as readonly string[]).includes(String(b.status))) throw new HttpError(400, `status must be one of: ${WATCH_STATUSES.join(', ')}`);
    else out.status = String(b.status);
  }
  if ('bgg_id' in b) {
    if (b.bgg_id == null || b.bgg_id === '') out.bgg_id = null;
    else {
      const n = Number(b.bgg_id);
      if (!Number.isInteger(n) || n <= 0) throw new HttpError(400, 'bgg_id must be a positive BGG id');
      out.bgg_id = n;
    }
  }
  if (creating) {
    if (!out.name) throw new HttpError(400, 'name is required');
    if (!out.kind) throw new HttpError(400, 'kind is required');
    if (!('status' in out)) out.status = 'watching';
  } else if ('name' in out && !out.name) {
    throw new HttpError(400, 'name cannot be empty');
  }
  return out;
}
