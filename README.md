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

## Visiting companies

A first-party tracker that notes which companies view the corporate events pages, so Levi can reach their HR and L&D leaders. It runs entirely on Cloudflare: a Pages middleware logs each view, the site's D1 database stores it, and a small Worker emails a ranked digest every Monday. Nothing runs in the visitor's browser, and no IP address is ever stored, only a salted hash.

How it works, in one breath: the middleware in `functions/corporate-events/_middleware.ts` serves the page, then (after the response is sent) skips bots, prefetches and Levi's own IPs, hashes the IP, asks the cache, and on a miss combines Cloudflare's network data with one IPinfo Lite call to learn who owns the network. `src/server/visitors/classify.ts` drops ISPs, carriers, clouds and VPNs. What is left becomes a row in `vc_companies`. `workers/visitors-digest` ranks the week's companies (visits, pages, recency, Indiana first) and sends the email through the `ludarium-notify` Worker described under "Form notices".

The tracker shares the `ludarium-site` database and its `DB` binding with Where We Play; its tables are prefixed `vc_`. If that database and binding already exist (see "Where We Play"), steps 1 and 2 below are just the migration.

### One-time setup

Run these from the repo root. Nothing here is automated on purpose.

1. **Create the tables** on Cloudflare (the database itself comes from the Where We Play setup):

   ```bash
   npm run db:migrate
   ```

2. **Confirm the `DB` binding** on the Pages project: Workers & Pages > theludarium > Settings > Bindings, D1 database `ludarium-site` as `DB`, for Production and Preview.

3. **Set the Pages variables and secrets.** Settings > Variables and Secrets, for Production (and Preview if you want previews to log):

   | Name | Type | Value |
   | --- | --- | --- |
   | `IPINFO_TOKEN` | secret | token from https://ipinfo.io/account/token (the free Lite plan is enough) |
   | `VISITOR_HASH_SALT` | secret | any long random string, for example `openssl rand -hex 32`. Never change it casually: old and new visits would stop matching |
   | `VISITOR_IGNORE_IPS` | text | your own IPs, separated by commas or spaces |
   | `IPINFO_PLAN` | text | optional, `lite` (default) or `core` |

   Then redeploy (push to `main`, or Retry deployment in the dashboard) so the variables take effect.

4. **Deploy the digest Worker.** It needs `ludarium-notify` deployed first (see "Form notices"); the digest reaches it through a service binding, so there are no secrets to set here:

   ```bash
   npx wrangler deploy -c workers/visitors-digest/wrangler.toml
   ```

   The email goes to the notify Worker's `NOTIFY_TO` address.

### Run it locally

```bash
cp .dev.vars.example .dev.vars   # then fill in the visiting-companies values
```

```bash
npm run db:migrate:local
```

```bash
npm run build && npm run dev:functions   # site plus middleware at http://localhost:8788
```

Open http://localhost:8788/corporate-events/ a few times. With `VISITOR_TEST_IP` set in `.dev.vars`, every request is treated as coming from that IP, which is the easy way to try a real company's network. Then look at what was logged:

```bash
npx wrangler d1 execute ludarium-site --local --command "SELECT at, path, city, company_id FROM vc_visits ORDER BY at DESC LIMIT 10"
```

```bash
npx wrangler d1 execute ludarium-site --local --command "SELECT org, domain, keep, reason FROM vc_ip_cache"
```

To preview the Monday email without sending it, in a second terminal:

```bash
cd workers/visitors-digest && npm install && npm run dev   # then open http://localhost:8787/
```

The Worker's dev script points at the same local database as the site (`--persist-to ../../.wrangler/state`).

### Tests

`npm test` runs sample networks (a company with its own network, a Comcast home connection, an AWS range, a university, a phone carrier) through the filters, plus the scoring and the email text, alongside the site's other tests.

### Changing what is tracked

- Pages: `TRACKED_PATHS` in `src/server/visitors/config.ts`. A page outside `/corporate-events/` also needs a one-line `_middleware.ts` in the matching `functions/` folder, so that only those paths invoke a function.
- Region: `TARGET_REGION` in the same file.
- Provider names to drop: the lists at the top of `src/server/visitors/classify.ts`.
- Upgrade to IPinfo Core: set `IPINFO_PLAN=core`. The code then reads IPinfo's `type` field and hosting, VPN and mobile flags, and the name lists become a backstop.
