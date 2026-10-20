## 2026-10-18: Card Catalogue on the site

- **Local-first, Levi's choice** over accounts now or leaving it as a Claude artifact. Everything a visitor records stays in their browser (localStorage), with backup download, restore, and CSV export. Keeps the "no accounts, no database" rule; sync can come later.
- **Group picks without accounts:** friends trade a table code (their feel profile and game lists, never notes or ratings), and guests can be added by hand.
- **Ported faithfully:** the engine (`src/lib/card-catalogue/engine.ts`) implements the spec exactly and is tested against the full 90-game catalog: profile weights, centered fit with Table Talk at 1.5 times, hard rules, geometric-mean group fit, Discovery picks, logged play times.
- **Readable without JavaScript:** all 90 cards are in the page HTML, so search engines index them; the script turns the page into the app.
- **Name:** "The Card Catalogue" in the UI and URL, per Levi. Docs from the chat session keep "Card Catalog."
- **Article published** with its claims made accurate: no community-vote data yet (that needs BoardGameGeek's commercial license), play logs stay on each device, and the call to action points to the free app.
- **Tuning note for Levi:** with the spec's math, a game that misses only on Table Talk can still fit about 85%. If Table Talk should matter more, raise its weight above 1.5.
- **Not yet:** the AI Librarian (needs a paid server-side Claude call) and BoardGameGeek import (waits on the token and commercial license).
