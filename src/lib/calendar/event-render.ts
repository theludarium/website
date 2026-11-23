// The event view's HTML: details, who is going, and the Cube vote. Pure
// functions, strings in and strings out, so the browser and the tests build
// the same markup. src/scripts/calendar-event.ts holds the state, sends the
// requests, and calls these. Every value that came from a person or the server
// goes through escapeHtml. Spec: docs/calendar/SPEC.md, section 7.
import { CUBES_BASE, LENDING, cleanImageUrl, escapeHtml } from '../cube-library.ts';
import { addDays, formatDate, formatTime, formatTimeRange, isIsoDate, isTime } from './dates.ts';
import { eventPlace, googleCalendarUrl } from './ics.ts';
import {
  CAL_CAPS, CAL_LIMITS, kindLabel,
  type Attendee, type CubeSuggestion, type EventCube, type EventDetail, type EventPayload, type EventSummary, type Tally,
} from './shared.ts';

/** The view's parts, top to bottom. Each is drawn into its own element, so a change in one leaves the others alone. */
export const PARTS = ['head', 'status', 'going', 'cube', 'actions'] as const;
export type PartName = (typeof PARTS)[number];
export type Parts = Record<PartName, string>;

/** A Cube from the Cube Library, as the suggest picker lists it. */
export type PickerCube = { id: number; name: string; owner: string; style: string; cardCount: number | null };

export type Picker = {
  /** The Cube Library, or where its request stands. */
  cubes: PickerCube[] | 'loading' | 'error';
  query: string;
  canBring: boolean;
  /** How many results show. "Show more" raises it. */
  shown: number;
};
export const PICKER_PAGE = 6;

/** Where the one error line shows: next to what the visitor just used. */
export type ErrorSpot = 'going' | 'cube' | 'ballot' | 'actions';

/** What the view remembers that the server does not tell it. */
export type ViewUi = {
  /** Under the names: the button, the name form, or the "take me off" question. */
  going: 'idle' | 'form' | 'leaving';
  /** What is typed in the name field. */
  name: string;
  /** The suggest picker, or null while it is closed. */
  picker: Picker | null;
  /** The ranking on screen: the saved one, or the visitor's changes to it. */
  ranking: number[];
  /** Which <details> the visitor opened or closed, by key. */
  open: Record<string, boolean>;
  /** The Cube's image failed to load, so leave it out. */
  noArt: boolean;
  /** "Copy link" just worked. */
  copied: boolean;
  /** The clipboard said no, so show the link in a field to copy by hand. */
  linkField: boolean;
  /** `n` changes with each problem, so the same words twice in a row are still read out. */
  error: { spot: ErrorSpot; message: string; n?: number } | null;
};

export const newUi = (): ViewUi => ({ going: 'idle', name: '', picker: null, ranking: [], open: {}, noArt: false, copied: false, linkField: false, error: null });

/** Escapes a value for HTML. A missing value from the server prints as nothing rather than stopping the whole view. */
const esc = (value: unknown) => escapeHtml(String(value ?? ''));
const NEW_TAB = '<span class="visually-hidden"> (opens in a new tab)</span>';
/** A number from the server, made safe to print. The types say number, but the HTML should not have to trust that. */
const num = (n: number) => String(Number(n));
const count = (n: number, one: string, many: string) => `${num(n)} ${n === 1 ? one : many}`;
/** The full stop after a name, unless the name already ends with one ("Sam W."). */
const stop = (name: string) => (/[.!?]$/.test(name) ? '' : '.');

const icon = (body: string) =>
  `<svg class="cev-icon" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`;
const ICONS = {
  date: icon('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  time: icon('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  place: icon('<path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z"/><circle cx="12" cy="10" r="2.3"/>'),
  check: icon('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  up: icon('<path d="M12 19V5M6 11l6-6 6 6"/>'),
  down: icon('<path d="M12 5v14M6 13l6 6 6-6"/>'),
  remove: icon('<path d="M6.5 6.5l11 11M17.5 6.5l-11 11"/>'),
  add: icon('<path d="M12 5.5v13M5.5 12h13"/>'),
  out: icon('<path d="M8.5 15.5 16 8M9.5 8H16v6.5"/>'),
};

/** The flat mini-Cube the calendar marks events with. CSS colors it by the event's kind. */
const MINI_CUBE =
  '<svg class="cev-cubelet" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" focusable="false"><path class="cev-cubelet__top" d="M12 2.2 20.5 7.1 12 12 3.5 7.1z"/><path class="cev-cubelet__left" d="M3.5 7.1 12 12v9.8l-8.5-4.9z"/><path class="cev-cubelet__right" d="M20.5 7.1 12 12v9.8l8.5-4.9z"/></svg>';

// ---------- Words ----------

/** "5 people are going." While people can still sign up it invites the first one; afterward it looks back. */
export function goingLine(going: number, open: boolean): string {
  if (open) return going === 0 ? 'No one yet. Be the first.' : going === 1 ? '1 person is going.' : `${going} people are going.`;
  return going === 0 ? 'No one said they were going.' : going === 1 ? '1 person said they were going.' : `${going} people said they were going.`;
}

/** The date and time on the wall in a time zone at an instant, or null when the zone or the instant is unusable. */
export function wallTime(iso: string, tz: string): { date: string; time: string } | null {
  try {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: tz, hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }).formatToParts(new Date(iso));
    const get = (type: string) => parts.find((p) => p.type === type)?.value ?? '';
    const found = { date: `${get('year')}-${get('month')}-${get('day')}`, time: `${get('hour')}:${get('minute')}` };
    return isIsoDate(found.date) && isTime(found.time) ? found : null;
  } catch {
    return null;
  }
}

/**
 * "Voting closes Saturday, November 28 at 1:00 pm." in the event's own time.
 * The close is a fixed number of hours before the start, so it is read off the
 * clock in the event's time zone (this stays right across a daylight saving
 * change). If the zone is unknown, it is counted back from the start time.
 */
export function voteClosesSentence(event: Pick<EventDetail, 'date' | 'startTime' | 'startsAt' | 'voteClosesAt' | 'tz'>): string {
  if (!event.voteClosesAt) return '';
  const before = Date.parse(event.startsAt) - Date.parse(event.voteClosesAt);
  if (Number.isNaN(before)) return '';
  if (before <= 0) return 'Voting closes when the event starts.';
  let at = wallTime(event.voteClosesAt, event.tz);
  if (!at && isIsoDate(event.date) && isTime(event.startTime)) {
    const [h, m] = event.startTime.split(':').map(Number);
    const minutes = h * 60 + m - Math.round(before / 60_000);
    const days = Math.floor(minutes / 1440);
    const left = minutes - days * 1440;
    at = { date: addDays(event.date, days), time: `${String(Math.floor(left / 60)).padStart(2, '0')}:${String(left % 60).padStart(2, '0')}` };
  }
  return at ? `Voting closes ${formatDate(at.date, 'medium')} at ${formatTime(at.time)}.` : '';
}

/** Ranked choice in two sentences, for "How the count works". */
export const COUNT_RULE =
  'Every ballot counts for its highest ranked Cube that is still in the race. If no Cube has more than half, the Cube with the fewest votes is dropped and its ballots move to their next choice.';
export const TIE_RULE = 'A tie was broken by first choices, then by which Cube was suggested first.';

type Round = { counts: { name: string; votes: number }[]; end: string };

function rounds(tally: Tally, nameOf: (cubeId: number) => string, open: boolean): Round[] {
  return tally.rounds.map((round) => ({
    counts: round.counts.map((c) => ({ name: nameOf(c.cubeId), votes: c.votes })),
    end: round.eliminated !== null ? `${nameOf(round.eliminated)} is dropped.` : tally.winner !== null ? `${nameOf(tally.winner)} ${open ? 'is ahead' : 'wins'}.` : '',
  }));
}

/** One sentence per round: "Round 1: Mono Blue (3), MTGO Vintage Cube (2), Abecedarian Cube (1). Abecedarian Cube is dropped." The counts sit in brackets because a Cube's name can end in a number. */
export function roundLines(tally: Tally, nameOf: (cubeId: number) => string, open: boolean): string[] {
  return rounds(tally, nameOf, open).map((r, i) => `Round ${i + 1}: ${r.counts.map((c) => `${c.name} (${c.votes})`).join(', ')}. ${r.end}`.trim());
}

/** The address of one event on the calendar page. Sample events only show with samples=1, so their links keep it. */
export const eventLink = (pageUrl: string, event: Pick<EventSummary, 'id' | 'isSample'>) => `${pageUrl}?event=${event.id}${event.isSample ? '&samples=1' : ''}`;

/** "Sunday Cube Draft" becomes "sunday-cube-draft.ics". */
export const icsFileName = (title: string) =>
  `${title.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60).replace(/-+$/, '') || 'event'}.ics`;

export const mapsUrl = (event: Pick<EventDetail, 'locationName' | 'locationAddress'>) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(eventPlace(event))}`;

/** What the lists outside the view need to know after a change: the same event, with the going count from the list of names. */
export function summaryOf(payload: EventPayload): EventSummary {
  const e = payload.event;
  return {
    id: e.id, title: e.title, kind: e.kind, date: e.date, startTime: e.startTime, endTime: e.endTime, locationName: e.locationName,
    status: e.status, going: payload.attendees.length, cubeMode: e.cubeMode, cubeName: e.cubeName, isSample: e.isSample,
  };
}

// ---------- Ranking and the picker: small list helpers ----------

export const sameRanking = (a: number[], b: number[]) => a.length === b.length && a.every((id, i) => id === b[i]);

/** A copy of the ranking with one Cube moved up (-1) or down (1) a place. */
export function moveRank(ranking: number[], cubeId: number, step: -1 | 1): number[] {
  const from = ranking.indexOf(cubeId);
  const to = from + step;
  if (from < 0 || to < 0 || to >= ranking.length) return ranking;
  const next = [...ranking];
  [next[from], next[to]] = [next[to], next[from]];
  return next;
}

/** Why the visitor cannot suggest another Cube, or '' when they can. */
export function suggestLimit(suggestions: CubeSuggestion[]): string {
  if (suggestions.length >= CAL_CAPS.suggestionsPerEvent) return `This event has ${CAL_CAPS.suggestionsPerEvent} suggested Cubes, the most it can hold.`;
  if (suggestions.filter((s) => s.mine).length >= CAL_CAPS.suggestionsPerAttendee) return `You have suggested ${CAL_CAPS.suggestionsPerAttendee} Cubes, the most one person can add.`;
  return '';
}

/** Cubes that match every word of a search over name, owner, and style. Names that start with the search come first. */
export function searchCubes<T extends PickerCube>(cubes: T[], query: string): T[] {
  const q = query.trim().toLowerCase().replace(/\s+/g, ' ');
  if (!q) return cubes;
  const words = q.split(' ');
  const rank = (c: T) => {
    const name = c.name.toLowerCase();
    if (name.startsWith(q)) return 0;
    if (words.every((w) => name.includes(w))) return 1;
    const all = `${name} ${c.owner} ${c.style}`.toLowerCase();
    return words.every((w) => all.includes(w)) ? 2 : 3;
  };
  return cubes
    .map((c) => ({ c, r: rank(c) }))
    .filter((x) => x.r < 3)
    .sort((a, b) => a.r - b.r)
    .map((x) => x.c);
}

/** "Showing 6 of 40 Cubes." */
export function pickerCount(shown: number, found: number): string {
  return shown < found ? `Showing ${shown} of ${count(found, 'Cube', 'Cubes')}.` : `${count(found, 'Cube', 'Cubes')}.`;
}

// ---------- Head: tags, title, facts, description ----------

type HeadEvent = EventSummary & Partial<Pick<EventDetail, 'description' | 'locationAddress' | 'rsvpOpen'>>;

const fact = (svg: string, label: string, body: string) => `<div class="cev-fact"><dt>${svg}<span class="visually-hidden">${label}</span></dt><dd>${body}</dd></div>`;

function placeFact(event: HeadEvent): string {
  const address = event.locationAddress ?? null;
  if (!event.locationName && !address) return '';
  const map = address
    ? `<a class="cev-map" href="${esc(mapsUrl({ locationName: event.locationName, locationAddress: address }))}" target="_blank" rel="noopener">Open in Maps${NEW_TAB}</a>`
    : '';
  return fact(
    ICONS.place,
    'Place',
    `${event.locationName ? `<span class="cev-place">${esc(event.locationName)}</span>` : ''}${address ? `<span class="cev-address">${esc(address)}</span>` : ''}${map}`,
  );
}

/** Paragraphs split on blank lines; single line breaks are kept. */
export function descriptionHtml(text: string | null | undefined): string {
  const paragraphs = (text ?? '').replace(/\r\n?/g, '\n').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  if (!paragraphs.length) return '';
  return `<div class="cev-description">${paragraphs.map((p) => `<p>${esc(p).replace(/\n/g, '<br />')}</p>`).join('')}</div>`;
}

/** Works from a list summary (while the detail loads) or from the full detail. */
export function headHtml(event: HeadEvent | null): string {
  if (!event) return '<h3 class="cev-title" id="cev-title" tabindex="-1">Event</h3>';
  const tags = [
    `<li class="cev-tag cev-tag--kind">${MINI_CUBE}${esc(kindLabel(event.kind))}</li>`,
    event.isSample ? '<li class="cev-tag cev-tag--sample">Sample</li>' : '',
    event.status === 'cancelled' ? '<li class="cev-tag cev-tag--cancelled">Cancelled</li>' : '',
  ].join('');
  const notice = event.status === 'cancelled' ? 'This event is cancelled.' : event.rsvpOpen === false ? 'This event is over.' : '';
  const date = isIsoDate(event.date) ? formatDate(event.date, 'long') : event.date;
  const time = isTime(event.startTime) && isTime(event.endTime) ? formatTimeRange(event.startTime, event.endTime) : `${event.startTime} to ${event.endTime}`;
  return `<ul class="cev-tags" data-kind="${esc(event.kind)}">${tags}</ul>
<h3 class="cev-title" id="cev-title" tabindex="-1">${esc(event.title)}</h3>
${notice ? `<p class="cev-notice">${notice}</p>` : ''}
<dl class="cev-facts${event.status === 'cancelled' ? ' cev-facts--off' : ''}">${fact(ICONS.date, 'Date', `<time datetime="${esc(event.date)}">${esc(date)}</time>`)}${fact(ICONS.time, 'Time', esc(time))}${placeFact(event)}</dl>
${descriptionHtml(event.description)}`;
}

// ---------- The one error line ----------

/**
 * Whether the view has a Cube section. Not for a class or a meetup, not for a
 * cancelled event, and not for a past event whose host never named the Cube.
 */
const showsCube = (event: EventDetail) => event.cubeMode !== 'none' && event.status !== 'cancelled' && (event.cube !== null || event.cubeMode === 'vote' || event.rsvpOpen);

/** The error shows next to what the visitor just used. If that part is gone after the redraw, it moves up to one that is always there. */
export function errorSpot(payload: EventPayload, ui: ViewUi): ErrorSpot | null {
  if (!ui.error) return null;
  const { event, me, suggestions } = payload;
  const cubeShown = showsCube(event);
  let spot = ui.error.spot;
  if (spot === 'ballot' && !(cubeShown && event.votingOpen && me && suggestions.length)) spot = 'cube';
  if (spot === 'cube' && !cubeShown) spot = 'going';
  return spot;
}

const alertAt = (payload: EventPayload, ui: ViewUi, spot: ErrorSpot, id = '') =>
  ui.error && errorSpot(payload, ui) === spot ? `<p class="cev-alert"${id ? ` id="${id}"` : ''} role="alert"${ui.error.n ? ` data-n="${num(ui.error.n)}"` : ''}>${esc(ui.error.message)}</p>` : '';

// ---------- Who is going ----------

const NAMES_SHOWN = 24;

function namesHtml(attendees: Attendee[], meId: number | null, open: boolean): string {
  if (!attendees.length) return '';
  // The visitor's own name leads, so they can find it. Everyone else stays in sign-up order.
  const ordered = [...attendees].sort((a, b) => Number(b.id === meId) - Number(a.id === meId));
  const item = (a: Attendee) =>
    a.id === meId ? `<li class="cev-name cev-name--me">${esc(a.name)} <span class="cev-name__you">(you)</span></li>` : `<li class="cev-name">${esc(a.name)}</li>`;
  const list = (people: Attendee[]) => `<ul class="cev-names" role="list">${people.map(item).join('')}</ul>`;
  if (ordered.length <= NAMES_SHOWN) return list(ordered);
  const rest = ordered.slice(NAMES_SHOWN);
  return `${list(ordered.slice(0, NAMES_SHOWN))}<details class="cev-fold" data-details="names"${open ? ' open' : ''}><summary data-focus="names"><span class="cev-fold__more">Show ${rest.length} more</span><span class="cev-fold__less">Show fewer</span></summary>${list(rest)}</details>`;
}

/** Under the names: the way in, the name form, or the way out. */
function rsvpHtml(payload: EventPayload, ui: ViewUi): string {
  const { event, me } = payload;
  const alert = alertAt(payload, ui, 'going', 'cev-going-alert');
  if (me && ui.going === 'leaving') {
    const goes = !event.rsvpOpen ? '' : event.cubeMode === 'vote' ? ' Your ranking and any offer to bring a Cube go with it.' : '';
    const stay = event.rsvpOpen ? "No, I'm still going" : 'No, leave it';
    return `<div class="cev-confirm" role="group" aria-labelledby="cev-leave-q"><p class="cev-confirm__q" id="cev-leave-q">Take your name off the list?${goes}</p><div class="cev-row"><button class="button button--ghost" type="button" data-act="leave-confirm">Yes, take me off</button><button class="cev-quiet" type="button" data-act="leave-cancel">${stay}</button></div></div>${alert}`;
  }
  // The list stays public after an event, so a visitor can still take their own name off it.
  if (me && !event.rsvpOpen) return `<div class="cev-me"><p class="cev-me__line">${ICONS.check}<span>You were on the list as <strong>${esc(me.name)}</strong>${stop(me.name)}</span></p><button class="cev-quiet" type="button" data-act="leave-ask">Take my name off</button></div>${alert}`;
  if (me) {
    return `<div class="cev-me"><p class="cev-me__line" data-focus="me" tabindex="-1">${ICONS.check}<span>You are going as <strong>${esc(me.name)}</strong>${stop(me.name)}</span></p><button class="cev-quiet" type="button" data-act="leave-ask">I can't make it</button></div>${alert}`;
  }
  if (!event.rsvpOpen) return alert;
  if (ui.going !== 'form') return `<button class="button cev-cta" type="button" data-act="going-open">I'm going</button>${alert}`;
  // A problem with the name sits right under the field, and the field points to it.
  return `<form class="cev-form" data-form="attend" novalidate>
<label class="cev-label" for="cev-name">Your name or Discord handle</label>
<input class="cev-input" id="cev-name" name="name" type="text" value="${esc(ui.name)}" maxlength="${CAL_LIMITS.attendeeName}" autocomplete="nickname" autocapitalize="words" spellcheck="false" enterkeyhint="go" required aria-describedby="cev-name-note${alert ? ' cev-going-alert' : ''}"${alert ? ' aria-invalid="true"' : ''} />
<p class="cev-hint" id="cev-name-note">Your name shows on this event. No account needed.</p>
${alert}
<div class="cev-turnstile" data-turnstile></div>
<div class="cev-row"><button class="button cev-cta" id="cev-go" type="submit">I'm going</button><button class="cev-quiet" type="button" data-act="going-cancel">Cancel</button></div>
</form>`;
}

export function goingHtml(payload: EventPayload, ui: ViewUi): string {
  const { event, attendees, me } = payload;
  return `<section class="cev-section" aria-labelledby="cev-going-title">
<h4 class="cev-h" id="cev-going-title" tabindex="-1">${event.rsvpOpen ? 'Who is going' : 'Who was going'}</h4>
<p class="cev-count">${goingLine(attendees.length, event.rsvpOpen)}</p>
${namesHtml(attendees, me?.id ?? null, ui.open.names === true)}
${rsvpHtml(payload, ui)}
</section>`;
}

// ---------- Which Cube ----------

const lendingLabel = (key: string | null) => (key && Object.prototype.hasOwnProperty.call(LENDING, key) ? LENDING[key as keyof typeof LENDING] : '');

/** The Cube's name, linked to its list when the link is a plain https one. */
function cubeName(cube: EventCube): string {
  if (!/^https:\/\//i.test(cube.listUrl)) return esc(cube.name);
  return `<a class="cev-out" href="${esc(cube.listUrl)}" target="_blank" rel="noopener">${esc(cube.name)}${ICONS.out}<span class="visually-hidden"> (opens the list in a new tab)</span></a>`;
}

/** Style, size, and how the Cube can be played, in the words the Cube Library uses. */
const cubeFacts = (cube: EventCube) => [cube.style, cube.cardCount ? `${cube.cardCount} cards` : '', lendingLabel(cube.lending)].filter(Boolean);

/** The Cube the organizer picked or confirmed, with its image and the artist credit when it has one. */
function pickHtml(cube: EventCube, noArt: boolean): string {
  const src = noArt ? null : cleanImageUrl(cube.imageUrl);
  const art = src
    ? `<figure class="cev-art"><img src="${esc(src)}" alt="" width="626" height="457" loading="lazy" decoding="async" referrerpolicy="no-referrer" />${cube.imageArtist ? `<figcaption>Art by ${esc(cube.imageArtist)}</figcaption>` : ''}</figure>`
    : '';
  const chips = cubeFacts(cube).map((f) => `<li>${esc(f)}</li>`).join('');
  return `<div class="cev-pick${src ? ' cev-pick--art' : ''}">${art}<div class="cev-pick__text"><p class="cev-pick__name">${cubeName(cube)}</p><p class="cev-owner">Owned by ${esc(cube.owner)}</p>${chips ? `<ul class="cev-chips" role="list">${chips}</ul>` : ''}</div></div>`;
}

const actButton = (act: string, id: number, label: string, cubeLabel: string) =>
  `<button class="cev-quiet" type="button" data-act="${act}" data-id="${num(id)}">${label}<span class="visually-hidden">: ${esc(cubeLabel)}</span></button>`;

/** Who can bring a Cube that is already the pick, said in full because it now matters most. */
function bringLine(s: CubeSuggestion, canAct: boolean, past = false): string {
  if (s.iBring) return `<div class="cev-bring"><p>${ICONS.check}<span>${past ? 'You said you could bring it.' : 'You can bring it.'}</span></p>${canAct ? actButton('unbring', s.id, 'I can no longer bring it', s.cube.name) : ''}</div>`;
  if (s.bringer) return `<div class="cev-bring"><p>${ICONS.check}<span>${esc(s.bringer)} ${past ? 'said they could bring it' : 'can bring it'}.</span></p></div>`;
  if (past) return '';
  return `<div class="cev-bring"><p><span>No one has said they can bring it yet.</span></p>${canAct ? actButton('bring', s.id, 'I can bring it', s.cube.name) : ''}</div>`;
}

function suggestionHtml(s: CubeSuggestion, can: { bring: boolean; withdraw: boolean; past?: boolean }, picked = false): string {
  const facts = `<li>Owned by ${esc(s.cube.owner)}</li>${cubeFacts(s.cube).map((f) => `<li>${esc(f)}</li>`).join('')}`;
  const by = s.mine ? 'you' : s.suggestedBy ? esc(s.suggestedBy) : '';
  // The pick shows who can bring it above the list, so its own row does not say it twice.
  const bring = picked ? '' : s.iBring ? `<p class="cev-sug__bring">${ICONS.check}<span>${can.past ? 'You said you could bring it' : 'You can bring it'}</span></p>` : s.bringer ? `<p class="cev-sug__bring">${ICONS.check}<span>${esc(s.bringer)} ${can.past ? 'said they could bring it' : 'can bring it'}</span></p>` : '';
  const acts = [
    can.bring && !picked && s.iBring ? actButton('unbring', s.id, 'I can no longer bring it', s.cube.name) : '',
    can.bring && !picked && !s.bringer && !s.iBring ? actButton('bring', s.id, 'I can bring it', s.cube.name) : '',
    // A Cube whose suggester has left belongs to the table, so anyone going may clear it.
    can.withdraw && (s.mine || s.suggestedBy === null) ? actButton('withdraw', s.id, 'Withdraw', s.cube.name) : '',
  ].join('');
  return `<li class="cev-sug${picked ? ' cev-sug--picked' : ''}">
<p class="cev-sug__name">${cubeName(s.cube)}${picked ? ' <span class="cev-sug__tag">Picked</span>' : ''}</p>
<ul class="cev-dots" role="list">${facts}</ul>
${by || bring ? `<div class="cev-row cev-sug__meta">${by ? `<p class="cev-sug__by">Suggested by ${by}</p>` : ''}${bring}</div>` : ''}
${acts ? `<div class="cev-row cev-sug__acts">${acts}</div>` : ''}
</li>`;
}

/** The results box of the picker. The script redraws only this while the visitor types. */
export function pickerResultsHtml(picker: Picker, suggested: number[]): string {
  if (picker.cubes === 'loading') return '<p class="cev-hint">Loading the Cube Library.</p>';
  if (picker.cubes === 'error') return '<p class="cev-hint">We could not load the Cube Library.</p><button class="cev-quiet" type="button" data-act="picker-retry">Try again</button>';
  const found = searchCubes(picker.cubes, picker.query);
  if (!found.length) return '<p class="cev-hint">No Cubes match that. Try another word, or browse the Cube Library.</p>';
  const shown = found.slice(0, picker.shown);
  const rows = shown
    .map((c) => {
      const taken = suggested.includes(c.id);
      const facts = [c.owner, c.style, c.cardCount ? `${c.cardCount} cards` : ''].filter(Boolean).join(', ');
      return `<li><button class="cev-option" type="button" data-act="pick" data-id="${num(c.id)}"${taken ? ' disabled' : ''}><span class="cev-option__name">${esc(c.name)}</span><span class="cev-option__facts">${esc(facts)}</span>${taken ? '<span class="cev-option__note">Already suggested</span>' : ''}</button></li>`;
    })
    .join('');
  const more = shown.length < found.length ? '<button class="cev-quiet" type="button" data-act="picker-more">Show more</button>' : '';
  return `<ul class="cev-options" role="list">${rows}</ul><div class="cev-row cev-options__foot"><p class="cev-hint">${pickerCount(shown.length, found.length)}</p>${more}</div>`;
}

/** "Suggest a Cube": the button, the open picker, or the reason there is neither. */
function suggestHtml(payload: EventPayload, ui: ViewUi): string {
  const { suggestions } = payload;
  const alert = alertAt(payload, ui, 'cube');
  const limit = suggestLimit(suggestions);
  if (limit) return `<p class="cev-hint">${limit}</p>${alert}`;
  if (!ui.picker) return `<button class="button button--ghost cev-suggest" type="button" data-act="picker-open">Suggest a Cube</button>${alert}`;
  // While the picker is open, the error line sits inside it, right under the results it is about.
  return `<div class="cev-picker" role="group" aria-labelledby="cev-picker-title">
<h5 class="cev-sub" id="cev-picker-title">Suggest a Cube</h5>
<label class="cev-label" for="cev-search">Search the Cube Library</label>
<input class="cev-input" id="cev-search" type="search" value="${esc(ui.picker.query)}" placeholder="Name, owner, or style" autocomplete="off" spellcheck="false" enterkeyhint="search" />
<label class="cev-check"><input id="cev-bring" type="checkbox"${ui.picker.canBring ? ' checked' : ''} /><span>I can bring this Cube</span></label>
<div class="cev-picker__results" data-results>${pickerResultsHtml(ui.picker, suggestions.map((s) => s.cube.id))}</div>
${alert}
<div class="cev-row cev-picker__foot"><a class="cev-quiet" href="${CUBES_BASE}" target="_blank" rel="noopener">Browse the Cube Library${NEW_TAB}</a><button class="cev-quiet" type="button" data-act="picker-close">Close</button></div>
</div>`;
}

/** An icon button in a ranked row. `label` is its name for screen readers, already escaped. */
const tool = (act: string, id: number, label: string, svg: string, off: boolean) =>
  `<button class="cev-tool" type="button" data-act="${act}" data-id="${num(id)}" aria-label="${label}"${off ? ' disabled' : ''}>${svg}</button>`;

function ballotHtml(payload: EventPayload, ui: ViewUi): string {
  const { suggestions, me } = payload;
  const names = new Map(suggestions.map((s) => [s.cube.id, s.cube.name] as const));
  const ranked = ui.ranking.filter((id) => names.has(id));
  const saved = me?.ranking ?? [];
  const dirty = !sameRanking(ranked, saved);
  const rows = ranked
    .map((id, i) => {
      const name = esc(names.get(id) ?? '');
      return `<li class="cev-ranked"><span class="cev-rank">${i + 1}</span><span class="cev-ranked__name">${name}</span><span class="cev-ranked__tools">${tool('rank-up', id, `Move ${name} up`, ICONS.up, i === 0)}${tool('rank-down', id, `Move ${name} down`, ICONS.down, i === ranked.length - 1)}${tool('rank-remove', id, `Remove ${name} from my ranking`, ICONS.remove, false)}</span></li>`;
    })
    .join('');
  const pool = suggestions
    .filter((s) => !ranked.includes(s.cube.id))
    .map((s) => `<li><button class="cev-add" type="button" data-act="rank-add" data-id="${num(s.cube.id)}"><span class="cev-rank cev-rank--open" aria-hidden="true">${ICONS.add}</span><span class="cev-add__name">${esc(s.cube.name)}</span><span class="visually-hidden">, add to my ranking</span></button></li>`)
    .join('');
  const how = !rows ? 'Pick your first choice, then your next.' : pool ? 'Pick a Cube to add it, or use the arrows to change the order.' : 'Use the arrows to change the order.';
  // One line under the list: the save button only while there is something to save, then where things stand.
  const foot = [
    dirty ? '<button class="button button--ghost" type="button" data-act="rank-save">Save my ranking</button>' : '',
    dirty
      ? '<p class="cev-ballot__status cev-ballot__status--dirty" data-focus="ballot-status" tabindex="-1">Not saved yet.</p>'
      : saved.length
        ? `<p class="cev-ballot__status" data-focus="ballot-status" tabindex="-1">${ICONS.check}<span>Saved.</span></p>`
        : '',
    ranked.length || saved.length ? '<button class="cev-quiet" type="button" data-act="rank-clear">Clear my ranking</button>' : '',
  ].join('');
  return `<div class="cev-ballot" role="group" aria-labelledby="cev-ballot-title">
<h5 class="cev-sub" id="cev-ballot-title">Your ranking</h5>
<p class="cev-hint">Rank the Cubes you would like to draft. ${how}</p>
${rows ? `<ol class="cev-rankedlist" role="list">${rows}</ol>` : ''}
${pool ? `${rows ? '<p class="cev-caption" aria-hidden="true">Not ranked yet</p>' : ''}<ul class="cev-pool" role="list" aria-label="Not ranked yet">${pool}</ul>` : ''}
${foot ? `<div class="cev-row cev-ballot__foot">${foot}</div>` : ''}
${alertAt(payload, ui, 'ballot')}
</div>`;
}

/** Looks up a suggested Cube's name by its id, for the count. */
const namer = (suggestions: CubeSuggestion[]) => {
  const names = new Map(suggestions.map((s) => [s.cube.id, s.cube.name] as const));
  return (cubeId: number) => names.get(cubeId) ?? 'A Cube';
};

/** A bar as SVG, so its length needs no inline style. `share` runs from 0 to 1. */
function bar(share: number): string {
  const width = share > 0 ? Math.max(3, Math.min(100, Math.round(share * 1000) / 10)) : 0;
  return `<svg class="cev-bar__svg" width="100%" height="8" aria-hidden="true" focusable="false"><rect class="cev-bar__track" width="100%" height="8" rx="4"/><rect class="cev-bar__fill" width="${width}%" height="8" rx="4"/></svg>`;
}

function countHtml(tally: Tally, nameOf: (cubeId: number) => string, open: boolean): string {
  const items = rounds(tally, nameOf, open)
    .map((r, i) => `<li>Round ${i + 1}: ${r.counts.map((c) => `${esc(c.name)} <strong>(${num(c.votes)})</strong>`).join(', ')}. ${esc(r.end)}</li>`)
    .join('');
  return `<p>${COUNT_RULE}</p><ol class="cev-rounds" role="list">${items}</ol>${tally.tied ? `<p>${TIE_RULE}</p>` : ''}`;
}

function howHtml(tally: Tally, nameOf: (cubeId: number) => string, ui: ViewUi, voting: boolean): string {
  // Closed by default while people vote; open once the count is final and is the news.
  const open = ui.open.how ?? !voting;
  return `<details class="cev-fold cev-how" data-details="how"${open ? ' open' : ''}><summary data-focus="how">${voting ? 'How the count works' : 'How the count went'}</summary><div class="cev-how__body">${countHtml(tally, nameOf, voting)}</div></details>`;
}

function resultHtml(payload: EventPayload, ui: ViewUi): string {
  const { tally, suggestions } = payload;
  if (tally.winner === null || !tally.rounds.length) return '';
  const nameOf = namer(suggestions);
  // One bar for each Cube that is somebody's first choice. The rest share one line, so a long list stays short.
  const first = tally.rounds[0].counts;
  const bars = first
    .filter((c) => c.votes > 0)
    .map((c) => `<li class="cev-bar"><span class="cev-bar__name">${esc(nameOf(c.cubeId))}</span>${bar(c.votes / Math.max(1, tally.ballots))}<span class="cev-bar__votes">${num(c.votes)}<span class="visually-hidden"> ${c.votes === 1 ? 'first choice' : 'first choices'}</span></span></li>`)
    .join('');
  const unpicked = first.filter((c) => c.votes === 0).length;
  return `<div class="cev-result">
<h5 class="cev-sub">Result so far</h5>
<p class="cev-leader">Leading now: <strong>${esc(nameOf(tally.winner))}</strong></p>
<ul class="cev-bars" role="list" aria-label="First choices">${bars}</ul>
<p class="cev-hint">${count(tally.ballots, 'ballot', 'ballots')} so far. The bars show first choices.${unpicked ? ` ${unpicked === 1 ? '1 Cube is' : `${unpicked} Cubes are`} nobody's first choice yet.` : ''}</p>
${howHtml(tally, nameOf, ui, true)}
</div>`;
}

const cubeSection = (title: string, body: string) => `<section class="cev-section" aria-labelledby="cev-cube-title">
<h4 class="cev-h" id="cev-cube-title" tabindex="-1">${title}</h4>
${body}
</section>`;

function openVoteHtml(payload: EventPayload, ui: ViewUi): string {
  const { event, suggestions, me } = payload;
  const going = me !== null;
  const closes = voteClosesSentence(event);
  const list = suggestions.length
    ? `<ul class="cev-cubes" role="list">${suggestions.map((s) => suggestionHtml(s, { bring: going && event.rsvpOpen, withdraw: going })).join('')}</ul>`
    : `<p class="cev-empty">No Cubes suggested yet.${going ? ' Start with one from the Cube Library.' : ''}</p>`;
  const invite = `<p class="cev-invite">${event.rsvpOpen ? '<button class="cev-inline" type="button" data-act="going-open">Say you are going</button>' : 'Say you are going'} to suggest and rank Cubes.</p>`;
  return cubeSection(
    'Which Cube to draft',
    `<p class="cev-lede">People who are going suggest Cubes and rank them.${closes ? ` ${esc(closes)}` : ''}</p>
${list}
${going ? suggestHtml(payload, ui) : invite + alertAt(payload, ui, 'cube')}
${going && suggestions.length ? ballotHtml(payload, ui) : ''}
${resultHtml(payload, ui)}`,
  );
}

function closedVoteHtml(payload: EventPayload, ui: ViewUi): string {
  const { event, suggestions, tally, me } = payload;
  const can = { bring: me !== null && event.rsvpOpen, withdraw: false, past: !event.rsvpOpen };
  const winner = suggestions.find((s) => s.cube.id === tally.winner) ?? null;
  // The winner leads the list, so the answer and who can bring it sit together.
  const ordered = winner ? [winner, ...suggestions.filter((s) => s !== winner)] : suggestions;
  const list = ordered.length ? `<ul class="cev-cubes" role="list">${ordered.map((s) => suggestionHtml(s, can, s === winner)).join('')}</ul>` : '';
  const verdict = winner
    ? `<p class="cev-lede">Voting is closed.</p><p class="cev-verdict">The vote picked: <strong>${esc(winner.cube.name)}</strong></p>${bringLine(winner, can.bring, can.past)}`
    : `<p class="cev-lede">No votes came in.${event.rsvpOpen ? ' The organizer will pick the Cube.' : ''}</p>`;
  return cubeSection(
    winner ? 'Cube to draft' : 'Which Cube to draft',
    `${verdict}
${list}
${alertAt(payload, ui, 'cube')}
${winner ? howHtml(tally, namer(suggestions), ui, false) : ''}`,
  );
}

export function cubeHtml(payload: EventPayload, ui: ViewUi): string {
  const { event, suggestions, tally, me } = payload;
  if (!showsCube(event)) return '';
  if (event.cube) {
    const cube = event.cube;
    const suggested = suggestions.find((s) => s.cube.id === cube.id);
    // "Confirmed" only when it is what the vote chose. An organizer's different call says so plainly.
    const confirmed = event.cubeMode === 'vote' && (tally.winner === null || tally.winner === cube.id);
    return cubeSection(
      'Cube to draft',
      `<p class="cev-lede">${confirmed ? 'Confirmed by the organizer.' : 'Picked by the organizer.'}</p>
${pickHtml(cube, ui.noArt)}
${suggested ? bringLine(suggested, me !== null && event.rsvpOpen, !event.rsvpOpen) : ''}
${alertAt(payload, ui, 'cube')}`,
    );
  }
  if (event.cubeMode === 'set') return cubeSection('Cube to draft', `<p class="cev-lede">The organizer will pick the Cube.</p>${alertAt(payload, ui, 'cube')}`);
  return event.votingOpen ? openVoteHtml(payload, ui) : closedVoteHtml(payload, ui);
}

// ---------- Actions ----------

export function actionsHtml(payload: EventPayload, ui: ViewUi, pageUrl: string): string {
  const { event } = payload;
  const url = eventLink(pageUrl, event);
  // A calendar entry only helps while the event is still ahead. The link is always worth sharing.
  const calendar = event.rsvpOpen
    ? `<button class="button button--ghost" type="button" data-act="ics">Add to my calendar</button><a class="cev-quiet" href="${esc(googleCalendarUrl(event, url))}" target="_blank" rel="noopener">Google Calendar${NEW_TAB}</a>`
    : '';
  const field = ui.linkField
    ? `<div class="cev-link"><label class="cev-label" for="cev-link">Copy this link</label><input class="cev-input" id="cev-link" type="text" readonly value="${esc(url)}" /></div>`
    : '';
  return `<div class="cev-actions" role="group" aria-label="Save and share">
<div class="cev-row">${calendar}<button class="cev-quiet" type="button" data-act="copy">${ui.copied ? 'Link copied' : 'Copy link'}</button></div>
${field}
${alertAt(payload, ui, 'actions')}
</div>`;
}

// ---------- The whole view ----------

/** Every part of the view once the event has loaded. */
export function viewParts(payload: EventPayload, ui: ViewUi, pageUrl: string): Parts {
  return { head: headHtml(payload.event), status: '', going: goingHtml(payload, ui), cube: cubeHtml(payload, ui), actions: actionsHtml(payload, ui, pageUrl) };
}

/** The view before the event has loaded: what the calendar already knows, then a loading line or the problem. */
export function waitingParts(preview: EventSummary | null, problem: string | null, canRetry = true): Parts {
  const status =
    problem === null
      ? '<p class="cev-loading" role="status">Loading event details.</p><div class="cev-skeleton" aria-hidden="true"><span></span><span></span><span></span></div>'
      : `<div class="cev-problem"><p class="cev-alert" role="alert">${esc(problem)}</p>${canRetry ? '<button class="button button--ghost" type="button" data-act="retry">Try again</button>' : ''}</div>`;
  return { head: headHtml(preview), status, going: '', cube: '', actions: '' };
}
