// Settings for the visiting-company tracker. Everything in this file is
// public and safe to commit. Secrets (IPINFO_TOKEN, VISITOR_HASH_SALT) and
// your own IP addresses live in the Cloudflare project settings, never here.

/** Pages whose visits are logged. Exact pathnames, with the site's trailing slash. */
export const TRACKED_PATHS = ['/corporate-events/', '/corporate-events/thanks/'];

/** Companies in this region rank highest. Codes match Cloudflare's request.cf fields. */
export const TARGET_REGION = { country: 'US', regionCode: 'IN', label: 'Indiana' };

/** A lookup result is reused for this long before the IP is looked up again. */
export const CACHE_DAYS = 30;

/** The weekly digest covers this many days. */
export const DIGEST_DAYS = 7;
