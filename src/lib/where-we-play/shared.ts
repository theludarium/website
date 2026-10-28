// Constants shared by the Where We Play pages and its Pages Functions.
// Nothing here is secret; it all ends up in page HTML.

/** The group this version serves. Rows carry it so other groups can slot in later. */
export const WWP_GROUP = 'cube-commonwealth';

export const WWP_BASE = '/cube-commonwealth/where-we-play';
export const WWP_API = '/api/where-we-play';

/** Availability slots on the member form, in display order. Keys are stored in wwp_members.availability. */
export const SLOTS = [
  { key: 'mon-eve', label: 'Monday evening' },
  { key: 'tue-eve', label: 'Tuesday evening' },
  { key: 'wed-eve', label: 'Wednesday evening' },
  { key: 'thu-eve', label: 'Thursday evening' },
  { key: 'fri-eve', label: 'Friday evening' },
  { key: 'sat-aft', label: 'Saturday afternoon' },
  { key: 'sat-eve', label: 'Saturday evening' },
  { key: 'sun-aft', label: 'Sunday afternoon' },
  { key: 'sun-eve', label: 'Sunday evening' },
] as const;

export type SlotKey = (typeof SLOTS)[number]['key'];
export const SLOT_KEYS = SLOTS.map((slot) => slot.key) as SlotKey[];

export const VENUE_STATUSES = ['idea', 'contacted', 'confirmed', 'played here', 'not a fit'] as const;
export type VenueStatus = (typeof VENUE_STATUSES)[number];

/** Statuses whose venues appear in the member-facing results. */
export const PUBLIC_STATUSES: VenueStatus[] = ['confirmed', 'played here'];

/** Results stay hidden until this many members have a location. */
export const MIN_MEMBERS_FOR_RESULTS = 5;

/** "Under 20 minutes" in the rankings. */
export const NEAR_MINUTES = 20;

/** Field length limits, enforced on the form and again on the server. */
export const LIMITS = {
  email: 200,
  discordHandle: 60,
  firstName: 80,
  lastName: 80,
  streetAddress: 200,
  crossStreet: 120,
  venueName: 120,
  venueAddress: 200,
  note: 1000,
  hours: 200,
  website: 300,
  notes: 3000,
} as const;

/** A member's name for lists: first and last, either one, or null. */
export const fullName = (m: { first_name: string | null; last_name: string | null }) =>
  [m.first_name, m.last_name].filter(Boolean).join(' ') || null;

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ZIP_PATTERN = /^\d{5}$/;

/** The privacy line shown under the form. Levi's wording; the last sentence changed when the email went away (2026-10-27). */
export const PRIVACY_LINE =
  "Only the app's admin can see your address, and it is never shared. Members see only drive-time summaries. Update or delete it any time with your private link.";
