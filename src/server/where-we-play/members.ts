// The member flow shared by the submit and edit routes: geocode, store,
// email the edit link, and route drive times after the response is sent.
import { WWP_BASE, WWP_GROUP } from '../../lib/where-we-play/shared.ts';
import type { WwpEnv } from './env.ts';
import { computeForMember } from './compute.ts';
import { deleteDriveTimesForMember, getMemberByEmail, getMemberById, insertMember, setMemberTokenHash, updateMember, type MemberRow } from './db.ts';
import { sendConfirmation } from './email.ts';
import { geocodeMember } from './geocode.ts';
import { hashToken, newToken } from './tokens.ts';
import type { MemberForm } from './validate.ts';

export const editUrl = (request: Request, token: string) => new URL(`${WWP_BASE}/edit/?t=${token}`, request.url).toString();

const moved = (before: MemberRow, form: MemberForm) =>
  before.zip !== form.zip || before.street_address !== form.streetAddress || before.cross_street !== form.crossStreet;

export interface SaveResult {
  member: MemberRow;
  created: boolean;
  /** Set when a fresh edit link was made (new member, or a resend). */
  token: string | null;
  relocated: boolean;
}

/**
 * Creates the member, or updates the one with that email. Geocodes only when
 * the location changed, so an availability tweak costs no lookups.
 */
export async function saveMember(env: WwpEnv, form: MemberForm, existing: MemberRow | null): Promise<SaveResult> {
  const db = env.DB!;
  const relocated = !existing || moved(existing, form);
  const geo = relocated
    ? await geocodeMember(db, { streetAddress: form.streetAddress, crossStreet: form.crossStreet, zip: form.zip })
    : {
        point: existing.lat !== null && existing.lng !== null ? { lat: existing.lat, lng: existing.lng } : null,
        source: existing.geocode_source as 'address' | 'cross_street' | 'zip' | 'failed',
        publicPoint: existing.public_lat !== null && existing.public_lng !== null ? { lat: existing.public_lat, lng: existing.public_lng } : null,
      };

  const fields = {
    discord_handle: form.discordHandle,
    first_name: form.firstName,
    zip: form.zip,
    street_address: form.streetAddress,
    cross_street: form.crossStreet,
    lat: geo.point?.lat ?? null,
    lng: geo.point?.lng ?? null,
    geocode_source: geo.source,
    public_lat: geo.publicPoint?.lat ?? null,
    public_lng: geo.publicPoint?.lng ?? null,
    availability: form.availability,
  };

  if (existing) {
    await updateMember(db, existing.id, fields);
    if (relocated) await deleteDriveTimesForMember(db, existing.id);
    const member = (await getMemberById(db, existing.id))!;
    return { member, created: false, token: null, relocated };
  }

  const token = newToken();
  const id = await insertMember(db, { group: WWP_GROUP, email: form.email, ...fields }, await hashToken(token));
  const member = (await getMemberById(db, id))!;
  return { member, created: true, token, relocated: true };
}

/** A fresh edit token for a member; the old link stops working. */
export async function reissueToken(env: WwpEnv, member: MemberRow): Promise<string> {
  const token = newToken();
  await setMemberTokenHash(env.DB!, member.id, await hashToken(token));
  return token;
}

/** Drive times for one member, meant for waitUntil. Never throws. */
export async function routeMemberLater(env: WwpEnv, member: MemberRow): Promise<void> {
  try {
    await computeForMember(env.DB!, member);
  } catch (err) {
    console.error('Drive-time computation failed for member', member.id, err);
  }
}

/** The member row for an email in this group, if any. */
export const findByEmail = (env: WwpEnv, email: string) => getMemberByEmail(env.DB!, WWP_GROUP, email);

export { sendConfirmation };
