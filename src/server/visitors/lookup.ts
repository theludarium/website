// Turns an IP address into a Lookup (network name, domain, type) using two
// free sources that are already in hand, plus one IPinfo call:
//   1. Cloudflare's request.cf, attached to every request: ASN, organization,
//      country, region, city.
//   2. IPinfo Lite (free): the network's name and website domain.
// Set IPINFO_PLAN=core to call the paid Core endpoint instead, which adds the
// type field and hosting/VPN/mobile flags that classify.ts prefers.

import type { Lookup } from './classify.ts';

/** The fields of Cloudflare's request.cf that we read. */
export interface CfData {
  asn?: number;
  asOrganization?: string;
  country?: string;
  region?: string;
  regionCode?: string;
  city?: string;
}

export interface Place {
  country: string | null;
  region: string | null;
  regionCode: string | null;
  city: string | null;
}

export function placeFromCf(cf: CfData | undefined): Place {
  return {
    country: cf?.country ?? null,
    region: cf?.region ?? null,
    regionCode: cf?.regionCode ?? null,
    city: cf?.city ?? null,
  };
}

/** What we get from Cloudflare alone, before any IPinfo call. */
export function lookupFromCf(cf: CfData | undefined): Lookup {
  return {
    asn: cf?.asn ? `AS${cf.asn}` : null,
    org: cf?.asOrganization ?? null,
    domain: null,
    type: null,
  };
}

/** IPinfo Lite response (flat) or Core response (nested `as` object). */
export interface IpinfoResponse {
  ip?: string;
  asn?: string;
  as_name?: string;
  as_domain?: string;
  as?: { asn?: string; name?: string; domain?: string; type?: string };
  is_hosting?: boolean;
  is_anonymous?: boolean;
  is_mobile?: boolean;
}

/** Merges an IPinfo response over the Cloudflare data. IPinfo wins where it answers. */
export function mergeLookup(base: Lookup, info: IpinfoResponse | null): Lookup {
  if (!info) return base;
  const as = info.as ?? {};
  return {
    asn: as.asn ?? info.asn ?? base.asn,
    org: as.name ?? info.as_name ?? base.org,
    domain: as.domain ?? info.as_domain ?? base.domain,
    type: as.type ?? base.type,
    hosting: info.is_hosting,
    anonymous: info.is_anonymous,
    mobile: info.is_mobile,
  };
}

export type Plan = 'lite' | 'core';

export function ipinfoUrl(ip: string, plan: Plan): string {
  const path = plan === 'core' ? 'lookup' : 'lite';
  return `https://api.ipinfo.io/${path}/${encodeURIComponent(ip)}`;
}

/** Calls IPinfo. Returns null on any problem so the caller can carry on with Cloudflare data. */
export async function fetchIpinfo(
  ip: string,
  token: string,
  plan: Plan,
  fetchFn: typeof fetch = fetch,
): Promise<IpinfoResponse | null> {
  try {
    const res = await fetchFn(ipinfoUrl(ip, plan), {
      headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) {
      console.error('IPinfo answered', res.status);
      return null;
    }
    return (await res.json()) as IpinfoResponse;
  } catch (err) {
    console.error('IPinfo call failed', err);
    return null;
  }
}
