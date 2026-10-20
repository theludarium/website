## 2026-10-17: SEO baseline (build step 5)

- **Sitemap** via `@astrojs/sitemap` at `/sitemap-index.xml`, leaving out search and thank-you pages. Drafts never appear because they are never built for production.
- **robots.txt** is generated: production allows everything except `/api/` and points to the sitemap; preview builds block all crawlers.
- **pages.dev stays out of search:** `public/_headers` sends `X-Robots-Tag: noindex` on every `*.pages.dev` address, so only theludarium.com gets indexed once the domain is attached.
- **RSS feed** via `@astrojs/rss` at `/rss.xml`, linked from every page.
- **Share images rendered at build time** with `satori` and `@resvg/resvg-js` (dev dependencies; earn their place by giving every article its own branded card, not just one default). Default card at `/og/default.png`; each article gets `/og/articles/<slug>.png` with its category and title. Fonts come from `@fontsource/fraunces`. Articles with a hero image use that instead.
- **Twitter cards** (`summary_large_image`) on every page.
- **Structured data:** `Organization` and `WebSite` on every page; articles reference the organization as author and publisher. A 512 px PNG logo is generated at `/brand/ludarium-logo.png` because search engines want a raster logo.
- **Metadata check after every build** (`scripts/check-seo.mjs`): fails the build if a page is missing a title, description, canonical on theludarium.com, exactly one h1, share image, or image alt text; if indexable pages share a title or description; or if a title, description, or alt text has an em dash. Warns on long titles and descriptions. Cloudflare runs it too, so a broken page cannot ship.
- **`@types/node`** added as a dev dependency for the build-time code.
