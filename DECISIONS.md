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
