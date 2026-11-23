-- The events calendar, 2026-11-23: /cube-commonwealth/events/ and its admin page.
-- Version 1 serves the Cube Commonwealth. Every event carries a community, so a
-- sitewide calendar for other tabletop communities can read the same tables later.
-- Tables are prefixed cal_. The older wwp_events table is a different thing (past
-- meetups for Where We Play) and stays as it is. Spec: docs/calendar/SPEC.md.

-- One row per event. Times are local wall time in the event's time zone; starts_at
-- and ends_at are the same moments in UTC, kept in step by the server on every write.
-- submitter_name and submitter_email are private and never leave the admin API.
-- closed_tally is the count as it stood when voting closed, written the first time someone
-- leaves after the close, so a late change of plans cannot change a result people have read.
CREATE TABLE cal_events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  community         TEXT    NOT NULL DEFAULT 'cube-commonwealth',
  title             TEXT    NOT NULL,
  kind              TEXT    NOT NULL DEFAULT 'draft',      -- draft, class, meetup, celebration, other
  date              TEXT    NOT NULL,                      -- YYYY-MM-DD, local to tz
  start_time        TEXT    NOT NULL,                      -- HH:MM, 24 hour, local
  end_time          TEXT    NOT NULL,                      -- HH:MM; at or before start_time means the next day
  tz                TEXT    NOT NULL DEFAULT 'America/Indiana/Indianapolis',
  starts_at         TEXT    NOT NULL,                      -- UTC ISO instant, kept in step with date, start_time, tz
  ends_at           TEXT    NOT NULL,                      -- UTC ISO instant
  description       TEXT,
  location_name     TEXT,
  location_address  TEXT,
  cube_mode         TEXT    NOT NULL DEFAULT 'vote',       -- vote, set, none
  cube_id           INTEGER REFERENCES cubes(id) ON DELETE SET NULL,  -- the Cube the host set or confirmed
  vote_close_hours  INTEGER NOT NULL DEFAULT 24,           -- voting closes this many hours before starts_at
  status            TEXT    NOT NULL DEFAULT 'approved',   -- pending, approved, cancelled, rejected
  is_sample         INTEGER NOT NULL DEFAULT 0,            -- 1 for placeholder events, shown only on request
  submitter_name    TEXT,                                  -- private: who suggested it
  submitter_email   TEXT,                                  -- private
  closed_tally      TEXT,                                  -- JSON Tally, frozen after voting closes
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL
);
CREATE INDEX cal_events_by_date ON cal_events (community, date, start_time);
CREATE INDEX cal_events_status ON cal_events (status);

-- People who said "I'm going". No accounts: a name, plus the hash of a private
-- token that the person's browser keeps so they can change their answers later.
CREATE TABLE cal_attendees (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL REFERENCES cal_events(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  token_hash  TEXT    NOT NULL,                            -- sha256 of the private attendee token
  created_at  TEXT    NOT NULL
);
-- One name per event, ignoring case. The server leans on this index to settle races.
CREATE UNIQUE INDEX cal_attendees_name ON cal_attendees (event_id, name COLLATE NOCASE);
CREATE UNIQUE INDEX cal_attendees_token ON cal_attendees (token_hash);

-- Cubes from the Cube Library that attendees put forward for an event.
-- When an attendee leaves, their suggestions stay and the two attendee links clear.
CREATE TABLE cal_cube_suggestions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL REFERENCES cal_events(id) ON DELETE CASCADE,
  cube_id       INTEGER NOT NULL REFERENCES cubes(id) ON DELETE CASCADE,
  suggested_by  INTEGER REFERENCES cal_attendees(id) ON DELETE SET NULL,
  bringer_id    INTEGER REFERENCES cal_attendees(id) ON DELETE SET NULL,   -- who said "I can bring it"
  created_at    TEXT    NOT NULL
);
-- A Cube is suggested once per event.
CREATE UNIQUE INDEX cal_cube_suggestions_once ON cal_cube_suggestions (event_id, cube_id);

-- One ranked-choice ballot per attendee per event. The count is always worked out
-- fresh from these rows, so nothing here stores a result.
CREATE TABLE cal_ballots (
  event_id     INTEGER NOT NULL REFERENCES cal_events(id) ON DELETE CASCADE,
  attendee_id  INTEGER NOT NULL REFERENCES cal_attendees(id) ON DELETE CASCADE,
  ranking      TEXT    NOT NULL,                           -- JSON array of Cube ids, first choice first
  updated_at   TEXT    NOT NULL,
  PRIMARY KEY (event_id, attendee_id)
);
