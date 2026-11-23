// Every /api/where-we-play/admin/* route passes through here first.
// Cloudflare Access guards these paths at the edge in production; this check
// verifies the token Access attaches, so a gap in the Access policy still
// fails closed. See src/server/where-we-play/access.ts.
import { isCrossSiteWrite, requireAdmin } from '../../../../src/server/where-we-play/access.ts';
import type { Context } from '../../../../src/server/where-we-play/env.ts';
import { fail } from '../../../../src/server/where-we-play/http.ts';

export async function onRequest(context: Context): Promise<Response> {
  if (isCrossSiteWrite(context.request)) return fail(403, 'That request came from another site.');
  const refused = await requireAdmin(context.request, context.env);
  if (refused) return refused;
  if (!context.env.DB) return fail(503, 'The DB binding is missing.');
  const response = await context.next();
  response.headers.set('Cache-Control', 'no-store');
  return response;
}
