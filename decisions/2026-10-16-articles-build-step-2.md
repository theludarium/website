## 2026-10-16: Articles (build step 2)

- **Content collection** in `src/content.config.ts`, files in `src/content/articles/`. The schema enforces the CLAUDE.md frontmatter: description must be 150 to 160 characters, category must be one of the four, and `heroAlt` is required with `heroImage`. A mistake stops the build with a plain message instead of shipping.
- **MDX added** (`@astrojs/mdx`). Earns its place because articles will need components, starting with the affiliate link component.
- **Drafts:** hidden from production; shown with a Draft badge in local dev and on Cloudflare preview builds of any branch other than `main` (Cloudflare sets `CF_PAGES_BRANCH`). Draft pages also carry `noindex`. So Levi can review a draft at a preview link before publishing.
- **Article page:** reading time (230 words a minute), a table of contents when there are three or more sections (sticky beside the text on wide screens, a collapsible box on phones), tags, end-of-article newsletter signup, up to three related articles (same category first, then shared tags).
- **Metadata:** Open Graph `article` tags (published, modified, section, tags), Twitter card, and JSON-LD `Article` plus `BreadcrumbList`. Author is The Ludarium as an organization for now; a per-article author field can come later.
- **Articles index and category pages** share one list: category filter pills, the newest article featured large, then a grid. Articles without a hero image get a placeholder in their category tint with the hex mark.
- **Three sample articles** written as drafts (hosting, teaching, togethering) so the pages can be reviewed. They are starting points for Levi to edit and are not published until set to `draft: false`.
- **How-to for writers:** `docs/writing-articles.md`.
