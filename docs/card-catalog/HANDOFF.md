# Card Catalog: handoff from the Claude chat session (2026-10-17)

Levi worked on this in a Claude chat session on 2026-10-17 and asked for it to be added to this repo so Claude Code can carry it forward. This file is the summary of that conversation: what was decided, what was built, where it lives, and what is still open. Nothing here is wired into the site yet.

## What it is

**The Ludarium Card Catalog** is a library-style system for board games plus an app built on it. Subscribers track the games they play and like, build a "Play Profile," and get game picks for a whole table. It is a new game tool for `/play/`, alongside RPG Demo Library and Game Night Madness.

It started from Tabletop Library's article [Making a Better Board Game Recommender](https://www.tabletoplibrary.com/news/making-a-better-board-game-recommender) (Berkeley game club, July 2026). Levi asked for an app on that system, an article about it, and improvements. The full system spec is in `docs/card-catalog/catalog-system.md`.

## Decisions Levi made in the session

- **Prototype first, as a shareable Claude artifact,** then port to theludarium.com. The prototype is live and is the reference for the port.
- **The article introduces The Ludarium's own improved system,** crediting Tabletop Library as the starting point. It is not an explainer of theirs.
- **Group picks:** yes. Built into the prototype as the Game night tab.
- **Keep building it out for tabletop gamers:** collection, richer play logs, stats, the AI Librarian, a bigger catalog. All built.
- **BoardGameGeek data:** Levi built a BGG app and filed a developer application. It was filed as **non-commercial**. He is now working on getting a **commercial license**, because The Ludarium has affiliate links, products and future memberships. Until that is approved, keep BGG data off pages with affiliate links or paid features.
- **Build the BGG connection now** so it is ready when the token arrives. Built as `workers/bgg/`.

## What was built

| Piece | Where | State |
| --- | --- | --- |
| Catalog system spec | `docs/card-catalog/catalog-system.md` | Final for v1 |
| Article: "How We Catalog Board Games by How They Feel" | `src/content/articles/how-we-catalog-board-games-by-how-they-feel.md` | Draft (`draft: true`). Also lives as a Claude doc: https://claude.ai/code/artifact/e861158c-097f-4b1b-af5a-2aa2be26bafd |
| Card Catalog prototype | `tools/card-catalog/prototype-artifact.html`, live at https://claude.ai/artifact/6ChA98N3mMAc1xtNks5Mxx | Working prototype, version 3 |
| Starter catalog, 90 games | `tools/card-catalog/catalog-seed.json` | First-draft classifications by Claude; Levi should skim them |
| BGG Worker | `workers/bgg/` | Built and tested against synthetic fixtures; not deployed; no token yet |

### The prototype (reference implementation)

One HTML file built for the Claude artifact runtime. It uses `window.claude.use()` for storage (`db`), viewer identity (`user`), AI picks (`sample`) and file export (`downloads`). **It does not run on its own on theludarium.com.** Treat it as the spec for behavior and UI, and port the logic.

Tabs and features:
- **Catalog:** 10 shelves as drawer tabs, search, occasion chips, best-player-count filter, sort by call number, your fit, or shortest. Each index card shows the call number, players, box time, a "% your fit" pill, and six punched holes for the feel dimensions. Users can file their own game card.
- **Game night:** pick who is at the table (you, friends who shared their profile, and guests without accounts), player count, time limit, occasion, and "only games someone here owns." Shows 5 picks plus a Discovery pick with per-player fit bars. **Ask the Librarian:** a mood box; Claude ranks up to 5 games from the top 24 that already pass the rules, with a one-line reason each, and the code validates the answer.
- **Log:** game, date, players, minutes, someone learning, rating, result (won, lost, co-op won or lost, no winner), played with, play again, how loud the table was, note.
- **Shelf:** Played, Collection, Can teach, Want to learn, Not for me.
- **Profile:** plays, hours together, shelves visited, would-play-again rate, the feel profile, picks, "Your table" stats (played with most, most played, weekly streak, win rates), shelves bar chart, CSV export.

Data model in the prototype (per user, private): `game` docs `{slug, rating, own, teach, learn, veto, custom?}`, `play` docs `{slug, date, players, minutes, taught, result, with[], again, energy, note}`, `guest` docs `{name, prefs{dim: level}}`, `settings {share}`. Shared: `catalog/<slug>` (admin-write), and `profiles/<uid>` opt-in digests `{pref, n, veto[], teach[], learn[], owned[], played[]}`.

### The BGG Worker

A Cloudflare Worker with a Durable Object that queues every BGG call 2 seconds apart, retries 202/429/5xx, and caches in SQLite. Routes: collection, plays, things (details plus community polls), search, and catalog suggestions. The token is a Worker secret. `examples/import-to-ludarium.js` turns an import into catalog records. Full details and the compliance checklist are in `workers/bgg/README.md`. Run `npm install && npm test` inside `workers/bgg/`.

## Conflicts with CLAUDE.md to resolve with Levi

These came out of the chat and need a decision before porting. Ask Levi; do not decide alone.

1. **Accounts and a database.** CLAUDE.md says no database or user accounts, and puts accounts in Phase 2. The catalog's per-user tracking needs both. Options: (a) keep the tracker as a Claude artifact for now and link to it from `/play/`; (b) a local-first web version (browser storage, CSV and BGG import, no accounts), with sync later; (c) bring accounts forward with Cloudflare D1 plus an auth provider. (b) fits the current rules best.
2. **Worker vs Pages Functions.** The site uses a Pages Function for the inquiry form. The BGG bridge is a separate Worker because it needs a Durable Object for the shared request queue. It can run on a route such as `theludarium.com/api/bgg/*` next to the Pages project.
3. **Brand.** The prototype uses its own card-catalog palette and fonts (navy ink, red rule, gold tabs, Bricolage Grotesque). The port should use the site's tokens: Walnut, Parchment, Felt Green, Lamplight, Stone, and Fraunces.
4. **The article's call to action** says the catalog is "open to subscribers." Make that true at launch or reword it.

## Suggested next steps

1. Levi skims the 90 game classifications in `catalog-seed.json` (feel levels and best player counts).
2. Decide conflict 1, then build `/card-catalog/` (or `/play/card-catalog/`) in site style from the prototype.
3. Publish the article when the tool is reachable; cross-link it from `/play/`.
4. When the BGG token arrives: deploy `workers/bgg`, link catalog cards to BGG ids with `/api/bgg/search?exact=1`, show BGG's best player counts labeled as BGG's, add "Import from BoardGameGeek," and show the "Powered by BGG" logo linked to BoardGameGeek wherever BGG data appears.
5. Idea from the session not built yet: a "Rate after play" reminder the day after a game night, so profiles fill in faster.

## BGG rules that apply (from boardgamegeek.com, checked 2026-10-17)

- Register an application; every request needs `Authorization: Bearer <token>` on `boardgamegeek.com` (no `www`).
- Call from servers, cache, keep requests low; no published rate limit (about 1 request per 2 seconds is the community norm).
- The free license is non-commercial only. Commercial use needs a commercial license.
- Do not modify BGG data. Do not use it to train AI or LLM systems. Get BGG's written OK for showing BGG facts to the Librarian at pick time.
- Public pages using BGG data show the "Powered by BGG" logo linked to BoardGameGeek.

Sources: [Using the XML API](https://boardgamegeek.com/using_the_xml_api), [XML API Terms of Use](https://boardgamegeek.com/wiki/page/XML_API_Terms_of_Use).
