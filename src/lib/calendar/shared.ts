// The events calendar: constants and types shared by the public page, the admin
// page, and the Pages Functions. This file is the contract between them, so it
// holds no logic. Spec: docs/calendar/SPEC.md. Nothing here is secret.
//
// Version 1 serves the Cube Commonwealth. Every event carries a community, so a
// sitewide calendar for other tabletop communities can read the same tables later.

export const CAL_COMMUNITY = 'cube-commonwealth';
export const CAL_TZ = 'America/Indiana/Indianapolis';

export const CAL_BASE = '/cube-commonwealth/events/';
export const CAL_SUGGEST = '/cube-commonwealth/events/suggest/';
export const CAL_API = '/api/events';
export const CAL_ADMIN = '/cube-commonwealth/where-we-play/admin/calendar/';
export const CAL_ADMIN_API = '/api/where-we-play/admin/calendar';

/** Event kinds, in display order. The key is stored in cal_events.kind. */
export const EVENT_KINDS = [
  { key: 'draft', label: 'Draft' },
  { key: 'class', label: 'Class' },
  { key: 'meetup', label: 'Meetup' },
  { key: 'celebration', label: 'Celebration' },
  { key: 'other', label: 'Other' },
] as const;
export type EventKind = (typeof EVENT_KINDS)[number]['key'];
export const EVENT_KIND_KEYS = EVENT_KINDS.map((k) => k.key) as EventKind[];
export const kindLabel = (kind: string) => EVENT_KINDS.find((k) => k.key === kind)?.label ?? 'Other';

/**
 * How the Cube for an event is chosen.
 * vote: attendees suggest Cubes from the Cube Library and rank them.
 * set:  the host picked the Cube (cube_id).
 * none: no Cube, for example a class or a meetup.
 */
export const CUBE_MODES = ['vote', 'set', 'none'] as const;
export type CubeMode = (typeof CUBE_MODES)[number];

/** pending: a visitor's suggestion waiting for Levi. approved and cancelled are public. rejected is hidden. */
export const EVENT_STATUSES = ['pending', 'approved', 'cancelled', 'rejected'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];

/** Voting closes this many hours before the event starts. 0 means when it starts. */
export const VOTE_CLOSE_HOURS = [0, 2, 12, 24, 48] as const;
export const DEFAULT_VOTE_CLOSE_HOURS = 24;

/** Field length limits, enforced on the forms and again on the server. */
export const CAL_LIMITS = {
  title: 100,
  description: 2000,
  locationName: 120,
  locationAddress: 200,
  attendeeName: 40,
  submitterName: 60,
  email: 200,
} as const;

/** Per-event caps that keep one event's vote readable. */
export const CAL_CAPS = {
  suggestionsPerAttendee: 3,
  suggestionsPerEvent: 12,
  attendeesPerEvent: 200,
  repeatWeeks: 12,
  /** The month list refuses ranges longer than this many days. */
  rangeDays: 100,
} as const;

// ---------- Public API: GET /api/events ----------

/** One event in a list (month grid, coming up). */
export type EventSummary = {
  id: number;
  title: string;
  kind: EventKind;
  /** YYYY-MM-DD, local to the event's time zone. */
  date: string;
  /** HH:MM, 24 hour, local. */
  startTime: string;
  /** HH:MM, 24 hour, local. At or before startTime means it ends the next day. */
  endTime: string;
  locationName: string | null;
  /** approved or cancelled. Pending and rejected events never leave the admin API. */
  status: 'approved' | 'cancelled';
  going: number;
  cubeMode: CubeMode;
  /** The Cube the host set or confirmed. Null while a vote is undecided or there is no Cube. */
  cubeName: string | null;
  /** True for placeholder events, which only appear when the request asks for samples. */
  isSample: boolean;
};

export type EventListResponse = { events: EventSummary[] };

// ---------- Public API: GET and POST /api/events/:id ----------

/** A Cube from the Cube Library, as events show it. */
export type EventCube = {
  id: number;
  name: string;
  listUrl: string;
  owner: string;
  style: string;
  cardCount: number | null;
  /** A key of LENDING in src/lib/cube-library.ts, or null. */
  lending: string | null;
  imageUrl: string | null;
  imageArtist: string | null;
};

export type EventDetail = EventSummary & {
  description: string | null;
  locationAddress: string | null;
  tz: string;
  /** UTC instants, ISO 8601. */
  startsAt: string;
  endsAt: string;
  /** When voting closes. Null unless cubeMode is vote. */
  voteClosesAt: string | null;
  /** The Cube the host set (cubeMode set) or confirmed after a vote. */
  cube: EventCube | null;
  /** People can say they are going until the event ends. False for cancelled events. */
  rsvpOpen: boolean;
  /** cubeMode is vote, no Cube is confirmed, and voteClosesAt has not passed. */
  votingOpen: boolean;
};

export type Attendee = { id: number; name: string };

export type CubeSuggestion = {
  id: number;
  cube: EventCube;
  /** Name of the attendee who suggested it, or null if they left. */
  suggestedBy: string | null;
  /** Name of the attendee who said "I can bring it", or null. */
  bringer: string | null;
  /** The caller suggested it. Always false without a valid attendee token. */
  mine: boolean;
  /** The caller is the bringer. */
  iBring: boolean;
};

/** One round of the instant-runoff count. */
export type TallyRound = {
  /** Cubes still in the race this round, most votes first. */
  counts: { cubeId: number; votes: number }[];
  /** The Cube dropped at the end of this round. Null in the last round. */
  eliminated: number | null;
};

export type Tally = {
  /** Ballots that rank at least one Cube still suggested. */
  ballots: number;
  /** Cube id of the winner so far, or null when there are no ballots. */
  winner: number | null;
  /** True when the deciding step needed a tie-break. */
  tied: boolean;
  rounds: TallyRound[];
};

export type EventPayload = {
  event: EventDetail;
  attendees: Attendee[];
  suggestions: CubeSuggestion[];
  tally: Tally;
  /** The caller, when the request carries a valid attendee token for this event. */
  me: { id: number; name: string; ranking: number[] } | null;
};

/** After "attend", the payload also carries the private token to keep in this browser. */
export type AttendResponse = EventPayload & { token: string };

/** Header that carries the attendee token on GET and POST /api/events/:id. */
export const ATTENDEE_HEADER = 'X-Attendee-Token';

/** Body of POST /api/events/:id. Every action answers with a fresh EventPayload. */
export type EventAction =
  | { action: 'attend'; name: string; turnstileToken?: string }
  | { action: 'leave' }
  | { action: 'suggest'; cubeId: number; canBring?: boolean }
  | { action: 'withdraw'; suggestionId: number }
  | { action: 'bring'; suggestionId: number; bring: boolean }
  | { action: 'vote'; ranking: number[] };

/** Error body: { error: <code> }. The pages show ACTION_MESSAGES[code]. */
export type ActionErrorCode = keyof typeof ACTION_MESSAGES;

export const ACTION_MESSAGES = {
  name: 'Please enter a name or Discord handle, up to 40 characters.',
  'name-taken': 'Someone with that name is already going. If that is you on another device, you are all set. If not, add a last initial.',
  verify: 'We could not confirm you are human. Please try again.',
  slow: 'That is a lot in one hour. Please try again a little later.',
  full: 'This event is full. Check back later in case a spot opens.',
  'rsvp-closed': 'The list for this event is closed.',
  'vote-closed': 'Voting is closed for this event.',
  'not-attending': 'Say you are going first. Then you can suggest and rank Cubes.',
  cube: 'We could not find that Cube in the Cube Library.',
  duplicate: 'That Cube is already suggested. You can rank it below.',
  limit: 'You can suggest up to 3 Cubes, and an event can have up to 12.',
  ranking: 'Please rank at least one of the suggested Cubes.',
  'not-yours': 'Only the person who suggested a Cube can withdraw it.',
  taken: 'Someone else already said they can bring that Cube.',
  gone: 'We could not find that event. It may have been removed. Go back to the calendar to see what is on.',
  bad: 'That did not work. Please refresh the page and try again.',
  unavailable: 'Sorry, events are not working right now. Please try again later.',
} as const;

/** Where the browser keeps a visitor's attendee token for one event, and the last name they used. */
export const attendeeStorageKey = (eventId: number) => `ludarium.cal.attendee.${eventId}`;
export const NAME_STORAGE_KEY = 'ludarium.cal.name';
export type StoredAttendee = { id: number; name: string; token: string };

// ---------- Suggest an event: POST /api/events/suggest (a plain form post) ----------

/** What a visitor sends from the suggest form, after cleaning. */
export type EventSuggestion = {
  title: string;
  kind: EventKind;
  date: string;
  startTime: string;
  endTime: string;
  locationName: string | null;
  locationAddress: string | null;
  description: string | null;
  cubeMode: 'vote' | 'none';
  submitterName: string;
  submitterEmail: string | null;
};

/** Codes the suggest form can come back with (?event_error=<code>). */
export const SUGGEST_MESSAGES = {
  missing: 'Please add a title, a date, start and end times, and your name.',
  date: 'Please pick a date from today on, within the next 18 months.',
  time: 'Please check the start and end times.',
  email: 'Please check your email address.',
  long: 'One of your answers is a little long. Please shorten it.',
  verify: 'We could not confirm you are human. Please try again.',
  slow: 'That is a lot of events in one hour. Please try again a little later.',
  unavailable: 'Sorry, the form is not working right now. Please try again later.',
} as const;

// ---------- Admin API: /api/where-we-play/admin/calendar ----------

/** What the admin sends to create an event, or any subset of it to change one. */
export type AdminEventInput = {
  title: string;
  kind: EventKind;
  date: string;
  startTime: string;
  endTime: string;
  description: string | null;
  locationName: string | null;
  locationAddress: string | null;
  cubeMode: CubeMode;
  /** The Cube the host picked (cubeMode set) or confirmed after a vote. Null clears it. */
  cubeId: number | null;
  voteCloseHours: number;
  status: EventStatus;
};

/** POST body: the event plus how many more weeks to repeat it (0 to CAL_CAPS.repeatWeeks). */
export type AdminCreateBody = Partial<AdminEventInput> & { repeatWeeks?: number };
export type AdminCreateResponse = { ids: number[] };

export type AdminEvent = Omit<EventSummary, 'status'> & {
  status: EventStatus;
  community: string;
  description: string | null;
  locationAddress: string | null;
  tz: string;
  startsAt: string;
  endsAt: string;
  cubeId: number | null;
  voteCloseHours: number;
  /** Who suggested it, for visitor suggestions. Private. */
  submitterName: string | null;
  submitterEmail: string | null;
  suggestions: number;
  ballots: number;
  createdAt: string;
};

export type AdminListResponse = { events: AdminEvent[] };

export type AdminEventDetail = {
  event: AdminEvent;
  attendees: (Attendee & { createdAt: string })[];
  suggestions: CubeSuggestion[];
  tally: Tally;
};
