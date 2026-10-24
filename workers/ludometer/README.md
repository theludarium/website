# The Ludometer

The Ludometer is The Ludarium's own weekly game index: what people are actually learning and playing. It sits beside BoardGameGeek's Hotness rank, which is shown as a credited source.

This folder is a Cloudflare Worker with a D1 database. It:

- takes a daily snapshot of the BGG Hotness list and each game's BGG stats, stored exactly as BGG gives them
- collects first-party signals (plays, shelf adds, page views, signups and more) from the site, the subscriber app, Kit and jobs
- scores the week every Monday from our own snapshots and signals
- serves the week, each game's history, and a newsletter feed as JSON
- gives Levi a private admin page for the watchlist, the week's movers, and the Kit broadcast draft

## The licensing gate

BoardGameGeek has not approved a commercial license yet. Until it does, nothing is public.

- `PUBLIC_API = "false"` in `wrangler.toml` is the default. While it is false, `/week`, `/game/:id` and `/feed` answer only to the `ADMIN_TOKEN` and return `403` to everyone else.
- Keep it `"false"` until BGG approves the license in writing. Then set it to `"true"` and deploy.
- The **attention** layer is built from BGG data (Hotness rank, days on the list, rating-count growth). It must never be shown publicly without the license. The overall score includes attention, so the same rule covers the whole index.
- The **play** layer (plays, shelf adds, likes, tables seated) is entirely our own data and needs no license.
- BGG's terms forbid changing or reselling BGG data. BGG values are stored unchanged. The score is our own math on our own snapshots and signals.
- Every response that includes BGG numbers carries the attribution: "Powered by BGG", linked to https://boardgamegeek.com. The site and the newsletter must show it wherever those numbers appear.
- The broadcast draft carries a "Do not send yet" warning while `PUBLIC_API` is false.

## Routes

All JSON unless noted.

| Route | Who | What |
| --- | --- | --- |
| `GET /api/ludometer/week` | Gated | The latest week: rank, movement, name, game_id, score and its three parts (0 to 100), BGG Hotness rank, days on the list, attribution |
| `GET /api/ludometer/week?week=YYYY-MM-DD` | Gated | One week. Any date snaps to its Monday |
| `GET /api/ludometer/game/:id` | Gated | One game: weekly history, days-on-list series for a sparkline, daily Hotness ranks for 90 days, our play count |
| `GET /api/ludometer/feed[?week=]` | Gated | What the newsletter template reads: the week, top 10, risers, fallers, new entries |
| `POST /api/ludometer/events` | `EVENTS_TOKEN` | One event or an array (up to 500) |
| `POST /api/ludometer/kit-webhook?key=KEY` | `KIT_WEBHOOK_KEY` | Kit tag-added webhook |
| `GET/POST/PATCH /api/ludometer/admin/watchlist` | `ADMIN_TOKEN` | The private watchlist |
| `GET/PUT /api/ludometer/admin/settings` | `ADMIN_TOKEN` | Score weights |
| `POST /api/ludometer/admin/run?job=snapshot` or `?job=score[&week=]` | `ADMIN_TOKEN` | Run a job by hand |
| `GET /api/ludometer/admin/broadcast?week=` | `ADMIN_TOKEN` | The week's Ludometer Reading as a Kit broadcast draft (subject, preview text, HTML, plain text) |
| `GET /api/ludometer/health` | Anyone | Whether the API is public. Reads nothing |
| `GET /admin/` | Cloudflare Access | The admin page (HTML) |

"Gated" means public only when `PUBLIC_API = "true"`. Otherwise send `Authorization: Bearer ADMIN_TOKEN`. Public responses never include the weights.

Errors come back as `{ "error": "..." }` with a fitting status.

## How the score works

The code is in `src/score.ts`, a pure module with tests.

1. **Week.** A week runs Monday to Sunday, UTC, and is named by its Monday. The Monday job scores the week that just ended.
2. **Candidates.** Every game on the Hotness list during the week, plus every game with events in the week.
3. **Signals.** Each signal becomes a number. Counts go through log(1 + x) so one huge number cannot drown the rest. Then each signal is divided by the largest value among the candidates, so it runs 0 to 1.
   - **Attention** (from our BGG snapshots): best Hotness rank in the week (40%), days on the list in the week (30%), growth in BGG rating count over the week (30%).
   - **Interest** (first party, equal shares): page views, return visits, watch signups, sheet downloads, course signups, YouTube views.
   - **Play** (first party, equal shares): plays, shelf adds, likes, tables seated.
4. **Families.** Each family is the weighted average of its signals, divided again by the family's leader so the leader scores 1.
5. **Score.** A weighted sum of the three families, using the private `weights` setting. Default: attention 0.6, interest 0.3, play 0.1.
6. **The high-play rule.** When logged plays in the week pass `high_play_threshold` (default 500), the job uses `weights_high_play` instead (default attention 0.45, interest 0.3, play 0.25). Once there are enough real plays to trust, the index leans on them.
7. **Stored.** The top 50 go into `weekly_scores` with last week's rank, the BGG Hotness rank on the week's last snapshot, and `days_on_list`: total days on the Hotness list, all time, through the week's end.

Change the weights on the admin page or with `PUT /api/ludometer/admin/settings`:

```json
{ "weights": { "attention": 0.6, "interest": 0.3, "play": 0.1 },
  "weights_high_play": { "attention": 0.45, "interest": 0.3, "play": 0.25 },
  "high_play_threshold": 500 }
```

Rerun a week after changing weights with `POST /api/ludometer/admin/run?job=score&week=YYYY-MM-DD`. Rerunning replaces that week's rows.

## Setup, in order

You need Node 18 or newer and the Cloudflare account for theludarium.com. Run these in this folder.

1. Install: `npm install`
2. Sign in: `npx wrangler login`
3. Create the database: `npx wrangler d1 create ludometer`
   Paste the `database_id` it prints into `wrangler.toml`, replacing the zeros.
4. Apply the schema: `npx wrangler d1 migrations apply ludometer --remote`
5. Put the secrets. Each command asks for the value. Use long random strings for the three you make up (for example `openssl rand -hex 32`).
   - `npx wrangler secret put BGG_TOKEN` (your BGG XML API token)
   - `npx wrangler secret put ADMIN_TOKEN`
   - `npx wrangler secret put EVENTS_TOKEN`
   - `npx wrangler secret put KIT_WEBHOOK_KEY`
   - Optional: `npx wrangler secret put KIT_WEBHOOK_SECRET` (the signing secret Kit shows for the webhook endpoint; when set, every delivery must carry a valid `X-Kit-Signature`)
6. Deploy: `npm run deploy`
7. Serve the API under the site: in `wrangler.toml`, uncomment the `routes` line for `theludarium.com/api/ludometer/*`, then `npm run deploy` again.
8. Check it: `https://theludarium.com/api/ludometer/health` should show `"public": false`.
9. Take the first snapshot without waiting for the cron:
   `curl -X POST -H "Authorization: Bearer $ADMIN_TOKEN" "https://theludarium.com/api/ludometer/admin/run?job=snapshot"`
10. Protect the admin page (next section).

To try it locally: `npx wrangler d1 migrations apply ludometer --local`, then `npx wrangler dev --test-scheduled`. Pass test tokens with `--var ADMIN_TOKEN:something`, and trigger a cron with `curl "http://localhost:8787/__scheduled?cron=0+9+*+*+1"`.

## The admin page and Cloudflare Access

The admin page is served at `/admin/` by the Worker. The site route only covers `/api/ludometer/*`, so reach the page on the Worker's own address, for example a custom domain such as `ludometer.theludarium.com` (Workers, Settings, Domains and Routes, Add custom domain) or the `workers.dev` address.

**Put `/admin/*` behind Cloudflare Access so only Levi can reach it.** In Cloudflare Zero Trust, add a self-hosted application for `ludometer.theludarium.com/admin/*` (and `/api/ludometer/admin/*` on the same host) with a policy that allows only Levi's email. If you keep the `workers.dev` address on, turn on Cloudflare Access for it too in the Worker's settings, or turn `workers.dev` off.

The page asks for the `ADMIN_TOKEN` and keeps it in that browser tab's sessionStorage only. The admin API checks the token on every call, so Access and the token protect it twice.

## Posting events

Send `POST /api/ludometer/events` with `Authorization: Bearer EVENTS_TOKEN` and JSON, one event or an array:

```json
[
  { "type": "page_view", "game_id": 13, "game_slug": "catan", "source": "site" },
  { "type": "play", "game_id": 13, "value": 1, "source": "app", "at": "2026-10-24T19:30:00Z" },
  { "type": "youtube_views", "game_slug": "catan", "value": 1840, "source": "youtube-job" }
]
```

- `type`: one of `play`, `shelf_add`, `like`, `course_signup`, `sheet_download`, `watch_signup`, `page_view`, `return_visit`, `youtube_views`, `table_seated`.
- `game_id` (the BGG id) or `game_slug` (the site's slug), or both. Send both whenever you can: an event with both teaches the Worker the slug, so slug-only events (Kit tags) count toward that game.
- `value` defaults to 1. Use it for counts, such as a day's YouTube views.
- `at` defaults to now. It must be within the last 400 days.
- `source` is a short label such as `site`, `app` or `youtube-job`. `meta` is an optional small object. Never put names or emails in it.

**Keep `EVENTS_TOKEN` off the browser.** The site is static, so anything in its JavaScript is public. Post from server code: the subscriber app's server, a scheduled job, or a small Cloudflare Pages Function on the site that forwards page views and adds the token. Batch where you can, for example one daily job that posts each game's page views as a single event with `value`.

## Kit webhook

Register this URL in Kit (Settings, Webhooks, or the API) for the **subscriber tag added** event:

```
https://theludarium.com/api/ludometer/kit-webhook?key=YOUR_KIT_WEBHOOK_KEY
```

Tags it records:

| Kit tag | Event |
| --- | --- |
| `course-<slug>` | `course_signup` |
| `tcg-<slug>` | `course_signup` |
| `watch-<slug>` | `watch_signup` |
| `sheet-<slug>` | `sheet_download` |

Other tags are ignored. The Worker stores the tag, Kit's event and subscriber ids, and the time. It never stores email addresses or names. Repeat deliveries of the same Kit event are skipped.

It accepts Kit's current delivery format (`{ "delivery_id", "events": [{ "id", "type": "subscriber.tag_added", "created", "data": { "subscriber", "tag": { "id", "name" } } }] }`) and the older v4 style (`subscriber.tag_add`, registered per tag). If a delivery does not name the tag, register one webhook per tag and add the tag to the URL: `...&tag=course-catan`.

## The weekly rhythm

| When (UTC) | What |
| --- | --- |
| Every day, 06:00 | Snapshot: BGG Hotness list, then BGG stats for those games and for games with events in the last 8 days, 20 per call, 5 seconds apart. Retries BGG's 202, 429 and 5xx with backoff; one failed batch never stops the rest. Running it twice in a day replaces that day's rows |
| Monday, 09:00 | Score the week that just ended (Monday to Sunday) and store the top 50 |
| Monday to Tuesday | On the admin page, load the week's movers and write a trigger (why it moved) and a verdict (our read) for the ones worth a note |
| Tuesday | Build the broadcast draft on the admin page, paste it into Kit, and publish (only after the BGG license, while the draft says "Do not send yet") |

The broadcast's "Why they moved" section uses watchlist rows with both a trigger and a verdict that were updated from the week's Monday through the Tuesday after it.

## Project layout

- `src/index.ts`: Worker entry point (fetch and cron handlers)
- `src/app.ts`: routes, auth, CORS, job dispatch
- `src/bgg.ts`: BGG URLs, polite fetching with retries, XML parsing
- `src/jobs.ts`: the daily snapshot and the Monday score
- `src/score.ts`: the scoring math, pure
- `src/events.ts`, `src/kit.ts`, `src/watchlist.ts`, `src/settings.ts`: input checks and mapping
- `src/views.ts`: response shapes and the broadcast draft
- `src/admin-page.ts`: the admin page
- `schema.sql`, `migrations/`: the D1 schema. Add changes as new numbered migration files and keep `schema.sql` in step
- `test/`: tests with synthetic BGG-shaped fixtures. Run `npm test` and `npm run typecheck`
