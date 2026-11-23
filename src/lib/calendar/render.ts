// The calendar page's HTML: the month grid, the day card, "Coming up", and the
// small lines around them. Pure functions, strings in and strings out, so the
// browser and the tests build the same markup. src/scripts/calendar.ts holds
// the state and calls these; src/scripts/calendar-cube.ts moves what they draw.
// Every value that came from a person or the server goes through escapeHtml.
// The few rules with no HTML in them (what the page address means, where an
// arrow key goes, which events are coming up) live here too, so they can be
// tested without a browser.
// Spec: docs/calendar/SPEC.md, section 5, and docs/calendar/DAY-CUBE.md.
import { escapeHtml } from '../cube-library.ts';
import { addDays, addMonths, eventInstants, formatDate, formatTimeRange, isIsoDate, isMonth, isTime, monthGrid, monthOf, weekday, WEEKDAY_NAMES } from './dates.ts';
import { EVENT_KINDS, EVENT_KIND_KEYS, kindLabel, type EventKind, type EventSummary } from './shared.ts';

/** Escapes a value for HTML. A missing value prints as nothing rather than stopping the page. */
const esc = (value: unknown) => escapeHtml(String(value ?? ''));
/** A number from the server, made safe to print. The types say number, but the HTML should not have to trust that. */
const num = (n: unknown) => String(Number(n) || 0);
const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/** The kind as a safe class name. Anything the page does not know draws as "other". */
export const kindKey = (kind: unknown): EventKind => (EVENT_KIND_KEYS.includes(kind as EventKind) ? (kind as EventKind) : 'other');

const isOff = (e: Pick<EventSummary, 'status'>) => e.status === 'cancelled';

// ---------- Words ----------

/** "13:00" becomes "1 pm" and "18:30" becomes "6:30 pm". Only for the month grid, where room is short. */
export function shortTime(time: string): string {
  if (!isTime(time)) return time;
  const [h, m] = time.split(':').map(Number);
  return `${h % 12 === 0 ? 12 : h % 12}${m ? `:${String(m).padStart(2, '0')}` : ''} ${h < 12 ? 'am' : 'pm'}`;
}

/** "1:00 pm to 4:30 pm", or the raw values if the server ever sends something that is not a time. */
const timeRange = (e: Pick<EventSummary, 'startTime' | 'endTime'>) =>
  isTime(e.startTime) && isTime(e.endTime) ? formatTimeRange(e.startTime, e.endTime) : `${e.startTime} to ${e.endTime}`;

const dateWords = (date: string, style: 'medium' | 'short' = 'medium') => (isIsoDate(date) ? formatDate(date, style) : date);

/** "8 going". With nobody yet it says nothing: an empty count is no welcome. */
export const goingWords = (going: number) => (Number(going) > 0 ? `${num(going)} going` : '');

/**
 * A day button's full name for screen readers: "Sunday, November 22, 3 events".
 * Today says so first. With `events` null the count is not known yet, so it is left out.
 */
export function dayLabel(date: string, events: readonly EventSummary[] | null, today: string): string {
  const base = `${date === today ? 'Today, ' : ''}${dateWords(date)}`;
  if (!events) return base;
  const off = events.filter(isOff).length;
  return `${base}, ${events.length ? plural(events.length, 'event') : 'no events'}${off ? `, ${off} cancelled` : ''}`;
}

/** An event row's full name for screen readers: the title first, then when it is and what kind, then the rest. */
export function eventLabel(e: EventSummary, opts: { withDate?: boolean; mine?: boolean } = {}): string {
  return [
    e.title,
    opts.withDate ? dateWords(e.date) : '',
    timeRange(e),
    kindLabel(e.kind),
    isOff(e) ? 'cancelled' : '',
    e.locationName ?? '',
    goingWords(e.going),
    opts.mine ? 'you are going' : '',
    e.isSample ? 'sample event' : '',
  ]
    .filter(Boolean)
    .join(', ');
}

// ---------- Sorting and picking ----------

const inOrder = (a: EventSummary, b: EventSummary) => (a.date < b.date ? -1 : a.date > b.date ? 1 : a.startTime < b.startTime ? -1 : a.startTime > b.startTime ? 1 : a.id - b.id);

/** Events by day, each day in start-time order. */
export function groupByDate(events: readonly EventSummary[]): Map<string, EventSummary[]> {
  const days = new Map<string, EventSummary[]>();
  for (const e of [...events].sort(inOrder)) {
    const list = days.get(e.date);
    if (list) list.push(e);
    else days.set(e.date, [e]);
  }
  return days;
}

/** When an event ends, in milliseconds, or NaN when its date or times are unusable. */
function endsAtMs(e: EventSummary, tz: string): number {
  if (!isIsoDate(e.date) || !isTime(e.startTime) || !isTime(e.endTime)) return Number.NaN;
  try {
    return Date.parse(eventInstants(e.date, e.startTime, e.endTime, tz).endsAt);
  } catch {
    return Number.NaN;
  }
}

/** "Coming up": the next events that have not ended and are not cancelled, soonest first. */
export function pickUpcoming(events: readonly EventSummary[], nowMs: number, tz: string, limit = 6): EventSummary[] {
  return events
    .filter((e) => !isOff(e) && endsAtMs(e, tz) > nowMs)
    .sort(inOrder)
    .slice(0, limit);
}

// ---------- The page address ----------

/** What the page address asks for. `month` is YYYY-MM, `day` is YYYY-MM-DD, `event` is an event id. */
export type PageView = { month: string | null; day: string | null; event: number | null };

/** Reads the view out of a query string. Anything malformed reads as not there. */
export function readView(search: string): PageView {
  const q = new URLSearchParams(search);
  const month = q.get('month');
  const day = q.get('day');
  const event = q.get('event') ?? '';
  return {
    month: isMonth(month) ? month : null,
    day: isIsoDate(day) ? day : null,
    event: /^[1-9]\d{0,14}$/.test(event) ? Number(event) : null,
  };
}

/** Review switches that may arrive in the address. They are read once and never written back. */
const REVIEW_KEYS = ['freeze', 'turn', 'clock'];

/**
 * The query string for a view ("" or "?..."), built from the one in the
 * address now. An event link carries only the event, a day link only the day:
 * the rest follows from them. Anything else in the address (samples=1, a
 * campaign tag) is kept; the review switches are dropped.
 */
export function viewQuery(search: string, view: Partial<PageView>): string {
  const q = new URLSearchParams(search);
  for (const key of ['month', 'day', 'event', ...REVIEW_KEYS]) q.delete(key);
  if (view.event) q.set('event', String(view.event));
  else if (view.day) q.set('day', view.day);
  else if (view.month) q.set('month', view.month);
  const text = q.toString();
  return text ? `?${text}` : '';
}

// ---------- Keys in the month grid ----------

/** The last day of a month, as a date. */
const lastDayOf = (month: string) => addDays(`${addMonths(month, 1)}-01`, -1);

/** The same day of the month in another month, or that month's last day when it is shorter. */
function sameDayIn(month: string, date: string): string {
  const wanted = `${month}-${date.slice(8, 10)}`;
  const last = lastDayOf(month);
  return wanted > last ? last : wanted;
}

/**
 * Where a key takes the focus from a day. Arrows move a day or a week (and may
 * cross into the next month), Home and End go to the ends of the week without
 * leaving the month, Page Up and Page Down change the month and keep the day
 * of the month where they can. Null for any other key.
 */
export function keyTarget(date: string, key: string): string | null {
  const month = monthOf(date);
  switch (key) {
    case 'ArrowLeft':
      return addDays(date, -1);
    case 'ArrowRight':
      return addDays(date, 1);
    case 'ArrowUp':
      return addDays(date, -7);
    case 'ArrowDown':
      return addDays(date, 7);
    case 'Home': {
      const sunday = addDays(date, -weekday(date));
      return sunday < `${month}-01` ? `${month}-01` : sunday;
    }
    case 'End': {
      const saturday = addDays(date, 6 - weekday(date));
      const last = lastDayOf(month);
      return saturday > last ? last : saturday;
    }
    case 'PageUp':
      return sameDayIn(addMonths(month, -1), date);
    case 'PageDown':
      return sameDayIn(addMonths(month, 1), date);
    default:
      return null;
  }
}

/** The one day in the grid that Tab lands on: the last one focused, else today when it is in view, else the first of the month. */
export function tabStopFor(month: string, lastFocused: string | null, today: string): string {
  if (lastFocused && monthOf(lastFocused) === month) return lastFocused;
  return monthOf(today) === month ? today : `${month}-01`;
}

// ---------- Mini-Cubes and icons ----------

const ISO_FACES =
  '<polygon class="cal-iso__t" points="7,0.5 13.3,4.1 7,7.7 0.7,4.1"/><polygon class="cal-iso__l" points="0.7,4.1 7,7.7 7,14.7 0.7,11.1"/><polygon class="cal-iso__r" points="13.3,4.1 13.3,11.1 7,14.7 7,7.7"/>';

/** The flat mini-Cube that marks an event in the month grid: three faces, colored by kind. A cancelled event's is an outline. */
export const isoCube = (kind: unknown, off = false) =>
  `<svg class="cal-iso cal-k-${kindKey(kind)}${off ? ' is-off' : ''}" viewBox="0 0 14 15" aria-hidden="true" focusable="false">${ISO_FACES}</svg>`;

/**
 * The true 3D mini-Cube of the day list: six faces that CSS folds together. The wrappers each do one
 * thing: hold the view (perspective), tip it toward the visitor, turn it while its row is hovered or
 * focused, and give it its resting angle and the one slow turn it makes when it lands.
 */
export const miniCube = (kind: unknown) =>
  `<span class="cal-mcw cal-k-${kindKey(kind)}"><span class="cal-mcx"><span class="cal-mcy"><span class="cal-mc"><i></i><i></i><i></i><i></i><i></i><i></i></span></span></span></span>`;

const stroke = (size: number, box: number, body: string, cls = '') =>
  `<svg${cls ? ` class="${cls}"` : ''} width="${size}" height="${size}" viewBox="0 0 ${box} ${box}" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;

export const ICONS = {
  prev: stroke(18, 18, '<path d="M11 3.5 5.5 9l5.5 5.5"/>'),
  next: stroke(18, 18, '<path d="M7 3.5 12.5 9 7 14.5"/>'),
  close: stroke(16, 16, '<path d="M3.5 3.5l9 9M12.5 3.5l-9 9"/>'),
  back: stroke(16, 18, '<path d="M11 3.5 5.5 9l5.5 5.5"/>'),
  go: stroke(18, 18, '<path d="M7 3.5 12.5 9 7 14.5"/>', 'cal-ev__go'),
  check: stroke(14, 16, '<path d="M3 8.5l3.2 3.2L13 4.8"/>', 'cal-check'),
  arrow: stroke(14, 16, '<path d="M2.5 8h10M8.5 3.5 13 8l-4.5 4.5"/>', 'cal-more__arrow'),
};

/** A link that leads on, with an arrow after its words. The arrow is a hidden picture, so it is never read as part of the link's name. */
const moreLink = (href: string, words: string) => `<a class="cal-more" href="${esc(href)}">${words}${ICONS.arrow}</a>`;

// ---------- The month grid ----------

/** The weekday names over the grid. Narrow screens show three letters and wide ones the whole name; screen readers always get the whole name. */
export function weekdayRowHtml(): string {
  const cells = WEEKDAY_NAMES.map(
    (name) =>
      `<span class="cal-dow__cell" role="columnheader" aria-label="${name}"><span class="cal-dow__full" aria-hidden="true">${name}</span><span class="cal-dow__short" aria-hidden="true">${name.slice(0, 3)}</span></span>`,
  ).join('');
  return `<div class="cal-dow" role="row">${cells}</div>`;
}

/** How many mini-Cubes a day shows before the rest become "+2", and how many event lines before "+1 more". */
export const MAX_MARKS = 4;
export const MAX_LINES = 2;

/** The mini-Cubes for a day's events: at most four, then how many more. */
function marksHtml(events: readonly EventSummary[], plusClass: string): string {
  const cubes = events.slice(0, MAX_MARKS).map((e) => isoCube(e.kind, isOff(e))).join('');
  return events.length > MAX_MARKS ? `${cubes}<span class="${plusClass}">+${events.length - MAX_MARKS}</span>` : cubes;
}

function dayButtonHtml(date: string, events: readonly EventSummary[] | null, opts: GridOptions): string {
  const list = events ?? [];
  const isToday = date === opts.today;
  const marks = list.length ? `<span class="cal-day__marks" data-n="${Math.min(list.length, MAX_MARKS + 1)}">${marksHtml(list, 'cal-day__plus')}</span>` : '';
  const lines = list
    .slice(0, MAX_LINES)
    .map((e) => `<span class="cal-day__line cal-k-${kindKey(e.kind)}${isOff(e) ? ' is-off' : ''}"><b>${esc(shortTime(e.startTime))}</b>${esc(e.title)}</span>`)
    .join('');
  const more = list.length > MAX_LINES ? `<span class="cal-day__more">+${list.length - MAX_LINES} more</span>` : '';
  return `<button type="button" class="cal-day${isToday ? ' is-today' : ''}${date < opts.today ? ' is-past' : ''}" data-date="${date}" tabindex="${date === opts.tabStop ? '0' : '-1'}"${isToday ? ' aria-current="date"' : ''} aria-label="${esc(dayLabel(date, events, opts.today))}"><span class="cal-day__in"><span class="cal-day__top"><span class="cal-day__num">${Number(date.slice(8))}</span>${isToday ? '<span class="cal-day__today">Today</span>' : ''}${marks}</span>${lines ? `<span class="cal-day__lines">${lines}${more}</span>` : ''}</span></button>`;
}

export type GridOptions = {
  /** Today's date, YYYY-MM-DD. */
  today: string;
  /** The day that takes the tab stop. See tabStopFor. */
  tabStop: string | null;
};

/**
 * The month as a grid, Sunday first. Each day of the month is a button; the
 * days that fill the first and last weeks from the months on either side are
 * dimmed and say nothing. With `events` null the month is still loading: the
 * days draw without events and the grid says it is busy.
 */
export function monthGridHtml(month: string, events: readonly EventSummary[] | null, opts: GridOptions): string {
  const days = events ? groupByDate(events) : null;
  const weeks = monthGrid(month)
    .map((week) => {
      const cells = week
        .map((day) =>
          day.inMonth
            ? `<div class="cal-cell" role="gridcell">${dayButtonHtml(day.date, days ? (days.get(day.date) ?? []) : null, opts)}</div>`
            : `<div class="cal-cell" role="gridcell"><span class="cal-day cal-day--out" aria-hidden="true"><span class="cal-day__in"><span class="cal-day__top"><span class="cal-day__num">${Number(day.date.slice(8))}</span></span></span></span></div>`,
        )
        .join('');
      return `<div class="cal-week" role="row">${cells}</div>`;
    })
    .join('');
  return `<div class="cal-grid" role="grid" aria-labelledby="cal-month-name"${events ? '' : ' aria-busy="true"'}>${weekdayRowHtml()}${weeks}</div>`;
}

/** The five kinds with their mini-Cubes, in words. */
export function legendHtml(): string {
  return `<ul class="cal-legend" aria-label="Event kinds">${EVENT_KINDS.map((k) => `<li>${isoCube(k.key)}${k.label}</li>`).join('')}</ul>`;
}

/** True when a month has nothing on it, cancelled events included. Filler days from the months on either side do not count. */
export const monthIsEmpty = (month: string, events: readonly EventSummary[]) => !events.some((e) => monthOf(e.date) === month);

// ---------- Lines under and over the grid ----------

/** The line under the grid: loading, an empty month, or nothing to say. */
export function monthStatusHtml(state: 'loading' | 'empty' | 'ok', suggestUrl: string): string {
  if (state === 'loading') return '<span class="visually-hidden">Loading events.</span>';
  if (state === 'empty') return `Nothing on the calendar this month yet. ${moreLink(suggestUrl, 'Suggest one')}`;
  return '';
}

/** What shows in place of the grid when the events could not be loaded. Never an empty month that looks like "no events". */
export function monthProblemHtml(): string {
  return '<div class="cal-problem" role="alert"><p class="cal-problem__title">We could not load the events.</p><p>Please check your connection and try again.</p><button class="button button--ghost" type="button" data-cal="retry">Try again</button></div>';
}

export const NOT_FOUND_LINE = 'We could not find that event. It may have been removed.';

// ---------- Event rows: the day list and "Coming up" ----------

export type RowOptions = {
  /** The date leads the row ("Coming up"). The day list leaves it out: its heading says the day. */
  withDate?: boolean;
  /** Today's date, so "Coming up" can say Today and Tomorrow. */
  today?: string;
  /** The visitor said they are going. */
  mine?: boolean;
  /** The true 3D mini-Cube (the day list) or the flat one ("Coming up"). */
  cube: '3d' | 'flat';
};

function rowDate(date: string, today: string | undefined): string {
  if (today && date === today) return 'Today';
  if (today && isIsoDate(today) && date === addDays(today, 1)) return 'Tomorrow';
  return dateWords(date, 'short');
}

/**
 * One event as a button row: mini-Cube, time, title, kind, place, how many are
 * going. The data-cube marks tell calendar-cube.ts which parts drop in and
 * which fade when a day opens.
 */
export function eventRowHtml(e: EventSummary, opts: RowOptions): string {
  const off = isOff(e);
  const tags = [
    `<span class="cal-tag">${esc(kindLabel(e.kind))}</span>`,
    e.isSample ? '<span class="cal-tag cal-tag--sample">Sample</span>' : '',
    off ? '<span class="cal-tag cal-tag--off">Cancelled</span>' : '',
  ].join('');
  const cube =
    opts.cube === '3d'
      ? `<span class="cal-ev__cube"><i class="cal-mcs" data-cube="shadow"></i><span class="cal-ev__lift" data-cube="lift">${miniCube(e.kind)}</span></span>`
      : `<span class="cal-ev__cube cal-ev__cube--flat">${isoCube(e.kind, off)}</span>`;
  const when = `${opts.withDate ? `<span class="cal-ev__date">${esc(rowDate(e.date, opts.today))}</span>` : ''}<span class="cal-ev__time">${esc(timeRange(e))}</span>`;
  const going = esc(goingWords(e.going));
  return `<button type="button" class="cal-ev cal-k-${kindKey(e.kind)}${off ? ' is-off' : ''}" data-id="${num(e.id)}" data-cube="row" aria-label="${esc(eventLabel(e, opts))}"><i class="cal-ev__frame" data-cube="fade"></i>${cube}<span class="cal-ev__text" data-cube="fade"><span class="cal-ev__when">${when}</span><span class="cal-ev__title">${esc(e.title)}</span>${e.locationName ? `<span class="cal-ev__place">${esc(e.locationName)}</span>` : ''}<span class="cal-ev__facts"><span class="cal-ev__tags">${tags}</span>${going ? `<span class="cal-ev__count">${going}</span>` : ''}${opts.mine ? `<span class="cal-ev__mine">${ICONS.check}You are going</span>` : ''}</span></span>${going ? `<span class="cal-ev__going" data-cube="fade">${going}</span>` : ''}<span class="cal-ev__chev" data-cube="fade">${ICONS.go}</span></button>`;
}

// ---------- The day card ----------

/** A day's events, or where their request stands. */
export type DayState = readonly EventSummary[] | 'loading' | 'error';

export type DayOptions = {
  today: string;
  /** CAL_SUGGEST. */
  suggestUrl: string;
  /** Ids of the events the visitor said they are going to. */
  going: ReadonlySet<number>;
};

const EMPTY_CUBE = `<svg class="cal-empty__cube" viewBox="0 0 14 15" aria-hidden="true" focusable="false">${ISO_FACES}</svg>`;

/** The link to the suggest form. From today on it carries the day, so the form opens on that date. */
function suggestLink(date: string, opts: DayOptions): string {
  return date < opts.today ? moreLink(opts.suggestUrl, 'Suggest an event') : moreLink(`${opts.suggestUrl}?date=${date}`, 'Suggest an event for this day');
}

/**
 * The day card inside the dialog: the date as its heading, a close button, and
 * the day's events as rows. An empty day says so and offers the suggest form.
 */
export function dayCardHtml(date: string, state: DayState, opts: DayOptions): string {
  const events = typeof state === 'string' ? null : [...state].filter((e) => e.date === date).sort(inOrder);
  const count = events ? (events.length ? plural(events.length, 'event') : date < opts.today ? 'Past day' : 'Open day') : state === 'loading' ? 'Loading' : 'Could not load';
  const head = `<header class="cal-lhead" data-cube="head"><div><p class="cal-lhead__count">${count}</p><h2 class="cal-lhead__title" id="cal-day-title" tabindex="-1">${esc(dateWords(date))}</h2></div><button type="button" class="cal-iconbtn" data-cal="close" aria-label="Close">${ICONS.close}</button></header>`;
  if (!events) {
    const body =
      state === 'loading'
        ? '<p class="cal-empty__line" role="status">Loading events.</p>'
        : '<p class="cal-empty__line" role="alert">We could not load this day.</p><button class="button button--ghost" type="button" data-cal="retry">Try again</button>';
    return `${head}<div class="cal-empty" data-cube="foot">${body}</div>`;
  }
  if (!events.length) {
    return `${head}<div class="cal-empty" data-cube="foot">${EMPTY_CUBE}<p class="cal-empty__line">${date < opts.today ? 'Nothing was planned.' : 'Nothing planned yet.'}</p>${suggestLink(date, opts)}</div>`;
  }
  const rows = events.map((e) => `<li>${eventRowHtml(e, { cube: '3d', mine: opts.going.has(e.id) })}</li>`).join('');
  return `${head}<ul class="cal-evs" role="list">${rows}</ul><footer class="cal-lfoot" data-cube="foot">${suggestLink(date, opts)}</footer>`;
}

/** The bar over an event card: back to the day, and close. It stays in reach while the event view scrolls. */
export function eventBarHtml(date: string): string {
  const valid = isIsoDate(date);
  const day = valid ? WEEKDAY_NAMES[weekday(date)] : '';
  const rest = valid ? formatDate(date, 'medium').slice(day.length) : '';
  return `<button type="button" class="cal-backbtn" data-cal="back">${ICONS.back}<span>Back${day ? ` to ${day}<span class="visually-hidden">${esc(rest)}</span>` : ''}</span></button><button type="button" class="cal-iconbtn" data-cal="close" aria-label="Close">${ICONS.close}</button>`;
}

/** The face of the day Cube that turns toward the visitor: weekday, date, and the day's mini-Cubes. */
export function dateFaceHtml(date: string, events: readonly EventSummary[]): string {
  const list = [...events].filter((e) => e.date === date).sort(inOrder);
  const marks = list.length ? `<span class="cal-cd__marks">${marksHtml(list, 'cal-cd__plus')}</span>` : '';
  return `<div class="cal-cd"><span class="cal-cd__dow">${WEEKDAY_NAMES[weekday(date)].slice(0, 3)}</span><span class="cal-cd__num">${Number(date.slice(8))}</span>${marks}</div>`;
}

// ---------- Coming up ----------

export type UpcomingState = readonly EventSummary[] | 'loading' | 'error';

/** The "Coming up" list: the events picked by pickUpcoming, or one warm line when there are none. */
export function upcomingHtml(state: UpcomingState, opts: DayOptions): string {
  if (state === 'loading') return '<p class="cal-up__line cal-up__line--wait" role="status">Loading events.</p>';
  if (state === 'error') return '<p class="cal-up__line" role="alert">We could not load what is coming up. <button class="cal-linkbtn" type="button" data-cal="retry-upcoming">Try again</button></p>';
  if (!state.length) return `<p class="cal-up__line">Nothing is coming up yet. Hosting a draft or a meetup? ${moreLink(opts.suggestUrl, 'Suggest an event')}</p>`;
  const rows = state.map((e) => `<li>${eventRowHtml(e, { cube: 'flat', withDate: true, today: opts.today, mine: opts.going.has(e.id) })}</li>`).join('');
  return `<ul class="cal-up__list" role="list">${rows}</ul>`;
}

// ---------- The page's frame ----------

/**
 * Everything inside the calendar root, before any events are known: the
 * samples banner, the toolbar, the place for the grid, the legend, and
 * "Coming up". The script fills the marked parts.
 */
export function shellHtml(opts: { samples: boolean; hideSamplesUrl: string }): string {
  const banner = opts.samples
    ? `<p class="cal-banner">Showing sample events. They are not real. <a href="${esc(opts.hideSamplesUrl)}" data-cal="hide-samples">Hide samples</a></p>`
    : '';
  return `${banner}<div class="cal-bar"><h2 class="cal-bar__month" id="cal-month-name" aria-live="polite" aria-atomic="true" data-cal="month-name"></h2><div class="cal-nav"><button class="cal-pillbtn" type="button" data-cal="today">Today</button><button class="cal-iconbtn" type="button" data-cal="prev" aria-label="Previous month">${ICONS.prev}</button><button class="cal-iconbtn" type="button" data-cal="next" aria-label="Next month">${ICONS.next}</button></div></div>
<p class="cal-note" role="status" data-cal="note"></p>
<section class="cal-month" aria-labelledby="cal-month-name"><div data-cal="grid"></div><p class="cal-status" role="status" data-cal="status"></p><div class="cal-foot">${legendHtml()}</div></section>
<section class="cal-up" aria-labelledby="cal-up-title"><h2 class="cal-up__title" id="cal-up-title">Coming up</h2><div data-cal="upcoming"></div></section>`;
}

/**
 * The dialog: one panel that holds two cards in the same place, the day and
 * one event. Each card has a paper background, a scrolling inside, and a shade
 * that darkens it while the cards turn. The script fills the insides.
 */
export function dialogHtml(): string {
  const card = (name: 'list' | 'detail', inner: string, hidden: boolean) =>
    `<section class="cal-card cal-card--${name}" data-card="${name}"${hidden ? ' hidden' : ''}><div class="cal-card__bg"></div><div class="cal-card__in" data-card-in>${inner}</div><i class="cal-card__shade"></i></section>`;
  return `<div class="cal-dlg__panel" role="dialog" aria-modal="true" aria-labelledby="cal-day-title" tabindex="-1">${card('list', '', false)}${card('detail', '<div class="cal-dtop" data-cal="bar"></div><div class="cal-event" data-cal="event"></div>', true)}</div>`;
}
