// The math behind Where We Play, with no I/O so it can be tested on its own.
// Distances, the straight-line fallback for drive times, the summary numbers
// per venue (median, 75th percentile, count under a threshold), the group
// center, histograms, and the public point a member is shown at.

export interface Point {
  lat: number;
  lng: number;
}

export interface DriveTime {
  memberId: number;
  venueId: number;
  seconds: number;
}

/** Roads are not straight. Great-circle distance times this is a fair guess at road distance. */
export const ROAD_WIGGLE = 1.3;
/** Typical suburban door-to-door average, in miles per hour, for the fallback estimate. */
export const FALLBACK_MPH = 28;

const EARTH_RADIUS_M = 6_371_000;
const METERS_PER_MILE = 1609.344;

const toRad = (deg: number) => (deg * Math.PI) / 180;

/** Great-circle distance between two points, in meters. */
export function haversineMeters(a: Point, b: Point): number {
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

/** Drive time estimate when the router is unavailable: road distance at FALLBACK_MPH. */
export function straightLineSeconds(a: Point, b: Point): number {
  const roadMeters = haversineMeters(a, b) * ROAD_WIGGLE;
  const metersPerSecond = (FALLBACK_MPH * METERS_PER_MILE) / 3600;
  return Math.round(roadMeters / metersPerSecond);
}

const sorted = (values: number[]) => [...values].sort((x, y) => x - y);

/** Middle value; the mean of the two middle values when the count is even. Null for no values. */
export function median(values: number[]): number | null {
  if (values.length === 0) return null;
  const s = sorted(values);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}

/**
 * Nearest-rank percentile: the smallest value that at least p of the values
 * are less than or equal to. p is a fraction, so 0.75 is the 75th percentile.
 */
export function percentile(values: number[], p: number): number | null {
  if (values.length === 0) return null;
  const s = sorted(values);
  const rank = Math.max(1, Math.ceil(p * s.length));
  return s[rank - 1];
}

export function countUnder(values: number[], maxSeconds: number): number {
  return values.filter((v) => v < maxSeconds).length;
}

/** Plain average of the points: where the group sits on the map. */
export function center(points: Point[]): Point | null {
  if (points.length === 0) return null;
  const sum = points.reduce((acc, p) => ({ lat: acc.lat + p.lat, lng: acc.lng + p.lng }), { lat: 0, lng: 0 });
  return { lat: sum.lat / points.length, lng: sum.lng / points.length };
}

export interface Bucket {
  /** Lower bound in minutes, inclusive. */
  from: number;
  /** Upper bound in minutes, exclusive; null for the open last bucket. */
  to: number | null;
  label: string;
  count: number;
}

/** Drive times grouped into buckets of bucketMinutes, with one open bucket at the top. */
export function histogram(seconds: number[], bucketMinutes = 5, maxMinutes = 60): Bucket[] {
  const buckets: Bucket[] = [];
  for (let from = 0; from < maxMinutes; from += bucketMinutes) {
    buckets.push({ from, to: from + bucketMinutes, label: `${from} to ${from + bucketMinutes}`, count: 0 });
  }
  buckets.push({ from: maxMinutes, to: null, label: `${maxMinutes}+`, count: 0 });
  for (const s of seconds) {
    const minutes = s / 60;
    const index = Math.min(buckets.length - 1, Math.floor(minutes / bucketMinutes));
    buckets[index].count += 1;
  }
  return buckets;
}

export interface VenueStats {
  venueId: number;
  /** Members with a cached drive time to this venue. */
  routed: number;
  medianSeconds: number | null;
  p75Seconds: number | null;
  underNear: number;
  underNearPct: number;
}

export function venueStats(venueId: number, seconds: number[], nearMinutes = 20): VenueStats {
  const under = countUnder(seconds, nearMinutes * 60);
  return {
    venueId,
    routed: seconds.length,
    medianSeconds: median(seconds),
    p75Seconds: percentile(seconds, 0.75),
    underNear: under,
    underNearPct: seconds.length ? Math.round((100 * under) / seconds.length) : 0,
  };
}

/**
 * Summary numbers for every venue, ranked by median drive time (lowest first).
 * Venues with no routed members sort last. Ties break toward more routed
 * members, then toward more members under the near threshold.
 * `members`, when given, limits the pairs to those member ids (the slot filter).
 */
export function rankVenues(pairs: DriveTime[], venueIds: number[], members?: Set<number>, nearMinutes = 20): VenueStats[] {
  const byVenue = new Map<number, number[]>();
  for (const id of venueIds) byVenue.set(id, []);
  for (const pair of pairs) {
    if (members && !members.has(pair.memberId)) continue;
    byVenue.get(pair.venueId)?.push(pair.seconds);
  }
  const stats = [...byVenue].map(([venueId, seconds]) => venueStats(venueId, seconds, nearMinutes));
  return stats.sort((a, b) => {
    if (a.medianSeconds === null && b.medianSeconds === null) return 0;
    if (a.medianSeconds === null) return 1;
    if (b.medianSeconds === null) return -1;
    return a.medianSeconds - b.medianSeconds || b.routed - a.routed || b.underNear - a.underNear;
  });
}

/**
 * The point a member is shown at on any member-facing map: the cross street
 * if it geocoded, else the zip centroid, never the house.
 */
export function publicPoint(crossStreet: Point | null, zipCentroid: Point | null): Point | null {
  return crossStreet ?? zipCentroid ?? null;
}

/** Whole minutes for display. */
export function minutes(seconds: number | null): number | null {
  return seconds === null ? null : Math.round(seconds / 60);
}

export function chunk<T>(items: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

/** Member ids whose availability includes the slot. Availability is the stored JSON array per member. */
export function availableIn(members: { id: number; availability: string[] }[], slot: string): Set<number> {
  return new Set(members.filter((m) => m.availability.includes(slot)).map((m) => m.id));
}
