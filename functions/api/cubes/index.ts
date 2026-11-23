// The Cube Library API.
// GET  /api/cubes  the approved Cubes, public fields only.
// POST /api/cubes  a visitor submits a Cube from /cube-commonwealth/cubes/add/. It is saved as
// pending, Cube Cobra details are filled in, and Levi gets an email with a link to the queue.
// Nothing appears publicly until Levi approves it. No email goes to the person who submitted.
import { notify, type NotifyBinding } from '../../../src/server/notify.ts';
import type { D1, WwpEnv } from '../../../src/server/where-we-play/env.ts';
import { clientIp, field, json, redirect, sha256Hex, verifyTurnstile } from '../../../src/server/where-we-play/http.ts';
import { CUBES_ADMIN, cleanImageUrl, guessStyle, parseSubmission, primerExcerpt, type CubeSubmission, type PublicCube } from '../../../src/lib/cube-library.ts';

interface Env extends WwpEnv {
  DB?: D1;
  NOTIFY?: NotifyBinding;
}
interface Context {
  request: Request;
  env: Env;
}

const FORM = '/cube-commonwealth/cubes/add/';
const PER_HOUR = 5;
const MAX_PREFIX = 256 * 1024;

export const PUBLIC_COLUMNS =
  'id, name, list_url AS listUrl, owner, location, description, note, style, card_count AS cardCount, list_updated_at AS updatedAt, lending, format, discord, image_url AS imageUrl, image_artist AS imageArtist';

export async function onRequestGet({ env }: Context): Promise<Response> {
  if (!env.DB) return json({ error: 'unavailable' }, 503);
  const { results } = await env.DB.prepare(`SELECT ${PUBLIC_COLUMNS} FROM cubes WHERE status = 'approved' ORDER BY name COLLATE NOCASE`).all<PublicCube>();
  return json({ cubes: results }, 200, { 'Cache-Control': 'public, max-age=60' });
}

export type CobraDetails = { name: string | null; cardCount: number | null; updatedAt: string | null; description: string | null; style: string; imageUrl?: string | null; imageArtist?: string | null };

/** Pulls the metadata out of the start of a cubeJSON body, before the long card list. */
export function parseCobraPrefix(text: string): CobraDetails | null {
  const cut = text.indexOf(',"cards":');
  if (cut < 0) return null;
  try {
    const d = JSON.parse(`${text.slice(0, cut)}}`) as {
      name?: string;
      cardCount?: number;
      dateLastUpdated?: number;
      categoryOverride?: string | null;
      categoryPrefixes?: string[];
      primerTabs?: { content?: string }[];
      image?: { uri?: string; artist?: string };
    };
    return {
      name: d.name ? d.name.slice(0, 100) : null,
      cardCount: Number.isInteger(d.cardCount) ? (d.cardCount as number) : null,
      updatedAt: d.dateLastUpdated ? new Date(d.dateLastUpdated).toISOString().slice(0, 10) : null,
      description: primerExcerpt(d.primerTabs?.[0]?.content),
      style: guessStyle(d.categoryOverride, d.categoryPrefixes ?? []),
      imageUrl: cleanImageUrl(d.image?.uri),
      imageArtist: cleanImageUrl(d.image?.uri) && d.image?.artist ? d.image.artist.slice(0, 100) : null,
    };
  } catch {
    return null;
  }
}

/** Reads only the start of the response: full lists run past a megabyte. Never throws. */
export async function fetchCobra(id: string): Promise<CobraDetails | null> {
  try {
    const res = await fetch(`https://cubecobra.com/cube/api/cubeJSON/${encodeURIComponent(id)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TheLudarium/1.0)', Accept: 'application/json' },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok || !res.body) return null;
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let text = '';
    while (text.length < MAX_PREFIX) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      if (text.includes(',"cards":')) break;
    }
    await reader.cancel().catch(() => {});
    return parseCobraPrefix(text);
  } catch {
    return null;
  }
}

export function emailText(c: CubeSubmission, id: number | null, cardCount: number | null, foundOnCobra: boolean, adminUrl: string): string {
  return [
    'A new Cube is waiting for your approval.',
    '',
    `Cube:      ${c.name}`,
    `List:      ${c.listUrl}`,
    `Owner:     ${c.owner}`,
    `Location:  ${c.location}`,
    `Style:     ${c.style || 'Other'}`,
    `Cards:     ${cardCount ?? '(unknown)'}`,
    `Borrow:    ${c.lending ?? '(not given)'}`,
    `Format:    ${c.format ?? '(not given)'}`,
    `Discord:   ${c.discord ?? '(not given)'}`,
    `Email:     ${c.email ?? '(not given)'}`,
    // Every line is fenced, so a visitor's words cannot pass for the real approve link below.
    `About:     ${(c.description ?? '(none)').replace(/\n/g, '\n         | ')}`,
    `Note:      ${(c.note ?? '(none)').replace(/\n/g, '\n         | ')}`,
    c.listUrl.includes('cubecobra.com') && !foundOnCobra ? '\nCube Cobra did not answer for this link. Check it before approving.' : '',
    '',
    `Approve, edit, or reject it here${id ? ` (Cube #${id})` : ''}:`,
    adminUrl,
  ].join('\n');
}

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  const back = (code: string) => redirect(request, `${FORM}?cube_error=${code}#form`);
  const sent = () => redirect(request, `${FORM}?cube=sent#form`);

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back('missing');
  }
  if (field(form, 'website')) return sent();
  if (!env.DB || !env.TURNSTILE_SECRET_KEY) {
    console.error('Cube form is missing the DB binding or TURNSTILE_SECRET_KEY');
    return back('unavailable');
  }

  const ip = clientIp(request);
  const token = field(form, 'cf-turnstile-response');
  if (!token || !(await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip || null))) return back('verify');

  const cube = parseSubmission(form);
  if ('error' in cube) return back(cube.error);

  const ipHash = await sha256Hex(`${env.WWP_HASH_SALT ?? 'wwp'}:cubes:${ip}`);
  const now = new Date();
  try {
    const recent = await env.DB.prepare('SELECT COUNT(*) AS n FROM cubes WHERE ip_hash = ? AND created_at > ?')
      .bind(ipHash, new Date(now.getTime() - 3600_000).toISOString())
      .first<{ n: number }>();
    if ((recent?.n ?? 0) >= PER_HOUR) return back('slow');
    const twin = await env.DB.prepare("SELECT id FROM cubes WHERE list_url = ? AND owner = ? COLLATE NOCASE AND status <> 'rejected'")
      .bind(cube.listUrl, cube.owner)
      .first();
    if (twin) return back('duplicate');
  } catch (err) {
    console.error('Checking a Cube submission failed', err);
    return back('unavailable');
  }

  const cobra = cube.cobraId ? await fetchCobra(cube.cobraId) : null;
  if (cube.cobraId && !cube.name && !cobra?.name) return back('cobra');
  const full: CubeSubmission = {
    ...cube,
    name: cube.name || (cobra?.name as string),
    description: cube.description ?? cobra?.description ?? null,
    style: cube.style || cobra?.style || 'Other',
  };

  let id: number | null = null;
  try {
    const row = await env.DB.prepare(
      `INSERT INTO cubes (name, list_url, owner, location, description, note, style, card_count, list_updated_at, lending, format, discord, email, image_url, image_artist, status, ip_hash, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?) RETURNING id`,
    )
      .bind(full.name, full.listUrl, full.owner, full.location, full.description, full.note, full.style, cobra?.cardCount ?? null, cobra?.updatedAt ?? null, full.lending, full.format, full.discord, full.email, cobra?.imageUrl ?? null, cobra?.imageArtist ?? null, ipHash, now.toISOString())
      .first<{ id: number }>();
    id = row?.id ?? null;
  } catch (err) {
    if (String(err).includes('UNIQUE')) return back('duplicate');
    console.error('Saving a Cube failed', err);
    return back('unavailable');
  }

  await notify(env.NOTIFY, {
    replyTo: full.email ?? undefined,
    subject: `Cube to approve: ${full.name.slice(0, 60)} (${full.location.slice(0, 30)})`,
    text: emailText(full, id, cobra?.cardCount ?? null, Boolean(cobra), new URL(CUBES_ADMIN, request.url).toString()),
  });
  return sent();
}
