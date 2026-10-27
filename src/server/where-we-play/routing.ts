// Car drive times from OSRM's public demo server. The table service returns a
// whole matrix in one call, so a new member costs one request against every
// venue and a new venue one request against every member. Requests are
// capped at 100 coordinates, the demo server's limit.
import type { Point } from '../../lib/where-we-play/engine.ts';
import { chunk, straightLineSeconds } from '../../lib/where-we-play/engine.ts';

const OSRM = 'https://router.project-osrm.org/table/v1/driving/';
const MAX_COORDS = 100;
const USER_AGENT = 'TheLudarium/1.0 (+https://theludarium.com)';

const coord = (p: Point) => `${p.lng.toFixed(6)},${p.lat.toFixed(6)}`;
const range = (from: number, count: number) => Array.from({ length: count }, (_, i) => from + i).join(';');

/** One OSRM table call: seconds from each source to each destination, null where OSRM has no route. */
async function tableCall(sources: Point[], destinations: Point[], fetchImpl: typeof fetch): Promise<(number | null)[][]> {
  const coords = [...sources, ...destinations].map(coord).join(';');
  const url = `${OSRM}${coords}?sources=${range(0, sources.length)}&destinations=${range(sources.length, destinations.length)}&annotations=duration`;
  const res = await fetchImpl(url, { headers: { 'User-Agent': USER_AGENT }, signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`OSRM answered ${res.status}`);
  const data = (await res.json()) as { code?: string; durations?: (number | null)[][] };
  if (data.code !== 'Ok' || !data.durations) throw new Error(`OSRM said ${data.code ?? 'nothing'}`);
  return data.durations.map((row) => row.map((d) => (typeof d === 'number' ? Math.round(d) : null)));
}

/**
 * Drive-time matrix in seconds, sources by destinations, chunked to the
 * server's limit. Throws when OSRM is unreachable; the caller falls back.
 */
export async function driveTimeMatrix(sources: Point[], destinations: Point[], fetchImpl: typeof fetch = fetch): Promise<(number | null)[][]> {
  if (!sources.length || !destinations.length) return sources.map(() => []);
  const half = Math.floor(MAX_COORDS / 2);
  const sourceChunks = chunk(sources, Math.min(half, sources.length));
  const destChunks = chunk(destinations, Math.min(MAX_COORDS - Math.min(half, sources.length), destinations.length));
  const matrix: (number | null)[][] = sources.map(() => new Array(destinations.length).fill(null));

  let sOffset = 0;
  for (const s of sourceChunks) {
    let dOffset = 0;
    for (const d of destChunks) {
      const part = await tableCall(s, d, fetchImpl);
      part.forEach((row, i) => row.forEach((value, j) => (matrix[sOffset + i][dOffset + j] = value)));
      dOffset += d.length;
    }
    sOffset += s.length;
  }
  return matrix;
}

export interface RoutedPair {
  sourceIndex: number;
  destIndex: number;
  seconds: number;
  source: 'osrm' | 'straight_line';
}

/**
 * Every pair with a drive time: OSRM where it answered, the straight-line
 * estimate everywhere else (including when OSRM is down).
 */
export async function routePairs(sources: Point[], destinations: Point[], fetchImpl: typeof fetch = fetch): Promise<RoutedPair[]> {
  let matrix: (number | null)[][] | null = null;
  try {
    matrix = await driveTimeMatrix(sources, destinations, fetchImpl);
  } catch (err) {
    console.error('OSRM unavailable, estimating', err);
  }
  const pairs: RoutedPair[] = [];
  sources.forEach((s, i) => {
    destinations.forEach((d, j) => {
      const osrm = matrix?.[i]?.[j] ?? null;
      pairs.push(
        osrm !== null
          ? { sourceIndex: i, destIndex: j, seconds: osrm, source: 'osrm' }
          : { sourceIndex: i, destIndex: j, seconds: straightLineSeconds(s, d), source: 'straight_line' },
      );
    });
  });
  return pairs;
}
