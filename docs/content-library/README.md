# Content library (imported 2026-10-18)

339 articles written in claude.ai chat sessions, imported into `src/content/articles/` as drafts.

## What was imported and how
- Every article is `draft: true`. Drafts show on preview builds with a Draft badge and never reach the live site. Publish one by setting `draft: false`.
- Front matter was converted to this site's schema by `import/convert.py`: `title` (the SEO title), `description` (150 to 160 characters; 156 were rewritten to fit, see `import/descriptions.json`), `pubDate: 2026-10-18`, `category`, `tags`, `draft`.
- The library's 22 categories were folded into six site categories (two new ones added in `src/lib/site.ts`): Game Guides 69, Game Night 40, Togethering 50, Game Culture 30, Game Design 20, Magic & Cube 130. The original category name is kept as the last tag on every article, so it still feeds related articles.
- Body H1s were removed (the page renders the title as the h1). Em dashes were replaced. Internal links were rewritten to `/articles/<slug>/` and `/articles/category/<slug>/`; none are broken.
- Skipped: the library's "How to Teach a Board Game in Five Minutes" duplicated the site's existing article (same title and topic), so the site's original stays.
- `index.csv` and the briefs reference the library's original slugs and folder names; the article slugs are unchanged except the one skipped above.

## Markers left in the articles
- `<!-- EDITOR: ... -->` (in 59 articles): facts only Levi can supply, mostly Cube Commonwealth's night, venue, cube list, house rules and history, plus building-in-public details. `scripts/check-seo.mjs` now fails a production build if a published page still has one, so they cannot ship by accident. Fill the Cube Commonwealth primer (`cube-commonwealth-primer`) and history (`cube-commonwealth-cube-history`) first; most other Cube notes repeat those facts.
- `<!-- AFFILIATE -->` (in 110 articles): where an affiliate link belongs after a product's first mention. To use them, convert the file to `.mdx` and wrap the product name in `AffiliateLink` (see `docs/writing-articles.md`). The SEO check warns while they remain on a published page.

## Reference material in this folder
- `hubs/`: 21 category hub pages written for the library. The site builds its own category pages, so these are not routed; their lead text is useful for category intros or a future Cube Commonwealth page.
- `newsletter/welcome-sequence.md`: five onboarding emails, a weekly issue template, and ten subject lines for Kit.
- `calendar/`: the shared events calendar (a working claude.ai artifact) and `CALENDAR-SPEC.md`. CLAUDE.md lists a public events calendar as out of scope for now; this is here for when that changes.
- `communities/TEMPLATE.md`: a page template for `/communities/<slug>`, with Cube Commonwealth as the first.
- `BRIEF.md`, `WRITER3.md`, `WRITER5.md`, `SOURCING.md`, `ARTICLES*.md`, `check.py`: the writing brief, slug tables, sourcing rules and checker used to produce the library, for future batches.
