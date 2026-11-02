---
title: "Commander Land Count: How Many Lands in a 100-Card Deck?"
seoTitle: "Commander Land Count: How Many Lands in EDH?"
description: "Commander land count made simple: why 36 to 38 lands is the start, a table by mana value and ramp, the odds behind it, color splits, and when to adjust."
pubDate: 2026-11-01
category: Magic & Cube
tags: ["commander land count", "how many lands in a 100 card deck", "how many lands in commander", "edh land count", "ramp in commander", "commander mana base"]
draft: false
---
The standard Commander land count is 36 to 38 lands in a 100-card deck, alongside about 10 pieces of ramp. Start at 37 if your deck's average spell costs about 3 mana. Then move the number: down a land or two if your deck is cheap and full of mana rocks, up a land or two if it is full of 6-drops or rewards you for playing lands. Very few casual Commander decks want fewer than 34 lands, and plenty of good ones run 40.

**The quick answer:** 37 lands plus 10 ramp pieces is a sound default for a typical deck. Count cheap mana rocks and land-fetching spells as part of your mana, not as a replacement for it. If you keep missing land drops on turns three and four, add a land before you add anything else.

Below: why Commander needs this many lands, a quick table by curve and ramp, the actual odds at each count, how to split colors, which utility lands earn a slot, and when to break the rule.

## How many lands in a 100-card deck?

Here is the short version of the common guidance most deck builders use:

| Deck style | Lands | Ramp pieces | Notes |
| --- | --- | --- | --- |
| Low curve, lots of cheap rocks | 33 to 35 | 12 to 15 | Average mana value around 2.5 |
| Typical midrange deck | 36 to 38 | about 10 | Average mana value around 3 |
| Big spells, "battlecruiser" | 38 to 40 | 10 to 12 | Lots of 6- and 7-drops |
| Landfall or lands matter | 40 to 42 | lands-based ramp | Lands are the engine |
| Competitive cEDH | often around 30 or fewer | many free or cheap rocks | Built to win fast; not a casual model |

These ranges are the same starting point our Academy lesson on [land count and mana curve](/academy/magic/magic-mana-curve-land-count/) gives, and the same skeleton the [Commander deck lesson](/academy/magic/build-a-commander-deck/) builds on: 36 to 38 lands, about 10 ramp, about 10 card draw, and a handful of removal.

Notice what is missing: a precise number that fits every deck. Land count is a dial, not a rule. The rest of this article is about where to set it.

## Why does Commander need fewer lands than a 60-card deck?

As a share of the deck, it does. A 60-card Standard deck usually runs 24 lands, which is 40 percent. A 40-card draft deck runs 17, about 43 percent. A Commander deck with 37 lands is 37 percent.

Three things let Commander get away with a lower share:

1. **Ramp does part of the job.** Commander decks play many cards that make extra mana: mana rocks like Sol Ring and Arcane Signet, green spells that fetch lands, and creatures that tap for mana. Each one is a mana source that is also something else.
2. **Your commander is always available.** You never have to draw your best card. It waits in the command zone, so you need mana more than you need any particular spell.
3. **Multiplayer starts are gentler.** In a multiplayer game, nobody skips their first draw, and the first mulligan is free: you draw a fresh seven without putting a card on the bottom. Both are in Magic's Comprehensive Rules for multiplayer games, and both make a land-light opening hand easier to fix.

But Commander also asks for more mana than other formats. Games run longer, curves sit higher, and many of the most fun cards cost 5, 6, or 7. That pulls the count back up. The two forces meet somewhere in the high 30s.

## What are the odds at each Commander land count?

Here is the math, worked out with the hypergeometric formula (the standard way to calculate draws from a deck without replacement). It assumes a 99-card library, no mulligans, no ramp, and a multiplayer game where you draw on turn one. By turn four you have seen 11 cards.

| Lands in deck | Expected lands in opening 7 | Opening hand has 2 to 5 lands | 4th land by turn 4 | 5th land by turn 5 |
| --- | --- | --- | --- | --- |
| 32 | 2.3 | 72% | 50% | 33% |
| 34 | 2.4 | 76% | 56% | 39% |
| 36 | 2.5 | 79% | 62% | 46% |
| 37 | 2.6 | 80% | 65% | 49% |
| 38 | 2.7 | 82% | 68% | 52% |
| 40 | 2.8 | 84% | 73% | 58% |
| 42 | 3.0 | 86% | 77% | 64% |

Two lessons jump out.

**Lands alone are not enough.** Even at 38 lands, you only hit your fourth land on turn four about two times in three. That is why Commander decks play ramp and card draw. They fill the gap that lands leave.

**Each land moves the odds by two or three points.** Going from 36 to 38 lands adds about five or six percentage points to hitting your fourth land on time. That is real, but it costs two spell slots. The right trade depends on how much your deck needs that fourth and fifth mana.

Now add ramp. If we count each ramp piece as one more mana source and require at least two real lands in the first 11 cards, here is what happens to the chance of having four mana sources by turn four:

| Lands | Ramp pieces | 4 sources by turn 4 | 5 sources by turn 5 |
| --- | --- | --- | --- |
| 38 | 0 | 68% | 52% |
| 37 | 5 | 77% | 64% |
| 36 | 10 | 84% | 74% |
| 34 | 12 | 84% | 74% |
| 40 | 10 | 90% | 83% |

This is rough math. Real ramp is better than one source in some ways (Sol Ring makes two) and worse in others (a rock needs a land to cast it). But the shape is clear: 36 lands plus 10 ramp beats 38 lands with none, and adding ramp lets you trade away a land or two without losing consistency. Add the free mulligan and the real odds climb higher still.

## How do you adjust land count for your mana curve?

Start at 37. Then adjust using your deck's **average mana value**: add up the mana value of every nonland card and divide by how many there are. Most deck sites calculate it for you.

| Average mana value | With about 10 ramp | With about 15 cheap ramp |
| --- | --- | --- |
| 2.5 or lower | 34 to 35 | 32 to 33 |
| About 3.0 | 36 to 37 | 34 to 35 |
| About 3.5 | 38 | 36 |
| 4.0 or higher | 39 to 40 | 37 to 38 |

Our rule of thumb behind the table:

- **Add a land for every half point** of average mana value above 3.
- **Cut a land for every two or three cheap ramp pieces** above 10. Cheap means it costs 2 or less, like Sol Ring, Arcane Signet, the Signets and Talismans, and green spells like Rampant Growth.
- **Do not cut lands for expensive ramp.** A 4-mana spell that fetches two lands is good, but it does not help you reach four mana. It helps you reach six.
- **Card draw counts a little.** Cheap cantrips and draw engines help you find lands. Some builders cut one land for every three or four cheap draw spells. Go slowly with this one.

Frank Karsten, whose probability articles are the standard reference for Magic mana bases, published a Commander-specific study on ChannelFireball titled "What's an Optimal Mana Curve and Land/Ramp Count for Commander?" It builds a formula from average mana value, cheap ramp, and cheap card draw, and it is worth reading if you want a full model rather than a rule of thumb.

## How do you split basics by color?

Once you know your total, decide how many sources of each color you need.

### Count your colored pips

Count the colored mana symbols on your nonland cards. If your two-color deck shows 60 green symbols and 30 white, your green sources should outnumber white roughly two to one.

### Weight the early cards more

A 2-mana spell that needs two green, like a green ramp creature, needs green early. A 7-mana spell with one white symbol can wait. If your early plays lean one color, lean your basics that way too.

### Count fixing first, then basics

In a two- or three-color deck, every land that makes more than one color counts toward each color it makes. Fill those first:

- **Command Tower** makes any color in your commander's identity. It belongs in nearly every multicolor deck.
- **Dual lands** from your collection, starting with the ones that enter untapped.
- **Fetch-a-basic effects** like Evolving Wilds, which count as a source of every color you run basics for.
- **Mana rocks that fix**, like Arcane Signet, count as partial sources. They do not help on turn one or two, but they make your third and fourth turns flexible.

Then fill the rest with basics in the ratio of your pips.

### A rough guide by color count

| Colors | Typical split |
| --- | --- |
| One color | 37 basics, or a few utility lands in their place |
| Two colors | 8 to 15 dual or fixing lands, the rest basics by pip ratio |
| Three colors | 12 to 20 fixing lands; basics for your main color |
| Four or five colors | As much fixing as you can manage, plus more fixing ramp |

Three-color and five-color decks lean harder on green ramp that fetches basics, since it fixes and ramps at once. That is one reason green is so common in multicolor Commander decks.

## Which utility lands are worth a slot?

A utility land does something besides make mana. In a 37-land deck, a few utility lands are free value. Too many and your colors suffer, because most utility lands make colorless mana.

Good utility picks for most decks:

- **Reliquary Tower** removes your maximum hand size, useful in card-draw decks.
- **Rogue's Passage** makes a creature unblockable, often your commander.
- **Bojuka Bog** exiles an opponent's graveyard when it enters, a quiet answer to graveyard decks.
- **Command Beacon** puts your commander into your hand, saving you a pile of commander tax.
- **Lands that cycle** let you trade a late land for a fresh card.

**Modal double-faced cards** deserve a mention. These cards are a spell on one side and a land on the other. A common habit is to count each one as half a land: three of them can replace one or two real lands.

The rule of thumb: in a two-color deck, two to four colorless utility lands is plenty. In a three-color deck, keep it to one or two unless your fixing is excellent.

## When should you play more lands in Commander?

Go higher than 38 when:

- **Your deck is a lands deck.** Landfall commanders and decks that play extra lands each turn want 40 or more. In these decks, a land is not a dead draw; it is your best draw.
- **Your curve is high.** If a third of your spells cost 5 or more, your deck needs to reach 6 and 7 mana on schedule.
- **You have little card draw.** A deck that cannot dig for lands needs more of them.
- **You keep stalling.** Track ten games. If you miss your fourth land drop in more than three of them, add a land.

## When should you play fewer lands in Commander?

Go lower than 36 when:

- **Your curve is low.** A deck that mostly costs 1 to 3 mana can run 33 to 35 lands.
- **You run lots of cheap ramp.** Fifteen 2-mana rocks and land spells do much of a land's job.
- **You play a competitive deck.** cEDH decks often run around 30 lands or fewer, but they lean on free and nearly free fast mana and win early. They are a different game, not a model for a casual table.
- **You flood often across many games.** Not one game. Ten.

One warning: the most common Commander mistake is cutting lands to fit one more fun card. It feels free. It is not. A deck that misses land drops never casts its fun cards at all. Our piece on [Commander politics](/articles/commander-politics/) makes the case that falling behind early also makes you the easy target, so a missed land drop costs twice.

## How does Commander land count compare with other formats?

| Format | Deck size | Typical lands | Share |
| --- | --- | --- | --- |
| Draft or sealed | 40 | 17 | 43% |
| Standard and other constructed | 60 | 24 | 40% |
| Commander | 100 | 36 to 38 plus ramp | 36 to 38% |
| Cube draft | 40 | 16 to 17 | 40 to 43% |

If you also play cube, our [cube land count](/articles/cube-land-count/) guide covers how a cube's land section changes what drafters can build. And our [guide to MTG formats](/articles/mtg-formats/) explains how each format above is built and played.

## FAQ

### How many lands should a Commander deck have?

Most Commander decks should run 36 to 38 lands, with about 10 ramp pieces. Start at 37 for a deck whose average spell costs about 3 mana, then adjust for your curve and how much cheap ramp you play.

### Is 33 lands enough for Commander?

Only for a deck with a low curve and a lot of cheap ramp, around 15 pieces. For a typical casual deck, 33 lands leads to missed land drops. Most decks are better at 36 or more.

### How much ramp should a Commander deck have?

About 10 pieces is the common target. Cheap ramp that costs 2 or less matters most, because it speeds up your third and fourth turns. Sol Ring and Arcane Signet are the usual first picks.

### Do mana rocks count as lands in Commander?

Not one for one. A cheap mana rock is a mana source, so it lets you cut a land for every two or three you play. It cannot replace your early lands, because you need lands to cast the rocks.

### How many lands are in a Commander precon?

It varies by deck, and Wizards changes the shape of precons over time. Check the decklist on the box or on Wizards' site. If a precon runs fewer than 36 and stalls, adding lands is one of the cheapest upgrades there is.

## Build it, then play it

A land count is a guess until you play the deck. Build it at 37, play ten games, and adjust by one land at a time. The [Commander deck lesson](/academy/magic/build-a-commander-deck/) walks through the rest of the build, and [how to play Commander](/articles/how-to-play-commander-mtg/) covers the rules if you are new. For more deck-building notes, sign up for Ludarium Letters just below.

## Sources

- [Commander format page (Wizards of the Coast)](https://magic.wizards.com/en/formats/commander)
- [Commander Cookout: Are You Playing Enough Lands? (EDHREC, 2025)](https://edhrec.com/articles/commander-cookout-are-you-playing-enough-lands)
- [What's an Optimal Mana Curve and Land/Ramp Count for Commander? (Frank Karsten, ChannelFireball)](https://strategy.channelfireball.com/home/whats-an-optimal-mana-curve-and-land-ramp-count-for-commander/)
- [Starting the game: mulligans and the first draw in multiplayer (MTG Wiki)](https://mtg.wiki/page/Starting_the_game)
