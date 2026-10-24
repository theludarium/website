// Validates first-party events before they are stored.
import { EVENT_TYPES, type EventType } from './score';

export const MAX_EVENTS_PER_REQUEST = 500;
export const SLUG = /^[a-z0-9][a-z0-9-]{0,79}$/;
const SOURCE = /^[a-z0-9][a-z0-9_.-]{0,39}$/;
const MAX_META_CHARS = 2000;
const DAY = 86_400_000;

export interface CleanEvent {
  at: string;
  type: EventType;
  game_id: number | null;
  game_slug: string | null;
  value: number;
  source: string;
  meta: string | null;
}

export class EventError extends Error {
  constructor(public index: number, message: string) { super(message); }
}

export function isEventType(t: unknown): t is EventType {
  return typeof t === 'string' && (EVENT_TYPES as readonly string[]).includes(t);
}

/** Checks one event. Throws EventError with the item index when something is off. */
export function cleanEvent(input: unknown, index: number, now: Date, defaultSource = 'api'): CleanEvent {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new EventError(index, 'Each event must be an object');
  const e = input as Record<string, unknown>;
  if (!isEventType(e.type)) throw new EventError(index, `type must be one of: ${EVENT_TYPES.join(', ')}`);

  let gameId: number | null = null;
  if (e.game_id != null && e.game_id !== '') {
    gameId = Number(e.game_id);
    if (!Number.isInteger(gameId) || gameId <= 0) throw new EventError(index, 'game_id must be a positive BGG id');
  }
  let slug: string | null = null;
  if (e.game_slug != null && e.game_slug !== '') {
    slug = String(e.game_slug).toLowerCase();
    if (!SLUG.test(slug)) throw new EventError(index, 'game_slug must be lowercase letters, numbers and dashes');
  }
  if (gameId == null && slug == null) throw new EventError(index, 'Give a game_id, a game_slug, or both');

  let value = 1;
  if (e.value != null) {
    value = Number(e.value);
    if (!Number.isFinite(value) || value <= 0 || value > 10_000_000) throw new EventError(index, 'value must be a number above 0');
  }

  let at = now.toISOString();
  if (e.at != null) {
    const t = Date.parse(String(e.at));
    if (!Number.isFinite(t)) throw new EventError(index, 'at must be an ISO date and time');
    if (t > now.getTime() + DAY || t < now.getTime() - 400 * DAY) throw new EventError(index, 'at must be within the last 400 days');
    at = new Date(t).toISOString();
  }

  let source = defaultSource;
  if (e.source != null) {
    source = String(e.source).toLowerCase();
    if (!SOURCE.test(source)) throw new EventError(index, 'source must be a short lowercase label such as site or app');
  }

  let meta: string | null = null;
  if (e.meta != null) {
    if (typeof e.meta !== 'object' || Array.isArray(e.meta)) throw new EventError(index, 'meta must be an object');
    meta = JSON.stringify(e.meta);
    if (meta.length > MAX_META_CHARS) throw new EventError(index, 'meta is too large');
  }

  return { at, type: e.type, game_id: gameId, game_slug: slug, value, source, meta };
}

/** Accepts one event or an array of them. */
export function cleanEvents(body: unknown, now: Date, defaultSource = 'api'): CleanEvent[] {
  const list = Array.isArray(body) ? body : [body];
  if (!list.length) throw new EventError(-1, 'Send at least one event');
  if (list.length > MAX_EVENTS_PER_REQUEST) throw new EventError(-1, `Send at most ${MAX_EVENTS_PER_REQUEST} events at a time`);
  return list.map((e, i) => cleanEvent(e, i, now, defaultSource));
}
