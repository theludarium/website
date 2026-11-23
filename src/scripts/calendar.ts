// The events calendar page: the month grid, "Coming up", and the day dialog.
// This file holds the state, talks to the server, and keeps the page address
// in step. The address is the source of truth: apply() reads it (month, day,
// event) and makes the screen match, and the visitor's own actions and the
// browser's Back button both go through it. Opening a day adds a history
// entry and opening an event from the day list adds another, so Back steps
// event card, day list, closed. Month changes replace the entry instead.
// The HTML comes from src/lib/calendar/render.ts, the motion from
// src/scripts/calendar-cube.ts, and the event card from
// src/scripts/calendar-event.ts.
// Spec: docs/calendar/SPEC.md, section 5, and docs/calendar/DAY-CUBE.md.
import { addDays, addMonths, formatMonth, gridRange, isIsoDate, monthOf, zonedToUtc } from '@/lib/calendar/dates';
import { summaryOf } from '@/lib/calendar/event-render';
import {
  NOT_FOUND_LINE, dateFaceHtml, dayCardHtml, dialogHtml, eventBarHtml, keyTarget, monthGridHtml, monthIsEmpty, monthProblemHtml, monthStatusHtml,
  pickUpcoming, readView, shellHtml, tabStopFor, upcomingHtml, viewQuery,
  type DayState, type PageView,
} from '@/lib/calendar/render';
import { attendeeStorageKey, type EventListResponse, type EventPayload, type EventSummary } from '@/lib/calendar/shared';
import { createDayCube, type CardName, type Flight } from '@/scripts/calendar-cube';
import { mountEventView, type EventView } from '@/scripts/calendar-event';

/** A month already on screen is refreshed quietly once it is this old. */
const STALE_MS = 60_000;
/** "Coming up" looks this many days ahead. */
const UPCOMING_DAYS = 90;
/** More than the six rows shown, so cancelled and finished events can be left out. */
const UPCOMING_FETCH = 60;
/** How long to wait for the browser to step back through history before closing the dialog anyway. */
const UNWIND_MS = 800;

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), summary, iframe, [tabindex]:not([tabindex="-1"])';

type MonthData = { events: EventSummary[]; from: string; to: string; at: number };
type Target = { month: string; day: string | null; event: EventSummary | null; lookup: number | null };
/** What opened the dialog, so focus can go back there. */
type Opener = { kind: 'day' } | { kind: 'upcoming'; id: number } | { kind: 'link' };
type Session = {
  day: string;
  /** The event whose card is showing, or on its way in. */
  event: number | null;
  view: EventView | null;
  /** The day square is out of the grid as a Cube, so it flies home on close while it is still on screen. */
  byCube: boolean;
  opener: Opener;
  closing: boolean;
};
/** What this page writes into a history entry: how many entries it has pushed since the visitor arrived. */
type Mark = { depth: number; dayBelow?: boolean };

const pad = (n: number) => String(n).padStart(2, '0');
/** A review switch between 0 and 1, or null. */
const fraction = (raw: string | null) => (raw === null || raw === '' || Number.isNaN(Number(raw)) ? null : Math.min(1, Math.max(0, Number(raw))));

const isSummary = (e: unknown): e is EventSummary => {
  const s = e as Partial<EventSummary> | null;
  return Boolean(s && typeof s === 'object' && typeof s.id === 'number' && typeof s.title === 'string' && isIsoDate(s.date) && typeof s.startTime === 'string' && typeof s.endTime === 'string');
};

/** How long a press after an arrival counts as the tail of a double click. */
const QUIET_MS = 500;
/** A list request with no answer by now counts as failed. */
const REQUEST_MS = 15_000;
/** How far from this year an address may ask for a month. */
const MAX_YEARS_AWAY = 10;

function start(root: HTMLElement) {
  const api = root.dataset.api ?? '/api/events';
  const cubesApi = root.dataset.cubesApi ?? '/api/cubes';
  const suggestUrl = root.dataset.suggest ?? '/cube-commonwealth/events/suggest/';
  const tz = root.dataset.tz ?? 'America/Indiana/Indianapolis';
  const siteKey = root.dataset.siteKey || null;
  const pageUrl = `${location.origin}${location.pathname}`;

  const arrived = new URLSearchParams(location.search);
  /** Sample events show only when the address asks for them. Every request and every address this page writes keeps the flag. */
  const samples = arrived.get('samples') === '1';
  /** Review switches, read once: hold the opening or the card turn at one moment, and play on a timer. */
  const review = { freeze: fraction(arrived.get('freeze')), turn: fraction(arrived.get('turn')), timer: arrived.get('clock') === 'timer' };

  const fixedToday = isIsoDate(root.dataset.today) ? root.dataset.today : null;
  /** Today for the visitor, or the date the page was told to use. */
  const today = () => {
    if (fixedToday) return fixedToday;
    const d = new Date();
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };
  const nowMs = () => (fixedToday ? Date.parse(zonedToUtc(fixedToday, '00:00', tz)) : Date.now());
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const reduced = () => motion.matches;

  // ---------- The frame ----------

  root.insertAdjacentHTML('beforeend', shellHtml({ samples, hideSamplesUrl: location.pathname }));
  root.classList.add('is-ready');
  const part = (name: string) => root.querySelector<HTMLElement>(`[data-cal="${name}"]`)!;
  const monthName = part('month-name');
  const gridBox = part('grid');
  const statusLine = part('status');
  const noteLine = part('note');
  const upcomingBox = part('upcoming');

  // The dialog and the Cube's stage live on <body>, outside the header, main, and footer, which go inert while it is open.
  const dlg = document.createElement('div');
  dlg.className = 'cal-dlg';
  dlg.innerHTML = dialogHtml();
  document.body.append(dlg);
  const inDlg = (selector: string) => dlg.querySelector<HTMLElement>(selector)!;
  const panel = inDlg('.cal-dlg__panel');
  const cards: Record<CardName, HTMLElement> = { list: inDlg('[data-card="list"]'), detail: inDlg('[data-card="detail"]') };
  const listIn = cards.list.querySelector<HTMLElement>('[data-card-in]')!;
  const detailIn = cards.detail.querySelector<HTMLElement>('[data-card-in]')!;
  const barBox = inDlg('[data-cal="bar"]');
  const eventBox = inDlg('[data-cal="event"]');
  const cube = createDayCube({ dlg, panel, list: cards.list, detail: cards.detail }, { onOpened, onClosed, onScrim: () => void (performance.now() >= quietUntil && requestClose()), reduced, timerClock: review.timer });

  // ---------- What the page knows ----------

  /** One list per month view, kept so going back to a month is instant. */
  const months = new Map<string, MonthData>();
  /** Months whose request failed with nothing to show instead. They wait for "Try again". */
  const failed = new Set<string>();
  /** When each month was last asked for, so a failing quiet refresh is not sent over and over. */
  const tried = new Map<string, number>();
  /** Every event seen so far, by id. */
  const known = new Map<number, EventSummary>();
  let listRequest: { month: string; ctrl: AbortController } | null = null;
  let upcoming: { events: EventSummary[]; at: number } | 'loading' | 'error' = 'loading';
  let upcomingCtrl: AbortController | null = null;
  let lookup: { id: number; ctrl: AbortController } | null = null;

  let shownMonth = '';
  /** The last day that had focus, which keeps the grid's one tab stop. */
  let lastFocused: string | null = null;
  /** A day to focus once its month is drawn (the keyboard crossed into another month). */
  let wantFocus: string | null = null;
  const drawn = { grid: '', status: '', upcoming: '', list: '' };
  /** Set when the grid or the day list changed while they were in flight. They are redrawn when it lands. */
  let gridDirty = false;
  let listDirty = false;

  let session: Session | null = null;
  let nextOpener: Opener | null = null;
  let fontsReady = false;
  /** True between asking the browser to step back through history and its answer. */
  let traveling = false;
  let travelTimer = 0;
  /** True when that step back is the dialog closing, so the entry it lands on must not ask for a day. */
  let closingByTravel = false;
  let inerted: HTMLElement[] = [];
  let rootPad = '';
  /** A day pressed while its month is still loading. It opens when the events arrive. */
  let waitingDay: string | null = null;
  /** An event whose link failed to load. It stays in the address and waits for "Try again". */
  let lookupFailed: number | null = null;
  /** The step back from an event card that should land on this day. */
  let backingTo: string | null = null;
  /** Until this moment a mouse or touch press in the dialog is the tail of a double click, so it is ignored. */
  let quietUntil = 0;
  const hush = () => {
    quietUntil = performance.now() + QUIET_MS;
  };

  // ---------- Requests ----------

  async function fetchList(from: string, to: string, signal: AbortSignal, limit?: number): Promise<EventSummary[] | null> {
    // A request with no answer by now counts as failed, so the loading squares never stay up for good.
    const limited = new AbortController();
    const stop = () => limited.abort();
    signal.addEventListener('abort', stop, { once: true });
    const timer = window.setTimeout(stop, REQUEST_MS);
    try {
      const q = new URLSearchParams({ from, to });
      if (samples) q.set('samples', '1');
      if (limit) q.set('limit', String(limit));
      // Checks with the server, so a count just changed by this visitor is not read back from the browser's cache.
      const res = await fetch(`${api}?${q.toString()}`, { headers: { Accept: 'application/json' }, cache: 'no-cache', signal: limited.signal });
      if (!res.ok) return null;
      const data = (await res.json()) as Partial<EventListResponse> | null;
      return data && Array.isArray(data.events) ? data.events.filter(isSummary) : null;
    } catch {
      return null;
    } finally {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', stop);
    }
  }

  /** One list request per month view. Moving on to another month drops the request for the one left behind. */
  function loadMonth(month: string) {
    if (listRequest?.month === month) return;
    listRequest?.ctrl.abort();
    const ctrl = new AbortController();
    listRequest = { month, ctrl };
    tried.set(month, Date.now());
    const { from, to } = gridRange(month);
    void fetchList(from, to, ctrl.signal).then((events) => {
      if (listRequest?.ctrl === ctrl) listRequest = null;
      if (events) {
        months.set(month, { events, from, to, at: Date.now() });
        failed.delete(month);
        for (const e of events) known.set(e.id, e);
      } else if (ctrl.signal.aborted) {
        return;
      } else if (!months.has(month)) {
        // Only a month with nothing to show becomes an error. A failed quiet refresh leaves the month as it was.
        failed.add(month);
      }
      apply();
      if (waitingDay && monthOf(waitingDay) === month) {
        const day = waitingDay;
        setWaiting(null);
        if (month === shownMonth && events) openDay(day);
      }
    });
  }

  function retryMonth(month: string) {
    failed.delete(month);
    loadMonth(month);
    drawMonth();
    drawList();
    // The two lists usually fail together, so one "Try again" asks for both.
    if (upcoming === 'error') retryUpcoming();
  }

  function retryUpcoming() {
    upcoming = 'loading';
    drawUpcoming();
    loadUpcoming();
  }

  function loadUpcoming() {
    upcomingCtrl?.abort();
    const ctrl = new AbortController();
    upcomingCtrl = ctrl;
    // Stamped as asked now, so a list that cannot be refreshed is not asked for again and again.
    if (typeof upcoming !== 'string') upcoming.at = Date.now();
    // From yesterday, because an event that began last night may still be running.
    void fetchList(addDays(today(), -1), addDays(today(), UPCOMING_DAYS), ctrl.signal, UPCOMING_FETCH).then((events) => {
      if (ctrl.signal.aborted) return;
      if (events) {
        upcoming = { events, at: Date.now() };
        for (const e of events) known.set(e.id, e);
      } else if (typeof upcoming === 'string') {
        upcoming = 'error';
      }
      drawUpcoming();
    });
  }

  /** Finds an event the page has not seen (a link straight to it), so its day and month are known. */
  async function findEvent(id: number) {
    if (lookup?.id === id) return;
    lookup?.ctrl.abort();
    const ctrl = new AbortController();
    lookup = { id, ctrl };
    let found: EventSummary | null = null;
    let gone = false;
    try {
      const res = await fetch(`${api}/${id}${samples ? '?samples=1' : ''}`, { headers: { Accept: 'application/json' }, signal: ctrl.signal });
      if (res.status === 404) gone = true;
      else if (res.ok) {
        const data = (await res.json()) as Partial<EventPayload> | null;
        if (data && data.event && Array.isArray(data.attendees)) found = summaryOf(data as EventPayload);
      }
    } catch {
      // Handled below as "could not load".
    }
    if (ctrl.signal.aborted || lookup?.ctrl !== ctrl) return;
    lookup = null;
    if (found && isSummary(found)) {
      known.set(id, found);
    } else if (gone) {
      // The address stops asking for an event that is not there, and the calendar says why in one quiet line.
      replaceClosed();
      setNote(NOT_FOUND_LINE);
    } else {
      // A failed load is not a missing event. The link stays in the address, so it can be tried again.
      lookupFailed = id;
      noteLine.innerHTML = 'We could not load that event. <button class="cal-linkbtn" type="button" data-cal="retry-event">Try again</button>';
    }
    apply();
  }

  // ---------- Going marks ----------

  /** True when this browser holds a sign-up for the event. The event view writes it; the calendar only reads. */
  function isGoing(id: number): boolean {
    try {
      const raw = localStorage.getItem(attendeeStorageKey(id));
      const stored = raw ? (JSON.parse(raw) as { id?: unknown; token?: unknown } | null) : null;
      // An id of 0 is a sign-up still on its way to the server.
      return typeof stored?.token === 'string' && stored.token !== '' && Number(stored.id) > 0;
    } catch {
      return false;
    }
  }
  const goingAmong = (events: readonly EventSummary[]) => new Set(events.filter((e) => isGoing(e.id)).map((e) => e.id));

  // ---------- Drawing ----------

  const dayButton = (date: string) => gridBox.querySelector<HTMLElement>(`button.cal-day[data-date="${date}"]`);
  const inFlight = () => cube.phase === 'opening' || cube.phase === 'closing' || cube.phase === 'frozen';

  function setNote(text: string) {
    noteLine.textContent = text;
  }

  /** Shows that a pressed day is on its way while its month loads. */
  function setWaiting(day: string | null) {
    if (waitingDay) {
      const before = dayButton(waitingDay);
      before?.classList.remove('is-waiting');
      before?.removeAttribute('aria-busy');
    }
    waitingDay = day;
    if (day) {
      const button = dayButton(day);
      button?.classList.add('is-waiting');
      button?.setAttribute('aria-busy', 'true');
    }
  }

  function gridHtml(): { grid: string; status: string } {
    const month = shownMonth;
    const data = months.get(month);
    if (!data && failed.has(month)) return { grid: monthProblemHtml(), status: '' };
    const events = data?.events ?? null;
    return {
      grid: monthGridHtml(month, events, { today: today(), tabStop: tabStopFor(month, lastFocused, today()) }),
      status: monthStatusHtml(!events ? 'loading' : monthIsEmpty(month, events) ? 'empty' : 'ok', suggestUrl),
    };
  }

  function drawMonth() {
    // While a day square is out as a Cube, the grid holds still. It catches up when the flight lands.
    if (inFlight()) {
      gridDirty = true;
      return;
    }
    gridDirty = false;
    const next = gridHtml();
    if (next.grid !== drawn.grid) {
      const active = document.activeElement instanceof HTMLElement && gridBox.contains(document.activeElement) ? document.activeElement : null;
      const date = active?.dataset.date ?? null;
      gridBox.innerHTML = next.grid;
      drawn.grid = next.grid;
      // Focus stays on the same day across a redraw, or moves to "Try again" when the grid gave way to it.
      if (active) (date ? dayButton(date) : null)?.focus({ preventScroll: true });
      if (active && !gridBox.contains(document.activeElement)) gridBox.querySelector<HTMLElement>('[data-cal="retry"], button.cal-day[tabindex="0"]')?.focus({ preventScroll: true });
      if (session?.byCube) dayButton(session.day)?.classList.add('is-out');
    }
    if (next.status !== drawn.status) {
      statusLine.innerHTML = next.status;
      drawn.status = next.status;
    }
    if (wantFocus && monthOf(wantFocus) === shownMonth) {
      const button = dayButton(wantFocus);
      wantFocus = null;
      focusDay(button);
    }
  }

  /** Focuses a day and brings it clear of the sticky header at once, so nothing is still moving if Enter follows. */
  function focusDay(button: HTMLElement | null) {
    button?.focus({ preventScroll: true });
    button?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }

  /** Moves the grid's one tab stop without redrawing it. */
  function setTabStop(date: string) {
    if (lastFocused === date) return;
    lastFocused = date;
    for (const el of gridBox.querySelectorAll<HTMLElement>('button.cal-day[tabindex="0"]')) el.tabIndex = -1;
    const button = dayButton(date);
    if (button) button.tabIndex = 0;
    // The grid on screen now matches what a redraw would write, unless a redraw is already owed.
    if (!inFlight() && !gridDirty) drawn.grid = gridHtml().grid;
  }

  function drawUpcoming() {
    const state = typeof upcoming === 'string' ? upcoming : pickUpcoming(upcoming.events, nowMs(), tz);
    const html = upcomingHtml(state, { today: today(), suggestUrl, going: typeof state === 'string' ? new Set() : goingAmong(state) });
    if (html === drawn.upcoming) return;
    const active = document.activeElement instanceof HTMLElement && upcomingBox.contains(document.activeElement) ? document.activeElement : null;
    upcomingBox.innerHTML = html;
    drawn.upcoming = html;
    if (active?.dataset.id) upcomingBox.querySelector<HTMLElement>(`[data-id="${active.dataset.id}"]`)?.focus({ preventScroll: true });
  }

  const eventsOn = (day: string) => (months.get(monthOf(day))?.events ?? []).filter((e) => e.date === day);

  function dayState(day: string): DayState {
    const month = monthOf(day);
    return months.get(month)?.events ?? (failed.has(month) ? 'error' : 'loading');
  }

  /** Draws the day card. It is kept up to date even while the event card covers it, ready for the turn back. */
  function drawList() {
    if (!session) return;
    if (inFlight()) {
      listDirty = true;
      return;
    }
    listDirty = false;
    const html = dayCardHtml(session.day, dayState(session.day), { today: today(), suggestUrl, going: goingAmong(eventsOn(session.day)) });
    if (html === drawn.list) return;
    const active = document.activeElement instanceof HTMLElement && listIn.contains(document.activeElement) ? document.activeElement : null;
    listIn.innerHTML = html;
    drawn.list = html;
    if (!active) return;
    const again = active.dataset.id ? listIn.querySelector<HTMLElement>(`.cal-ev[data-id="${active.dataset.id}"]`) : active.dataset.cal ? listIn.querySelector<HTMLElement>(`[data-cal="${active.dataset.cal}"]`) : null;
    (again ?? dayTitle()).focus({ preventScroll: true });
  }

  /** The day card's heading, where focus starts, so the arrow keys can scroll a long day. */
  const dayTitle = () => listIn.querySelector<HTMLElement>('#cal-day-title') ?? panel;

  // ---------- The page address ----------

  const mark = (): Mark => {
    const m = (history.state as { cal?: Partial<Mark> } | null)?.cal;
    return m && Number.isInteger(m.depth) && Number(m.depth) > 0 ? { depth: Number(m.depth), dayBelow: m.dayBelow === true } : { depth: 0 };
  };
  const urlFor = (view: Partial<PageView>) => `${location.pathname}${viewQuery(location.search, view)}${location.hash}`;
  /** The address of the month on screen with nothing open. The current month needs no mention. */
  const closedView = (month = shownMonth): Partial<PageView> => ({ month: month && month !== monthOf(today()) ? month : null });

  /** What the address asks for, with an event resolved to its day and month when the page knows it. */
  function target(): Target {
    const read = readView(location.search);
    // A month typed by hand far from now is treated as not there: the grid and the server work in a sane window.
    const year = Number(today().slice(0, 4));
    const near = (date: string | null) => date !== null && Math.abs(Number(date.slice(0, 4)) - year) <= MAX_YEARS_AWAY;
    const view = { ...read, month: near(read.month) ? read.month : null, day: near(read.day) ? read.day : null };
    if (view.event !== null) {
      const event = known.get(view.event);
      if (event) return { month: monthOf(event.date), day: event.date, event, lookup: null };
      return { month: view.day ? monthOf(view.day) : (view.month ?? (shownMonth || monthOf(today()))), day: null, event: null, lookup: view.event };
    }
    if (view.day) return { month: monthOf(view.day), day: view.day, event: null, lookup: null };
    return { month: view.month ?? monthOf(today()), day: null, event: null, lookup: null };
  }

  function push(view: Partial<PageView>, dayBelow = false) {
    const state = typeof history.state === 'object' && history.state !== null ? (history.state as Record<string, unknown>) : {};
    // If an entry this page pushed is still waiting to open (its events are on the way), aim that entry at the
    // new day instead of stacking another on top of it.
    if (!session && mark().depth > 0) history.replaceState(history.state, '', urlFor(view));
    else history.pushState({ ...state, cal: { depth: mark().depth + 1, dayBelow } satisfies Mark }, '', urlFor(view));
    apply();
  }

  function replace(view: Partial<PageView>) {
    history.replaceState(history.state, '', urlFor(view));
    apply();
  }

  /** Writes the address with nothing open, and drops the history mark that described an open dialog. */
  function replaceClosed(month = shownMonth) {
    const state = { ...((history.state as Record<string, unknown> | null) ?? {}) };
    delete state.cal;
    history.replaceState(state, '', urlFor(closedView(month)));
  }

  /** Steps back through the entries this page pushed. The browser answers with popstate; if it never does, `fallback` runs. */
  function travel(steps: number, fallback: () => void) {
    traveling = true;
    window.clearTimeout(travelTimer);
    travelTimer = window.setTimeout(() => {
      traveling = false;
      closingByTravel = false;
      fallback();
    }, UNWIND_MS);
    history.go(-steps);
  }

  window.addEventListener('popstate', () => {
    window.clearTimeout(travelTimer);
    traveling = false;
    if (closingByTravel) {
      closingByTravel = false;
      // The visitor arrived on a link to this day or event, so the entry under the dialog still asks for it.
      const view = readView(location.search);
      if (view.day || view.event !== null) replaceClosed();
    } else if (backingTo) {
      // The entry under the event card no longer asks for its day (it was rewritten), so point it back there.
      const view = readView(location.search);
      if (!view.day && view.event === null) history.replaceState(history.state, '', urlFor({ day: backingTo }));
    }
    backingTo = null;
    apply();
  });

  // ---------- One function makes the screen match the address ----------

  function apply() {
    const want = target();
    if (want.lookup !== null && want.lookup !== lookupFailed) void findEvent(want.lookup);
    else if (want.lookup === null && lookup) {
      // The address no longer asks for the event that was being found.
      lookup.ctrl.abort();
      lookup = null;
    }
    showMonth(want.month);
    syncDialog(want);
    // "Coming up" goes stale like a month does, and catches up the same quiet way.
    if (typeof upcoming !== 'string' && Date.now() - upcoming.at > STALE_MS) loadUpcoming();
  }

  function showMonth(month: string) {
    if (month !== shownMonth) {
      shownMonth = month;
      monthName.textContent = formatMonth(month);
    }
    const data = months.get(month);
    const asked = Math.max(data?.at ?? 0, tried.get(month) ?? 0);
    // While an event from a link is still being found, its month is not known yet, so the list waits for it:
    // one request, for the month that will show.
    if (data ? Date.now() - asked > STALE_MS : !failed.has(month) && !lookup) loadMonth(month);
    drawMonth();
  }

  function syncDialog(want: Target) {
    if (!want.day) {
      if (session && !session.closing) closeSession();
      return;
    }
    if (session?.closing) cube.settle(); // the visitor came back before the dialog had gone: finish, then open afresh
    if (!session) {
      // The first opening waits for the fonts (the panel is measured), and a day list waits for its month's events.
      const loaded = months.has(want.month);
      const holdTurn = want.event !== null && review.turn !== null && nextOpener === null && !reduced();
      if (!fontsReady || ((!want.event || holdTurn) && !loaded)) return;
      openSession(want.day, want.event, holdTurn);
      return;
    }
    const eventId = want.event?.id ?? null;
    if (session.day === want.day && session.event === eventId) {
      // Nothing to move. The day's events may have just arrived or changed, so the day card catches up.
      drawList();
      return;
    }
    cube.settle();
    if (session.day !== want.day || (eventId !== null && session.event !== null)) swapTo(want.day, want.event);
    else if (want.event) showEvent(want.event, true, null);
    else showList(true);
  }

  // ---------- The dialog ----------

  function lockPage() {
    const html = document.documentElement;
    // Lock first and pad the root by the scrollbar's width, so the page does not shift under the Cube.
    const bar = window.innerWidth - html.clientWidth;
    rootPad = html.style.paddingRight;
    html.classList.add('cal-locked');
    if (bar > 0) html.style.paddingRight = `${bar}px`;
    inerted = [...document.body.children].filter((el): el is HTMLElement => el instanceof HTMLElement && el !== dlg && el !== cube.stage && !el.inert && !/^(SCRIPT|STYLE|LINK|TEMPLATE)$/.test(el.tagName));
    for (const el of inerted) el.inert = true;
    document.addEventListener('keydown', onKey);
  }

  function unlockPage() {
    document.removeEventListener('keydown', onKey);
    for (const el of inerted) el.inert = false;
    inerted = [];
    document.documentElement.classList.remove('cal-locked');
    document.documentElement.style.paddingRight = rootPad;
  }

  /** True when any part of an element is in the window. A day square that is not cannot be flown from or to. */
  function onScreen(el: HTMLElement): boolean {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.bottom > 0 && r.top < window.innerHeight && r.right > 0 && r.left < window.innerWidth;
  }

  function flightFor(day: string): Flight | null {
    const button = dayButton(day);
    // A square half under the sticky site header would pop out over it, so it fades instead of flying.
    const header = document.querySelector('body > header, header.site-header');
    const headerBottom = header?.getBoundingClientRect().bottom ?? 0;
    if (!button || !onScreen(button) || button.getBoundingClientRect().top < headerBottom) return null;
    return { button, face: dateFaceHtml(day, eventsOn(day)) };
  }

  function mountEvent(event: EventSummary) {
    if (!session) return;
    session.view?.destroy();
    session.event = event.id;
    barBox.innerHTML = eventBarHtml(session.day);
    session.view = mountEventView(eventBox, event.id, event, { api, cubesApi, pageUrl, siteKey, suggestUrl, onChange: onEventChange });
    hush();
    detailIn.scrollTop = 0;
    panel.setAttribute('aria-labelledby', 'cev-title');
  }

  function unmountEvent(view: EventView | null) {
    view?.destroy();
    if (!session?.view) barBox.innerHTML = '';
  }

  const focusTitle = () => (eventBox.querySelector<HTMLElement>('#cev-title') ?? panel).focus({ preventScroll: true });

  function openSession(day: string, event: EventSummary | null, holdTurn: boolean) {
    const opener = nextOpener ?? { kind: 'link' };
    nextOpener = null;
    session = { day, event: null, view: null, byCube: false, opener, closing: false };
    lockPage();
    hush();
    drawn.list = '';
    drawList();
    panel.setAttribute('aria-labelledby', 'cal-day-title');
    // An event opened by its link or from "Coming up" shows its card at once, with no flight: the visitor came for the details.
    const straight = event !== null && !holdTurn;
    if (straight) mountEvent(event);
    const flight = straight || event ? null : flightFor(day);
    // The review switches hold only the first opening, and only one that came from the address itself.
    const freeze = flight && opener.kind === 'link' ? review.freeze : null;
    const turnAt = review.turn;
    review.freeze = null;
    review.turn = null;
    session.byCube = flight !== null;
    cube.open({ card: straight ? 'detail' : 'list', from: flight, freeze });
    if (straight) focusTitle();
    else dayTitle().focus({ preventScroll: true });
    if (event && holdTurn) showEvent(event, true, turnAt);
  }

  function showEvent(event: EventSummary, animate: boolean, holdAt: number | null) {
    mountEvent(event);
    cube.turn('detail', { animate, holdAt }, () => {
      detailIn.scrollTop = 0;
      focusTitle();
    });
  }

  function showList(animate: boolean) {
    if (!session) return;
    const leaving = session.view;
    const lastId = session.event;
    session.view = null;
    session.event = null;
    hush();
    drawList();
    panel.setAttribute('aria-labelledby', 'cal-day-title');
    cube.turn('list', { animate }, () => {
      unmountEvent(leaving);
      const row = lastId === null ? null : listIn.querySelector<HTMLElement>(`.cal-ev[data-id="${lastId}"]`);
      (row ?? dayTitle()).focus({ preventScroll: true });
    });
  }

  /** The address jumped to another day or another event while the dialog was open (a long step through history). No motion. */
  function swapTo(day: string, event: EventSummary | null) {
    if (!session) return;
    const leaving = session.view;
    session.view = null;
    session.event = null;
    unmountEvent(leaving);
    if (session.day !== day) {
      for (const el of gridBox.querySelectorAll('.is-out')) el.classList.remove('is-out', 'is-aloft');
      session.byCube = false;
      session.day = day;
    }
    drawn.list = '';
    drawList();
    if (event) showEvent(event, false, null);
    else {
      panel.setAttribute('aria-labelledby', 'cal-day-title');
      cube.turn('list', { animate: false }, () => dayTitle().focus({ preventScroll: true }));
    }
  }

  function closeSession() {
    if (!session) return;
    session.closing = true;
    // The panel folds up and flies home only when the day square it came from is still on screen.
    cube.close(session.byCube ? flightFor(session.day) : null);
  }

  function onOpened() {
    if (gridDirty) drawMonth();
    if (listDirty) drawList();
  }

  function onClosed() {
    const ended = session;
    session = null;
    if (!ended) return;
    ended.view?.destroy();
    barBox.innerHTML = '';
    listIn.innerHTML = '';
    drawn.list = '';
    listDirty = false;
    unlockPage();
    dlg.classList.remove('is-moved');
    for (const el of gridBox.querySelectorAll('.is-out')) el.classList.remove('is-out', 'is-aloft');
    drawMonth();
    drawUpcoming();
    // Focus goes back to where the visitor came from: the "Coming up" row, or else the day in the grid.
    const row = ended.opener.kind === 'upcoming' ? upcomingBox.querySelector<HTMLElement>(`.cal-ev[data-id="${ended.opener.id}"]`) : null;
    const home = row ?? dayButton(ended.day) ?? gridBox.querySelector<HTMLElement>('button.cal-day[tabindex="0"], [data-cal="retry"]') ?? root.querySelector<HTMLElement>('[data-cal="today"]');
    home?.focus({ preventScroll: onScreen(home) });
  }

  /** A fresh answer from the event view: the going count and the Cube may have changed. */
  function onEventChange(summary: EventSummary) {
    if (!isSummary(summary)) return;
    known.set(summary.id, summary);
    for (const data of months.values()) {
      const i = data.events.findIndex((e) => e.id === summary.id);
      const fits = summary.date >= data.from && summary.date <= data.to && (samples || !summary.isSample);
      if (i >= 0 && fits) data.events[i] = summary;
      else if (i >= 0) data.events.splice(i, 1);
      else if (fits) data.events.push(summary);
    }
    if (typeof upcoming !== 'string') {
      const i = upcoming.events.findIndex((e) => e.id === summary.id);
      if (i >= 0) upcoming.events[i] = summary;
    }
    drawMonth();
    drawUpcoming();
    drawList();
  }

  // ---------- What the visitor does ----------

  function gotoMonth(month: string, focus: string | null = null) {
    setNote('');
    setWaiting(null);
    lookupFailed = null;
    wantFocus = focus;
    replaceClosed(month);
    apply();
  }

  function openDay(date: string) {
    if (session || traveling) return;
    setNote('');
    setTabStop(date);
    // The history entry is written when the day can really open, so a change of mind leaves nothing behind.
    if (!months.has(monthOf(date))) return setWaiting(date);
    setWaiting(null);
    nextOpener = { kind: 'day' };
    push({ day: date });
  }

  function openFromUpcoming(id: number) {
    if (session || traveling || !known.has(id)) return;
    setNote('');
    nextOpener = { kind: 'upcoming', id };
    push({ event: id });
  }

  function openFromList(id: number) {
    // Only from a day list that is open and at rest: a second press during the opening or the turn does nothing.
    if (!session || session.closing || session.event !== null || traveling || cube.phase !== 'open' || !known.has(id)) return;
    push({ event: id }, true);
  }

  /** The Back button over an event card. It undoes the entry that opened the event when the day list is under it; otherwise it turns this entry into the day. */
  function backToDay() {
    if (!session || session.closing || session.event === null || traveling) return;
    const day = session.day;
    if (mark().dayBelow) {
      backingTo = day;
      travel(1, () => replace({ day }));
    }
    else replace({ day });
  }

  /** Close, Escape, and the dimmed page all end here. The entries this page pushed are unwound, so no stale entry is left behind. */
  function requestClose() {
    if (!session || session.closing || traveling) return;
    const depth = mark().depth;
    if (depth > 0) {
      closingByTravel = true;
      travel(depth, () => {
        replaceClosed();
        apply();
      });
    } else {
      replaceClosed();
      apply();
    }
  }

  const isShown = (el: HTMLElement) => (typeof el.checkVisibility === 'function' ? el.checkVisibility({ visibilityProperty: true }) : el.getClientRects().length > 0);

  function onKey(e: KeyboardEvent) {
    if (!session) return;
    // The event view closes its own open layer first and stops the key there, so this only hears Escape when nothing else took it.
    if (e.key === 'Escape' && !e.defaultPrevented && !e.isComposing) {
      e.preventDefault();
      // Focus may be on plain words outside an open picker, name form, or question. That closes first, then the dialog.
      const layerClose = eventBox.querySelector<HTMLElement>('[data-act="picker-close"], [data-act="going-cancel"], [data-act="leave-cancel"]');
      if (layerClose) layerClose.click();
      else requestClose();
      return;
    }
    if (e.key !== 'Tab') return;
    // Keep focus inside the visible card: every control in it, not only buttons and links.
    const card = cards[cube.card];
    const items = [...card.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(isShown);
    const active = document.activeElement;
    const inside = active instanceof Node && card.contains(active);
    if (!items.length) {
      e.preventDefault();
      panel.focus({ preventScroll: true });
    } else if (e.shiftKey ? active === items[0] || !inside : active === items[items.length - 1] || !inside) {
      e.preventDefault();
      items[e.shiftKey ? items.length - 1 : 0].focus();
    }
  }

  root.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('button.cal-day, .cal-ev, [data-cal]');
    if (!el || !root.contains(el)) return;
    if (el.matches('button.cal-day')) return openDay(el.dataset.date ?? '');
    if (el.matches('.cal-ev')) return openFromUpcoming(Number(el.dataset.id));
    switch (el.dataset.cal) {
      case 'prev':
        return gotoMonth(addMonths(shownMonth, -1));
      case 'next':
        return gotoMonth(addMonths(shownMonth, 1));
      case 'today':
        return gotoMonth(monthOf(today()), today());
      case 'retry':
        return retryMonth(shownMonth);
      case 'retry-upcoming':
        return retryUpcoming();
      case 'retry-event':
        lookupFailed = null;
        setNote('');
        return apply();
      case 'hide-samples': {
        // Keep the month on screen, drop the samples.
        e.preventDefault();
        const q = new URLSearchParams(viewQuery(location.search, closedView()));
        q.delete('samples');
        const text = q.toString();
        return location.assign(`${location.pathname}${text ? `?${text}` : ''}`);
      }
      default:
        return undefined;
    }
  });

  // The grid is one tab stop. Arrow keys, Home, End, Page Up, and Page Down move between days.
  root.addEventListener('keydown', (e) => {
    const day = (e.target as HTMLElement).closest<HTMLElement>('button.cal-day');
    if (!day?.dataset.date || e.altKey || e.ctrlKey || e.metaKey) return;
    const to = keyTarget(day.dataset.date, e.key);
    if (!to) return;
    e.preventDefault();
    if (monthOf(to) === shownMonth) {
      setTabStop(to);
      focusDay(dayButton(to));
    } else {
      lastFocused = to;
      gotoMonth(monthOf(to), to);
    }
  });

  root.addEventListener('focusin', (e) => {
    const day = (e.target as HTMLElement).closest<HTMLElement>('button.cal-day');
    if (day?.dataset.date) setTabStop(day.dataset.date);
  });

  // A row lights up only once the pointer has moved, not because the panel landed under a resting mouse.
  dlg.addEventListener('pointermove', () => dlg.classList.add('is-moved'), { passive: true });

  // The second press of a double click must not land on whatever just arrived under it. Keyboard presses have a
  // detail of 0 and always go through.
  dlg.addEventListener(
    'click',
    (e) => {
      if (e.detail > 0 && performance.now() < quietUntil) {
        e.stopPropagation();
        e.preventDefault();
      }
    },
    true,
  );

  dlg.addEventListener('click', (e) => {
    const el = (e.target as HTMLElement).closest<HTMLElement>('[data-cal], .cal-ev');
    if (!el || !session) return;
    if (el.dataset.cal === 'close') requestClose();
    else if (el.dataset.cal === 'back') backToDay();
    else if (el.dataset.cal === 'retry') retryMonth(monthOf(session.day));
    else if (el.classList.contains('cal-ev')) openFromList(Number(el.dataset.id));
  });

  // A tab left in the background catches up when the visitor comes back to it.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') apply();
  });

  // ---------- Start ----------

  // The review switches have been read. They never stay in the address, so what is there can always be shared.
  if (['freeze', 'turn', 'clock'].some((key) => arrived.has(key))) history.replaceState(history.state, '', urlFor(readView(location.search)));
  drawUpcoming();
  loadUpcoming();
  apply();
  // A day named in the address opens once the fonts are in, because the panel is measured before the Cube flies.
  // The short wait after is a timer, not a frame, so headless review tools start on time.
  const fonts = document.fonts?.ready ?? Promise.resolve();
  void Promise.race([fonts, new Promise((done) => window.setTimeout(done, 1500))]).then(() =>
    window.setTimeout(() => {
      fontsReady = true;
      apply();
    }, 40),
  );
}

const root = document.querySelector<HTMLElement>('[data-calendar]');
if (root) start(root);
