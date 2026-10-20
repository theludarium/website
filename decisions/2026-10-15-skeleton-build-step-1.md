## 2026-10-15: Skeleton (build step 1)

- **Astro 7.4, static output, exact versions pinned.** Pinned so a surprise upgrade never breaks a deploy; upgrade on purpose.
- **Trailing slashes everywhere** (`trailingSlash: 'always'`, directory build format). Matches the URLs in CLAUDE.md and avoids duplicate URLs for search engines.
- **Fraunces for headings, system fonts for body.** Fraunces is warm and a little playful, which fits the brand. It is self-hosted through `@fontsource-variable/fraunces` (dependency earns its place: no Google Fonts request, better privacy and speed). System fonts for body text cost nothing to load.
- **Palette:** oxblood primary, gold accent, teal focus ring, warm paper background. Every text color pairing passes WCAG AA (4.5:1). The light accent was darkened to `#8a5f12` after the first pick only reached 3.4:1.
- **Light and dark modes.** Follows the system setting by default; the header toggle saves a choice in localStorage. An inline script applies it before paint so there is no flash.
- **Placeholder pages for every v1 route** so navigation works end to end and previews are reviewable. Each uses `ComingSoon`, to be removed as real pages land. `/rpg-demo-library/` and `/game-night-madness/` stubs will be replaced by the real tool builds in step 6.
- **Dev tooling:** `@astrojs/check` and `typescript` as dev dependencies so `npm run check` catches type and frontmatter errors.
