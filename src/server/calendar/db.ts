// Every SQL statement the events calendar uses, in one place. The tables are in
// migrations/0008_calendar.sql. Nothing here reads the clock: writers take `now`.
//
// Privacy is settled here first. The public queries cannot return a pending or
// rejected event, only the admin queries read submitter_name and
// submitter_email, and no query selects token_hash.
import { CAL_CAPS, CAL_COMMUNITY, type CubeMode, type EventKind, type EventStatus } from '../../lib/calendar/shared.ts';
import type { D1 } from '../where-we-play/env.ts';

// ---------- Cubes ----------

/** The Cube Library columns an event shows, under a c_ prefix so they sit beside other columns. */
export interface JoinedCube {
  c_id: number;
  c_name: string;
  c_list_url: string;
  c_owner: string;
  c_style: string;
  c_card_count: number | null;
  c_lending: string | null;
  c_image_url: string | null;
  c_image_artist: string | null;
}
/** A LEFT JOIN that finds no approved Cube leaves every one of them null. */
export type MaybeCube = JoinedCube | Record<keyof JoinedCube, null>;

const CUBE_COLUMNS = `c.id AS c_id, c.name AS c_name, c.list_url AS c_list_url, c.owner AS c_owner, c.style AS c_style,
  c.card_count AS c_card_count, c.lending AS c_lending, c.image_url AS c_image_url, c.image_artist AS c_image_artist`;

export async function isApprovedCube(db: D1, id: number): Promise<boolean> {
  return Boolean(await db.prepare("SELECT id FROM cubes WHERE id = ?1 AND status = 'approved'").bind(id).first());
}

// ---------- Events ----------

export type EventRow = MaybeCube & {
  id: number;
  community: string;
  title: string;
  kind: EventKind;
  date: string;
  start_time: string;
  end_time: string;
  tz: string;
  starts_at: string;
  ends_at: string;
  description: string | null;
  location_name: string | null;
  location_address: string | null;
  cube_mode: CubeMode;
  cube_id: number | null;
  vote_close_hours: number;
  status: EventStatus;
  is_sample: number;
  created_at: string;
  /** The count as it stood when voting closed (JSON), once someone has left after the close. */
  closed_tally: string | null;
  announce: number;
  announced_at: string | null;
  /** How many people said they are going. */
  going: number;
};

export type AdminEventRow = EventRow & {
  submitter_name: string | null;
  submitter_email: string | null;
  suggestions: number;
  ballots: number;
};

const EVENT_COLUMNS = `e.id, e.community, e.title, e.kind, e.date, e.start_time, e.end_time, e.tz, e.starts_at, e.ends_at,
  e.description, e.location_name, e.location_address, e.cube_mode, e.cube_id, e.vote_close_hours, e.status, e.is_sample, e.created_at, e.closed_tally, e.announce, e.announced_at,
  (SELECT COUNT(*) FROM cal_attendees a WHERE a.event_id = e.id) AS going, ${CUBE_COLUMNS}`;

const ADMIN_COLUMNS = `${EVENT_COLUMNS}, e.submitter_name, e.submitter_email,
  (SELECT COUNT(*) FROM cal_cube_suggestions s JOIN cubes sc ON sc.id = s.cube_id AND sc.status = 'approved' WHERE s.event_id = e.id) AS suggestions,
  (SELECT COUNT(*) FROM cal_ballots b WHERE b.event_id = e.id) AS ballots`;

// Only an approved Cube counts, so an event whose Cube has left the library shows none.
const EVENT_FROM = `FROM cal_events e LEFT JOIN cubes c ON c.id = e.cube_id AND c.status = 'approved'`;

/** Pending and rejected events never leave the admin API. */
const IS_PUBLIC = `e.status IN ('approved', 'cancelled')`;

export interface ListQuery {
  from: string;
  to: string;
  samples: boolean;
  limit: number;
}

export async function listPublicEvents(db: D1, query: ListQuery): Promise<EventRow[]> {
  const { results } = await db
    .prepare(
      `SELECT ${EVENT_COLUMNS} ${EVENT_FROM}
       WHERE e.community = ?1 AND e.date >= ?2 AND e.date <= ?3 AND ${IS_PUBLIC} AND (?4 = 1 OR e.is_sample = 0)
       ORDER BY e.date, e.start_time, e.id LIMIT ?5`,
    )
    .bind(CAL_COMMUNITY, query.from, query.to, query.samples ? 1 : 0, query.limit)
    .all<EventRow>();
  return results;
}

export function getPublicEvent(db: D1, id: number) {
  return db.prepare(`SELECT ${EVENT_COLUMNS} ${EVENT_FROM} WHERE e.id = ?1 AND ${IS_PUBLIC}`).bind(id).first<EventRow>();
}

export async function listAdminEvents(db: D1): Promise<AdminEventRow[]> {
  return (await db.prepare(`SELECT ${ADMIN_COLUMNS} ${EVENT_FROM} ORDER BY e.date, e.start_time, e.id`).all<AdminEventRow>()).results;
}

export function getAdminEvent(db: D1, id: number) {
  return db.prepare(`SELECT ${ADMIN_COLUMNS} ${EVENT_FROM} WHERE e.id = ?1`).bind(id).first<AdminEventRow>();
}

/** The columns the admin's form edits, plus the instants worked out from them. */
export interface EventFields {
  title: string;
  kind: EventKind;
  date: string;
  startTime: string;
  endTime: string;
  startsAt: string;
  endsAt: string;
  description: string | null;
  locationName: string | null;
  locationAddress: string | null;
  cubeMode: CubeMode;
  cubeId: number | null;
  voteCloseHours: number;
  status: EventStatus;
  announce: boolean;
}

export interface NewEvent extends EventFields {
  tz: string;
  /** Set only on a visitor's suggestion. */
  submitterName?: string | null;
  submitterEmail?: string | null;
}

/** Inserts events as one batch, so a repeating event lands whole or not at all. Returns the new ids in order. */
export async function insertEvents(db: D1, events: NewEvent[], now: Date): Promise<number[]> {
  const at = now.toISOString();
  const insert = db.prepare(
    `INSERT INTO cal_events (community, title, kind, date, start_time, end_time, tz, starts_at, ends_at, description, location_name,
       location_address, cube_mode, cube_id, vote_close_hours, status, submitter_name, submitter_email, announce, created_at, updated_at)
     VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?18, ?19, ?20, ?20)`,
  );
  const results = (await db.batch(
    events.map((e) =>
      insert.bind(
        CAL_COMMUNITY,
        e.title,
        e.kind,
        e.date,
        e.startTime,
        e.endTime,
        e.tz,
        e.startsAt,
        e.endsAt,
        e.description,
        e.locationName,
        e.locationAddress,
        e.cubeMode,
        e.cubeId,
        e.voteCloseHours,
        e.status,
        e.submitterName ?? null,
        e.submitterEmail ?? null,
        e.announce ? 1 : 0,
        at,
      ),
    ),
  )) as { meta?: { last_row_id?: number } }[];
  return results.map((r) => Number(r.meta?.last_row_id ?? 0));
}

/** Writes every field the admin's form edits, and lets go of a frozen count. The caller has already merged the change onto the stored row. */
export async function updateEvent(db: D1, id: number, e: EventFields, now: Date): Promise<void> {
  await db
    .prepare(
      `UPDATE cal_events SET title = ?2, kind = ?3, date = ?4, start_time = ?5, end_time = ?6, starts_at = ?7, ends_at = ?8,
         description = ?9, location_name = ?10, location_address = ?11, cube_mode = ?12, cube_id = ?13, vote_close_hours = ?14,
         status = ?15, announce = ?17, closed_tally = NULL, updated_at = ?16
       WHERE id = ?1`,
    )
    .bind(id, e.title, e.kind, e.date, e.startTime, e.endTime, e.startsAt, e.endsAt, e.description, e.locationName, e.locationAddress, e.cubeMode, e.cubeId, e.voteCloseHours, e.status, now.toISOString(), e.announce ? 1 : 0)
    .run();
}

// The deletes return the row they removed, so "was it there" never depends on how a cascade is counted.

/** True when the event was there. Its attendees, suggestions, and ballots go with it by cascade. */
export async function deleteEvent(db: D1, id: number): Promise<boolean> {
  return Boolean(await db.prepare('DELETE FROM cal_events WHERE id = ?1 RETURNING id').bind(id).first());
}

/** Removes every placeholder event. Returns how many there were. */
export async function deleteSampleEvents(db: D1): Promise<number> {
  return (await db.prepare('DELETE FROM cal_events WHERE is_sample = 1 RETURNING id').all()).results.length;
}

/** Keeps the count as it stands now, unless one is already kept. Answers the one that is kept. */
export async function freezeTally(db: D1, id: number, tally: string): Promise<string | null> {
  const row = await db
    .prepare('UPDATE cal_events SET closed_tally = COALESCE(closed_tally, ?2) WHERE id = ?1 RETURNING closed_tally')
    .bind(id, tally)
    .first<{ closed_tally: string | null }>();
  return row?.closed_tally ?? null;
}

/** Lets go of a frozen count, for when the admin takes a person or a Cube off an event. */
export async function clearFrozenTally(db: D1, id: number): Promise<void> {
  await db.prepare('UPDATE cal_events SET closed_tally = NULL WHERE id = ?1').bind(id).run();
}

// ---------- Attendees ----------

export interface AttendeeRow {
  id: number;
  name: string;
  created_at: string;
}

/** Who is going, in the order they joined. */
export async function listAttendees(db: D1, eventId: number): Promise<AttendeeRow[]> {
  return (await db.prepare('SELECT id, name, created_at FROM cal_attendees WHERE event_id = ?1 ORDER BY id').bind(eventId).all<AttendeeRow>()).results;
}

/** The attendee a token belongs to. A token only counts for the event its row is on. */
export function getAttendeeByToken(db: D1, eventId: number, tokenHash: string) {
  return db.prepare('SELECT id, name FROM cal_attendees WHERE token_hash = ?1 AND event_id = ?2').bind(tokenHash, eventId).first<{ id: number; name: string }>();
}

/**
 * The new attendee's id, or null when the event is full. The count is inside the
 * statement, so requests sent at the same moment cannot pass the cap together.
 * Throws a UNIQUE error when the name is taken on this event, ignoring case.
 */
export async function insertAttendee(db: D1, eventId: number, name: string, tokenHash: string, now: Date): Promise<number | null> {
  const row = await db
    .prepare(
      `INSERT INTO cal_attendees (event_id, name, token_hash, created_at)
       SELECT ?1, ?2, ?3, ?4 WHERE (SELECT COUNT(*) FROM cal_attendees WHERE event_id = ?1) < ?5
       RETURNING id`,
    )
    .bind(eventId, name, tokenHash, now.toISOString(), CAL_CAPS.attendeesPerEvent)
    .first<{ id: number }>();
  return row?.id ?? null;
}

/** True when the attendee was on this event. Their ballot goes too; their suggestions stay, unsigned. */
export async function deleteAttendee(db: D1, eventId: number, attendeeId: number): Promise<boolean> {
  return Boolean(await db.prepare('DELETE FROM cal_attendees WHERE id = ?1 AND event_id = ?2 RETURNING id').bind(attendeeId, eventId).first());
}

// ---------- Suggested Cubes ----------

export type SuggestionRow = JoinedCube & {
  id: number;
  cube_id: number;
  suggested_by: number | null;
  bringer_id: number | null;
  suggested_by_name: string | null;
  bringer_name: string | null;
};

/** An event's suggestions, earliest first. One whose Cube is no longer approved is left out. */
export async function listSuggestions(db: D1, eventId: number): Promise<SuggestionRow[]> {
  const { results } = await db
    .prepare(
      `SELECT s.id, s.cube_id, s.suggested_by, s.bringer_id, sa.name AS suggested_by_name, ba.name AS bringer_name, ${CUBE_COLUMNS}
       FROM cal_cube_suggestions s
       JOIN cubes c ON c.id = s.cube_id AND c.status = 'approved'
       LEFT JOIN cal_attendees sa ON sa.id = s.suggested_by
       LEFT JOIN cal_attendees ba ON ba.id = s.bringer_id
       WHERE s.event_id = ?1 ORDER BY s.id`,
    )
    .bind(eventId)
    .all<SuggestionRow>();
  return results;
}

export function getSuggestion(db: D1, eventId: number, id: number) {
  return db
    .prepare('SELECT id, suggested_by, bringer_id FROM cal_cube_suggestions WHERE id = ?1 AND event_id = ?2')
    .bind(id, eventId)
    .first<{ id: number; suggested_by: number | null; bringer_id: number | null }>();
}

export interface SuggestionFacts {
  /** The Cube is in the Cube Library and approved. */
  approved: number;
  /** The Cube is already suggested for this event. */
  suggested: number;
  /** Suggestions on this event, and how many of them are this attendee's. */
  total: number;
  mine: number;
}

/** Everything the "suggest" rules need to know, in one read. */
export async function suggestionFacts(db: D1, eventId: number, cubeId: number, attendeeId: number): Promise<SuggestionFacts> {
  const row = await db
    .prepare(
      `SELECT EXISTS (SELECT 1 FROM cubes WHERE id = ?2 AND status = 'approved') AS approved,
              EXISTS (SELECT 1 FROM cal_cube_suggestions WHERE event_id = ?1 AND cube_id = ?2) AS suggested,
              COUNT(*) AS total, COALESCE(SUM(s.suggested_by = ?3), 0) AS mine
       FROM cal_cube_suggestions s JOIN cubes c ON c.id = s.cube_id AND c.status = 'approved'
       WHERE s.event_id = ?1`,
    )
    .bind(eventId, cubeId, attendeeId)
    .first<SuggestionFacts>();
  return row!;
}

/**
 * False when a cap is already reached. Both caps are counted inside the statement,
 * so requests sent at the same moment cannot pass them together.
 * Throws a UNIQUE error when the Cube is already suggested for this event.
 */
export async function insertSuggestion(db: D1, eventId: number, cubeId: number, attendeeId: number, canBring: boolean, now: Date): Promise<boolean> {
  const row = await db
    .prepare(
      `INSERT INTO cal_cube_suggestions (event_id, cube_id, suggested_by, bringer_id, created_at)
       SELECT ?1, ?2, ?3, ?4, ?5
       WHERE (SELECT COUNT(*) FROM cal_cube_suggestions s JOIN cubes c ON c.id = s.cube_id AND c.status = 'approved' WHERE s.event_id = ?1) < ?6
         AND (SELECT COUNT(*) FROM cal_cube_suggestions WHERE event_id = ?1 AND suggested_by = ?3) < ?7
       RETURNING id`,
    )
    .bind(eventId, cubeId, attendeeId, canBring ? attendeeId : null, now.toISOString(), CAL_CAPS.suggestionsPerEvent, CAL_CAPS.suggestionsPerAttendee)
    .first();
  return Boolean(row);
}

/** True when the suggestion was on this event. */
export async function deleteSuggestion(db: D1, eventId: number, id: number): Promise<boolean> {
  return Boolean(await db.prepare('DELETE FROM cal_cube_suggestions WHERE id = ?1 AND event_id = ?2 RETURNING id').bind(id, eventId).first());
}

/**
 * Makes the attendee the bringer unless someone else already is. True when
 * they are the bringer afterwards. One statement, so two people cannot both win.
 */
export async function claimBringer(db: D1, suggestionId: number, attendeeId: number): Promise<boolean> {
  return Boolean(
    await db
      .prepare('UPDATE cal_cube_suggestions SET bringer_id = ?2 WHERE id = ?1 AND (bringer_id IS NULL OR bringer_id = ?2) RETURNING id')
      .bind(suggestionId, attendeeId)
      .first(),
  );
}

/** Clears the bringer, but only when it is this attendee. */
export async function releaseBringer(db: D1, suggestionId: number, attendeeId: number): Promise<void> {
  await db.prepare('UPDATE cal_cube_suggestions SET bringer_id = NULL WHERE id = ?1 AND bringer_id = ?2').bind(suggestionId, attendeeId).run();
}

// ---------- Ballots ----------

export interface BallotRow {
  attendee_id: number;
  /** JSON array of Cube ids, first choice first. */
  ranking: string;
}

export async function listBallots(db: D1, eventId: number): Promise<BallotRow[]> {
  return (await db.prepare('SELECT attendee_id, ranking FROM cal_ballots WHERE event_id = ?1 ORDER BY attendee_id').bind(eventId).all<BallotRow>()).results;
}

/** One ballot per attendee per event: saving again replaces it. */
export async function saveBallot(db: D1, eventId: number, attendeeId: number, ranking: number[], now: Date): Promise<void> {
  await db
    .prepare(
      `INSERT INTO cal_ballots (event_id, attendee_id, ranking, updated_at) VALUES (?1, ?2, ?3, ?4)
       ON CONFLICT(event_id, attendee_id) DO UPDATE SET ranking = excluded.ranking, updated_at = excluded.updated_at`,
    )
    .bind(eventId, attendeeId, JSON.stringify(ranking), now.toISOString())
    .run();
}

export async function deleteBallot(db: D1, eventId: number, attendeeId: number): Promise<void> {
  await db.prepare('DELETE FROM cal_ballots WHERE event_id = ?1 AND attendee_id = ?2').bind(eventId, attendeeId).run();
}
