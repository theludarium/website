// POST /api/where-we-play/admin/recompute?retry=1: fill every missing drive
// time; with retry, drop straight-line estimates first so OSRM gets another go.
import { WWP_GROUP } from '../../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../../src/server/where-we-play/env.ts';
import { fillDriveTimes } from '../../../../src/server/where-we-play/compute.ts';
import { json } from '../../../../src/server/where-we-play/http.ts';

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const retry = new URL(request.url).searchParams.get('retry') === '1';
  const result = await fillDriveTimes(env.DB!, WWP_GROUP, { retryEstimates: retry });
  return json(result);
}
