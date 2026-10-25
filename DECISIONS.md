# Decisions

A short log of choices made and why. Newest at the bottom.

## 2026-10-15: Local setup

- **Repo lives at `~/Developer/theludarium`.** Code stays apart from business docs on the Desktop. Folder name matches the planned GitHub repo.
- **Node 22 LTS installed per user at `~/.local/node`**, added to PATH in `~/.zprofile`. No admin password needed and nothing system-wide. Astro 7 requires Node 22.22 or newer. `.nvmrc` pins 22 so Cloudflare Pages builds with the same major version.

## 2026-10-15: Skeleton (build step 1)

- **Astro 7.4, static output, exact versions pinned.** Pinned so a surprise upgrade never breaks a deploy; upgrade on purpose.
- **Trailing slashes everywhere** (`trailingSlash: 'always'`, directory build format). Matches the URLs in CLAUDE.md and avoids duplicate URLs for search engines.
- **Fraunces for headings, system fonts for body.** Fraunces is warm and a little playful, which fits the brand. It is self-hosted through `@fontsource-variable/fraunces` (dependency earns its place: no Google Fonts request, better privacy and speed). System fonts for body text cost nothing to load.
- **Palette:** oxblood primary, gold accent, teal focus ring, warm paper background. Every text color pairing passes WCAG AA (4.5:1). The light accent was darkened to `#8a5f12` after the first pick only reached 3.4:1.
- **Light and dark modes.** Follows the system setting by default; the header toggle saves a choice in localStorage. An inline script applies it before paint so there is no flash.
- **Placeholder pages for every v1 route** so navigation works end to end and previews are reviewable. Each uses `ComingSoon`, to be removed as real pages land. `/rpg-demo-library/` and `/game-night-madness/` stubs will be replaced by the real tool builds in step 6.
- **Dev tooling:** `@astrojs/check` and `typescript` as dev dependencies so `npm run check` catches type and frontmatter errors.

## 2026-10-15: The Ludarium Academy

- **Academy added to the plan.** Courses in Game Design and Game Strategy, sold as a monthly membership.
- **Paid courses run on a hosted course platform, linked out.** Free lessons and the course catalog live on this site at `/academy/`. Why: a paid library needs logins, billing, and a course player, which would break the "static site, no accounts" rule. Linking out matches how the store works.
- **Platform not chosen yet.** Podia and Teachable are the front runners. Pick when the first course is close to ready, not before, so no monthly fee is paid while nothing is for sale.
- **Paid courses do not break the "no paywalled community" rule.** Courses are structured lessons; community stays free. This rules out community-first platforms like Circle for now.

## 2026-10-16: Skeleton redesign from reference-site feedback

- **Direction:** clean, premium, lots of whitespace, rounded cards everywhere. Full notes in `DESIGN-NOTES.md`.
- **Navigation:** left-aligned logo; dropdown menus for Articles, Play, and Lounges that open on hover and also work by click, tap, and keyboard (Escape closes and returns focus). On screens narrower than 1152px the nav becomes a full-width menu with expandable sections.
- **Header actions:** a persistent "Join the newsletter" button, a quieter "Support us" link, and a search icon. The theme toggle moved to the footer to keep the header calm.
- **Home hero:** full-width illustrated game night table (inline SVG, no image download, so it is fast). It sits still for 6 seconds, then comes alive (steam, a die rolls in, a meeple hops). Pieces lift on hover. Respects reduced motion and has a pause button. Placeholder until real footage exists; the hero component is built to take a video later.
- **Landing page rules adopted** (CLAUDE.md, "Landing pages"). Home hero copy rewritten to them: outcome headline, clarifying subheadline, signup in the hero with a button that says what you get and how.
- **Signup form:** posts to Kit once `PUBLIC_KIT_FORM_ACTION` is set (build step 3). Until then it sends people to `/newsletter/`.
- **New routes:** `/academy/`, `/search/` (placeholder), `/support/`, `/terms/`, and category pages at `/articles/category/[category]/`. Terms added because the landing page rules require legal links.
- **Nav label:** "For Teams" in the top nav for Corporate Events, to keep the bar short. The page itself stays at `/corporate-events/`.

## 2026-10-16: Brand palette

- **Adopted Levi's palette:** Walnut `#2B1E16`, Parchment `#F6EFE3`, Felt Green `#2F5D50`, Lamplight `#E0A23B`, Stone `#B9AD9C`. Replaces the placeholder oxblood, gold, and teal.
- **Lamplight is the call-to-action color.** Every main button is Lamplight with Walnut text (7.2:1). Secondary buttons are a Felt Green outline. One loud color, used sparingly, keeps it meaningful.
- **Felt Green carries links, focus rings, and the logo mark** (6.6:1 on Parchment).
- **Contrast fixes:** Lamplight and Stone score about 1.9:1 as text on Parchment, below the 4.5:1 minimum. Light mode uses deeper tints for small text: `#7F5510` for eyebrow labels (5.7:1) and `#6B5D4F` for muted text (5.6:1). In dark mode the original Lamplight and Stone pass as text, so they are used directly.
- **Dark mode:** background `#1C140F` (a deeper walnut), cards in Walnut, Parchment text, a lighter felt `#8CC2B0` for links.
- **Hero art recolored** to the palette: walnut table, parchment board and cards, felt and lamplight pieces.

## 2026-10-16: Logo

- **Chose H3, the flat-top hex tile,** after rounds of sketches (dice, arch, round table, shelf, then hex tiles). The hexagon reads as a game tile; inside it, a round table and six chairs are cut out in negative space, so the people are the point inside the game.
- **Why not the round table on its own:** evenly spaced chairs around a circle read as a sun. Putting the table inside a solid tile fixed that.
- **Built as one even-odd path** (`src/lib/brand.ts`), so the table and chairs are true holes and the mark works on any background, including the browser tab. Generated from exact geometry: badge radius 29 with 4.2 corner rounding, table radius 11.6, chairs 10.4 by 4.2.
- **Colors:** Felt Green on Parchment (default), Parchment on Walnut or Felt Green. Lighter felt `#8CC2B0` for the dark-mode favicon.
- **Favicon:** SVG favicon of the mark. A PNG set (Apple touch icon, social share image) comes with the SEO step (build step 5).
- **Brand files:** `public/brand/` has the mark in Felt Green, Walnut, Parchment, and Lamplight.

## 2026-10-16: Code home

- **Repo:** github.com/theludarium/website (public). It was first created under Levi's personal account (The-LJAW) and transferred into the `theludarium` org while still empty, per CLAUDE.md. GitHub redirects the old URL.
- **Tooling:** GitHub CLI installed per user at `~/.local/gh` (checksum verified), signed in as The-LJAW; token kept in the macOS keychain. Git uses it through `gh auth setup-git`.
- **Commit identity (this repo only):** Levi Wilson with GitHub's private noreply email, so no personal or work address appears in public history.

## 2026-10-16: Cloudflare Pages build settings

- **Node pinned to 22.23.3 in `.nvmrc`.** Cloudflare's v3 build image defaults to Node 22.16.0, below Astro 7's 22.22 minimum. Pages reads `.nvmrc`, so builds match local exactly.
- **Build settings:** production branch `main`, build command `npm run build`, output directory `dist`, no adapter (static output). Every other branch and pull request gets its own preview URL.

## 2026-10-16: Articles (build step 2)

- **Content collection** in `src/content.config.ts`, files in `src/content/articles/`. The schema enforces the CLAUDE.md frontmatter: description must be 150 to 160 characters, category must be one of the four, and `heroAlt` is required with `heroImage`. A mistake stops the build with a plain message instead of shipping.
- **MDX added** (`@astrojs/mdx`). Earns its place because articles will need components, starting with the affiliate link component.
- **Drafts:** hidden from production; shown with a Draft badge in local dev and on Cloudflare preview builds of any branch other than `main` (Cloudflare sets `CF_PAGES_BRANCH`). Draft pages also carry `noindex`. So Levi can review a draft at a preview link before publishing.
- **Article page:** reading time (230 words a minute), a table of contents when there are three or more sections (sticky beside the text on wide screens, a collapsible box on phones), tags, end-of-article newsletter signup, up to three related articles (same category first, then shared tags).
- **Metadata:** Open Graph `article` tags (published, modified, section, tags), Twitter card, and JSON-LD `Article` plus `BreadcrumbList`. Author is The Ludarium as an organization for now; a per-article author field can come later.
- **Articles index and category pages** share one list: category filter pills, the newest article featured large, then a grid. Articles without a hero image get a placeholder in their category tint with the hex mark.
- **Three sample articles** written as drafts (hosting, teaching, togethering) so the pages can be reviewed. They are starting points for Levi to edit and are not published until set to `draft: false`.
- **How-to for writers:** `docs/writing-articles.md`.

## 2026-10-16: Core pages (build step 3)

- **Newsletter signup posts straight to Kit** from our own form (no Kit script, no extra JavaScript), so it stays fast and on-brand. The Kit action URL and email field name come from Kit's HTML embed code and live in `src/lib/config.ts`. Kit redirects new subscribers to `/newsletter/thanks/`. Until it is set, the form falls back to `/newsletter/`.
- **Service settings in one file:** `src/lib/config.ts` (Kit form, store URL, contact email, legal name, location). None are secrets.
- **Preview-only notes** (`PreviewNote`): reminders for missing settings or copy Levi still needs to write. They show in dev and on preview branches, never on the live site. The About page's founder section is preview-only until Levi writes it.
- **Newsletter page** built to the landing page rules: outcome headline, subheadline, a sketch of an issue as proof, one form, three objections, privacy link.
- **Home** shows the three latest articles once any are published, and the category cards until then.
- **About:** the name (ludus, play and school; -arium, a place for), togethering, the Now / Next / Then roadmap.
- **Store:** intro plus a link out to Lemon Squeezy; shows "opens soon" with a newsletter link until the store URL is set.
- **Affiliate disclosure and privacy policy** in plain language. The privacy policy is a draft, not legal advice; it needs the business details and a professional review before launch on theludarium.com.
- **Affiliate components** for articles: `AffiliateLink` (`rel="sponsored noopener"`) and `AffiliateNotice`. Usage in `docs/writing-articles.md`.

## 2026-10-16: The bigger vision

- **Vision recorded in CLAUDE.md:** The Ludarium as the epicenter of tabletop gaming; the lounges as the network connecting it worldwide; every local game community (store communities, chess, Go, mahjong, RPG groups, designers) meeting and paying membership at its local Ludarium; a community center whose events grow from each city; the game as the hook, people as the point.
- **Copy updated** on the home page (statement and lounge band), About (togethering and roadmap), and the Lounges page. The home hero stays focused on the newsletter, per the landing page rules.
- **Game stores framed as partners:** they sell, The Ludarium hosts. Groups and clubs can be members.

## 2026-10-16: Corporate events and lounges (build step 4)

- **Inquiry form runs on a Cloudflare Pages Function** (`functions/api/inquiry.ts`), Levi's choice over a form service. It checks a hidden honeypot field and Cloudflare Turnstile, validates every field, emails the inquiry through Resend with reply-to set to the sender, then redirects to `/corporate-events/thanks/`. Errors return to the form with a plain message. No database: inquiries live in Levi's inbox.
- **Settings:** `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `INQUIRY_TO` (plus optional `INQUIRY_FROM`) are set in the Cloudflare Pages project, never in the repo. The public Turnstile site key goes in `src/lib/config.ts`. Previews use Cloudflare's always-pass test key until it is set. Until a domain is verified in Resend, mail comes from `onboarding@resend.dev`.
- **Two-step form:** seven fields, so it splits into "About you" and "About your team" (landing page rule 6). Without JavaScript it is one long form that still works.
- **Lounge pages are data-driven:** `src/lib/lounges.ts` lists cities; `/lounges/[city]/` builds each page with its own waitlist. Adding a city is one entry.
- **Waitlist questions:** first name, email, ZIP, what they play, how often they would come. Posts to the city's Kit form; Kit tags it (`lounge-indianapolis`) and redirects to `/lounges/thanks/`. Kit custom fields: `zip_code`, `plays`, `visit_frequency`.
- **Concept floor plan** illustration on city pages (event hall, campaign rooms, game library, open tables, cafe, lounge), clearly labeled as a concept.
- **No invented facts:** pricing, opening dates, workshop lengths, and testimonials are left out or marked as preview notes for Levi to confirm.

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

## 2026-10-17: Card Catalog (from a Claude chat session)

- **New tool: The Ludarium Card Catalog.** Built on Tabletop Library's classification and recommender write-up, with our improvements: a sixth feel dimension (Table Talk), best player counts, real play times from logs, togethering outcomes (play again, how loud the table was), Discovery picks, and occasion tags. Full summary in `docs/card-catalog/HANDOFF.md`.
- **Prototype first as a Claude artifact,** then port to the site. Levi's choice. The prototype is the behavior reference; it is not served from this repo.
- **Group picks use a geometric mean** of each player's fit, after hard rules in code (player count, time, vetoes, a teacher for heavy games). Table Talk weighs 1.5 times the other dimensions.
- **Article** "How We Catalog Board Games by How They Feel" added as a draft. It credits Tabletop Library and introduces our system.
- **BoardGameGeek bridge** built as a separate Worker in `workers/bgg/`: server-side token, one queue spacing calls 2 seconds apart, cached results, BGG values never edited, attribution on every response. Not deployed; waiting on Levi's BGG token and commercial license.
- **Root `tsconfig.json` excludes `workers/`** so `astro check` does not type-check the Worker, which has its own config.
- **Open:** how to host per-user tracking without breaking the "no accounts" rule. Options are in the handoff; ask Levi before choosing.


## 2026-10-18: Card Catalogue on the site

- **Local-first, Levi's choice** over accounts now or leaving it as a Claude artifact. Everything a visitor records stays in their browser (localStorage), with backup download, restore, and CSV export. Keeps the "no accounts, no database" rule; sync can come later.
- **Group picks without accounts:** friends trade a table code (their feel profile and game lists, never notes or ratings), and guests can be added by hand.
- **Ported faithfully:** the engine (`src/lib/card-catalogue/engine.ts`) implements the spec exactly and is tested against the full 90-game catalog: profile weights, centered fit with Table Talk at 1.5 times, hard rules, geometric-mean group fit, Discovery picks, logged play times.
- **Readable without JavaScript:** all 90 cards are in the page HTML, so search engines index them; the script turns the page into the app.
- **Name:** "The Card Catalogue" in the UI and URL, per Levi. Docs from the chat session keep "Card Catalog."
- **Article published** with its claims made accurate: no community-vote data yet (that needs BoardGameGeek's commercial license), play logs stay on each device, and the call to action points to the free app.
- **Tuning note for Levi:** with the spec's math, a game that misses only on Table Talk can still fit about 85%. If Table Talk should matter more, raise its weight above 1.5.
- **Not yet:** the AI Librarian (needs a paid server-side Claude call) and BoardGameGeek import (waits on the token and commercial license).

## 2026-10-18: Content library import (from claude.ai chat sessions)

- **339 articles added as drafts** in `src/content/articles/`, written and source-checked in chat. Nothing goes live until an article is set to `draft: false`. Notes on what was converted and why: `docs/content-library/README.md`.
- **Two new categories** in `src/lib/site.ts`: Game Design and Magic & Cube. The library had 22 categories; folding 340 articles into the original four would have made Game Guides and Game Culture unusable, and Cube is its own audience (130 articles, Cube Commonwealth). The original category is kept as a tag on each article.
- **Skipped one duplicate:** the library's "How to Teach a Board Game in Five Minutes" had the same title and topic as the site's existing article; the site's version stays.
- **SEO check now fails on unfilled `<!-- EDITOR: ... -->` notes** on published pages, and warns on leftover `AFFILIATE` markers, so placeholder text cannot ship.
- **Built and checked in a copy of this branch:** preview build passes (drafts shown); a build with every article published passes the SEO check except for the 59 articles that still have EDITOR notes, which is the guard working.
- **Out of scope still:** the library also includes a shared events calendar and a community page template (in `docs/content-library/`). CLAUDE.md lists a public events calendar as Phase 2, so they are reference only.

## 2026-10-19: Domain live and launch batch

- **theludarium.com is live** on Cloudflare Pages: nameservers moved from NameHero to Cloudflare (the first save at NameHero never reached the registry; a re-save did), custom domain attached, HTTPS certificate issued, `www` 301-redirects to the apex with path and query kept (Bulk Redirect plus a proxied placeholder record).
- **Launch batch of 20 articles published** (Levi approved the list): evergreen, no unfilled EDITOR notes, nothing tied to dates, prices, releases, or local listings, spread across all six categories with Magic & Cube kept to 3. `pubDate` set to the launch day.
- **Links to unpublished articles render as plain text on the live site** (`src/plugins/rehype-unpublished-links.mjs`) and become links automatically when their target publishes. Previews keep them as links. This needs `@astrojs/markdown-remark`, Astro's official Markdown plugin package, because Astro 7's default processor does not run rehype plugins.
- **The build now fails on broken internal links** (`scripts/check-seo.mjs`), so a published page cannot point at a missing page or file.
- **Retired two early sample drafts** that duplicated library articles ("How to Host a Game Night People Talk About for Weeks" and "What Is Togethering?").

## 2026-10-19: Google Search Console and Google Analytics

- **Search Console:** Domain property for theludarium.com, verified with a TXT record in Cloudflare (keep it; removing it unverifies the site). Sitemap submitted. Google's one-click Cloudflare connection was skipped on purpose so Google has no standing access to the Cloudflare account.
- **Google Analytics, Levi's choice** over cookie-free Cloudflare Web Analytics, set to **count every visitor** (Levi's call, replacing a first opt-in-only version):
  - US and most countries: GA runs from the first page view with cookies, disclosed in the privacy policy, opt-out via "Cookie settings" in the footer.
  - EU/EEA, UK, Switzerland: a banner asks before cookies; until then Google Consent Mode sends cookieless pings so visits are still counted (modeled), without storing anything.
  - "No thanks" and Global Privacy Control mean cookieless only, everywhere; opting out deletes the `_ga` cookies.
  - Ad signals are always denied, so nothing is sold or shared for advertising.
  - Country for the banner decision comes from `functions/api/country.ts` (Cloudflare's location data, nothing stored), cached in the visitor's browser.
- **Privacy policy rewritten** to describe this model, including a short rights section. It promises advertising features and Google Signals off and 14-month retention; the GA property must be set that way. Not legal advice; worth a professional review.
- **The measurement ID goes in `GA_MEASUREMENT_ID`** in `src/lib/config.ts`. While blank, no banner shows and nothing loads.

## 2026-10-19: Dotted hero mark on the home page

- **The home hero shows the tile mark drawn in dots** (`src/components/ParticleMark.astro`), inspired by si.gov. Dots assemble on load; near the cursor or a finger they scatter and glow Lamplight, then spring back.
- Plain canvas, no library. The animation sleeps when nothing moves or the hero is off screen; with reduced motion the mark is drawn once and stays still.
- The table illustration stays available: `<Hero art="table">` (the default for other pages) brings it back.
- **Update: the dots cycle through game pieces** (`src/lib/dot-shapes.ts`): the tile mark, a d20, a meeple, a chess knight, a fanned hand of cards, and a mahjong tile, then back to the mark. Generic pieces only, so no publisher art. Because the cycle runs indefinitely, the hero's pause button now shows for the dots too (WCAG 2.2.2). New shapes are one draw function each on the 64 by 64 grid.

## 2026-10-19: Malaphor submission page

- **`/malaphors/` added** as the submission address printed in Levi's malaphor field guide (a separate book project, manuscript in `~/Developer/malaphors-book`). Levi chose a Ludarium landing page over an email address or a standalone domain.
- **Kit, not a form service:** five fields post straight to a Kit form tagged `malaphors` with custom fields `malaphor`, `parents`, `context`, so the book builds its own list without mixing with the newsletter audience. Action URL goes in `src/lib/config.ts`; a preview note shows until it does.
- **Not in the navigation.** The page exists for readers of the book; the site's own visitors reach it only by the printed URL.

## 2026-10-20: RPG Demo Library on theludarium.com

- **Repo moved** from Levi's account (The-LJAW) to `theludarium/rpg-demo-library` (Levi's call). GitHub redirects the old URL. Its GitHub Pages copy was turned off the same day, so theludarium.com is the only copy.
- **Included as a git submodule** at `vendor/rpg-demo-library`. The library has no build step and only relative paths, so its pages run under `/rpg-demo-library/` unchanged. `scripts/rpg-demo-library.mjs fetch` makes sure the submodule is present (falling back to a clone); `copy` runs after `astro build` and copies the demos to `dist/rpg-demo-library/games/`.
- **Front page rebuilt as a native page** (`src/pages/rpg-demo-library/index.astro`), reading the game list and PDF prices from the repo (`src/lib/rpg-demo-library.ts`), so a new demo in the repo appears here with no site change. The demos keep their own per-game look, plus a slim Ludarium bar, a canonical URL, share tags, and the site's analytics snippet (same consent rules) added on copy. Demo pages are in the sitemap.
- **To ship a library change:** merge it in the library repo, then here run `git submodule update --remote vendor/rpg-demo-library`, commit, and push.
- **Article promises corrected:** ten RPG articles promised subscribers "free RPG one-shot demo PDFs." The free thing is Act One in the browser; full adventure PDFs are paid. They now point to the library instead, and three articles that described the Indianapolis lounge as open no longer do.
- **Themed library cards** (2026-10-20, Levi's ask): each card on `/rpg-demo-library/` wears its game's look, taken from its demo page: background and texture, display font, accent color (`src/lib/rdl-themes.ts`). The eight display fonts are self-hosted via Fontsource (latin subset, one weight each, loaded only on that page; `src/styles/rdl-fonts.css`) rather than Google Fonts, to keep our own pages free of third-party font requests. A new demo without a theme falls back to a plain site card. All themes pass WCAG AA contrast.

## 2026-10-20: The eleven RPG Demo Library books

- **Written in one day, in parallel,** one agent per book, from the plan in `docs/rpg-pdfs/PLAN.md`. Each is a complete adventure plus a handbook of its game's open rules (Levi's call: one book per game, rules and adventure together). Manuscripts and the build pipeline live in the private repo `theludarium/rpg-adventures`; finished PDFs will be sold through Lemon Squeezy and never committed to a public repo.
- **Skellies gets a new adventure, Encore!, sold under CC BY-SA 4.0** as the license requires; Levi chose to sell it knowing buyers may share it.
- **Print:** Levi wants paperbacks on Amazon KDP. The licenses allow it; the plan and the Amazon-side risks (freely available content, AI disclosure) are in that repo's `docs/KDP-PLAN.md`.
- **Still to do before any book goes on sale:** Levi's playtest, the pre-launch license checks in that repo's `docs/LICENSES.md` (Cypher's new license, Paizo compatibility registration, a Pathfinder rules pass), and updating each demo's page count.

## 2026-10-20: Store prices reach browsers at once

- The RPG Demo Library's `store.js` (prices and checkout links) and `buy.js` were served with Cloudflare's default 4-hour browser cache, so after the price change to $9.99 a returning visitor still saw $5. Now the demos load both with a content-hash version tag (`scripts/rpg-demo-library.mjs`), and `public/_headers` tells browsers to recheck them on every visit. Any future price or checkout-link change shows up on the next page load.

## 2026-10-20: No newsletter schedule promises

- About 330 articles told readers the newsletter "sends one piece like it every week" (plus variants: "one short email a week," "a weekly piece on cube design," "continues weekly"). Kit isn't set up and no schedule is set, so Levi chose to soften them everywhere: "If this is useful, the newsletter sends more like it," "new pieces on cube design," "short emails." Specific features nobody has planned (a yearly Gen Con family-day plan, a designers' thread, a monthly cube note) are gone too. Promise a schedule once one exists.
- Batch 6 also fixed "come run a demo at our lounge" (now: once it opens) and "The Ludarium runs" a corporate events service (now: offers).

## 2026-10-20: Game Night Madness moves to The Ludarium

- The repo moved from The-LJAW to the `theludarium` org and is built into the site at `/game-night-madness/`, the same way as the RPG Demo Library: a submodule, copied in after the Astro build with a canonical URL, share tags, the site's analytics, and the slim Ludarium bar. The bar code now lives in `scripts/tool-chrome.mjs`, shared by both tools.
- Recolored in The Ludarium's palette and type (Levi's choice over keeping its purple look). Fraunces is self-hosted in the app, so it no longer loads Google Fonts.
- The old the-ljaw.github.io address forwards to the new home, keeping bracket codes, and retires the old service worker on installed phones (Levi's choice over letting it break).


## 2026-10-21: Cube Commonwealth is "relaunching" until its details are set

- The cube articles described Cube Commonwealth with details nobody has confirmed (drafts most weeks, a Commander pod on request, house rules posted, "we tried this for a season"). Levi chose to say only what is cleared: it is The Ludarium's Indianapolis cube group, it is relaunching as part of The Ludarium, and subscribers hear first when the first night is set. Invented specifics and first-person stories came out; links to its join page (`cube-draft-indianapolis`) stay and show as plain text until that page is published.
- The same pass caught more weekly-newsletter promises (mostly section headings like "One game-night idea a week") and "open playtest nights at The Ludarium", which do not exist yet. Those now say The Ludarium plans them once the Indianapolis lounge opens. A batch 6 line saying The Ludarium hosts public game nights now says it is planning them.

## 2026-10-21: Newsletter on Kit, sent from hello@theludarium.com

- Levi's choices: send from **hello@theludarium.com** (Cloudflare Email Routing forwards it to his Gmail, free; Kit verifies the domain), **double opt-in**, a **PO box or virtual mailbox** for the legally required mailing address, and a welcome email drafted by Claude (`docs/newsletter/emails.md`).
- Step-by-step setup is in `docs/newsletter/KIT-SETUP.md`. Two Kit forms to start: the newsletter, and the Indianapolis lounge waitlist (tag `lounge-indianapolis`; fields `zip_code`, `plays`, `visit_frequency`).
- Kit sends people to `/newsletter/thanks/` after signing up and `/newsletter/confirmed/` after they click the confirmation link. Both are noindex and out of the sitemap.
- hello@theludarium.com is also the site's contact email (privacy and disclosure pages).
- Built 2026-10-21: Kit forms **Ludarium Letters** (form 10079099, the newsletter's name) and **Lounge waitlist: Indianapolis** (form 10079113, custom fields zip_code, plays, visit_frequency; rule 5659971 tags `lounge-indianapolis`). Both double opt-in with the confirmation email in `docs/newsletter/emails.md`. theludarium.com is a verified sending domain in Kit (DKIM CNAMEs, `ckespa` return path, `_dmarc` p=none).

## 2026-10-22: Malaphor page goes live

- **The book is on Amazon** (paperback ASIN B0HNTSXVS6, Kindle B0HNTT7KKV), so `/malaphors/` had to stop returning 404.
- **Kit form "Malaphor submissions" (10080181)**, made by duplicating the Indianapolis waitlist form so it keeps double opt-in. Custom fields `malaphor`, `parents`, `context`; rule 5660414 tags senders `malaphors`. The confirmation email was rewritten for malaphor senders. No welcome sequence for now; the page only promises a note if theirs makes the book.
- **Own confirmed page, `/malaphors/confirmed/`.** The newsletter's confirmed page promises a welcome email these people will not get.
- **A quiet Amazon link** below the questions and on the confirmed page (`MALAPHOR_BOOK_URL` in `src/lib/config.ts`). A plain link, not an affiliate link, so no disclosure is needed.

## 2026-10-22: Book module on the malaphor page

- **A Walnut panel with the cover and a "Buy on Amazon" button** sits right under the submission form on `/malaphors/` (`src/components/MalaphorBook.astro`), replacing the one-line "No copy yet?" link. Levi wanted buying the book to stand out. Walnut, not Felt Green, so the green cover stands out against it.
- **Plain Amazon links** (paperback page, plus a Kindle link in `MALAPHOR_KINDLE_URL`); no affiliate tags, so no disclosure. No prices on the page, since KDP prices can change.

## 2026-10-22: A product page for the malaphor book

- **`/books/well-burn-that-bridge/`**, with a small `/books/` index so new books slot in. Book facts live once in `src/lib/books.ts`. The page carries Book structured data (ISBN, pages, paperback and Kindle editions) and uses the cover as its share image.
- **Linked from** the store page (a Books section), the footer, and the book module on `/malaphors/`. Not in the header: it is a quiet revenue path.
- **Amazon sells and ships it**, so this is not The Ludarium selling a physical product. Plain links, no affiliate tags, no prices (KDP prices can change).
- **Sample strips are three that passed the art check cleanly** (bridges, birds, elephant). Their alt text describes what is drawn, which differs a little from the scripts.

## 2026-10-22: First Academy course, Road to the Catan Championship

- **The first course is free:** 40 lessons in six levels (Settler, Homesteader, Trader, Strategist, Contender, Champion), from opening the box to a National Championship run. Its job is newsletter subscribers and traffic to articles. A paid Academy membership comes later, on the course platform.
- **Lessons are a content collection, `lessons`,** in `src/content/lessons/<course>/<slug>.md`, validated like articles: `course`, `level` 0 to 5 with a matching `levelName`, `order` 1 to 40, `emailSubject`, and a 150 to 160 character description. A published lesson must also have `oneIdea` and a 2 or 3 question `levelCheck`; `nextTeaser` holds the teaser for the next lesson. Drafts can be bare scaffolds (the outline sits in an HTML comment and shows on previews). Paid lessons never live in this repo.
- **The quiz lives in frontmatter, not MDX.** The page renders it with the `LevelCheck` component: answers sit in `<details>`, so it works with no JavaScript and no new dependency. A small script sends a Google Analytics `level_check_complete` event (with the lesson slug) when every answer has been opened.
- **URLs:** `/academy/` (landing page and catalog), `/academy/<course>/` (course page), `/academy/<course>/<lesson>/` (lesson). Course pages and lesson pages are generated from `src/lib/academy.ts`, so new courses slot in. `/academy/thanks/` and `/academy/confirmed/` are the Kit redirects, kept out of search and the sitemap. Unpublished lessons show as plain titles on the live site, and links to them in Markdown render as plain text, the same as unpublished articles.
- **Lesson pages reuse the article reading layout.** The article page's styles moved to `src/styles/reading.css` so both share it.
- **One Kit form per course, double opt-in:** "Academy: Road to the Catan Championship", tagged `academy` and `academy-catan`. Fields: first name, email, `catan_experience` (Never played / Played a few times / I play regularly / I want to compete) and an optional `state` for regional event alerts. The answer sets the starting level tag: `academy-catan-settler`, `-homesteader`, `-trader`, or `-contender`; `-strategist` and `-champion` are reached by graduating. Form action goes in `KIT_ACADEMY_FORMS` in `src/lib/config.ts`. Setup and automation plan: `docs/academy/catan/`.
- **Structured data:** `Course` on the course page (free offer, one syllabus section per level), `LearningResource` on lesson pages.
- **Launch with Level 0 only.** Everyone starts at Level 0 until later levels are written, whatever they pick on the form; the form still saves `catan_experience` so the level split can switch on later. Site copy promises one lesson at a time, not a starting level. Kit build order is in the "Launch first" section of `docs/academy/catan/KIT-SEQUENCE.md`.

## 2026-10-23: The store opens with ten adventure PDFs

- **Lemon Squeezy store "The Ludarium" is live** at `theludarium.lemonsqueezy.com` (live mode, not test mode). `STORE_URL` in `src/lib/config.ts` points there.
- **Ten products, all $9.99, tax category eBook,** one per RPG Demo Library game, each with its front cover and the PDF from `theludarium/rpg-adventures` (`lemon-squeezy-upload/`, rebuilt from current source on 2026-10-23). Product names are the bare titles, so no game trademark sits in a product name; each description names its game and license, links the free demo, and carries the AI-assistance credit. Encore! (Skellies) is not in the store yet.
- **Checkout links live in the library's `store.js`,** which switches every demo's buy button and the `/rpg-demo-library/` cards from "coming soon" to "Buy the PDF". `/store/` lists the ten PDFs (cover, game, pages, Buy, Play Act One free); covers are in `src/assets/rpg-pdfs/<demo slug>.jpg`.
- **Levi's pre-launch calls:** all ten are playtested, so the "edited and playtested by Levi Wilson" line stands; The Glass Comet keeps the older Cypher System Open License for now; The Sleepless Mill drops "compatible with Pathfinder Second Edition" (cover, store, library card, demo) until Levi registers for Paizo's compatibility license. The ORC attribution naming Paizo's books stays, since the license requires it.

## 2026-10-23: No "Support us"; support comes through memberships

- **Removed "Support us" from the header and footer** and deleted `/support/`, which was only a "coming soon" page. Levi's call: a tip jar or Patreon feels like asking for money; he would rather offer memberships people pay for because they get something.
- **`/support/` redirects to `/lounges/`** (301, `public/_redirects`, the site's first Cloudflare Pages redirect), so old links land on the membership vision.
- **The plan changes:** reader support (Patreon or similar) is off the Phase 1 list and "donation or Patreon-style asks" joins Ruled out in `CLAUDE.md`. People who want to back The Ludarium buy a PDF now, and later an Academy or lounge membership.

## 2026-10-23: I Made You a Mixtape article and the J-card offer

- **New article, `i-made-you-a-mixtape-board-game`, in Game Design,** added as written and kept `draft: true` until Levi approves. Drafts already render on branch previews (noindex), so no special build is needed. Levi's "At our table" section is a placeholder comment.
- **The free Mixtape J-card is a Kit incentive** (Levi's choice, option A): the PDF lives in Kit, not in this repo, and Kit delivers it when the subscriber confirms. Fully gated.
- **One Kit form per offer.** `KIT_OFFER_FORMS` in `src/lib/config.ts` holds each offer's Kit form, heading, lede, and button label. An article opts in with `offer: <key>` in its frontmatter (validated by the schema), and its end-of-article signup swaps to that offer. Same no-JavaScript `NewsletterForm`, now with a `formAction` prop. Until the J-card form's action URL is filled in, the signup posts to the general newsletter form and previews show a reminder.
- **No `/mixtape-j-card/` landing page for now** (Levi's call); the article sells the offer.
- **Built in Kit the same day:** form "Offer: Mixtape J-card" (10088125), copied from Ludarium Letters so it keeps double opt-in and the `/newsletter/thanks/` redirect. Its confirmation email is rewritten for the J-card, and confirming downloads `mixtape-j-card.pdf` (Kit's "after confirming: Download"). Rule 5664112 tags `mixtape-j-card` and starts the newsletter Welcome sequence, so J-card subscribers get the same welcome as everyone else. The PDF was printed from Levi's Mixtape J-Card design canvas at Letter landscape, actual size.

## 2026-10-23: The game shelf cluster, 34 articles in six series

- **Thirty-four articles in six series** (The Shared Shelf, Building Your Library on Purpose, The Math of Game Night, Smart Buying, Running a Play Group, Library Science for Gamers), written to Levi's brief and added in one branch. Each names its series near the top and cross-links the others, so the series hold together without a series feature on the site.
- **New category, Game Shelf** ("Building, sharing, and organizing a game collection worth playing"), for the collecting, buying, math, and library-science series. Running a Play Group went to Game Night, and the Magic Cube article to Magic & Cube. The category list is meant to adjust as articles arrive (CLAUDE.md), and 30 articles earn a home.
- **`seoTitle`, an optional frontmatter field,** sets a shorter browser-tab and search title while `title` stays the headline. The brief supplied one per article; six were shortened or had a stray pipe removed. Use it whenever a title plus " | The Ludarium" would pass 70 characters.
- **Markdown tables now scroll sideways** on narrow screens (`rehype-table-scroll`), and the in-article "Keep reading" lists were renamed "More from <series>" so they do not collide with the page's own Keep reading section.
- **Claims brought in line with the site:** the brief called sessions "Ludarium game nights," but none exist yet, so those passages now point to the lounge and its Indianapolis waitlist or to game store open play. "The Ludarium runs Cube Commonwealth with weekly draft nights" became the live site's wording: drafted weekly for about three years, relaunching as part of The Ludarium, linked to the cube article.
- **Two articles held as drafts** for Levi's review: `ludarium-classification-system` describes a five-part code (role, weight, players, length, style) that differs from the Card Catalogue's call numbers and six feel dimensions already published on the site, and `group-shelf-feature` describes "the Ludarium app, in development" at length while the Card Catalogue is live. Five other articles mention the app in one sentence each; left as written, flagged to Levi.
- **Descriptions** under the schema's 150-character floor (17 of them) were lengthened by a few words; en dashes in ranges became "to".

## 2026-10-23: The Game Shelf email series

- **A dedicated opt-in on all 34 Game Shelf articles** (`offer: game-shelf`), not the general newsletter form, so the series only goes to people who asked for it. Existing subscribers are not added automatically. New opt-ins also get the newsletter Welcome.
- **Six chained sequences, one per series, Tuesday and Friday at 8 a.m. Indiana time.** Each email teases one article and links to it; each series ends with a wrap-up that previews the next. Two emails a week keeps the 38 published emails to about four and a half months.
- **Same mechanics as the Catan course:** visual automations swap a series tag to move people along, footer links let readers skip to the next series or pause for two weeks, and the sequences exclude the pause, complete, and later series tags. IDs and links in `docs/newsletter/GAME-SHELF-SERIES.md`; the email copy in `docs/newsletter/game-shelf-emails.json`.
- **The two draft articles' emails wait unpublished** in series 6 and go live with their articles.

## 2026-10-23: The Game Shelf category page is the series hub

- **`/articles/category/game-shelf/` now works like the Catan course page:** the series email signup above the fold, then the six series in reading order, each with its articles numbered and given a one-line summary. Levi's call. A 34-article cluster needs a "start here," and the newest-first category grid could not give one.
- **How it is built:** a static route, `src/pages/articles/category/game-shelf.astro`, which wins over the dynamic `[category]` route (that route now skips the slug). Series order and every line live in `src/lib/game-shelf.ts`. Cluster articles filed under other categories (Running a Play Group in Game Night, the Cube article in Magic & Cube) are on the hub too, and any later Game Shelf article outside the series gets a "More from the Game Shelf" grid. The category filter pills moved into `CategoryFilters.astro` so the hub and `ArticleList` share them.
- **Drafts keep their place** as plain titles marked "Coming soon" on the live site, and link with a Draft badge on previews, like unpublished Catan lessons.
- **The summaries were written from the articles, then checked.** One writer per series read every article in full and drafted the lines; a second pass tested each line against the article text (claims, numbers, length, banned words, nothing implying game nights, a lounge, a league, or the app exist) and fixed seven. Lines are 55 to 100 characters and add to the title rather than repeat it.

## 2026-10-23: The Game Shelf is an Academy course; the Academy page is a catalog

- **The series hub moved from the Game Shelf category page to `/academy/game-shelf/`,** the same shape as `/academy/catan/`. Levi's call: the Game Shelf is a course, read in order, and belongs beside the Catan course. The category page went back to the normal newest-first list, with a band at the top that points to the course, so the email footers' "Browse the whole series" link still lands somewhere useful. The course is described in `GAME_SHELF_COURSE` in `src/lib/game-shelf.ts`; its page is `src/pages/academy/game-shelf.astro`, a static route beside the lesson-based `[course]` route.
- **`/academy/` is now a catalog, not a Catan landing page.** The Catan signup form came off the page (each course page has its own), replaced by a description of what the Academy is: free courses, one short lesson at a time, by email and on the site, in game strategy, game libraries, and soon game design. Then a grid of course cards (Catan, The Game Shelf, more as they come), "How the Academy works," and the questions. Card copy comes from `COURSES` and `GAME_SHELF_COURSE`, so a new course is one entry plus its page.
- **Categories can point to a course** (`course` on a `CATEGORIES` entry in `src/lib/site.ts`), which draws the band on that category's page. Only Game Shelf uses it so far.

## 2026-10-23: Site search runs on Pagefind

- **Pagefind indexes the finished site** at the end of `npm run build` (after the tool copies, before the SEO check), writing a static index to `dist/pagefind/`. No server, no third-party service, and the index grows with the site. It is the one new dependency in a while; it earns its place because full-text search over 400 pages with stemming, excerpts and filters is not something to hand-roll. Search works on the live site and on previews, not in `astro dev`, where the page says so.
- **What gets indexed:** `<main>` on every page that is not `noindex`, tagged with a section derived from the URL in `src/lib/search.ts` (Articles, Academy, Play, Lounges, For teams, Store, About). Articles add their category as a filter and a `date` sort key; lessons add their course. Signup boxes, tables of contents, related-article grids, listing grids and the Game Shelf and Catan course outlines carry `data-pagefind-ignore`, so excerpts come from real content and list pages do not outrank the articles they list. The vendor tool apps (RPG Demo Library, Game Night Madness) are not indexed; the site's own pages about them are.
- **The page uses Pagefind's JS API, not its stock widget,** so results look like the rest of the site: section and category eyebrow, title, excerpt with highlighted matches, and up to three "jump to heading" links per result. Results arrive as you type, ten at a time with "Show more"; pills filter by section with live counts; the query and filter live in the URL (`?q=`, `?in=`) so searches can be shared and the back button works; "/" focuses the box; the empty state offers suggested searches and four places to browse. Styles for the script-built pieces are global under `.search-body`, because Astro's scoped styles cannot reach elements made at runtime.
- **Search analytics stay a later step,** as planned in CLAUDE.md.

## 2026-10-24: The game tools are in search too

- **The index is now built by `scripts/search-index.mjs`** (Pagefind's Node API) instead of the CLI. It indexes `dist/` the same way, then adds one record per RPG demo and one for Game Night Madness. Levi's ask: the demos should be searchable by game.
- **Why records instead of indexing their pages:** the demos are single-file apps whose adventure text renders by script, so their HTML holds little to index and what it holds is story prose, which would match "night" or "door" searches with noise. Each record instead carries the adventure title, its game system (from `store.js`), the library card's subtitle, blurb and tags, and the demo page's own description, so "Ironsworn", "Forged in the Dark" or "Weird West" land on the right demo. Results show as Play with the game as the category. The library stays the one source of truth: add a demo there and it enters the index on the next build.

## 2026-10-24: The Academy content plan, built as one push

Levi's "Ludarium Content Plan: Academy, TCGs, and the Hotness" (October 24, 2026) asks for 20 board game courses, 6 TCG courses, a weekly game index, and the recurring stories. Levi said to build it all rather than follow the timeline, branch per wave with his approval, site first and Kit after, and to write lesson 3 from the rulebook with a placeholder for his own table notes.

- **A general course system beside Catan.** Catan keeps its six-level design (its pages moved to `src/pages/academy/catan/`). Every other course is one YAML file in `src/content/courses/`, a folder of lessons in `src/content/course-lessons/<slug>/`, and an original diagram in `public/academy/<slug>/`. The `[course]` route renders the course page, the lessons and a printable teach sheet. Four formats: full (8 lessons), masterclass (7), Teach It Tonight (sheet plus 2), and TCG (8, all public). The writer's guide is `docs/academy/COURSES.md`; `scripts/check-course.mjs` checks a course before a build.
- **Lessons 1 and 2 are public; board game lessons past that arrive by email,** as the plan says: their pages exist for the emails but are noindex and kept out of the sitemap and search, and the course page lists them as "By email." TCG lessons are all public, because Wizards forbids an email gate for Magic and the plan applies that rule to every TCG. The Academy page copy changed to match.
- **Teach sheets** are a page per course with print styles; `scripts/teach-sheets.mjs` prints them to one-page PDFs with headless Chrome on Levi's Mac (Cloudflare's build has no browser), and the PDFs are committed.
- **Placeholders, not guesses.** No first-person play stories; `<!-- AT OUR TABLE -->` marks where Levi's notes go. Unconfirmed facts carry `<!-- VERIFY -->`, product mentions carry `<!-- AFFILIATE -->` until programs are confirmed. The build lists all three.
- **Every course was written by one agent and then attacked by a second** that re-read the official rules and fixed what it could not confirm. Carcassonne was the pilot that set the model.
- **Signups post to the general newsletter until each course has its Kit form** (`KIT_COURSE_FORMS`), so no email is lost; previews show a reminder. Kit forms and sequences come after the site, once Levi picks a paid plan.
- **Riftbound is built but stays a draft** until Riot answers in writing, as the plan requires.
- **One game index: On the Table.** The plan's index, called the Ludometer there, is the On the Table tracker that was already live (`theludarium/on-the-table`). Levi's call on 2026-10-24: one engine and one name. A BGG-based Ludometer Worker and preview-only `/ludometer/` pages were built on this branch first and then removed before merging; the useful parts are written up for On the Table's later phases in that repo. The plan's weekly section becomes "On the Table this week".
- **The Catan course now carries an unofficial notice** on the course page and every lesson.
