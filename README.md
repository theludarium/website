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

## Visiting companies

A first-party tracker that notes which companies view the corporate events pages, so Levi can reach their HR and L&D leaders. It runs entirely on Cloudflare: a Pages middleware logs each view, a D1 database stores it, and a small Worker emails a ranked digest every Monday. Nothing runs in the visitor's browser, and no IP address is ever stored, only a salted hash.

How it works, in one breath: the middleware in `functions/corporate-events/_middleware.ts` serves the page, then (after the response is sent) skips bots, prefetches and Levi's own IPs, hashes the IP, asks the cache, and on a miss combines Cloudflare's network data with one IPinfo Lite call to learn who owns the network. `src/server/visitors/classify.ts` drops ISPs, carriers, clouds and VPNs. What is left becomes a row in `companies`. `workers/visitors-digest` ranks the week's companies (visits, pages, recency, Indiana first) and sends the email through Resend.

### One-time setup

Run these from the repo root unless noted. Nothing here is automated on purpose.

1. **Create the database** and paste the printed `database_id` into both `wrangler.toml` and `workers/visitors-digest/wrangler.toml`:

   ```bash
   npx wrangler d1 create ludarium-visitors
   ```

2. **Create the tables** on Cloudflare:

   ```bash
   npm run db:migrate
   ```

3. **Bind the database to the Pages project.** In the Cloudflare dashboard: Workers & Pages > theludarium > Settings > Bindings > Add > D1 database. Variable name `DB`, database `ludarium-visitors`. (We bind through the dashboard rather than `wrangler.toml` so the existing dashboard variables and secrets stay editable; see DECISIONS.md.)

4. **Set the Pages variables and secrets.** Settings > Variables and Secrets, for Production (and Preview if you want previews to log):

   | Name | Type | Value |
   | --- | --- | --- |
   | `IPINFO_TOKEN` | secret | token from https://ipinfo.io/account/token (the free Lite plan is enough) |
   | `VISITOR_HASH_SALT` | secret | any long random string, for example `openssl rand -hex 32`. Never change it casually: old and new visits would stop matching |
   | `VISITOR_IGNORE_IPS` | text | your own IPs, separated by commas or spaces |
   | `IPINFO_PLAN` | text | optional, `lite` (default) or `core` |

   Then redeploy (push to `main`, or Retry deployment in the dashboard) so the binding and variables take effect.

5. **Deploy the digest Worker** from its folder:

   ```bash
   cd workers/visitors-digest && npm install
   ```

   ```bash
   cd workers/visitors-digest && npx wrangler secret put RESEND_API_KEY
   ```

   ```bash
   cd workers/visitors-digest && npx wrangler secret put DIGEST_TO
   ```

   ```bash
   cd workers/visitors-digest && npm run deploy
   ```

   The first `wrangler` command asks you to log in. `DIGEST_TO` is the address the Monday email goes to. `RESEND_API_KEY` is the same key the inquiry form uses.

### Run it locally

```bash
cp .dev.vars.example .dev.vars   # then fill in the values
```

```bash
npm run db:migrate:local
```

```bash
npm run build && npm run dev:functions   # site plus middleware at http://localhost:8788
```

Open http://localhost:8788/corporate-events/ a few times. With `VISITOR_TEST_IP` set in `.dev.vars`, every request is treated as coming from that IP, which is the easy way to try a real company's network. Then look at what was logged:

```bash
npx wrangler d1 execute ludarium-visitors --local --command "SELECT at, path, city, company_id FROM visits ORDER BY at DESC LIMIT 10"
```

```bash
npx wrangler d1 execute ludarium-visitors --local --command "SELECT org, domain, keep, reason FROM ip_cache"
```

To preview the Monday email without sending it, in a second terminal:

```bash
cd workers/visitors-digest && npm run dev   # then open http://localhost:8787/
```

The Worker's dev script points at the same local database as the site (`--persist-to ../../.wrangler/state`).

### Tests

```bash
npm test
```

Runs sample networks (a company with its own network, a Comcast home connection, an AWS range, a university, a phone carrier) through the filters, plus the scoring and the email text.

### Changing what is tracked

- Pages: `TRACKED_PATHS` in `src/server/visitors/config.ts`. A page outside `/corporate-events/` also needs a one-line `_middleware.ts` in the matching `functions/` folder, so that only those paths invoke a function.
- Region: `TARGET_REGION` in the same file.
- Provider names to drop: the lists at the top of `src/server/visitors/classify.ts`.
- Upgrade to IPinfo Core: set `IPINFO_PLAN=core`. The code then reads IPinfo's `type` field and hosting, VPN and mobile flags, and the name lists become a backstop.
