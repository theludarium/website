// Date helpers. Every date is UTC and written as YYYY-MM-DD.

const DAY = 86_400_000;
export const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function addDays(date: string, days: number): string {
  return isoDate(new Date(Date.parse(`${date}T00:00:00Z`) + days * DAY));
}

/** The Monday on or before the given date. */
export function mondayOf(date: string): string {
  const dow = new Date(`${date}T00:00:00Z`).getUTCDay(); // 0 Sunday .. 6 Saturday
  return addDays(date, -((dow + 6) % 7));
}

/** The week to score when the job runs on `now`: the last full Monday to Sunday before it. */
export function weekToScore(now: Date): string {
  return addDays(mondayOf(isoDate(now)), -7);
}

/** Reads ?week=YYYY-MM-DD and snaps it to that week's Monday. Returns null when the value is not a real date. */
export function parseWeek(raw: string | null): string | null {
  if (!raw || !ISO_DATE.test(raw)) return null;
  const t = Date.parse(`${raw}T00:00:00Z`);
  if (!Number.isFinite(t) || isoDate(new Date(t)) !== raw) return null;
  return mondayOf(raw);
}
