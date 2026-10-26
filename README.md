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

4. **Set the Pages variables and secrets.** Settings > Variables and Secrets. `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY` and `INQUIRY_FROM` are already there for the inquiry form and are reused. Add:

   | Name | Type | Environment | Value |
   | --- | --- | --- | --- |
   | `ACCESS_TEAM_DOMAIN` | text | Production | your Access team name, the part before `.cloudflareaccess.com` |
   | `ACCESS_AUD` | text | Production | the Application Audience (AUD) tag from the Access application in step 5 |
   | `WWP_ADMIN_PREVIEW_TOKEN` | secret | Preview only | any long random string, for example `openssl rand -hex 24`. Never set it for Production |
   | `WWP_HASH_SALT` | secret | both | optional, any random string, for the rate limiter's hashed IPs |

5. **Guard the admin paths with Cloudflare Access.** Zero Trust > Access > Applications > Add an application > Self-hosted. Name "Where We Play admin". Add two public hostnames, both on `theludarium.com`: path `cube-commonwealth/where-we-play/admin` and path `api/where-we-play/admin`. Policy: Allow, include Emails, your address. Save, then copy the application's Audience (AUD) tag from its Overview into `ACCESS_AUD`. Access adds a signed token to every request it lets through; the admin routes verify it and refuse anything without it.

6. **Resend.** Confirmation emails go to members, so the sending domain matters: `onboarding@resend.dev` only delivers to the Resend account's own address. Verify `theludarium.com` in Resend and set `INQUIRY_FROM` to something like `The Ludarium <hello@theludarium.com>` before sharing the form.

7. Redeploy (push to `main`, or Retry deployment) so the binding and variables take effect.

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

Without `RESEND_API_KEY` in `.dev.vars`, confirmation emails are printed to the terminal instead of sent, edit link included.

### Tests

```bash
npm test
```

Covers the engine: distances, the straight-line fallback, median and percentile, histograms, rankings and the slot filter, and the public point rule.
