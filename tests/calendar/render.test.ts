// Tests for the calendar page's HTML builders and the small rules beside them:
// the month grid, the day card, "Coming up", accessible names, escaping, the
// page address, and the keys that move through the grid.
// Run: node --test tests/calendar/render.test.ts
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  MAX_LINES, MAX_MARKS, NOT_FOUND_LINE,
  dateFaceHtml, dayCardHtml, dayLabel, dialogHtml, eventBarHtml, eventLabel, eventRowHtml, goingWords, groupByDate, isoCube, keyTarget, kindKey, legendHtml,
  miniCube, monthGridHtml, monthIsEmpty, monthProblemHtml, monthStatusHtml, pickUpcoming, readView, shellHtml, shortTime, tabStopFor, upcomingHtml, viewQuery, weekdayRowHtml,
  type DayOptions,
} from '../../src/lib/calendar/render.ts';
import { zonedToUtc } from '../../src/lib/calendar/dates.ts';
import { EVENT_KINDS, type EventSummary } from '../../src/lib/calendar/shared.ts';

const TZ = 'America/Indiana/Indianapolis';
const SUGGEST = '/cube-commonwealth/events/suggest/';
const TODAY = '2026-11-23';

let nextId = 1;
const ev = (over: Partial<EventSummary> = {}): EventSummary => ({
  id: nextId++, title: 'Sunday Cube Draft', kind: 'draft', date: '2026-11-22', startTime: '13:00', endTime: '16:30', locationName: 'The Table',
  status: 'approved', going: 8, cubeMode: 'vote', cubeName: null, isSample: false, ...over,
});
/** `n` events on one day, an hour apart from 9:00 am, with a different kind each. */
const dayOf = (date: string, n: number, over: Partial<EventSummary> = {}) =>
  Array.from({ length: n }, (_, i) => ev({ date, startTime: `${String(9 + i).padStart(2, '0')}:00`, endTime: `${String(10 + i).padStart(2, '0')}:00`, title: `Event ${i + 1}`, kind: EVENT_KINDS[i % EVENT_KINDS.length].key, ...over }));

const opts = (over: Partial<DayOptions> = {}): DayOptions => ({ today: TODAY, suggestUrl: SUGGEST, going: new Set<number>(), ...over });
const grid = (month: string, events: EventSummary[] | null, tabStop: string | null = null) => monthGridHtml(month, events, { today: TODAY, tabStop });

const count = (html: string, needle: string | RegExp) => html.split(needle).length - 1;
/** What a person would read: icons and tags out, entities back to characters. */
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
    .trim();
/** The HTML of one day button in a grid. */
const dayButton = (html: string, date: string) => {
  const found = html.match(new RegExp(`<button[^>]*data-date="${date}"[\\s\\S]*?</button>`));
  assert.ok(found, `no button for ${date}`);
  return found[0];
};
const labelOf = (html: string) => (html.match(/aria-label="([^"]*)"/)?.[1] ?? '').replace(/&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');

// ---------- Words ----------

test('short times drop the minutes on the hour', () => {
  assert.equal(shortTime('10:00'), '10 am');
  assert.equal(shortTime('18:30'), '6:30 pm');
  assert.equal(shortTime('13:00'), '1 pm');
  assert.equal(shortTime('12:00'), '12 pm');
  assert.equal(shortTime('00:00'), '12 am');
  assert.equal(shortTime('00:05'), '12:05 am');
  assert.equal(shortTime('23:59'), '11:59 pm');
  assert.equal(shortTime('soon'), 'soon', 'a value that is not a time is passed through');
});

test('a day button has a full name', () => {
  assert.equal(dayLabel('2026-11-22', dayOf('2026-11-22', 3), TODAY), 'Sunday, November 22, 3 events');
  assert.equal(dayLabel('2026-11-22', dayOf('2026-11-22', 1), TODAY), 'Sunday, November 22, 1 event');
  assert.equal(dayLabel('2026-11-24', [], TODAY), 'Tuesday, November 24, no events');
  assert.equal(dayLabel(TODAY, dayOf(TODAY, 2), TODAY), 'Today, Monday, November 23, 2 events');
  assert.equal(dayLabel('2026-11-22', [...dayOf('2026-11-22', 2), ev({ status: 'cancelled' })], TODAY), 'Sunday, November 22, 3 events, 1 cancelled');
  assert.equal(dayLabel('2026-11-22', null, TODAY), 'Sunday, November 22', 'while the month loads, no count is claimed');
});

test('an event row has a full name: the title, then the time and the kind, then the rest', () => {
  const e = ev({ going: 12 });
  assert.equal(eventLabel(e), 'Sunday Cube Draft, 1:00 pm to 4:30 pm, Draft, The Table, 12 going');
  assert.equal(eventLabel(e, { withDate: true, mine: true }), 'Sunday Cube Draft, Sunday, November 22, 1:00 pm to 4:30 pm, Draft, The Table, 12 going, you are going');
  assert.equal(eventLabel(ev({ status: 'cancelled', isSample: true, locationName: null, going: 0, kind: 'class' })), 'Sunday Cube Draft, 1:00 pm to 4:30 pm, Class, cancelled, sample event');
});

test('the going count says nothing when nobody is going yet', () => {
  assert.equal(goingWords(8), '8 going');
  assert.equal(goingWords(1), '1 going');
  assert.equal(goingWords(0), '');
});

test('an unknown kind draws as other', () => {
  assert.equal(kindKey('draft'), 'draft');
  assert.equal(kindKey('celebration'), 'celebration');
  assert.equal(kindKey('"><script>'), 'other');
  assert.equal(kindKey(undefined), 'other');
  assert.match(isoCube('" onload="x'), /class="cal-iso cal-k-other"/);
  assert.match(miniCube('nope'), /class="cal-mcw cal-k-other"/);
});

// ---------- The month grid ----------

test('a month that starts on a Sunday: November 2026', () => {
  const html = grid('2026-11', []);
  assert.equal(count(html, 'role="row"'), 1 + 5, 'the weekday row and five weeks');
  assert.equal(count(html, 'role="gridcell"'), 35);
  assert.equal(count(html, '<button'), 30, 'every day of the month is a button');
  assert.equal(count(html, 'cal-day--out'), 5, 'December 1 to 5 fill the last week');
  // The first week starts on the 1st, with no filler before it.
  const firstWeek = html.split('class="cal-week"')[1];
  assert.match(firstWeek, /^[^<]*>\s*<div class="cal-cell" role="gridcell"><button[^>]*data-date="2026-11-01"/);
  assert.match(html, /^<div class="cal-grid" role="grid" aria-labelledby="cal-month-name">/);
  assert.ok(!html.includes('aria-busy'), 'a loaded month is not busy');
});

test('a month that needs six weeks: August 2026', () => {
  const html = grid('2026-08', []);
  assert.equal(count(html, 'class="cal-week"'), 6);
  assert.equal(count(html, 'role="gridcell"'), 42);
  assert.equal(count(html, '<button'), 31);
  assert.equal(count(html, 'cal-day--out'), 11, 'six days of July before, five of September after');
  assert.match(dayButton(html, '2026-08-01'), /aria-label="Saturday, August 1, no events"/);
  assert.match(dayButton(html, '2026-08-31'), /aria-label="Monday, August 31, no events"/);
});

test('a month that fits in four weeks: February 2026', () => {
  const html = grid('2026-02', []);
  assert.equal(count(html, 'class="cal-week"'), 4);
  assert.equal(count(html, '<button'), 28);
  assert.equal(count(html, 'cal-day--out'), 0);
});

test('filler days are dimmed, say nothing, and are not buttons', () => {
  const html = grid('2026-12', dayOf('2026-11-30', 2));
  const fillers = html.match(/<div class="cal-cell" role="gridcell"><span class="cal-day cal-day--out"[\s\S]*?<\/div>/g) ?? [];
  assert.equal(fillers.length, 4, 'November 29 and 30, January 1 and 2');
  for (const cell of fillers) {
    assert.match(cell, /<span class="cal-day cal-day--out" aria-hidden="true">/);
    assert.ok(!cell.includes('<button') && !cell.includes('data-date') && !cell.includes('cal-iso'), 'no button, no date, no events');
  }
  // They stay cells of the grid, so every row has seven.
  for (const week of html.split('class="cal-week"').slice(1)) assert.equal(count(week, 'role="gridcell"'), 7);
});

test('the weekday row names every day in full for screen readers', () => {
  const html = weekdayRowHtml();
  assert.equal(count(html, 'role="columnheader"'), 7);
  for (const name of ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']) {
    assert.ok(html.includes(`aria-label="${name}"`), name);
    assert.ok(html.includes(`<span class="cal-dow__full" aria-hidden="true">${name}</span>`));
    assert.ok(html.includes(`<span class="cal-dow__short" aria-hidden="true">${name.slice(0, 3)}</span>`));
  }
  assert.ok(html.indexOf('Sunday') < html.indexOf('Monday') && html.indexOf('Friday') < html.indexOf('Saturday'), 'Sunday first, Saturday last');
});

test('a day with 0, 1, 4, and 6 events', () => {
  const events = [...dayOf('2026-11-03', 1), ...dayOf('2026-11-04', 4), ...dayOf('2026-11-05', 6)];
  const html = grid('2026-11', events);

  const none = dayButton(html, '2026-11-02');
  assert.equal(count(none, 'cal-iso'), 0);
  assert.ok(!none.includes('cal-day__marks') && !none.includes('cal-day__lines'));
  assert.equal(labelOf(none), 'Monday, November 2, no events');

  const one = dayButton(html, '2026-11-03');
  assert.equal(count(one, '<svg class="cal-iso'), 1);
  assert.match(one, /data-n="1"/);
  assert.equal(count(one, 'class="cal-day__line '), 1);
  assert.ok(!one.includes('cal-day__plus') && !one.includes('cal-day__more'));
  assert.equal(labelOf(one), 'Tuesday, November 3, 1 event');

  const four = dayButton(html, '2026-11-04');
  assert.equal(count(four, '<svg class="cal-iso'), 4);
  assert.match(four, /data-n="4"/);
  assert.equal(count(four, 'class="cal-day__line '), MAX_LINES);
  assert.ok(!four.includes('cal-day__plus'), 'four mini-Cubes need no "+"');
  assert.match(four, /<span class="cal-day__more">\+2 more<\/span>/);
  assert.equal(labelOf(four), 'Wednesday, November 4, 4 events');

  const six = dayButton(html, '2026-11-05');
  assert.equal(count(six, '<svg class="cal-iso'), MAX_MARKS, 'at most four mini-Cubes');
  assert.match(six, /<span class="cal-day__plus">\+2<\/span>/);
  assert.match(six, /data-n="5"/);
  assert.equal(count(six, 'class="cal-day__line '), MAX_LINES);
  assert.match(six, /<span class="cal-day__more">\+4 more<\/span>/);
  assert.equal(labelOf(six), 'Thursday, November 5, 6 events');
});

test('event lines use the short time and come in start order', () => {
  const html = grid('2026-11', [ev({ date: '2026-11-10', startTime: '18:30', title: 'Late' }), ev({ date: '2026-11-10', startTime: '10:00', title: 'Early' })]);
  const day = dayButton(html, '2026-11-10');
  assert.match(day, /<b>10 am<\/b>Early<\/span><span class="cal-day__line cal-k-draft"><b>6:30 pm<\/b>Late/);
});

test('each mini-Cube carries its kind', () => {
  const day = dayButton(grid('2026-11', dayOf('2026-11-06', 5)), '2026-11-06');
  assert.deepEqual([...day.matchAll(/<svg class="cal-iso cal-k-(\w+)"/g)].map((m) => m[1]), ['draft', 'class', 'meetup', 'celebration']);
  assert.match(day, /class="cal-day__line cal-k-draft"/);
  assert.match(day, /class="cal-day__line cal-k-class"/);
});

test('today is marked, past days are quieter, and only one day takes the tab stop', () => {
  const html = grid('2026-11', [], tabStopFor('2026-11', null, TODAY));
  const today = dayButton(html, TODAY);
  assert.match(today, /class="cal-day is-today"/);
  assert.match(today, /aria-current="date"/);
  assert.match(today, /<span class="cal-day__today">Today<\/span>/);
  assert.match(today, /tabindex="0"/);
  assert.match(dayButton(html, '2026-11-22'), /class="cal-day is-past"/);
  assert.match(dayButton(html, '2026-11-24'), /class="cal-day"/);
  assert.equal(count(html, 'tabindex="0"'), 1);
  assert.equal(count(html, 'tabindex="-1"'), 29);
  assert.equal(count(html, 'aria-current'), 1);
});

test('a month that is still loading draws its days and says it is busy', () => {
  const html = grid('2026-11', null);
  assert.match(html, /role="grid" aria-labelledby="cal-month-name" aria-busy="true"/);
  assert.equal(count(html, '<button'), 30);
  assert.equal(count(html, 'cal-iso'), 0);
  assert.equal(labelOf(dayButton(html, '2026-11-22')), 'Sunday, November 22');
});

test('cancelled events are outlined and struck through in the grid, and counted in the name', () => {
  const html = grid('2026-11', [ev({ date: '2026-11-12', status: 'cancelled', title: 'Called Off' }), ev({ date: '2026-11-12', startTime: '18:00' })]);
  const day = dayButton(html, '2026-11-12');
  assert.match(day, /<svg class="cal-iso cal-k-draft is-off"/);
  assert.match(day, /<span class="cal-day__line cal-k-draft is-off"><b>1 pm<\/b>Called Off<\/span>/);
  assert.equal(count(day, 'is-off'), 2, 'only the cancelled one');
  assert.equal(labelOf(day), 'Thursday, November 12, 2 events, 1 cancelled');
});

test('an empty month is known from its own days only', () => {
  assert.equal(monthIsEmpty('2026-12', []), true);
  assert.equal(monthIsEmpty('2026-12', [ev({ date: '2026-11-30' })]), true, 'a filler day from November does not count');
  assert.equal(monthIsEmpty('2026-12', [ev({ date: '2026-12-06', status: 'cancelled' })]), false);
});

test('the lines under the grid', () => {
  const empty = monthStatusHtml('empty', SUGGEST);
  assert.equal(text(empty), 'Nothing on the calendar this month yet. Suggest one');
  assert.match(empty, new RegExp(`<a class="cal-more" href="${SUGGEST}">Suggest one<svg class="cal-more__arrow"`));
  assert.equal(text(monthStatusHtml('loading', SUGGEST)), 'Loading events.');
  assert.match(monthStatusHtml('loading', SUGGEST), /visually-hidden/, 'the days show the wait; the words are for screen readers');
  assert.equal(monthStatusHtml('ok', SUGGEST), '');
  const problem = monthProblemHtml();
  assert.match(problem, /role="alert"/);
  assert.match(problem, /<button class="button button--ghost" type="button" data-cal="retry">Try again<\/button>/);
  assert.equal(text(problem), 'We could not load the events. Please check your connection and try again. Try again');
  assert.equal(NOT_FOUND_LINE, 'We could not find that event. It may have been removed.');
});

test('the legend names the five kinds', () => {
  const html = legendHtml();
  assert.equal(text(html), 'Draft Class Meetup Celebration Other');
  assert.equal(count(html, '<svg class="cal-iso'), 5);
  assert.match(html, /aria-label="Event kinds"/);
});

// ---------- Hostile text ----------

const HOSTILE = ev({ date: '2026-11-22', title: '<img src=x onerror=alert(1)> "Draft" & \'Friends\'', locationName: '"><script>alert(2)</script>', going: 3 });

test('hostile titles and place names are escaped everywhere', () => {
  const pages = [
    grid('2026-11', [HOSTILE]),
    dayCardHtml('2026-11-22', [HOSTILE], opts()),
    upcomingHtml([HOSTILE], opts()),
    eventRowHtml(HOSTILE, { cube: '3d', mine: true }),
    eventRowHtml(HOSTILE, { cube: 'flat', withDate: true, today: TODAY }),
  ];
  for (const html of pages) {
    assert.ok(!/<img|<script|onerror=alert\(1\)>/.test(html), 'no tag gets through');
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt; &quot;Draft&quot; &amp; &#39;Friends&#39;'), 'the title is there, escaped');
    // Every attribute value is still one value: the quotes in the title did not end it early.
    for (const [, value] of html.matchAll(/aria-label="([^"]*)"/g)) assert.ok(!value.includes('<') && !value.includes('>'));
  }
  assert.ok(pages[1].includes('&quot;&gt;&lt;script&gt;alert(2)&lt;/script&gt;'), 'the place is there, escaped');
  assert.equal(labelOf(pages[3]), '<img src=x onerror=alert(1)> "Draft" & \'Friends\', 1:00 pm to 4:30 pm, Draft, "><script>alert(2)</script>, 3 going, you are going');
  assert.ok(text(pages[1]).includes('<img src=x onerror=alert(1)> "Draft" & \'Friends\''), 'a person reads it as it was typed');
});

test('values from the server that are not what the types promise cannot break the markup', () => {
  const odd = ev({ id: '7" onclick="x' as unknown as number, kind: '"><b>' as unknown as EventSummary['kind'], startTime: '<em>', endTime: '"', going: '<u>' as unknown as number });
  const row = eventRowHtml(odd, { cube: '3d' });
  assert.match(row, /data-id="0"/);
  assert.match(row, /class="cal-ev cal-k-other"/);
  assert.ok(!/<em>|<u>|<b>|onclick/.test(row));
  assert.ok(row.includes('&lt;em&gt; to &quot;'));
  const cell = dayButton(grid('2026-11', [odd]), '2026-11-22');
  assert.ok(!/<em>|<u>|onclick/.test(cell));
  assert.ok(cell.includes('<b>&lt;em&gt;</b>'), 'a time that is not a time prints as it came, escaped');
  assert.match(cell, /class="cal-day__line cal-k-other"/);
});

// ---------- Event rows ----------

test('an event row shows the time, title, kind, place, and how many are going', () => {
  const row = eventRowHtml(ev({ going: 8 }), { cube: '3d' });
  assert.match(row, /^<button type="button" class="cal-ev cal-k-draft" data-id="\d+" data-cube="row" aria-label="/);
  assert.equal(text(row), '1:00 pm to 4:30 pm Sunday Cube Draft The Table Draft 8 going 8 going', 'the count is there twice: one for phones, one for wider rows');
  assert.match(row, /<span class="cal-ev__time">1:00 pm to 4:30 pm<\/span>/);
  assert.match(row, /<span class="cal-tag">Draft<\/span>/);
  // The true 3D mini-Cube: six faces, with the marks the day Cube's opening looks for.
  assert.equal(count(row, '<i></i>'), 6);
  assert.match(row, /data-cube="lift"/);
  assert.match(row, /data-cube="shadow"/);
  assert.equal(count(row, 'data-cube="fade"'), 4);
  assert.ok(!row.includes('cal-ev__date'), 'the day list leaves the date to its heading');
});

test('a row with nobody going, no place, and a sample tag', () => {
  const row = eventRowHtml(ev({ going: 0, locationName: null, isSample: true, kind: 'meetup' }), { cube: '3d' });
  assert.equal(text(row), '1:00 pm to 4:30 pm Sunday Cube Draft Meetup Sample');
  assert.match(row, /<span class="cal-tag cal-tag--sample">Sample<\/span>/);
  assert.ok(!row.includes('cal-ev__place') && !row.includes('cal-ev__count') && !row.includes('cal-ev__going'));
});

test('a cancelled row is marked in words and by class', () => {
  const row = eventRowHtml(ev({ status: 'cancelled' }), { cube: '3d' });
  assert.match(row, /class="cal-ev cal-k-draft is-off"/);
  assert.match(row, /<span class="cal-tag cal-tag--off">Cancelled<\/span>/);
  assert.equal(labelOf(row), 'Sunday Cube Draft, 1:00 pm to 4:30 pm, Draft, cancelled, The Table, 8 going');
  assert.match(eventRowHtml(ev({ status: 'cancelled' }), { cube: 'flat' }), /<svg class="cal-iso cal-k-draft is-off"/);
});

test('a row the visitor is going to carries a check and the words', () => {
  const row = eventRowHtml(ev(), { cube: '3d', mine: true });
  assert.match(row, /<span class="cal-ev__mine"><svg class="cal-check"[\s\S]*?<\/svg>You are going<\/span>/);
  assert.match(labelOf(row), /, you are going$/);
  assert.ok(!eventRowHtml(ev(), { cube: '3d' }).includes('You are going'));
});

test('the arrow after a link is a hidden picture, never text a screen reader would read', () => {
  const links = [monthStatusHtml('empty', SUGGEST), dayCardHtml('2026-12-05', [], opts()), dayCardHtml('2026-11-29', [ev({ date: '2026-11-29' })], opts()), upcomingHtml([], opts())];
  for (const html of links) {
    const link = html.match(/<a class="cal-more"[\s\S]*?<\/a>/)?.[0] ?? '';
    assert.match(link, /<svg class="cal-more__arrow"[^>]*aria-hidden="true"/);
    assert.ok(!/\u2192|&rarr;|text-link/.test(html), 'no arrow character, and not the class that adds one in CSS');
    assert.match(text(link), /^Suggest (one|an event( for this day)?)$/);
  }
});

test('the 3D mini-Cube has six faces inside the boxes that tilt it, turn it, and rest it', () => {
  const cube = miniCube('class');
  assert.match(cube, /^<span class="cal-mcw cal-k-class"><span class="cal-mcx"><span class="cal-mcy"><span class="cal-mc">(<i><\/i>){6}<\/span><\/span><\/span><\/span>$/);
});

// ---------- The day card ----------

test('the day card lists that day in start order under the date', () => {
  const events = [ev({ title: 'Evening', startTime: '18:00', endTime: '22:00' }), ev({ title: 'Morning', startTime: '10:00', endTime: '12:30' }), ev({ title: 'Another Day', date: '2026-11-23' })];
  const html = dayCardHtml('2026-11-22', events, opts());
  assert.match(html, /<h2 class="cal-lhead__title" id="cal-day-title" tabindex="-1">Sunday, November 22<\/h2>/);
  assert.match(html, /<p class="cal-lhead__count">2 events<\/p>/);
  assert.match(html, /<button type="button" class="cal-iconbtn" data-cal="close" aria-label="Close">/);
  assert.equal(count(html, 'class="cal-ev '), 2);
  assert.ok(html.indexOf('Morning') < html.indexOf('Evening'));
  assert.ok(!html.includes('Another Day'));
  assert.match(html, /<ul class="cal-evs" role="list">/);
  assert.equal(count(html, 'data-cube="head"'), 1);
  assert.equal(count(html, 'data-cube="foot"'), 1);
  assert.equal(count(html, 'data-cube="row"'), 2);
});

test('the day card counts one event in the singular', () => {
  assert.match(dayCardHtml('2026-11-22', [ev()], opts()), /<p class="cal-lhead__count">1 event<\/p>/);
});

test('the suggest link carries the day from today on, and not for a day gone by', () => {
  const future = dayCardHtml('2026-11-29', [ev({ date: '2026-11-29' })], opts());
  assert.match(future, /<a class="cal-more" href="\/cube-commonwealth\/events\/suggest\/\?date=2026-11-29">Suggest an event for this day<svg/);
  assert.match(dayCardHtml(TODAY, [ev({ date: TODAY })], opts()), /\?date=2026-11-23">Suggest an event for this day/);
  const past = dayCardHtml('2026-11-22', [ev()], opts());
  assert.match(past, /<a class="cal-more" href="\/cube-commonwealth\/events\/suggest\/">Suggest an event<svg/);
});

test('an empty day still has a card', () => {
  const future = dayCardHtml('2026-12-05', [], opts());
  assert.equal(text(future), 'Open day Saturday, December 5 Nothing planned yet. Suggest an event for this day');
  assert.match(future, /href="\/cube-commonwealth\/events\/suggest\/\?date=2026-12-05"/);
  assert.match(future, /class="cal-empty" data-cube="foot"/);
  assert.equal(text(dayCardHtml('2026-11-02', [], opts())), 'Past day Monday, November 2 Nothing was planned. Suggest an event');
  // A day whose events belong to other days is empty too.
  assert.match(dayCardHtml('2026-12-05', [ev({ date: '2026-12-06' })], opts()), /Nothing planned yet\./);
});

test('a day whose month is not loaded says so, and never says nothing is planned', () => {
  const loading = dayCardHtml('2026-12-05', 'loading', opts());
  assert.equal(text(loading), 'Loading Saturday, December 5 Loading events.');
  assert.match(loading, /role="status"/);
  const error = dayCardHtml('2026-12-05', 'error', opts());
  assert.equal(text(error), 'Could not load Saturday, December 5 We could not load this day. Try again');
  assert.match(error, /role="alert"/);
  assert.match(error, /data-cal="retry"/);
  for (const html of [loading, error]) {
    assert.ok(!html.includes('Nothing planned'));
    assert.match(html, /id="cal-day-title"/, 'the dialog still has its heading');
  }
});

test('the day card marks the events the visitor is going to', () => {
  const a = ev({ title: 'Going To This' });
  const b = ev({ title: 'Not This', startTime: '18:00' });
  const html = dayCardHtml('2026-11-22', [a, b], opts({ going: new Set([a.id]) }));
  assert.equal(count(html, 'You are going'), 1);
  assert.ok(html.indexOf('Going To This') < html.indexOf('You are going') && html.indexOf('You are going') < html.indexOf('Not This'));
});

test('the bar over an event card goes back to the day by name', () => {
  const html = eventBarHtml('2026-11-22');
  assert.equal(text(html), 'Back to Sunday , November 22');
  assert.match(html, /<button type="button" class="cal-backbtn" data-cal="back">/);
  assert.match(html, /Back to Sunday<span class="visually-hidden">, November 22<\/span>/);
  assert.match(html, /<button type="button" class="cal-iconbtn" data-cal="close" aria-label="Close">/);
  assert.equal(text(eventBarHtml('not a date')), 'Back');
});

test('the face of the day Cube shows the weekday, the date, and at most four mini-Cubes', () => {
  const none = dateFaceHtml('2026-12-05', []);
  assert.equal(text(none), 'Sat 5');
  assert.ok(!none.includes('cal-cd__marks'));
  const four = dateFaceHtml('2026-11-22', dayOf('2026-11-22', 4));
  assert.equal(count(four, '<svg class="cal-iso'), 4);
  assert.ok(!four.includes('cal-cd__plus'));
  const six = dateFaceHtml('2026-11-22', [...dayOf('2026-11-22', 6), ev({ date: '2026-11-23' })]);
  assert.equal(text(six), 'Sun 22 +2');
  assert.equal(count(six, '<svg class="cal-iso'), 4);
  assert.match(six, /<span class="cal-cd__plus">\+2<\/span>/);
});

// ---------- Coming up ----------

const at = (date: string, time: string) => Date.parse(zonedToUtc(date, time, TZ));

test('coming up leaves out what has ended and what is cancelled, soonest first', () => {
  const events = [
    ev({ title: 'Next Week', date: '2026-11-29' }),
    ev({ title: 'Over', date: TODAY, startTime: '09:00', endTime: '10:00' }),
    ev({ title: 'On Now', date: TODAY, startTime: '12:00', endTime: '15:00' }),
    ev({ title: 'Tonight', date: TODAY, startTime: '18:00', endTime: '21:30' }),
    ev({ title: 'Called Off', date: '2026-11-24', status: 'cancelled' }),
    ev({ title: 'Began Last Night', date: '2026-11-22', startTime: '20:00', endTime: '01:00' }),
    ev({ title: 'Yesterday', date: '2026-11-22' }),
  ];
  const noon = at(TODAY, '12:30');
  assert.deepEqual(pickUpcoming(events, noon, TZ).map((e) => e.title), ['On Now', 'Tonight', 'Next Week']);
  // Half past midnight: last night's late draft is still running.
  assert.deepEqual(pickUpcoming(events, at(TODAY, '00:30'), TZ).map((e) => e.title), ['Began Last Night', 'Over', 'On Now', 'Tonight', 'Next Week']);
  assert.deepEqual(pickUpcoming(events, at('2026-12-01', '00:00'), TZ), []);
});

test('coming up shows at most six, and skips events it cannot place in time', () => {
  const many = Array.from({ length: 9 }, (_, i) => ev({ title: `E${i}`, date: `2026-12-0${i + 1}` }));
  assert.deepEqual(pickUpcoming(many, at(TODAY, '08:00'), TZ).map((e) => e.title), ['E0', 'E1', 'E2', 'E3', 'E4', 'E5']);
  assert.equal(pickUpcoming(many, at(TODAY, '08:00'), TZ, 2).length, 2);
  assert.deepEqual(pickUpcoming([ev({ date: 'someday' }), ev({ startTime: 'late', date: '2026-12-01' })], at(TODAY, '08:00'), TZ), []);
});

test('coming up rows lead with the date and open the event', () => {
  const events = [
    ev({ title: 'Tonight', date: TODAY, startTime: '18:00', endTime: '21:30', going: 2 }),
    ev({ title: 'Lunch', date: '2026-11-24', startTime: '12:00', endTime: '13:00', kind: 'meetup', isSample: true }),
    ev({ title: 'Later', date: '2026-12-06', going: 5 }),
  ];
  const html = upcomingHtml(events, opts({ going: new Set([events[2].id]) }));
  assert.match(html, /^<ul class="cal-up__list" role="list">/);
  assert.equal(count(html, '<li>'), 3);
  assert.deepEqual([...html.matchAll(/<span class="cal-ev__date">([^<]*)<\/span>/g)].map((m) => m[1]), ['Today', 'Tomorrow', 'Sun, Dec 6']);
  assert.equal(count(html, '<svg class="cal-iso'), 3, 'the flat mini-Cube, not the turning one');
  assert.ok(!html.includes('cal-mcw'));
  assert.deepEqual([...html.matchAll(/data-id="(\d+)"/g)].map((m) => Number(m[1])), events.map((e) => e.id));
  const labels = [...html.matchAll(/aria-label="([^"]*)"/g)].map((m) => m[1]);
  assert.equal(labels[0], 'Tonight, Monday, November 23, 6:00 pm to 9:30 pm, Draft, The Table, 2 going');
  assert.equal(labels[1], 'Lunch, Tuesday, November 24, 12:00 pm to 1:00 pm, Meetup, The Table, 8 going, sample event');
  assert.equal(labels[2], 'Later, Sunday, December 6, 1:00 pm to 4:30 pm, Draft, The Table, 5 going, you are going');
  assert.equal(count(html, 'You are going'), 1);
  assert.equal(count(html, '>Sample<'), 1);
});

test('coming up with nothing says so warmly and offers the suggest form', () => {
  const html = upcomingHtml([], opts());
  assert.equal(text(html), 'Nothing is coming up yet. Hosting a draft or a meetup? Suggest an event');
  assert.match(html, new RegExp(`<a class="cal-more" href="${SUGGEST}">Suggest an event<svg class="cal-more__arrow"`));
  assert.equal(text(upcomingHtml('loading', opts())), 'Loading events.');
  const error = upcomingHtml('error', opts());
  assert.equal(text(error), 'We could not load what is coming up. Try again');
  assert.match(error, /<button class="cal-linkbtn" type="button" data-cal="retry-upcoming">Try again<\/button>/);
});

test('events are grouped by day in start order, ties by id', () => {
  const a = ev({ date: '2026-11-22', startTime: '13:00' });
  const b = ev({ date: '2026-11-22', startTime: '10:00' });
  const c = ev({ date: '2026-11-22', startTime: '13:00' });
  const d = ev({ date: '2026-11-21' });
  const days = groupByDate([c, a, d, b]);
  assert.deepEqual([...days.keys()], ['2026-11-21', '2026-11-22']);
  assert.deepEqual(days.get('2026-11-22')?.map((e) => e.id), [b.id, a.id, c.id]);
});

// ---------- The page address ----------

test('the address is read for a month, a day, or an event', () => {
  assert.deepEqual(readView(''), { month: null, day: null, event: null });
  assert.deepEqual(readView('?month=2026-12'), { month: '2026-12', day: null, event: null });
  assert.deepEqual(readView('?day=2026-11-22&samples=1'), { month: null, day: '2026-11-22', event: null });
  assert.deepEqual(readView('?event=236'), { month: null, day: null, event: 236 });
  assert.deepEqual(readView('?month=2026-13&day=2026-02-30&event=0'), { month: null, day: null, event: null }, 'nonsense reads as not there');
  assert.deepEqual(readView('?event=12abc&day=tomorrow&month=<script>'), { month: null, day: null, event: null });
  assert.deepEqual(readView('?event=-4'), { month: null, day: null, event: null });
});

test('the address this page writes keeps samples and drops the review switches', () => {
  assert.equal(viewQuery('', {}), '');
  assert.equal(viewQuery('', { month: '2026-12' }), '?month=2026-12');
  assert.equal(viewQuery('?samples=1', { day: '2026-11-22' }), '?samples=1&day=2026-11-22');
  assert.equal(viewQuery('?samples=1&day=2026-11-22&freeze=0.35&clock=timer', { day: '2026-11-22' }), '?samples=1&day=2026-11-22');
  assert.equal(viewQuery('?samples=1&event=5&turn=0.5', {}), '?samples=1');
  assert.equal(viewQuery('?month=2026-12&samples=1', { month: null }), '?samples=1');
  assert.equal(viewQuery('?utm_source=discord&day=2026-11-22', { month: '2027-01' }), '?utm_source=discord&month=2027-01', 'what it does not know, it leaves alone');
});

test('an event link carries only the event, and a day link only the day', () => {
  assert.equal(viewQuery('?month=2026-11', { month: '2026-12', day: '2026-12-06', event: 236 }), '?event=236');
  assert.equal(viewQuery('?event=236', { month: '2026-12', day: '2026-12-06' }), '?day=2026-12-06');
  assert.deepEqual(readView(viewQuery('?samples=1', { event: 72 })), { month: null, day: null, event: 72 });
});

// ---------- Keys in the grid ----------

test('arrow keys move a day or a week, and cross into the next month', () => {
  assert.equal(keyTarget('2026-11-23', 'ArrowLeft'), '2026-11-22');
  assert.equal(keyTarget('2026-11-23', 'ArrowRight'), '2026-11-24');
  assert.equal(keyTarget('2026-11-23', 'ArrowUp'), '2026-11-16');
  assert.equal(keyTarget('2026-11-23', 'ArrowDown'), '2026-11-30');
  assert.equal(keyTarget('2026-11-30', 'ArrowRight'), '2026-12-01');
  assert.equal(keyTarget('2026-11-01', 'ArrowLeft'), '2026-10-31');
  assert.equal(keyTarget('2026-11-24', 'ArrowDown'), '2026-12-01');
  assert.equal(keyTarget('2026-11-23', 'Enter'), null, 'other keys are left to the button');
  assert.equal(keyTarget('2026-11-23', 'a'), null);
});

test('Home and End go to the ends of the week without leaving the month', () => {
  assert.equal(keyTarget('2026-11-25', 'Home'), '2026-11-22');
  assert.equal(keyTarget('2026-11-25', 'End'), '2026-11-28');
  assert.equal(keyTarget('2026-11-30', 'End'), '2026-11-30', 'the week runs into December, so End stops at the 30th');
  assert.equal(keyTarget('2026-12-02', 'Home'), '2026-12-01', 'the week began in November, so Home stops at the 1st');
  assert.equal(keyTarget('2026-11-22', 'Home'), '2026-11-22');
});

test('Page Up and Page Down change the month and keep the day where they can', () => {
  assert.equal(keyTarget('2026-11-23', 'PageDown'), '2026-12-23');
  assert.equal(keyTarget('2026-11-23', 'PageUp'), '2026-10-23');
  assert.equal(keyTarget('2027-01-31', 'PageDown'), '2027-02-28');
  assert.equal(keyTarget('2028-01-31', 'PageDown'), '2028-02-29', 'a leap year');
  assert.equal(keyTarget('2026-12-31', 'PageUp'), '2026-11-30');
  assert.equal(keyTarget('2026-12-15', 'PageDown'), '2027-01-15', 'across the year');
});

test('the tab stop is the last day focused, else today, else the first of the month', () => {
  assert.equal(tabStopFor('2026-11', '2026-11-05', TODAY), '2026-11-05');
  assert.equal(tabStopFor('2026-11', null, TODAY), TODAY);
  assert.equal(tabStopFor('2026-11', '2026-12-05', TODAY), TODAY, 'a day from another month does not hold the stop');
  assert.equal(tabStopFor('2026-12', null, TODAY), '2026-12-01');
  assert.equal(tabStopFor('2026-12', '2026-11-05', TODAY), '2026-12-01');
});

// ---------- The frame ----------

test('the frame has a toolbar, a polite month name, a legend, and coming up', () => {
  const html = shellHtml({ samples: false, hideSamplesUrl: '/cube-commonwealth/events/' });
  assert.match(html, /<h2 class="cal-bar__month" id="cal-month-name" aria-live="polite" aria-atomic="true" data-cal="month-name"><\/h2>/);
  assert.match(html, /<button class="cal-iconbtn" type="button" data-cal="prev" aria-label="Previous month">/);
  assert.match(html, /<button class="cal-iconbtn" type="button" data-cal="next" aria-label="Next month">/);
  assert.match(html, /<button class="cal-pillbtn" type="button" data-cal="today">Today<\/button>/);
  assert.match(html, /<section class="cal-month" aria-labelledby="cal-month-name">/);
  assert.match(html, /<p class="cal-status" role="status" data-cal="status"><\/p>/);
  assert.match(html, /<p class="cal-note" role="status" data-cal="note"><\/p>/);
  assert.match(html, /<section class="cal-up" aria-labelledby="cal-up-title"><h2 class="cal-up__title" id="cal-up-title">Coming up<\/h2>/);
  assert.ok(!html.includes('sample'), 'no banner unless samples are showing');
});

test('with samples showing, a quiet banner says so and offers to hide them', () => {
  const html = shellHtml({ samples: true, hideSamplesUrl: '/cube-commonwealth/events/' });
  assert.match(html, /^<p class="cal-banner">Showing sample events\. They are not real\. <a href="\/cube-commonwealth\/events\/" data-cal="hide-samples">Hide samples<\/a><\/p>/);
});

test('the dialog is a labelled modal with a day card and an event card', () => {
  const html = dialogHtml();
  assert.match(html, /^<div class="cal-dlg__panel" role="dialog" aria-modal="true" aria-labelledby="cal-day-title" tabindex="-1">/);
  assert.equal(count(html, 'class="cal-card '), 2);
  assert.match(html, /<section class="cal-card cal-card--list" data-card="list">/);
  assert.match(html, /<section class="cal-card cal-card--detail" data-card="detail" hidden>/);
  assert.equal(count(html, 'class="cal-card__bg"'), 2);
  assert.equal(count(html, 'class="cal-card__shade"'), 2);
  assert.match(html, /<div class="cal-dtop" data-cal="bar"><\/div><div class="cal-event" data-cal="event"><\/div>/);
});

// ---------- Writing rules ----------

test('every button has a name, and no copy has an em dash or an en dash', () => {
  const cancelled = ev({ status: 'cancelled', isSample: true });
  const events = [...dayOf('2026-11-22', 6), cancelled, HOSTILE, ev({ date: TODAY })];
  const all = [
    shellHtml({ samples: true, hideSamplesUrl: '/' }),
    dialogHtml(),
    grid('2026-11', events),
    grid('2026-11', null),
    monthProblemHtml(),
    monthStatusHtml('empty', SUGGEST),
    monthStatusHtml('loading', SUGGEST),
    legendHtml(),
    dayCardHtml('2026-11-22', events, opts({ going: new Set([cancelled.id]) })),
    dayCardHtml('2026-12-05', [], opts()),
    dayCardHtml('2026-11-02', [], opts()),
    dayCardHtml('2026-12-05', 'loading', opts()),
    dayCardHtml('2026-12-05', 'error', opts()),
    eventBarHtml('2026-11-22'),
    dateFaceHtml('2026-11-22', events),
    upcomingHtml(events, opts()),
    upcomingHtml([], opts()),
    upcomingHtml('loading', opts()),
    upcomingHtml('error', opts()),
    NOT_FOUND_LINE,
  ].join('\n');
  assert.ok(!/[\u2014\u2013]/.test(all), 'no em dash or en dash');
  assert.ok(!/non-gamers/i.test(all));
  // "Cube" is capitalized wherever a person reads it. Class names are markup, not copy.
  assert.ok(!/\bcubes?\b/.test(text(all)), 'no lowercase "cube" in the words');
  for (const [button] of all.matchAll(/<button[^>]*>[\s\S]*?<\/button>/g)) {
    const named = /aria-label="[^"]+"/.test(button) || text(button).length > 0;
    assert.ok(named, `a button without a name: ${button.slice(0, 120)}`);
  }
  // Decorative drawings stay out of the way of screen readers.
  for (const [svg] of all.matchAll(/<svg[^>]*>/g)) assert.match(svg, /aria-hidden="true"/);
});
