# Design notes

Levi's feedback on reference sites, collected before the skeleton is reworked. Apply these when redesigning; update as more feedback comes in.

## Round 1: general inspiration (2026-10-15)

### Shut Up & Sit Down (shutupandsitdown.com)
- **Dislike:** the home page is too basic.
- **Like:** the primary navigation design is fine.
- **Like:** the Donate button in the nav. For The Ludarium, a "Support us" option (Patreon or similar) instead of donations. Treat it as a quiet revenue path.
- **Like:** the card grids on the Videos, Games, and Articles pages. A good starting point for article and media listing pages.
- **Like:** site search. Build it in.
- **Later, with analytics:** record what people search for and show it in a dashboard. Note: this needs somewhere to store queries (for example a Cloudflare Pages Function plus storage, or an analytics tool with custom events). Propose options before building, since CLAUDE.md says no database.

### Kinfolk (kinfolk.com)
- **Dislike** overall. Do not use as a reference.

### Atlas Obscura (atlasobscura.com)
- **Like:** dropdown menus in the primary navigation that open on hover and show sub options. Must also work by keyboard and on touch.

### Cards Against Humanity (cardsagainsthumanity.com)
- **Like:** the interactive first module on the home page. Hovering a card makes it move and highlight.
- **Like:** the overall simplicity, especially above the fold on the home page.
- **Caution:** too simple for The Ludarium, which has more going on. Borrow the simplicity of the first screen, not the whole site.

## Round 2: publishers, premium brands, coworking, game clubs (2026-10-16)

### Content publishers
- **Dicebreaker:** content structure is similar to what The Ludarium will publish. Feel is too basic, too newspaper. Want higher end.
- **Polygon:** cleaner than Dicebreaker. **Use its content-list structure for `/articles/`, not the home page.**
- **The Verge:** no, too busy.
- **The Ringer:** **rounded corners on cards, used consistently across the site.** Makes it feel higher end.
- **Wirecutter:** no, too busy, newspaper look.
- **Serious Eats:** no.
- **Morning Brew:** **well-organized primary navigation.** Like how it **unabashedly pushes its primary CTA** (for us: the newsletter).
- **Hodinkee:** dislike the centered primary navigation. Keep nav left/right aligned.
- **Tested:** no, too busy.
- **Eater:** no.

### Premium and artsy
- **Playdate, Analogue:** **simplicity and whitespace.** Great for selling one specific product (tool pages, Academy courses, store products).
- **Teenage Engineering:** **love the home page's long scroll down through the entire building.** Use this for the physical game lounge pages.
- **Annapurna Interactive:** maybe a model for a page showcasing Levi's digital products (apps and websites).
- **MUBI:** like the artsy vibe.
- **The Criterion Collection:** like the flow, but it suits media and video. Not for The Ludarium home page. Candidate for the media-review section of the future Slugblaster Magazine (see Future projects).
- **A24:** kind of like the scrolling behavior at the top of the home page.
- **It's Nice That:** no.
- **Wallpaper*:** fine, does not strike his fancy.
- **The Hoxton:** no.
- **Aesop:** **full-width video on the home page, above the fold. Smooth and high end.** Like this a lot.
- **Awwwards, Godly, Siteinspire:** no (Godly way too busy).

### Premium coworking
- **Spring Place:** like the video in the above-the-fold home module.
- **Fora:** like the full-width image. Its video may be too busy. **Idea: a video that looks like a still image, with nothing moving for the first 30 seconds or so, then comes alive.**
- **Mindspace:** nice video.

### Game clubs
- **Tabletop Library (Berkeley):** dislike the site design, **love the business premise.** It is the model for The Ludarium Game Lounge: a third place for members. Their story page (tabletoplibrary.com/about/story) speaks to the same ideas: get people off screens and together, take the friction out of finding games and finding people to play with. Their public financials pages are worth tracking (see Lounge research below).
- **Gamer's Guild Social Club (Minneapolis):** dislike the design and the **extreme exclusivity.** Not the style of lounge The Ludarium will be. Keep membership welcoming, not application-gated.
- **Elf 'N Moon (Indianapolis):** a retail game store, which The Ludarium is not. Seems to have a good community; worth visiting to learn how they built it.

## Design direction (draft, from rounds 1 and 2)

**Overall feel:** clean, high end, premium, lots of whitespace, a little artsy (MUBI). Never busy, never newspaper. Playful in small signature moments, not everywhere.

**Home page**
- Full-width hero video or image above the fold (Aesop, Spring Place, Fora, Mindspace). Calm and smooth.
- Candidate signature idea: the hero looks like a still photo, then slowly comes alive after a while.
- Simple above the fold (Cards Against Humanity), with one interactive moment (CAH's hover cards) further down or in the hero.
- Clear, confident newsletter CTA (Morning Brew).
- More whitespace than a publisher home page. The home page is the premium front door, not the content index.

**Navigation**
- Left-aligned logo, not centered (Hodinkee dislike).
- Well-organized top nav with hover dropdowns for sub-sections (Atlas Obscura, Morning Brew). Must work by keyboard and touch.
- Persistent primary CTA button (newsletter) plus a quieter "Support" link (Patreon) (Shut Up & Sit Down).
- Site search (Shut Up & Sit Down).

**Components**
- Rounded-corner cards, consistent everywhere (The Ringer).
- Card grids for content listings (Shut Up & Sit Down).

**Section-specific**
- `/articles/` and other content lists: Polygon-style structure.
- Tool pages, Academy courses, store products: Playdate/Analogue-style product pages, simple and spacious.
- Lounge pages: Teenage Engineering-style long scroll through the building (needs real space or illustrations).
- Lounge brand: warm and welcoming like Tabletop Library's premise, never exclusive like Gamer's Guild.

**Performance and accessibility guardrails for video**
- Show a still poster image first; load the video after. The "looks like a still, then comes alive" idea fits this well and keeps the page fast (Lighthouse 95+ target).
- Respect reduced-motion settings, and give any auto-playing video a visible pause button (WCAG requires one for motion over 5 seconds).
- Needs real footage. Until the lounge exists: game nights, pop-ups, close-ups of play.

## Future projects (outside this repo)

- **Slugblaster Magazine (SlugblasterMagazine.com, owned):** an e-magazine written "in world" by the teenage Slugblasters about their adventures across dimensions. A media-review section (films and videos from the Slugblaster world) could use a Criterion-style design. Separate site. Before building, confirm the license or permission from the Slugblaster publisher to publish in that world.
- **Digital products showcase:** a page for Levi's apps and websites, possibly Annapurna-style.

## Lounge research

- **Tabletop Library's published opening projections** (tabletoplibrary.com/financials/projections, best-guess scenario, monthly): revenue $49,420; gross profit $34,195; expenses $38,957 (payroll $21,533, facilities $11,058, other $6,366); net -$4,762 (-10%). Gross profit by source: membership 53%, retail 21%, guest passes 9%, food and drink 8%, private bookings 7%. Their targets: about 18 months to break even, 20% margin about 3 years after that, about $500,000 up front. First actual quarterly numbers due around February 2027.
- Note: The Ludarium has no retail, which is 21% of their gross profit. That gap has to come from membership, events, bookings, or food and drink.
- **Ambition:** Ludarium lounges across the US, then the world, then the solar system, then the universe. Think big.

## Content direction

- Phase 1 is content. Beyond articles, plans include **podcasts and YouTube videos**. The site structure should make room for multiple media types (articles, episodes, videos) without a rebuild.

## The Ludarium Academy (new idea, 2026-10-15)

- An education section: courses in **Game Design** and **Game Strategy** for a specific set of games.
- Business model idea: a **monthly membership** that unlocks all courses.
- **Conflicts with CLAUDE.md as written:** "no user accounts," "on-site payments and membership billing out of scope," and "no database." A paid course library needs logins and billing, so it cannot be built into this static site without changing those rules.
- **Decided:** free lessons and the catalog on this site; paid courses on a hosted course platform, linked out. CLAUDE.md updated. Platform choice waits until the first course is close to ready (see DECISIONS.md).
- Strategy courses for published games: teaching strategy is fine, but publishers' art, rulebook text, or logos need permission.
