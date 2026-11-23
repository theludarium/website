// Cleaning and checking what people type into the events calendar: attendee
// names, rankings, the admin's event form, and a visitor's event suggestion.
// Pure functions, shared by the browser (early feedback) and the server (the
// real check). Em dashes and en dashes become commas, because public text on
// the site never carries them.
import {
  CAL_CAPS,
  CAL_LIMITS,
  CUBE_MODES,
  DEFAULT_VOTE_CLOSE_HOURS,
  EVENT_KIND_KEYS,
  EVENT_STATUSES,
  VOTE_CLOSE_HOURS,
  type AdminEventInput,
  type CubeMode,
  type EventKind,
  type EventStatus,
  type EventSuggestion,
} from './shared.ts';
import { addDays, isIsoDate, isTime } from './dates.ts';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
/** A visitor may suggest an event up to this many days ahead (about 18 months). */
export const SUGGEST_MAX_DAYS_AHEAD = 550;

const noDashes = (v: string) => v.replace(/\s*[\u2014\u2013]\s*/g, ', ');
const noControl = (v: string) => v.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '');
/** One tidy line: no line breaks, single spaces. */
const oneLine = (v: unknown) => noDashes(noControl(typeof v === 'string' ? v : '').replace(/\s+/g, ' ').trim());
/** Paragraphs kept, everything else tidied. */
const multiLine = (v: unknown) =>
  noDashes(
    noControl(typeof v === 'string' ? v : '')
      .replace(/\r\n?/g, '\n')
      .replace(/[^\S\n]+/g, ' ')
      .replace(/ ?\n ?/g, '\n')
      .replace(/\n{3,}/g, '\n\n')
      .trim(),
  );

/** A name or Discord handle for the "who is going" list, or null when it is unusable. */
export function cleanAttendeeName(raw: unknown): string | null {
  const name = oneLine(raw);
  if (!name || name.length > CAL_LIMITS.attendeeName || !/[\p{L}\p{N}]/u.test(name)) return null;
  return name;
}

/**
 * A ballot: Cube ids, first choice first. Ids that are not in `allowed` are
 * dropped (a Cube may have been withdrawn since the page loaded) and repeats
 * keep their first place. Null when the value is not a list of whole numbers.
 */
export function cleanRanking(raw: unknown, allowed: number[]): number[] | null {
  if (!Array.isArray(raw) || raw.length > 100) return null;
  const ok = new Set(allowed);
  const seen = new Set<number>();
  const ranking: number[] = [];
  for (const value of raw) {
    if (typeof value !== 'number' || !Number.isInteger(value)) return null;
    if (ok.has(value) && !seen.has(value)) {
      seen.add(value);
      ranking.push(value);
    }
  }
  return ranking;
}

/** How many more weeks to repeat an event: a whole number from 0 to the cap. */
export function cleanRepeatWeeks(raw: unknown): number {
  const n = Number(raw);
  if (!Number.isInteger(n) || n < 0) return 0;
  return Math.min(n, CAL_CAPS.repeatWeeks);
}

const has = (body: Record<string, unknown>, key: string) => Object.prototype.hasOwnProperty.call(body, key);

/**
 * The admin's event form. With `partial`, only the keys present are checked
 * (an edit); without it, every required field must be there (a new event) and
 * the optional ones get their defaults. Errors are full sentences for the admin page.
 */
export function parseEventInput(
  body: Record<string, unknown>,
  options: { partial?: boolean } = {},
): { value: Partial<AdminEventInput> } | { error: string } {
  const partial = options.partial === true;
  const value: Partial<AdminEventInput> = {};

  if (has(body, 'title') || !partial) {
    const title = oneLine(body.title);
    if (!title) return { error: 'Add a title.' };
    if (title.length > CAL_LIMITS.title) return { error: 'The title is too long.' };
    value.title = title;
  }
  if (has(body, 'kind') || !partial) {
    const kind = has(body, 'kind') ? body.kind : 'draft';
    if (!EVENT_KIND_KEYS.includes(kind as EventKind)) return { error: 'Check the kind of event.' };
    value.kind = kind as EventKind;
  }
  if (has(body, 'date') || !partial) {
    if (!isIsoDate(body.date)) return { error: 'Check the date.' };
    value.date = body.date;
  }
  if (has(body, 'startTime') || !partial) {
    if (!isTime(body.startTime)) return { error: 'Check the start time.' };
    value.startTime = body.startTime;
  }
  if (has(body, 'endTime') || !partial) {
    if (!isTime(body.endTime)) return { error: 'Check the end time.' };
    value.endTime = body.endTime;
  }
  if (value.startTime !== undefined && value.startTime === value.endTime) return { error: 'The end time must be different from the start time.' };

  for (const [key, limit, clean] of [
    ['description', CAL_LIMITS.description, multiLine],
    ['locationName', CAL_LIMITS.locationName, oneLine],
    ['locationAddress', CAL_LIMITS.locationAddress, oneLine],
  ] as const) {
    if (has(body, key) || !partial) {
      const text = clean(body[key]);
      if (text.length > limit) return { error: `The ${key === 'description' ? 'description' : key === 'locationName' ? 'place name' : 'address'} is too long.` };
      value[key] = text || null;
    }
  }

  if (has(body, 'cubeMode') || !partial) {
    const fallback: CubeMode = (value.kind ?? 'draft') === 'draft' ? 'vote' : 'none';
    const mode = has(body, 'cubeMode') ? body.cubeMode : fallback;
    if (!CUBE_MODES.includes(mode as CubeMode)) return { error: 'Check how the Cube is chosen.' };
    value.cubeMode = mode as CubeMode;
  }
  if (has(body, 'cubeId') || !partial) {
    const raw = body.cubeId;
    if (raw === null || raw === undefined || raw === '') value.cubeId = null;
    else if (typeof raw === 'number' && Number.isInteger(raw) && raw > 0) value.cubeId = raw;
    else return { error: 'Check the Cube.' };
  }
  if (value.cubeMode === 'none') value.cubeId = null;
  if (value.cubeMode === 'set' && !partial && !value.cubeId) return { error: 'Pick the Cube for this event, or let attendees vote.' };

  if (has(body, 'voteCloseHours') || !partial) {
    const hours = has(body, 'voteCloseHours') ? body.voteCloseHours : DEFAULT_VOTE_CLOSE_HOURS;
    if (!(VOTE_CLOSE_HOURS as readonly unknown[]).includes(hours)) return { error: 'Check when voting closes.' };
    value.voteCloseHours = hours as number;
  }
  if (has(body, 'status') || !partial) {
    const status = has(body, 'status') ? body.status : 'approved';
    if (!EVENT_STATUSES.includes(status as EventStatus)) return { error: 'Check the status.' };
    value.status = status as EventStatus;
  }

  if (partial && Object.keys(value).length === 0) return { error: 'Nothing to change.' };
  return { value };
}

/**
 * A visitor's event suggestion from the form at /cube-commonwealth/events/suggest/.
 * `today` is today's date in the calendar's time zone. Returns the cleaned
 * suggestion or the code of the first problem (see SUGGEST_MESSAGES).
 */
export function parseEventSuggestion(form: FormData, today: string): EventSuggestion | { error: 'missing' | 'date' | 'time' | 'email' | 'long' } {
  const get = (key: string) => form.get(key);
  const title = oneLine(get('title'));
  const kindRaw = oneLine(get('kind'));
  const date = oneLine(get('date'));
  const startTime = oneLine(get('start_time'));
  const endTime = oneLine(get('end_time'));
  const locationName = oneLine(get('location_name'));
  const locationAddress = oneLine(get('location_address'));
  const description = multiLine(get('description'));
  const submitterName = oneLine(get('name'));
  const email = oneLine(get('email'));

  if (!title || !date || !startTime || !endTime || !submitterName) return { error: 'missing' };
  if (!isIsoDate(date) || date < today || date > addDays(today, SUGGEST_MAX_DAYS_AHEAD)) return { error: 'date' };
  if (!isTime(startTime) || !isTime(endTime) || startTime === endTime) return { error: 'time' };
  if (email && !EMAIL_PATTERN.test(email)) return { error: 'email' };
  if (
    title.length > CAL_LIMITS.title ||
    locationName.length > CAL_LIMITS.locationName ||
    locationAddress.length > CAL_LIMITS.locationAddress ||
    description.length > CAL_LIMITS.description ||
    submitterName.length > CAL_LIMITS.submitterName ||
    email.length > CAL_LIMITS.email
  ) {
    return { error: 'long' };
  }

  const kind: EventKind = EVENT_KIND_KEYS.includes(kindRaw as EventKind) ? (kindRaw as EventKind) : 'other';
  return {
    title,
    kind,
    date,
    startTime,
    endTime,
    locationName: locationName || null,
    locationAddress: locationAddress || null,
    description: description || null,
    cubeMode: oneLine(get('has_draft')) === 'yes' ? 'vote' : 'none',
    submitterName,
    submitterEmail: email || null,
  };
}
