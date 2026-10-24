-- Visiting-company tracker. Apply with:
--   npx wrangler d1 migrations apply ludarium-visitors --local    (your machine)
--   npx wrangler d1 migrations apply ludarium-visitors --remote   (Cloudflare)

-- One row per logged page view. No IP address is stored, only a salted hash.
CREATE TABLE visits (
  id           INTEGER PRIMARY KEY AUTOINCREMENT,
  at           TEXT    NOT NULL,          -- ISO 8601, UTC
  path         TEXT    NOT NULL,
  referrer     TEXT,
  utm_source   TEXT,
  utm_medium   TEXT,
  utm_campaign TEXT,
  user_agent   TEXT,
  ip_hash      TEXT    NOT NULL,          -- sha256(salt:ip), see src/server/visitors/hash.ts
  country      TEXT,
  region       TEXT,
  region_code  TEXT,
  city         TEXT,
  company_id   INTEGER REFERENCES companies(id)  -- NULL when the network was an ISP, host, or VPN
);
CREATE INDEX visits_at ON visits (at);
CREATE INDEX visits_company_at ON visits (company_id, at);

-- What we learned about a network, keyed by the same hash. Rows older than
-- 30 days are ignored and purged by the digest Worker, so a lookup is paid
-- for at most once a month per visitor.
CREATE TABLE ip_cache (
  ip_hash      TEXT    PRIMARY KEY,
  looked_up_at TEXT    NOT NULL,
  asn          TEXT,
  org          TEXT,
  domain       TEXT,
  type         TEXT,                      -- IPinfo Core only
  keep         INTEGER NOT NULL,          -- 1 = counted as a company, 0 = dropped
  kind         TEXT,                      -- business, education, government
  reason       TEXT                       -- why it was kept or dropped
);
CREATE INDEX ip_cache_looked_up_at ON ip_cache (looked_up_at);

-- One row per company, kept current on every visit.
CREATE TABLE companies (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  key         TEXT    NOT NULL UNIQUE,    -- domain, else ASN, else name
  name        TEXT    NOT NULL,
  domain      TEXT,
  asn         TEXT,
  kind        TEXT    NOT NULL,
  country     TEXT,                       -- where the latest visit came from
  region      TEXT,
  region_code TEXT,
  city        TEXT,
  first_seen  TEXT    NOT NULL,
  last_seen   TEXT    NOT NULL,
  visit_count INTEGER NOT NULL DEFAULT 0,
  pages       TEXT    NOT NULL DEFAULT '[]'  -- JSON array of distinct paths viewed
);
CREATE INDEX companies_last_seen ON companies (last_seen);
