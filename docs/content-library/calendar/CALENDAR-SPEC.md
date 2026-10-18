# Ludarium Calendar — spec for the site build

The live interim version runs as a claude.ai artifact (`calendar/index.html`, backed by the artifact's shared database). This spec lets the theludarium.com build (Claude Code, Cloudflare Pages) ship the same thing at `/calendar` with a real backend, and reuse the page's markup and logic.

## What it does
- One calendar for every Ludarium community (Cube Commonwealth first; any game group can be added).
- Organizers post events; members read, filter by community, add to Google Calendar, and RSVP via the community's Discord link. RSVP is deliberately in Discord, not on the page: it keeps the count where the conversation already is.
- Recurring events are stored once (`weekly` / `biweekly`, optional `until`, per-date `skips`) and expanded client-side for the next 10 weeks.
- Times are Indianapolis wall-clock (`date` + `time`), converted to UTC only for the Google Calendar link, DST-safe.
- Deep link to one community: `/calendar#cube-commonwealth`.

## Data model
```
communities/<slug>   { name, color (#hex), link (Discord/signup URL), blurb }
events/<id>          { community (slug), title, date (YYYY-MM-DD), time (HH:MM),
                       durationMin, repeat ("none"|"weekly"|"biweekly"), until (YYYY-MM-DD|""),
                       skips [YYYY-MM-DD], venue, address, rsvpUrl, notes, updatedAt (ISO) }
```

## Routes to add on the site
- `GET /calendar` — the page.
- `GET /calendar/<community-slug>` — same page, pre-filtered (replaces the `#hash` deep link).
- `GET /calendar/feed.ics` and `/calendar/<slug>.ics` — iCal feed so members subscribe once (expand recurrences server-side, 90-day window; one VEVENT per occurrence, UID = `<eventId>-<date>@theludarium.com`).
- `GET /api/events`, `/api/communities` — JSON for the page and for the community pages at `/communities/<slug>` (show "next event" there).
- Organizer writes behind auth (Cloudflare Access or a simple signed-in role); the page already hides the organizer forms unless the viewer can write.

## Storage on Cloudflare
Cloudflare D1 (two tables mirroring the model above) or KV with one JSON blob per collection; D1 preferred for the iCal feed and per-community queries.

## Porting notes
- The artifact page's `<script>` is framework-free; the render, recurrence expansion, Google Calendar link, and DST helpers lift straight out. Replace the `claude.use("db")` calls with `fetch("/api/...")` and the two forms' submits with authenticated POSTs.
- Keep the CSS tokens; they match the brand palette used across the article set.
- Add a `/communities/<slug>` page template: name, blurb, Discord link, next three events from the calendar, and the articles tagged to that community (Cube Commonwealth → the `Cube Commonwealth` and `Magic: The Gathering and Cube` categories).
