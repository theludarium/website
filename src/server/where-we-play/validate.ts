// Parsing and checking what the forms send. Used by the member routes and
// the admin routes alike, so a bad value never reaches the database.
import { EMAIL_PATTERN, LIMITS, SLOT_KEYS, VENUE_STATUSES, ZIP_PATTERN } from '../../lib/where-we-play/shared.ts';
import { field, oneLine, orNull } from './http.ts';

export interface MemberForm {
  email: string;
  discordHandle: string | null;
  firstName: string | null;
  zip: string;
  streetAddress: string | null;
  crossStreet: string | null;
  availability: string[];
}

/** Returns the cleaned member form, or the name of the first problem. */
export function parseMemberForm(form: FormData): MemberForm | { error: string } {
  const email = oneLine(field(form, 'email')).toLowerCase();
  const zip = field(form, 'zip');
  const member: MemberForm = {
    email,
    discordHandle: orNull(oneLine(field(form, 'discord_handle')).replace(/^@/, '')),
    firstName: orNull(oneLine(field(form, 'first_name'))),
    zip,
    streetAddress: orNull(oneLine(field(form, 'street_address'))),
    crossStreet: orNull(oneLine(field(form, 'cross_street'))),
    availability: form.getAll('availability').map(String).filter((key) => (SLOT_KEYS as string[]).includes(key)),
  };
  if (!member.email || !member.zip) return { error: 'missing' };
  if (!EMAIL_PATTERN.test(member.email)) return { error: 'email' };
  if (!ZIP_PATTERN.test(member.zip)) return { error: 'zip' };
  if (
    member.email.length > LIMITS.email ||
    (member.discordHandle?.length ?? 0) > LIMITS.discordHandle ||
    (member.firstName?.length ?? 0) > LIMITS.firstName ||
    (member.streetAddress?.length ?? 0) > LIMITS.streetAddress ||
    (member.crossStreet?.length ?? 0) > LIMITS.crossStreet
  ) {
    return { error: 'long' };
  }
  // A cross street only makes sense beside a street address.
  if (!member.streetAddress) member.crossStreet = null;
  return member;
}

export interface SuggestionForm {
  name: string;
  address: string;
  note: string | null;
}

export function parseSuggestion(form: FormData): SuggestionForm | { error: string } {
  const suggestion: SuggestionForm = {
    name: oneLine(field(form, 'venue_name')),
    address: oneLine(field(form, 'venue_address')),
    note: orNull(field(form, 'venue_note')),
  };
  if (!suggestion.name || !suggestion.address) return { error: 'missing' };
  if (suggestion.name.length > LIMITS.venueName || suggestion.address.length > LIMITS.venueAddress || (suggestion.note?.length ?? 0) > LIMITS.note) {
    return { error: 'long' };
  }
  return suggestion;
}

/** Admin venue payload (JSON). Unknown keys are ignored; present keys are checked. */
export interface VenueBody {
  name?: string;
  address?: string;
  neighborhood?: string | null;
  table_count?: number | null;
  hours?: string | null;
  website?: string | null;
  call_ahead?: boolean;
  notes?: string | null;
  status?: string;
  address_public?: boolean;
  approved?: boolean;
  lat?: number | null;
  lng?: number | null;
}

const str = (v: unknown, max: number): string | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string') return undefined;
  const clean = oneLine(v);
  return clean.length > max ? undefined : clean || null;
};

const text = (v: unknown, max: number): string | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null) return null;
  if (typeof v !== 'string' || v.length > max) return undefined;
  return v.trim() || null;
};

const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

const num = (v: unknown, min: number, max: number): number | null | undefined => {
  if (v === undefined) return undefined;
  if (v === null || v === '') return null;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export function parseVenueBody(body: Record<string, unknown>): VenueBody | { error: string } {
  const out: VenueBody = {};
  const problems: string[] = [];
  const take = <K extends keyof VenueBody>(key: K, value: VenueBody[K] | undefined, allowNull = true) => {
    if (!(key in body)) return;
    if (value === undefined || (value === null && !allowNull)) problems.push(key);
    else out[key] = value;
  };
  take('name', str(body.name, LIMITS.venueName) ?? undefined, false);
  take('address', str(body.address, LIMITS.venueAddress) ?? undefined, false);
  take('neighborhood', str(body.neighborhood, 80));
  take('table_count', num(body.table_count, 0, 500) as number | null | undefined);
  take('hours', str(body.hours, LIMITS.hours));
  take('website', str(body.website, LIMITS.website));
  take('call_ahead', bool(body.call_ahead));
  take('notes', text(body.notes, LIMITS.notes));
  take('status', typeof body.status === 'string' && (VENUE_STATUSES as readonly string[]).includes(body.status) ? body.status : undefined, false);
  take('address_public', bool(body.address_public));
  take('approved', bool(body.approved));
  take('lat', num(body.lat, -90, 90));
  take('lng', num(body.lng, -180, 180));
  if ('website' in out && out.website && !/^https?:\/\//i.test(out.website)) out.website = `https://${out.website}`;
  return problems.length ? { error: `invalid: ${problems.join(', ')}` } : out;
}

export interface EventBody {
  venue_id: number | null;
  date: string;
  headcount: number;
  notes: string | null;
}

export function parseEventBody(body: Record<string, unknown>): EventBody | { error: string } {
  const date = typeof body.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(body.date) ? body.date : null;
  const headcount = num(body.headcount, 0, 10000);
  const venueId = num(body.venue_id, 1, Number.MAX_SAFE_INTEGER);
  const notes = text(body.notes, LIMITS.notes);
  if (!date) return { error: 'invalid: date' };
  if (headcount === undefined || headcount === null) return { error: 'invalid: headcount' };
  if (venueId === undefined || notes === undefined) return { error: 'invalid: venue_id or notes' };
  return { venue_id: venueId, date, headcount: Math.round(headcount), notes };
}

export const parseId = (raw: string | undefined): number | null => {
  const n = Number(raw);
  return Number.isInteger(n) && n > 0 ? n : null;
};
