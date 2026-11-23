// The event view inside the calendar's day dialog: details, who is going, and
// the Cube vote. This file holds the state, talks to the server, and looks
// after focus. The HTML comes from src/lib/calendar/event-render.ts, one string
// per part of the view, and only the parts that changed are redrawn.
// Spec: docs/calendar/SPEC.md, section 7.
import {
  ACTION_MESSAGES, ATTENDEE_HEADER, NAME_STORAGE_KEY, attendeeStorageKey,
  type ActionErrorCode, type EventAction, type EventPayload, type EventSummary, type StoredAttendee,
} from '@/lib/calendar/shared';
import { eventIcs } from '@/lib/calendar/ics';
import { cleanAttendeeName } from '@/lib/calendar/validate';
import type { PublicCube } from '@/lib/cube-library';
import {
  PARTS, PICKER_PAGE, eventLink, icsFileName, moveRank, newUi, pickerCount, pickerResultsHtml, sameRanking, searchCubes, suggestLimit, summaryOf, viewParts, waitingParts,
  type ErrorSpot, type PartName, type Parts, type PickerCube,
} from '@/lib/calendar/event-render';

export type EventViewOptions = {
  /** CAL_API, for example '/api/events'. */
  api: string;
  /** The Cube Library API, '/api/cubes'. Answers { cubes: PublicCube[] }. */
  cubesApi: string;
  /** Absolute URL of the calendar page without its query string. */
  pageUrl: string;
  /** Turnstile site key. Null or empty skips the check. */
  siteKey: string | null;
  /** CAL_SUGGEST. */
  suggestUrl: string;
  /** Called whenever a fresh payload arrives, so lists can update the going count. */
  onChange?: (summary: EventSummary) => void;
};

export type EventView = { destroy(): void };

/** What the server said, and `sent`: the attendee token the request carried, if this browser had one. */
type Answer = ({ ok: true; payload: EventPayload & { token?: unknown } } | { ok: false; code: ActionErrorCode }) & { sent: string | null };

/** The part of Cloudflare Turnstile this view uses. The calendar page loads the script. */
type Turnstile = {
  render(
    el: HTMLElement,
    options: { sitekey: string; appearance: 'interaction-only'; callback: (token: string) => void; 'error-callback': () => void; 'expired-callback': () => void },
  ): string | null | undefined;
  reset(id: string): void;
  remove(id: string): void;
};
const turnstile = () => (window as unknown as { turnstile?: Turnstile }).turnstile;
/** How long to wait for the Turnstile script before sending without it. */
const TURNSTILE_LOAD_MS = 4000;
/** How long a visitor gets to finish a check that asks them to do something. */
const TURNSTILE_SOLVE_MS = 30_000;
/** A view that has been on screen this long checks for news when its tab comes back. */
const STALE_MS = 10_000;
/** While voting is open and the tab is showing, the view checks for news this often, so a table sees each other's Cubes. */
const POLL_MS = 25_000;
/** A request with no answer by now counts as failed, so the buttons never stay switched off. */
const REQUEST_MS = 15_000;
/** After an answer moves the buttons, a second tap landing on a new one is ignored for this long. */
const SETTLE_MS = 500;
/** The actions a stray second tap must never set off. */
const GUARDED = new Set(['leave-confirm', 'rank-clear', 'bring', 'unbring', 'withdraw']);
const NO_HUMAN_CHECK = 'We could not run the human check. If you use a content blocker, turn it off for this page and try again.';

// These codes mean the page was showing old news, so the view reloads before it explains.
const OUT_OF_DATE = new Set<ActionErrorCode>(['name-taken', 'not-attending', 'rsvp-closed', 'vote-closed', 'duplicate', 'limit', 'taken', 'not-yours', 'cube', 'bad']);

// Storage can be blocked (private windows, strict settings). Then the token lives in memory until the page closes.
const memory = new Map<string, string>();
const store = {
  get(key: string): string | null {
    try {
      const value = localStorage.getItem(key);
      if (value !== null) return value;
    } catch {
      // Fall through to memory.
    }
    return memory.get(key) ?? null;
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
      memory.delete(key);
    } catch {
      memory.set(key, value);
    }
  },
  remove(key: string) {
    memory.delete(key);
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing was stored.
    }
  },
};

/** The attendee this browser holds for an event, if the stored value is usable. */
function storedAttendee(eventId: number): StoredAttendee | null {
  try {
    const raw = store.get(attendeeStorageKey(eventId));
    const found = raw ? (JSON.parse(raw) as Partial<StoredAttendee> | null) : null;
    // The token travels in a request header, so it must be plain visible ASCII.
    if (!found || typeof found.token !== 'string' || !/^[\x21-\x7e]{1,200}$/.test(found.token)) return null;
    return { id: Number(found.id), name: String(found.name ?? ''), token: found.token };
  } catch {
    return null;
  }
}

/** A private token, made here so that a retry after a lost answer finds the same sign-up. 32 random bytes, base64url. */
function newAttendeeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/** Rankings changed but not saved yet, by event, so closing the dialog by accident does not lose them. */
const drafts = new Map<number, number[]>();

/** A light check that an answer has the shape the view walks, so a broken one is treated as no answer. */
const isPayload = (data: unknown): data is EventPayload => {
  const p = data as Partial<EventPayload> | null;
  return Boolean(
    p &&
      typeof p === 'object' &&
      p.event &&
      Array.isArray(p.attendees) &&
      Array.isArray(p.suggestions) &&
      p.suggestions.every((s) => s && s.cube) &&
      p.tally &&
      Array.isArray(p.tally.rounds) &&
      (!p.me || Array.isArray(p.me.ranking)),
  );
};

const sel = (act: string, id?: number | string) => `[data-act="${act}"]${id === undefined ? '' : `[data-id="${id}"]`}`;
/** Where focus goes in the Cube section when the visitor turns out not to be on the list after all. */
const INVITE = `.cev-invite ${sel('going-open')}`;

/** A selector that finds the same control again after its part is redrawn. */
function selectorOf(el: HTMLElement): string | null {
  if (el.id) return `#${CSS.escape(el.id)}`;
  if (el.dataset.act) return sel(el.dataset.act, el.dataset.id);
  if (el.dataset.focus) return `[data-focus="${el.dataset.focus}"]`;
  return null;
}

export function mountEventView(container: HTMLElement, eventId: number, preview: EventSummary | null, options: EventViewOptions): EventView {
  const root = document.createElement('div');
  root.className = 'cev';
  const slots = {} as Record<PartName, HTMLElement>;
  for (const name of PARTS) {
    const slot = document.createElement('div');
    slot.dataset.part = name;
    slots[name] = slot;
    root.append(slot);
  }
  // One polite status line for the whole view. It stays in the page, so screen readers hear every change to it.
  const live = document.createElement('p');
  live.className = 'visually-hidden';
  live.setAttribute('role', 'status');
  live.setAttribute('aria-live', 'polite');
  root.append(live);
  container.replaceChildren(root);

  const off = new AbortController();
  const { signal } = off;
  const ui = newUi();
  const drawn: Parts = { head: '', status: '', going: '', cube: '', actions: '' };
  /** The Turnstile check in the name form: its widget, the element it was drawn in, and the token it gave. */
  const human = { id: null as string | null, slot: null as HTMLElement | null, token: null as string | null, failed: false, spent: false, since: 0, timer: 0 };
  let payload: EventPayload | null = null;
  let problem: ActionErrorCode | null = null;
  let busy = false;
  /** True while a click or key press in the view is being handled: the moment the visitor expects focus to follow. */
  let acting = false;
  /** The control that was just pressed. If its action goes to the server, it shows the wait. */
  let pressed: HTMLElement | null = null;
  let held: (HTMLButtonElement | HTMLInputElement)[] = [];
  let loadedAt = 0;
  let library: PickerCube[] | null = null;
  let sayTimer = 0;
  let countTimer = 0;
  /** How many answers have been taken, so a slow reload never overwrites a newer answer. */
  let taken = 0;
  let settleUntil = 0;
  let errors = 0;
  // Sample events answer only a request that asks for them.
  const samples = new URLSearchParams(location.search).get('samples') === '1' ? '?samples=1' : '';

  // ---------- Drawing and focus ----------

  function parts(): Parts {
    try {
      return payload ? viewParts(payload, ui, options.pageUrl) : waitingParts(preview, problem ? ACTION_MESSAGES[problem] : null, problem !== 'gone');
    } catch (error) {
      // An answer the view cannot draw is treated like no answer, so the dialog never sits half drawn.
      console.error(error);
      return waitingParts(preview, ACTION_MESSAGES.unavailable);
    }
  }

  /** Says the DOM already matches the state, after a change made in place (typing, a details toggle). */
  const adopt = () => void Object.assign(drawn, parts());

  function focusFirst(selectors: string[]): boolean {
    for (const selector of selectors) {
      const el = root.querySelector<HTMLElement>(selector);
      if (!el || (el as HTMLButtonElement).disabled) continue;
      el.focus();
      if (document.activeElement === el) return true;
    }
    return false;
  }

  /**
   * Redraws the parts whose HTML changed, then keeps focus somewhere sensible:
   * the first of `focus` that is there, else the control that had it, else the
   * part it was in. When an answer arrives later, focus is never taken from
   * something outside the view (the visitor may have moved on to the close button).
   */
  function draw(focus: string[] = []) {
    const active = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const inside = active !== null && root.contains(active);
    const free = acting || inside || active === null || active === document.body || active.contains(root);
    const was = inside ? selectorOf(active) : null;
    const part = inside ? active.closest<HTMLElement>('[data-part]') : null;
    const caret = inside && active instanceof HTMLInputElement ? ([active.selectionStart, active.selectionEnd] as const) : null;

    const next = parts();
    for (const name of PARTS) {
      if (next[name] === drawn[name]) continue;
      slots[name].innerHTML = next[name];
      drawn[name] = next[name];
    }
    mountTurnstile();

    if (!free || focusFirst(focus) || !inside || active.isConnected) return;
    if (was && focusFirst([was])) {
      const again = document.activeElement;
      if (caret && again instanceof HTMLInputElement) {
        try {
          again.setSelectionRange(caret[0], caret[1]);
        } catch {
          // Not a text field.
        }
      }
      return;
    }
    // The control is gone. Stay in its part of the view, on its heading, rather than fall to the top of the page.
    part?.querySelector<HTMLElement>('h3, h4')?.focus({ preventScroll: true });
    if (!root.contains(document.activeElement)) focusFirst(['#cev-title']);
  }

  /** Redraws only the picker's results, so the search field keeps its focus and caret while the visitor types. */
  function drawResults(focus: string[] = []) {
    const box = root.querySelector<HTMLElement>('[data-results]');
    if (!box || !ui.picker || !payload) return draw(focus);
    box.innerHTML = pickerResultsHtml(ui.picker, payload.suggestions.map((s) => s.cube.id));
    adopt();
    focusFirst(focus);
  }

  /** Reads a line out to screen readers. A beat of silence first, so the same words twice in a row are still read. */
  function say(text: string) {
    live.textContent = '';
    window.clearTimeout(sayTimer);
    sayTimer = window.setTimeout(() => {
      if (signal.aborted) return;
      live.textContent = text;
      sayTimer = window.setTimeout(() => (live.textContent = ''), 8000);
    }, 60);
  }

  /** Brings the error line into view. It speaks for itself (role="alert"), so the polite line goes quiet. */
  function showAlert() {
    const alert = root.querySelector('.cev-alert');
    if (!alert) return;
    window.clearTimeout(sayTimer);
    live.textContent = '';
    alert.scrollIntoView({ block: 'nearest' });
  }

  /**
   * While a request is out, nothing else can be sent. The control that was
   * pressed shows the wait, the one with focus keeps it (so it is only marked
   * aria-disabled), and everything else is disabled.
   */
  function hold(on: boolean) {
    busy = on;
    root.setAttribute('aria-busy', String(on));
    if (on) {
      pressed?.setAttribute('data-working', '');
      held = [...root.querySelectorAll<HTMLButtonElement | HTMLInputElement>('button:not(:disabled), input:not(:disabled)')];
      for (const el of held) {
        if (el === document.activeElement) el.setAttribute('aria-disabled', 'true');
        else el.disabled = true;
      }
    } else {
      root.querySelector('[data-working]')?.removeAttribute('data-working');
      for (const el of held) {
        el.disabled = false;
        el.removeAttribute('aria-disabled');
      }
      held = [];
    }
  }

  // ---------- The server ----------

  async function request(action?: EventAction): Promise<Answer> {
    const sent = storedAttendee(eventId)?.token ?? null;
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (sent) headers[ATTENDEE_HEADER] = sent;
    if (action) headers['Content-Type'] = 'application/json';
    const limit = new AbortController();
    const stop = () => limit.abort();
    signal.addEventListener('abort', stop, { once: true });
    const timer = window.setTimeout(stop, REQUEST_MS);
    try {
      // A sign-up is sent to finish even if the dialog closes. Its token is already stored, so the next look finds it.
      const res = await fetch(`${options.api}/${eventId}${samples}`, {
        method: action ? 'POST' : 'GET',
        headers,
        body: action ? JSON.stringify(action) : undefined,
        keepalive: action?.action === 'attend',
        signal: limit.signal,
      });
      const data: unknown = await res.json().catch(() => null);
      if (res.ok && isPayload(data)) return { ok: true, payload: data, sent };
      const code = (data as { error?: unknown } | null)?.error;
      return { ok: false, code: typeof code === 'string' && Object.prototype.hasOwnProperty.call(ACTION_MESSAGES, code) ? (code as ActionErrorCode) : 'unavailable', sent };
    } catch {
      return { ok: false, code: 'unavailable', sent };
    } finally {
      window.clearTimeout(timer);
      signal.removeEventListener('abort', stop);
    }
  }

  /**
   * Forgets this browser's token for the event once the server has turned it
   * down. Only the token a request really carried is forgotten: another tab may
   * have stored a new one while the answer was on its way.
   */
  function forget(sent: string | null) {
    if (sent && storedAttendee(eventId)?.token === sent) store.remove(attendeeStorageKey(eventId));
  }

  /**
   * Takes a fresh payload as the truth and tells the calendar. `me` in it says
   * whether the token the request carried is still good.
   */
  function take(answer: Extract<Answer, { ok: true }>) {
    const next = answer.payload;
    taken += 1;
    payload = next;
    problem = null;
    loadedAt = Date.now();
    if (!next.me) forget(answer.sent);
    else {
      const known = storedAttendee(eventId);
      const token = typeof next.token === 'string' ? next.token : known?.token === answer.sent ? answer.sent : null;
      if (token && (known?.token !== token || known.id !== next.me.id || known.name !== next.me.name)) {
        store.set(attendeeStorageKey(eventId), JSON.stringify({ id: next.me.id, name: next.me.name, token } satisfies StoredAttendee));
      }
    }

    // Unsaved ranking changes survive, minus any Cube that is no longer suggested.
    const suggested = new Set(next.suggestions.map((s) => s.cube.id));
    const draft = next.me ? drafts.get(eventId)?.filter((id) => suggested.has(id)) : undefined;
    if (next.me && draft && !sameRanking(draft, next.me.ranking)) {
      drafts.set(eventId, draft);
      ui.ranking = draft;
    } else {
      drafts.delete(eventId);
      ui.ranking = next.me?.ranking ?? [];
    }

    // Anything half open that the new state no longer offers goes away.
    if (next.me ? ui.going === 'form' : ui.going === 'leaving') ui.going = 'idle';
    if (!next.me || !next.event.votingOpen || suggestLimit(next.suggestions)) ui.picker = null;

    try {
      options.onChange?.(summaryOf(next));
    } catch (error) {
      console.error(error);
    }
  }

  function gone() {
    payload = null;
    problem = 'gone';
  }

  async function load(focus: string[] = []) {
    problem = null;
    if (!payload) draw();
    const res = await request();
    if (signal.aborted) return;
    if (res.ok) take(res);
    else if (!payload) problem = res.code;
    draw(focus);
  }

  /** A quiet reload. If it fails, or an action started meanwhile, the view stays as it is. */
  async function refresh() {
    if (busy || !payload) return;
    const seen = taken;
    const res = await request();
    if (signal.aborted || busy || !res.ok || taken !== seen) return;
    take(res);
    draw();
  }

  /**
   * Sends one action. On success the view redraws from the server's answer and
   * `then` runs. On a problem it shows the message at `spot`, after catching up
   * if the page was out of date. `focus` lists where focus should land, best first.
   */
  async function send(action: EventAction | (() => Promise<EventAction | null>), spot: ErrorSpot, focus: string[], then?: (next: EventPayload) => void): Promise<void> {
    if (busy || !payload) return;
    ui.error = null;
    hold(true);
    const body = typeof action === 'function' ? await action() : action;
    if (signal.aborted) return;
    if (!body) {
      ui.error = { spot, message: NO_HUMAN_CHECK, n: ++errors };
      hold(false);
      draw(focus);
      showAlert();
      return;
    }
    const res = await request(body);
    if (signal.aborted) return;
    if (body.action === 'attend' && !res.ok && res.code !== 'unavailable') forget(res.sent); // Refused, so the new token was never used.
    if (res.ok) {
      if (body.action === 'vote') drafts.delete(eventId);
      take(res);
      then?.(res.payload);
    } else if (res.code === 'gone') {
      gone();
    } else {
      if (res.code === 'not-attending') forget(res.sent);
      if (OUT_OF_DATE.has(res.code)) {
        const fresh = await request();
        if (signal.aborted) return;
        if (fresh.ok) take(fresh);
        else if (fresh.code === 'gone') gone();
      }
      // A catch-up may show the visitor was on the list all along, and then there is nothing to report.
      if (!(res.code === 'name-taken' && payload?.me)) ui.error = { spot, message: ACTION_MESSAGES[res.code], n: ++errors };
    }
    hold(false);
    settleUntil = Date.now() + SETTLE_MS;
    draw(focus);
    showAlert();
  }

  // ---------- Going ----------

  function dropTurnstile() {
    try {
      if (human.id) turnstile()?.remove(human.id);
    } catch {
      // The widget was already gone.
    }
    Object.assign(human, { id: null, slot: null, token: null });
  }

  /** Keeps the Turnstile check in step with the name form: there while the form shows, gone when it is not. Safe to call at any time. */
  function mountTurnstile() {
    const slot = root.querySelector<HTMLElement>('[data-turnstile]');
    if (!slot || !options.siteKey) return dropTurnstile();
    const api = turnstile();
    if (!api) {
      // The script loads on its own time. Look again for a few seconds, then go on without it.
      if (!human.timer && Date.now() - human.since < TURNSTILE_LOAD_MS) {
        human.timer = window.setTimeout(() => {
          human.timer = 0;
          if (!signal.aborted) mountTurnstile();
        }, 250);
      }
      return;
    }
    try {
      if (human.slot === slot) {
        // The same widget is still showing. A token works once, so after a try that used it (or a check that failed) ask for a new one.
        if (!busy && (human.spent || human.failed) && human.id) {
          Object.assign(human, { token: null, failed: false, spent: false });
          api.reset(human.id);
        }
        return;
      }
      dropTurnstile();
      Object.assign(human, { slot, failed: false, spent: false });
      human.id =
        api.render(slot, {
          sitekey: options.siteKey,
          appearance: 'interaction-only',
          callback: (token) => (human.token = token),
          'error-callback': () => (human.failed = true),
          'expired-callback': () => (human.token = null),
        }) ?? null;
      if (!human.id) human.failed = true;
    } catch {
      human.failed = true;
    }
  }

  /** The Turnstile token for this send, or null to send without one: no site key, the script never loaded, or the check gave up. */
  function humanToken(): Promise<string | null> {
    if (!options.siteKey) return Promise.resolve(null);
    const asked = Date.now();
    return new Promise((resolve) => {
      const look = () => {
        if (signal.aborted) return resolve(null);
        mountTurnstile();
        if (human.token) {
          const token = human.token;
          Object.assign(human, { token: null, spent: true });
          return resolve(token);
        }
        const loading = !turnstile() && Date.now() - human.since < TURNSTILE_LOAD_MS;
        const solving = Boolean(turnstile()) && !human.failed && Date.now() - asked < TURNSTILE_SOLVE_MS;
        if (!loading && !solving) return resolve(null);
        window.setTimeout(look, 150);
      };
      look();
    });
  }

  function openForm() {
    if (!payload || payload.me || !payload.event.rsvpOpen) return;
    ui.going = 'form';
    ui.error = null;
    if (!ui.name) ui.name = store.get(NAME_STORAGE_KEY) ?? '';
    human.since = Date.now();
    draw(['#cev-name']);
    const input = root.querySelector<HTMLInputElement>('#cev-name');
    input?.setSelectionRange(input.value.length, input.value.length);
  }

  function attend() {
    const name = cleanAttendeeName(ui.name);
    if (!name) {
      ui.error = { spot: 'going', message: ACTION_MESSAGES.name, n: ++errors };
      draw(['#cev-name']);
      showAlert();
      return;
    }
    void send(
      async () => {
        const turnstileToken = await humanToken();
        if (options.siteKey && !turnstileToken) return null;
        if (signal.aborted) return null;
        if (!storedAttendee(eventId)) store.set(attendeeStorageKey(eventId), JSON.stringify({ id: 0, name, token: newAttendeeToken() } satisfies StoredAttendee));
        return { action: 'attend', name, ...(turnstileToken ? { turnstileToken } : {}) };
      },
      'going',
      ['[data-focus="me"]', '#cev-name'],
      (next) => {
        if (next.me) store.set(NAME_STORAGE_KEY, next.me.name);
        say('You are on the list.');
      },
    );
  }

  // ---------- Which Cube ----------

  const cubeName = (cubeId: number) => payload?.suggestions.find((s) => s.cube.id === cubeId)?.cube.name ?? library?.find((c) => c.id === cubeId)?.name ?? 'That Cube';
  const suggestionName = (suggestionId: number) => payload?.suggestions.find((s) => s.id === suggestionId)?.cube.name ?? 'That Cube';
  const unranked = () => (payload?.suggestions ?? []).map((s) => s.cube.id).filter((id) => !ui.ranking.includes(id));

  /** Changes the ranking on screen. Nothing is sent until "Save my ranking". */
  function setRanking(next: number[]) {
    ui.ranking = next;
    ui.error = null;
    if (sameRanking(next, payload?.me?.ranking ?? [])) drafts.delete(eventId);
    else drafts.set(eventId, next);
  }

  function move(cubeId: number, step: -1 | 1) {
    setRanking(moveRank(ui.ranking, cubeId, step));
    say(`${cubeName(cubeId)} is now number ${ui.ranking.indexOf(cubeId) + 1}.`);
    // At the top or the bottom its button is switched off, so focus takes the other arrow.
    draw(step < 0 ? [sel('rank-up', cubeId), sel('rank-down', cubeId)] : [sel('rank-down', cubeId), sel('rank-up', cubeId)]);
  }

  function saveRanking(ranking: number[]) {
    void send({ action: 'vote', ranking }, 'ballot', ['[data-focus="ballot-status"]', sel('rank-add'), INVITE], () => {
      // "Saved." is read when focus lands on it.
      if (!ranking.length) say('Your ranking is cleared.');
    });
  }

  async function loadLibrary() {
    try {
      const res = await fetch(options.cubesApi, { headers: { Accept: 'application/json' }, signal });
      const data = res.ok ? ((await res.json()) as { cubes?: PublicCube[] } | null) : null;
      if (!data || !Array.isArray(data.cubes)) throw new Error('No Cubes in the answer');
      library = data.cubes.flatMap((c) =>
        typeof c.id === 'number' && typeof c.name === 'string'
          ? [{ id: c.id, name: c.name, owner: String(c.owner ?? ''), style: String(c.style ?? ''), cardCount: typeof c.cardCount === 'number' ? c.cardCount : null }]
          : [],
      );
    } catch {
      library = null;
    }
    if (signal.aborted || !ui.picker) return;
    ui.picker.cubes = library ?? 'error';
    drawResults();
  }

  function sayCount() {
    window.clearTimeout(countTimer);
    countTimer = window.setTimeout(() => {
      if (signal.aborted || !ui.picker || !Array.isArray(ui.picker.cubes)) return;
      const found = searchCubes(ui.picker.cubes, ui.picker.query).length;
      say(found ? pickerCount(Math.min(ui.picker.shown, found), found) : 'No Cubes match that.');
    }, 600);
  }

  // ---------- Save and share ----------

  function downloadIcs() {
    if (!payload) return;
    const url = URL.createObjectURL(new Blob([eventIcs(payload.event, eventLink(options.pageUrl, payload.event))], { type: 'text/calendar;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = url;
    link.download = icsFileName(payload.event.title);
    link.hidden = true;
    root.append(link);
    link.click();
    link.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 30_000);
  }

  async function copyLink() {
    if (!payload) return;
    const url = eventLink(options.pageUrl, payload.event);
    ui.error = null;
    try {
      await navigator.clipboard.writeText(url);
      if (signal.aborted) return;
      Object.assign(ui, { copied: true, linkField: false });
      say('Link copied.');
      draw([sel('copy')]);
      window.setTimeout(() => {
        if (signal.aborted || !ui.copied) return;
        ui.copied = false;
        draw();
      }, 4000);
    } catch {
      if (signal.aborted) return;
      // No clipboard here (an older browser, or a page that may not use it). Show the link, selected, to copy by hand.
      Object.assign(ui, { copied: false, linkField: true });
      draw(['#cev-link']);
      root.querySelector<HTMLInputElement>('#cev-link')?.select();
      say('Copy the link from the box.');
    }
  }

  // ---------- Events ----------

  const acts: Record<string, (id: number) => void> = {
    retry: () => void load([sel('retry'), '#cev-title']),
    attend,
    'going-open': openForm,
    'going-cancel': () => {
      Object.assign(ui, { going: 'idle', error: null });
      draw([sel('going-open')]);
    },
    'leave-ask': () => {
      Object.assign(ui, { going: 'leaving', error: null });
      settleUntil = Date.now() + SETTLE_MS;
      // Focus lands on the safe answer, so a second press by habit changes nothing.
      draw([sel('leave-cancel')]);
    },
    'leave-cancel': () => {
      ui.going = 'idle';
      draw([sel('leave-ask')]);
    },
    'leave-confirm': () => void send({ action: 'leave' }, 'going', [sel('going-open')], () => say('Your name is off the list.')),
    bring: (id) => void send({ action: 'bring', suggestionId: id, bring: true }, 'cube', [sel('unbring', id), sel('bring', id), INVITE], () => say(`You said you can bring ${suggestionName(id)}.`)),
    unbring: (id) => void send({ action: 'bring', suggestionId: id, bring: false }, 'cube', [sel('bring', id), sel('unbring', id), INVITE], () => say(`You are no longer bringing ${suggestionName(id)}.`)),
    withdraw: (id) => {
      const name = suggestionName(id);
      void send({ action: 'withdraw', suggestionId: id }, 'cube', [sel('withdraw', id), sel('picker-open'), '#cev-search', INVITE], () => say(`${name} is withdrawn.`));
    },
    'picker-open': () => {
      ui.picker = { cubes: library ?? 'loading', query: '', canBring: false, shown: PICKER_PAGE };
      ui.error = null;
      draw(['#cev-search']);
      if (!library) void loadLibrary();
    },
    'picker-close': () => {
      Object.assign(ui, { picker: null, error: null });
      draw([sel('picker-open')]);
    },
    'picker-retry': () => {
      if (!ui.picker) return;
      ui.picker.cubes = 'loading';
      drawResults(['#cev-search']);
      void loadLibrary();
    },
    'picker-more': () => {
      if (!ui.picker || !Array.isArray(ui.picker.cubes)) return;
      const firstNew = searchCubes(ui.picker.cubes, ui.picker.query)[ui.picker.shown];
      ui.picker.shown += PICKER_PAGE * 2;
      drawResults([...(firstNew ? [sel('pick', firstNew.id)] : []), '#cev-search']);
    },
    pick: (id) => {
      const name = cubeName(id);
      const canBring = ui.picker?.canBring === true;
      void send({ action: 'suggest', cubeId: id, ...(canBring ? { canBring } : {}) }, 'cube', [sel('picker-open'), sel('rank-add', id), sel('pick', id), '#cev-search', INVITE], () => {
        ui.picker = null;
        say(`${name} is now a suggested Cube.`);
      });
    },
    'rank-add': (id) => {
      const before = unranked();
      setRanking([...ui.ranking, id]);
      say(`${cubeName(id)} is number ${ui.ranking.length}.`);
      // Focus moves to the next Cube waiting to be ranked, so a row of presses ranks them in turn.
      const left = unranked();
      const nextUp = left[Math.min(before.indexOf(id), left.length - 1)];
      draw([...(nextUp === undefined ? [] : [sel('rank-add', nextUp)]), sel('rank-save'), '[data-focus="ballot-status"]', sel('rank-clear')]);
    },
    'rank-up': (id) => move(id, -1),
    'rank-down': (id) => move(id, 1),
    'rank-remove': (id) => {
      const name = cubeName(id);
      setRanking(ui.ranking.filter((cubeId) => cubeId !== id));
      say(`${name} is out of your ranking.`);
      draw([sel('rank-add', id)]);
    },
    'rank-save': () => saveRanking(ui.ranking),
    'rank-clear': () => {
      // Nothing is saved on the server yet, so there is nothing to send.
      if (payload?.me?.ranking.length) return saveRanking([]);
      setRanking([]);
      say('Your ranking is cleared.');
      draw([sel('rank-add')]);
    },
    ics: downloadIcs,
    copy: () => void copyLink(),
  };

  /** Runs one action as the direct result of a click or key press on `from`. */
  function act(name: string, id = 0, from: HTMLElement | null = null) {
    if (busy || (GUARDED.has(name) && Date.now() < settleUntil)) return;
    acting = true;
    pressed = from;
    try {
      acts[name]?.(id);
    } finally {
      acting = false;
      pressed = null;
    }
  }

  root.addEventListener(
    'click',
    (e) => {
      const el = (e.target as HTMLElement).closest<HTMLElement>('[data-act]');
      if (el && root.contains(el)) act(el.dataset.act ?? '', Number(el.dataset.id), el);
    },
    { signal },
  );

  root.addEventListener(
    'submit',
    (e) => {
      e.preventDefault();
      if ((e.target as HTMLElement).dataset.form === 'attend') act('attend', 0, root.querySelector<HTMLElement>('#cev-go'));
    },
    { signal },
  );

  // Typing changes the state in place. The fields are never redrawn under the visitor's fingers.
  root.addEventListener(
    'input',
    (e) => {
      const el = e.target as HTMLInputElement;
      if (el.id === 'cev-name') {
        ui.name = el.value;
        adopt();
      } else if (el.id === 'cev-search' && ui.picker) {
        Object.assign(ui.picker, { query: el.value, shown: PICKER_PAGE });
        drawResults();
        sayCount();
      } else if (el.id === 'cev-bring' && ui.picker) {
        ui.picker.canBring = el.checked;
        adopt();
      }
    },
    { signal },
  );

  // Escape folds what is open around the focus first: the search text, then the picker, the name form, or the
  // "take me off" question. With none of those, the key passes through and the dialog closes.
  root.addEventListener(
    'keydown',
    (e) => {
      if (e.key !== 'Escape' || e.isComposing || busy) return;
      const target = e.target as HTMLElement;
      const layer = target.closest('.cev-picker, .cev-form, .cev-confirm');
      if (!layer) return;
      e.preventDefault();
      e.stopPropagation();
      if (target instanceof HTMLInputElement && target.id === 'cev-search' && target.value && ui.picker) {
        target.value = '';
        Object.assign(ui.picker, { query: '', shown: PICKER_PAGE });
        drawResults();
        sayCount();
        return;
      }
      act(layer.classList.contains('cev-picker') ? 'picker-close' : layer.classList.contains('cev-form') ? 'going-cancel' : 'leave-cancel');
    },
    { signal },
  );

  // "toggle" and image "error" do not bubble, so both listen in capture.
  root.addEventListener(
    'toggle',
    (e) => {
      const details = e.target;
      if (!(details instanceof HTMLDetailsElement) || !details.isConnected || !details.dataset.details) return;
      ui.open[details.dataset.details] = details.open;
      adopt();
    },
    { capture: true, signal },
  );
  root.addEventListener(
    'error',
    (e) => {
      // A missing Cube image leaves no gap: the Cube shows without it.
      if (!(e.target instanceof HTMLImageElement) || ui.noArt) return;
      ui.noArt = true;
      draw();
    },
    { capture: true, signal },
  );

  // The vote moves while a tab sits in the background. Catch up when the visitor comes back.
  document.addEventListener(
    'visibilitychange',
    () => {
      if (document.visibilityState === 'visible' && Date.now() - loadedAt > STALE_MS) void refresh();
    },
    { signal },
  );

  // People ranking at one table should see each other's Cubes without reloading. Never while they are typing or choosing.
  const poll = window.setInterval(() => {
    if (document.visibilityState === 'visible' && payload?.event.votingOpen && ui.going === 'idle' && !ui.picker) void refresh();
  }, POLL_MS);

  void load();

  return {
    destroy() {
      window.clearInterval(poll);
      off.abort();
      window.clearTimeout(sayTimer);
      window.clearTimeout(countTimer);
      window.clearTimeout(human.timer);
      dropTurnstile();
      container.replaceChildren();
    },
  };
}
