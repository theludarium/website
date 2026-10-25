# Academy game courses: how to write one

Every Academy course except Catan (its own level-based system) and the Game Shelf (an article series) is a **game course**: one YAML file, one folder of lessons, and one original diagram. The site turns them into a course page, lesson pages, and a printable teach sheet. The plan behind them is Levi's "Ludarium Content Plan: Academy, TCGs, and the Hotness" (October 24, 2026).

## Files

| File | What it is |
| --- | --- |
| `src/content/courses/<slug>.yaml` | The course: title, notice, outcomes, FAQ, teach sheet |
| `src/content/course-lessons/<slug>/<lesson-slug>.md` | One file per lesson; the file name is the URL slug |
| `public/academy/<slug>/setup.svg` | The original setup diagram (TCG: the play area), viewBox `0 0 480 320` |
| `public/academy/<slug>/mock-card.svg` | TCG only: an original mock card for the "reading a card" lesson |

URLs: `/academy/<slug>/`, `/academy/<slug>/<lesson-slug>/`, `/academy/<slug>/teach-sheet/`. The slug is the game in lowercase kebab case (`carcassonne`, `ticket-to-ride`, `pokemon-tcg`).

Check a course before handing it in: `node scripts/check-course.mjs <slug>`. Zero errors is required. Do not run `npm run build` while other writers are working.

## Formats

| Format | Lessons | Public lessons | Notes |
| --- | --- | --- | --- |
| `full` | 8 | 1 and 2 | Lessons 3 to 8 are unlisted pages reached from the emails |
| `masterclass` | 7 | 1 | Lesson 1 is learn and teach together; lessons 2 to 7 go deep (they draft a paid guide later, but the free lessons must stand on their own) |
| `teach-tonight` | 2 | both | The teach sheet is the product. Lesson 1: how to play, walking the sheet. Lesson 2: run a great first game |
| `tcg` | 8 | all | Every lesson is public, never gated |

### Full course lessons

1. **Learn to play** ("How to Play <Game>"): the rules in our own words, with the setup diagram (`![alt](/academy/<slug>/setup.svg)`).
2. **Teach it in ten minutes** ("How to Teach <Game>"): a host script in the order you would say it, linked to the teach sheet at `/academy/<slug>/teach-sheet/`.
3. **Your first three games**: the beginner mistakes, taken from the rulebook, the official FAQ, and common rules questions. Include one `<!-- AT OUR TABLE: ... -->` placeholder (see below).
4. **Openings.**
5. **The midgame**: engine, tempo, reading the table.
6. **Endgame and scoring math.**
7. **Player counts, variants, and expansions**: the home for product mentions (see Affiliate markers).
8. **Compete**: tournament formats, the World Boardgaming Championships if the game has an event there, the official circuit if one exists, and where to find local play.

### TCG course lessons

1. **Your first product**: which starter to buy and what to skip.
2. **How a turn works**, with the play-area diagram (`setup.svg`).
3. **Reading a card**, with the original mock card (`mock-card.svg`).
4. **Teach it in ten minutes**, linked to the teach sheet.
5. **Your first upgrades**: buying singles on a budget.
6. **Your first store night**: what to bring, how the entry-level event runs, table etiquette.
7. **Prerelease survival**: opening a sealed kit and building a deck from it.
8. **What comes next**: the competitive path and local play. For Magic, point to the Cube articles on this site.

## The course YAML

```yaml
title: "Tile by Tile"                      # our own course title; the game is named in `game`
game: "Carcassonne"
format: full                               # full | masterclass | teach-tonight | tcg
order: 110                                 # catalog order: wave * 100 + position
wave: "1"
draft: false
publisher: "Z-Man Games"
notice: "Unofficial. Not affiliated with Hans im Glück or Z-Man Games. Carcassonne is a trademark of Hans im Glück."
rulesEdition: "Carcassonne rulebook, third edition (2021)"
rulesSource: "https://..."                # the official rules page or PDF you used
players: "2 to 5"
playTime: "35 to 45 minutes"
ages: "Ages 7 and up"
promise: "One sentence: what the course does for the reader."
description: "150 to 160 characters exactly. Course page meta description and catalog card."
audience:
  - "Who it is for, one line each (2 to 4 lines)."
afterLesson3: "What you can do after lesson 3."
afterLesson8: "What you can do after the last lesson."
faq:                                       # 3 to 6; feeds FAQPage schema
  - q: "Question in the words people search?"
    a: "Two or three plain sentences."
teachSheet:
  goal: "One sentence: how you win."
  setup: ["2 to 8 short steps"]
  turn: ["2 to 8 short steps"]
  scoring: ["1 to 8 lines"]
  endGame: "When and how the game ends."
  tips: ["exactly", "three", "tips"]
diagramAlt: "What the setup diagram shows, for screen readers."
related: ["article-slug"]                 # existing articles in src/content/articles about this game
games: [carcassonne]                      # On the Table slugs (theludarium/on-the-table data/games_seed.csv); leave out games not in that list
tcg:                                       # TCG only
  starter: "The beginner product"
  firstEvent: "The entry-level store event"
  rulesAsOf: "the set name the lessons are current to"
```

The teach sheet must fit on one printed page: keep every step under about 20 words.

## Lesson frontmatter

```yaml
---
title: "How to Play Carcassonne"
description: "150 to 160 characters exactly, with the top keyword."
course: carcassonne
order: 1
emailSubject: "A short, specific subject line a friend would write"
pubDate: 2026-10-24
draft: false
oneIdea: "The single idea of the lesson, one or two sentences."
tryThis: "One concrete thing to do at your next game."
nextTeaser: "One or two sentences about the next lesson (omit on the last lesson)."
---
```

The body starts with an opening paragraph, then `##` sections. 600 to 900 words (teach-tonight lessons can be shorter). One idea per section. Do not repeat `oneIdea` or `tryThis` in the body; the page shows them in their own boxes.

## Voice and hard rules

- Warm, smart, a little playful. Plain words, short sentences. Inviting to newcomers, credible to hobbyists, never gatekeepy.
- **No em dashes or en dashes anywhere.** Use commas, colons, periods, or "to" for ranges.
- Never use: genuinely, honestly, straightforward, delve, elevate, game-changer, unlock, journey, ultimate, must-have, "dive in".
- **No invented experience.** Do not write "at our table," "when we played," or any first-person story of play. Where a lesson would be better with Levi's own notes, leave a marked placeholder instead: `<!-- AT OUR TABLE: what Levi should add here, in one line -->`. Lesson 3 always has one.
- **Ludarium events do not exist yet.** No Ludarium game nights, learn-to-play nights, leagues, or a lounge that is open. For local play, point to the publisher's store locator or organized-play program, and to the Indianapolis list at `/lounges/indianapolis/` ("first word on local learn-to-play nights as The Ludarium grows").
- **Rules accuracy.** Read the current official rulebook (the publisher's site or PDF) before writing, and use its terms. Every rule statement must match it. When you cannot confirm something, phrase it generally or leave `<!-- VERIFY: what to check -->`. Name the edition in `rulesEdition`.
- **Facts and numbers** (tournaments, dates, prices, player counts) come from a source you opened. Prices: say "about" and avoid them where you can. If unsure, leave a VERIFY marker rather than guess.
- **Our own words and art only.** No publisher art, logos, card images, or BGG images. Quote at most one short sentence of a rulebook, and only when the exact wording matters.
- **Notice line.** Follow the publisher's fan or IP policy. Default pattern: "Unofficial. Not affiliated with <publisher>. <Game> is a trademark of <owner>." Magic courses use the Wizards Fan Content Policy notice word for word; Riftbound uses Riot's required notice word for word.
- **TCG naming.** The course title is ours; the game appears only descriptively ("an unofficial beginner's course for the Pokémon TCG"). No logos, no card art, rules in our own words.
- Link to existing Ludarium articles about the game where they help (search `src/content/articles/` for the game name), and list them in `related`.

## Affiliate markers

Affiliate programs are not confirmed yet. Mention products by name and link to the publisher's own product page with a plain link, then put `<!-- AFFILIATE: product name -->` right after the paragraph. The build lists every marker so Levi can swap in affiliate links and the disclosure later. Board games: lesson 7. TCG: lessons 1 and 5.

## The setup diagram

An original SVG, `viewBox="0 0 480 320"`, drawn from simple shapes: the table layout at setup (TCG: the play area zones). Label every zone in a plain sans-serif font (`font-family="system-ui, sans-serif"`), 12 to 14px. Use the brand palette: Parchment `#F6EFE3` background, Walnut `#2B1E16` ink and labels, Felt Green `#2F5D50`, Lamplight `#E0A23B`, Stone `#B9AD9C`. No embedded images, no publisher art, no logos. It must be accurate to the setup the rules describe.

The TCG mock card (`mock-card.svg`, viewBox `0 0 300 420`) is an invented card in the game's layout with every part labeled (name, cost, type, text box, stats), using made-up card text.
