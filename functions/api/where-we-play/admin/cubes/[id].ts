// PATCH /api/where-we-play/admin/cubes/:id: edit a Cube, and approve or reject it.
import type { Context } from '../../../../../src/server/where-we-play/env.ts';
import { fail, json, readJson } from '../../../../../src/server/where-we-play/http.ts';
import { FORMATS, LENDING, LIMITS, STYLES, cleanListUrl, cleanLocation } from '../../../../../src/lib/cube-library.ts';

type Body = Partial<Record<'name' | 'listUrl' | 'owner' | 'location' | 'description' | 'note' | 'style' | 'lending' | 'format' | 'discord' | 'status', string | null>>;
const STATUSES = ['pending', 'approved', 'rejected'];
const text = (v: unknown) => (typeof v === 'string' ? v.trim().replace(/\s*[—–]\s*/g, ', ') : '');

/** Turns the request into column updates, or the first problem. */
export function cubeUpdates(body: Body): { updates: Record<string, string | null> } | { error: string } {
  const updates: Record<string, string | null> = {};
  for (const [key, column, max] of [['name', 'name', LIMITS.name], ['owner', 'owner', LIMITS.owner]] as const) {
    if (key in body) {
      const v = text(body[key]);
      if (!v || v.length > max) return { error: `Check the ${key}.` };
      updates[column] = v;
    }
  }
  if ('location' in body) {
    const v = cleanLocation(text(body.location));
    if (!v || v.length > LIMITS.location) return { error: 'Check the location.' };
    updates.location = v;
  }
  if ('listUrl' in body) {
    const v = cleanListUrl(text(body.listUrl));
    if (!v) return { error: 'Check the list link.' };
    updates.list_url = v;
  }
  for (const [key, max] of [['description', LIMITS.description], ['note', LIMITS.note], ['discord', LIMITS.discord]] as const) {
    if (key in body) {
      const v = text(body[key]).replace(key === 'discord' ? /^@/ : /$^/, '');
      if (v.length > max) return { error: `The ${key} is too long.` };
      updates[key] = v || null;
    }
  }
  if ('style' in body) {
    if (!(STYLES as readonly string[]).includes(String(body.style))) return { error: 'Check the style.' };
    updates.style = String(body.style);
  }
  if ('lending' in body) {
    if (body.lending && !(body.lending in LENDING)) return { error: 'Check the lending choice.' };
    updates.lending = body.lending || null;
  }
  if ('format' in body) {
    if (body.format && !(body.format in FORMATS)) return { error: 'Check the format.' };
    updates.format = body.format || null;
  }
  if ('status' in body) {
    if (!STATUSES.includes(String(body.status))) return { error: 'Check the status.' };
    updates.status = String(body.status);
    updates.reviewed_at = new Date().toISOString();
  }
  return { updates };
}

export async function onRequestPatch({ request, env, params }: Context<{ id: string }>): Promise<Response> {
  const id = Number(params.id);
  if (!Number.isInteger(id) || id < 1) return fail(400, 'Bad Cube id.');
  const body = await readJson<Body>(request);
  if (!body) return fail(400, 'Bad request.');
  const parsed = cubeUpdates(body);
  if ('error' in parsed) return fail(400, parsed.error);
  const columns = Object.keys(parsed.updates);
  if (!columns.length) return fail(400, 'Nothing to change.');
  try {
    const result = await env.DB!.prepare(`UPDATE cubes SET ${columns.map((c) => `${c} = ?`).join(', ')} WHERE id = ?`)
      .bind(...columns.map((c) => parsed.updates[c]), id)
      .run();
    if (!result.meta?.changes) return fail(404, 'That Cube is gone.');
  } catch (err) {
    if (String(err).includes('UNIQUE')) return fail(409, 'This owner already has that list in the library.');
    throw err;
  }
  return json({ ok: true });
}
