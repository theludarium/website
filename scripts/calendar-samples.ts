// Writes migrations/0009_calendar_samples.sql: placeholder events for the events
// calendar, so a full month can be seen before any real event exists. Every row
// is flagged is_sample. The public calendar only shows those with ?samples=1,
// and the admin page deletes them all with one button.
// Spec: docs/calendar/SPEC.md, section 10.
//
//   node scripts/calendar-samples.ts
//
// The file it writes never changes between runs: the dates, the seed, and
// "today" are fixed, and nothing here reads the clock, a network, or a database.
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { addDays, eventInstants, formatDate, weekday } from '../src/lib/calendar/dates.ts';
import { CAL_TZ, type CubeMode, type EventKind } from '../src/lib/calendar/shared.ts';

const FIRST = '2026-11-01';
const LAST = '2027-01-31';
/** Fixed on purpose. "The next four Sundays" are counted from here. */
const TODAY = '2026-11-23';
/** created_at for every sample row. */
const STAMP = '2026-11-23T15:00:00.000Z';
const SEED = 20261123;
const VENUE = 'Sample venue, Indianapolis';
const OUT = new URL('../migrations/0009_calendar_samples.sql', import.meta.url);

// Sample events only ever name the Cubes Levi owns, so a made-up event never
// puts words in another owner's mouth. The SQL looks each one up by name.
const OWNER = 'Levi Wilson';
const MONO_BLUE = 'Mono Blue';
const VINTAGE = 'MTGO Vintage Cube';
const ABECEDARIAN = 'Abecedarian Cube - 1st Draft for New Mages';
const COMMANDER = "Levi's Commander Cube #1";
/** Cubes that suit any ordinary draft. The Commander Cube needs its own night. */
const EVERYDAY = [MONO_BLUE, VINTAGE, ABECEDARIAN];

const ROSTER = [
  'Ann', 'Ben', 'Cal', 'Dee', 'Eli', 'Fay', 'Gus', 'Hal', 'Ivy', 'Jo', 'Kit', 'Lou',
  'Max', 'Nia', 'Oz', 'Pam', 'Quinn', 'Ray', 'Sue', 'Ted', 'Uma', 'Val', 'Wes', 'Zoe',
].map((name) => `Sample ${name}`);

type Part = 'morning' | 'lunch' | 'afternoon' | 'evening' | 'late';
type Slot = { part: Part; start: string; end: string };

const WEEKDAY: Slot[] = [
  { part: 'lunch', start: '12:00', end: '13:00' },
  { part: 'evening', start: '18:00', end: '21:30' },
  { part: 'evening', start: '18:30', end: '22:00' },
  { part: 'evening', start: '19:00', end: '22:30' },
];
const WEEKEND: Slot[] = [
  { part: 'morning', start: '10:00', end: '12:30' },
  { part: 'afternoon', start: '13:00', end: '16:30' },
  { part: 'afternoon', start: '14:00', end: '18:00' },
  { part: 'evening', start: '18:00', end: '22:00' },
  { part: 'late', start: '20:00', end: '01:00' },
];

type Idea = {
  title: string;
  kind: EventKind;
  about: string;
  /** The parts of the day the title fits, so "Lunch" lands at noon and "Night" in the evening. */
  parts: Part[];
  /** Fewest and most people going. Left out, the kind decides. */
  going?: [number, number];
  /**
   * Drafts only: the Cube a host could have picked. A name means that Cube,
   * 'any' means any everyday Cube. Left out, the title calls for a kind of Cube
   * Levi does not own, so the event is always a vote.
   */
  cube?: string;
};

const IDEAS: Idea[] = [
  { title: 'Vintage Cube Night', kind: 'draft', parts: ['evening', 'late'], cube: VINTAGE, going: [6, 8], about: 'Power, fast mana, and wild opening hands. We are hoping for a full pod of eight.' },
  { title: 'Pauper Cube Pod', kind: 'draft', parts: ['afternoon', 'evening'], about: 'Commons only, and every pick matters. A good first Cube for new drafters.' },
  { title: 'Peasant Cube Draft', kind: 'draft', parts: ['afternoon', 'evening'], about: 'Commons and uncommons. Expect fast decks and plenty of combat tricks.' },
  { title: 'Commander Cube Night', kind: 'draft', parts: ['evening', 'late'], cube: COMMANDER, about: 'Draft a commander and a deck to go with it, then play in pods of four.' },
  { title: 'Team Draft, 3 on 3', kind: 'draft', parts: ['afternoon', 'evening'], cube: 'any', going: [6, 6], about: 'Two teams of three. After the draft, each player plays everyone on the other team.' },
  { title: 'Two-Player Grid Draft', kind: 'draft', parts: ['lunch', 'afternoon', 'evening'], cube: 'any', going: [2, 4], about: 'A quick draft for two. Lay out nine cards, then take a row or a column.' },
  { title: 'New Player Draft', kind: 'draft', parts: ['morning', 'afternoon'], cube: ABECEDARIAN, about: 'Never drafted a Cube? Start here. We explain each step and help you build your deck.' },
  { title: 'Legacy Cube Draft', kind: 'draft', parts: ['afternoon', 'evening', 'late'], about: 'Strong cards from across the history of Magic. Bring sleeves if you have them.' },
  { title: 'Set Cube Throwback Draft', kind: 'draft', parts: ['afternoon', 'evening'], about: 'One old set, rebuilt as a Cube. Draft it like it just came out.' },
  { title: 'Winston Draft Lunch', kind: 'draft', parts: ['lunch'], cube: 'any', going: [2, 3], about: 'A draft for two or three, played over lunch. Bring a sandwich.' },
  { title: 'Rotisserie Draft Kickoff', kind: 'draft', parts: ['evening'], cube: 'any', going: [6, 8], about: 'Every card is face up and we pick one at a time. Tonight we make the first picks together.' },
  { title: 'Sealed Cube Showdown', kind: 'draft', parts: ['afternoon'], cube: 'any', about: 'No draft today. Open a sealed pool from the Cube, build 40 cards, and play.' },
  { title: 'Lunch Break Mini Draft', kind: 'draft', parts: ['lunch'], cube: 'any', going: [2, 4], about: 'Small packs and short games. We are done in an hour.' },
  { title: 'Late Night Draft', kind: 'draft', parts: ['late'], cube: 'any', about: 'For the night owls. We draft late and play until the last match ends.' },
  { title: 'Morning Draft', kind: 'draft', parts: ['morning'], cube: 'any', about: 'Coffee first, then packs. A quick draft and two short rounds before lunch.' },
  { title: 'Cube Design Workshop', kind: 'class', parts: ['morning', 'afternoon'], about: 'Bring a list you are working on. We talk about color balance, themes, and what to cut.' },
  { title: 'Draft Strategy Class', kind: 'class', parts: ['morning', 'afternoon', 'evening'], about: 'How to read signals, stay open, and build a 40 card deck that works.' },
  { title: 'Cube Cobra Clinic', kind: 'class', parts: ['morning', 'afternoon', 'evening'], about: 'Learn to build, tag, and share a list on Cube Cobra. Bring a laptop if you can.' },
  { title: 'Build Your First Cube', kind: 'class', parts: ['morning', 'afternoon'], about: 'Start a Cube from cards you already own. We cover size, themes, and sleeves.' },
  { title: 'Mana Base Class', kind: 'class', parts: ['afternoon', 'evening'], about: 'How many lands to play, which ones, and why it matters so much in Cube.' },
  { title: 'Reading the Table Class', kind: 'class', parts: ['afternoon', 'evening'], about: 'Learn what each pack tells you about the drafters sitting next to you.' },
  { title: 'Cube and Coffee', kind: 'meetup', parts: ['morning', 'lunch'], about: 'Come hang out, talk Cube, and meet other players. No deck needed.' },
  { title: 'Sleeving Party', kind: 'meetup', parts: ['morning', 'afternoon', 'evening'], about: 'Many hands make light work. Help sleeve a new Cube and get a first look at the list.' },
  { title: 'CQC Planning Meetup', kind: 'meetup', parts: ['afternoon', 'evening'], about: 'Help plan the next Cube Quarterly Celebration. Bring ideas for pods, food, and Passport stamps.' },
  { title: 'Proxy Print Night', kind: 'meetup', parts: ['evening', 'late'], about: 'Print, cut, and sleeve proxies together. Paper and a cutter are on the table.' },
  { title: 'Trade Night', kind: 'meetup', parts: ['evening', 'late'], about: 'Bring your binder and trade for the cards your Cube still needs.' },
  { title: 'Cube Owners Roundtable', kind: 'meetup', parts: ['afternoon', 'evening'], about: 'Cube owners compare notes on updates, storage, and what their drafters enjoy most.' },
  { title: 'Lunch and Cube Talk', kind: 'meetup', parts: ['lunch'], about: 'Bring your lunch and a question about Cube. Good talk is the whole plan.' },
  { title: 'Board Game Break', kind: 'other', parts: ['lunch', 'afternoon', 'evening', 'late'], about: 'A break from Magic. Bring a board game, or play one from the shelf.' },
  { title: 'Token Painting Night', kind: 'other', parts: ['evening', 'late'], about: 'Paint your own tokens. Paint and brushes are on the table.' },
];

/** How often each kind turns up, and how many people go when the title does not say. */
const KIND_WEIGHT: Record<EventKind, number> = { draft: 5, class: 2, meetup: 2.5, other: 1, celebration: 0 };
const GOING: Record<EventKind, [number, number]> = { draft: [4, 10], class: [3, 8], meetup: [3, 9], other: [2, 6], celebration: [10, 16] };

type Fixed = Pick<Idea, 'title' | 'kind' | 'about' | 'going'> & { start: string; end: string; allDay?: boolean };

const SUNDAY_DRAFT: Fixed = {
  title: 'Sunday Cube Draft', kind: 'draft', start: '13:00', end: '16:30', going: [8, 12],
  about: 'Our weekly draft. New players are welcome. Bring sleeves if you have them.',
};
/** Events with a set date. An all-day one keeps the hours it covers to itself. */
const DATED: Record<string, Fixed> = {
  '2026-11-28': { title: 'Thanksgiving Weekend Cube Party', kind: 'celebration', start: '18:00', end: '22:00', about: 'Bring leftovers to share. We draft, eat, and catch up.' },
  '2026-12-05': { title: 'Cube Quarterly Celebration', kind: 'celebration', start: '10:00', end: '18:00', allDay: true, going: [24, 24], about: 'An all-day party for the whole community, with drafts, food, and Passport stamps.' },
  '2026-12-31': { title: 'New Year Cube Party', kind: 'celebration', start: '20:00', end: '01:00', about: 'See the year out with a late draft, snacks, and good company.' },
  '2027-01-16': { title: 'Winter Cube Party', kind: 'celebration', start: '18:00', end: '22:00', about: 'A cozy night of drafting in the middle of winter. Bring a snack to share.' },
};

/**
 * How a sample vote stands: three suggested Cubes (earliest first), the seat of
 * whoever can bring each one, and the ballots in seat order. Each ballot ranks
 * the three Cubes by their place in `cubes`.
 */
type Vote = { cubes: [string, string, string]; bringers: (number | null)[]; ballots: number[][] };
const VOTES: Vote[] = [
  // Three against three, and the seventh ballot's second choice settles it.
  { cubes: [MONO_BLUE, VINTAGE, ABECEDARIAN], bringers: [0, null, 3], ballots: [[0, 1, 2], [1, 0, 2], [0, 2, 1], [1, 2, 0], [0, 1, 2], [1, 0, 2], [2, 1, 0]] },
  // A clear winner in round one, but nobody has offered to bring it yet.
  { cubes: [VINTAGE, COMMANDER, MONO_BLUE], bringers: [1, 2, null], ballots: [[2, 0, 1], [2, 1, 0], [0, 2, 1], [2, 0, 1], [1, 2, 0]] },
  // A dead heat, broken in favor of the Cube suggested first.
  { cubes: [ABECEDARIAN, MONO_BLUE, COMMANDER], bringers: [null, 2, null], ballots: [[0, 1, 2], [1, 0, 2], [0, 2, 1], [1, 2, 0]] },
  // Early days: two ballots in.
  { cubes: [COMMANDER, VINTAGE, ABECEDARIAN], bringers: [0, null, null], ballots: [[1, 0, 2], [1, 2, 0]] },
];

type Sample = {
  date: string;
  start: string;
  end: string;
  title: string;
  kind: EventKind;
  about: string;
  going: number;
  cubeMode: CubeMode;
  /** The Cube the host picked, for cubeMode 'set'. */
  cube: string | null;
  /** The Cube a host could pick (see Idea.cube). */
  hint: string | null;
  vote: Vote | null;
};

/** A small seeded random number generator (mulberry32), so every run draws the same numbers. */
function seeded(seed: number) {
  let state = seed >>> 0;
  const next = () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const pick = <T>(items: readonly T[]): T => items[Math.floor(next() * items.length)];
  return {
    pick,
    /** A whole number from min to max, both included. */
    int: (min: number, max: number) => min + Math.floor(next() * (max - min + 1)),
    /** Up to `count` different items, in drawn order. */
    sample<T>(items: readonly T[], count: number): T[] {
      const left = [...items];
      const out: T[] = [];
      while (out.length < count && left.length > 0) out.push(left.splice(Math.floor(next() * left.length), 1)[0]);
      return out;
    },
    /** One item, where a bigger weight is drawn more often. */
    weighted<T>(items: readonly T[], weight: (item: T) => number): T {
      let roll = next() * items.reduce((sum, item) => sum + weight(item), 0);
      for (const item of items) {
        roll -= weight(item);
        if (roll < 0) return item;
      }
      return items[items.length - 1];
    },
  };
}

/** Sorts dates and times as plain text, the same on every machine. */
const order = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

/** Every sample event, in date and time order. */
export function buildSamples(): Sample[] {
  const rng = seeded(SEED);
  const samples: Sample[] = [];
  const add = (date: string, slot: { start: string; end: string }, idea: Pick<Idea, 'title' | 'kind' | 'about' | 'going' | 'cube'>) => {
    const [fewest, most] = idea.going ?? GOING[idea.kind];
    samples.push({
      date, start: slot.start, end: slot.end, title: idea.title, kind: idea.kind, about: idea.about, going: rng.int(fewest, most),
      cubeMode: idea.kind === 'draft' ? 'vote' : 'none', cube: null, hint: idea.cube ?? null, vote: null,
    });
  };

  for (let date = FIRST; date <= LAST; date = addDays(date, 1)) {
    const day = weekday(date);
    const weekend = day === 0 || day === 6;
    const fixed = [...(day === 0 ? [SUNDAY_DRAFT] : []), ...(DATED[date] ? [DATED[date]] : [])];
    const free = (weekend ? WEEKEND : WEEKDAY).filter((slot) => !fixed.some((f) => f.start === slot.start || (f.allDay && slot.start < f.end)));
    // At least two events a day, and more on weekends.
    const total = rng.pick(weekend ? [2, 3, 3, 4] : [2, 2, 2, 3]);
    const slots = rng.sample(free, total - fixed.length).sort((a, b) => order(a.start, b.start));

    const titles = new Set(fixed.map((f) => f.title));
    const kinds = new Set<EventKind>(fixed.map((f) => f.kind));
    for (const f of fixed) add(date, f, f);
    for (const slot of slots) {
      const fits = IDEAS.filter((idea) => idea.parts.includes(slot.part) && !titles.has(idea.title));
      // A kind already on today's list is less likely, so the mini-Cube colors vary.
      const kind = rng.weighted([...new Set(fits.map((idea) => idea.kind))], (k) => KIND_WEIGHT[k] * (kinds.has(k) ? 0.35 : 1));
      const idea = rng.pick(fits.filter((i) => i.kind === kind));
      titles.add(idea.title);
      kinds.add(idea.kind);
      add(date, slot, idea);
    }
  }
  samples.sort((a, b) => order(a.date, b.date) || order(a.start, b.start));

  // About two thirds of the drafts stay a vote. For the rest, the host picked the Cube.
  const drafts = samples.filter((s) => s.kind === 'draft');
  const picked = new Set(rng.sample(drafts.filter((s) => s.hint), Math.round(drafts.length / 3)));
  let turn = 0;
  for (const s of samples) {
    if (!picked.has(s)) continue;
    s.cubeMode = 'set';
    s.cube = s.hint === 'any' ? EVERYDAY[turn++ % EVERYDAY.length] : s.hint;
  }

  // On the next four Sundays, the weekly draft and any other open draft have a vote under way.
  const firstSunday = addDays(TODAY, 7 - weekday(TODAY));
  for (let week = 0; week < 4; week += 1) {
    const open = samples.filter((s) => s.date === addDays(firstSunday, 7 * week) && s.cubeMode === 'vote' && (s.title === SUNDAY_DRAFT.title || s.hint === 'any'));
    open.forEach((s, i) => (s.vote = VOTES[(week + i) % VOTES.length]));
  }
  return samples;
}

const q = (v: string | number | null) => (v === null ? 'NULL' : typeof v === 'number' ? String(v) : `'${v.replace(/'/g, "''")}'`);
const row = (...values: (string | number | null)[]) => `(${values.map(q).join(', ')})`;

/** Levi's approved Cubes by name, one id each, as a WITH clause the statements below share. */
const OWN_CUBES = `own_cubes(name, id) AS (SELECT name, MIN(id) FROM cubes WHERE owner = ${q(OWNER)} AND status = 'approved' GROUP BY name)`;
const EVENT_COLUMNS = 'title, kind, date, start_time, end_time, starts_at, ends_at, description, location_name, cube_mode, status, is_sample, created_at, updated_at';
const SAMPLE_EVENT = (table: string) => `JOIN cal_events e ON e.is_sample = 1 AND e.date = ${table}.day AND e.start_time = ${table}.start_time`;

/** The whole migration file, as text. */
export function sampleSql(samples: Sample[] = buildSamples()): string {
  const days = [...new Set(samples.map((s) => s.date))];
  const on = (date: string) => samples.filter((s) => s.date === date);
  const voting = samples.filter((s) => s.vote);
  const seat = (s: Sample, n: number | null) => (n !== null && n < s.going ? ROSTER[n] : null);

  const events = days.map((date) =>
    [
      `-- ${formatDate(date, 'long')}`,
      `INSERT INTO cal_events (${EVENT_COLUMNS}) VALUES`,
      on(date)
        .map((s) => {
          const { startsAt, endsAt } = eventInstants(s.date, s.start, s.end, CAL_TZ);
          // Every draft goes in as a vote. The UPDATE further down sets the host's Cube, if the library has it.
          return `  ${row(s.title, s.kind, s.date, s.start, s.end, startsAt, endsAt, `Sample event. ${s.about}`, VENUE, s.kind === 'draft' ? 'vote' : 'none', 'approved', 1, STAMP, STAMP)}`;
        })
        .join(',\n') + ';',
    ].join('\n'),
  );

  const suggested = voting.flatMap((s) => s.vote!.cubes.map((cube, i) => `    ${row(s.date, s.start, i + 1, cube, ROSTER[i % s.going], seat(s, s.vote!.bringers[i]))}`));
  const ballots = voting.flatMap((s) =>
    s.vote!.ballots.slice(0, s.going).map((ranking, voter) => `    ${row(s.date, s.start, ROSTER[voter], ...ranking.map((place) => s.vote!.cubes[place]))}`),
  );

  return `-- Sample events for the events calendar, 2026-11-23: placeholder events from
-- ${FIRST} through ${LAST}, so a full month can be seen before any real
-- event exists. Written by scripts/calendar-samples.ts. Do not edit this file
-- by hand. Change the script and run it again.
--
-- Every event here has is_sample = 1. The public calendar only shows those
-- with ?samples=1 in the address, and the admin page deletes them all with one
-- button. Nothing here names a real venue or a real person.
--
-- Apply it by hand, after 0008_calendar.sql. It is safe to run again, because
-- it starts by clearing the old samples. It never changes a real event, and it
-- only reads the Cube Library.

-- Start clean, so running this file twice never doubles the samples.
DELETE FROM cal_ballots WHERE event_id IN (SELECT id FROM cal_events WHERE is_sample = 1);
DELETE FROM cal_cube_suggestions WHERE event_id IN (SELECT id FROM cal_events WHERE is_sample = 1);
DELETE FROM cal_attendees WHERE event_id IN (SELECT id FROM cal_events WHERE is_sample = 1);
DELETE FROM cal_events WHERE is_sample = 1;

-- The events, day by day. Times are local to Indianapolis, and starts_at and
-- ends_at are the same moments in UTC. An end time before the start time means
-- the event ends the next day. Every draft starts out as a vote.

${events.join('\n\n')}

-- Who is going. Each row of the plan is one event and how many people are going.
-- An event with 3 going gets the first 3 people on the roster. The token values
-- are not hashes, so no real visitor can ever match one.
WITH roster(seat, name) AS (VALUES
    ${ROSTER.map((name, i) => row(i + 1, name)).join(', ')}),
  plan(day, start_time, going) AS (VALUES
${days.map((date) => `    ${on(date).map((s) => row(s.date, s.start, s.going)).join(', ')}`).join(',\n')})
INSERT INTO cal_attendees (event_id, name, token_hash, created_at)
SELECT e.id, roster.name, 'sample:' || e.id || ':' || roster.seat, e.created_at
FROM plan
${SAMPLE_EVENT('plan')}
JOIN roster ON roster.seat <= plan.going
ORDER BY e.id, roster.seat;

-- For some drafts the host has already picked the Cube. Each row names a Cube
-- that Levi owns in the Cube Library. If that Cube is not there, nothing
-- matches and the event simply stays a vote.
WITH ${OWN_CUBES},
  picked(day, start_time, cube) AS (VALUES
${samples.filter((s) => s.cube).map((s) => `    ${row(s.date, s.start, s.cube)}`).join(',\n')})
UPDATE cal_events SET cube_mode = 'set', cube_id = own_cubes.id
FROM picked JOIN own_cubes ON own_cubes.name = picked.cube
WHERE cal_events.is_sample = 1 AND cal_events.date = picked.day AND cal_events.start_time = picked.start_time;

-- A vote under way on the next four Sundays: three suggested Cubes for each
-- open draft, with who suggested each one and who can bring it. The seat keeps
-- the Cubes in the order they were suggested, which is how a tie is settled.
WITH ${OWN_CUBES},
  suggested(day, start_time, seat, cube, suggester, bringer) AS (VALUES
${suggested.join(',\n')})
INSERT INTO cal_cube_suggestions (event_id, cube_id, suggested_by, bringer_id, created_at)
SELECT e.id, own_cubes.id, s.id, b.id, e.created_at
FROM suggested
${SAMPLE_EVENT('suggested')} AND e.cube_mode = 'vote'
JOIN own_cubes ON own_cubes.name = suggested.cube
LEFT JOIN cal_attendees s ON s.event_id = e.id AND s.name = suggested.suggester
LEFT JOIN cal_attendees b ON b.event_id = e.id AND b.name = suggested.bringer
ORDER BY e.id, suggested.seat;

-- The ballots. Each row is one person and the three Cubes they ranked, first
-- choice first. A ballot is left out when one of its Cubes is not in the Cube Library.
WITH ${OWN_CUBES},
  ballot(day, start_time, voter, choice_1, choice_2, choice_3) AS (VALUES
${ballots.join(',\n')})
INSERT INTO cal_ballots (event_id, attendee_id, ranking, updated_at)
SELECT e.id, a.id, json_array(c1.id, c2.id, c3.id), e.created_at
FROM ballot
${SAMPLE_EVENT('ballot')} AND e.cube_mode = 'vote'
JOIN cal_attendees a ON a.event_id = e.id AND a.name = ballot.voter
JOIN own_cubes c1 ON c1.name = ballot.choice_1
JOIN own_cubes c2 ON c2.name = ballot.choice_2
JOIN own_cubes c3 ON c3.name = ballot.choice_3
ORDER BY e.id, a.id;
`;
}

// Only write the file when this script is run, not when a test imports it.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const samples = buildSamples();
  writeFileSync(OUT, sampleSql(samples));
  const days = new Set(samples.map((s) => s.date)).size;
  const going = samples.reduce((sum, s) => sum + s.going, 0);
  console.log(`Wrote ${fileURLToPath(OUT)}: ${samples.length} sample events over ${days} days, ${going} people going, ${samples.filter((s) => s.cube).length} Cubes picked by the host, ${samples.filter((s) => s.vote).length} votes under way.`);
}
