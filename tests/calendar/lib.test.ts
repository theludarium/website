// Tests for the events calendar's pure logic: dates, the ranked-choice count,
// input cleaning, and calendar files. Run: npm test
import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  addDays, addMonths, daysBetween, eventInstants, formatDate, formatMonth, formatTime, formatTimeRange, gridRange,
  isIsoDate, isMonth, isTime, monthGrid, todayIn, voteCloseInstant, weekday, zonedToUtc,
} from '../../src/lib/calendar/dates.ts';
import { tallyRankedChoice } from '../../src/lib/calendar/tally.ts';
import { cleanAttendeeName, cleanRanking, cleanRepeatWeeks, parseEventInput, parseEventSuggestion } from '../../src/lib/calendar/validate.ts';
import { eventIcs, googleCalendarUrl } from '../../src/lib/calendar/ics.ts';
import { ACTION_MESSAGES, CAL_LIMITS, EVENT_KINDS, SUGGEST_MESSAGES } from '../../src/lib/calendar/shared.ts';

const TZ = 'America/Indiana/Indianapolis';

test('dates and times are checked strictly', () => {
  assert.ok(isIsoDate('2026-11-22') && isIsoDate('2028-02-29'));
  for (const bad of ['2026-02-30', '2026-13-01', '26-11-22', '2026-11-2', '', null, 20261122]) assert.ok(!isIsoDate(bad), String(bad));
  assert.ok(isTime('00:00') && isTime('23:59'));
  for (const bad of ['24:00', '9:00', '12:60', '1300', null]) assert.ok(!isTime(bad), String(bad));
  assert.ok(isMonth('2026-11') && !isMonth('2026-13') && !isMonth('2026-1'));
});

test('day and month arithmetic crosses months and years', () => {
  assert.equal(addDays('2026-12-31', 1), '2027-01-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-11-22', '2026-11-29'), 7);
  assert.equal(weekday('2026-11-22'), 0);
  assert.equal(addMonths('2026-12', 1), '2027-01');
  assert.equal(addMonths('2026-01', -1), '2025-12');
});

test('the month grid starts on Sunday and fills whole weeks', () => {
  const nov = monthGrid('2026-11');
  assert.equal(nov.length, 5);
  assert.deepEqual(nov[0][0], { date: '2026-11-01', inMonth: true });
  assert.deepEqual(nov[4][6], { date: '2026-12-05', inMonth: false });
  assert.ok(nov.every((week) => week.length === 7 && weekday(week[0].date) === 0));
  assert.deepEqual(gridRange('2026-11'), { from: '2026-11-01', to: '2026-12-05' });
  assert.equal(monthGrid('2026-08').length, 6); // starts on a Saturday
  assert.equal(monthGrid('2026-02').length, 4); // 28 days, starts on a Sunday
  assert.equal(monthGrid('2027-01')[0][0].date, '2026-12-27');
});

test('times and dates print the same everywhere', () => {
  assert.equal(formatTime('13:00'), '1:00 pm');
  assert.equal(formatTime('00:30'), '12:30 am');
  assert.equal(formatTime('12:05'), '12:05 pm');
  assert.equal(formatTimeRange('13:00', '16:30'), '1:00 pm to 4:30 pm');
  assert.equal(formatDate('2026-11-22', 'long'), 'Sunday, November 22, 2026');
  assert.equal(formatDate('2026-11-22'), 'Sunday, November 22');
  assert.equal(formatDate('2026-11-22', 'short'), 'Sun, Nov 22');
  assert.equal(formatMonth('2026-11'), 'November 2026');
});

test('local event times become the right UTC instants, in winter and summer', () => {
  assert.equal(zonedToUtc('2026-11-22', '13:00', TZ), '2026-11-22T18:00:00.000Z'); // EST
  assert.equal(zonedToUtc('2026-07-04', '13:00', TZ), '2026-07-04T17:00:00.000Z'); // EDT
  assert.equal(zonedToUtc('2026-11-22', '13:00', 'America/Chicago'), '2026-11-22T19:00:00.000Z');
  // The day clocks fall back (Nov 1, 2026): the afternoon is already standard time.
  assert.equal(zonedToUtc('2026-11-01', '13:00', TZ), '2026-11-01T18:00:00.000Z');
  assert.equal(zonedToUtc('2026-10-31', '13:00', TZ), '2026-10-31T17:00:00.000Z');
});

test('an event that ends at or before its start time ends the next day', () => {
  assert.deepEqual(eventInstants('2026-11-22', '13:00', '16:30', TZ), { startsAt: '2026-11-22T18:00:00.000Z', endsAt: '2026-11-22T21:30:00.000Z' });
  assert.deepEqual(eventInstants('2026-11-22', '20:00', '01:00', TZ), { startsAt: '2026-11-23T01:00:00.000Z', endsAt: '2026-11-23T06:00:00.000Z' });
  assert.equal(voteCloseInstant('2026-11-22T18:00:00.000Z', 24), '2026-11-21T18:00:00.000Z');
  assert.equal(voteCloseInstant('2026-11-22T18:00:00.000Z', 0), '2026-11-22T18:00:00.000Z');
});

test('today follows the time zone, not UTC', () => {
  assert.equal(todayIn(TZ, new Date('2026-11-23T03:00:00Z')), '2026-11-22');
  assert.equal(todayIn(TZ, new Date('2026-11-23T06:00:00Z')), '2026-11-23');
});

test('ranked choice: no ballots means no winner', () => {
  assert.deepEqual(tallyRankedChoice([1, 2], []), { ballots: 0, winner: null, tied: false, rounds: [] });
  assert.deepEqual(tallyRankedChoice([1, 2], [[], [9]]), { ballots: 0, winner: null, tied: false, rounds: [] });
});

test('ranked choice: a majority wins in round one', () => {
  const t = tallyRankedChoice([1, 2, 3], [[1, 2], [1], [2, 1], [1, 3]]);
  assert.equal(t.winner, 1);
  assert.equal(t.ballots, 4);
  assert.equal(t.tied, false);
  assert.deepEqual(t.rounds, [{ counts: [{ cubeId: 1, votes: 3 }, { cubeId: 2, votes: 1 }, { cubeId: 3, votes: 0 }], eliminated: null }]);
});

test('ranked choice: the last-place Cube is dropped and its ballots move on', () => {
  // Round 1: A 2, B 2, C 1. C drops; its ballot prefers B. Round 2: B 3, A 2.
  const t = tallyRankedChoice([10, 20, 30], [[10], [10, 20], [20], [20, 10], [30, 20, 10]]);
  assert.equal(t.winner, 20);
  assert.equal(t.rounds.length, 2);
  assert.equal(t.rounds[0].eliminated, 30);
  assert.deepEqual(t.rounds[1].counts, [{ cubeId: 20, votes: 3 }, { cubeId: 10, votes: 2 }]);
  assert.equal(t.tied, false);
});

test('ranked choice: Cubes nobody ranks first are dropped without calling it a tie', () => {
  const t = tallyRankedChoice([1, 2, 3, 4], [[1], [2], [2]]);
  assert.equal(t.winner, 2);
  assert.equal(t.tied, false);
});

test('ranked choice: a dead heat is broken by first choices, then by the earlier suggestion, and says so', () => {
  const heat = tallyRankedChoice([7, 8], [[7], [8]]);
  assert.equal(heat.winner, 7);
  assert.equal(heat.tied, true);
  // B and C tie for last with one vote each; C has fewer first choices? No: equal, so the later one (C) drops.
  const three = tallyRankedChoice([1, 2, 3], [[1], [1], [2], [3], [2, 1], [3, 1], [1]]);
  assert.equal(three.rounds[0].eliminated, 3);
  assert.equal(three.tied, true);
  assert.equal(three.winner, 1);
});

test('ranked choice: exhausted ballots stop counting toward the majority', () => {
  // A 2, B 2, C 1 (C only). C drops and its ballot is spent: A 2, B 2 of 4 counted. Tie, earlier suggestion wins.
  const t = tallyRankedChoice([1, 2, 3], [[1], [1], [2], [2], [3]]);
  assert.equal(t.ballots, 5);
  assert.equal(t.winner, 1);
  assert.equal(t.tied, true);
});

test('ranked choice: repeats and withdrawn Cubes on a ballot are ignored', () => {
  const t = tallyRankedChoice([1, 2], [[9, 2, 2, 1], [2], [1]]);
  assert.equal(t.winner, 2);
  assert.deepEqual(t.rounds[0].counts, [{ cubeId: 2, votes: 2 }, { cubeId: 1, votes: 1 }]);
});

test('attendee names are tidied and junk is refused', () => {
  assert.equal(cleanAttendeeName('  Sam   W. '), 'Sam W.');
  assert.equal(cleanAttendeeName('@cube_fan'), '@cube_fan');
  assert.equal(cleanAttendeeName('Ann \u2014 Marie'), 'Ann, Marie');
  for (const bad of ['', '   ', '...', 'x'.repeat(CAL_LIMITS.attendeeName + 1), null, 42]) assert.equal(cleanAttendeeName(bad), null, String(bad));
});

test('rankings keep only suggested Cubes, once each', () => {
  assert.deepEqual(cleanRanking([3, 1, 3, 9], [1, 2, 3]), [3, 1]);
  assert.deepEqual(cleanRanking([], [1]), []);
  for (const bad of ['1,2', [1, '2'], [1.5], null, {}]) assert.equal(cleanRanking(bad, [1, 2]), null);
});

test('repeat weeks stays between 0 and 12', () => {
  assert.equal(cleanRepeatWeeks(3), 3);
  assert.equal(cleanRepeatWeeks('4'), 4);
  assert.equal(cleanRepeatWeeks(99), 12);
  assert.equal(cleanRepeatWeeks(-1), 0);
  assert.equal(cleanRepeatWeeks('x'), 0);
});

const event = { title: ' Sunday  Cube Draft ', date: '2026-11-29', startTime: '13:00', endTime: '16:30' };

test('a new event gets sensible defaults', () => {
  const parsed = parseEventInput(event);
  assert.ok('value' in parsed);
  assert.deepEqual(parsed.value, {
    title: 'Sunday Cube Draft', kind: 'draft', date: '2026-11-29', startTime: '13:00', endTime: '16:30',
    description: null, locationName: null, locationAddress: null, cubeMode: 'vote', cubeId: null, voteCloseHours: 24, status: 'approved',
  });
  const cls = parseEventInput({ ...event, kind: 'class' });
  assert.ok('value' in cls && cls.value.cubeMode === 'none');
});

test('a new event names its first problem', () => {
  assert.deepEqual(parseEventInput({ ...event, title: ' ' }), { error: 'Add a title.' });
  assert.deepEqual(parseEventInput({ ...event, date: '2026-02-30' }), { error: 'Check the date.' });
  assert.deepEqual(parseEventInput({ ...event, endTime: '13:00' }), { error: 'The end time must be different from the start time.' });
  assert.deepEqual(parseEventInput({ ...event, kind: 'party' }), { error: 'Check the kind of event.' });
  assert.deepEqual(parseEventInput({ ...event, cubeMode: 'set' }), { error: 'Pick the Cube for this event, or let attendees vote.' });
  assert.deepEqual(parseEventInput({ ...event, voteCloseHours: 7 }), { error: 'Check when voting closes.' });
  assert.deepEqual(parseEventInput({ ...event, cubeId: 'abc' }), { error: 'Check the Cube.' });
});

test('an edit checks only what it carries, and "no Cube" clears the Cube', () => {
  assert.deepEqual(parseEventInput({ status: 'cancelled' }, { partial: true }), { value: { status: 'cancelled' } });
  assert.deepEqual(parseEventInput({ cubeMode: 'none' }, { partial: true }), { value: { cubeMode: 'none', cubeId: null } });
  assert.deepEqual(parseEventInput({ cubeId: 5 }, { partial: true }), { value: { cubeId: 5 } });
  assert.deepEqual(parseEventInput({ description: 'Line one\r\n\r\n\r\n\r\nLine  two \u2013 done' }, { partial: true }), { value: { description: 'Line one\n\nLine two, done' } });
  assert.deepEqual(parseEventInput({}, { partial: true }), { error: 'Nothing to change.' });
  assert.deepEqual(parseEventInput({ status: 'live' }, { partial: true }), { error: 'Check the status.' });
});

const form = (fields: Record<string, string>) => {
  const f = new FormData();
  for (const [k, v] of Object.entries(fields)) f.append(k, v);
  return f;
};
const suggestion = { title: 'Pauper Cube Night', kind: 'draft', date: '2026-12-05', start_time: '18:00', end_time: '21:30', name: 'Sam' };

test('a visitor suggestion is cleaned', () => {
  const parsed = parseEventSuggestion(form({ ...suggestion, has_draft: 'yes', email: 'sam@example.com', location_name: ' Sam’s place ' }), '2026-11-23');
  assert.ok(!('error' in parsed));
  assert.equal(parsed.cubeMode, 'vote');
  assert.equal(parsed.submitterEmail, 'sam@example.com');
  assert.equal(parsed.locationName, 'Sam’s place');
  const plain = parseEventSuggestion(form({ ...suggestion, kind: 'nonsense' }), '2026-11-23');
  assert.ok(!('error' in plain) && plain.kind === 'other' && plain.cubeMode === 'none' && plain.submitterEmail === null);
});

test('a visitor suggestion names its first problem', () => {
  const today = '2026-11-23';
  assert.deepEqual(parseEventSuggestion(form({ ...suggestion, name: '' }), today), { error: 'missing' });
  assert.deepEqual(parseEventSuggestion(form({ ...suggestion, date: '2026-11-22' }), today), { error: 'date' });
  assert.deepEqual(parseEventSuggestion(form({ ...suggestion, date: '2029-01-01' }), today), { error: 'date' });
  assert.deepEqual(parseEventSuggestion(form({ ...suggestion, end_time: '18:00' }), today), { error: 'time' });
  assert.deepEqual(parseEventSuggestion(form({ ...suggestion, email: 'nope' }), today), { error: 'email' });
  assert.deepEqual(parseEventSuggestion(form({ ...suggestion, title: 'x'.repeat(CAL_LIMITS.title + 1) }), today), { error: 'long' });
});

const entry = { id: 7, title: 'Sunday Cube Draft; bring sleeves, please', startsAt: '2026-11-22T18:00:00.000Z', endsAt: '2026-11-22T21:30:00.000Z', description: 'Line one\nLine two', locationName: 'The Table', locationAddress: '1 Main St, Carmel' };

test('the calendar file has the times, escapes text, and folds long lines', () => {
  const ics = eventIcs(entry, 'https://theludarium.com/cube-commonwealth/events/?event=7');
  assert.ok(ics.startsWith('BEGIN:VCALENDAR\r\n') && ics.endsWith('END:VCALENDAR\r\n'));
  assert.ok(ics.includes('DTSTART:20261122T180000Z') && ics.includes('DTEND:20261122T213000Z'));
  assert.ok(ics.includes(String.raw`SUMMARY:Sunday Cube Draft\; bring sleeves\, please`));
  assert.ok(ics.includes('UID:event-7@theludarium.com'));
  assert.ok(ics.includes('LOCATION:The Table\\, 1 Main St\\, Carmel'));
  for (const line of ics.split('\r\n')) assert.ok(new TextEncoder().encode(line).length <= 75, line);
  assert.ok(ics.replace(/\r\n /g, '').includes('DESCRIPTION:Line one\\nLine two\\n\\nhttps://theludarium.com/cube-commonwealth/events/?event=7'));
});

test('the Google Calendar link carries the same details', () => {
  const url = new URL(googleCalendarUrl({ ...entry, locationName: null, locationAddress: null }, 'https://example.com/e'));
  assert.equal(url.searchParams.get('dates'), '20261122T180000Z/20261122T213000Z');
  assert.equal(url.searchParams.get('text'), entry.title);
  assert.equal(url.searchParams.get('location'), null);
});

test('public copy has no em dashes or en dashes', () => {
  const copy = JSON.stringify([ACTION_MESSAGES, SUGGEST_MESSAGES, EVENT_KINDS]);
  assert.ok(!/[\u2014\u2013]/.test(copy));
});

test('times around a clock change land on the right instant', () => {
  assert.equal(zonedToUtc('2026-11-01', '03:00', TZ), '2026-11-01T08:00:00.000Z');
  assert.equal(zonedToUtc('2027-03-14', '01:30', TZ), '2027-03-14T06:30:00.000Z');
  assert.equal(zonedToUtc('2027-03-14', '03:30', TZ), '2027-03-14T07:30:00.000Z');
  // 2:30 does not exist that night, so it moves forward, and an event across the gap still ends after it starts.
  assert.equal(zonedToUtc('2027-03-14', '02:30', TZ), '2027-03-14T07:30:00.000Z');
  const { startsAt, endsAt } = eventInstants('2027-03-14', '01:45', '02:15', TZ);
  assert.ok(Date.parse(endsAt) > Date.parse(startsAt));
});
