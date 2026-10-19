## 2026-10-19: Domain live and launch batch

- **theludarium.com is live** on Cloudflare Pages: nameservers moved from NameHero to Cloudflare (the first save at NameHero never reached the registry; a re-save did), custom domain attached, HTTPS certificate issued, `www` 301-redirects to the apex with path and query kept (Bulk Redirect plus a proxied placeholder record).
- **Launch batch of 20 articles published** (Levi approved the list): evergreen, no unfilled EDITOR notes, nothing tied to dates, prices, releases, or local listings, spread across all six categories with Magic & Cube kept to 3. `pubDate` set to the launch day.
- **Links to unpublished articles render as plain text on the live site** (`src/plugins/rehype-unpublished-links.mjs`) and become links automatically when their target publishes. Previews keep them as links. This needs `@astrojs/markdown-remark`, Astro's official Markdown plugin package, because Astro 7's default processor does not run rehype plugins.
- **The build now fails on broken internal links** (`scripts/check-seo.mjs`), so a published page cannot point at a missing page or file.
- **Retired two early sample drafts** that duplicated library articles ("How to Host a Game Night People Talk About for Weeks" and "What Is Togethering?").
