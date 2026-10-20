## 2026-10-18: Content library import (from claude.ai chat sessions)

- **339 articles added as drafts** in `src/content/articles/`, written and source-checked in chat. Nothing goes live until an article is set to `draft: false`. Notes on what was converted and why: `docs/content-library/README.md`.
- **Two new categories** in `src/lib/site.ts`: Game Design and Magic & Cube. The library had 22 categories; folding 340 articles into the original four would have made Game Guides and Game Culture unusable, and Cube is its own audience (130 articles, Cube Commonwealth). The original category is kept as a tag on each article.
- **Skipped one duplicate:** the library's "How to Teach a Board Game in Five Minutes" had the same title and topic as the site's existing article; the site's version stays.
- **SEO check now fails on unfilled `<!-- EDITOR: ... -->` notes** on published pages, and warns on leftover `AFFILIATE` markers, so placeholder text cannot ship.
- **Built and checked in a copy of this branch:** preview build passes (drafts shown); a build with every article published passes the SEO check except for the 59 articles that still have EDITOR notes, which is the guard working.
- **Out of scope still:** the library also includes a shared events calendar and a community page template (in `docs/content-library/`). CLAUDE.md lists a public events calendar as Phase 2, so they are reference only.
