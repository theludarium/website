// The public rules of the calendar: which events a visitor may see, who may do
// what to an event and when, and how a visitor's suggestion is saved. The action
// table is in docs/calendar/SPEC.md, section 4. The SQL is in db.ts and the
// answer shapes are in view.ts. Everything takes `now`, so tests can fix the clock.
import { daysBetween, eventInstants, isIsoDate } from '../../lib/calendar/dates.ts';
import {
  CAL_CAPS, CAL_TZ, DEFAULT_VOTE_CLOSE_HOURS,
  type ActionErrorCode, type AttendResponse, type EventAction, type EventPayload, type EventSuggestion, type EventSummary,
} from '../../lib/calendar/shared.ts';
import { cleanAttendeeName, cleanRanking } from '../../lib/calendar/validate.ts';
import type { D1 } from '../where-we-play/env.ts';
import { newToken } from '../where-we-play/tokens.ts';
import {
  claimBringer, deleteAttendee, deleteBallot, deleteSuggestion, freezeTally, getAttendeeByToken, getPublicEvent, getSuggestion, insertAttendee,
  insertEvents, insertSuggestion, listAttendees, listBallots, listPublicEvents, listSuggestions, releaseBringer, saveBallot, suggestionFacts,
  type EventRow, type ListQuery,
} from './db.ts';
import type { CalEnv } from './env.ts';
import { allow, hashAttendeeToken, isHuman } from './guard.ts';
import { parseRanking, rsvpOpen, shownTally, toAttendee, toDetail, toSuggestions, toSummary, toTally, voteClosesAt, votingOpen } from './view.ts';

// ---------- The list ----------

const LIST_MAX = 500;

/** Reads ?from, ?to, ?samples, and ?limit. Null when the dates are missing, backwards, or too far apart. */
export function parseListQuery(params: URLSearchParams): ListQuery | null {
  const from = params.get('from');
  const to = params.get('to');
  if (!isIsoDate(from) || !isIsoDate(to) || to < from || daysBetween(from, to) > CAL_CAPS.rangeDays) return null;
  const limit = Number(params.get('limit') || LIST_MAX);
  return {
    from,
    to,
    samples: params.get('samples') === '1',
    limit: Number.isInteger(limit) ? Math.min(Math.max(limit, 1), LIST_MAX) : LIST_MAX,
  };
}

export async function listEvents(db: D1, query: ListQuery): Promise<EventSummary[]> {
  return (await listPublicEvents(db, query)).map(toSummary);
}

// ---------- One event ----------

type Me = { id: number; name: string };

async function buildPayload(db: D1, event: EventRow, me: Me | null, now: Date): Promise<EventPayload> {
  const [attendees, suggestions, ballots] = await Promise.all([listAttendees(db, event.id), listSuggestions(db, event.id), listBallots(db, event.id)]);
  const suggested = suggestions.map((s) => s.cube_id);
  const mine = me ? ballots.find((b) => b.attendee_id === me.id) : undefined;
  return {
    // The row was read before any change this request made, so count the list just read.
    event: toDetail(event, now, attendees.length),
    attendees: attendees.map(toAttendee),
    suggestions: toSuggestions(suggestions, me?.id ?? null),
    tally: shownTally(event, suggestions, ballots),
    // A stored ranking may still name a Cube that has since been withdrawn.
    me: me ? { id: me.id, name: me.name, ranking: cleanRanking(parseRanking(mine?.ranking), suggested) ?? [] } : null,
  };
}

/** A public event. A sample answers only a request that asked for samples, so made-up events stay off the site. */
async function findEvent(db: D1, eventId: number, samples: boolean): Promise<EventRow | null> {
  const event = await getPublicEvent(db, eventId);
  return event && (samples || event.is_sample === 0) ? event : null;
}

/** What GET /api/events/:id answers. Null when there is no such public event. */
export async function eventPayload(db: D1, eventId: number, tokenHash: string | null, now: Date, samples = false): Promise<EventPayload | null> {
  const event = await findEvent(db, eventId, samples);
  if (!event) return null;
  const me = tokenHash ? await getAttendeeByToken(db, event.id, tokenHash) : null;
  return buildPayload(db, event, me, now);
}

// ---------- Actions ----------

export interface Caller {
  /** The attendee token the request carried and its hash, or null. */
  token?: string | null;
  tokenHash: string | null;
  ip: string;
  /** The page asked for sample events. */
  samples?: boolean;
}
export type Refusal = { status: number; error: ActionErrorCode };
export type ActionResult = { payload: EventPayload | AttendResponse } | Refusal;

const ACTIONS: readonly unknown[] = ['attend', 'leave', 'suggest', 'withdraw', 'bring', 'vote'] satisfies EventAction['action'][];
const refuse = (status: number, error: ActionErrorCode): Refusal => ({ status, error });
const isId = (value: unknown): value is number => typeof value === 'number' && Number.isInteger(value) && value > 0;
const isUnique = (err: unknown) => String(err).includes('UNIQUE');

/** The index on names ignores case for plain letters only. This also catches accented ones. */
const sameName = (a: string, b: string) => a.normalize('NFKC').toLowerCase() === b.normalize('NFKC').toLowerCase();

/** POST /api/events/:id. `body` is the parsed JSON, or null when it was not a JSON object. */
export async function act(db: D1, env: CalEnv, eventId: number, body: Record<string, unknown> | null, caller: Caller, now: Date): Promise<ActionResult> {
  if (!body || !ACTIONS.includes(body.action)) return refuse(400, 'bad');
  const event = await findEvent(db, eventId, caller.samples === true);
  if (!event) return refuse(404, 'gone');
  // A cancelled event takes no changes, except that anyone may take their own name off it.
  if (event.status !== 'approved' && body.action !== 'leave') return refuse(409, 'rsvp-closed');

  const me = caller.tokenHash ? await getAttendeeByToken(db, event.id, caller.tokenHash) : null;
  if (body.action === 'attend') {
    // The browser makes the token, so a retry after a lost answer finds the sign-up it already made.
    if (me && caller.token) return { payload: { ...(await buildPayload(db, event, me, now)), token: caller.token } };
    return attend(db, env, event, body, caller, now);
  }

  if (!me) return refuse(401, 'not-attending');
  if (!(await allow(db, env, 'act', `attendee:${me.id}`, now))) return refuse(429, 'slow');

  const refused = await change(db, event, me, body, now);
  return refused ?? { payload: await buildPayload(db, event, body.action === 'leave' ? null : me, now) };
}

/**
 * "I'm going". Everything the visitor can fix or cannot change is checked first.
 * A Turnstile token works once, so it is spent only on a try that is otherwise
 * good, and someone who picks a taken name can change it and send again.
 */
async function attend(db: D1, env: CalEnv, event: EventRow, body: Record<string, unknown>, caller: Caller, now: Date): Promise<ActionResult> {
  const { ip } = caller;
  if (!rsvpOpen(event, now)) return refuse(409, 'rsvp-closed');
  const name = cleanAttendeeName(body.name);
  if (!name) return refuse(400, 'name');
  const going = await listAttendees(db, event.id);
  if (going.length >= CAL_CAPS.attendeesPerEvent) return refuse(409, 'full');
  if (going.some((a) => sameName(a.name, name))) return refuse(409, 'name-taken');

  if (!(await isHuman(env, typeof body.turnstileToken === 'string' ? body.turnstileToken : '', ip))) return refuse(403, 'verify');
  if (!(await allow(db, env, 'attend', ip, now))) return refuse(429, 'slow');

  const token = caller.token ?? newToken();
  const tokenHash = caller.tokenHash ?? (await hashAttendeeToken(token));
  let id: number | null;
  try {
    id = await insertAttendee(db, event.id, name, tokenHash, now);
  } catch (err) {
    if (!isUnique(err)) throw err;
    // The same sign-up sent twice at once finds itself. Otherwise someone took the name a moment ago.
    const mine = await getAttendeeByToken(db, event.id, tokenHash);
    if (mine) return { payload: { ...(await buildPayload(db, event, mine, now)), token } };
    return refuse(409, 'name-taken');
  }
  if (id === null) return refuse(409, 'full');
  return { payload: { ...(await buildPayload(db, event, { id, name }, now)), token } };
}

/** Keeps the count of a closed vote before a ballot leaves it. */
async function freezeVote(db: D1, event: EventRow, now: Date): Promise<void> {
  const closes = voteClosesAt(event);
  if (event.status !== 'approved' || event.cube_id !== null || closes === null || now.getTime() < Date.parse(closes)) return;
  const [suggestions, ballots] = await Promise.all([listSuggestions(db, event.id), listBallots(db, event.id)]);
  event.closed_tally = await freezeTally(db, event.id, JSON.stringify(toTally(suggestions, ballots)));
}

/** Makes the change an attendee asked for. Null when it went through. */
async function change(db: D1, event: EventRow, me: Me, body: Record<string, unknown>, now: Date): Promise<Refusal | null> {
  switch (body.action) {
    case 'leave':
      // Once voting has closed, the result stands whoever drops out afterward.
      await freezeVote(db, event, now);
      // Their ballot goes with them. Their suggestions stay, unsigned, by the foreign keys.
      await deleteAttendee(db, event.id, me.id);
      return null;

    case 'suggest': {
      if (!votingOpen(event, now)) return refuse(409, 'vote-closed');
      const cubeId = body.cubeId;
      if (!isId(cubeId)) return refuse(400, 'cube');
      const facts = await suggestionFacts(db, event.id, cubeId, me.id);
      if (!facts.approved) return refuse(400, 'cube');
      if (facts.suggested) return refuse(409, 'duplicate');
      if (facts.mine >= CAL_CAPS.suggestionsPerAttendee || facts.total >= CAL_CAPS.suggestionsPerEvent) return refuse(409, 'limit');
      try {
        if (!(await insertSuggestion(db, event.id, cubeId, me.id, body.canBring === true, now))) return refuse(409, 'limit');
      } catch (err) {
        // Someone suggested the same Cube a moment ago. The unique index settles it.
        if (isUnique(err)) return refuse(409, 'duplicate');
        throw err;
      }
      return null;
    }

    case 'withdraw': {
      if (!votingOpen(event, now)) return refuse(409, 'vote-closed');
      const suggestion = isId(body.suggestionId) ? await getSuggestion(db, event.id, body.suggestionId) : null;
      if (!suggestion) return refuse(404, 'bad');
      // A Cube whose suggester has left belongs to the table, so anyone going may clear it.
      if (suggestion.suggested_by !== null && suggestion.suggested_by !== me.id) return refuse(403, 'not-yours');
      await deleteSuggestion(db, event.id, suggestion.id);
      return null;
    }

    case 'bring': {
      // Offering to bring a Cube stays open after voting closes, until the event ends.
      if (!rsvpOpen(event, now)) return refuse(409, 'rsvp-closed');
      if (typeof body.bring !== 'boolean') return refuse(400, 'bad');
      const suggestion = isId(body.suggestionId) ? await getSuggestion(db, event.id, body.suggestionId) : null;
      if (!suggestion) return refuse(404, 'bad');
      if (!body.bring) await releaseBringer(db, suggestion.id, me.id);
      else if (!(await claimBringer(db, suggestion.id, me.id))) return refuse(409, 'taken');
      return null;
    }

    case 'vote': {
      if (!votingOpen(event, now)) return refuse(409, 'vote-closed');
      const suggested = (await listSuggestions(db, event.id)).map((s) => s.cube_id);
      const ranking = cleanRanking(body.ranking, suggested);
      if (!ranking) return refuse(400, 'ranking');
      // An empty ranking takes the ballot back.
      if (ranking.length) await saveBallot(db, event.id, me.id, ranking, now);
      else await deleteBallot(db, event.id, me.id);
      return null;
    }

    default:
      return refuse(400, 'bad');
  }
}

// ---------- Suggest an event ----------

/** Saves a visitor's suggestion as pending, where only the admin can see it. Returns its id. */
export async function saveSuggestedEvent(db: D1, s: EventSuggestion, now: Date): Promise<number> {
  const [id] = await insertEvents(
    db,
    [
      {
        title: s.title,
        kind: s.kind,
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
        tz: CAL_TZ,
        ...eventInstants(s.date, s.startTime, s.endTime, CAL_TZ),
        description: s.description,
        locationName: s.locationName,
        locationAddress: s.locationAddress,
        cubeMode: s.cubeMode,
        cubeId: null,
        voteCloseHours: DEFAULT_VOTE_CLOSE_HOURS,
        status: 'pending',
        submitterName: s.submitterName,
        submitterEmail: s.submitterEmail,
      },
    ],
    now,
  );
  return id;
}
