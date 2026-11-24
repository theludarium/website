// The events calendar admin: approve suggested events, add and edit events, see
// who is going, confirm the Cube, and clear out the sample events. The page keeps
// the whole list in memory and redraws each section from it with one innerHTML.
// Spec: docs/calendar/SPEC.md, section 8.
import { escapeHtml as e, type PublicCube } from '@/lib/cube-library';
import {
  CAL_BASE,
  CAL_CAPS,
  CAL_LIMITS,
  CAL_TZ,
  DEFAULT_VOTE_CLOSE_HOURS,
  EVENT_KINDS,
  VOTE_CLOSE_HOURS,
  kindLabel,
  type AdminCreateResponse,
  type AdminEvent,
  type AdminEventDetail,
  type AdminListResponse,
  type CubeMode,
  type EventStatus,
} from '@/lib/calendar/shared';
import { wallTime } from '@/lib/calendar/event-render';
import { addDays, formatDate, formatMonth, formatTime, formatTimeRange, isIsoDate, isTime, monthOf, todayIn, voteCloseInstant, weekday, WEEKDAY_NAMES } from '@/lib/calendar/dates';
import { eventPlace } from '@/lib/calendar/ics';
import { cleanRepeatWeeks, parseEventInput } from '@/lib/calendar/validate';

/** The preview token is kept for the tab and shared with the other Where We Play admin pages. */
const TOKEN_KEY = 'wwp-admin-token';
/** After a change redraws the list, a second click landing on the next card is ignored for this long. */
const SETTLE_MS = 600;
const SIGNED_OUT = 'You are signed out. Refresh the page to sign in again.';
/** How the Cube for an event is chosen, in the form's words. */
const MODES: [CubeMode, string][] = [
  ['vote', 'Attendees vote'],
  ['set', 'I will pick the Cube'],
  ['none', 'No Cube'],
];
/** The fields of the event form. A save compares them with the stored event, so only real changes are sent. */
const FIELDS = ['title', 'kind', 'date', 'startTime', 'endTime', 'locationName', 'locationAddress', 'description', 'cubeMode', 'cubeId', 'voteCloseHours', 'announce'] as const;

type Cube = PublicCube & { id: number };
type Field = HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;
/** What the event form holds: those fields of an event. */
type Values = Pick<AdminEvent, (typeof FIELDS)[number]>;

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
const safeHref = (url: string) => (/^https:\/\//i.test(url) ? e(url) : '#');
const option = (value: string | number, label: string, chosen: string | number | null) =>
  `<option value="${e(String(value))}"${String(value) === String(chosen ?? '') ? ' selected' : ''}>${e(label)}</option>`;
const tag = (label: string, look = '') => `<span class="cadm-tag${look ? ` cadm-tag--${look}` : ''}">${label}</span>`;

/** True while people who are going can still suggest and rank Cubes. */
const votingOpen = (ev: AdminEvent) =>
  ev.status === 'approved' && ev.cubeMode === 'vote' && ev.cubeId === null && Date.now() < Date.parse(voteCloseInstant(ev.startsAt, ev.voteCloseHours));

/** A few words on the Cube for a row in the list: the Cube itself, or how the vote stands. */
function cubeWords(ev: AdminEvent): string {
  if (ev.cubeMode === 'none') return '';
  if (ev.cubeName) return `Cube: ${ev.cubeName}`;
  if (ev.cubeMode === 'set') return 'No Cube picked';
  const votes = ev.suggestions ? `${count(ev.suggestions, 'Cube')}, ${count(ev.ballots, 'ballot')}` : 'no Cubes suggested';
  return `${votingOpen(ev) ? 'Voting' : 'Vote ended'}: ${votes}`;
}

/** The local day and time voting closes, read off the clock so it stays right across a clock change. "Sat, Nov 28 at 1:00 pm". */
function voteCloses(ev: AdminEvent): string {
  const at = wallTime(voteCloseInstant(ev.startsAt, ev.voteCloseHours), ev.tz);
  return at ? `${formatDate(at.date, 'short')} at ${formatTime(at.time)}` : '';
}

/** True when a form field holds something other than what it was drawn with. */
const changed = (el: Field) => (el instanceof HTMLSelectElement ? [...el.options].some((o) => o.selected !== o.defaultSelected) : el.value !== el.defaultValue);

/** Marks what a form holds as saved, so it no longer counts as typed. The fields keep showing what was entered. */
function settle(form: HTMLFormElement) {
  for (const el of form.querySelectorAll<Field>('input, select, textarea')) {
    if (el instanceof HTMLSelectElement) for (const o of el.options) o.defaultSelected = o.selected;
    else el.defaultValue = el.value;
  }
}

const page = document.querySelector<HTMLElement>('[data-cal-admin]');
if (page) admin(page);

function admin(root: HTMLElement) {
  const API = root.dataset.api!;
  const msg = root.querySelector<HTMLElement>('[data-msg]')!;
  const auth = root.querySelector<HTMLFormElement>('[data-auth]')!;
  const body = root.querySelector<HTMLElement>('[data-body]')!;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => body.querySelector<T>(selector);

  let events: AdminEvent[] = [];
  let cubes: Cube[] = [];
  let today = todayIn(CAL_TZ);
  /** The event whose panel is open, with its people and Cube vote once they load. */
  let openId: number | null = null;
  let detail: AdminEventDetail | null = null;
  let detailFailed = false;
  let busy = false;
  let settleUntil = 0;
  let warned = false;
  /** Folded lists the owner has opened: "past", "upcoming-samples", "past-samples". */
  const folds = new Set<string>();

  // Storage can be blocked. The token then lasts until the page reloads.
  let token = '';
  try {
    token = sessionStorage.getItem(TOKEN_KEY) ?? '';
  } catch {
    // Start without one.
  }

  let settling = 0;
  /**
   * The one message line. It floats in view while it is news. Good news then settles
   * back under the heading so it stops covering the page. A problem floats until the next message.
   */
  const say = (text: string, error = false) => {
    msg.textContent = text;
    msg.classList.toggle('is-error', error);
    msg.classList.add('is-news');
    window.clearTimeout(settling);
    if (!error) settling = window.setTimeout(() => msg.classList.remove('is-news'), 10_000);
  };
  const byId = (id: number | null) => events.find((ev) => ev.id === id);
  const cubeName = (id: number | null) =>
    detail?.suggestions.find((s) => s.cube.id === id)?.cube.name ?? cubes.find((c) => c.id === id)?.name ?? 'that Cube';

  // ---------- The server ----------

  async function send<T>(path: string, method = 'GET', data?: unknown): Promise<T> {
    const headers = new Headers();
    if (token) headers.set('X-Admin-Token', token);
    if (data !== undefined) headers.set('Content-Type', 'application/json');
    const res = await fetch(`${API}${path}`, { method, headers, body: data === undefined ? undefined : JSON.stringify(data) }).catch(() => null);
    if (!res) throw new Error('Could not reach the server. Check your connection, or refresh the page, and try again.');
    if (res.status === 401 || res.status === 403) {
      auth.hidden = false;
      throw new Error(SIGNED_OUT);
    }
    const answer = (await res.json().catch(() => null)) as (T & { error?: unknown }) | null;
    if (res.ok && answer) return answer;
    // The admin API explains a problem in a full sentence. Anything else gets a plain one.
    const error = answer?.error;
    throw new Error(typeof error === 'string' && error.includes(' ') ? error : `That did not work. The server answered ${res.status}.`);
  }

  /** The approved Cubes, by name, for the Cube pickers. The page still works without them. */
  async function loadCubes() {
    if (cubes.length) return;
    try {
      const data = (await (await fetch(root.dataset.cubesApi!)).json()) as { cubes?: PublicCube[] };
      cubes = (data.cubes ?? []).filter((c): c is Cube => typeof c.id === 'number').sort((a, b) => a.name.localeCompare(b.name, 'en', { sensitivity: 'base' }));
      // The add form is drawn once, so a library that arrives late is put into its picker here.
      const picker = $('[data-form="add"] [name="cubeId"]');
      if (picker && cubes.length) picker.innerHTML = cubeOptions(null, null);
    } catch {
      // The pickers say the library did not load. The next reload tries again.
    }
  }

  async function load() {
    const [list] = await Promise.all([send<AdminListResponse>(''), loadCubes()]);
    events = [...list.events].sort((a, b) => a.date.localeCompare(b.date) || a.startTime.localeCompare(b.startTime) || a.id - b.id);
  }

  /** Reloads the list after a change and keeps the opened event open. */
  async function refresh() {
    await load();
    const open = byId(openId);
    if (!open) openId = null;
    const wanted = Boolean(open && open.status !== 'pending');
    detail = wanted ? await send<AdminEventDetail>(`/${openId}`).catch(() => null) : null;
    detailFailed = wanted && !detail;
    draw();
  }

  /** Runs one change, reloads, and says what happened. One change at a time. */
  async function act(work: () => Promise<string>): Promise<boolean> {
    if (busy) return false;
    busy = true;
    warned = false;
    root.classList.add('is-busy');
    try {
      const said = await work();
      try {
        await refresh();
        say(said);
      } catch {
        say(`${said} The list did not reload, so refresh the page to see it.`, true);
      }
      return true;
    } catch (err) {
      // Something else may have changed the event, so show the list as it stands now.
      await refresh().catch(() => undefined);
      say(err instanceof Error ? err.message : 'That did not work. Please try again.', true);
      return false;
    } finally {
      busy = false;
      // The list has just moved, so a second click landing on the next card is ignored for a moment.
      settleUntil = Date.now() + SETTLE_MS;
      root.classList.remove('is-busy');
    }
  }

  // ---------- The event form ----------

  /**
   * The first day after `after` and after today, on that weekday, that no real
   * event matching `same` already holds. It keeps a new event off a day that has one.
   */
  function nextFree(after: string, dayOfWeek: number, same: (ev: AdminEvent) => boolean): string {
    const taken = new Set(events.filter((ev) => !ev.isSample && (ev.status === 'approved' || ev.status === 'cancelled') && same(ev)).map((ev) => ev.date));
    const from = after > today ? after : today;
    let day = addDays(from, (dayOfWeek - weekday(from) + 7) % 7 || 7);
    while (taken.has(day)) day = addDays(day, 7);
    return day;
  }

  /** A new event starts as the next Sunday draft: 1:00 pm to 4:30 pm, attendees vote, voting closes 24 hours before. */
  const blank = (): Values => ({
    title: '',
    kind: 'draft',
    date: nextFree(today, 0, (ev) => ev.kind === 'draft'),
    startTime: '13:00',
    endTime: '16:30',
    locationName: null,
    locationAddress: null,
    description: null,
    cubeMode: 'vote',
    cubeId: null,
    voteCloseHours: DEFAULT_VOTE_CLOSE_HOURS,
    announce: true,
  });

  /** The most recent real draft on the calendar, the model for the "Same as last time" button. */
  const lastDraft = () => events.filter((ev) => !ev.isSample && ev.kind === 'draft' && ev.status === 'approved').at(-1);

  /**
   * Options for a Cube picker: the approved Cubes by name. A chosen Cube that has
   * left the library keeps a line of its own, so a save cannot drop it by accident.
   */
  function cubeOptions(chosen: number | null, chosenName: string | null): string {
    const gone = chosen !== null && !cubes.some((c) => c.id === chosen) ? option(chosen, chosenName ?? 'A Cube that is no longer in the library', chosen) : '';
    return option('', cubes.length ? 'Choose a Cube' : 'The Cube Library did not load', chosen) + gone + cubes.map((c) => option(c.id, `${c.name} (${c.owner})`, chosen)).join('');
  }

  /** The fields the add form and the edit form share. */
  const fields = (v: Values, chosenCubeName: string | null) => `
    <label class="cadm-wide">Title<input name="title" value="${e(v.title)}" maxlength="${CAL_LIMITS.title}" placeholder="Sunday Cube Draft" autocomplete="off" required /></label>
    <label class="cadm-third">Kind<select name="kind">${EVENT_KINDS.map((k) => option(k.key, k.label, v.kind)).join('')}</select></label>
    <label class="cadm-third">Date<input name="date" type="date" value="${e(v.date)}" required /></label>
    <label class="cadm-third cadm-pair">Starts<input name="startTime" type="time" value="${e(v.startTime)}" required /></label>
    <label class="cadm-third cadm-pair">Ends<input name="endTime" type="time" value="${e(v.endTime)}" required /></label>
    <p class="cadm-hint cadm-full" data-words="when"></p>
    <label class="cadm-half">Place<input name="locationName" value="${e(v.locationName ?? '')}" maxlength="${CAL_LIMITS.locationName}" autocomplete="off" /></label>
    <label class="cadm-half">Address<input name="locationAddress" value="${e(v.locationAddress ?? '')}" maxlength="${CAL_LIMITS.locationAddress}" autocomplete="off" /></label>
    <label class="cadm-full">Description<textarea name="description" rows="4" maxlength="${CAL_LIMITS.description}">${e(v.description ?? '')}</textarea></label>
    <label class="cadm-half">How the Cube is chosen<select name="cubeMode">${MODES.map(([key, label]) => option(key, label, v.cubeMode)).join('')}</select></label>
    <label class="cadm-half" data-when="set">Cube<select name="cubeId">${cubeOptions(v.cubeId, chosenCubeName)}</select></label>
    <label class="cadm-half" data-when="vote">Voting closes<select name="voteCloseHours">${VOTE_CLOSE_HOURS.map((h) => option(h, h === 0 ? 'When it starts' : `${h} hours before`, v.voteCloseHours)).join('')}</select></label>
    <label class="cadm-half">Announce in Discord<select name="announce">${option('yes', 'Yes, a week before it starts', v.announce ? 'yes' : 'no')}${option('no', 'No', v.announce ? 'yes' : 'no')}</select></label>`;

  /** Shows the fields that fit the chosen Cube mode, and says the date back in plain words so a wrong day stands out. */
  function tidy(form: HTMLFormElement) {
    const f = new FormData(form);
    const [date, start, end] = ['date', 'startTime', 'endTime'].map((name) => String(f.get(name) ?? ''));
    const ok = isIsoDate(date) && isTime(start) && isTime(end);
    for (const el of form.querySelectorAll<HTMLElement>('[data-when]')) el.hidden = el.dataset.when !== f.get('cubeMode');
    const when = form.querySelector('[data-words="when"]');
    if (when) {
      when.textContent = !ok
        ? 'Pick a date, a start time, and an end time.'
        : start === end
          ? 'The end time must be different from the start time.'
          : `${formatDate(date, 'long')}, ${formatTimeRange(start, end)}${end < start ? ' the next day' : ''}.${date < today ? ' That day has passed.' : ''}`;
    }
    const weeks = cleanRepeatWeeks(Number(f.get('repeatWeeks')));
    const repeat = form.querySelector('[data-words="repeat"]');
    if (repeat) repeat.textContent = ok && weeks ? `Adds ${weeks + 1} events: every ${WEEKDAY_NAMES[weekday(date)]} through ${formatDate(addDays(date, 7 * weeks), 'long')}.` : '';
  }

  /** What the form says, shaped like the admin API's input. `stored` is the event being edited. */
  function read(form: HTMLFormElement, stored?: AdminEvent): Record<string, unknown> {
    const f = new FormData(form);
    const text = (name: string) => String(f.get(name) ?? '');
    const cubeMode = text('cubeMode');
    // A vote keeps the Cube that was confirmed for it. A new vote starts with none.
    const kept = cubeMode === 'vote' && stored?.cubeMode === 'vote' ? stored.cubeId : null;
    return {
      title: text('title'),
      kind: text('kind'),
      date: text('date'),
      startTime: text('startTime'),
      endTime: text('endTime'),
      locationName: text('locationName'),
      locationAddress: text('locationAddress'),
      description: text('description'),
      cubeMode,
      cubeId: cubeMode === 'set' ? Number(text('cubeId')) || null : kept,
      voteCloseHours: Number(text('voteCloseHours')),
      announce: text('announce') !== 'no',
    };
  }

  /**
   * Fills the add form. It is drawn apart from the other sections, so a reload
   * never wipes what is being typed. `source` is the event it was copied from.
   */
  function fillAdd(v: Values, source?: AdminEvent) {
    const form = $<HTMLFormElement>('[data-form="add"]')!;
    const weeks = Array.from({ length: CAL_CAPS.repeatWeeks + 1 }, (_, n) => option(n, n ? `For ${count(n, 'more week')}` : 'No, just this once', 0));
    form.innerHTML = `${fields(v, source?.cubeName ?? null)}
      <label class="cadm-third">Repeat weekly<select name="repeatWeeks">${weeks.join('')}</select></label>
      <p class="cadm-hint cadm-full" data-words="repeat"></p>
      <p class="cadm-actions cadm-full"><button class="button" type="submit">Add event</button></p>`;
    // A copied event keeps its own Cube mode. A blank one follows the kind until the mode is set by hand.
    form.dataset.mode = source ? 'set' : 'auto';
    tidy(form);
  }

  /** Copies an event into the add form, a week or more on, and brings the form into view. */
  function duplicate(ev: AdminEvent) {
    const date = nextFree(ev.date, weekday(ev.date), (other) => other.title === ev.title);
    fillAdd({ ...ev, date, cubeId: ev.cubeMode === 'set' ? ev.cubeId : null }, ev);
    const section = $('#cadm-add')!;
    section.scrollIntoView();
    section.querySelector('h2')!.focus({ preventScroll: true });
    say(`Copied ${ev.title} into the form for ${formatDate(date)}. Check it, then add the event.`);
  }

  function addEvent(form: HTMLFormElement) {
    const parsed = parseEventInput(read(form));
    if ('error' in parsed) return say(parsed.error, true);
    const { title, date } = parsed.value as { title: string; date: string };
    const repeatWeeks = cleanRepeatWeeks(Number(new FormData(form).get('repeatWeeks')));
    void act(async () => {
      const made = (await send<AdminCreateResponse>('', 'POST', { ...parsed.value, repeatWeeks })).ids.length;
      return made === 1
        ? `Added 1 event: ${title} on ${formatDate(date)}.`
        : `Added ${made} events: ${title}, weekly from ${formatDate(date)} to ${formatDate(addDays(date, 7 * (made - 1)), 'long')}.`;
    }).then((added) => {
      if (added) fillAdd(blank());
    });
  }

  /** Sends only what changed in an edit form. `extra` adds a status, for "Save and approve". */
  function save(form: HTMLFormElement, extra: { status?: EventStatus } = {}) {
    const ev = byId(Number(form.dataset.form!.split(':')[1]));
    if (!ev) return;
    const parsed = parseEventInput(read(form, ev));
    if ('error' in parsed) return say(parsed.error, true);
    const patch: Record<string, unknown> = { ...extra };
    for (const key of FIELDS) if (parsed.value[key] !== ev[key]) patch[key] = parsed.value[key];
    if (!Object.keys(patch).length) return say('Nothing to save. Nothing has changed.');
    void act(async () => {
      await send(`/${ev.id}`, 'PATCH', patch);
      settle(form);
      // "Save and approve" takes the event off the waiting list, so its editor closes.
      if (extra.status) openId = null;
      return extra.status === 'approved' ? `Saved and approved. ${parsed.value.title} is on the calendar for ${formatDate(parsed.value.date!)}.` : 'Saved.';
    });
  }

  function confirmCube(form: HTMLFormElement) {
    const cubeId = Number(new FormData(form).get('cubeId'));
    if (!cubeId) return say('Choose the Cube to confirm.', true);
    void act(async () => {
      await send(`/${form.dataset.form!.split(':')[1]}`, 'PATCH', { cubeId });
      settle(form);
      return `Confirmed ${cubeName(cubeId)}. Voting is closed and the event shows this Cube.`;
    });
  }

  function setStatus(ev: AdminEvent, status: 'approved' | 'cancelled' | 'rejected') {
    const said = {
      approved: ev.status === 'cancelled' ? `Restored. ${ev.title} is back on the calendar.` : `Approved. ${ev.title} is on the calendar for ${formatDate(ev.date)}.`,
      cancelled: `Cancelled. ${ev.title} stays on the calendar, marked as cancelled.`,
      rejected: `Rejected. ${ev.title} will not show on the calendar. It stays in the list below until you delete it.`,
    }[status];
    // Restoring or cancelling must not skip what is typed in the open form and leave it looking saved.
    if (status !== 'rejected' && typedValues().some(([selector]) => selector.includes(`"edit:${ev.id}"`))) {
      say('You have changes that are not saved. Save them first.', true);
      return;
    }
    void act(async () => {
      await send(`/${ev.id}`, 'PATCH', { status });
      // The editor of a waiting event closes once the event leaves the waiting list.
      if (ev.status === 'pending' && openId === ev.id) openId = null;
      return said;
    });
  }

  // ---------- Drawing ----------

  /** A button that does one thing to one event. */
  const turn = (ev: AdminEvent, action: string, label: string, look = 'button--ghost') =>
    `<button type="button" class="button ${look}" data-do="${action}" data-id="${ev.id}">${label}</button>`;

  /** A button for something that cannot be undone. A tap swaps it for "Are you sure?" with Confirm and Keep. */
  const ask = (what: string, arg: number, label: string, question: string, size = 'cadm-mini') =>
    `<button type="button" class="button button--ghost cadm-danger ${size}" data-ask="${what}" data-arg="${arg}" data-question="${e(question)}">${label}</button>`;

  const facts = (ev: AdminEvent) => `<dl class="cadm-facts">
      <div><dt>When</dt><dd>${formatDate(ev.date, 'long')}, ${formatTimeRange(ev.startTime, ev.endTime)}</dd></div>
      <div><dt>Kind</dt><dd>${kindLabel(ev.kind)}</dd></div>
      <div><dt>Place</dt><dd>${e(eventPlace(ev) || 'Not given')}</dd></div>
      <div><dt>Cube</dt><dd>${e(ev.cubeMode === 'none' ? 'No Cube' : (ev.cubeName ?? (ev.cubeMode === 'vote' ? 'Attendees vote' : 'Not picked yet')))}</dd></div>
      <div><dt>Details</dt><dd class="cadm-pre">${e(ev.description ?? 'None given')}</dd></div>
    </dl>`;

  function peopleHtml(ev: AdminEvent, readOnly: boolean): string {
    if (detail?.event.id !== ev.id) {
      return detailFailed
        ? `<p class="cadm-quiet">Who is going did not load. ${turn(ev, 'reload', 'Try again', 'button--ghost cadm-mini')}</p>`
        : '<p class="cadm-quiet">Loading who is going.</p>';
    }
    const people = detail.attendees
      .map((a) => {
        const remove = ask('attendee', a.id, `Remove<span class="visually-hidden"> ${e(a.name)}</span>`, `Are you sure? This takes ${a.name} off the list and drops their ranking.`);
        return `<li><span>${e(a.name)}</span>${remove}</li>`;
      })
      .join('');
    return `<h4>${readOnly ? 'Who signed up' : 'Who is going'} <span class="cadm-count">${detail.attendees.length}</span></h4>
      ${people ? `<ul class="cadm-people">${people}</ul>` : '<p class="cadm-quiet">Nobody yet.</p>'}`;
  }

  /** The suggested Cubes, the ranked-choice count in plain words, and the Cube picker for a vote. */
  function cubeHtml(ev: AdminEvent, readOnly: boolean): string {
    if (detail?.event.id !== ev.id) return '';
    const { suggestions, tally } = detail;
    if (ev.cubeMode === 'none' && !suggestions.length) return '';
    const open = votingOpen(ev);
    const winner = tally.winner === null ? null : cubeName(tally.winner);
    const result = winner ? `${open ? 'Leading now' : 'The vote picked'}: ${winner}.` : open ? 'No ballots yet.' : 'No votes came in.';
    const state = () => {
      if (ev.cubeMode === 'set') return ev.cubeName ? `You picked ${ev.cubeName}.` : 'No Cube is picked yet. Pick one in the details below.';
      if (ev.cubeMode === 'none') return 'This event has no Cube now. These were suggested before that.';
      if (ev.cubeId !== null) return `Confirmed: ${ev.cubeName ?? cubeName(ev.cubeId)}. Voting is closed.`;
      if (ev.status !== 'approved') return `Voting is closed because the event is ${ev.status}. ${result}`;
      return `${open ? 'Voting is open until' : 'Voting closed'} ${voteCloses(ev)}. ${result}`;
    };

    const list = suggestions
      .map((s) => {
        const about = [s.cube.owner, s.cube.style, s.cube.cardCount ? `${s.cube.cardCount} cards` : ''].filter(Boolean).join(', ');
        const remove = ask('suggestion', s.id, `Remove<span class="visually-hidden"> ${e(s.cube.name)}</span>`, `Are you sure? This takes ${s.cube.name} out of the vote.`);
        return `<li><span class="cadm-cube"><a href="${safeHref(s.cube.listUrl)}" target="_blank" rel="noopener"><strong>${e(s.cube.name)}</strong></a>
          <span class="cadm-quiet">${e(about)}. Suggested by ${e(s.suggestedBy ?? 'someone who has left')}. ${s.bringer ? `${e(s.bringer)} can bring it.` : 'Nobody has offered to bring it.'}</span></span>${readOnly ? '' : remove}</li>`;
      })
      .join('');
    const rounds = tally.rounds
      .map((r, i) => {
        const votes = r.counts.map((c) => `${cubeName(c.cubeId)} (${c.votes})`).join(', ');
        const overruled = ev.cubeId !== null && ev.cubeId !== r.counts[0].cubeId;
        const end = r.eliminated === null ? `${cubeName(r.counts[0].cubeId)} ${open ? 'leads' : overruled ? 'led the vote' : 'wins'}` : `${cubeName(r.eliminated)} is dropped`;
        return `<li>Round ${i + 1}: ${e(votes)}. ${e(end)}.</li>`;
      })
      .join('');
    const counted = suggestions.length
      ? `<div class="cadm-tally"><p class="cadm-quiet">${count(tally.ballots, 'ballot')}, counted by ranked choice.</p>
         ${rounds ? `<ul class="cadm-rounds">${rounds}</ul>` : ''}
         ${tally.tied ? '<p class="cadm-quiet">A tie was broken by first choices, then by which Cube was suggested first.</p>' : ''}</div>`
      : '';

    let picker = '';
    if (!readOnly && ev.cubeMode === 'vote' && ev.cubeId !== null) {
      picker = `<p class="cadm-actions">${turn(ev, 'reopen', 'Reopen voting')}</p>`;
    } else if (!readOnly && ev.cubeMode === 'vote') {
      const suggested = suggestions.map((s) => s.cube);
      const others = cubes.filter((c) => !suggested.some((s) => s.id === c.id));
      const lead = open ? 'leading' : 'the vote picked it';
      picker = `<form class="cadm-confirm" data-form="confirm:${ev.id}">
          <label>Confirm the Cube<select name="cubeId">${option('', 'Choose a Cube', tally.winner)}
            ${suggested.length ? `<optgroup label="Suggested for this event">${suggested.map((c) => option(c.id, c.id === tally.winner ? `${c.name} (${lead})` : c.name, tally.winner)).join('')}</optgroup>` : ''}
            ${others.length ? `<optgroup label="The rest of the Cube Library">${others.map((c) => option(c.id, `${c.name} (${c.owner})`, null)).join('')}</optgroup>` : ''}
          </select></label>
          <button class="button cadm-solid" type="submit">Confirm the Cube</button>
          <p class="cadm-quiet">Confirming closes the vote and shows this Cube on the event.</p>
        </form>`;
    }
    return `<h4>The Cube</h4>
      <p>${e(state())}</p>
      ${list ? `<ul class="cadm-cubes">${list}</ul>` : ev.cubeMode === 'vote' ? '<p class="cadm-quiet">No Cubes are suggested yet.</p>' : ''}
      ${counted}${picker}`;
  }

  /**
   * What shows under an opened event. A past event's Cube vote is settled, but its details stay
   * editable: a mistyped date can land a live event here, and names and events can still be removed.
   */
  function panel(ev: AdminEvent, readOnly: boolean): string {
    const lists = ev.status === 'pending' ? '' : `<div data-people>${peopleHtml(ev, readOnly)}</div><div data-cube>${cubeHtml(ev, readOnly)}</div>`;
    const duplicate = turn(ev, 'duplicate', 'Duplicate');
    const posted = ev.announcedAt ? `<p class="cadm-quiet">Announced in Discord ${formatDate(todayIn(CAL_TZ, new Date(ev.announcedAt)), 'short')}.</p>` : '';
    const sender = ev.status !== 'pending' && ev.submitterName ? `<p class="cadm-quiet">Suggested by <strong>${e(ev.submitterName)}</strong>${ev.submitterEmail ? `, <a href="mailto:${encodeURIComponent(ev.submitterEmail).replace(/%40/g, '@')}">${e(ev.submitterEmail)}</a> (private)` : ''}</p>` : '';
    const saveButton = (look: string) => `<button type="submit" class="button ${look}">Save changes</button>`;
    // "Save changes" is the only submit button, so Enter in a field never approves or cancels anything.
    const buttons = {
      pending: turn(ev, 'save-approve', 'Save and approve', '') + saveButton('button--ghost') + turn(ev, 'reject', 'Reject'),
      approved: saveButton('cadm-solid') + turn(ev, 'cancel', 'Cancel event') + duplicate,
      cancelled: saveButton('cadm-solid') + turn(ev, 'approve', 'Restore event') + duplicate,
      rejected: saveButton('cadm-solid') + turn(ev, 'approve', 'Approve') + duplicate,
    }[ev.status];
    const going = ev.going ? ` ${count(ev.going, 'person', 'people')} going and their votes go with it.` : '';
    const view = ev.status === 'approved' || ev.status === 'cancelled' ? `<a href="${CAL_BASE}?event=${ev.id}${ev.isSample ? '&amp;samples=1' : ''}" target="_blank" rel="noopener">See it on the calendar</a>` : '';
    return `<div class="cadm-panel">${sender}${posted}${lists}
      <form class="cadm-form" data-form="edit:${ev.id}">
        ${ev.status === 'pending' ? '' : '<h4 class="cadm-full">Details</h4>'}
        ${fields(ev, ev.cubeName)}
        <p class="cadm-actions cadm-full">${buttons}${ask('event', ev.id, 'Delete', `Are you sure? This deletes ${ev.title} for good.${going}`, '')}${view}</p>
      </form></div>`;
  }

  function waitingCard(ev: AdminEvent): string {
    const email = ev.submitterEmail ? `<a href="mailto:${encodeURIComponent(ev.submitterEmail).replace(/%40/g, '@')}">${e(ev.submitterEmail)}</a> (private)` : 'no email given';
    const sent = Number.isNaN(Date.parse(ev.createdAt)) ? '' : ` ${formatDate(todayIn(CAL_TZ, new Date(ev.createdAt)), 'short')}`;
    const open = ev.id === openId;
    // While the editor is open its own buttons take over, so a tap on Approve can never skip what was typed.
    return `<li class="cadm-card cadm-pending">
      <p class="cadm-quiet">Sent${sent} by <strong>${e(ev.submitterName ?? 'someone')}</strong>, ${email}${ev.date < today ? ` ${tag('The date has passed', 'off')}` : ''}</p>
      <h3>${e(ev.title)}</h3>
      ${facts(ev)}
      <p class="cadm-actions">${open ? '' : turn(ev, 'approve', 'Approve', '')}
        <button type="button" class="button button--ghost" data-open="${ev.id}" aria-expanded="${open}">${open ? 'Close the editor' : 'Edit'}</button>
        ${open ? '' : turn(ev, 'reject', 'Reject')}</p>
      ${open ? panel(ev, false) : ''}
    </li>`;
  }

  function row(ev: AdminEvent, past: boolean): string {
    const open = ev.id === openId;
    const about = [kindLabel(ev.kind), `${ev.going} ${past ? 'signed up' : 'going'}`, cubeWords(ev)].filter(Boolean).join(' · ');
    const tags = [
      ev.date === today ? tag('Today', 'hot') : '',
      ev.status === 'cancelled' ? tag('Cancelled', 'off') : ev.status === 'rejected' ? tag('Rejected', 'off') : '',
      ev.isSample ? tag('Sample') : '',
    ].join(' ');
    // The spaces between the parts keep the button's spoken name from running together.
    return `<li${ev.status === 'approved' ? '' : ' class="is-off"'}>
      <button type="button" class="cadm-row" data-open="${ev.id}" aria-expanded="${open}">
        <span class="cadm-row__when"><strong>${formatDate(ev.date, 'short')}</strong> <span>${formatTimeRange(ev.startTime, ev.endTime)}</span></span>
        <span class="cadm-row__what"><strong>${e(ev.title)}</strong> <span>${e(about)}</span></span>
        <span class="cadm-row__tags">${tags}</span>
      </button>${open ? panel(ev, past) : ''}
    </li>`;
  }

  /** The button of a folded list. The rows under it are only built while it is open, which keeps every redraw quick. */
  const foldButton = (key: string, label: string) => `<button type="button" class="cadm-fold" data-fold="${key}" aria-expanded="${folds.has(key)}">${label}</button>`;

  /** Events grouped by month with a count, then the sample ones folded away so the real ones are easy to see. */
  function listing(list: AdminEvent[], key: string, past: boolean, empty: string): string {
    const months = (some: AdminEvent[]) => {
      const groups = new Map<string, string[]>();
      for (const ev of some) {
        const rows = groups.get(monthOf(ev.date)) ?? [];
        rows.push(row(ev, past));
        groups.set(monthOf(ev.date), rows);
      }
      return [...groups].map(([month, rows]) => `<h3 class="cadm-month">${formatMonth(month)} <span class="cadm-quiet">${count(rows.length, 'event')}</span></h3><ul class="cadm-list">${rows.join('')}</ul>`).join('');
    };
    const real = list.filter((ev) => !ev.isSample);
    const samples = list.filter((ev) => ev.isSample);
    const open = folds.has(`${key}-samples`);
    return `${real.length ? months(real) : `<p class="cadm-quiet">${empty}</p>`}
      ${samples.length ? `<p class="cadm-more">${foldButton(`${key}-samples`, `${open ? 'Hide' : 'Show'} the ${count(samples.length, 'sample event')}`)}</p>${open ? months(samples) : ''}` : ''}`;
  }

  /** What has been typed into the drawn forms but not saved, so a redraw can put it back. */
  const typedValues = () =>
    [...body.querySelectorAll<Field>('form[data-form]:not([data-form="add"]) :is(input, select, textarea)')]
      .filter(changed)
      .map((el) => [`form[data-form="${el.form!.dataset.form}"] [name="${el.name}"]`, el.value] as const);

  /** A selector that finds the focused button again after a redraw. */
  function focusKey(): string {
    const el = document.activeElement;
    if (!(el instanceof HTMLElement) || !body.contains(el)) return '';
    return Object.entries(el.dataset)
      .filter(([name]) => name !== 'question')
      .map(([name, value]) => `[data-${name.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)}="${CSS.escape(value ?? '')}"]`)
      .join('');
  }

  function draw() {
    today = todayIn(CAL_TZ);
    const typed = typedValues();
    const focus = focusKey();
    const hadFocus = body.contains(document.activeElement);
    const waiting = events.filter((ev) => ev.status === 'pending');
    const upcoming = events.filter((ev) => ev.status !== 'pending' && ev.date >= today);
    const past = events.filter((ev) => ev.status !== 'pending' && ev.date < today).reverse();
    const real = (list: AdminEvent[]) => list.filter((ev) => !ev.isSample).length;
    const samples = events.length - real(events);
    const jump = (id: string, label: string, n: number | null, hot = false) =>
      `<a href="#cadm-${id}">${label}${n === null ? '' : ` <span class="cadm-count${hot && n ? ' cadm-count--hot' : ''}">${n}</span>`}</a>`;

    $('[data-jump]')!.innerHTML =
      jump('waiting', 'Waiting', waiting.length, true) + jump('add', 'Add an event', null) + jump('upcoming', 'Upcoming', real(upcoming)) + jump('past', 'Past', real(past)) + jump('samples', 'Samples', samples);
    $('[data-waiting]')!.innerHTML = `<div class="cadm-head"><h2>Waiting for approval</h2></div>
      ${waiting.length ? `<ul class="cadm-cards">${waiting.map(waitingCard).join('')}</ul>` : '<p class="cadm-quiet">Nothing is waiting. Events that visitors suggest show up here.</p>'}`;
    const last = lastDraft();
    $('[data-last-draft]')!.innerHTML = last ? `<button type="button" class="button button--ghost cadm-mini" data-do="last-draft">Same as last time: ${e(last.title)}</button>` : '';
    $('[data-upcoming]')!.innerHTML = `<div class="cadm-head"><h2>Upcoming events</h2><p class="cadm-quiet">Open an event to see who is going and to confirm the Cube.</p></div>
      ${listing(upcoming, 'upcoming', false, 'Nothing is planned yet. Add an event above.')}`;
    $('[data-past]')!.innerHTML = `<h2>${foldButton('past', `Past events <span class="cadm-count">${real(past)}</span>`)}</h2>
      ${folds.has('past') ? listing(past, 'past', true, 'No past events yet.') : ''}`;
    $('[data-samples]')!.innerHTML = `<div class="cadm-head"><h2>Sample events</h2></div>
      ${
        samples
          ? `<p>There ${samples === 1 ? 'is' : 'are'} ${count(samples, 'sample event')}. Visitors never see them. They show only when the calendar address has ?samples=1.</p>
            <p class="cadm-actions"><a class="button button--ghost" href="${CAL_BASE}?samples=1" target="_blank" rel="noopener">See the calendar with samples</a>
              ${ask('samples', 0, 'Delete all sample events', `Are you sure? This deletes ${count(samples, 'sample event')} for good.`, '')}</p>`
          : `<p class="cadm-quiet">There are no sample events. <a href="${CAL_BASE}">See the calendar</a></p>`
      }`;

    for (const [selector, value] of typed) {
      const el = $<Field>(selector);
      if (el && (!(el instanceof HTMLSelectElement) || [...el.options].some((o) => o.value === value))) el.value = value;
    }
    for (const form of body.querySelectorAll<HTMLFormElement>('form[data-form]:not([data-form="add"])')) tidy(form);
    // The focused control may be gone after a redraw. Stay near it rather than fall to the top of the page.
    if (hadFocus && document.activeElement === document.body) ((focus ? $(focus) : null) ?? $(`[data-open="${openId}"]`) ?? $('[data-jump] a'))?.focus({ preventScroll: true });
  }

  // ---------- Opening an event ----------

  /** Fetches who is going and the Cube vote, then fills those two blocks in place so the form is left alone. */
  async function loadDetail(id: number) {
    detailFailed = false;
    try {
      const fresh = await send<AdminEventDetail>(`/${id}`);
      if (openId !== id) return;
      detail = fresh;
    } catch (err) {
      if (openId !== id) return;
      detailFailed = true;
      say(err instanceof Error ? err.message : 'That did not load.', true);
    }
    const ev = byId(id);
    const people = $('[data-people]');
    const cube = $('[data-cube]');
    if (!ev || !people || !cube) return;
    people.innerHTML = peopleHtml(ev, ev.date < today);
    cube.innerHTML = cubeHtml(ev, ev.date < today);
  }

  function toggle(id: number) {
    const unsaved = typedValues().some(([selector]) => selector.includes('"edit:'));
    if (unsaved && !warned) {
      warned = true;
      return say('You have changes that are not saved. Save them, or tap again to close without saving.', true);
    }
    warned = false;
    say('');
    openId = openId === id ? null : id;
    detail = null;
    detailFailed = false;
    draw();
    // A panel that closed higher up can pull the tapped row out of view.
    $(`.cadm-row[data-open="${id}"]`)?.scrollIntoView({ block: 'nearest' });
    if (openId !== null && byId(openId)?.status !== 'pending') void loadDetail(openId);
  }

  // ---------- "Are you sure?" ----------

  function question(asker: HTMLElement) {
    const words = e(asker.dataset.question!);
    asker.hidden = true;
    asker.insertAdjacentHTML(
      'afterend',
      `<span class="cadm-ask" role="group" aria-label="${words}"><span>${words}</span>
        <button type="button" class="button cadm-mini cadm-danger--sure" data-yes>Confirm</button>
        <button type="button" class="button button--ghost cadm-mini" data-no>Keep</button></span>`,
    );
    // Focus lands on the safe answer.
    asker.nextElementSibling!.querySelector<HTMLElement>('[data-no]')!.focus();
  }

  function answered(answer: HTMLElement) {
    const group = answer.closest('.cadm-ask')!;
    const asker = group.previousElementSibling as HTMLElement;
    const arg = Number(asker.dataset.arg);
    group.remove();
    asker.hidden = false;
    // Focus goes back to the button either way, so the redraw after a Confirm has a place to start from.
    asker.focus();
    if (answer.matches('[data-no]')) return;
    const event = byId(asker.dataset.ask === 'event' ? arg : openId);
    const work = {
      samples: async () => `Deleted ${count((await send<{ deleted: number }>('/samples', 'DELETE')).deleted, 'sample event')}.`,
      event: async () => {
        await send(`/${arg}`, 'DELETE');
        return `Deleted ${event?.title ?? 'the event'}.`;
      },
      attendee: async () => {
        const name = detail?.attendees.find((a) => a.id === arg)?.name ?? 'that person';
        await send(`/${event?.id}/attendees/${arg}`, 'DELETE');
        return `Removed ${name} from ${event?.title ?? 'the event'}.`;
      },
      suggestion: async () => {
        const name = detail?.suggestions.find((s) => s.id === arg)?.cube.name ?? 'that Cube';
        await send(`/${event?.id}/suggestions/${arg}`, 'DELETE');
        return `Took ${name} out of the vote.`;
      },
    }[asker.dataset.ask as 'samples' | 'event' | 'attendee' | 'suggestion'];
    void act(work);
  }

  // ---------- Buttons ----------

  const forEvent = (work: (ev: AdminEvent) => void) => (id: number) => {
    const ev = byId(id);
    if (ev) work(ev);
  };
  const actions: Record<string, (id: number) => void> = {
    retry: () => void boot(),
    reload: (id) => void loadDetail(id),
    'last-draft': () => {
      const last = lastDraft();
      if (last) duplicate(last);
    },
    duplicate: forEvent(duplicate),
    approve: forEvent((ev) => setStatus(ev, 'approved')),
    cancel: forEvent((ev) => setStatus(ev, 'cancelled')),
    reject: forEvent((ev) => setStatus(ev, 'rejected')),
    'save-approve': (id) => {
      const form = $<HTMLFormElement>(`[data-form="edit:${id}"]`);
      if (form?.reportValidity()) save(form, { status: 'approved' });
    },
    reopen: forEvent((ev) => {
      void act(async () => {
        await send(`/${ev.id}`, 'PATCH', { cubeId: null });
        return Date.now() < Date.parse(voteCloseInstant(ev.startsAt, ev.voteCloseHours)) ? 'Voting is open again.' : 'The Cube is cleared. Voting had already closed, so confirm a Cube when you are ready.';
      });
    }),
  };

  body.addEventListener('click', (event) => {
    if (busy) return;
    const hit = (selector: string) => (event.target as HTMLElement).closest<HTMLElement>(selector);
    if (Date.now() < settleUntil && hit('[data-do], [data-yes]')) return;
    const opener = hit('[data-open]');
    const folder = hit('[data-fold]');
    const asker = hit('[data-ask]');
    const answer = hit('[data-yes], [data-no]');
    const doer = hit('[data-do]');
    if (opener) toggle(Number(opener.dataset.open));
    else if (folder) {
      const key = folder.dataset.fold!;
      if (!folds.delete(key)) folds.add(key);
      draw();
    } else if (asker) question(asker);
    else if (answer) answered(answer);
    else if (doer) actions[doer.dataset.do!]?.(Number(doer.dataset.id));
  });

  // Escape answers "Are you sure?" with Keep.
  body.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') (event.target as HTMLElement).closest('.cadm-ask')?.querySelector<HTMLElement>('[data-no]')?.click();
  });

  body.addEventListener('submit', (event) => {
    event.preventDefault();
    const form = event.target as HTMLFormElement;
    const name = form.dataset.form ?? '';
    if (busy) return;
    if (name === 'add') addEvent(form);
    else if (name.startsWith('edit:')) save(form);
    else if (name.startsWith('confirm:')) confirmCube(form);
  });

  for (const type of ['input', 'change']) {
    body.addEventListener(type, (event) => {
      const el = event.target as Field;
      const form = el.form;
      if (!form?.dataset.form) return;
      if (type === 'change' && form.dataset.form === 'add') {
        // A new draft starts with a vote and anything else with no Cube, until the mode is picked by hand.
        if (el.name === 'cubeMode') form.dataset.mode = 'set';
        if (el.name === 'kind' && form.dataset.mode === 'auto') (form.elements.namedItem('cubeMode') as HTMLSelectElement).value = el.value === 'draft' ? 'vote' : 'none';
      }
      tidy(form);
    });
  }

  auth.addEventListener('submit', (event) => {
    event.preventDefault();
    token = String(new FormData(auth).get('token') ?? '').trim();
    try {
      sessionStorage.setItem(TOKEN_KEY, token);
    } catch {
      // Kept for this page only.
    }
    auth.hidden = true;
    say('');
    // A page that was already open keeps what is typed in it.
    if ($('[data-form="add"]')) {
      void act(async () => {
        await load();
        return 'You are signed in again.';
      });
    } else void boot();
  });

  // ---------- Start ----------

  async function boot() {
    body.innerHTML = '<p class="cadm-quiet">Loading the calendar.</p>';
    try {
      await load();
    } catch (err) {
      // A 401 or 403 on the first load shows the preview token form, with a word only if a token was tried.
      const signedOut = !auth.hidden;
      body.innerHTML = signedOut ? '' : '<p>The calendar did not load.</p><p><button type="button" class="button button--ghost" data-do="retry">Try again</button></p>';
      say(signedOut ? (token ? 'That token did not work. Please try again.' : '') : err instanceof Error ? err.message : '', true);
      return;
    }
    say('');
    body.innerHTML = `<nav class="cadm-jump" aria-label="Sections" data-jump></nav>
      <section class="cadm-section" id="cadm-waiting" data-waiting></section>
      <section class="cadm-section" id="cadm-add">
        <div class="cadm-head"><h2 tabindex="-1">Add an event</h2><span data-last-draft></span></div>
        <form class="cadm-card cadm-form" data-form="add"></form>
      </section>
      <section class="cadm-section" id="cadm-upcoming" data-upcoming></section>
      <section class="cadm-section" id="cadm-past" data-past></section>
      <section class="cadm-section" id="cadm-samples" data-samples></section>`;
    fillAdd(blank());
    draw();
    // The sections did not exist when the page loaded, so a link to one of them is followed now.
    if (/^#cadm-[a-z]+$/.test(location.hash)) $(location.hash)?.scrollIntoView();
  }

  void boot();
}
