-- The Ludometer, first schema. Keep schema.sql in step with this file.

-- BGG Hotness list, one row per game per day, stored exactly as BGG gives it.
CREATE TABLE IF NOT EXISTS hot_snapshots (
  date TEXT NOT NULL,            -- YYYY-MM-DD, UTC
  rank INTEGER NOT NULL,
  game_id INTEGER NOT NULL,      -- BGG thing id
  name TEXT NOT NULL,
  year INTEGER,
  PRIMARY KEY (date, game_id)
);
CREATE INDEX IF NOT EXISTS hot_snapshots_game ON hot_snapshots (game_id, date);

-- BGG thing stats, one row per game per day, unchanged.
CREATE TABLE IF NOT EXISTS game_stats (
  date TEXT NOT NULL,
  game_id INTEGER NOT NULL,
  users_rated INTEGER,
  average REAL,
  bayes_average REAL,
  owned INTEGER,
  bgg_rank INTEGER NULL,         -- null when BGG says Not Ranked
  PRIMARY KEY (date, game_id)
);
CREATE INDEX IF NOT EXISTS game_stats_game ON game_stats (game_id, date);

-- First-party signals: our own site, app, newsletter and jobs.
-- type is one of: play, shelf_add, like, course_signup, sheet_download,
-- watch_signup, page_view, return_visit, youtube_views, table_seated.
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  at TEXT NOT NULL,              -- ISO 8601 UTC timestamp
  type TEXT NOT NULL,
  game_id INTEGER NULL,
  game_slug TEXT NULL,
  value REAL DEFAULT 1,
  source TEXT,
  meta TEXT                      -- small JSON object, never personal data
);
CREATE INDEX IF NOT EXISTS events_at ON events (at);
CREATE INDEX IF NOT EXISTS events_game ON events (game_id, at);
CREATE INDEX IF NOT EXISTS events_slug ON events (game_slug, at);

-- The weekly index. week is the Monday that starts the scored 7 days.
CREATE TABLE IF NOT EXISTS weekly_scores (
  week TEXT NOT NULL,
  game_id INTEGER NOT NULL,
  name TEXT,
  rank INTEGER NOT NULL,
  score REAL,                    -- 0..1
  attention REAL,                -- 0..1
  interest REAL,                 -- 0..1
  play REAL,                     -- 0..1
  prev_rank INTEGER NULL,
  bgg_hot_rank INTEGER NULL,     -- BGG Hotness rank on the week's last snapshot
  days_on_list INTEGER,          -- total days on the BGG Hotness list through the week's end
  PRIMARY KEY (week, game_id)
);

-- Private watch app: board games, crowdfunding campaigns, new TCGs.
CREATE TABLE IF NOT EXISTS watchlist (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  kind TEXT NOT NULL,            -- boardgame, crowdfunding, tcg
  bgg_id INTEGER NULL,
  release_window TEXT,
  status TEXT,                   -- watching, rising, covered, passed
  signals TEXT,                  -- JSON or free text
  notes TEXT,
  trigger TEXT NULL,             -- why it moved this week
  verdict TEXT NULL,             -- our read on it
  updated_at TEXT
);

-- Private settings. Never returned by public endpoints.
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);

-- Names and site slugs for games, learned from BGG and from events that carry both.
-- Lets Kit tags such as course-catan (slug only) count toward a BGG id.
CREATE TABLE IF NOT EXISTS games (
  game_id INTEGER PRIMARY KEY,
  name TEXT,
  year INTEGER,
  slug TEXT UNIQUE,
  updated_at TEXT
);

INSERT OR IGNORE INTO settings (key, value) VALUES
  ('weights', '{"attention":0.6,"interest":0.3,"play":0.1}'),
  ('weights_high_play', '{"attention":0.45,"interest":0.3,"play":0.25}'),
  ('high_play_threshold', '500');
