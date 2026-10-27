# Build prompt: Where We Play

Paste everything below this line into a fresh Claude Code session in this repo.

---

Build **Where We Play**, a tool on theludarium.com that helps the Cube Commonwealth (about 300 Magic Cube drafters, most in the northern Indianapolis area) find the best places to meet. Members share where they live. Levi keeps a vetted list of candidate venues. The app computes car drive times from every member to every venue and ranks the venues by how easy they are for the group to reach.

Read `CLAUDE.md`, `DESIGN-NOTES.md`, and `DECISIONS.md` first. Everything here follows the site's rules: Astro static pages, Cloudflare Pages Functions for anything dynamic, D1 for storage, design tokens from `src/styles/tokens.css`, the shared header and footer, light and dark modes, and no em dashes anywhere. Match the patterns already in the repo: the inquiry form in `functions/api/inquiry.ts` (validation, honeypot, Turnstile, Resend), the visitor tracker's D1 setup (`migrations/`, the root `wrangler.toml` for local dev only, bindings in the dashboard), and the corporate events pages for form styling.

## Who uses it

Two audiences, two pages.

**Members** visit `/cube-commonwealth/where-we-play/`. They read a short explanation, submit their location and availability, suggest a venue, and see aggregate results. They never see another member's address, name, or email.

**Levi** visits `/cube-commonwealth/where-we-play/admin/`. He vets venues, reviews members, reads the rankings, records events, and schedules meetups from what he learns. The admin page and its API routes sit behind Cloudflare Access (Levi sets up the Access application; give him exact steps). The functions must also check the `Cf-Access-Jwt-Assertion` header, or at minimum refuse requests that lack it, so the routes are not open if Access is misconfigured. Document the check.

Indianapolis only for now. Do not build multi-city support, but do not hard-code Indianapolis into table names or routes either; a `group` column with the value `cube-commonwealth` is enough.

## The member page

Branded The Ludarium. One line says it is for the Cube Commonwealth and will serve other groups later. Follow the landing page rules in `CLAUDE.md`: a headline, a subheadline, the form, then three short objection answers below the fold. The one action is submitting a location.

### The form

Fields, in this order:

1. **Email**, required. Used for the confirmation email and the edit link, nothing else.
2. **Discord handle**, optional.
3. **First name**, optional.
4. **Zip code**, required. Five digits.
5. **Street address**, optional. Street, city, state. One line is fine.
6. **Nearest cross street**, optional, shown only after they type a street address. Explain in one line that it lets the map show them without showing their house.
7. **Availability**, optional. A grid of checkboxes: Monday through Thursday evenings, Friday evening, Saturday afternoon, Saturday evening, Sunday afternoon, Sunday evening. Keep the labels this short.

Below the submit button, the privacy statement, exactly this wording:

> Only the app's admin can see your address, and it is never shared. Members see only drive-time summaries. Update or delete it any time with the link in your email.

Link the privacy page. Add a short section to `/privacy/` describing what this tool stores and why, in the same plain voice as the rest of that page.

Protect the form the way the inquiry form is protected: honeypot field plus Turnstile. Validate every field server side. Rate limit submissions by IP (a simple D1 or KV counter is fine).

### What happens on submit

1. Geocode the location (see Geocoding below) and store the member row.
2. Generate a private edit token (32 random bytes, base64url) and store its hash. The edit link is `/cube-commonwealth/where-we-play/edit/?t=<token>`.
3. Send a confirmation email through Resend, reusing the inquiry form's settings. Subject: "We got your Where We Play submission". Body: thanks, what happens next in one sentence, the edit link, and the privacy line. Plain text plus a simple HTML version. No tracking.
4. Redirect to `/cube-commonwealth/where-we-play/thanks/`, which says to check their email and shows the aggregate results.
5. Queue drive-time computation for the new member against every approved venue (see Drive times below).

If an email already exists, update that row instead of creating a second one, re-send the edit link, and say so on the thanks page without revealing whether the email was already known to anyone but the submitter.

### The edit page

`/cube-commonwealth/where-we-play/edit/?t=<token>` shows the same form, prefilled, with Save and Delete buttons. Delete removes the member row and every cached drive time for them, then shows a short goodbye. A bad or missing token shows a plain "This link is not valid" page with a link back to the form. Tokens do not expire.

### Suggest a venue

A second, smaller form on the member page, below the fold: venue name, address, and an optional note. Submissions land in the admin queue with status `idea` and are invisible to members until Levi approves them. Same honeypot and Turnstile protection.

### Aggregate results

On the member page and the thanks page, a card per approved venue (status `confirmed` or `played here`), ranked by median drive time:

- Venue name and neighborhood (city or area, not the street address unless Levi marks the venue public)
- "A median 14 minute drive for 40 members"
- Table count and hours if set

Show nothing identifying. If fewer than 5 members have locations, show a line saying results appear once enough people have joined, instead of the cards.

## The admin page

One page, several sections, plain and dense. Rounded cards, tables where tables help, nothing decorative. Sections:

### Rankings

The headline view. A table of every venue not marked `not a fit`, one row each, sorted by median drive time:

| Venue | Status | Median | 75th percentile | Under 20 min | Members routed |

Clicking a row opens that venue's detail: a histogram of drive times in 5 minute buckets, and the list of members by drive time (first name or Discord handle, zip, minutes). A toggle switches between all members and members available on a chosen slot, so Levi can ask "who can make Tuesday nights, and where is easiest for them?"

Above the table, the group summary: how many members have locations, how many have full addresses, and the member-weighted center point.

### Map

A Leaflet map (the one new front-end dependency; load it from a CDN with a pinned version and say so in `DECISIONS.md`). OpenStreetMap tiles. Layers:

- Venue pins, colored by status.
- Member dots. On the admin map, dots sit at the geocoded point. On any member-facing map in the future, dots must snap to the cross street or zip centroid; build the snapping now and use it for the admin map's "public view" toggle, so Levi can see what a member would see.
- The group center as a distinct marker.

### Venues

A table of every venue with inline edit. Fields: name, address, table count, hours (free text), website, call-ahead flag, notes, status, public address flag. Status values: `idea`, `contacted`, `confirmed`, `played here`, `not a fit`. The queue of member-suggested venues shows at the top with Approve and Discard. Approving geocodes the venue and triggers drive-time computation for every member.

### Members

A table of every member: first name, Discord handle, email, zip, address, cross street, availability, submitted date, geocode status. Levi can delete a member and can resend their edit link. Keep this table behind a "Show addresses" toggle that is off by default, so the page can be shared over his shoulder without exposing everyone.

### Events

A minimal record for attendance tracking: date, venue, headcount, notes. Add, edit, delete. A list sorted by date, newest first. Nothing else for now; this data feeds site-selection research later.

## Storage

Use the existing D1 database (binding `DB`). Add a migration under `migrations/` with these tables. Prefix every table with `wwp_`.

- `wwp_members`: id, group, email, discord_handle, first_name, zip, street_address, cross_street, lat, lng, geocode_source (`address`, `cross_street`, `zip`, or `failed`), public_lat, public_lng (the snapped point), availability (JSON array of slot keys), edit_token_hash, created_at, updated_at
- `wwp_venues`: id, group, name, address, lat, lng, neighborhood, table_count, hours, website, call_ahead, notes, status, address_public, suggested_by_member_id (nullable), created_at, updated_at
- `wwp_drive_times`: member_id, venue_id, seconds, source (`osrm` or `straight_line`), computed_at. Primary key on the pair.
- `wwp_events`: id, group, venue_id, date, headcount, notes, created_at
- `wwp_rate_limits` or a KV namespace for the submission rate limit, whichever is simpler.

Migrations run with `npx wrangler d1 migrations apply`, the same way the visitor tracker's do. Document the commands in the README section you add.

## Geocoding

Nominatim (OpenStreetMap), free. Honor its usage policy: one request per second, a real `User-Agent` (reuse the site's), and cache every result in D1 keyed by the normalized query so the same address is never looked up twice.

Priority per member: full street address, then cross street plus zip, then zip alone. Record which one succeeded in `geocode_source`. For zip-only members use the zip centroid; a bundled table of Indiana zip centroids (a small JSON in `src/data/`) is fine and avoids a network call. If every attempt fails, keep the row, mark it `failed`, and show it on the admin members table so Levi can fix the address.

Public point: cross street geocode if they gave one, otherwise the zip centroid. Never the house.

## Drive times

OSRM's public demo server (`router.project-osrm.org`) with the `table` service, which returns a matrix in one call. It is free and good enough; it is not meant for heavy sustained use, so:

- Compute only missing pairs. Every member-to-venue time is cached in `wwp_drive_times` and never recomputed unless the member or venue location changes.
- Batch: when a venue is approved, one `table` call for all members against that venue. When a member joins, one call for that member against all venues. Chunk at 100 coordinates per request.
- Fall back to a straight-line estimate when OSRM fails or times out: great-circle distance times 1.3 for road wiggle, at 28 miles per hour. Mark the source so the admin page can show how many pairs are estimates and offer a "Retry OSRM" button.
- Run the computation inside `waitUntil` after the response, like the visitor tracker, so submissions never wait on it.

Put the math in a pure module, `src/lib/where-we-play/engine.ts`: median, 75th percentile, count under a threshold, weighted center, haversine, straight-line fallback, snapping. Unit test it with Vitest the way `workers/bgg` tests its code. The Pages Functions call the engine; they do not contain math.

## Metrics

For each venue, over every member with a cached drive time:

- **Median** minutes. The ranking key.
- **75th percentile** minutes. Shows whether the far side of town is stranded.
- **Under 20 minutes**: count and percentage of members.
- **Members routed**: how many pairs exist, so a venue with 12 routed members is not compared blindly against one with 200.

When a slot filter is active, compute the same numbers over members available in that slot.

## Routes to build

Pages Functions under `functions/api/where-we-play/`:

- `POST submit` (member form), `GET edit?t=` (prefill), `POST edit` (save), `POST delete`
- `POST suggest-venue`
- `GET results` (aggregate cards, public, cached for 5 minutes)
- Admin, Access-protected: `GET admin/summary`, `GET admin/venues`, `POST admin/venues`, `PATCH admin/venues/:id`, `GET admin/members`, `DELETE admin/members/:id`, `POST admin/members/:id/resend`, `GET admin/rankings?slot=`, `GET admin/venues/:id/detail`, `POST admin/recompute`, events CRUD

Astro pages under `src/pages/cube-commonwealth/where-we-play/`: `index.astro`, `thanks.astro`, `edit.astro`, `admin.astro`. The admin page is `noindex` and excluded from the sitemap and from search (add a rule in `src/lib/search.ts` or the page's own `data-pagefind-ignore`). The member page is indexed and gets a section in search if one fits; otherwise it falls under About.

## Settings

Reuse `RESEND_API_KEY`, `INQUIRY_FROM`, and `TURNSTILE_SECRET_KEY`. Add nothing that needs a new paid account. Any new variable goes in the dashboard, not the repo, and is listed in the README with what it is for.

## Do not build

- Discord integration of any kind. Levi shares the link himself.
- A newsletter checkbox or any Kit call.
- Accounts, logins, or passwords. The edit token is the whole identity system.
- Per-event RSVP optimization. Version one optimizes for everyone with a location, filtered by availability slot.
- Multi-city support, lounge site-selection views, or "any point on the map" analysis.
- Paid APIs (Google Maps, Mapbox routing).

## Deliver

1. Work on a branch named `feature/where-we-play`. Commit in sensible steps.
2. Migration, engine with tests, functions, pages, privacy section, README section, and a `DECISIONS.md` entry explaining the choices above in the log's usual voice (why Pages Functions and the existing D1 instead of a new Worker, why Nominatim and OSRM, why Leaflet, why edit tokens instead of accounts, the privacy model).
3. Before touching Cloudflare, stop and give Levi the exact dashboard steps: the Access application for the admin path, the D1 migration command, any new variable. Wait for him to confirm before assuming they are done.
4. Open a pull request and share the preview URL. On the preview, Turnstile uses the always-pass test key and the admin routes should accept a `WWP_ADMIN_PREVIEW_TOKEN` header so Levi can try the admin page before Access is configured. Remove nothing for production; the token check is skipped when the variable is unset.
5. Seed the preview with a dozen fake members spread across the north side and five venues so the rankings and map have something to show. Put the seed in a script that is never run against production, and say how to clear it.

Keep the code small and readable. Simplest viable approach first; flag tradeoffs instead of silently deciding them. When something here conflicts with the repo's existing rules, follow the repo and say so.
