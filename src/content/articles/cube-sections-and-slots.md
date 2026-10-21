---
title: "Cube Slot Design: Sections and the Spreadsheet"
description: "Cube slot design turns a pile of good cards into a format. How to break a cube into sections and named slots, plus the columns your spreadsheet needs."
pubDate: 2026-10-18
category: Magic & Cube
tags: ["cube slot design", "cube spreadsheet", "cube sections", "cube slots", "cube list structure", "how to organize a cube", "Cube Commonwealth"]
draft: true
---
Cube slot design is the habit of deciding what a card is for before deciding which card it is. A cube with 540 good cards and no structure plays like a pile. A cube with 540 named slots, each filled by the best card for that job, plays like a format. The difference is not the cards. It is the spreadsheet behind them.

This article covers how to break a cube into sections, how to turn sections into slots, and what columns your list needs so that every future update is a decision instead of a guess.

## What is the difference between a section and a slot?

A **section** is a top-level bucket: white, blue, black, red, green, gold, colorless, lands. Every cube has them, and most owners can recite their section counts from memory. A 540 might be 70 per color, 60 gold, 40 colorless, 90 lands. Sections tell you how big each color is. They do not tell you what is in it.

A **slot** is a job inside a section. "White, one-drop creature, aggro" is a slot. "Black, unconditional removal, two mana" is a slot. "Gold, blue-red, spells signpost" is a slot. A section of 70 white cards is really 70 slots, and when you write them down you discover that about 55 are obvious and 15 are open to argument. Those 15 are where the design lives.

The reason to think in slots is that cards are replaceable and jobs are not. When a new set prints a better two-mana black removal spell, you swap it into that slot and the cube's shape does not move. When you add a card because it is good, with no slot in mind, the cube's shape moves a little every time, and after two years you cannot say why aggro stopped working.

## How do you break a color into slots?

Start with roles, then with mana values, then with the specific card. Here is a worked example for white in a 540 unpowered cube with 70 white slots. The counts are house guidelines; the method is the point.

| Role | Count | Mana value spread |
|---|---|---|
| Aggressive creatures | 26 | 8 one-drops, 10 two-drops, 6 three-drops, 2 four-drops |
| Midrange and value creatures | 12 | 3 three-drops, 5 four-drops, 3 five-drops, 1 six-drop |
| Spot removal | 10 | 4 at one mana, 4 at two, 2 at three or more |
| Board wipes | 4 | 3 at four mana, 1 at five or more |
| Equipment and auras | 3 | |
| Card advantage and recursion | 5 | |
| Hate and utility | 4 | Graveyard, artifact, and tax effects |
| Flex | 6 | Whatever the cube needs this season |
| **Total** | **70** | |

Three things to notice.

The one-drop count is a design decision. Eight white one-drops in 70 is what it takes to make white aggro draftable at 540. Drop it to four and white aggro stops existing, no matter how good the four are.

The flex slots are written down. Six slots that can be anything is honest. Pretending every slot is locked leads to owners squeezing a seventh board wipe into a "creature" slot because they like the card.

Every row is a question you can answer when a set drops. "Is this new card better than my worst two-mana removal spell?" is a real question. "Is this new card good?" is not. Our set-evaluation guide goes deeper on that question.

## What does the gold section look like in slots?

Gold is where slot design matters most, because gold cards are the loudest signals in a draft. A gold section of 60 in a 540 is six per color pair. Our template:

- **2 signposts** per pair: the cards that tell a drafter what the pair does. Ideally one cheap and one at three or four mana.
- **2 payoffs** per pair: strong in the lane, playable outside it.
- **1 flexible good card** per pair: a card any deck in those colors wants.
- **1 open slot** per pair: rotates, tests new cards, or doubles one of the above.

That structure keeps every pair legible. When a pair feels unsupported, the slot list tells you whether it is missing a signpost or just has weak payoffs, which are different fixes. [How big should the gold section be](/articles/cube-gold-section/) covers the count question in full.

*If this is useful, the newsletter sends more like it.*

## What columns does the spreadsheet need?

Most owners start with one column: the card name. Here is the minimum that makes the list a design tool, and then a few that pay off later.

**Required columns**

1. **Name.**
2. **Section.** W, U, B, R, G, gold (with pair), colorless, land.
3. **Mana value.**
4. **Role.** One of a short, fixed list: aggro, midrange, control, removal, wipe, draw, ramp, fixing, finisher, lane support, hate, flex. Pick your list and do not grow it past a dozen.
5. **Lane.** Which archetype it supports, if any. Blank is allowed and useful: blank cards are your good-stuff layer.
6. **Type.** Creature or non-creature. You will want the creature count per color at a glance.

**Columns that pay off**

7. **Date added.** Cards that have been in since day one and never get picked are easier to find.
8. **Status.** Core, testing, on notice. Three values. "On notice" means it is the next cut in its slot when a better card appears.
9. **Replaces.** For any card added in the last year, which card left for it. This is your change log in miniature.
10. **Notes.** Why it is here. Future you will not remember.

With these columns a pivot table answers every structural question in seconds: how many one-drops per color, how many removal spells at two mana, how many cards does the blue-red lane actually have, how many "on notice" cards are there in green. Without them, you answer those questions by laying out the cube on a table, which people do, once, and then never update.

CubeCobra's tags, notes and status field cover most of this inside the site, it records each card's date added, and its analysis tab shows curves and type counts per color without any spreadsheet at all ([cubecobra.com](https://cubecobra.com)). We still keep a sheet because tags are faster to query in bulk, but either works.

## How do slots change the way you update?

Three ways, all for the better.

**Every change is a swap, not an add.** The question is never "should this be in the cube" but "which slot does it take, and is it better than the card in it." If no slot fits, the card does not go in, however good it is. This single rule prevents most cube bloat.

**You can see structural drift.** If your sheet shows that the last fifteen white adds were all three- and four-drops, you know why white aggro is dying before a drafter complains. Set a count per slot and the sheet shows you when you break it.

**Cuts stop being painful.** Cutting a card you like is hard. Replacing the weakest card in a named slot is a chore. Naming the slot turns the first into the second.

The one danger is rigidity. A slot list is a model of the cube you want, not a law. When a card appears that does something your slots did not anticipate, the right move is sometimes to change the slot list. Do it on purpose and write it down. The sheet should describe the cube you have, with a column for the cube you are moving toward.

## A starting slot list for a 540

If you want a template to copy, here is a complete section breakdown that we have used as a base. Adjust the counts for your power level and fixing philosophy. Every number is a house guideline.

- **Each color (70):** 26 aggro creatures, 12 midrange creatures, 10 to 14 removal or interaction (more in black and red, fewer in green, which gets ramp instead), 3 to 5 draw or card advantage, 3 to 4 wipes or sweeper-equivalents (white and black and red), 3 equipment or auras, 4 hate and utility, and flex slots to reach 70 (green spends its missing removal and wipes on ramp).
- **Gold (60):** six per pair, structured as above.
- **Colorless (40):** 12 mana rocks, 8 equipment, 10 artifact creatures, 10 utility.
- **Lands (90):** two full dual cycles (20), a fetchable or fast cycle (10), three more dual cycles (30), a creature-land cycle (10), five-color lands (10), and utility lands (10). Most of these slots fix mana; the utility lands are the flexible ones.

Adding those up gives 350 + 60 + 40 + 90 = 540. Argue with any line. The point is that you can.

The game is the reason. The people are the point. The spreadsheet is just how you make sure the game shows up the same way every week.

## FAQ

### What sections should a cube have?

The five colors, gold (multicolor), colorless, and lands. Most owners also split each color by role and mana value, which is where slot design begins.

### How do I organize a cube list?

Track at least name, section, mana value, role, lane, and creature or non-creature for every card. Use a spreadsheet or CubeCobra tags, and query counts per role before every update.

### How many cards per color should be creatures?

House guidelines range from 50 to 65 percent in a typical unpowered cube, higher in green and white, lower in blue. The ratio matters more than the raw count, and it should be a slot decision, not an accident.

### What are flex slots in a cube?

Slots deliberately left without a fixed role so the owner can test new cards or shore up a weak lane without disturbing the core structure. Four to eight per color is common.

## Keep building

The newsletter sends new cube design pieces. If you are in Indianapolis, [Cube Commonwealth](/articles/cube-draft-indianapolis/), our cube group, is relaunching as part of The Ludarium; subscribers hear first when the first night is set.
