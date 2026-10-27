-- Where We Play, 2026-10-27: email becomes optional and members get a last
-- name. SQLite cannot drop NOT NULL in place, so the members table is rebuilt.
-- Dropping it would cascade to drive times and clear venue suggesters, so both
-- are kept aside and put back. The unique (group, email) index still applies;
-- SQLite lets any number of rows share a NULL email.
PRAGMA defer_foreign_keys = true;

CREATE TABLE wwp_members_new (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  "group"          TEXT    NOT NULL DEFAULT 'cube-commonwealth',
  email            TEXT,
  discord_handle   TEXT,
  first_name       TEXT,
  last_name        TEXT,
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

INSERT INTO wwp_members_new (id, "group", email, discord_handle, first_name, zip, street_address, cross_street, lat, lng,
  geocode_source, public_lat, public_lng, availability, edit_token_hash, created_at, updated_at)
SELECT id, "group", email, discord_handle, first_name, zip, street_address, cross_street, lat, lng,
  geocode_source, public_lat, public_lng, availability, edit_token_hash, created_at, updated_at
FROM wwp_members;

CREATE TABLE wwp_keep_drive_times AS SELECT * FROM wwp_drive_times;
CREATE TABLE wwp_keep_suggesters AS SELECT id, suggested_by_member_id FROM wwp_venues WHERE suggested_by_member_id IS NOT NULL;

DROP TABLE wwp_members;
ALTER TABLE wwp_members_new RENAME TO wwp_members;
CREATE UNIQUE INDEX wwp_members_group_email ON wwp_members ("group", email);
CREATE INDEX wwp_members_token ON wwp_members (edit_token_hash);

INSERT OR IGNORE INTO wwp_drive_times SELECT * FROM wwp_keep_drive_times;
UPDATE wwp_venues SET suggested_by_member_id = (SELECT k.suggested_by_member_id FROM wwp_keep_suggesters k WHERE k.id = wwp_venues.id)
WHERE id IN (SELECT id FROM wwp_keep_suggesters);
DROP TABLE wwp_keep_drive_times;
DROP TABLE wwp_keep_suggesters;
