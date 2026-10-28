// Every SQL statement Where We Play uses, in one place.
import type { D1, D1Statement } from './env.ts';
import type { DriveTime } from '../../lib/where-we-play/engine.ts';

export interface MemberRow {
  id: number;
  group: string;
  email: string | null;
  discord_handle: string | null;
  first_name: string | null;
  last_name: string | null;
  zip: string;
  street_address: string | null;
  cross_street: string | null;
  lat: number | null;
  lng: number | null;
  geocode_source: string;
  public_lat: number | null;
  public_lng: number | null;
  availability: string; // JSON array
  edit_token_hash: string;
  created_at: string;
  updated_at: string;
}

export interface VenueRow {
  id: number;
  group: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  table_count: number | null;
  hours: string | null;
  website: string | null;
  call_ahead: number;
  notes: string | null;
  status: string;
  address_public: number;
  suggested_by_member_id: number | null;
  suggestion_note: string | null;
  approved: number;
  created_at: string;
  updated_at: string;
}

export interface DriveTimeRow {
  member_id: number;
  venue_id: number;
  seconds: number;
  source: string;
  computed_at: string;
}

export interface EventRow {
  id: number;
  group: string;
  venue_id: number | null;
  date: string;
  headcount: number;
  notes: string | null;
  created_at: string;
}

const MEMBER_COLUMNS =
  'id, "group", email, discord_handle, first_name, last_name, zip, street_address, cross_street, lat, lng, geocode_source, public_lat, public_lng, availability, edit_token_hash, created_at, updated_at';
const VENUE_COLUMNS =
  'id, "group", name, address, lat, lng, neighborhood, table_count, hours, website, call_ahead, notes, status, address_public, suggested_by_member_id, suggestion_note, approved, created_at, updated_at';

export const parseAvailability = (raw: string): string[] => {
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === 'string') : [];
  } catch {
    return [];
  }
};

// Members

export function getMemberByEmail(db: D1, group: string, email: string) {
  return db.prepare(`SELECT ${MEMBER_COLUMNS} FROM wwp_members WHERE "group" = ?1 AND email = ?2`).bind(group, email).first<MemberRow>();
}

export function getMemberById(db: D1, id: number) {
  return db.prepare(`SELECT ${MEMBER_COLUMNS} FROM wwp_members WHERE id = ?1`).bind(id).first<MemberRow>();
}

export function getMemberByTokenHash(db: D1, hash: string) {
  return db.prepare(`SELECT ${MEMBER_COLUMNS} FROM wwp_members WHERE edit_token_hash = ?1`).bind(hash).first<MemberRow>();
}

export async function listMembers(db: D1, group: string) {
  return (await db.prepare(`SELECT ${MEMBER_COLUMNS} FROM wwp_members WHERE "group" = ?1 ORDER BY created_at DESC`).bind(group).all<MemberRow>()).results;
}

export interface MemberInput {
  group: string;
  email: string | null;
  discord_handle: string | null;
  first_name: string | null;
  last_name: string | null;
  zip: string;
  street_address: string | null;
  cross_street: string | null;
  lat: number | null;
  lng: number | null;
  geocode_source: string;
  public_lat: number | null;
  public_lng: number | null;
  availability: string[];
}

export async function insertMember(db: D1, input: MemberInput, tokenHash: string, now = new Date()): Promise<number> {
  const at = now.toISOString();
  const result = await db
    .prepare(
      `INSERT INTO wwp_members ("group", email, discord_handle, first_name, last_name, zip, street_address, cross_street, lat, lng,
         geocode_source, public_lat, public_lng, availability, edit_token_hash, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?16)`,
    )
    .bind(
      input.group,
      input.email,
      input.discord_handle,
      input.first_name,
      input.last_name,
      input.zip,
      input.street_address,
      input.cross_street,
      input.lat,
      input.lng,
      input.geocode_source,
      input.public_lat,
      input.public_lng,
      JSON.stringify(input.availability),
      tokenHash,
      at,
    )
    .run();
  return Number(result.meta?.last_row_id ?? 0);
}

/** Updates everything but the group and token. */
export async function updateMember(db: D1, id: number, input: Omit<MemberInput, 'group'>, now = new Date()) {
  await db
    .prepare(
      `UPDATE wwp_members SET email = ?2, discord_handle = ?3, first_name = ?4, last_name = ?5, zip = ?6, street_address = ?7,
         cross_street = ?8, lat = ?9, lng = ?10, geocode_source = ?11, public_lat = ?12, public_lng = ?13, availability = ?14,
         updated_at = ?15
       WHERE id = ?1`,
    )
    .bind(
      id,
      input.email,
      input.discord_handle,
      input.first_name,
      input.last_name,
      input.zip,
      input.street_address,
      input.cross_street,
      input.lat,
      input.lng,
      input.geocode_source,
      input.public_lat,
      input.public_lng,
      JSON.stringify(input.availability),
      now.toISOString(),
    )
    .run();
}

export async function setMemberTokenHash(db: D1, id: number, hash: string) {
  await db.prepare('UPDATE wwp_members SET edit_token_hash = ?2 WHERE id = ?1').bind(id, hash).run();
}

export async function deleteMember(db: D1, id: number) {
  await db.batch([
    db.prepare('DELETE FROM wwp_drive_times WHERE member_id = ?1').bind(id),
    db.prepare('UPDATE wwp_venues SET suggested_by_member_id = NULL WHERE suggested_by_member_id = ?1').bind(id),
    db.prepare('DELETE FROM wwp_members WHERE id = ?1').bind(id),
  ]);
}

export async function countMembers(db: D1, group: string) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN lat IS NOT NULL THEN 1 ELSE 0 END) AS located,
              SUM(CASE WHEN geocode_source = 'address' THEN 1 ELSE 0 END) AS with_address
       FROM wwp_members WHERE "group" = ?1`,
    )
    .bind(group)
    .first<{ total: number; located: number | null; with_address: number | null }>();
  return { total: row?.total ?? 0, located: row?.located ?? 0, withAddress: row?.with_address ?? 0 };
}

// Venues

export interface VenueFilter {
  approvedOnly?: boolean;
  statuses?: string[];
  located?: boolean;
}

export async function listVenues(db: D1, group: string, filter: VenueFilter = {}) {
  const where = ['"group" = ?1'];
  const binds: unknown[] = [group];
  if (filter.approvedOnly) where.push('approved = 1');
  if (filter.located) where.push('lat IS NOT NULL AND lng IS NOT NULL');
  if (filter.statuses?.length) {
    const placeholders = filter.statuses.map((_, i) => `?${binds.length + i + 1}`);
    where.push(`status IN (${placeholders.join(', ')})`);
    binds.push(...filter.statuses);
  }
  return (
    await db
      .prepare(`SELECT ${VENUE_COLUMNS} FROM wwp_venues WHERE ${where.join(' AND ')} ORDER BY approved ASC, name COLLATE NOCASE`)
      .bind(...binds)
      .all<VenueRow>()
  ).results;
}

export function getVenue(db: D1, id: number) {
  return db.prepare(`SELECT ${VENUE_COLUMNS} FROM wwp_venues WHERE id = ?1`).bind(id).first<VenueRow>();
}

export interface VenueInput {
  group: string;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  table_count: number | null;
  hours: string | null;
  website: string | null;
  call_ahead: boolean;
  notes: string | null;
  status: string;
  address_public: boolean;
  suggested_by_member_id: number | null;
  suggestion_note: string | null;
  approved: boolean;
}

export async function insertVenue(db: D1, input: VenueInput, now = new Date()): Promise<number> {
  const at = now.toISOString();
  const result = await db
    .prepare(
      `INSERT INTO wwp_venues ("group", name, address, lat, lng, neighborhood, table_count, hours, website, call_ahead, notes,
         status, address_public, suggested_by_member_id, suggestion_note, approved, created_at, updated_at)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15, ?16, ?17, ?17)`,
    )
    .bind(
      input.group,
      input.name,
      input.address,
      input.lat,
      input.lng,
      input.neighborhood,
      input.table_count,
      input.hours,
      input.website,
      input.call_ahead ? 1 : 0,
      input.notes,
      input.status,
      input.address_public ? 1 : 0,
      input.suggested_by_member_id,
      input.suggestion_note,
      input.approved ? 1 : 0,
      at,
    )
    .run();
  return Number(result.meta?.last_row_id ?? 0);
}

export type VenuePatch = Partial<Omit<VenueInput, 'group' | 'suggested_by_member_id' | 'suggestion_note'>>;

const VENUE_PATCH_COLUMNS: Record<keyof VenuePatch, string> = {
  name: 'name',
  address: 'address',
  lat: 'lat',
  lng: 'lng',
  neighborhood: 'neighborhood',
  table_count: 'table_count',
  hours: 'hours',
  website: 'website',
  call_ahead: 'call_ahead',
  notes: 'notes',
  status: 'status',
  address_public: 'address_public',
  approved: 'approved',
};

export async function updateVenue(db: D1, id: number, patch: VenuePatch, now = new Date()) {
  const sets: string[] = [];
  const binds: unknown[] = [id];
  for (const [key, column] of Object.entries(VENUE_PATCH_COLUMNS) as [keyof VenuePatch, string][]) {
    if (!(key in patch)) continue;
    const value = patch[key];
    binds.push(typeof value === 'boolean' ? (value ? 1 : 0) : (value ?? null));
    sets.push(`${column} = ?${binds.length}`);
  }
  if (!sets.length) return;
  binds.push(now.toISOString());
  sets.push(`updated_at = ?${binds.length}`);
  await db.prepare(`UPDATE wwp_venues SET ${sets.join(', ')} WHERE id = ?1`).bind(...binds).run();
}

export async function deleteVenue(db: D1, id: number) {
  await db.batch([
    db.prepare('DELETE FROM wwp_drive_times WHERE venue_id = ?1').bind(id),
    db.prepare('UPDATE wwp_events SET venue_id = NULL WHERE venue_id = ?1').bind(id),
    db.prepare('DELETE FROM wwp_venues WHERE id = ?1').bind(id),
  ]);
}

// Drive times

export async function listDriveTimes(db: D1, group: string) {
  return (
    await db
      .prepare(
        `SELECT d.member_id, d.venue_id, d.seconds, d.source, d.computed_at
         FROM wwp_drive_times d JOIN wwp_members m ON m.id = d.member_id WHERE m."group" = ?1`,
      )
      .bind(group)
      .all<DriveTimeRow>()
  ).results;
}

export const toPairs = (rows: DriveTimeRow[]): DriveTime[] =>
  rows.map((r) => ({ memberId: r.member_id, venueId: r.venue_id, seconds: r.seconds }));

export async function upsertDriveTimes(db: D1, rows: Omit<DriveTimeRow, 'computed_at'>[], now = new Date()) {
  if (!rows.length) return;
  const at = now.toISOString();
  const statements: D1Statement[] = rows.map((r) =>
    db
      .prepare(
        `INSERT INTO wwp_drive_times (member_id, venue_id, seconds, source, computed_at) VALUES (?1, ?2, ?3, ?4, ?5)
         ON CONFLICT(member_id, venue_id) DO UPDATE SET seconds = excluded.seconds, source = excluded.source, computed_at = excluded.computed_at`,
      )
      .bind(r.member_id, r.venue_id, r.seconds, r.source, at),
  );
  // D1 batches are limited in size; 100 statements at a time is comfortable.
  for (let i = 0; i < statements.length; i += 100) await db.batch(statements.slice(i, i + 100));
}

export async function deleteDriveTimesForMember(db: D1, memberId: number) {
  await db.prepare('DELETE FROM wwp_drive_times WHERE member_id = ?1').bind(memberId).run();
}

export async function deleteDriveTimesForVenue(db: D1, venueId: number) {
  await db.prepare('DELETE FROM wwp_drive_times WHERE venue_id = ?1').bind(venueId).run();
}

export async function deleteEstimatedDriveTimes(db: D1, group: string) {
  await db
    .prepare(
      `DELETE FROM wwp_drive_times WHERE source = 'straight_line'
       AND member_id IN (SELECT id FROM wwp_members WHERE "group" = ?1)`,
    )
    .bind(group)
    .run();
}

export async function countDriveTimes(db: D1, group: string) {
  const row = await db
    .prepare(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN d.source = 'straight_line' THEN 1 ELSE 0 END) AS estimated
       FROM wwp_drive_times d JOIN wwp_members m ON m.id = d.member_id WHERE m."group" = ?1`,
    )
    .bind(group)
    .first<{ total: number; estimated: number | null }>();
  return { total: row?.total ?? 0, estimated: row?.estimated ?? 0 };
}

// Events

export async function listEvents(db: D1, group: string) {
  return (
    await db
      .prepare('SELECT id, "group", venue_id, date, headcount, notes, created_at FROM wwp_events WHERE "group" = ?1 ORDER BY date DESC, id DESC')
      .bind(group)
      .all<EventRow>()
  ).results;
}

export async function insertEvent(db: D1, group: string, input: { venue_id: number | null; date: string; headcount: number; notes: string | null }, now = new Date()) {
  const result = await db
    .prepare('INSERT INTO wwp_events ("group", venue_id, date, headcount, notes, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)')
    .bind(group, input.venue_id, input.date, input.headcount, input.notes, now.toISOString())
    .run();
  return Number(result.meta?.last_row_id ?? 0);
}

export async function updateEvent(db: D1, id: number, input: { venue_id: number | null; date: string; headcount: number; notes: string | null }) {
  await db
    .prepare('UPDATE wwp_events SET venue_id = ?2, date = ?3, headcount = ?4, notes = ?5 WHERE id = ?1')
    .bind(id, input.venue_id, input.date, input.headcount, input.notes)
    .run();
}

export async function deleteEvent(db: D1, id: number) {
  await db.prepare('DELETE FROM wwp_events WHERE id = ?1').bind(id).run();
}

// Geocode cache

export async function getCachedGeocode(db: D1, query: string) {
  return db.prepare('SELECT lat, lng, found FROM wwp_geocode_cache WHERE query = ?1').bind(query).first<{ lat: number | null; lng: number | null; found: number }>();
}

export async function saveGeocode(db: D1, query: string, point: { lat: number; lng: number } | null, now = new Date()) {
  await db
    .prepare(
      `INSERT INTO wwp_geocode_cache (query, lat, lng, found, looked_up_at) VALUES (?1, ?2, ?3, ?4, ?5)
       ON CONFLICT(query) DO UPDATE SET lat = excluded.lat, lng = excluded.lng, found = excluded.found, looked_up_at = excluded.looked_up_at`,
    )
    .bind(query, point?.lat ?? null, point?.lng ?? null, point ? 1 : 0, now.toISOString())
    .run();
}

// Rate limit: `limit` submissions per hashed IP per hour.

export async function allowSubmission(db: D1, ipHash: string, limit: number, now = new Date()): Promise<boolean> {
  const windowStart = new Date(Math.floor(now.getTime() / 3_600_000) * 3_600_000).toISOString();
  const row = await db
    .prepare(
      `INSERT INTO wwp_rate_limits (ip_hash, window_start, count) VALUES (?1, ?2, 1)
       ON CONFLICT(ip_hash, window_start) DO UPDATE SET count = count + 1
       RETURNING count`,
    )
    .bind(ipHash, windowStart)
    .first<{ count: number }>();
  // Tidy old windows now and then; cheap, and keeps the table tiny.
  if ((row?.count ?? 0) === 1) {
    const cutoff = new Date(now.getTime() - 2 * 3_600_000).toISOString();
    await db.prepare('DELETE FROM wwp_rate_limits WHERE window_start < ?1').bind(cutoff).run();
  }
  return (row?.count ?? 1) <= limit;
}
