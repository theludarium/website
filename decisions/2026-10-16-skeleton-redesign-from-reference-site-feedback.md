## 2026-10-16: Skeleton redesign from reference-site feedback

- **Direction:** clean, premium, lots of whitespace, rounded cards everywhere. Full notes in `DESIGN-NOTES.md`.
- **Navigation:** left-aligned logo; dropdown menus for Articles, Play, and Lounges that open on hover and also work by click, tap, and keyboard (Escape closes and returns focus). On screens narrower than 1152px the nav becomes a full-width menu with expandable sections.
- **Header actions:** a persistent "Join the newsletter" button, a quieter "Support us" link, and a search icon. The theme toggle moved to the footer to keep the header calm.
- **Home hero:** full-width illustrated game night table (inline SVG, no image download, so it is fast). It sits still for 6 seconds, then comes alive (steam, a die rolls in, a meeple hops). Pieces lift on hover. Respects reduced motion and has a pause button. Placeholder until real footage exists; the hero component is built to take a video later.
- **Landing page rules adopted** (CLAUDE.md, "Landing pages"). Home hero copy rewritten to them: outcome headline, clarifying subheadline, signup in the hero with a button that says what you get and how.
- **Signup form:** posts to Kit once `PUBLIC_KIT_FORM_ACTION` is set (build step 3). Until then it sends people to `/newsletter/`.
- **New routes:** `/academy/`, `/search/` (placeholder), `/support/`, `/terms/`, and category pages at `/articles/category/[category]/`. Terms added because the landing page rules require legal links.
- **Nav label:** "For Teams" in the top nav for Corporate Events, to keep the bar short. The page itself stays at `/corporate-events/`.
