// Turning addresses into points. Nominatim (OpenStreetMap) for addresses and
// cross streets, a bundled Census table for zip centroids. Every Nominatim
// answer is cached in D1 by its normalized query, and calls within one request
// are spaced a second apart, which is what Nominatim's usage policy asks.
import INDIANA_ZIPS from '../../data/indiana-zips.ts';
import type { Point } from '../../lib/where-we-play/engine.ts';
import { publicPoint } from '../../lib/where-we-play/engine.ts';
import type { D1 } from './env.ts';
import { getCachedGeocode, saveGeocode } from './db.ts';

const USER_AGENT = 'TheLudarium/1.0 (+https://theludarium.com; hello@theludarium.com)';
const NOMINATIM = 'https://nominatim.openstreetmap.org/search';
/** Indiana, roughly. Results are biased toward it, not limited to it. */
const VIEWBOX = '-88.1,41.8,-84.7,37.7';
const MIN_GAP_MS = 1100;

/** Centroid of a zip from the bundled Census ZCTA table (Indiana only). */
export function zipCentroid(zip: string): Point | null {
  const hit = INDIANA_ZIPS[zip];
  return hit ? { lat: hit[0], lng: hit[1] } : null;
}

export const normalizeQuery = (query: string) => query.toLowerCase().replace(/\s+/g, ' ').trim();

let lastCallAt = 0;
async function politeDelay() {
  const wait = lastCallAt + MIN_GAP_MS - Date.now();
  if (wait > 0) await new Promise((resolve) => setTimeout(resolve, wait));
  lastCallAt = Date.now();
}

/** One Nominatim lookup, cached. Null when nothing was found or the service failed. */
export async function nominatim(db: D1 | undefined, query: string, fetchImpl: typeof fetch = fetch): Promise<Point | null> {
  const key = normalizeQuery(query);
  if (!key) return null;
  if (db) {
    const cached = await getCachedGeocode(db, key);
    if (cached) return cached.found && cached.lat !== null && cached.lng !== null ? { lat: cached.lat, lng: cached.lng } : null;
  }

  const url = new URL(NOMINATIM);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');
  url.searchParams.set('countrycodes', 'us');
  url.searchParams.set('viewbox', VIEWBOX);
  url.searchParams.set('q', key);

  let point: Point | null = null;
  let failed = false;
  try {
    await politeDelay();
    const res = await fetchImpl(url.toString(), {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (res.ok) {
      const data = (await res.json()) as { lat?: string; lon?: string }[];
      const first = data[0];
      if (first?.lat && first?.lon) point = { lat: Number(first.lat), lng: Number(first.lon) };
    } else {
      failed = true;
    }
  } catch {
    failed = true;
  }
  // Cache hits and genuine misses, never outages, so a retry can succeed later.
  if (db && !failed) await saveGeocode(db, key, point);
  return point;
}

export interface MemberLocation {
  streetAddress: string | null;
  crossStreet: string | null;
  zip: string;
}

export interface GeocodeResult {
  point: Point | null;
  source: 'address' | 'cross_street' | 'zip' | 'failed';
  publicPoint: Point | null;
}

/**
 * Where a member is, by the best available means: street address, then cross
 * street, then zip centroid. The public point is the cross street or the zip,
 * never the house.
 */
export async function geocodeMember(db: D1 | undefined, loc: MemberLocation, fetchImpl: typeof fetch = fetch): Promise<GeocodeResult> {
  const zip = zipCentroid(loc.zip) ?? (await nominatim(db, `${loc.zip}, Indiana, USA`, fetchImpl));
  const cross = loc.crossStreet ? await nominatim(db, `${loc.crossStreet}, ${loc.zip}`, fetchImpl) : null;
  const pub = publicPoint(cross, zip);

  if (loc.streetAddress) {
    const house = await nominatim(db, `${loc.streetAddress}, ${loc.zip}`, fetchImpl);
    if (house) return { point: house, source: 'address', publicPoint: pub ?? house };
  }
  if (cross) return { point: cross, source: 'cross_street', publicPoint: cross };
  if (zip) return { point: zip, source: 'zip', publicPoint: zip };
  return { point: null, source: 'failed', publicPoint: null };
}

export async function geocodeVenue(db: D1 | undefined, address: string, fetchImpl: typeof fetch = fetch): Promise<Point | null> {
  return nominatim(db, address, fetchImpl);
}

/** A city-level label for members: the part of the address after the street, before the state. */
export function neighborhoodFromAddress(address: string): string | null {
  const parts = address.split(',').map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const candidate = parts[parts.length - 2].replace(/\b(IN|Indiana)\b.*$/i, '').trim();
    if (candidate && !/^\d/.test(candidate)) return candidate;
  }
  return null;
}
