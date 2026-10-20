## 2026-10-17: Card Catalog (from a Claude chat session)

- **New tool: The Ludarium Card Catalog.** Built on Tabletop Library's classification and recommender write-up, with our improvements: a sixth feel dimension (Table Talk), best player counts, real play times from logs, togethering outcomes (play again, how loud the table was), Discovery picks, and occasion tags. Full summary in `docs/card-catalog/HANDOFF.md`.
- **Prototype first as a Claude artifact,** then port to the site. Levi's choice. The prototype is the behavior reference; it is not served from this repo.
- **Group picks use a geometric mean** of each player's fit, after hard rules in code (player count, time, vetoes, a teacher for heavy games). Table Talk weighs 1.5 times the other dimensions.
- **Article** "How We Catalog Board Games by How They Feel" added as a draft. It credits Tabletop Library and introduces our system.
- **BoardGameGeek bridge** built as a separate Worker in `workers/bgg/`: server-side token, one queue spacing calls 2 seconds apart, cached results, BGG values never edited, attribution on every response. Not deployed; waiting on Levi's BGG token and commercial license.
- **Root `tsconfig.json` excludes `workers/`** so `astro check` does not type-check the Worker, which has its own config.
- **Open:** how to host per-user tracking without breaking the "no accounts" rule. Options are in the handoff; ask Levi before choosing.
