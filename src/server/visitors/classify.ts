// Decides whether a network belongs to a company worth knowing about, or to
// an internet provider, phone carrier, cloud host, or VPN that tells us nothing.
//
// IPinfo Lite (free) gives the network's name and domain but no type, so the
// name lists below do most of the work today. IPinfo Core adds a `type` field
// and hosting/anonymous/mobile flags; when those are present they win.

export interface Lookup {
  /** Autonomous system number, like "AS15169". */
  asn: string | null;
  /** Who runs the network, like "Google LLC". */
  org: string | null;
  /** The network's website, like "google.com". */
  domain: string | null;
  /** IPinfo Core only: isp, hosting, business, education, or government. */
  type: string | null;
  /** IPinfo Core only. */
  hosting?: boolean;
  anonymous?: boolean;
  mobile?: boolean;
}

export type Kind = 'business' | 'education' | 'government';

export interface Verdict {
  /** True when the visit should count toward a company. */
  keep: boolean;
  kind: Kind | null;
  /** A short note on why, kept in the cache for debugging. */
  reason: string;
}

// Internet providers and phone carriers, national and Indiana regional.
const ISP_NAMES =
  /\b(comcast|xfinity|at&t|att-|verizon|cellco|t-mobile|tmobile|sprint|spectrum|charter|cox|centurylink|lumen|qwest|frontier|windstream|mediacom|altice|optimum|suddenlink|cablevision|wideopenwest|google fiber|starlink|spacex|viasat|hughes|us cellular|metronet|brightspeed|smithville|ninestar|mainstream fiber|watch communications|endeavor communications|consolidated communications|ziply|astound|earthlink|roadrunner|time warner|bell canada|rogers|telus|shaw|virgin media|vodafone|deutsche telekom|telefonica|telstra|china (telecom|unicom|mobile)|jio|airtel)\b/i;
const ISP_WORDS = /\b(communications?|telecom\w*|broadband|cable\w*|wireless|cellular|mobile|fiber|fibre|internet|isp|telephone|telco)\b/i;
const ISP_DOMAINS = /(comcast|xfinity|att|sbcglobal|verizon|t-mobile|tmus|spectrum|charter|rr|cox|centurylink|lumen|frontier|windstream|mediacom|optimum|metronet|starlink)\.(net|com)$/i;

// Cloud, hosting, CDN, VPN, and corporate proxy networks.
const HOSTING_NAMES =
  /\b(amazon|aws|microsoft|azure|google|alphabet|cloudflare|akamai|fastly|digitalocean|linode|ovh|hetzner|oracle|vultr|hostinger|godaddy|rackspace|leaseweb|choopa|contabo|ionos|m247|datacamp|psychz|quadranet|zenlayer|apple|icloud|zscaler|netskope|hosting|cloud|data ?cent(er|re)|servers?|colocation|colo|vpn|proxy|tor|relay|cdn)\b/i;
const HOSTING_DOMAINS = /(amazonaws|amazon|microsoft|azure|google|cloudflare|akamai|fastly|digitalocean|linode|ovh|hetzner|oraclecloud|vultr|zscaler|apple|icloud)\.(com|net|io)$/i;

const EDUCATION = /\b(university|college|school|academy|institute of technology|schools?)\b|\.edu$/i;
const GOVERNMENT = /\b(state of|county|city of|department of|federal|ministry|government)\b|\.gov$|\.mil$/i;

export function classify(lookup: Lookup): Verdict {
  const org = lookup.org?.trim() ?? '';
  const domain = lookup.domain?.trim().toLowerCase() ?? '';
  const drop = (reason: string): Verdict => ({ keep: false, kind: null, reason });

  if (!org && !domain) return drop('no organization');

  // IPinfo Core: trust its flags and type when we have them.
  if (lookup.hosting) return drop('hosting (flag)');
  if (lookup.anonymous) return drop('vpn or proxy (flag)');
  if (lookup.mobile) return drop('mobile carrier (flag)');
  const type = lookup.type?.toLowerCase();
  if (type === 'isp') return drop('isp (type)');
  if (type === 'hosting') return drop('hosting (type)');

  // Name and domain checks. These run on every plan.
  if (ISP_NAMES.test(org) || ISP_DOMAINS.test(domain)) return drop(`isp: ${org || domain}`);
  if (HOSTING_NAMES.test(org) || HOSTING_DOMAINS.test(domain)) return drop(`hosting: ${org || domain}`);

  const text = `${org} ${domain}`;
  if (type === 'education' || EDUCATION.test(text)) return { keep: true, kind: 'education', reason: 'education' };
  if (type === 'government' || GOVERNMENT.test(text)) return { keep: true, kind: 'government', reason: 'government' };

  // Generic provider words come last so "Cummins Fiber" style names still drop,
  // but only after the specific lists above had their say.
  if (ISP_WORDS.test(org)) return drop(`isp word: ${org}`);

  return { keep: true, kind: 'business', reason: type === 'business' ? 'business (type)' : 'business' };
}
