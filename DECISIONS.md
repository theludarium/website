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
