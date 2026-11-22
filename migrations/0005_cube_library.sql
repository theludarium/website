-- The Cube Library, 2026-11-22: the public list at /cube-commonwealth/cubes/.
-- Anyone can submit a Cube. It stays pending until Levi approves it in the admin queue.
-- email and ip_hash are private and never leave the admin API.
CREATE TABLE IF NOT EXISTS cubes (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  name             TEXT    NOT NULL,
  list_url         TEXT    NOT NULL,
  owner            TEXT    NOT NULL,
  location         TEXT    NOT NULL,
  description      TEXT,
  note             TEXT,
  style            TEXT    NOT NULL DEFAULT 'Other',
  card_count       INTEGER,
  list_updated_at  TEXT,
  lending          TEXT,                              -- yes, with-owner, no
  format           TEXT,                              -- paper, proxies, digital
  discord          TEXT,
  email            TEXT,
  status           TEXT    NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  ip_hash          TEXT    NOT NULL,
  created_at       TEXT    NOT NULL,
  reviewed_at      TEXT
);
CREATE INDEX IF NOT EXISTS cubes_status ON cubes (status, location);
CREATE INDEX IF NOT EXISTS cubes_ip_time ON cubes (ip_hash, created_at);
-- Two people can own the same list, but one person cannot have it listed twice.
CREATE UNIQUE INDEX IF NOT EXISTS cubes_one_per_owner ON cubes (list_url, owner COLLATE NOCASE) WHERE status <> 'rejected';
