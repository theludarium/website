// The whole pipeline for one page view, from request to database rows.
// Called from the Pages middleware inside waitUntil, after the page has
// already been sent, so nothing here can slow a visitor down.

import { CACHE_DAYS } from './config.ts';
import { classify } from './classify.ts';
import { getCachedLookup, insertVisit, saveLookup, upsertCompany, type D1 } from './db.ts';
import { parseIgnoredIps, skipReason } from './filters.ts';
import { hashIp } from './hash.ts';
import { fetchIpinfo, lookupFromCf, mergeLookup, placeFromCf, type CfData, type Plan } from './lookup.ts';

/** Bindings and settings the middleware reads from the Pages project. */
export interface TrackEnv {
  DB?: D1;
  IPINFO_TOKEN?: string;
  /** "lite" (default, free) or "core". */
  IPINFO_PLAN?: string;
  VISITOR_HASH_SALT?: string;
  VISITOR_IGNORE_IPS?: string;
  /** Local development only (.dev.vars): pretend every request came from this IP. */
  VISITOR_TEST_IP?: string;
}

export type TrackResult =
  | { skipped: string }
  | { logged: true; company: string | null; reason: string };

const clip = (value: string | null, max: number) => (value ? value.slice(0, max) : null);

export async function trackVisit(request: Request & { cf?: CfData }, env: TrackEnv, now = new Date()): Promise<TrackResult> {
  if (!env.DB || !env.VISITOR_HASH_SALT) {
    console.error('Visitor tracking needs the DB binding and VISITOR_HASH_SALT');
    return { skipped: 'not configured' };
  }

  const url = new URL(request.url);
  const ip = env.VISITOR_TEST_IP || request.headers.get('CF-Connecting-IP');
  const userAgent = request.headers.get('User-Agent');

  const skip = skipReason({
    method: request.method,
    pathname: url.pathname,
    ip,
    userAgent,
    headers: request.headers,
    ignoredIps: parseIgnoredIps(env.VISITOR_IGNORE_IPS),
  });
  if (skip || !ip) return { skipped: skip ?? 'no-ip' };

  const ipHash = await hashIp(ip, env.VISITOR_HASH_SALT);
  const place = placeFromCf(request.cf);

  // Who owns this network? Ask the cache first, IPinfo only on a miss.
  let cached = await getCachedLookup(env.DB, ipHash, CACHE_DAYS, now);
  if (!cached) {
    const plan: Plan = env.IPINFO_PLAN === 'core' ? 'core' : 'lite';
    const info = env.IPINFO_TOKEN ? await fetchIpinfo(ip, env.IPINFO_TOKEN, plan) : null;
    const lookup = mergeLookup(lookupFromCf(request.cf), info);
    const verdict = classify(lookup);
    const row = {
      asn: lookup.asn,
      org: lookup.org,
      domain: lookup.domain,
      type: lookup.type,
      keep: verdict.keep ? 1 : 0,
      kind: verdict.kind,
      reason: verdict.reason,
    };
    await saveLookup(env.DB, ipHash, row, now);
    cached = { ...row, looked_up_at: now.toISOString() };
  }

  let companyId: number | null = null;
  if (cached.keep && cached.org) {
    companyId = await upsertCompany(
      env.DB,
      {
        key: cached.domain ?? cached.asn ?? cached.org,
        name: cached.org,
        domain: cached.domain,
        asn: cached.asn,
        kind: cached.kind ?? 'business',
        ...place,
        path: url.pathname,
      },
      now,
    );
  }

  await insertVisit(
    env.DB,
    {
      path: url.pathname,
      referrer: clip(request.headers.get('Referer'), 500),
      utmSource: clip(url.searchParams.get('utm_source'), 100),
      utmMedium: clip(url.searchParams.get('utm_medium'), 100),
      utmCampaign: clip(url.searchParams.get('utm_campaign'), 100),
      userAgent: clip(userAgent, 300),
      ipHash,
      ...place,
      companyId,
    },
    now,
  );

  return { logged: true, company: companyId ? cached.org : null, reason: cached.reason ?? '' };
}
