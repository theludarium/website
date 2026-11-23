// Tests for the event view's HTML builders: every state of the "who is going"
// and "which Cube" sections, the words around the vote, and escaping.
// Run: node --test tests/calendar/event-render.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  COUNT_RULE, PARTS, PICKER_PAGE, TIE_RULE,
  actionsHtml, cubeHtml, descriptionHtml, errorSpot, eventLink, goingHtml, goingLine, headHtml, icsFileName, mapsUrl, moveRank, newUi,
  pickerCount, pickerResultsHtml, roundLines, sameRanking, searchCubes, suggestLimit, summaryOf, viewParts, voteClosesSentence, waitingParts,
  type Picker, type PickerCube, type ViewUi,
} from '../../src/lib/calendar/event-render.ts';
import { tallyRankedChoice } from '../../src/lib/calendar/tally.ts';
import { ACTION_MESSAGES, CAL_CAPS, type CubeSuggestion, type EventCube, type EventDetail, type EventPayload, type EventSummary } from '../../src/lib/calendar/shared.ts';

const PAGE = 'https://theludarium.com/cube-commonwealth/events/';

const cube = (id: number, name: string, over: Partial<EventCube> = {}): EventCube => ({
  id, name, listUrl: `https://cubecobra.com/cube/overview/c${id}`, owner: 'Levi Wilson', style: 'Themed', cardCount: 360, lending: null, imageUrl: null, imageArtist: null, ...over,
});
const MONO = cube(24, 'Mono Blue');
const MTGO = cube(27, 'MTGO Vintage Cube', { style: 'Vintage', cardCount: 540, imageUrl: 'https://assets.cubecobra.com/art/lotus.jpg', imageArtist: 'Chris Rahn' });
const ABC = cube(3, 'Abecedarian Cube', { owner: 'Badnneuz', lending: 'with-owner' });

const suggestion = (id: number, c: EventCube, over: Partial<CubeSuggestion> = {}): CubeSuggestion => ({ id, cube: c, suggestedBy: 'Ann', bringer: null, mine: false, iBring: false, ...over });

const event = (over: Partial<EventDetail> = {}): EventDetail => ({
  id: 101, title: 'Sunday Cube Draft', kind: 'draft', date: '2026-11-29', startTime: '13:00', endTime: '16:30', locationName: 'The Table, Indianapolis',
  status: 'approved', going: 0, cubeMode: 'vote', cubeName: null, isSample: false,
  description: 'Our weekly draft. New players welcome.\n\nBring sleeves if you have them.\nWe start on time.', locationAddress: '1 Main St, Indianapolis, IN',
  tz: 'America/Indiana/Indianapolis', startsAt: '2026-11-29T18:00:00.000Z', endsAt: '2026-11-29T21:30:00.000Z', voteClosesAt: '2026-11-28T18:00:00.000Z',
  cube: null, rsvpOpen: true, votingOpen: true, ...over,
});

const NO_TALLY = tallyRankedChoice([], []);
const payload = (over: Partial<EventPayload> = {}): EventPayload => ({ event: event(), attendees: [], suggestions: [], tally: NO_TALLY, me: null, ...over });
const ui = (over: Partial<ViewUi> = {}): ViewUi => ({ ...newUi(), ...over });

const SAM = { id: 7, name: 'Sam', ranking: [] as number[] };
/** As a visitor sees them. Ben offered to bring the first; whoever suggested the third has left. */
const THREE = [suggestion(1, MONO, { bringer: 'Ben' }), suggestion(2, MTGO, { suggestedBy: 'Sam' }), suggestion(3, ABC, { suggestedBy: null })];
/** The same three as Sam sees them: the second one is his. */
const SAMS = THREE.map((s) => (s.id === 2 ? { ...s, mine: true } : s));
/** Round 1: Mono Blue 3, MTGO Vintage Cube 2, Abecedarian Cube 1. The last one drops and its ballot moves to Mono Blue. */
const SIX_BALLOTS = tallyRankedChoice([24, 27, 3], [[24], [24], [24, 27], [27], [27, 24], [3, 24]]);

/** What a person would read: tags and icons out, entities back to characters. */
const text = (html: string) =>
  html
    .replace(/<svg[\s\S]*?<\/svg>/g, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .replace(/ ([.,:)])/g, '$1')
    .trim();
const has = (html: string, words: string) => assert.ok(text(html).includes(words), `expected "${words}" in: ${text(html)}`);
const lacks = (html: string, words: string) => assert.ok(!text(html).includes(words), `did not expect "${words}" in: ${text(html)}`);
const times = (html: string, needle: string) => html.split(needle).length - 1;

// ---------- Words ----------

test('the going line counts 0, 1, and many people, before and after the event', () => {
  assert.equal(goingLine(0, true), 'No one yet. Be the first.');
  assert.equal(goingLine(1, true), '1 person is going.');
  assert.equal(goingLine(5, true), '5 people are going.');
  assert.equal(goingLine(200, true), '200 people are going.');
  assert.equal(goingLine(0, false), 'No one said they were going.');
  assert.equal(goingLine(1, false), '1 person said they were going.');
  assert.equal(goingLine(12, false), '12 people said they were going.');
});

test('the vote-closes sentence is in the event\'s own time', () => {
  assert.equal(voteClosesSentence(event()), 'Voting closes Saturday, November 28 at 1:00 pm.');
  // Two hours before a 1:00 pm start.
  assert.equal(voteClosesSentence(event({ voteClosesAt: '2026-11-29T16:00:00.000Z' })), 'Voting closes Sunday, November 29 at 11:00 am.');
  // Twelve hours before a 9:30 am start lands on the evening before.
  assert.equal(
    voteClosesSentence(event({ startTime: '09:30', startsAt: '2026-11-29T14:30:00.000Z', voteClosesAt: '2026-11-29T02:30:00.000Z' })),
    'Voting closes Saturday, November 28 at 9:30 pm.',
  );
  assert.equal(voteClosesSentence(event({ voteClosesAt: '2026-11-29T18:00:00.000Z' })), 'Voting closes when the event starts.');
  assert.equal(voteClosesSentence(event({ voteClosesAt: null })), '');
  assert.equal(voteClosesSentence(event({ voteClosesAt: 'soon' })), '');
});

test('the vote-closes sentence stays right across a daylight saving change', () => {
  // Clocks fall back on Sunday, November 1, 2026. 24 real hours before 1:00 pm standard time is 2:00 pm daylight time.
  const fall = event({ date: '2026-11-01', startsAt: '2026-11-01T18:00:00.000Z', voteClosesAt: '2026-10-31T18:00:00.000Z' });
  assert.equal(voteClosesSentence(fall), 'Voting closes Saturday, October 31 at 2:00 pm.');
  // Clocks spring forward on Sunday, March 14, 2027.
  const spring = event({ date: '2027-03-14', startsAt: '2027-03-14T17:00:00.000Z', voteClosesAt: '2027-03-13T17:00:00.000Z' });
  assert.equal(voteClosesSentence(spring), 'Voting closes Saturday, March 13 at 12:00 pm.');
});

test('the vote-closes sentence counts back from the start time when the time zone is unknown', () => {
  assert.equal(voteClosesSentence(event({ tz: 'Mars/Olympus_Mons' })), 'Voting closes Saturday, November 28 at 1:00 pm.');
  assert.equal(
    voteClosesSentence(event({ tz: 'nowhere', startTime: '01:00', startsAt: '2026-11-29T06:00:00.000Z', voteClosesAt: '2026-11-29T04:00:00.000Z' })),
    'Voting closes Saturday, November 28 at 11:00 pm.',
  );
});

test('the rounds read as plain sentences, and say who is ahead or who won', () => {
  const nameOf = (id: number) => ({ 24: 'Mono Blue', 27: 'MTGO Vintage Cube', 3: 'Abecedarian Cube' })[id] ?? 'A Cube';
  assert.deepEqual(roundLines(SIX_BALLOTS, nameOf, true), [
    'Round 1: Mono Blue (3), MTGO Vintage Cube (2), Abecedarian Cube (1). Abecedarian Cube is dropped.',
    'Round 2: Mono Blue (4), MTGO Vintage Cube (2). Mono Blue is ahead.',
  ]);
  assert.equal(roundLines(SIX_BALLOTS, nameOf, false)[1], 'Round 2: Mono Blue (4), MTGO Vintage Cube (2). Mono Blue wins.');
  const landslide = tallyRankedChoice([24, 27], [[24], [24], [27]]);
  assert.deepEqual(roundLines(landslide, nameOf, false), ['Round 1: Mono Blue (2), MTGO Vintage Cube (1). Mono Blue wins.']);
  assert.deepEqual(roundLines(NO_TALLY, nameOf, true), []);
  // A Cube that left the list after the count still gets a name.
  assert.equal(roundLines(tallyRankedChoice([99], [[99]]), nameOf, true)[0], 'Round 1: A Cube (1). A Cube is ahead.');
});

test('the count is explained in two sentences', () => {
  assert.equal(COUNT_RULE.match(/\./g)?.length, 2);
  assert.equal(TIE_RULE, 'A tie was broken by first choices, then by which Cube was suggested first.');
});

test('links, file names, and the summary for the calendar', () => {
  assert.equal(eventLink(PAGE, { id: 101, isSample: false }), `${PAGE}?event=101`);
  assert.equal(eventLink(PAGE, { id: 9001, isSample: true }), `${PAGE}?event=9001&samples=1`);
  assert.equal(icsFileName('Sunday Cube Draft'), 'sunday-cube-draft.ics');
  assert.equal(icsFileName('  Levi\'s Café: Cube Night #2!  '), 'levi-s-cafe-cube-night-2.ics');
  assert.equal(icsFileName('???'), 'event.ics');
  assert.ok(icsFileName('x'.repeat(200)).length <= 64);
  assert.equal(mapsUrl({ locationName: 'The Table', locationAddress: '1 Main St, Carmel & Co' }), 'https://www.google.com/maps/search/?api=1&query=The%20Table%2C%201%20Main%20St%2C%20Carmel%20%26%20Co');
  const p = payload({ event: event({ going: 99, description: 'private to the detail' }), attendees: [{ id: 1, name: 'Ann' }, { id: 2, name: 'Ben' }] });
  const summary: EventSummary = summaryOf(p);
  assert.equal(summary.going, 2);
  assert.deepEqual(Object.keys(summary).sort(), ['cubeMode', 'cubeName', 'date', 'endTime', 'going', 'id', 'isSample', 'kind', 'locationName', 'startTime', 'status', 'title']);
});

// ---------- Small list helpers ----------

test('ranking helpers move one Cube a place and compare rankings', () => {
  assert.deepEqual(moveRank([1, 2, 3], 2, -1), [2, 1, 3]);
  assert.deepEqual(moveRank([1, 2, 3], 2, 1), [1, 3, 2]);
  assert.deepEqual(moveRank([1, 2, 3], 1, -1), [1, 2, 3]);
  assert.deepEqual(moveRank([1, 2, 3], 3, 1), [1, 2, 3]);
  assert.deepEqual(moveRank([1, 2, 3], 9, 1), [1, 2, 3]);
  const before = [1, 2, 3];
  moveRank(before, 1, 1);
  assert.deepEqual(before, [1, 2, 3]);
  assert.ok(sameRanking([], []) && sameRanking([1, 2], [1, 2]));
  assert.ok(!sameRanking([1, 2], [2, 1]) && !sameRanking([1], [1, 2]));
});

const LIBRARY: PickerCube[] = [
  { id: 1, name: 'Alger\'s Peasant Cube', owner: 'Algerone', style: 'Peasant', cardCount: 450 },
  { id: 2, name: 'Mono Blue', owner: 'Levi Wilson', style: 'Themed', cardCount: 360 },
  { id: 3, name: 'MTGO Vintage Cube', owner: 'Levi Wilson', style: 'Vintage', cardCount: 540 },
  { id: 4, name: 'Pauper Cube v1.2', owner: 'Stepmom', style: 'Pauper', cardCount: 360 },
  { id: 5, name: 'Vintage Cube, Nate\'s Plan', owner: 'Nate', style: 'Vintage', cardCount: null },
];

test('the picker search covers name, owner, and style, with name matches first', () => {
  assert.deepEqual(searchCubes(LIBRARY, '').map((c) => c.id), [1, 2, 3, 4, 5]);
  assert.deepEqual(searchCubes(LIBRARY, '   ').map((c) => c.id), [1, 2, 3, 4, 5]);
  // Starts with the search, then has it in the name, then matches by style.
  assert.deepEqual(searchCubes(LIBRARY, 'vintage').map((c) => c.id), [5, 3]);
  assert.deepEqual(searchCubes(LIBRARY, 'PEASANT').map((c) => c.id), [1]);
  assert.deepEqual(searchCubes(LIBRARY, 'levi').map((c) => c.id), [2, 3]);
  assert.deepEqual(searchCubes(LIBRARY, 'levi  vintage').map((c) => c.id), [3]);
  assert.deepEqual(searchCubes(LIBRARY, 'pauper').map((c) => c.id), [4]);
  assert.deepEqual(searchCubes(LIBRARY, 'commander'), []);
  assert.equal(pickerCount(6, 40), 'Showing 6 of 40 Cubes.');
  assert.equal(pickerCount(3, 3), '3 Cubes.');
  assert.equal(pickerCount(1, 1), '1 Cube.');
});

test('the picker lists results as buttons, marks Cubes already suggested, and pages', () => {
  const picker: Picker = { cubes: LIBRARY, query: '', canBring: false, shown: 2 };
  const html = pickerResultsHtml(picker, [2]);
  assert.equal(times(html, 'data-act="pick"'), 2);
  assert.ok(html.includes('data-act="pick" data-id="1">'));
  assert.ok(html.includes('data-act="pick" data-id="2" disabled>'));
  has(html, 'Already suggested');
  has(html, 'Algerone, Peasant, 450 cards');
  has(html, 'Showing 2 of 5 Cubes.');
  assert.ok(html.includes('data-act="picker-more"'));
  const all = pickerResultsHtml({ ...picker, shown: 50 }, []);
  assert.equal(times(all, 'data-act="pick"'), 5);
  assert.ok(!all.includes('picker-more') && !all.includes('disabled'));
  has(all, 'Nate, Vintage');
  has(pickerResultsHtml({ ...picker, query: 'zzz' }, []), 'No Cubes match that.');
  has(pickerResultsHtml({ ...picker, cubes: 'loading' }, []), 'Loading the Cube Library.');
  const failed = pickerResultsHtml({ ...picker, cubes: 'error' }, []);
  has(failed, 'We could not load the Cube Library.');
  assert.ok(failed.includes('data-act="picker-retry"'));
});

test('the caps on suggestions are explained in words', () => {
  assert.equal(suggestLimit(THREE), '');
  const mine = [1, 2, 3].map((n) => suggestion(n, cube(n, `Cube ${n}`), { mine: true }));
  assert.equal(suggestLimit(mine), `You have suggested ${CAL_CAPS.suggestionsPerAttendee} Cubes, the most one person can add.`);
  const full = Array.from({ length: CAL_CAPS.suggestionsPerEvent }, (_, n) => suggestion(n + 1, cube(n + 1, `Cube ${n + 1}`)));
  assert.equal(suggestLimit(full), `This event has ${CAL_CAPS.suggestionsPerEvent} suggested Cubes, the most it can hold.`);
});

// ---------- Head ----------

test('the head shows tags, the title, the date, the time range, and the place', () => {
  const html = headHtml(event());
  assert.ok(html.includes('<h3 class="cev-title" id="cev-title" tabindex="-1">Sunday Cube Draft</h3>'));
  assert.ok(html.includes('data-kind="draft"'));
  has(html, 'Draft');
  has(html, 'Sunday, November 29, 2026');
  has(html, '1:00 pm to 4:30 pm');
  has(html, 'The Table, Indianapolis');
  has(html, '1 Main St, Indianapolis, IN');
  assert.ok(html.includes('<time datetime="2026-11-29">'));
  assert.ok(html.includes('href="https://www.google.com/maps/search/?api=1&amp;query=The%20Table%2C%20Indianapolis%2C%201%20Main%20St%2C%20Indianapolis%2C%20IN"'));
  has(html, 'Open in Maps (opens in a new tab)');
  lacks(html, 'Sample');
  lacks(html, 'Cancelled');
  lacks(html, 'This event');
});

test('the head adds the Sample and Cancelled tags and says when an event is over', () => {
  has(headHtml(event({ isSample: true })), 'Sample');
  const cancelled = headHtml(event({ status: 'cancelled', rsvpOpen: false, kind: 'class' }));
  has(cancelled, 'Class');
  has(cancelled, 'Cancelled');
  has(cancelled, 'This event is cancelled.');
  lacks(cancelled, 'This event is over.');
  // The date and time stay readable but are marked as off.
  assert.ok(cancelled.includes('class="cev-facts cev-facts--off"') && !headHtml(event()).includes('cev-facts--off'));
  has(headHtml(event({ rsvpOpen: false })), 'This event is over.');
  // An unknown kind from a newer server still gets a word.
  has(headHtml(event({ kind: 'tournament' as EventDetail['kind'] })), 'Other');
});

test('the head works from a list summary while the detail loads, and with nothing at all', () => {
  const { description, locationAddress, tz, startsAt, endsAt, voteClosesAt, cube: c, rsvpOpen, votingOpen, ...summary } = event();
  void [description, locationAddress, tz, startsAt, endsAt, voteClosesAt, c, rsvpOpen, votingOpen];
  const html = headHtml(summary);
  has(html, 'Sunday Cube Draft');
  has(html, 'The Table, Indianapolis');
  lacks(html, 'Open in Maps');
  lacks(html, 'This event is over.');
  assert.ok(headHtml(null).includes('id="cev-title"'));
  // No place at all: no place line.
  lacks(headHtml(event({ locationName: null, locationAddress: null })), 'Place');
  // An address with no name still gets its map link.
  has(headHtml(event({ locationName: null })), 'Open in Maps');
});

test('the description keeps paragraphs and line breaks', () => {
  assert.equal(
    descriptionHtml('One.\r\n\r\nTwo, line one.\nTwo, line two.\n\n\n\nThree.'),
    '<div class="cev-description"><p>One.</p><p>Two, line one.<br />Two, line two.</p><p>Three.</p></div>',
  );
  assert.equal(descriptionHtml(null), '');
  assert.equal(descriptionHtml('  \n \n '), '');
});

// ---------- Who is going ----------

test('not going: the names and one "I\'m going" button', () => {
  const html = goingHtml(payload({ attendees: [{ id: 1, name: 'Ann' }, { id: 2, name: 'Ben' }] }), ui());
  has(html, 'Who is going');
  has(html, '2 people are going.');
  has(html, 'Ann');
  has(html, 'Ben');
  lacks(html, '(you)');
  assert.equal(times(html, 'data-act="going-open"'), 1);
  assert.ok(html.includes('<button class="button cev-cta" type="button" data-act="going-open">I\'m going</button>'));
  assert.ok(!html.includes('<form'));
});

test('the name form asks one thing and says the name is public', () => {
  const html = goingHtml(payload(), ui({ going: 'form', name: 'Sam "the Shark" W.' }));
  assert.ok(html.includes('<form class="cev-form" data-form="attend" novalidate>'));
  assert.ok(html.includes('<label class="cev-label" for="cev-name">Your name or Discord handle</label>'));
  assert.ok(html.includes('value="Sam &quot;the Shark&quot; W."'));
  assert.ok(html.includes('maxlength="40"'));
  assert.ok(html.includes('aria-describedby="cev-name-note"') && !html.includes('aria-invalid'));
  // A problem with the name sits under the field, and the field points to it.
  const wrong = goingHtml(payload(), ui({ going: 'form', name: '...', error: { spot: 'going', message: ACTION_MESSAGES.name } }));
  assert.ok(wrong.includes('aria-describedby="cev-name-note cev-going-alert" aria-invalid="true"'));
  assert.ok(wrong.includes(`<p class="cev-alert" id="cev-going-alert" role="alert">${ACTION_MESSAGES.name}</p>`));
  assert.ok(wrong.indexOf('role="alert"') > wrong.indexOf('id="cev-name"') && wrong.indexOf('role="alert"') < wrong.indexOf('type="submit"'));
  has(html, 'Your name shows on this event. No account needed.');
  assert.ok(html.includes('data-turnstile'));
  assert.ok(html.includes('type="submit">I\'m going</button>'));
  assert.ok(html.includes('data-act="going-cancel">Cancel</button>'));
  assert.equal(times(html, 'data-act="going-open"'), 0);
  assert.equal(times(html, '<input'), 1);
});

test('going: "You are going as Sam." with a quiet way out, then a question in the page', () => {
  const p = payload({ attendees: [{ id: 1, name: 'Ann' }, { id: 7, name: 'Sam' }], me: SAM });
  const html = goingHtml(p, ui());
  has(html, 'You are going as Sam.');
  has(html, 'Sam (you)');
  // The visitor's own name leads the list.
  assert.ok(html.indexOf('Sam <span') < html.indexOf('>Ann<'));
  assert.ok(html.includes('data-act="leave-ask">I can\'t make it</button>'));
  assert.ok(!html.includes('going-open') && !html.includes('<form'));
  const asking = goingHtml(p, ui({ going: 'leaving' }));
  has(asking, 'Take your name off the list? Your ranking and any offer to bring a Cube go with it.');
  assert.ok(asking.includes('data-act="leave-confirm"') && asking.includes('data-act="leave-cancel"'));
  lacks(asking, 'You are going as');
  // No vote, no ranking to lose.
  lacks(goingHtml(payload({ event: event({ cubeMode: 'none', votingOpen: false, voteClosesAt: null }), me: SAM }), ui({ going: 'leaving' })), 'Your ranking');
  // A name that ends with a full stop does not get a second one.
  has(goingHtml(payload({ me: { id: 7, name: 'Sam W.', ranking: [] } }), ui()), 'You are going as Sam W.');
  lacks(goingHtml(payload({ me: { id: 7, name: 'Sam W.', ranking: [] } }), ui()), 'W..');
});

test('after the event, the list looks back: nobody can join, and you can take your name off', () => {
  const over = event({ rsvpOpen: false, votingOpen: false });
  const html = goingHtml(payload({ event: over, attendees: [{ id: 1, name: 'Ann' }] }), ui({ going: 'form' }));
  has(html, 'Who was going');
  has(html, '1 person said they were going.');
  assert.ok(!html.includes('<button') && !html.includes('<form'));
  const mine = goingHtml(payload({ event: over, attendees: [{ id: 7, name: 'Sam' }], me: SAM }), ui());
  has(mine, 'You were on the list as Sam.');
  // The list stays public, so the one way left is taking your own name off.
  assert.equal(times(mine, '<button'), 1);
  has(mine, 'Take my name off');
  has(goingHtml(payload({ event: over }), ui()), 'No one said they were going.');
});

test('a long list of names folds after the first two dozen', () => {
  const attendees = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}` }));
  const html = goingHtml(payload({ attendees }), ui());
  has(html, '30 people are going.');
  assert.ok(html.includes('<details class="cev-fold" data-details="names">'));
  has(html, 'Show 6 more');
  has(html, 'Show fewer');
  assert.equal(times(html, 'class="cev-name"'), 30);
  assert.ok(goingHtml(payload({ attendees }), ui({ open: { names: true } })).includes('data-details="names" open>'));
  assert.ok(!goingHtml(payload({ attendees: attendees.slice(0, 24) }), ui()).includes('<details'));
});

// ---------- Which Cube ----------

test('no Cube section for an event without a Cube, or a cancelled one', () => {
  assert.equal(cubeHtml(payload({ event: event({ cubeMode: 'none', votingOpen: false, voteClosesAt: null }) }), ui()), '');
  assert.equal(cubeHtml(payload({ event: event({ status: 'cancelled', rsvpOpen: false, votingOpen: false }), suggestions: THREE }), ui()), '');
  // A past event whose host never named the Cube has nothing to show.
  assert.equal(cubeHtml(payload({ event: event({ cubeMode: 'set', rsvpOpen: false, votingOpen: false, voteClosesAt: null }) }), ui()), '');
});

test('a Cube the host set: its name, owner, facts, and image with the artist credit', () => {
  const p = payload({ event: event({ cubeMode: 'set', cube: { ...MTGO, lending: 'yes' }, cubeName: MTGO.name, votingOpen: false, voteClosesAt: null }) });
  const html = cubeHtml(p, ui());
  has(html, 'Cube to draft');
  has(html, 'Picked by the organizer.');
  assert.ok(html.includes(`href="${MTGO.listUrl}" target="_blank" rel="noopener">MTGO Vintage Cube`));
  has(html, 'MTGO Vintage Cube (opens the list in a new tab)');
  has(html, 'Owned by Levi Wilson');
  has(html, 'Vintage');
  has(html, '540 cards');
  has(html, 'Can be borrowed');
  assert.ok(html.includes('<img src="https://assets.cubecobra.com/art/lotus.jpg" alt=""'));
  assert.ok(html.includes('referrerpolicy="no-referrer"'));
  has(html, 'Art by Chris Rahn');
  lacks(html, 'Confirmed');
  assert.ok(!html.includes('<button'));
  // The image is left out once it has failed to load, and never comes from another host.
  const blank = cubeHtml(p, ui({ noArt: true }));
  assert.ok(!blank.includes('<img') && !blank.includes('Art by'));
  const elsewhere = cubeHtml(payload({ event: event({ cubeMode: 'set', cube: { ...MTGO, imageUrl: 'https://example.com/x.jpg' }, votingOpen: false }) }), ui());
  assert.ok(!elsewhere.includes('<img'));
});

test('a Cube the host has yet to name', () => {
  const html = cubeHtml(payload({ event: event({ cubeMode: 'set', votingOpen: false, voteClosesAt: null }) }), ui());
  has(html, 'Cube to draft');
  has(html, 'The organizer will pick the Cube.');
});

test('a vote the host confirmed: the Cube, and who can bring it', () => {
  const confirmed = event({ cube: MONO, cubeName: MONO.name, votingOpen: false });
  const html = cubeHtml(payload({ event: confirmed, suggestions: THREE, tally: SIX_BALLOTS }), ui());
  has(html, 'Cube to draft');
  has(html, 'Confirmed by the organizer.');
  has(html, 'Ben can bring it.');
  lacks(html, 'Picked by the organizer.');
  lacks(html, 'Your ranking');
  lacks(html, 'MTGO Vintage Cube');
  assert.ok(!html.includes('<button'));
  // Someone going can offer to bring it when nobody has, and take the offer back.
  const open = [suggestion(1, MONO)];
  const going = cubeHtml(payload({ event: confirmed, suggestions: open, me: SAM }), ui());
  has(going, 'No one has said they can bring it yet.');
  assert.ok(going.includes('data-act="bring" data-id="1">I can bring it'));
  const mine = cubeHtml(payload({ event: confirmed, suggestions: [suggestion(1, MONO, { bringer: 'Sam', iBring: true })], me: SAM }), ui());
  has(mine, 'You can bring it.');
  assert.ok(mine.includes('data-act="unbring" data-id="1">I can no longer bring it'));
  // A confirmed Cube that nobody suggested has no bring line.
  lacks(cubeHtml(payload({ event: event({ cube: ABC, votingOpen: false }), suggestions: open, me: SAM }), ui()), 'bring it');
});

test('an open vote, not going: a read-only list and an invitation', () => {
  const html = cubeHtml(payload({ suggestions: THREE, tally: SIX_BALLOTS }), ui());
  has(html, 'Which Cube to draft');
  has(html, 'People who are going suggest Cubes and rank them. Voting closes Saturday, November 28 at 1:00 pm.');
  has(html, 'Mono Blue');
  has(html, 'Owned by Levi Wilson');
  has(html, 'Themed');
  has(html, '360 cards');
  has(html, 'Plays when the owner is there');
  has(html, 'Suggested by Ann');
  has(html, 'Suggested by Sam');
  has(html, 'Ben can bring it');
  assert.equal(times(html, 'Suggested by'), 2);
  has(html, 'Say you are going to suggest and rank Cubes.');
  assert.ok(html.includes('<button class="cev-inline" type="button" data-act="going-open">Say you are going</button>'));
  // Nothing to press except the invitation, and no ranking tools.
  assert.equal(times(html, '<button'), 1);
  for (const gone of ['I can bring it', 'Withdraw', 'Suggest a Cube', 'Your ranking', 'Save my ranking']) lacks(html, gone);
  has(html, 'Result so far');
});

test('an open vote, going: bring, withdraw, suggest, and rank', () => {
  const p = payload({ suggestions: SAMS, tally: SIX_BALLOTS, me: SAM, attendees: [{ id: 7, name: 'Sam' }] });
  const html = cubeHtml(p, ui());
  lacks(html, 'Say you are going');
  has(html, 'Suggested by you');
  lacks(html, 'Suggested by Sam');
  // Mono Blue has a bringer, so there is no button for it. The other two are open.
  assert.ok(!html.includes('data-act="bring" data-id="1"'));
  assert.ok(html.includes('data-act="bring" data-id="2">I can bring it<span class="visually-hidden">: MTGO Vintage Cube</span>'));
  assert.ok(html.includes('data-act="bring" data-id="3"'));
  // Your own Cube can be withdrawn, and so can one whose suggester has left. Someone else's cannot.
  assert.equal(times(html, 'data-act="withdraw"'), 2);
  assert.ok(html.includes('data-act="withdraw" data-id="2">Withdraw<span class="visually-hidden">: MTGO Vintage Cube</span>'));
  assert.ok(html.includes('data-act="picker-open">Suggest a Cube</button>'));
  has(html, 'Your ranking');
  has(html, 'Rank the Cubes you would like to draft. Pick your first choice, then your next.');
  // Nothing ranked yet: three Cubes to tap, nothing to save or clear.
  assert.equal(times(html, 'data-act="rank-add"'), 3);
  has(html, 'Mono Blue, add to my ranking');
  for (const gone of ['Save my ranking', 'Clear my ranking', 'Saved.', 'Not saved yet.', 'Not ranked yet']) lacks(html, gone);
  assert.ok(!html.includes('rank-up'));
  // The bringer can take the offer back.
  const bringing = cubeHtml(payload({ ...p, suggestions: [suggestion(1, MONO, { bringer: 'Sam', iBring: true })] }), ui());
  has(bringing, 'You can bring it');
  assert.ok(bringing.includes('data-act="unbring" data-id="1">I can no longer bring it'));
  assert.ok(!bringing.includes('data-act="bring"'));
});

test('ranking in progress: places, named move buttons, and a save button only when there is something to save', () => {
  const p = payload({ suggestions: THREE, me: SAM });
  const html = cubeHtml(p, ui({ ranking: [27, 24] }));
  assert.ok(html.indexOf('<span class="cev-rank">1</span><span class="cev-ranked__name">MTGO Vintage Cube') > 0);
  assert.ok(html.indexOf('<span class="cev-rank">2</span><span class="cev-ranked__name">Mono Blue') > html.indexOf('<span class="cev-rank">1</span>'));
  assert.ok(html.includes('data-act="rank-up" data-id="27" aria-label="Move MTGO Vintage Cube up" disabled>'));
  assert.ok(html.includes('data-act="rank-down" data-id="27" aria-label="Move MTGO Vintage Cube down">'));
  assert.ok(html.includes('data-act="rank-up" data-id="24" aria-label="Move Mono Blue up">'));
  assert.ok(html.includes('data-act="rank-down" data-id="24" aria-label="Move Mono Blue down" disabled>'));
  assert.ok(html.includes('data-act="rank-remove" data-id="24" aria-label="Remove Mono Blue from my ranking">'));
  assert.equal(times(html, 'data-act="rank-add"'), 1);
  has(html, 'Not ranked yet');
  has(html, 'Pick a Cube to add it, or use the arrows to change the order.');
  has(html, 'Save my ranking');
  has(html, 'Not saved yet.');
  has(html, 'Clear my ranking');
  lacks(html, 'Saved.');
  assert.ok(html.includes('class="button button--ghost" type="button" data-act="rank-save"'));
});

test('a saved ranking says "Saved." and hides the save button until something changes', () => {
  const p = payload({ suggestions: THREE, me: { ...SAM, ranking: [27, 24, 3] } });
  const saved = cubeHtml(p, ui({ ranking: [27, 24, 3] }));
  has(saved, 'Saved.');
  has(saved, 'Clear my ranking');
  lacks(saved, 'Save my ranking');
  lacks(saved, 'Not saved yet.');
  lacks(saved, 'Not ranked yet');
  has(saved, 'Rank the Cubes you would like to draft. Use the arrows to change the order.');
  assert.equal(times(saved, 'data-act="rank-add"'), 0);
  const changed = cubeHtml(p, ui({ ranking: [24, 27, 3] }));
  has(changed, 'Save my ranking');
  has(changed, 'Not saved yet.');
  // Taking every Cube back out is a change too, and can be saved.
  const emptied = cubeHtml(p, ui({ ranking: [] }));
  has(emptied, 'Save my ranking');
  has(emptied, 'Clear my ranking');
  // A Cube that was withdrawn drops out of the ranking on screen.
  const withdrawn = cubeHtml(payload({ suggestions: THREE.slice(0, 2), me: { ...SAM, ranking: [27, 24] } }), ui({ ranking: [27, 3, 24] }));
  has(withdrawn, 'Saved.');
  assert.equal(times(withdrawn, 'class="cev-ranked"'), 2);
});

test('the suggest picker: search, "I can bring this Cube", results, and the Cube Library link', () => {
  const picker: Picker = { cubes: LIBRARY, query: 'vin"tage', canBring: true, shown: PICKER_PAGE };
  const html = cubeHtml(payload({ suggestions: THREE, me: SAM }), ui({ picker }));
  assert.ok(html.includes('<label class="cev-label" for="cev-search">Search the Cube Library</label>'));
  assert.ok(html.includes('id="cev-search" type="search" value="vin&quot;tage"'));
  assert.ok(html.includes('<input id="cev-bring" type="checkbox" checked />'));
  has(html, 'I can bring this Cube');
  assert.ok(html.includes('<a class="cev-quiet" href="/cube-commonwealth/cubes/" target="_blank" rel="noopener">Browse the Cube Library'));
  assert.ok(html.includes('data-act="picker-close">Close</button>'));
  assert.ok(html.includes('data-results>'));
  // The button that opened it is replaced by the picker.
  assert.ok(!html.includes('data-act="picker-open"'));
  const open = cubeHtml(payload({ suggestions: THREE, me: SAM }), ui({ picker: { ...picker, query: '', canBring: false } }));
  assert.ok(open.includes('<input id="cev-bring" type="checkbox" />'));
  assert.equal(times(open, 'data-act="pick"'), 5);
});

test('the suggest button gives way to a reason once a cap is reached', () => {
  const mine = [1, 2, 3].map((n) => suggestion(n, cube(n, `Cube ${n}`), { mine: true }));
  const html = cubeHtml(payload({ suggestions: mine, me: SAM }), ui({ picker: { cubes: LIBRARY, query: '', canBring: false, shown: 6 } }));
  has(html, 'You have suggested 3 Cubes, the most one person can add.');
  assert.ok(!html.includes('picker-open') && !html.includes('cev-search'));
});

test('an open vote with no suggestions yet', () => {
  const going = cubeHtml(payload({ me: SAM }), ui());
  has(going, 'No Cubes suggested yet. Start with one from the Cube Library.');
  assert.ok(going.includes('data-act="picker-open"'));
  for (const gone of ['Your ranking', 'Result so far', 'Leading now']) lacks(going, gone);
  const visitor = cubeHtml(payload(), ui());
  has(visitor, 'No Cubes suggested yet.');
  lacks(visitor, 'Start with one');
  has(visitor, 'Say you are going to suggest and rank Cubes.');
});

test('the result so far: who leads, first choices as bars, the ballots, and how the count works', () => {
  const html = cubeHtml(payload({ suggestions: THREE, tally: SIX_BALLOTS }), ui());
  has(html, 'Result so far');
  has(html, 'Leading now: Mono Blue');
  has(html, '6 ballots so far. The bars show first choices.');
  has(html, 'Mono Blue 3 first choices');
  has(html, 'MTGO Vintage Cube 2 first choices');
  has(html, 'Abecedarian Cube 1 first choice');
  // Bars are shares of all ballots: 3 of 6, 2 of 6, 1 of 6.
  assert.ok(html.includes('class="cev-bar__fill" width="50%"') && html.includes('width="33.3%"') && html.includes('width="16.7%"'));
  assert.ok(!html.includes('style="'));
  assert.ok(html.includes('<details class="cev-fold cev-how" data-details="how"><summary data-focus="how">How the count works</summary>'));
  has(html, COUNT_RULE);
  has(html, 'Round 1: Mono Blue (3), MTGO Vintage Cube (2), Abecedarian Cube (1). Abecedarian Cube is dropped.');
  has(html, 'Round 2: Mono Blue (4), MTGO Vintage Cube (2). Mono Blue is ahead.');
  lacks(html, 'A tie was broken');
  assert.ok(cubeHtml(payload({ suggestions: THREE, tally: SIX_BALLOTS }), ui({ open: { how: true } })).includes('data-details="how" open>'));
  has(cubeHtml(payload({ suggestions: THREE, tally: tallyRankedChoice([24, 27, 3], [[24]]) }), ui()), '1 ballot so far.');
  // A dead heat says how it was settled.
  has(cubeHtml(payload({ suggestions: THREE, tally: tallyRankedChoice([24, 27, 3], [[24], [27]]) }), ui()), TIE_RULE);
  // Cubes that are nobody's first choice share one line instead of an empty bar each.
  const lopsided = cubeHtml(payload({ suggestions: THREE, tally: tallyRankedChoice([24, 27, 3], [[24], [24, 27]]) }), ui());
  assert.equal(times(lopsided, 'class="cev-bar"'), 1);
  has(lopsided, "2 ballots so far. The bars show first choices. 2 Cubes are nobody's first choice yet.");
  has(cubeHtml(payload({ suggestions: THREE, tally: tallyRankedChoice([24, 27, 3], [[24], [27]]) }), ui()), "1 Cube is nobody's first choice yet.");
  lacks(html, 'first choice yet');
  // No ballots, no result block.
  lacks(cubeHtml(payload({ suggestions: THREE }), ui()), 'Result so far');
});

test('a closed vote names the Cube the vote picked and shows the rounds', () => {
  const closed = event({ votingOpen: false });
  const html = cubeHtml(payload({ event: closed, suggestions: THREE, tally: SIX_BALLOTS }), ui());
  has(html, 'Cube to draft');
  has(html, 'Voting is closed.');
  has(html, 'The vote picked: Mono Blue');
  has(html, 'Picked');
  // The winner leads the list.
  assert.ok(html.indexOf('cev-sug--picked') < html.indexOf('MTGO Vintage Cube'));
  assert.ok(html.includes('data-details="how" open><summary data-focus="how">How the count went</summary>'));
  has(html, 'Round 2: Mono Blue (4), MTGO Vintage Cube (2). Mono Blue wins.');
  for (const gone of ['Leading now', 'Your ranking', 'Suggest a Cube', 'Say you are going', 'Voting closes', 'Withdraw']) lacks(html, gone);
  assert.ok(!html.includes('<button'));
  // People going can still offer to bring a Cube, but not withdraw or rank.
  const going = cubeHtml(payload({ event: closed, suggestions: THREE, tally: SIX_BALLOTS, me: SAM }), ui({ ranking: [24] }));
  assert.equal(times(going, 'data-act="bring"'), 2);
  for (const gone of ['data-act="withdraw"', 'rank-', 'picker-open']) assert.ok(!going.includes(gone), gone);
  // Once the event is over, nobody can.
  assert.ok(!cubeHtml(payload({ event: event({ votingOpen: false, rsvpOpen: false }), suggestions: THREE, tally: SIX_BALLOTS, me: SAM }), ui()).includes('<button'));
  // The visitor can fold the rounds away.
  assert.ok(cubeHtml(payload({ event: closed, suggestions: THREE, tally: SIX_BALLOTS }), ui({ open: { how: false } })).includes('data-details="how"><summary'));
});

test('a closed vote with no ballots leaves the choice to the host', () => {
  const closed = event({ votingOpen: false });
  const html = cubeHtml(payload({ event: closed, suggestions: THREE }), ui());
  has(html, 'Which Cube to draft');
  has(html, 'No votes came in. The organizer will pick the Cube.');
  has(html, 'Mono Blue');
  for (const gone of ['The vote picked', 'How the count', 'Picked', 'Result so far']) lacks(html, gone);
  has(cubeHtml(payload({ event: closed }), ui()), 'No votes came in. The organizer will pick the Cube.');
  // After the event there is no host pick to wait for.
  const over = cubeHtml(payload({ event: event({ votingOpen: false, rsvpOpen: false }), suggestions: THREE }), ui());
  has(over, 'No votes came in.');
  lacks(over, 'will pick the Cube');
});

// ---------- Actions ----------

test('actions: add to a calendar while the event is ahead, and always a link to copy', () => {
  const html = actionsHtml(payload(), ui(), PAGE);
  assert.ok(html.includes('data-act="ics">Add to my calendar</button>'));
  assert.ok(html.includes('href="https://calendar.google.com/calendar/render?action=TEMPLATE&amp;text=Sunday+Cube+Draft&amp;dates=20261129T180000Z%2F20261129T213000Z'));
  has(html, 'Google Calendar (opens in a new tab)');
  assert.ok(html.includes('data-act="copy">Copy link</button>'));
  assert.ok(!html.includes('cev-link'));
  assert.ok(actionsHtml(payload(), ui({ copied: true }), PAGE).includes('data-act="copy">Link copied</button>'));
  const field = actionsHtml(payload({ event: event({ id: 9001, isSample: true }) }), ui({ linkField: true }), PAGE);
  assert.ok(field.includes(`<input class="cev-input" id="cev-link" type="text" readonly value="${PAGE}?event=9001&amp;samples=1" />`));
  has(field, 'Copy this link');
  for (const done of [event({ rsvpOpen: false }), event({ status: 'cancelled', rsvpOpen: false })]) {
    const past = actionsHtml(payload({ event: done }), ui(), PAGE);
    assert.ok(!past.includes('data-act="ics"') && !past.includes('calendar.google.com'));
    assert.ok(past.includes('data-act="copy"'));
  }
});

// ---------- The whole view ----------

test('the view is drawn in parts, top to bottom', () => {
  assert.deepEqual([...PARTS], ['head', 'status', 'going', 'cube', 'actions']);
  const parts = viewParts(payload({ suggestions: THREE, me: SAM }), ui(), PAGE);
  assert.deepEqual(Object.keys(parts), [...PARTS]);
  assert.equal(parts.status, '');
  for (const name of ['head', 'going', 'cube', 'actions'] as const) assert.ok(parts[name].length > 0, name);
  assert.equal(viewParts(payload({ event: event({ cubeMode: 'none', votingOpen: false }) }), ui(), PAGE).cube, '');
});

test('before the event loads: the preview, then a loading line or the problem', () => {
  const { description, locationAddress, tz, startsAt, endsAt, voteClosesAt, cube: c, rsvpOpen, votingOpen, ...summary } = event();
  void [description, locationAddress, tz, startsAt, endsAt, voteClosesAt, c, rsvpOpen, votingOpen];
  const loading = waitingParts(summary, null);
  has(loading.head, 'Sunday Cube Draft');
  has(loading.head, '1:00 pm to 4:30 pm');
  assert.ok(loading.status.includes('<p class="cev-loading" role="status">Loading event details.</p>'));
  assert.deepEqual([loading.going, loading.cube, loading.actions], ['', '', '']);
  const failed = waitingParts(summary, ACTION_MESSAGES.unavailable);
  assert.ok(failed.status.includes(`<p class="cev-alert" role="alert">${ACTION_MESSAGES.unavailable}</p>`));
  assert.ok(failed.status.includes('data-act="retry">Try again</button>'));
  const gone = waitingParts(null, ACTION_MESSAGES.gone, false);
  has(gone.status, 'We could not find that event.');
  assert.ok(!gone.status.includes('<button'));
  assert.ok(gone.head.includes('id="cev-title"'));
});

test('the one error line shows next to what was used, and moves up when that part is gone', () => {
  const error = { spot: 'ballot' as const, message: ACTION_MESSAGES['vote-closed'] };
  const alert = `<p class="cev-alert" role="alert">${ACTION_MESSAGES['vote-closed']}</p>`;
  const voting = payload({ suggestions: THREE, me: SAM });
  const count = (p: EventPayload, u: ViewUi) => PARTS.map((name) => times(viewParts(p, u, PAGE)[name], 'role="alert"'));

  assert.equal(errorSpot(voting, ui()), null);
  // In the ballot while there is a ballot.
  assert.equal(errorSpot(voting, ui({ error })), 'ballot');
  const cubePart = viewParts(voting, ui({ error }), PAGE).cube;
  assert.ok(cubePart.indexOf(alert) > cubePart.indexOf('Your ranking'));
  assert.deepEqual(count(voting, ui({ error })), [0, 0, 0, 1, 0]);
  // The vote closed: the ballot is gone, so the line moves to the Cube section.
  const closed = payload({ event: event({ votingOpen: false }), suggestions: THREE, me: SAM });
  assert.equal(errorSpot(closed, ui({ error })), 'cube');
  assert.deepEqual(count(closed, ui({ error })), [0, 0, 0, 1, 0]);
  // The event was cancelled: no Cube section either, so it lands under the names.
  const cancelled = payload({ event: event({ status: 'cancelled', rsvpOpen: false, votingOpen: false }), suggestions: THREE });
  assert.equal(errorSpot(cancelled, ui({ error })), 'going');
  assert.deepEqual(count(cancelled, ui({ error })), [0, 0, 1, 0, 0]);
  // Every Cube state has a place for a Cube error, and shows it exactly once.
  const cubeError = { spot: 'cube' as const, message: ACTION_MESSAGES.taken };
  const states: [EventPayload, ViewUi][] = [
    [voting, ui({ error: cubeError })],
    [voting, ui({ error: cubeError, picker: { cubes: LIBRARY, query: '', canBring: false, shown: 6 } })],
    [payload({ suggestions: THREE }), ui({ error: cubeError })],
    [payload({ me: SAM }), ui({ error: cubeError })],
    [closed, ui({ error: cubeError })],
    [payload({ event: event({ votingOpen: false }), suggestions: THREE }), ui({ error: cubeError })],
    [payload({ event: event({ cube: MONO, votingOpen: false }), suggestions: THREE, me: SAM }), ui({ error: cubeError })],
    [payload({ event: event({ cubeMode: 'set', votingOpen: false }) }), ui({ error: cubeError })],
    [payload({ suggestions: [1, 2, 3].map((n) => suggestion(n, cube(n, `Cube ${n}`), { mine: true })), me: SAM }), ui({ error: cubeError })],
  ];
  for (const [p, u] of states) assert.deepEqual(count(p, u), [0, 0, 0, 1, 0]);
  // While the picker is open, the line sits inside it.
  const inPicker = viewParts(...states[1], PAGE).cube;
  assert.ok(inPicker.indexOf('role="alert"') > inPicker.indexOf('data-results') && inPicker.indexOf('role="alert"') < inPicker.indexOf('picker-close'));
  assert.deepEqual(count(voting, ui({ error: { spot: 'going', message: 'x' } })), [0, 0, 1, 0, 0]);
  assert.deepEqual(count(voting, ui({ error: { spot: 'actions', message: 'x' } })), [0, 0, 0, 0, 1]);
});

// ---------- Escaping and house style ----------

test('names, titles, and every other value are escaped', () => {
  const bad = '<img src=x onerror=alert(1)>"\'&';
  const safe = '&lt;img src=x onerror=alert(1)&gt;&quot;&#39;&amp;';
  const nasty = cube(66, bad, { owner: bad, style: bad, imageUrl: 'https://assets.cubecobra.com/"><script>alert(1)</script>', imageArtist: bad, listUrl: 'https://cubecobra.com/"onmouseover="alert(1)' });
  const hostile = payload({
    event: event({ title: bad, description: `${bad}\n\n<script>alert(1)</script>`, locationName: bad, locationAddress: bad, kind: bad as EventDetail['kind'], date: bad, startTime: bad, endTime: bad }),
    attendees: [{ id: 1, name: bad }, { id: 7, name: `</li><script>alert(2)</script>` }],
    suggestions: [suggestion(1, nasty, { suggestedBy: bad, bringer: bad }), suggestion(2, cube(67, `${bad} two`), { suggestedBy: bad, mine: true })],
    tally: tallyRankedChoice([66, 67], [[66, 67], [67, 66], [66]]),
    me: { id: 7, name: bad, ranking: [66] },
  });
  const picker: Picker = { cubes: [{ id: 5, name: bad, owner: bad, style: bad, cardCount: 1 }], query: bad, canBring: false, shown: 6 };
  const pages = [
    ...Object.values(viewParts(hostile, ui({ ranking: [66, 67], picker, name: bad, linkField: true, error: { spot: 'cube', message: bad } }), `${PAGE}"><script>`)),
    ...Object.values(viewParts({ ...hostile, me: null }, ui({ going: 'form', name: bad, error: { spot: 'going', message: bad } }), PAGE)),
    ...Object.values(viewParts({ ...hostile, event: { ...hostile.event, votingOpen: false } }, ui(), PAGE)),
    ...Object.values(viewParts({ ...hostile, event: { ...hostile.event, cubeMode: 'set', cube: nasty, votingOpen: false } }, ui(), PAGE)),
    ...Object.values(waitingParts({ ...hostile.event }, bad)),
    pickerResultsHtml(picker, []),
  ];
  for (const html of pages) {
    assert.ok(!/<script|<img src=x|<\/li><script/.test(html), html);
    // Outside of escaped text, no attribute can be opened by a stray quote.
    assert.ok(!/onerror=alert\(1\)>"|"onmouseover="/.test(html), html);
  }
  const all = pages.join('\n');
  assert.ok(all.includes(`<h3 class="cev-title" id="cev-title" tabindex="-1">${safe}</h3>`));
  assert.ok(all.includes(`aria-label="Move ${safe} up"`));
  assert.ok(all.includes(`value="${safe}"`));
  assert.ok(all.includes(`Suggested by ${safe}`));
  assert.ok(all.includes(`Art by ${safe}`));
  assert.ok(all.includes('&lt;script&gt;alert(1)&lt;/script&gt;'));
});

test('ids and counts that are not numbers cannot break out of the markup', () => {
  const evil = '1" onfocus="alert(1)' as unknown as number;
  const odd = payload({
    suggestions: [suggestion(evil, cube(evil, 'Odd Cube'), { mine: true }), suggestion(2, MONO)],
    tally: { ballots: evil, winner: 24, tied: false, rounds: [{ counts: [{ cubeId: 24, votes: evil }], eliminated: null }] },
    me: { ...SAM, ranking: [evil] },
  });
  const picker: Picker = { cubes: [{ id: evil, name: 'Odd Cube', owner: 'x', style: 'y', cardCount: evil }], query: '', canBring: false, shown: 6 };
  const html = Object.values(viewParts(odd, ui({ ranking: [evil], picker }), PAGE)).join('\n');
  assert.ok(!html.includes('onfocus="alert'), html);
  assert.ok(html.includes('data-id="NaN"'));
});

test('a payload with holes in it still draws', () => {
  const holey = payload({
    event: event({ title: null as unknown as string, locationName: undefined as unknown as null, description: undefined as unknown as null }),
    attendees: [{ id: 1, name: null as unknown as string }],
    suggestions: [suggestion(1, cube(1, null as unknown as string, { owner: null as unknown as string, style: null as unknown as string, listUrl: null as unknown as string }), { suggestedBy: undefined as unknown as null })],
    tally: tallyRankedChoice([1], [[1]]),
    me: { id: 1, name: null as unknown as string, ranking: [1] },
  });
  const parts = viewParts(holey, ui({ ranking: [1] }), PAGE);
  assert.ok(parts.head.includes('id="cev-title"') && parts.going.includes('You are going as') && parts.cube.includes('Your ranking'));
  // Nothing a person reads says "null" or "undefined".
  assert.ok(!/undefined|null/.test(text(parts.head + parts.going + parts.cube)));
});

test('a Cube whose list link is not plain https is named without a link', () => {
  for (const listUrl of ['javascript:alert(1)', 'http://example.com/list', 'data:text/html,x', '']) {
    const html = cubeHtml(payload({ suggestions: [suggestion(1, cube(1, 'Odd Cube', { listUrl }))] }), ui());
    assert.ok(!html.includes('<a '), listUrl);
    has(html, 'Odd Cube');
  }
  // A lending value the page does not know is left out rather than printed raw.
  lacks(cubeHtml(payload({ suggestions: [suggestion(1, cube(1, 'Odd Cube', { lending: 'constructor' }))] }), ui()), 'constructor');
});

/** Every state the view can be in, for the house-style checks. */
function everyState(): string[] {
  const picker: Picker = { cubes: LIBRARY, query: '', canBring: false, shown: 3 };
  const closed = event({ votingOpen: false });
  const tied = tallyRankedChoice([24, 27, 3], [[24], [27]]);
  const many = Array.from({ length: 30 }, (_, i) => ({ id: i + 1, name: `Player ${i + 1}` }));
  const errors = (Object.keys(ACTION_MESSAGES) as (keyof typeof ACTION_MESSAGES)[]).map((code) => ui({ error: { spot: 'going', message: ACTION_MESSAGES[code] } }));
  const views: [EventPayload, ViewUi][] = [
    [payload(), ui()],
    [payload({ attendees: many, suggestions: THREE, tally: SIX_BALLOTS }), ui({ going: 'form' })],
    [payload({ attendees: [{ id: 7, name: 'Sam' }], suggestions: THREE, tally: tied, me: SAM }), ui({ going: 'leaving', ranking: [24], picker, linkField: true })],
    [payload({ suggestions: THREE, tally: SIX_BALLOTS, me: { ...SAM, ranking: [24, 27] } }), ui({ ranking: [24, 27], copied: true, picker: { ...picker, cubes: 'loading' } })],
    [payload({ suggestions: THREE, me: SAM }), ui({ picker: { ...picker, cubes: 'error' } })],
    [payload({ suggestions: THREE, me: SAM }), ui({ picker: { ...picker, query: 'nothing matches this' } })],
    [payload({ suggestions: [1, 2, 3].map((n) => suggestion(n, cube(n, `Cube ${n}`), { mine: true, iBring: true, bringer: 'Sam' })), me: SAM }), ui()],
    [payload({ suggestions: Array.from({ length: 12 }, (_, n) => suggestion(n + 1, cube(n + 1, `Cube ${n + 1}`))), me: SAM }), ui()],
    [payload({ me: SAM }), ui()],
    [payload({ event: closed, suggestions: THREE, tally: tied, me: SAM }), ui()],
    [payload({ event: closed, suggestions: THREE }), ui()],
    [payload({ event: event({ cube: MTGO, votingOpen: false }), suggestions: THREE, me: SAM }), ui()],
    [payload({ event: event({ cubeMode: 'set', cube: { ...MTGO, lending: 'no' }, votingOpen: false }) }), ui()],
    [payload({ event: event({ cubeMode: 'set', votingOpen: false }) }), ui()],
    [payload({ event: event({ cubeMode: 'none', kind: 'class', votingOpen: false }) }), ui()],
    [payload({ event: event({ status: 'cancelled', rsvpOpen: false, votingOpen: false, isSample: true }), attendees: many }), ui()],
    [payload({ event: event({ rsvpOpen: false, votingOpen: false }), suggestions: THREE, tally: SIX_BALLOTS, me: SAM }), ui()],
    ...errors.map((u): [EventPayload, ViewUi] => [payload(), u]),
  ];
  return [
    ...views.flatMap(([p, u]) => Object.values(viewParts(p, u, PAGE))),
    ...Object.values(waitingParts(null, null)),
    ...Object.values(waitingParts(null, ACTION_MESSAGES.gone, false)),
    ...[0, 1, 2, 30].flatMap((n) => [goingLine(n, true), goingLine(n, false)]),
    ...[0, 2, 12, 24, 48].map((hours) => voteClosesSentence(event({ voteClosesAt: new Date(Date.parse('2026-11-29T18:00:00.000Z') - hours * 3_600_000).toISOString() }))),
    COUNT_RULE,
    TIE_RULE,
    suggestLimit([]),
  ];
}

// Built from character codes, so this file holds neither dash itself.
const DASHES = new RegExp(`[${String.fromCharCode(0x2014, 0x2013)}]`);

test('no em dashes or en dashes in any copy', () => {
  assert.ok(DASHES.test(String.fromCharCode(0x2014)) && DASHES.test(String.fromCharCode(0x2013)) && !DASHES.test('1st-draft'));
  for (const html of everyState()) assert.ok(!DASHES.test(html), html);
});

test('"Cube" is capitalized wherever a person reads it', () => {
  for (const html of everyState()) {
    const lower = text(html).match(/\bcubes?\b/);
    assert.equal(lower, null, text(html));
    assert.ok(!/aria-label="[^"]*\bcubes?\b/.test(html), html);
  }
});

test('ids are unique within the view, and every button says what kind it is', () => {
  const picker: Picker = { cubes: LIBRARY, query: '', canBring: false, shown: 6 };
  const views: [EventPayload, ViewUi][] = [
    [payload({ suggestions: THREE, tally: SIX_BALLOTS, me: SAM, attendees: [{ id: 7, name: 'Sam' }] }), ui({ ranking: [24], picker, linkField: true, going: 'leaving' })],
    [payload({ suggestions: THREE, tally: SIX_BALLOTS }), ui({ going: 'form' })],
  ];
  for (const [p, u] of views) {
    const html = Object.values(viewParts(p, u, PAGE)).join('\n');
    const ids = [...html.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
    assert.deepEqual(ids, [...new Set(ids)]);
    assert.ok(ids.every((id) => id.startsWith('cev-')));
    for (const target of [...html.matchAll(/ (?:for|aria-labelledby|aria-describedby)="([^"]+)"/g)].map((m) => m[1])) assert.ok(ids.includes(target), target);
    for (const button of html.match(/<button[^>]*>/g) ?? []) assert.ok(/ type="(button|submit)"/.test(button), button);
    for (const className of [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) => m[1].split(' '))) {
      assert.ok(/^(cev-|cev$|button$|button--ghost$|visually-hidden$)/.test(className), className);
    }
  }
});
