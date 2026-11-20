-- Shirt ideas, 2026-11-20: visitors suggest a tee or hoodie design from /store/#suggest-a-shirt.
-- Levi reviews them (an email per idea, plus scripts/shirt-ideas.mjs for the full list) and
-- marks each one. Emails are kept only to tell the person if their shirt gets made.
CREATE TABLE IF NOT EXISTS shirt_ideas (
  id               INTEGER PRIMARY KEY AUTOINCREMENT,
  game             TEXT    NOT NULL,
  idea             TEXT    NOT NULL,
  meaning          TEXT,
  credit_name      TEXT,
  email            TEXT,
  notify_if_made   INTEGER NOT NULL DEFAULT 0,
  status           TEXT    NOT NULL DEFAULT 'new',   -- new, maybe, made, passed
  ip_hash          TEXT    NOT NULL,
  created_at       TEXT    NOT NULL
);
CREATE INDEX IF NOT EXISTS shirt_ideas_ip_time ON shirt_ideas (ip_hash, created_at);
