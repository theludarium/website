// Turns calendar rows into the shapes the contract promises
// (src/lib/calendar/shared.ts), and holds the two "is it still open" rules that
// both the answers and the actions lean on. Every answer is built field by
// field, so a column added later cannot slip out by accident.
import { voteCloseInstant } from '../../lib/calendar/dates.ts';
import type { AdminEvent, Attendee, CubeSuggestion, EventCube, EventDetail, EventSummary, Tally } from '../../lib/calendar/shared.ts';
import { tallyRankedChoice } from '../../lib/calendar/tally.ts';
import type { AdminEventRow, AttendeeRow, BallotRow, EventRow, JoinedCube, MaybeCube, SuggestionRow } from './db.ts';

type Timing = Pick<EventRow, 'status' | 'cube_mode' | 'cube_id' | 'vote_close_hours' | 'starts_at' | 'ends_at'>;

/** People can say they are going until an approved event ends. */
export const rsvpOpen = (e: Timing, now: Date) => e.status === 'approved' && now.getTime() < Date.parse(e.ends_at);

/** When voting closes, or null for an event with no vote. */
export const voteClosesAt = (e: Timing) => (e.cube_mode === 'vote' ? voteCloseInstant(e.starts_at, e.vote_close_hours) : null);

/** Voting runs until it closes or the host confirms a Cube, whichever comes first. */
export function votingOpen(e: Timing, now: Date): boolean {
  const closes = voteClosesAt(e);
  return e.status === 'approved' && closes !== null && e.cube_id === null && now.getTime() < Date.parse(closes);
}

const cubeOf = (c: JoinedCube): EventCube => ({
  id: c.c_id,
  name: c.c_name,
  listUrl: c.c_list_url,
  owner: c.c_owner,
  style: c.c_style,
  cardCount: c.c_card_count,
  lending: c.c_lending,
  imageUrl: c.c_image_url,
  imageArtist: c.c_image_artist,
});

/** The approved Cube an event row carries, or null when it has none. */
export const toCube = (row: MaybeCube): EventCube | null => (row.c_id === null ? null : cubeOf(row));

export function toSummary(row: EventRow): EventSummary {
  return {
    id: row.id,
    title: row.title,
    kind: row.kind,
    date: row.date,
    startTime: row.start_time,
    endTime: row.end_time,
    locationName: row.location_name,
    // The public queries return only approved and cancelled events.
    status: row.status === 'cancelled' ? 'cancelled' : 'approved',
    going: row.going,
    cubeMode: row.cube_mode,
    cubeName: toCube(row)?.name ?? null,
    isSample: row.is_sample === 1,
  };
}

/** Pass `going` when the attendees were read after the row was, so the two always agree. */
export function toDetail(row: EventRow, now: Date, going = row.going): EventDetail {
  return {
    ...toSummary(row),
    going,
    description: row.description,
    locationAddress: row.location_address,
    tz: row.tz,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    voteClosesAt: voteClosesAt(row),
    cube: toCube(row),
    rsvpOpen: rsvpOpen(row, now),
    votingOpen: votingOpen(row, now),
  };
}

/** The admin's view of an event: every status, plus who suggested it. Never send this from a public route. */
export function toAdminEvent(row: AdminEventRow): AdminEvent {
  return {
    ...toSummary(row),
    status: row.status,
    community: row.community,
    description: row.description,
    locationAddress: row.location_address,
    tz: row.tz,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    cubeId: row.cube_id,
    voteCloseHours: row.vote_close_hours,
    submitterName: row.submitter_name,
    submitterEmail: row.submitter_email,
    suggestions: row.suggestions,
    ballots: row.ballots,
    createdAt: row.created_at,
  };
}

export const toAttendee = (row: AttendeeRow): Attendee => ({ id: row.id, name: row.name });

/** `meId` is the caller's attendee id, or null for a visitor who is not going (and for the admin). */
export function toSuggestions(rows: SuggestionRow[], meId: number | null): CubeSuggestion[] {
  return rows.map((s) => ({
    id: s.id,
    cube: cubeOf(s),
    suggestedBy: s.suggested_by_name,
    bringer: s.bringer_name,
    mine: meId !== null && s.suggested_by === meId,
    iBring: meId !== null && s.bringer_id === meId,
  }));
}

/** A stored ranking as Cube ids. Anything unreadable counts as an empty ballot. */
export function parseRanking(raw: string | undefined): number[] {
  try {
    const value: unknown = JSON.parse(raw ?? '[]');
    return Array.isArray(value) ? value.filter((id): id is number => Number.isInteger(id)) : [];
  } catch {
    return [];
  }
}

/** The ranked-choice count, worked out fresh: candidates in the order they were suggested. */
export function toTally(suggestions: SuggestionRow[], ballots: BallotRow[]): Tally {
  return tallyRankedChoice(
    suggestions.map((s) => s.cube_id),
    ballots.map((b) => parseRanking(b.ranking)),
  );
}

/** A frozen count, as long as every Cube in it is still suggested (one may have left the library since). */
function frozenTally(raw: string | null, suggestions: SuggestionRow[]): Tally | null {
  if (!raw) return null;
  try {
    const tally = JSON.parse(raw) as Tally;
    const known = new Set(suggestions.map((s) => s.cube_id));
    const named = tally.rounds.flatMap((r) => r.counts.map((c) => c.cubeId));
    return named.every((id) => known.has(id)) && (tally.winner === null || known.has(tally.winner)) ? tally : null;
  } catch {
    return null;
  }
}

/** The count people see: the one kept at the close when there is one, else a fresh one. */
export const shownTally = (event: Pick<EventRow, 'closed_tally'>, suggestions: SuggestionRow[], ballots: BallotRow[]): Tally =>
  frozenTally(event.closed_tally, suggestions) ?? toTally(suggestions, ballots);
