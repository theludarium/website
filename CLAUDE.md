# The Ludarium: theludarium.com

This repo is the website for The Ludarium, a tabletop gaming brand that will grow into a membership game lounge. Claude builds and maintains the site. Levi reviews, directs, and writes or edits articles.

## What the site is for

The Ludarium is a business built to make money from several revenue streams. The website is its front door and the engine of its first phase.

### The vision

The Ludarium is the epicenter of tabletop gaming, and its Game Lounges are the network that connects tabletop players around the world.

- **Every game community meets at its local Ludarium.** Local game store communities, chess clubs, Go clubs, the mahjong group that meets at the library, RPG campaigns, card leagues, game designers. All of them, as paying members.
- **A community center, not just a game room.** Events grow from each local community: game design seminars, tournaments, and possibly intellectual seminars and debates. Each lounge grows organically into what its city needs.
- **A place people see as part of their culture.** Somewhere locals go to socialize and belong.
- **Bigger than games, in the end.** The game is the hook and the medium. The point is people being social with each other: togethering.

Write copy that points toward this scale and warmth without overpromising what exists today. Today there are articles and tools; the first lounge is coming.

**The flywheel:** content builds an audience, the audience becomes a community, and the community supports revenue. Revenue from the digital business and corporate events funds the physical lounges. The site's first job is content and community; every other stream builds on that.

### The business, in phases

**Phase 1: content, community, digital revenue (now)**
- Articles and the newsletter build awareness and an email list
- Game tools (RPG Demo Library, Game Night Madness, more to come) attract and engage players
- Digital products sold through the Lemon Squeezy store, such as the RPG Demo Library PDFs and future tools
- The Ludarium Academy: courses in Game Design and Game Strategy for a specific set of games. Free lessons live on the site; a paid monthly membership that unlocks all courses runs on a hosted course platform
- Affiliate links to games, publishers and platforms where they genuinely help the reader
- No tip jar or Patreon (decided 2026-10-23). People who want to back The Ludarium do it by buying something real: a PDF, an Academy membership, and later a lounge membership

**Phase 1, in parallel: corporate events**
- A service for HR and L&D leaders: leadership development and team training taught through tabletop games
- Needs no physical space, so it is an early revenue source
- The site's job here is credibility and qualified inquiries

**Phase 2: The Ludarium Game Lounge, Indianapolis**
- A membership game lounge, like a coworking space where members come to play and spend time together instead of work
- A community center for every kind of tabletop group: clubs, leagues, store communities, and designers hold their meetups, events, and seminars there
- Members pay for what they actually want: the community and the space. Groups and clubs can be members too. The Ludarium does not sell physical games or products.
- Like a great local game store's events and community, minus the retail. Game stores are natural partners: they sell, The Ludarium hosts.
- Funded by Phase 1 revenue, not built first

**Phase 3: a network of lounges**
- Expand city by city, the way coworking brands do, until the lounges are the network that connects tabletop gaming worldwide
- One membership gets access to every Ludarium lounge, so a traveling member walks in and instantly belongs to the local community
- Each lounge reflects its city. Shared brand and membership; local programming

### What this means for the site now

- **Content first.** Articles are easy to publish, read well, and rank in search.
- **Every page earns a subscriber.** Newsletter signup (Kit) is the primary conversion everywhere.
- **The tools are a growth channel.** Make them easy to find and share, and cross-link them with articles.
- **Revenue paths are visible but quiet.** Store and affiliate links sit where they help, never as clutter or ads.
- **The Academy teaches in public.** Free lessons are real content that ranks and earns subscribers; the paid membership is the next step for people who want more.
- **Corporate events get a real sales page** with an inquiry form.
- **The lounge vision is public.** One page tells the story and collects interest for Indianapolis (a waitlist), which also proves demand.
- **Built to scale to many cities.** Use `/lounges/[city]/` for lounge pages so new cities slot in without restructuring.

Success, in order:
1. Articles that publish easily, read well, and rank
2. Newsletter subscribers (Kit)
3. Tool usage and sharing
4. Corporate event inquiries
5. Store sales, Academy memberships, and affiliate clicks
6. Indianapolis lounge waitlist signups

### Ruled out

Physical product or game sales, display advertising, donation or Patreon-style asks, and paywalled community content. Do not build toward any of these. (Paid Academy courses are allowed; they are structured lessons, not community. Community stays free.)

## Brand

- **Name:** The Ludarium (pronounced loo-DARE-ee-um)
- **MTP:** Togethering for a lifetime. Short form: Never stop playing.
- **Core line:** The game is the reason. The people are the point.
- **Togethering:** people coming together, usually in person, to share life. The game is the medium that starts and guides that time together.
- **Look and feel:** clean, high end, lots of whitespace, a little artsy. Never busy, never newspaper. Rounded cards everywhere. See `DESIGN-NOTES.md` for Levi's reference-site feedback and the design direction.
- **Logo:** a flat-top hex tile, like a game tile, with a round table and six chairs cut out of it in negative space. The game tile is the reason; the table is the people. Felt Green on light backgrounds, Parchment on dark. The path lives in `src/lib/brand.ts`; standalone files in `public/brand/`; usage notes in `docs/brand.md`. On hover the tile turns one step (60 degrees) and lands looking the same.
- **Colors:**
  - **Walnut** `#2B1E16` (ink): the game table everyone gathers around. Grounded, heirloom, not tech startup.
  - **Parchment** `#F6EFE3` (paper): rulebooks, cards, score sheets. Warm, not clinical white.
  - **Felt Green** `#2F5D50` (primary): the card-table felt. Links, focus, secondary buttons, the logo mark.
  - **Lamplight** `#E0A23B` (accent): the glow over a table late on game night. The togethering color, saved for calls to action.
  - **Stone** `#B9AD9C` (muted): quiet structure, borders, details.
  - Lamplight and Stone are too light for text on Parchment. In light mode use the deeper tints in `src/styles/tokens.css` for small text; never set body text in Lamplight or Stone on Parchment.
- **Tone:** warm, smart, a little playful. Inviting to newcomers, credible to hobbyists. Never gatekeepy.
- **Writing rules:** no em dashes anywhere (copy, headings, metadata, alt text). Plain words, short sentences.

## Tech stack

- **Framework:** Astro, static output
- **Articles:** Markdown or MDX in Astro content collections, with typed frontmatter
- **Styling:** plain CSS with design tokens as custom properties (colors, type scale, spacing). Light and dark modes.
- **Code home:** the `theludarium` GitHub organization (not Levi's personal account). This repo and every tool repo live there, so The Ludarium stays its own entity.
- **Hosting:** Cloudflare Pages, connected to this repo. Every push to `main` deploys to production; every other branch or pull request gets a preview URL. Use previews to show Levi changes before they go live.
- **Domain:** theludarium.com, attached to the Cloudflare Pages project as a custom domain (apex plus `www`, with `www` redirecting to the apex)
- **Newsletter:** Kit (formerly ConvertKit) form embed
- **Store:** Lemon Squeezy store named The Ludarium, linked out (not embedded checkout)
- **Academy courses:** a hosted course platform (to be chosen; Podia and Teachable are the front runners), linked out, ideally on `academy.theludarium.com`. The platform handles logins, billing, and the course player so this site stays static.

Keep it simple. No CMS, database, or user accounts. Add a dependency only when it clearly earns its place, and say why.

## Site map (v1)

| Path | Page | Purpose |
| --- | --- | --- |
| `/` | Home | Brand promise, latest articles, featured tools, newsletter signup |
| `/articles/` | Articles | All articles, filterable by category |
| `/articles/[slug]/` | Article | The reading experience; signup at the end |
| `/articles/category/[category]/` | Category | Articles in one category |
| `/play/` | Tools | Directory of the game tools, one card each |
| `/card-catalogue/` | Card Catalogue | Find games by feel; Play Profile and group picks, stored on the visitor's device |
| `/rpg-demo-library/` | RPG Demo Library | Play intro adventures of pen-and-paper RPGs before buying |
| `/game-night-madness/` | Game Night Madness | Tabletop game bracket app |
| `/academy/` | Academy | What the Academy is, the course catalog, membership pitch, waitlist or join link |
| `/academy/[course]/` | Course | One game course from `src/content/courses/` (Catan and the Game Shelf have their own pages): outcomes, lessons, teach sheet, signup, FAQ, unofficial notice. Plan and writer's guide: `docs/academy/COURSES.md` |
| `/academy/[course]/teach-sheet/` | Teach sheet | One-page printable for each game course; `scripts/teach-sheets.mjs` prints the PDFs |
| `/corporate-events/` | Corporate Events | Leadership and team training through tabletop games; inquiry form |
| `/lounges/` | The Lounges | The membership lounge vision and the network idea |
| `/lounges/indianapolis/` | Indianapolis | The first lounge: what it will be, plus a waitlist signup |
| `/about/` | About | Togethering, the mission, the story |
| `/newsletter/` | Newsletter | Dedicated signup page |
| `/store/` | Store | Short intro, then a link to the Lemon Squeezy store |
| `/search/` | Search | Site search on Pagefind, built from the finished site at build time (`src/lib/search.ts` sets each page's section); search analytics later |
| `/malaphors/` | Malaphors | Submission page printed in the malaphor field guide; Kit form tagged `malaphors` |
| `/affiliate-disclosure/` | Disclosure | Plain-language affiliate disclosure |
| `/privacy/` | Privacy | Privacy policy covering email signups and forms |
| `/terms/` | Terms | Terms of use |

Starting article categories (adjust once articles exist): Game Guides, Game Night, Togethering, Game Culture.

## Article content model

Frontmatter for every article:

```yaml
title: string
description: string        # 150-160 chars, used for meta description
pubDate: date
updatedDate: date          # optional
category: string           # one of the categories above
tags: string[]
heroImage: string          # optional, with heroAlt
heroAlt: string
draft: boolean             # drafts are not built
games: string[]            # optional, On the Table slugs of every game the page covers (see DECISIONS.md, 2026-10-24)
```

Each article page needs: reading time, a table of contents for long pieces, related articles, an end-of-article Kit signup, and correct Open Graph and Article structured data.

## Forms, affiliates, and the store

- **Newsletter and waitlist:** Kit forms. Tag waitlist signups by city (for example `lounge-indianapolis`) so future cities reuse the same pattern.
- **Academy waitlist:** Kit form tagged `academy`, plus a per-course tag (for example `academy-game-design`) so launches can email the right people.
- **Corporate event inquiries:** a form asking for name, company, role, email, team size, goals, and timing, which emails Levi. Use a Cloudflare Pages Function or a simple form service; propose the option and ask before choosing.
- **Affiliate links:** mark them `rel="sponsored noopener"`, keep a reusable component for them, and link the disclosure page wherever they appear.
- **Store:** link out to Lemon Squeezy. Product cards on the site can link to individual products.
- **Academy:** free lessons are site content (a content collection, like articles) and cross-link with related articles and tools. Paid lessons never live in this repo; enroll buttons link out to the course platform.
- **Teaching published games:** strategy and design commentary is fine. Publishers' art, rulebook text, and logos need permission.

## Landing pages

Every page whose job is one sign-up or inquiry (newsletter, lounge waitlists, Academy waitlist, corporate events) follows these rules. The home page hero follows the above-the-fold rules too.

**Above the fold**
1. **Headline:** stop the scroll and promise one clear outcome. Nothing more.
2. **Subheadline:** clarify that promise. Headline and subheadline work as a pair, like a video title and thumbnail; the second adds context to the first.
3. **Hero image:** proof of the headline. Show the thing they will get or the outcome they want.
4. **CTA button:** say what they get and how they get it. Nothing else.

**The form**
5. Ask only what is needed to qualify the lead. That can still mean 4 or 5 fields; qualified leads beat raw opt-ins.
6. More than 5 fields: split the form into steps.
7. Optional: a one-line description of the lead magnet that answers "why should I give you my email?"

**Below the fold**
8. Three bullets answering the three biggest objections, most common first.
9. Social proof only when needed, below the fold, and only for more complex offers (such as corporate events).

**Everything else**
10. Keep the page empty. Every element points attention at the one action.
11. Keep it short. Longer pages usually convert worse.
12. Fast and mobile-first. Compress images.
13. Link the legal pages (privacy, terms, disclosures).

**The razor:** if it does not increase the opt-in rate of qualified leads, cut it.

## SEO and performance baseline

- Unique title and meta description on every page; canonical URLs
- `sitemap.xml`, `robots.txt`, and an RSS feed for articles
- Open Graph and Twitter card images (generate a default branded one)
- Structured data: Organization site-wide, Article on article pages
- Lighthouse 95+ on performance, accessibility, best practices, and SEO
- Responsive down to 360px wide; accessible color contrast and keyboard navigation

## The game tools

Two tools already exist as separate projects. They should feel like part of The Ludarium (shared header, footer, fonts, and colors) while staying their own apps.

**RPG Demo Library**
- Repo `theludarium/rpg-demo-library` (moved from Levi's personal account 2026-10-20), included as the submodule `vendor/rpg-demo-library` and copied in at build by `scripts/rpg-demo-library.mjs`. Its GitHub Pages copy was turned off 2026-10-20, so theludarium.com is the only copy
- Must be served at `theludarium.com/rpg-demo-library/`, with deeper pages below that path
- Lets visitors play a short intro adventure of a pen-and-paper RPG before buying it
- Player dice rolls require a click to roll by default
- Focus is open-license games, with Levi's own PDFs sold through the Lemon Squeezy store
- No D&D 5e content. Do not add any game without confirmed permission or an open license.

**Game Night Madness**
- Levi's tabletop game bracket app: the group votes from their phones, round by round, until one game from the organizer's BoardGameGeek shelf is left
- Repo `theludarium/game-night-madness` (moved from Levi's personal account 2026-10-20), included as the submodule `vendor/game-night-madness` and copied in at build by `scripts/game-night-madness.mjs`. Served at `theludarium.com/game-night-madness/`, recolored in the site's palette and type
- The old address `the-ljaw.github.io/game-night-madness/` forwards here, keeping bracket codes (repo `The-LJAW/The-LJAW.github.io`). The repo's own GitHub Pages copy was turned off 2026-10-20, so theludarium.com is the only copy
- BGG data comes through its own helper Worker (`gnm-bgg`, in Levi's Cloudflare account), which only answers the sites in its `ALLOWED_ORIGINS`. BGG approved it as non-commercial: keep this page free of affiliate links, ads, and paid features until the commercial license comes through

**Integration approach:** each tool keeps its own repo in the `theludarium` org, and this site includes them at build time:
- Add each tool repo as a git submodule (or pull it in a build script).
- During the site build, build each tool with its base path set to its URL path (for example `/rpg-demo-library/`) and copy the output into the matching folder of the final site.
- One Cloudflare Pages deploy then serves the whole domain. A change to a tool goes live by updating its submodule here (automate with a GitHub Action later if useful).

**Card Catalog (new, 2026-10-17)**
- A library-style catalog of board games (call-number shelves plus six feel dimensions, including The Ludarium's own Table Talk) and a tracker where subscribers log plays, build a Play Profile, and get picks for a whole table
- Live at `/card-catalogue/` (Levi's spelling for the product name). **Local-first** (Levi's decision, 2026-10-18): each visitor's ratings, plays, shelves, guests, and friends live in their own browser's localStorage, with backup export and import. No accounts, no database, nothing sent to a server. Friends join a game night by trading a table code. Accounts and sync can come later without a rebuild
- Code: engine `src/lib/card-catalogue/engine.ts` (pure, follows the spec exactly), markup `src/lib/card-catalogue/render.ts`, app `src/scripts/card-catalogue.ts`, page `src/pages/card-catalogue/index.astro`, catalog data `src/data/card-catalogue.json`
- Spec: `docs/card-catalog/catalog-system.md`. History and original handoff: `docs/card-catalog/HANDOFF.md`. Prototype reference: `tools/card-catalog/`. Article: `src/content/articles/how-we-catalog-board-games-by-how-they-feel.md`
- Not yet ported: the AI Librarian (needs a server-side Claude call) and BoardGameGeek import (waits on the token and commercial license)
- BoardGameGeek bridge: `workers/bgg/`, a separate Cloudflare Worker (its own `package.json` and tests). BGG data needs a commercial license before it appears next to affiliate links or paid features; Levi is applying

If a tool cannot run under a sub-path cleanly, stop and propose alternatives (such as a Cloudflare route to a separate Pages project) rather than hacking around it. Either way, apply the shared site chrome (header, footer, design tokens) so the tools look native.

## Out of scope for now

On-site payments, user accounts, membership sign-up and billing, lounge booking, and a public events calendar. These belong to Phase 2; structure the site so they can be added later without a rebuild. Academy logins and billing are handled by the course platform, not this site.

## Working with Levi

- Simplest viable approach first; flag tradeoffs honestly
- Ask before decisions that are hard to reverse (hosting, domain DNS, moving a tool's repo)
- Show progress early: get a deployable skeleton up before polishing
- Corrections: fix the specific thing, no defense
- Keep a short `DECISIONS.md` log of choices made and why

## Build order

1. Astro skeleton, design tokens, base layout, header and footer
2. Article content collection, article page, articles index, categories
3. Home, About, Newsletter (with Kit embed), Store link page, Disclosure and Privacy
4. Corporate Events page with the inquiry form; Lounges and Indianapolis pages with the waitlist; Academy landing page with its waitlist
5. SEO baseline: sitemap, RSS, metadata, structured data, OG images
6. `/play/` directory and integration of RPG Demo Library and Game Night Madness
7. Connect Cloudflare Pages and attach theludarium.com (Levi handles account and DNS steps; give him exact instructions)
8. Three seed articles so the site launches with content
