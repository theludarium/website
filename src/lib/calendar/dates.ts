// Pure date and time helpers for the events calendar. A date is a plain
// 'YYYY-MM-DD' string and a time is 'HH:MM' (24 hour), both local to the
// event's time zone. A month is 'YYYY-MM'. Nothing here reads the clock unless
// the caller passes `now`, and the formatters never depend on the machine's
// locale, so the server, the browser, and the tests all print the same words.

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'] as const;

const pad = (n: number) => String(n).padStart(2, '0');

/** True for a real calendar date written YYYY-MM-DD. */
export function isIsoDate(value: unknown): value is string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return y >= 1970 && date.getUTCFullYear() === y && date.getUTCMonth() === m - 1 && date.getUTCDate() === d;
}

/** True for a 24 hour time written HH:MM. */
export function isTime(value: unknown): value is string {
  return typeof value === 'string' && /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

/** True for a month written YYYY-MM. */
export function isMonth(value: unknown): value is string {
  return typeof value === 'string' && /^\d{4}-(0[1-9]|1[0-2])$/.test(value) && Number(value.slice(0, 4)) >= 1970;
}

// Noon UTC keeps day arithmetic clear of any offset.
const toUtcNoon = (date: string) => {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d, 12));
};
const fromUtc = (d: Date) => `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;

export function addDays(date: string, days: number): string {
  const d = toUtcNoon(date);
  d.setUTCDate(d.getUTCDate() + days);
  return fromUtc(d);
}

/** Whole days from a to b. Positive when b is later. */
export function daysBetween(a: string, b: string): number {
  return Math.round((toUtcNoon(b).getTime() - toUtcNoon(a).getTime()) / 86_400_000);
}

/** 0 for Sunday through 6 for Saturday. */
export function weekday(date: string): number {
  return toUtcNoon(date).getUTCDay();
}

/** The month a date falls in, as YYYY-MM. */
export const monthOf = (date: string) => date.slice(0, 7);

export function addMonths(month: string, delta: number): string {
  const [y, m] = month.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1, 12));
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}`;
}

export type GridDay = { date: string; inMonth: boolean };

/** The weeks a month view shows, Sunday first. Days from the months on either side fill the first and last rows. */
export function monthGrid(month: string): GridDay[][] {
  const first = `${month}-01`;
  const start = addDays(first, -weekday(first));
  const next = `${addMonths(month, 1)}-01`;
  const weeks: GridDay[][] = [];
  for (let day = start; day < next; ) {
    const week: GridDay[] = [];
    for (let i = 0; i < 7; i += 1) {
      week.push({ date: day, inMonth: monthOf(day) === month });
      day = addDays(day, 1);
    }
    weeks.push(week);
  }
  return weeks;
}

/** First and last date a month view shows, including the filler days. */
export function gridRange(month: string): { from: string; to: string } {
  const weeks = monthGrid(month);
  return { from: weeks[0][0].date, to: weeks[weeks.length - 1][6].date };
}

/** "13:00" becomes "1:00 pm". */
export function formatTime(time: string): string {
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
}

/** "1:00 pm to 4:30 pm". */
export const formatTimeRange = (start: string, end: string) => `${formatTime(start)} to ${formatTime(end)}`;

/**
 * long:   "Sunday, November 22, 2026"
 * medium: "Sunday, November 22"
 * short:  "Sun, Nov 22"
 */
export function formatDate(date: string, style: 'long' | 'medium' | 'short' = 'medium'): string {
  const d = toUtcNoon(date);
  const day = WEEKDAYS[d.getUTCDay()];
  const month = MONTHS[d.getUTCMonth()];
  if (style === 'short') return `${day.slice(0, 3)}, ${month.slice(0, 3)} ${d.getUTCDate()}`;
  const base = `${day}, ${month} ${d.getUTCDate()}`;
  return style === 'long' ? `${base}, ${d.getUTCFullYear()}` : base;
}

/** "November 2026". */
export function formatMonth(month: string): string {
  const [y, m] = month.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export const WEEKDAY_NAMES: readonly string[] = WEEKDAYS;

/** Minutes a time zone is ahead of UTC at an instant (negative in the Americas). */
function offsetMinutes(utcMs: number, tz: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(utcMs));
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value);
  const asUtc = Date.UTC(get('year'), get('month') - 1, get('day'), get('hour'), get('minute'), get('second'));
  return Math.round((asUtc - utcMs) / 60_000);
}

/** The UTC instant (ISO 8601) of a local date and time in an IANA time zone. */
export function zonedToUtc(date: string, time: string, tz: string): string {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  const wall = Date.UTC(y, m - 1, d, hh, mm);
  // Two passes settle the hours around a daylight saving change.
  let utc = wall - offsetMinutes(wall, tz) * 60_000;
  utc = wall - offsetMinutes(utc, tz) * 60_000;
  return new Date(utc).toISOString();
}

/** Start and end instants of an event. An end time at or before the start means it ends the next day. */
export function eventInstants(date: string, startTime: string, endTime: string, tz: string): { startsAt: string; endsAt: string } {
  const endDate = endTime <= startTime ? addDays(date, 1) : date;
  return { startsAt: zonedToUtc(date, startTime, tz), endsAt: zonedToUtc(endDate, endTime, tz) };
}

/** Today's date in a time zone. */
export function todayIn(tz: string, now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
  const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
  return `${get('year')}-${get('month')}-${get('day')}`;
}

/** When voting closes: so many hours before the start. */
export function voteCloseInstant(startsAt: string, hoursBefore: number): string {
  return new Date(new Date(startsAt).getTime() - hoursBefore * 3_600_000).toISOString();
}
