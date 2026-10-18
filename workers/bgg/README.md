# The Ludarium × BoardGameGeek

A small Cloudflare Worker that connects theludarium.com to the BoardGameGeek XML API. It lets subscribers import their BGG collection, ratings and plays into the Ludarium Card Catalog. It also turns BGG facts into suggested catalog cards that staff confirm.

Your BGG token stays on the server. All BGG calls pass through one queue that spaces them at least 2 seconds apart, retries politely, and caches results.

## What it serves

All routes are `GET` and return JSON. Every BGG response is wrapped with its source and the attribution the site must show.

| Route | What it returns | Cached for |
| --- | --- | --- |
| `/api/bgg/collection?username=NAME` | Base games in a user's BGG collection, with their rating, play count, and own / wishlist / want-to-play flags | 12 hours |
| `/api/bgg/plays?username=NAME&page=N` | One page (100) of logged plays: date, length, players, winners, comments. `hasMore` says if another page exists | 6 hours |
| `/api/bgg/things?ids=1,2,3` | Game details: players, time, age, designers, mechanics, categories, rank, weight, and the community polls for best player count, suggested age and language dependence. Up to 100 ids, fetched 20 at a time | 7 days |
| `/api/bgg/search?q=TEXT&exact=1` | Games matching a name, for linking catalog cards to BGG ids | 1 day |
| `/api/catalog/suggest?ids=1,2,3` | For each game, the BGG record plus a Ludarium suggestion: shelf and subsection with the reason, feel levels it can infer, best and recommended player counts, suggested age, language level and occasions | 7 days (game data) |
| `/api/health` | Whether the token is set. Makes no BGG call | Not cached |

Errors come back as `{ "error": "…" }` with a fitting status. A collection BGG is still preparing returns `202` with a `Retry-After` header. The example client waits and retries for you.

## How BGG data maps to the Ludarium Catalog

The suggestion is a starting point. Staff confirm every card before it's filed.

- **Best player counts** come from BGG's community poll. A count is "best" when Best votes lead, and "recommended" when Best plus Recommended outvote Not Recommended. Counts with fewer than 5 votes are ignored.
- **Learning** comes from BGG weight: under 1.8 is Intuitive, under 2.8 Moderate, otherwise Heavy. It needs at least 10 weight votes.
- **Shelf** comes from mechanics and categories, using ordered rules that follow the catalog's principle: shelve by the main activity. For example, Communication Limits plus Cooperative goes to 220, Tableau Building to 520, Trick-taking to 310.
- **Interaction, Chance, Theme and Tempo** are filled only when the mechanics give a strong signal. Otherwise they're left blank for staff.
- **Table Talk is never derived.** It's always filed by The Ludarium. That's the part of the catalog only you have.
- **Ratings:** a subscriber's BGG rating maps to profile stars as 9–10 → 5, 8 → 4, 6–7 → 3, 4–5 → 2, 1–3 → 1. Their original BGG rating is kept alongside, unchanged.

## Deploy

You need a Cloudflare account (the one for theludarium.com) and Node 18 or newer.

1. Install: `npm install`
2. Sign in to Cloudflare: `npx wrangler login`
3. Add your BGG token as a secret, never in a file: `npx wrangler secret put BGG_TOKEN`
4. Deploy: `npm run deploy`
5. Serve it under the site. In `wrangler.toml`, uncomment the `routes` line so it answers at `theludarium.com/api/*`, then deploy again.
6. Check it: open `https://theludarium.com/api/health`. You should see `"tokenConfigured": true`.

To try it locally: `npx wrangler dev --var BGG_TOKEN:your-token`.

`ALLOWED_ORIGINS` in `wrangler.toml` lists the sites allowed to call the Worker from a browser. Add a preview URL there while testing.

## BGG rules this follows, and what's left for you

| Rule | How it's handled |
| --- | --- |
| Token in an `Authorization: Bearer` header, on `boardgamegeek.com` without `www` | Done in `src/gate.ts` |
| Call from your servers, cache, keep requests low | All calls are server-side, cached in the Durable Object's database, and spaced 2 seconds apart |
| Don't modify BGG data | BGG values pass through unchanged. Ludarium suggestions live in a separate `suggestion` object |
| Show the "Powered by BGG" logo, linked to BoardGameGeek, wherever BGG data appears | **Your site must do this.** Every response includes the attribution text and links |
| No AI or LLM training on BGG data | Nothing here trains a model. Confirm in writing whether showing BGG facts to the Librarian at pick time is allowed |
| Commercial use needs a commercial license | **Get this before BGG data appears beside affiliate links, paid features or memberships** |
| Per-visitor limits | `RATE_LIMITER` allows 30 requests a minute per IP, so the public endpoint can't drain your BGG allowance |

## Project layout

- `src/index.ts`: routes, input checks, CORS, response wrapping
- `src/gate.ts`: the Durable Object queue: spacing, retries, cache
- `src/bgg.ts`: BGG URLs and XML parsing
- `src/mapping.ts`: BGG facts to Ludarium suggestions
- `examples/import-to-ludarium.js`: browser code that turns an import into catalog records
- `test/`: tests against synthetic BGG-shaped fixtures (`npm test`)

## Next steps

1. Link the 90 catalog cards to BGG ids with `/api/bgg/search?exact=1`, then confirm the matches by hand.
2. Show BGG's best player counts on each card, labeled as BGG's, next to your own Table Talk and feel ratings.
3. Add an "Import from BoardGameGeek" button to the catalog on theludarium.com using the example client.
