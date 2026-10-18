# Card Catalog

Reference files for The Ludarium Card Catalog tool. Start with `docs/card-catalog/HANDOFF.md`.

- `prototype-artifact.html`: the working prototype, built for the Claude artifact runtime (live at https://claude.ai/artifact/6ChA98N3mMAc1xtNks5Mxx). It calls `window.claude.use()` for storage, identity, AI picks and downloads, so it does not run on its own here. Port its logic and UI into the site; do not serve this file.
- The 90 starter games moved to `src/data/card-catalogue.json` when the tool was ported to the site (2026-10-18). Classifications are a first draft for Levi to review.

The spec these follow is `docs/card-catalog/catalog-system.md`.
