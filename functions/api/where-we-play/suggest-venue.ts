// POST /api/where-we-play/suggest-venue: a member suggests a place to play.
// It lands in the admin queue (approved = 0, status idea) and stays invisible
// to members until the admin approves it.
import { WWP_BASE, WWP_GROUP } from '../../../src/lib/where-we-play/shared.ts';
import type { Context } from '../../../src/server/where-we-play/env.ts';
import { allowSubmission, insertVenue } from '../../../src/server/where-we-play/db.ts';
import { neighborhoodFromAddress } from '../../../src/server/where-we-play/geocode.ts';
import { clientIp, field, redirect, sha256Hex, verifyTurnstile } from '../../../src/server/where-we-play/http.ts';
import { parseSuggestion } from '../../../src/server/where-we-play/validate.ts';

const back = (request: Request, error: string) => redirect(request, `${WWP_BASE}/?venue_error=${error}#suggest`);

export async function onRequestPost({ request, env }: Context): Promise<Response> {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return back(request, 'missing');
  }
  if (field(form, 'website')) return redirect(request, `${WWP_BASE}/?suggested=1#suggest`);
  if (!env.DB) return back(request, 'unavailable');

  const ip = clientIp(request);
  const token = field(form, 'cf-turnstile-response');
  if (env.TURNSTILE_SECRET_KEY && !(token && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip || null)))) return back(request, 'verify');
  if (!(await allowSubmission(env.DB, await sha256Hex(`${env.WWP_HASH_SALT ?? 'wwp'}:venue:${ip}`), 5))) return back(request, 'slow');

  const parsed = parseSuggestion(form);
  if ('error' in parsed) return back(request, parsed.error);

  try {
    await insertVenue(env.DB, {
      group: WWP_GROUP,
      name: parsed.name,
      address: parsed.address,
      lat: null,
      lng: null,
      neighborhood: neighborhoodFromAddress(parsed.address),
      table_count: null,
      hours: null,
      website: null,
      call_ahead: false,
      notes: null,
      status: 'idea',
      address_public: false,
      suggested_by_member_id: null,
      suggestion_note: parsed.note,
      approved: false,
    });
    return redirect(request, `${WWP_BASE}/?suggested=1#suggest`);
  } catch (err) {
    console.error('Venue suggestion failed', err);
    return back(request, 'unavailable');
  }
}
