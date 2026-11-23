# Events calendar: build spec (version 1)

Levi asked for an events calendar on theludarium.com (2026-11-23). Version 1 serves the Cube Commonwealth; later the same tables feed a sitewide calendar for every tabletop community. This file is the single source of truth for the build. The contract in code is `src/lib/calendar/shared.ts`; if this file and that one ever disagree, `shared.ts` wins.

## 1. What it does

- **Public calendar** at `/cube-commonwealth/events/`: a month view, Sunday through Saturday. Each day shows a mini-Cube per event. Tap a day and its square becomes a 3D Cube that turns toward you and opens to show that day's events as mini-Cubes. Tap a mini-Cube for the event's details.
- **Event details**: title, date, time range, place, description, who is going, and which Cube will be drafted.
- **Going**: "I'm going" asks only for a name or Discord handle. No accounts. The browser keeps a private token so that person can change their answers from that device.
- **Which Cube to draft**: for events where attendees choose, people who are going can suggest Cubes from the Cube Library (`/cube-commonwealth/cubes/`), say "I can bring it", and rank the suggested Cubes. The site counts the ballots by ranked choice (instant runoff). Voting closes a set number of hours before the start (default 24). The host can also set the Cube up front, or confirm or override the result.
- **Suggest an event**: any visitor can fill in a form. It is saved as pending and emailed to Levi, who approves, edits, or rejects it.
- **Admin** at `/cube-commonwealth/where-we-play/admin/calendar/` (behind the existing Cloudflare Access policy): create events (with "repeat weekly"), edit, cancel, delete, approve suggestions, remove attendees or suggested Cubes, confirm a Cube, delete the sample events.
- **Sample events**: placeholder events (at least two per day) flagged `is_sample`. They answer only with `?samples=1`, in lists and by id, so Levi can see a full calendar without the public seeing made-up events.

### Decisions already made (do not reopen)

- No accounts, no emails to attendees. Identity is a name plus a per-event token kept in `localStorage`.
- No new dependencies. The 3D is plain CSS transforms driven by one progress function.
- Events are local, in-person. Times are stored and shown as local wall time in the event's time zone (`America/Indiana/Indianapolis` by default).
- Tables are prefixed `cal_`. The older `wwp_events` table is a different thing (past meetups for Where We Play); leave it alone.
- The admin lives under the Where We Play admin paths so the existing Access application covers it.
- Attendee names are public on the event. The form says so.

## 2. Files and who owns them

The build was split five ways. The table shows where each part lives.

**Foundation:**
`src/lib/calendar/shared.ts` (types, constants, messages), `src/lib/calendar/dates.ts`, `src/lib/calendar/tally.ts`, `src/lib/calendar/validate.ts`, `src/lib/calendar/ics.ts`, `tests/calendar/lib.test.ts`, `tests/calendar/d1.ts` (a real-SQL stand-in for D1 in tests), this spec.

| Part | Files |
| --- | --- |
| **Server** | `migrations/0008_calendar.sql`, `src/server/calendar/**`, `functions/api/events/**`, `functions/api/where-we-play/admin/calendar/**`, `tests/calendar/server.test.ts` |
| **Calendar** | `src/pages/cube-commonwealth/events/index.astro`, `src/scripts/calendar.ts`, `src/scripts/calendar-cube.ts`, `src/lib/calendar/render.ts`, `src/styles/calendar.css`, `tests/calendar/render.test.ts` |
| **Event view** | `src/scripts/calendar-event.ts`, `src/lib/calendar/event-render.ts`, `src/styles/calendar-event.css`, `tests/calendar/event-render.test.ts` |
| **Admin** | `src/pages/cube-commonwealth/where-we-play/admin/calendar.astro`, `src/scripts/calendar-admin.ts`, the one-line nav links in `src/pages/cube-commonwealth/where-we-play/admin.astro` and `src/pages/cube-commonwealth/where-we-play/admin/cubes.astro` |
| **Pages** | `src/pages/cube-commonwealth/events/suggest.astro`, the Events card in `src/pages/cube-commonwealth/index.astro`, `scripts/calendar-samples.ts`, `migrations/0009_calendar_samples.sql`, `tests/calendar/samples.test.ts`, `astro.config.mjs` (sitemap list only), `CLAUDE.md`, `DECISIONS.md`, `README.md` |

## 3. Data model: `migrations/0008_calendar.sql`

Use exactly these tables and columns (comments may be reworded). D1 enforces foreign keys.

```sql
CREATE TABLE cal_events (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  community         TEXT    NOT NULL DEFAULT 'cube-commonwealth',
  title             TEXT    NOT NULL,
  kind              TEXT    NOT NULL DEFAULT 'draft',      -- draft, class, meetup, celebration, other
  date              TEXT    NOT NULL,                      -- YYYY-MM-DD, local to tz
  start_time        TEXT    NOT NULL,                      -- HH:MM, 24 hour, local
  end_time          TEXT    NOT NULL,                      -- HH:MM; at or before start_time means the next day
  tz                TEXT    NOT NULL DEFAULT 'America/Indiana/Indianapolis',
  starts_at         TEXT    NOT NULL,                      -- UTC ISO instant, kept in step with date, start_time, tz
  ends_at           TEXT    NOT NULL,                      -- UTC ISO instant
  description       TEXT,
  location_name     TEXT,
  location_address  TEXT,
  cube_mode         TEXT    NOT NULL DEFAULT 'vote',       -- vote, set, none
  cube_id           INTEGER REFERENCES cubes(id) ON DELETE SET NULL,  -- the Cube the host set or confirmed
  vote_close_hours  INTEGER NOT NULL DEFAULT 24,           -- voting closes this many hours before starts_at
  status            TEXT    NOT NULL DEFAULT 'approved',   -- pending, approved, cancelled, rejected
  is_sample         INTEGER NOT NULL DEFAULT 0,
  submitter_name    TEXT,                                  -- private: who suggested it
  submitter_email   TEXT,                                  -- private
  closed_tally      TEXT,                                  -- JSON Tally, frozen once someone leaves after voting closes
  created_at        TEXT    NOT NULL,
  updated_at        TEXT    NOT NULL
);
CREATE INDEX cal_events_by_date ON cal_events (community, date, start_time);
CREATE INDEX cal_events_status ON cal_events (status);

CREATE TABLE cal_attendees (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id    INTEGER NOT NULL REFERENCES cal_events(id) ON DELETE CASCADE,
  name        TEXT    NOT NULL,
  token_hash  TEXT    NOT NULL,                            -- sha256 of the private attendee token
  created_at  TEXT    NOT NULL
);
CREATE UNIQUE INDEX cal_attendees_name ON cal_attendees (event_id, name COLLATE NOCASE);
CREATE UNIQUE INDEX cal_attendees_token ON cal_attendees (token_hash);

CREATE TABLE cal_cube_suggestions (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id      INTEGER NOT NULL REFERENCES cal_events(id) ON DELETE CASCADE,
  cube_id       INTEGER NOT NULL REFERENCES cubes(id) ON DELETE CASCADE,
  suggested_by  INTEGER REFERENCES cal_attendees(id) ON DELETE SET NULL,
  bringer_id    INTEGER REFERENCES cal_attendees(id) ON DELETE SET NULL,   -- who said "I can bring it"
  created_at    TEXT    NOT NULL
);
CREATE UNIQUE INDEX cal_cube_suggestions_once ON cal_cube_suggestions (event_id, cube_id);

CREATE TABLE cal_ballots (
  event_id     INTEGER NOT NULL REFERENCES cal_events(id) ON DELETE CASCADE,
  attendee_id  INTEGER NOT NULL REFERENCES cal_attendees(id) ON DELETE CASCADE,
  ranking      TEXT    NOT NULL,                           -- JSON array of Cube ids, first choice first
  updated_at   TEXT    NOT NULL,
  PRIMARY KEY (event_id, attendee_id)
);
```

The `cubes` table (the Cube Library) already exists: `migrations/0005_cube_library.sql` and `0007_cube_images.sql`. Only Cubes with `status = 'approved'` count anywhere in the calendar.

## 4. Server

Reuse the helpers in `src/server/where-we-play/`: `http.ts` (`json`, `fail`, `field`, `redirect`, `clientIp`, `sha256Hex`, `verifyTurnstile`, `readJson`), `env.ts` (`WwpEnv`, `Context`, `D1`), `tokens.ts` (`newToken`, `TOKEN_PATTERN`), `db.ts` (`allowSubmission`, the hashed-IP hourly rate limiter on `wwp_rate_limits`), and `src/server/notify.ts` (`notify`). Follow the style of `functions/api/cubes/index.ts` and `functions/api/where-we-play/submit.ts`.

Put queries and rules in `src/server/calendar/` (for example `db.ts`, `actions.ts`, `view.ts`) so the route files stay thin and the logic is testable. Every handler takes `now` from one place (`new Date()` at the top of the request) and passes it down, so tests can fix the clock.

- Attendee token: the browser makes it (32 random bytes, base64url) and sends it in the `X-Attendee-Token` header (`ATTENDEE_HEADER`), so a retried `attend` after a lost answer finds the same sign-up. Store `sha256Hex('cal-attendee:' + token)`. A token only counts for the event whose attendee row it matches.
- Rate limits with `allowSubmission`, under a salted hash that is not kept with any name or event: sign-ups 40 an hour per address (a whole room on one Wi-Fi shares one), event suggestions 5 an hour per address, and every other action 120 an hour per attendee.
- Preview addresses (`*.pages.dev`) can read the calendar but refuse writes with `unavailable`, because they share the production database and use an always-pass human check.
- Turnstile follows the Where We Play pattern exactly: `if (env.TURNSTILE_SECRET_KEY && !(token && (await verifyTurnstile(token, env.TURNSTILE_SECRET_KEY, ip || null))))` then refuse with `verify`. With no secret set (local dev) the check is skipped.
- Instants: on every create and on any edit of date, times, or tz, recompute `starts_at` and `ends_at` with `eventInstants()` from `dates.ts`. `voteClosesAt = voteCloseInstant(startsAt, vote_close_hours)`.
- `rsvpOpen` = status approved and now is before `ends_at`. `votingOpen` = status approved, `cube_mode = 'vote'`, `cube_id` is null, and now is before `voteClosesAt`.
- The tally: candidates are this event's suggestions whose Cube is still approved, in `id` order (earliest suggestion first); ballots are every attendee's ranking; call `tallyRankedChoice`. The `tally` is computed fresh until voting has closed and someone leaves; then the count at that moment is kept in `closed_tally`, so a late dropout cannot change the result. Any admin edit, or the admin removing a person or a Cube, lets go of it.
- Never return `submitter_*`, `closed_tally`, `token_hash`, or pending and rejected events from a public route.
- All JSON routes answer `Cache-Control: no-store` except the list, which may use `public, max-age=20`.

### Public routes

**`GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD[&samples=1][&limit=N]`** (`functions/api/events/index.ts`)
Approved and cancelled events of the `cube-commonwealth` community with `date` in the range, ordered by date, start time, id. `from` and `to` are required and valid, `to >= from`, and the range is at most `CAL_CAPS.rangeDays` days; otherwise 400 `{ error: 'bad' }`. Sample events are included only with `samples=1`. `limit` is 1 to 500 (default 500). Answer: `EventListResponse`. `going` is the attendee count. `cubeName` is the approved Cube named by `cube_id`, else null.

**`GET /api/events/:id`** (`functions/api/events/[id].ts`)
Answer: `EventPayload`, or 404 `{ error: 'gone' }` for unknown, pending, or rejected events. With a valid attendee token, `me` is filled and `mine` and `iBring` are set. `me.ranking` lists only Cubes still suggested.

**`POST /api/events/:id`** with a JSON `EventAction`. Every success answers the fresh `EventPayload` (for `attend`, an `AttendResponse` with the new `token`). Errors answer `{ error: <ActionErrorCode> }`:

| Action | Rules | Errors |
| --- | --- | --- |
| `attend` | Event approved and `rsvpOpen`. Name through `cleanAttendeeName`. Turnstile. Rate limit. Under `CAL_CAPS.attendeesPerEvent`. The name is unique within the event, ignoring case. | 400 `name`, 403 `verify`, 429 `slow`, 409 `rsvp-closed`, 409 `full`, 409 `name-taken` |
| `leave` | Valid token. Deletes the attendee (their ballot goes with them; their suggestions stay with `suggested_by` and `bringer_id` cleared by the foreign keys). Answers the payload with `me: null`. | 401 `not-attending` |
| `suggest` | Valid token. `votingOpen`. The Cube exists and is approved. Not already suggested for this event. The attendee has fewer than 3 suggestions here and the event has fewer than 12. `canBring: true` makes the attendee the bringer. | 401 `not-attending`, 409 `vote-closed`, 400 `cube`, 409 `duplicate`, 409 `limit` |
| `withdraw` | Valid token. `votingOpen`. The suggestion belongs to this event, and this attendee suggested it or its suggester has left. Deletes it. | 401 `not-attending`, 409 `vote-closed`, 404 `bad`, 403 `not-yours` |
| `bring` | Valid token. `rsvpOpen` (people can offer to bring a Cube even after voting closes). `bring: true` sets the caller as bringer if nobody is, or keeps them if they already are; someone else already bringing it is 409 `taken`. `bring: false` clears it only if the caller is the bringer. | 401 `not-attending`, 409 `rsvp-closed`, 404 `bad`, 409 `taken` |
| `vote` | Valid token. `votingOpen`. `cleanRanking(ranking, suggested Cube ids)`; null is 400 `ranking`. An empty list deletes the ballot; otherwise upsert it. | 401 `not-attending`, 409 `vote-closed`, 400 `ranking` |

Unknown event: 404 `gone`. Cancelled events refuse every action except `leave` with 409 `rsvp-closed`. Sample events answer 404 `gone` unless the request has `?samples=1`. A body that is not JSON or has no known action: 400 `bad`. Missing `DB` binding or a thrown error: 503 `unavailable` (log the error).

**`POST /api/events/suggest`** (`functions/api/events/suggest.ts`): a plain form post from the suggest page, same shape as `functions/api/cubes/index.ts` `onRequestPost`. Honeypot field `website` (pretend success). Needs `DB` (else `unavailable`). Turnstile as above (field `cf-turnstile-response`). Rate limit 5 an hour (`slow`). `parseEventSuggestion(form, todayIn(CAL_TZ, now))`. Insert with `status = 'pending'`, `vote_close_hours = 24`, the submitter fields, and the instants. Email Levi with `notify(env.NOTIFY, { subject: 'Event to approve: <title> (<Sun, Nov 29>)', text, replyTo: submitter email if given })`; the text lists every field in aligned lines (see `emailText` in `functions/api/cubes/index.ts`) and ends with the admin link built from `CAL_ADMIN`. Then redirect (303) to `CAL_SUGGEST + '?event=sent#form'`; on a problem redirect to `CAL_SUGGEST + '?event_error=<code>#form'` with the codes in `SUGGEST_MESSAGES`. The event is saved even if the email fails.

### Admin routes (all under the existing admin middleware, so they are already authenticated and `env.DB` is present)

- **`GET /api/where-we-play/admin/calendar`**: `AdminListResponse`, every event of every status including samples, ordered by date, start time, id.
- **`POST /api/where-we-play/admin/calendar`**: body `AdminCreateBody`. `parseEventInput(body)`; 400 `{ error: <sentence> }` on a problem. If `cubeId` is given it must be an approved Cube (400 "That Cube is not in the Cube Library."). Insert the event, then one more per extra week for `cleanRepeatWeeks(body.repeatWeeks)` weeks, each 7 days later. Answer 201 `AdminCreateResponse`.
- **`GET /api/where-we-play/admin/calendar/:id`**: `AdminEventDetail`.
- **`PATCH /api/where-we-play/admin/calendar/:id`**: body is any subset of `AdminEventInput`. `parseEventInput(body, { partial: true })`. Merge onto the stored row, then check the merged row: `cubeMode 'set'` needs a Cube, `cubeMode 'none'` clears it, start and end times differ. Recompute instants when date or times change. Answer `{ id }`. 404 for an unknown id.
- **`DELETE /api/where-we-play/admin/calendar/:id`**: deletes the event and, by cascade, its attendees, suggestions, and ballots. Answer `{ deleted: id }`.
- **`DELETE /api/where-we-play/admin/calendar/:id/attendees/:attendeeId`** and **`DELETE /api/where-we-play/admin/calendar/:id/suggestions/:suggestionId`**: remove one row that belongs to that event. Answer `{ deleted: <id> }`, 404 if it is not there.
- **`DELETE /api/where-we-play/admin/calendar/samples`**: deletes every event with `is_sample = 1`. Answer `{ deleted: <count> }`.

### Server tests (`tests/calendar/server.test.ts`)

Test against real SQL, not hand-written fakes. `tests/calendar/d1.ts` exports `testDb()`: a fresh in-memory SQLite database (Node's built-in `node:sqlite`) behind the same slice of the D1 API the site uses, with foreign keys on and every migration file applied in order (so the 41 real Cube Library rows are there, 40 of them approved; the sample events in `0009` load only with `testDb({ samples: true })`). `db.raw` and `db.exec(sql)` are there for setup and for checking rows. Cover at least: the list filter (range, statuses, samples flag, limit), detail privacy (no private columns, pending is 404), every action's happy path and each error code in the table above, tokens not working across events, name uniqueness ignoring case, cascade on leave and on event delete, the tally through real ballots, vote closing by time and by a confirmed Cube, cancelled events, admin create with repeat weeks, patch merge rules, deleting samples, the suggest form (honeypot, bad input codes, pending row, email text and reply-to, email failure still saves), and rate limits.

## 5. The calendar page (`/cube-commonwealth/events/`)

Page file: `src/pages/cube-commonwealth/events/index.astro`, in `BaseLayout`. Title "Cube Commonwealth Events: Drafts, Classes, and Meetups" and a 150 to 160 character description. Page order:

1. Head: eyebrow link "Cube Commonwealth" to `/cube-commonwealth/`, `h1` "Events", a one-sentence lede, and a ghost button "Suggest an event" to `CAL_SUGGEST`.
2. The calendar root, one element the script fills:
   `<div class="cal" data-calendar data-api={CAL_API} data-cubes-api={CUBES_API} data-suggest={CAL_SUGGEST} data-tz={CAL_TZ} data-site-key={siteKey}>` with a `<noscript>` line inside ("The calendar needs JavaScript. Until then, our Discord has every event." linking `CUBE_DISCORD_URL`). `siteKey` follows the Where We Play page: the always-pass test key when `IS_PREVIEW`, else `TURNSTILE_SITE_KEY`. The optional attribute `data-today="YYYY-MM-DD"` overrides today's date (tests and the harness use it); without it, use the visitor's local date.
3. "How it works": three short steps (open a day, say you are going, rank the Cubes).
4. A card with the Cube newsletter signup: `<NewsletterForm id="cal-signup" letters="cube" />`, heading "Get events by email".
5. The Turnstile script, loaded once for the attend form: `<script is:inline src="https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit" async defer></script>`.

Everything inside the root is built by `src/scripts/calendar.ts`:

- **Toolbar**: previous month, next month, "Today", and the month name as an `h2` (announced politely when it changes).
- **Month grid**: weekday header (full names from 900px, three letters below, with the full name for screen readers), then the weeks from `monthGrid()`. Every in-month day is a `<button>` with a full accessible name ("Sunday, November 22, 3 events"). Filler days from neighboring months are dimmed and inert. Today is marked. Past days are slightly dimmed but still open.
  - Each day shows its number and one flat isometric SVG mini-Cube per event, colored by kind, at most 4, then "+2".
  - From about 900px wide, each day also shows up to 2 event lines (start time and title, one line each, truncated), then "+1 more".
  - At 360px wide: number and mini-Cubes only, no horizontal scrolling.
  - Cancelled events show struck through and muted.
- **Legend**: the five kinds with their mini-Cube colors, in words.
- **Coming up**: the next 6 events from today (its own request, 90 days ahead), each a button row (mini-Cube, date, time, title, place, "8 going") that opens that event directly.
- **Samples**: with `?samples=1` in the page URL, pass `samples=1` to every list request and show a quiet banner: "Showing sample events. They are not real." with a "Hide samples" link. Sample events carry a small "Sample" tag in the day list, "Coming up", and the event card; in the grid the banner above it says so.
- **States**: a loading state (skeleton or "Loading events"), an error state with a "Try again" button, and an empty month ("Nothing on the calendar this month yet." plus the suggest link).
- **URL**: `?month=YYYY-MM`, `?day=YYYY-MM-DD` (opens that day), `?event=<id>` (opens that event: fetch its detail, jump to its month, open its day, show it). Keep the URL in step with `history.replaceState` so the address bar is always a shareable link. `?freeze=<0..1>` (with `day`) holds the opening animation at that progress, for screenshots.
- **Kind colors** (CSS custom properties on the root): draft `var(--color-primary)`, class `var(--chart-3)`, meetup `var(--color-stone)`, celebration `var(--color-cta)`, other `var(--color-text)`. Color is never the only signal: the kind is named in the day list and the details.

### The day dialog

Opening a day shows a modal dialog (`role="dialog"`, `aria-modal="true"`, labelled by its heading), entered through the day Cube animation (section 6). At rest it is a flat, crisp, scrollable panel:

- Heading: the date ("Sunday, November 22"). A close button. Escape and a click on the backdrop close it. Focus moves in, is trapped, and returns to the day button on close. Body scroll is locked while it is open.
- **Day view**: the day's events as buttons, each a 3D mini-Cube (true CSS 3D, slow idle spin, colored by kind) with the time range, the title, the kind in words, the place, and "8 going". An empty day says "Nothing planned yet." with a link "Suggest an event for this day" to `CAL_SUGGEST + '?date=YYYY-MM-DD'`.
- **Event view**: tapping an event swaps the day view for the event view with a cube-flavored quarter turn. The calendar script creates a container and calls `mountEventView(container, eventId, summary, options)` from `src/scripts/calendar-event.ts` (section 7). A back button ("Back to Sunday") returns to the day view and calls `destroy()` on the view. The calendar script owns the dialog chrome (heading, back, close); the event view owns everything inside the container. When `options.onChange` reports a new summary, update that event's going count in the grid and lists.
- Reduced motion (`prefers-reduced-motion: reduce`): no 3D travel and no idle spin; the dialog fades in.

## 6. The day Cube

See `docs/calendar/DAY-CUBE.md`, written after the prototype competition. It names the winning concept, the reference prototype to port, and the fixes the judges asked for.

## 7. The event view (`src/scripts/calendar-event.ts`)

```ts
export type EventViewOptions = {
  api: string;              // CAL_API
  cubesApi: string;         // '/api/cubes', answers { cubes: PublicCube[] } (see src/lib/cube-library.ts; each has an id)
  pageUrl: string;          // absolute URL of the calendar page without its query string
  siteKey: string | null;   // Turnstile site key; null or '' skips the check
  suggestUrl: string;       // CAL_SUGGEST
  onChange?: (summary: EventSummary) => void;   // called whenever a fresh payload arrives
};
export type EventView = { destroy(): void };
export function mountEventView(container: HTMLElement, eventId: number, preview: EventSummary | null, options: EventViewOptions): EventView;
```

`preview` paints the title, kind, date, and time at once while the detail loads. The view renders, top to bottom:

1. Tags (kind, "Sample", "Cancelled"), the title as an `h3` with `id="cev-title"`, and the facts: date (`formatDate(date, 'long')`), time range, place (name and address, with an "Open in Maps" link `https://www.google.com/maps/search/?api=1&query=<name and address>` when there is an address).
2. The description, as paragraphs (escaped, line breaks kept).
3. **Who is going**: the count and the names. If the visitor is not going and `rsvpOpen`: a Lamplight button "I'm going" that reveals a one-field form ("Your name or Discord handle", prefilled from `NAME_STORAGE_KEY`, note "Your name shows on this event. No account needed.") with the Turnstile widget rendered on demand (`window.turnstile.render(el, { sitekey, appearance: 'interaction-only', callback })`; if `siteKey` is empty or Turnstile never loads within 4 seconds, send without a token). On success store `{ id, name, token }` under `attendeeStorageKey(eventId)` and the name under `NAME_STORAGE_KEY` (wrap storage in try and catch; fall back to memory). If the visitor is going: "You are going as Sam." with a quiet "I can't make it" button (`leave`, after a confirm step in the page, not a browser dialog).
4. **Which Cube** (skip when `cubeMode` is `none`):
   - `set`, or a vote with a confirmed Cube: "Cube to draft" and the Cube (name linked to its list, owner, style, card count, its image if it has one, with the artist credit), plus "Picked by the organizer." or "Confirmed by the organizer."
   - A vote that is open: the suggested Cubes, each with name (link), owner, style and card count, the lending label from `LENDING`, "Suggested by Ann", and either "Ben can bring it" or, for someone going, an "I can bring it" button (and "I can no longer bring it" for the bringer). The suggester sees "Withdraw". Someone going also gets:
     - "Suggest a Cube": opens a picker with a search box over the Cube Library (name, owner, style), each result a button; a checkbox "I can bring this Cube"; and a link "Browse the Cube Library" (new tab). Once a cap is reached, a line says so in place of the button.
     - **Ranking**: "Rank the Cubes you would like to draft." Tap a suggested Cube to add it to your ranking; ranked Cubes show their place (1, 2, 3) with move up, move down, and remove buttons. No drag and drop needed. "Save my ranking" sends `vote`; a status line confirms it ("Saved."). "Clear my ranking" sends an empty list.
     - **Result so far**: "Leading now: Mono Blue" with each Cube's first-round votes as small bars, the number of ballots, and a `<details>` "How the count works" that explains ranked choice in two sentences and lists the rounds ("Round 1: Mono Blue (3), MTGO Vintage Cube (2), Abecedarian Cube (1). Abecedarian Cube is dropped."). If `tally.tied`: "A tie was broken by first choices, then by which Cube was suggested first."
     - When voting closes: "Voting closes Saturday, November 28 at 1:00 pm." (the event's local time: compute from `startTime`, `date`, and the hours difference between `voteClosesAt` and `startsAt`).
     - Not going: the list is read-only with "Say you are going to suggest and rank Cubes."
   - A vote that has closed without a confirmed Cube: "The vote picked: Mono Blue" (from `tally.winner`) with the rounds, or "No votes came in. The organizer will pick the Cube." People going can still use "I can bring it".
5. Actions: "Add to my calendar" (downloads the `.ics` from `eventIcs`, file name from the title), "Google Calendar" (`googleCalendarUrl`), and "Copy link" (`pageUrl + '?event=<id>'`, keeping `samples=1` when the event is a sample).

Errors from actions show in one `role="alert"` line using `ACTION_MESSAGES`. After any action, re-render from the payload the server returned. If the stored token is rejected (`not-attending`), forget it and show the not-going state. Buttons are disabled while a request is in flight. Everything works with the keyboard and at 360px wide. Class prefix `cev-`. Put the pure HTML builders in `src/lib/calendar/event-render.ts` (strings in, strings out, everything escaped with `escapeHtml` from `src/lib/cube-library.ts`) and test them.

## 8. The admin page (`/cube-commonwealth/where-we-play/admin/calendar/`)

Model it on `src/pages/cube-commonwealth/where-we-play/admin/cubes.astro` and `src/scripts/cube-admin.ts`: `noindex`, `data-pagefind-ignore`, the preview-token form for previews (`sessionStorage` key `wwp-admin-token`, header `X-Admin-Token`), one message line. Sections:

1. **Waiting for approval**: pending suggestions, each with all its details, who sent it (name and private email), and Approve, Edit, and Reject.
2. **Add an event**: title, kind, date, start time, end time, place name, address, description, how the Cube is chosen (attendees vote, I will pick the Cube, no Cube) with a Cube select from `/api/cubes` when picking, when voting closes (`VOTE_CLOSE_HOURS`, in words: "24 hours before", "When it starts"), and "Repeat weekly for N more weeks" (0 to 12). On success, say how many events were created.
3. **Upcoming events**: a compact list (date, time, title, kind, going, status, "Sample" tag). Opening one loads its detail and shows: the edit form (same fields), the people going (each with Remove), the suggested Cubes (each with Remove) with the tally and rounds, "Confirm the Cube" (a select of the suggested Cubes plus any Library Cube; choosing one sets `cubeId`; "Reopen voting" clears it), and Save, Cancel event or Restore event, Duplicate (prefills the add form), and Delete (ask to confirm in the page).
4. **Past events**: collapsed by default, read-only.
5. **Sample events**: how many exist, a link to the calendar with samples (`CAL_BASE + '?samples=1'`), and "Delete all sample events" (ask to confirm in the page).

Also link the page from the Where We Play admin nav and the Cube queue page ("Events calendar"). Class prefix `cadm-`.

## 9. The suggest page (`/cube-commonwealth/events/suggest/`)

Model it on `src/pages/cube-commonwealth/cubes/add.astro` (a stepped form that shows all steps without JavaScript) and follow the landing page rules in `CLAUDE.md`. Posts to `CAL_API + '/suggest'`.

- Step 1, the event: title (required), kind (select), date (required, `min` today), start time and end time (required, `type="time"`).
- Step 2, where and what: place name, address, description, and a checkbox "People will draft a Cube at this event" (`name="has_draft" value="yes"`, checked by default when the kind is Draft).
- Step 3, you: your name (required), email (optional, "never public, only so we can ask you about it"), the Turnstile widget (site key as in section 5), the honeypot `website`, and the submit button "Send my event for review".
- `?date=YYYY-MM-DD` prefills the date. `?event=sent` shows the thanks line ("Thank you. Your event is in the queue. It will appear on the calendar once it is approved."); `?event_error=<code>` shows `SUGGEST_MESSAGES[code]`.
- Three short answers under the form: who approves events, what shows publicly, and what happens to the email. Links to Privacy and Terms.

## 10. Sample events (`scripts/calendar-samples.ts` and `migrations/0009_calendar_samples.sql`)

A small script (`node scripts/calendar-samples.ts`, like `scripts/where-we-play-seed.ts`) that writes the migration. Deterministic (seeded), no network. From 2026-11-01 through 2027-01-31: at least two events every day, more on weekends, kinds mixed so the mini-Cube colors vary, a "Sunday Cube Draft" at 1:00 pm every Sunday, and one "Cube Quarterly Celebration" on Saturday 2026-12-05. Titles must fit their time of day ("Lunch" at noon, "Night" in the evening). Every row has `is_sample = 1`, `status = 'approved'`, `location_name = 'Sample venue, Indianapolis'`, and a description that starts "Sample event. " so nobody mistakes it for a real one. Compute `starts_at` and `ends_at` with `eventInstants()`. About two thirds of the drafts use `cube_mode 'vote'`; the rest use `'set'` with `cube_id` looked up by name with a subquery over Levi's own Cubes only (`'Mono Blue'`, `'MTGO Vintage Cube'`, `'Abecedarian Cube - 1st Draft for New Mages'`, `'Levi''s Commander Cube #1'`), falling back to `'vote'` if the subquery finds nothing (use `COALESCE` and a `CASE`, or insert as vote then `UPDATE`). Give every sample event a few sample attendees ("Sample Ann", "Sample Ben", and so on; `token_hash` values that can never match a real token, `ip_hash 'sample'`), and for the vote events on the next four Sundays add three suggested Cubes (same lookup) and ballots, so the vote looks alive. The migration must be safe to run once on a database that has the real `cubes` rows, and must not fail if a named Cube is missing.

## 11. Conventions

- **Writing rules (strict, they apply to every string a person can read, including comments shown nowhere):** no em dashes and no en dashes. "Cube" is capitalized when it means the Magic format (Cube, Cubes, mini-Cube); lowercase only for shapes in code identifiers and CSS class names. Never write "non-gamers". Plain words, short sentences. No prices. Times read "1:00 pm to 4:30 pm".
- **Look:** clean, high end, lots of whitespace, a little artsy; rounded cards; tokens from `src/styles/tokens.css` only (no hard-coded colors except inside `color-mix`); light and dark modes; Lamplight (`.button`) only for the main call to action, `.button--ghost` for the rest.
- **Accessibility:** real buttons and links, visible focus, 44px tap targets on phones, labels on every field, `aria-live` for status lines, no information by color alone, reduced motion honored.
- **Code:** TypeScript, strict. Match the style of the files named as models: small pure functions, a short comment at the top of each file saying what it is, comments that explain why. Escape everything that reaches `innerHTML` with `escapeHtml`. No `alert()` or `confirm()`. No top-level `await` in browser scripts. No new npm packages.
- **Imports:** browser scripts and pages use the `@/` alias without extensions (`@/lib/calendar/shared`); Pages Functions and tests use relative paths with `.ts` (`../../src/lib/calendar/shared.ts`), like the existing functions do.
- **Tests:** `node --test tests/calendar/<your file>.test.ts` (Node 22 runs TypeScript directly). Tests import with relative `.ts` paths.
- **Tools:** `npm run check` for types, `node --test 'tests/calendar/*.test.ts'` for the tests, and the local setup in `README.md` under "Events calendar".
