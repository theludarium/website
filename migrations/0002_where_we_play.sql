-- Where We Play: members, venues, drive times, events. Apply with:
--   npx wrangler d1 migrations apply ludarium-site --local    (your machine)
--   npx wrangler d1 migrations apply ludarium-site --remote   (Cloudflare)
-- Every table is prefixed wwp_ so it sits beside any other tables in the
-- site's database. Numbered 0002 so it sorts after the visiting-companies
-- branch's 0001 if that branch lands later.

-- One row per member who shared where they live. Raw addresses are read only
-- by the admin routes; public_lat and public_lng are the snapped point
-- (cross street or zip centroid) that any member-facing map would use.
CREATE TABLE wwp_members (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  "group"          TEXT    NOT NULL DEFAULT 'cube-commonwealth',
  email            TEXT    NOT NULL,
  discord_handle   TEXT,
  first_name       TEXT,
  zip              TEXT    NOT NULL,
  street_address   TEXT,
  cross_street     TEXT,
  lat              REAL,
  lng              REAL,
  geocode_source   TEXT    NOT NULL DEFAULT 'failed',   -- address, cross_street, zip, failed
  public_lat       REAL,
  public_lng       REAL,
  availability     TEXT    NOT NULL DEFAULT '[]',       -- JSON array of slot keys, see src/lib/where-we-play/shared.ts
  edit_token_hash  TEXT    NOT NULL,                    -- sha256 of the private edit token
  created_at       TEXT    NOT NULL,
  updated_at       TEXT    NOT NULL
);
CREATE UNIQUE INDEX wwp_members_group_email ON wwp_members ("group", email);
CREATE INDEX wwp_members_token ON wwp_members (edit_token_hash);

-- Candidate places to meet. Members may suggest one (status idea, hidden
-- until approved); the admin vets it through the statuses.
CREATE TABLE wwp_venues (
  id                      INTEGER PRIMARY KEY AUTOINCREMENT,
  "group"                 TEXT    NOT NULL DEFAULT 'cube-commonwealth',
  name                    TEXT    NOT NULL,
  address                 TEXT    NOT NULL,
  lat                     REAL,
  lng                     REAL,
  neighborhood            TEXT,                        -- city or area shown to members
  table_count             INTEGER,
  hours                   TEXT,
  website                 TEXT,
  call_ahead              INTEGER NOT NULL DEFAULT 0,
  notes                   TEXT,
  status                  TEXT    NOT NULL DEFAULT 'idea',   -- idea, contacted, confirmed, played here, not a fit
  address_public          INTEGER NOT NULL DEFAULT 0,  -- 1 = members may see the street address
  suggested_by_member_id  INTEGER REFERENCES wwp_members(id) ON DELETE SET NULL,
  suggestion_note         TEXT,
  approved                INTEGER NOT NULL DEFAULT 1,  -- 0 while a member suggestion waits in the queue
  created_at              TEXT    NOT NULL,
  updated_at              TEXT    NOT NULL
);
CREATE INDEX wwp_venues_status ON wwp_venues ("group", status);

-- Cached car drive time for every member-to-venue pair. Computed once and
-- kept until the member or venue moves. source is osrm or straight_line.
CREATE TABLE wwp_drive_times (
  member_id    INTEGER NOT NULL REFERENCES wwp_members(id) ON DELETE CASCADE,
  venue_id     INTEGER NOT NULL REFERENCES wwp_venues(id) ON DELETE CASCADE,
  seconds      INTEGER NOT NULL,
  source       TEXT    NOT NULL,
  computed_at  TEXT    NOT NULL,
  PRIMARY KEY (member_id, venue_id)
);
CREATE INDEX wwp_drive_times_venue ON wwp_drive_times (venue_id);

-- Meetups that happened, for attendance tracking.
CREATE TABLE wwp_events (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  "group"     TEXT    NOT NULL DEFAULT 'cube-commonwealth',
  venue_id    INTEGER REFERENCES wwp_venues(id) ON DELETE SET NULL,
  date        TEXT    NOT NULL,                       -- YYYY-MM-DD
  headcount   INTEGER NOT NULL DEFAULT 0,
  notes       TEXT,
  created_at  TEXT    NOT NULL
);
CREATE INDEX wwp_events_date ON wwp_events ("group", date);

-- Nominatim answers, keyed by the normalized query, so an address is looked up once.
CREATE TABLE wwp_geocode_cache (
  query         TEXT PRIMARY KEY,
  lat           REAL,
  lng           REAL,
  found         INTEGER NOT NULL,
  looked_up_at  TEXT    NOT NULL
);

-- Submission rate limit: one row per hashed IP per hour window.
CREATE TABLE wwp_rate_limits (
  ip_hash       TEXT    NOT NULL,
  window_start  TEXT    NOT NULL,
  count         INTEGER NOT NULL DEFAULT 0,
  PRIMARY KEY (ip_hash, window_start)
);
