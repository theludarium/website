---
title: "Archetype Density: How Many Lanes a Cube Can Support"
description: "How many cube archetypes can a 360 or 540 list really support? A working count of cards per lane, the overlap trick, and when adding a deck removes one."
pubDate: 2026-10-18
category: Magic & Cube
tags: ["cube archetypes count", "archetype density", "cube lanes", "how many archetypes in a cube", "cube deck support", "cube design", "Cube Commonwealth"]
draft: true
---
The honest cube archetypes count for a 360-card list is lower than most owners think. Ten two-color pairs is the default, and ten lanes is about what 360 cards can carry if every lane shares most of its cards with its neighbors. Add a storm deck, a Lands deck, and a five-color domain pile on top and something stops working. Usually it is the quiet lane nobody checks, and it is discovered by the drafter who ends up in it on Thursday night.

This piece is about the arithmetic behind that. How many cards a lane needs, how overlap stretches a list, and how to tell when you have added a deck that cannot actually be drafted.

## How many cards does a lane need?

Start with what a finished deck looks like. A cube deck is 40 cards: 16 or 17 lands and 23 or 24 spells. In an eight-player draft, each player sees 45 cards and keeps roughly half of those for the deck. For a drafter to end up with a 23-spell deck that does what the lane promises, there have to be enough on-plan cards in the 360 that two or three of them show up in most packs.

A rough rule we use, and it is a house guideline rather than a standard: a lane needs 15 to 20 cards that are clearly for it, plus access to 30 or more cards that are fine in it. The 15 to 20 are the payoffs and enablers, the cards that make the deck a deck. The 30-plus are the removal, the creatures, and the lands that any deck in those colors wants.

Take Rakdos sacrifice. The dedicated cards might be Blood Artist, Viscera Seer, Woe Strider, Mayhem Devil, Goblin Bombardment, Carrion Feeder, Bloodghast, Village Rites, Priest of Forgotten Gods, and so on. That is the 15 to 20. The 30-plus are Lightning Bolt, Fatal Push, Kitesail Freebooter, Goblin Guide, and every other cheap black or red card that works in an aggressive deck regardless of theme.

If your Rakdos section has 8 dedicated cards instead of 18, the lane is a rumor. Someone will take Mayhem Devil pick two and never see another sacrifice outlet.

## Why does overlap make or break the count?

Here is why ten lanes fit in 360 cards at all. Most of the cards in a cube are not for one lane. Lightning Bolt is for Boros aggro, Rakdos sacrifice, Izzet spells, Gruul midrange, and the red splash in a control deck. One slot, five lanes served.

The best-designed lanes share their cheap interaction and their creatures and differ mainly in their payoffs. Boros aggro and Rakdos sacrifice both want Goblin Guide; only one of them wants Goblin Bombardment. Azorius control and Dimir control both want Counterspell; only one wants Wrath of God, and only the other wants Damnation.

This is why the traditional ten-pair layout works and why it is the default almost everywhere. Each color's cards serve the four pairs that color belongs to, and only the gold cards and a handful of mono-colored payoffs are lane-specific.

The arithmetic for a 360 with ten lanes, give or take:

| Section | Cards | Serves |
|---|---|---|
| Each color (x5) | ~50 | Four lanes each |
| Gold pairs (x10) | ~5 each | One lane each |
| Colorless and artifacts | ~30 | Everything, plus artifact themes |
| Lands | ~30 | Fixing for every lane |

Fifty cards per color, four lanes per color, and five gold cards per pair. The gold cards are the signposts; the mono-colored cards do the work. We go into the signpost half in [signpost cards](/articles/cube-signpost-cards/).

## What happens when you add a lane?

Every lane you add past ten needs its own 15 to 20 dedicated cards, and those cards come out of somewhere. There are three ways to find the room, and only one of them is free.

**Stack it on an existing lane.** Rakdos sacrifice and Rakdos aggro share nearly everything but the sacrifice payoffs. Simic ramp and Simic +1/+1 counters can share lands, mana creatures, and most of the big green threats. If the new lane is a variant on an old one, it costs six to ten slots, not twenty. This is the free one, and it is how deep cubes get deep.

**Replace a lane.** Cut Orzhov tokens and put in Orzhov reanimator. The slot count stays the same; the cards change. This is fine as long as you also cut the token payoffs, because leftover payoffs for a dead lane are the most common source of unplayable picks in a cube.

**Spread the cost.** Take one or two slots from each of the ten existing lanes to fund an eleventh. This is the one that fails quietly. Every lane loses a little, no one lane looks broken, and the cube slowly becomes a place where every deck is 80 percent of a deck. Storm is the classic example: in an unpowered 360, a real storm deck needs Rite of Flame, Seething Song, Dark Ritual, Cabal Ritual, Brain Freeze, Tendrils of Agony, Mind's Desire, Past in Flames, Yawgmoth's Will, and a dozen cantrips. Many of those cards are dead in every other deck. That is twenty slots of pure tax on the rest of the list.

## How does cube size change the count?

The lane math scales, but not linearly.

A 360-card cube supports ten lanes with heavy overlap, and perhaps two or three stacked variants. Trying to support fifteen distinct decks in 360 cards is how a cube becomes a staples pile in disguise.

A 450 cube buys room for the stacked variants to become real: Reanimator as its own thing rather than a corner of Dimir control, artifact aggro as its own thing rather than a corner of Boros.

A 540 cube can hold ten pairs plus five or six truly separate strategies: storm, Lands, artifacts, reanimator, a planeswalker control shell. This is roughly where the MTGO Vintage Cube sits at [540 cards](https://www.mtgo.com/news/holidayvintagecube-122022), and it is why that cube can carry [storm and a dedicated Lands lane](https://articles.starcitygames.com/magic-the-gathering/mtgo-vintage-cube-what-worked-what-didnt-and-next-steps/) alongside its two-color pairs. But note what 540 does not buy: it does not make every pack better. It makes more decks possible at the cost of any single deck being slightly harder to assemble, because the dedicated cards are spread across 36 packs instead of 24.

At 720, the question flips. The challenge is not finding room for lanes but keeping any lane findable in a draft that only sees half the cube.

## How do you know a lane is not real?

The drafters will tell you, if you watch.

- **The payoffs wheel.** Mayhem Devil going eighth pick is not a sign that your drafters are bad. It is a sign that nobody believes the sacrifice deck exists.
- **The lane gets drafted and loses every time.** Someone commits to Lands, assembles half of it, and goes 0-3. Twice is variance. Four times is a lane short on enablers.
- **The lane never gets drafted at all.** Check this with CubeCobra's draft history or just with your memory. A lane that has not been built in ten drafts is dead weight, and the dedicated cards are empty picks.
- **The "lane" is just the two colors' good cards.** If Golgari in your cube means "the best black cards and the best green cards," it is not a lane. It is two colors sitting together. Decide whether it should be graveyard value, +1/+1 counters, or sacrifice, and give it the fifteen cards.

*If this is useful, the newsletter sends more like it.*

## What is the right number for your cube?

It depends on what the cube is for, which we covered in [what is your cube for](/articles/what-is-your-cube-for/). But a rough guide:

- **For a group that includes new or occasional drafters:** eight to ten broad lanes, heavy overlap, no deck that needs more than two or three specific cards. Every two colors should make something.
- **For a weekly group of regulars:** ten pairs plus three or four stacked variants. Enough depth that the fiftieth draft still feels different from the fifth.
- **For eight sharp players who want a test:** ten pairs plus five or six separate strategies, in a 540. Accept that some packs will have nothing for some drafters. That is part of the test.

Most regular groups do best with the middle option. A very deep cube tends to be loved by the players who are already winning and quietly skipped by everyone else. That is not an argument against deep cubes; it is an argument for matching the count to the room.

## FAQ

### How many archetypes should a 360-card cube have?

Ten, one per two-color pair, with heavy overlap between them. Two or three stacked variants on top of those is realistic. More than that and lanes start starving each other.

### How many cards does a cube archetype need?

Around 15 to 20 cards that are clearly for the lane, plus 30 or more generally good cards in its colors. That is a house guideline, not a fixed rule.

### Can a cube have too many archetypes?

Yes. Each lane past the cube's capacity takes cards from the others, and the result is decks that are all slightly short of working.

### Is a 540-card cube better for archetype variety?

It supports more distinct strategies, but each one is harder to assemble because its cards are spread across more packs. More lanes is a trade, not a free upgrade.

## Count the lanes you can feed

A cube with eight real decks beats a cube with fourteen imaginary ones. Count the dedicated cards, watch what wheels, and cut the lane that is not being fed rather than starving the ones that are. The game is the reason. The people are the point.

Subscribe to The Ludarium newsletter for new pieces on cube design and the groups that play it. In Indianapolis, [Cube Commonwealth](/articles/cube-draft-indianapolis/), our cube group, is relaunching as part of The Ludarium; subscribers hear first when the first night is set.
