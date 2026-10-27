// Every SQL statement the tracker and the digest use, in one place.
// The D1 interface below is the small slice of Cloudflare's D1 API we call,
// typed here so this code type-checks without the Workers type package.

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<unknown>;
}

export interface D1 {
  prepare(sql: string): D1Statement;
}

export interface CachedLookup {
  asn: string | null;
  org: string | null;
  domain: string | null;
  type: string | null;
  keep: number;
  kind: string | null;
  reason: string | null;
  looked_up_at: string;
}

const DAY = 24 * 60 * 60 * 1000;
const daysAgo = (days: number, now: Date) => new Date(now.getTime() - days * DAY).toISOString();

/** The cached lookup for this hash, if it is younger than maxAgeDays. */
export async function getCachedLookup(db: D1, ipHash: string, maxAgeDays: number, now = new Date()) {
  return db
    .prepare('SELECT asn, org, domain, type, keep, kind, reason, looked_up_at FROM vc_ip_cache WHERE ip_hash = ?1 AND looked_up_at >= ?2')
    .bind(ipHash, daysAgo(maxAgeDays, now))
    .first<CachedLookup>();
}

export async function saveLookup(db: D1, ipHash: string, row: Omit<CachedLookup, 'looked_up_at'>, now = new Date()) {
  await db
    .prepare(
      `INSERT INTO vc_ip_cache (ip_hash, looked_up_at, asn, org, domain, type, keep, kind, reason)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9)
       ON CONFLICT(ip_hash) DO UPDATE SET looked_up_at = excluded.looked_up_at, asn = excluded.asn,
         org = excluded.org, domain = excluded.domain, type = excluded.type, keep = excluded.keep,
         kind = excluded.kind, reason = excluded.reason`,
    )
    .bind(ipHash, now.toISOString(), row.asn, row.org, row.domain, row.type, row.keep, row.kind, row.reason)
    .run();
}

/** Drops cache rows older than maxAgeDays. The digest Worker runs this weekly. */
export async function purgeCache(db: D1, maxAgeDays: number, now = new Date()) {
  await db.prepare('DELETE FROM vc_ip_cache WHERE looked_up_at < ?1').bind(daysAgo(maxAgeDays, now)).run();
}

export interface CompanyInput {
  /** What makes a company one row: its domain, else its ASN, else its name. */
  key: string;
  name: string;
  domain: string | null;
  asn: string | null;
  kind: string;
  country: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  path: string;
}

/** Adds a visit to the company, creating it on first sight. Returns the company id. */
export async function upsertCompany(db: D1, c: CompanyInput, now = new Date()): Promise<number | null> {
  const row = await db
    .prepare(
      `INSERT INTO vc_companies (key, name, domain, asn, kind, country, region, region_code, city,
         first_seen, last_seen, visit_count, pages)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?10, 1, json_array(?11))
       ON CONFLICT(key) DO UPDATE SET
         name = excluded.name,
         domain = coalesce(excluded.domain, vc_companies.domain),
         country = excluded.country, region = excluded.region, region_code = excluded.region_code, city = excluded.city,
         last_seen = excluded.last_seen,
         visit_count = vc_companies.visit_count + 1,
         pages = CASE
           WHEN EXISTS (SELECT 1 FROM json_each(vc_companies.pages) WHERE value = ?11) THEN vc_companies.pages
           ELSE json_insert(vc_companies.pages, '$[#]', ?11)
         END
       RETURNING id`,
    )
    .bind(c.key, c.name, c.domain, c.asn, c.kind, c.country, c.region, c.regionCode, c.city, now.toISOString(), c.path)
    .first<{ id: number }>();
  return row?.id ?? null;
}

export interface VisitInput {
  path: string;
  referrer: string | null;
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  userAgent: string | null;
  ipHash: string;
  country: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
  companyId: number | null;
}

export async function insertVisit(db: D1, v: VisitInput, now = new Date()) {
  await db
    .prepare(
      `INSERT INTO vc_visits (at, path, referrer, utm_source, utm_medium, utm_campaign, user_agent, ip_hash,
         country, region, region_code, city, company_id)
       VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)`,
    )
    .bind(now.toISOString(), v.path, v.referrer, v.utmSource, v.utmMedium, v.utmCampaign, v.userAgent, v.ipHash,
      v.country, v.region, v.regionCode, v.city, v.companyId)
    .run();
}

/** One company's activity inside the digest window. */
export interface CompanyActivity {
  id: number;
  name: string;
  domain: string | null;
  kind: string;
  country: string | null;
  region: string | null;
  region_code: string | null;
  city: string | null;
  first_seen: string;
  last_seen: string;
  visits: number;
  distinct_pages: number;
  /** Comma-separated distinct paths. */
  paths: string;
  /** utm_source of the first visit in the window, else its referrer. */
  source: string | null;
}

export async function recentCompanies(db: D1, days: number, now = new Date()): Promise<CompanyActivity[]> {
  const since = daysAgo(days, now);
  const { results } = await db
    .prepare(
      `SELECT c.id, c.name, c.domain, c.kind, c.country, c.region, c.region_code, c.city, c.first_seen, c.last_seen,
         COUNT(v.id) AS visits,
         COUNT(DISTINCT v.path) AS distinct_pages,
         GROUP_CONCAT(DISTINCT v.path) AS paths,
         (SELECT coalesce(utm_source, referrer) FROM vc_visits
            WHERE company_id = c.id AND at >= ?1 ORDER BY at LIMIT 1) AS source
       FROM vc_companies c
       JOIN vc_visits v ON v.company_id = c.id
       WHERE v.at >= ?1
       GROUP BY c.id`,
    )
    .bind(since)
    .all<CompanyActivity>();
  return results;
}
