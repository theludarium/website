// GET /api/where-we-play/admin/cubes: every Cube for the approval queue, private email included.
// Sits under the admin middleware, so Cloudflare Access protects it.
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { json } from '../../../../../src/server/where-we-play/http.ts';

export async function onRequestGet({ env }: Context): Promise<Response> {
  const { results } = await env.DB!.prepare(
    `SELECT id, name, list_url AS listUrl, owner, location, description, note, style, card_count AS cardCount,
            list_updated_at AS updatedAt, lending, format, discord, email, status, created_at AS createdAt
     FROM cubes ORDER BY CASE status WHEN 'pending' THEN 0 WHEN 'approved' THEN 1 ELSE 2 END, created_at DESC, name COLLATE NOCASE`,
  ).all();
  return json({ cubes: results });
}
