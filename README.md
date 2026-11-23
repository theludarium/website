# The Ludarium

The website for The Ludarium, at theludarium.com. See `CLAUDE.md` for the full brief and `DECISIONS.md` for choices made along the way.

## Run it locally

Requires Node 22.22 or newer.

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # outputs to dist/
npm run check    # type check
```

## Where We Play

A tool for the Cube Commonwealth: members share where they live at `/cube-commonwealth/where-we-play/`, Levi keeps a vetted list of venues, and the app ranks venues by car drive time for the group. Member page, thanks and edit pages, and the admin page are static Astro pages; everything dynamic is a Pages Function under `functions/api/where-we-play/` backed by D1. The math is in `src/lib/where-we-play/engine.ts`, the server code in `src/server/where-we-play/`. Why it is built this way: `DECISIONS.md`, "Where We Play".

### One-time setup

Run these from the repo root. Nothing here is automated on purpose.

1. **Create the database** and paste the printed `database_id` into `wrangler.toml` (local dev only; production binds through the dashboard):

   ```bash
   npx wrangler d1 create ludarium-site
   ```

2. **Create the tables** on Cloudflare:

   ```bash
   npm run db:migrate
   ```

3. **Bind the database to the Pages project.** Cloudflare dashboard: Workers & Pages > theludarium > Settings > Bindings > Add > D1 database. Variable name `DB`, database `ludarium-site`. Do it for Production and Preview.

4. **Set the Pages variables and secrets.** Settings > Variables and Secrets. `TURNSTILE_SECRET_KEY` is already there for the inquiry form and is reused. Add:

   | Name | Type | Environment | Value |
   | --- | --- | --- | --- |
   | `ACCESS_TEAM_DOMAIN` | text | Production | your Access team name, the part before `.cloudflareaccess.com` |
   | `ACCESS_AUD` | text | Production | the Application Audience (AUD) tag from the Access application in step 5 |
   | `WWP_ADMIN_PREVIEW_TOKEN` | secret | Preview only | any long random string, for example `openssl rand -hex 24`. Never set it for Production |
   | `WWP_HASH_SALT` | secret | both | optional, any random string, for the rate limiter's hashed IPs |

5. **Guard the admin paths with Cloudflare Access.** Zero Trust > Access > Applications > Add an application > Self-hosted. Name "Where We Play admin". Add two public hostnames, both on `theludarium.com`: path `cube-commonwealth/where-we-play/admin` and path `api/where-we-play/admin`. Policy: Allow, include Emails, your address. Save, then copy the application's Audience (AUD) tag from its Overview into `ACCESS_AUD`. Access adds a signed token to every request it lets through; the admin routes verify it and refuse anything without it.

6. Redeploy (push to `main`, or Retry deployment) so the binding and variables take effect.

### Run it locally

```bash
cp .dev.vars.example .dev.vars
```

```bash
npm run db:migrate:local
```

```bash
npm run wwp:seed
```

```bash
npm run build && npm run dev:functions   # site plus functions at http://localhost:8788
```

Open http://localhost:8788/cube-commonwealth/where-we-play/ for the member page and http://localhost:8788/cube-commonwealth/where-we-play/admin/ for the admin page, which asks for the token in `.dev.vars` (`local-admin` by default). The seed adds twelve sample members across the north side, five sample venues, one suggestion in the queue and one event, with straight-line drive times; "Retry OSRM" on the admin page replaces them with routed times. `npm run wwp:seed -- --clear` empties the local tables. The seed script can only touch the local database.

Where We Play sends no email. After submitting, the member's private edit link shows once on the thanks page (the token rides in the URL fragment, which never reaches a server). A second submission with the same email is turned away. A member who loses the link asks the admin, whose "New link" button makes a fresh one to copy and pass on by hand.

## Events calendar

The Cube Commonwealth events calendar: a month view where each day opens as a 3D Cube, "I'm going" by name with no account, and a ranked-choice vote on which Cube to draft. Visitors can suggest events, and each one waits until Levi approves it. The spec is `docs/calendar/SPEC.md`. Why it is built this way: `DECISIONS.md`, "Events calendar".

| Path | What it is |
| --- | --- |
| `/cube-commonwealth/events/` | The calendar |
| `/cube-commonwealth/events/suggest/` | The form for suggesting an event |
| `/cube-commonwealth/where-we-play/admin/calendar/` | Levi's page: add, edit, approve, cancel, and delete events. It sits behind the same Cloudflare Access policy as the Where We Play admin page |

The pages are static. Everything dynamic is a Pages Function under `functions/api/events/` (public) or `functions/api/where-we-play/admin/calendar/` (admin), backed by D1 tables prefixed `cal_`. The shared rules are in `src/lib/calendar/`, the server code in `src/server/calendar/`, and the browser scripts in `src/scripts/calendar*.ts`.

### Database

Two migration files, applied by hand, in this order, and only after Levi says yes:

```bash
npx wrangler d1 execute ludarium-site --remote --file migrations/0008_calendar.sql
```

```bash
npx wrangler d1 execute ludarium-site --remote --file migrations/0009_calendar_samples.sql
```

Preview addresses (`*.pages.dev`) share this database and use an always-pass human check, so the calendar's public write routes refuse them: on a preview you can look, but not sign up or suggest. `0008` creates the tables. `0009` adds the sample events. `npm run db:migrate` is not used here: it runs every migration file Wrangler has no record of, and files applied by hand leave no record. For a local database, swap `--remote` for `--local`, or run `npm run db:migrate:local` on a fresh one, which applies every file.

### Sample events

`0009` fills 2026-11-01 through 2027-01-31 with placeholder events, at least two a day, so a full month can be seen before real events exist. Every one is flagged `is_sample`, and the public calendar leaves them out. To see them, add `?samples=1`: `/cube-commonwealth/events/?samples=1`.

- **Remove them:** "Delete all sample events" on the admin page. Their sample attendees, suggested Cubes, and ballots go with them.
- **Change them:** edit `scripts/calendar-samples.ts`, then write the file again with the command below. The dates are set at the top of the script (`FIRST`, `LAST`, and `TODAY`, which the four sample votes are counted from), so moving the samples to other months means changing those and the same dates in `tests/calendar/samples.test.ts`. The output is the same on every run until the script changes. Running `0009` a second time is safe, because it clears the old samples first.

```bash
node scripts/calendar-samples.ts
```

### Tests

```bash
node --test 'tests/calendar/*.test.ts'
```

They run against real SQL: Node's built-in SQLite, loaded with the same migration files as production. `npm test` runs them with the rest.

## Form notices

The corporate inquiry form and the Guild capstone form email each submission to the site owner. Pages Functions cannot send email, so they call a small Worker, `ludarium-notify` (`workers/notify/`), through the `NOTIFY` service binding. The Worker sends through Cloudflare Email Routing, which only delivers to verified destination addresses, so it can only ever reach the owner's inbox. It has no public URL.

```bash
npx wrangler deploy -c workers/notify/wrangler.toml
```

```bash
npx wrangler secret put NOTIFY_TO -c workers/notify/wrangler.toml
```

`NOTIFY_TO` is a destination address verified under Email Routing; it is a secret only to keep it out of this public repo. Then bind the Worker to the Pages project as `NOTIFY` (Settings > Bindings > Service binding) for Production and Preview. Locally, without the binding, both forms answer "not working right now".

### Tests

```bash
npm test
```

Covers the engine: distances, the straight-line fallback, median and percentile, histograms, rankings and the slot filter, and the public point rule.
