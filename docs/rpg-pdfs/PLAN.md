# RPG Demo Library: the full PDFs

Plan for the eleven paid PDFs behind the RPG Demo Library. Decided with Levi on 2026-10-20.

## Status, 2026-10-20

All eleven books are written and built, in the private repo `theludarium/rpg-adventures` (manuscripts in Markdown, built to PDF with Paged.js and headless Chrome; `node tools/build.mjs books/<slug>`). None has been playtested or put on sale yet. Actual page counts, which ran longer than the estimates below because every scene has every outcome written out:

| Book | Pages | PDF price |
|---|---|---|
| The Bell Beneath the Fen (Ironsworn) | 90 | $9.99 |
| Mayday at the Glass Moon (Lasers & Feelings) | 64 | $9.99 |
| The Silence at Well Nine (24XX) | 63 | $9.99 |
| The Dead Baron's Mint (Knave 1e) | 64 | $9.99 |
| The Long Sleep of the Lodestar (Starforged) | 111 | $9.99 |
| Thunder on the Silver Meridian (Fate Condensed) | 92 | $9.99 |
| The Cinderhouse Score (Forged in the Dark) | 105 | $9.99 |
| The Salt King's Stair (Dungeon World) | 109 | $9.99 |
| The Glass Comet (Cypher System) | 107 | $9.99 |
| The Sleepless Mill (Pathfinder 2e compatible) | 99 | $9.99 |
| Encore! (Skellies, CC BY-SA) | 54 | $9.99 |

Every PDF is $9.99 (Levi's call, 2026-10-20), set in the library's `store.js`. License notes and pre-launch checks for each book are in that repo's `docs/LICENSES.md`; the print plan is in `docs/KDP-PLAN.md`.

## What each PDF is

**One book per game: a complete adventure plus a full player's handbook for that game's open rules.** A buyer needs nothing else to play. This keeps the promise the demos already make ("so you need nothing else to play"), and it gives each book a reason to exist next to the official rules, several of which are free.

Every book ends by pointing readers to the official game from its creators. The library's promise is "try the game, then buy the book," and these PDFs keep it.

### The standard every book follows

**Part 1: Player's Handbook**
- What the game is, how a session flows, and the core dice mechanic, all in our own words
- The complete open rules the license allows, rewritten clearly. Where the license allows, quoted rules text is marked as such
- Character creation, with every option the license opens
- How to play solo (every demo is solo), plus a note for playing with a GM or group

**Part 2: The Adventure**
- Act One, expanded from the demo, so the book stands alone
- Acts Two and Three, as promised on each demo's product card
- Every ending, plus ways to keep playing
- NPCs, foes, and locations, with full stats in the game's own format

**Part 3: Toolkit**
- Ready-to-play characters
- Oracles and random tables
- A one-page rules reference
- Printable sheets

**Back matter**
- A license and credits page, with each license's exact required wording
- A "not an official product" statement
- A page saying where to buy the official game

## How we make them

- **Manuscripts live in a new private repo, `theludarium/rpg-adventures`.** They are paid products, so they never go in the public `rpg-demo-library` or `website` repos. The demos stay public.
- **Write in Markdown, lay out in HTML and CSS, and export to PDF.** Each book reuses its demo's fonts and colors, so the book, the card, and the demo look like one product. Print styles add page numbers, running heads, and a table of contents.
- **Use no publisher art, logos, or trade dress.** Use typography, ornaments, maps, and original art only. Use only the compatibility logos each license grants (for example, Powered by Fate, Forged in the Dark, and Compatible with the Cypher System).
- **Run a rules check.** Every rule is checked against the official SRD or reference text it comes from, and the sources are listed.
- **Playtest.** Levi plays each book solo, start to finish, before it ships. A book is done when it plays through with no missing rule.
- **Ship.** Upload the book to Lemon Squeezy, paste the checkout link into the library's `store.js`, and update the page count and price.

### Decisions still open for Levi
1. **Price.** A book with full rules runs about 45 to 120 pages, not the 30 to 40 the demos list now. The suggested prices below assume that. Final prices go in `store.js`.
2. **AI disclosure.** None of these eleven licenses bans AI-assisted work (the research ruled out the ones that do). A short, honest credit line still protects trust. Suggested wording: "Written with AI assistance, then edited and playtested by Levi Wilson."
3. **Art.** Ship as typographic books first, and add art later if sales justify it.
4. **Who to credit.** The current demos say "© 2026 RPG Demo Library." Change this to The Ludarium (or Levi's business name, once it's set in `src/lib/config.ts`).

## The plan for each game

Listed in recommended build order. Build first the books whose rules are short and fully open, so the format gets proven on easy ones.

### 1. The Bell Beneath the Fen (Ironsworn): pilot book
- **License:** Ironsworn SRD, CC BY 4.0 (moves, assets, oracles, most of chapters 1 to 3, Delve chapters 1 and 2). The rest of the rulebook is CC BY-NC-SA, which is non-commercial, so **leave it out**. Write our own text where the SRD has gaps.
- **Handbook:** the complete moves (adventure, relationship, combat, suffer, quest, fate), progress tracks, momentum, debilities, the full asset deck, the core oracles, and solo play.
- **Adventure:** Acts Two and Three: the drowned chapel, Sigrun the eel-wife, the drowned faithful, and Merewyn, the Hollow Abbess. Three endings, a failure ending, and three vows to keep playing.
- **Toolkit:** three pregenerated characters with full asset text, four fen oracles, four new foes, and character and track sheets.
- **Credit:** the Tomkin CC BY wording already in the README, plus "not an official Ironsworn product."
- **Estimate:** about 70 pages. **Suggested price:** $9.
- **Why first:** it has the biggest solo audience, the clearest license split, and its rules data already exists in Datasworn.

### 2. Mayday at the Glass Moon (Lasers & Feelings)
- **License:** CC BY 4.0, covering the whole one-page game. The full rules fit in two pages.
- **Handbook:** the entire game in our own words, extended: solo rules, Resonance, ship play, and the Hull Strain and Insight tracks from the demo.
- **Adventure:** boarders, WICK's confession, the canyon descent, the Echo Choir, the Songdrill, and the Heart of Calla. Four endings.
- **Toolkit:** four crew and the Starling's Wager, eight threats, a solo oracle, a threat generator, 15 tables, and crew, ship, and track sheets.
- **Credit:** John Harper, CC BY 4.0. Not affiliated with John Harper or One Seven Design.
- **Estimate:** about 45 pages. **Suggested price:** $6.

### 3. The Silence at Well Nine (24XX)
- **License:** 24XX SRD v1.4, CC BY 4.0, covering the text and layout. Credit "24XX rules are CC BY Jason Tocci." **Don't imitate the look of Jason Tocci's 2400 series.**
- **Handbook:** Underice, a complete 24XX game: the rules, six roles, three origins, gear, and the Ice Oracle for solo play. 24XX games are meant to be complete games, so this is the natural format.
- **Adventure:** Doctor Sallis's lab, the glowing thing in the moon pool, and the 300-meter drop to Habitat Seven. Four endings.
- **Toolkit:** pregenerated characters, six threats, twelve tables (including a ticket generator for new jobs), and a sheet and tracker.
- **Estimate:** about 45 pages. **Suggested price:** $7.

### 4. The Dead Baron's Mint (Knave 1e)
- **License:** Knave 1e, CC BY 4.0, covering the whole text. Ben Milton says it can be used commercially with credit. **Use Knave 1e only;** Knave 2e has no public license.
- **Handbook:** the complete Knave 1e rules: abilities, item slots, saves, combat, spellbooks, leveling, and the spell list, plus solo procedures.
- **Adventure:** the furnace floor, the ghost assayer, the flooded treasury, Grisel Penn, and the Brass Baron. Five endings plus a Tarnished ending.
- **Toolkit:** three knaves, a cutaway map of the mint, the people of Cobble Ash, nine foes, six original spellbooks, and ten tables including a solo oracle.
- **Estimate:** about 60 pages. **Suggested price:** $7.

### 5. The Long Sleep of the Lodestar (Ironsworn: Starforged)
- **License:** Starforged Reference Guide and assets, CC BY 4.0. Same split as Ironsworn: leave out the non-commercial text.
- **Handbook:** the complete Starforged moves, assets, and core, space, and derelict oracles, plus solo play. It reuses the Ironsworn book's structure and layout.
- **Adventure:** the sleeping ship, Teodor the last one awake, Cantor the ship's mind, and Mother Kroll's last bargain. Three plans, three endings, a failure ending, and three vows.
- **Toolkit:** three pregens, six Lodestar oracles, five threats, and character, starship, and track sheets.
- **Estimate:** about 90 pages, since the Starforged asset and oracle text is long. **Suggested price:** $10.

### 6. Thunder on the Silver Meridian (Fate Condensed)
- **License:** Fate Condensed SRD, CC BY 3.0, covering the full text. "Powered by Fate" logo allowed. **No Fate or Evil Hat logos,** and "Fate" stays out of the title.
- **Handbook:** the complete Fate Condensed rules (aspects, skills, stunts, fate points, conflicts, advancement), plus solo Fate guidance.
- **Adventure:** the Corvid Gorge trestle, the airship Albatross, the catwalk duel, and the Copper King's Storm-Mast. Four endings, including one where the storm wins.
- **Toolkit:** three heroes, foes and allies with full stats, eight oracle tables, and sheets.
- **Estimate:** about 80 pages. **Suggested price:** $9.

### 7. The Cinderhouse Score (Forged in the Dark)
- **License:** Blades in the Dark SRD, CC BY 3.0. **Leave out Duskwall (the setting) and the Blades art.** "Blades in the Dark" must not appear in the title. The "Forged in the Dark" logo is allowed.
- **Handbook:** the action roll, position and effect, stress and trauma, harm, the score structure, engagement, flashbacks, Devil's Bargains, downtime, heat, and the playbooks the SRD opens. It's written for our own city, Vesk.
- **Adventure:** the Hushway, the Breathing Hall, the Tally-engine, and the night the city's breath goes wrong. Five endings.
- **Toolkit:** three scoundrels, a Vesk primer, foes and factions, Kettle tables (oracle, trouble, Devil's Bargains, entanglements), and scoundrel and score sheets.
- **Estimate:** about 85 pages. **Suggested price:** $9.

### 8. The Salt King's Stair (Dungeon World)
- **License:** Dungeon World text, CC BY 3.0. The text includes SRD 5.1 material (CC BY 4.0), so credit both, as the demo does. Official layout and art are not covered.
- **Handbook:** the basic and special moves, how moves and GM moves work, and the classes. **Scope decision:** the full text has eight classes and runs very long. Recommend the four classes the adventure uses (Fighter, Thief, Wizard, Cleric), complete through level 5, with first-level spells and solo GM procedures.
- **Adventure:** the Weeping Steps, the Glass Gallery, the Pickled Court, the Sweetwater Cistern, and the throne below the sea. Four endings plus a failure ending.
- **Toolkit:** four pregens, six monsters, a front, nine solo tables, and sheets.
- **Estimate:** about 100 pages. **Suggested price:** $10.

### 9. The Glass Comet (Cypher System)
- **License:** the Cypher System Open License (CSOL), which covers nearly all the core rules in the CSRD. A product must carry the CSOL notice. The "Compatible with the Cypher System" logo is optional. **No Numenera or other Monte Cook Games settings,** and "Cypher System" stays out of the title.
- **Handbook:** the core mechanic, Effort, Edge, pools, cyphers, GM intrusions, the XP rules, and character creation. **Scope:** the full CSRD is huge. Recommend all four types, a curated set of descriptors and foci that fit a Weird West game, tiers 1 to 2, and solo rules.
- **Adventure:** the Concern camp, Dr. Hesper Quill, Silas Grieve, Colonel Vance, and the Lodestar. Four endings, including a failure ending.
- **Toolkit:** three first-tier characters, twenty starglass cyphers, six creatures, an intrusion die, a d20 oracle, six tables, and sheets.
- **Estimate:** about 100 pages. **Suggested price:** $10.

### 10. The Sleepless Mill (Pathfinder Second Edition compatible)
- **License:** ORC License, covering the game mechanics from Player Core and GM Core. **Leave out Paizo's lore, names, art, and setting (Golarion).** Any new mechanics we write must also be released under ORC.
- **Verify before launch:** what Paizo currently allows when saying "compatible with Pathfinder Second Edition" on a cover and store page. ORC does not grant trademark rights, and Paizo runs a separate compatibility program.
- **Handbook:** the three-action economy, checks and degrees of success, conditions, and character creation for the three pregens' ancestries and classes (human, dwarf, and halfling; fighter, cleric, and rogue), complete for levels 1 and 2. **Scope:** a full Player Core is 400+ pages, so it is out of scope.
- **Adventure:** the sleepwalkers, the Sackman in the loft, Oda's confession, and the Hush beneath the millstone. Three endings plus a failure ending, and a level-up to 2 for the finale.
- **Toolkit:** three heroes, five foes and a hazard, solo tactics tables, eight oracle tables, and sheets.
- **Estimate:** about 110 pages. **Suggested price:** $12.
- **Why last of the paid ten:** it has the biggest rules surface and the strictest trademark line, and it needs the most care.

### 11. A Skellies adventure (Skellies)
- **License:** CC BY-SA 4.0, covering the whole book. **Share-alike:** our book's text must also be CC BY-SA 4.0. Buyers may legally share it for free. Levi chose to sell it anyway.
- **The adventure must be new.** The demo plays "Clogged!", the creators' own free example adventure. Selling that would mean charging for their free text, so this book gets an original adventure that continues Skald's household, built from the same rules.
- **Handbook:** the complete Skellies rules in our own words: Bones, Brains, body parts, Lich's Favor, rolling, and the lich's household, plus solo play.
- **Toolkit:** a pregenerated skelly, the household, tables, and sheets.
- **Credit:** Griffin Macaulay and John Webb, Criir / The Griffon's Saddlebag, CC BY-SA 4.0. Skellies is a trademark of The Griffon's Saddlebag B.V. Not affiliated or endorsed. **Before launch, confirm the creators accept a paid product named "for Skellies."**
- **Estimate:** about 40 pages. **Suggested price:** $4.
- **Store and demo changes:** add a `store.js` entry, then add a product card at the end of the Skellies demo, as the other ten have.

## Order and pace

| # | Book | Game | Pages | Price |
|---|---|---|---|---|
| 1 | The Bell Beneath the Fen | Ironsworn | ~70 | $9 |
| 2 | Mayday at the Glass Moon | Lasers & Feelings | ~45 | $6 |
| 3 | The Silence at Well Nine | 24XX | ~45 | $7 |
| 4 | The Dead Baron's Mint | Knave 1e | ~60 | $7 |
| 5 | The Long Sleep of the Lodestar | Starforged | ~90 | $10 |
| 6 | Thunder on the Silver Meridian | Fate Condensed | ~80 | $9 |
| 7 | The Cinderhouse Score | Forged in the Dark | ~85 | $9 |
| 8 | The Salt King's Stair | Dungeon World | ~100 | $10 |
| 9 | The Glass Comet | Cypher System | ~100 | $10 |
| 10 | The Sleepless Mill | Pathfinder 2e (compatible) | ~110 | $12 |
| 11 | A Skellies adventure | Skellies | ~40 | $4 |

- **Ship the pilot first.** Bell Beneath the Fen proves the template, the layout, the rules check, and the store flow. After that, each book reuses the same parts.
- **Sell as each book is ready.** Each demo keeps saying "coming soon" until its own book ships, so nothing is sold before it exists.
- **Bundle later.** Once five or more books exist, offer a "Library Pass" bundle at a discount.

This is research, not legal advice. Re-read each license page before its book launches, and keep a dated screenshot of the version relied on.
