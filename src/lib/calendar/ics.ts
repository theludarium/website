// "Add to my calendar" for one event: an .ics file (Apple, Outlook, and most
// others) and a Google Calendar link. Pure functions, built in the browser.

export type CalendarEntry = {
  id: number;
  title: string;
  /** UTC instants, ISO 8601. */
  startsAt: string;
  endsAt: string;
  description: string | null;
  locationName: string | null;
  locationAddress: string | null;
};

/** 2026-11-22T18:00:00.000Z becomes 20261122T180000Z. */
const stamp = (iso: string) => new Date(iso).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

const escapeText = (text: string) => text.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\r?\n/g, '\\n');

/** Lines longer than 75 octets continue on the next line after a space (RFC 5545). */
function fold(line: string): string {
  const bytes = new TextEncoder().encode(line);
  if (bytes.length <= 75) return line;
  const out: string[] = [];
  let current = '';
  let size = 0;
  for (const char of line) {
    const width = new TextEncoder().encode(char).length;
    const limit = out.length === 0 ? 75 : 74; // continuation lines start with one space
    if (size + width > limit) {
      out.push(current);
      current = '';
      size = 0;
    }
    current += char;
    size += width;
  }
  out.push(current);
  return out.join('\r\n ');
}

export const eventPlace = (e: Pick<CalendarEntry, 'locationName' | 'locationAddress'>) =>
  [e.locationName, e.locationAddress].filter(Boolean).join(', ');

/** The text of an .ics file for one event. `url` is the event's page. */
export function eventIcs(e: CalendarEntry, url: string): string {
  const details = [e.description, url].filter(Boolean).join('\n\n');
  const place = eventPlace(e);
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//The Ludarium//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:event-${e.id}@theludarium.com`,
    `DTSTAMP:${stamp(e.startsAt)}`,
    `DTSTART:${stamp(e.startsAt)}`,
    `DTEND:${stamp(e.endsAt)}`,
    `SUMMARY:${escapeText(e.title)}`,
    `DESCRIPTION:${escapeText(details)}`,
    ...(place ? [`LOCATION:${escapeText(place)}`] : []),
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return `${lines.map(fold).join('\r\n')}\r\n`;
}

/** A link that opens Google Calendar with the event filled in. */
export function googleCalendarUrl(e: CalendarEntry, url: string): string {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: e.title,
    dates: `${stamp(e.startsAt)}/${stamp(e.endsAt)}`,
    details: [e.description, url].filter(Boolean).join('\n\n'),
  });
  const place = eventPlace(e);
  if (place) params.set('location', place);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}
