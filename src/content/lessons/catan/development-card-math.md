---
title: "Development Card Math"
description: "Development card math for Catan: the odds in the 25-card deck as cards leave it, when the deck favors Knights or points, and the best time to play a Monopoly."
course: catan
level: 3
levelName: Strategist
order: 26
emailSubject: "14 Knights, 5 points, and the odds"
pubDate: 2026-10-22
draft: false
oneIdea: "Treat every development card you cannot see as still in the deck, and your odds update themselves: points get likelier as Knights hit the table, and Monopoly pays most right after a resource piles up in other hands."
levelCheck:
  - question: "Mid-game, 5 Knights, 1 Road Building, and 1 Monopoly have been played. You hold 1 unplayed Knight. What is the chance your next card is a Victory Point?"
    options: ["20%, same as always", "About 33%", "About 29%", "About 6%"]
    answer: "C"
    explain: "You cannot see 25 - 7 played - 1 in your hand = 17 cards. All 5 Victory Points are among them, so the chance is 5/17, about 29%."
  - question: "Both Monopoly cards have been played. What does that tell you?"
    options: ["The deck now holds more Victory Points than Knights", "You should build development cards until the deck is empty", "Nothing useful, since the deck is shuffled", "Nobody can take your whole stack of one resource with a Monopoly now"]
    answer: "D"
    explain: "There are only 2 Monopoly cards. Once both are face up, a big pile of one resource is safe from that surprise. It is still not safe from a 7."
  - question: "You hold Monopoly. When are you most likely to get a big haul of ore?"
    options: ["Before you roll, on a turn when nothing much has been rolled lately", "Right after your roll pays ore to two opponents' cities", "When you already hold most of the ore yourself"]
    answer: "B"
    explain: "Monopoly takes what other players hold. Roll first, and if the roll just paid them ore, play the card in your action phase and collect it."
nextTeaser: "Next, the game that starts badly. Lesson 27, Recovering From a Bad Start, shows what to build with a weak opening, which trades help most, and how to stay within reach."
---
[Lesson 11](/academy/catan/development-cards-for-beginners/) gave you the deck and the odds of a fresh draw. Those numbers are a fine start. But by the middle of a game, the deck is not fresh anymore. Knights sit face up in front of players. A Monopoly has already emptied someone's hand. The odds have moved, and you can see most of how.

This lesson shows you how to track the deck, how the odds shift, and when to play its most dramatic card.

## What is in the deck again?

| Card | Copies | Chance on a fresh draw |
| --- | --- | --- |
| Knight | 14 | 14/25 = 56% |
| Victory Point | 5 | 5/25 = 20% |
| Road Building | 2 | 2/25 = 8% |
| Invention | 2 | 2/25 = 8% |
| Monopoly | 2 | 2/25 = 8% |

That is 25 cards, and that is all there will ever be. Once the deck runs out, nobody can build another development card.

## Which cards can you see?

Every development card is in one of three places.

- **Played.** Knights stay face up in front of their owner. Road Building, Invention, and Monopoly are announced when played, then set aside. Anyone paying attention knows them.
- **Built but unplayed.** These sit face down in players' hands. You know your own. You do not know anyone else's.
- **Still in the deck.**

Victory Point cards are special. Nobody plays them during the game. They stay hidden until someone reveals them to win. So all 5 stay out of sight until the very end.

## How do you work out the odds mid-game?

Here is the key idea. **Treat every card you cannot see as if it were still in the deck.**

That includes the cards in other players' hands. You do not know what they are, so for your odds they are just as unknown as the deck. Your chance of drawing a card is:

**copies you cannot see / total cards you cannot see**

Let's try it. Midway through a game, 10 development cards have been built. Of those, 5 Knights, 1 Road Building, and 1 Monopoly have been played. You hold 1 Knight you have not played yet. Two more cards sit unplayed in other hands.

Cards you cannot see: 25 - 7 played - 1 in your hand = 17.

| Card | Copies | You can see | You cannot see | Your chance |
| --- | --- | --- | --- | --- |
| Knight | 14 | 6 | 8 | 8/17 = 47% |
| Victory Point | 5 | 0 | 5 | 5/17 = 29% |
| Road Building | 2 | 1 | 1 | 1/17 = 6% |
| Invention | 2 | 0 | 2 | 2/17 = 12% |
| Monopoly | 2 | 1 | 1 | 1/17 = 6% |

The last column adds up to 17/17, so nothing is missing. A Victory Point has gone from 1 in 5 to almost 1 in 3.

## Why do points get likelier as the game goes on?

Because Knights get played and points do not. Every Knight that hits the table leaves the pool of unseen cards. The 5 Victory Points never do.

Push the example later. Now 9 Knights, both Road Buildings, 1 Invention, and both Monopolies are face up: 14 cards. You hold none. Cards you cannot see: 25 - 14 = 11. That is 5 Knights, 5 Victory Points, and 1 Invention.

Your next card is a point 5/11 of the time, about **45%**. Build two, and the chance that neither is a point is 6/11 x 5/10 = 30/110. So the chance of at least one point is 80/110 = 8/11, about **73%**.

That changes your endgame. Early on, a development card is a weak way to chase a point. Late, with lots of Knights played, it can be one of your best. [Lesson 25](/academy/catan/endgame/) shows where that fits in a plan to reach 10.

## How many cards until your next Knight?

For Largest Army you want Knights, and you want to know the price. There is a neat shortcut for the average number of cards it takes:

**Knights you need x (unseen cards + 1) / (unseen Knights + 1)**

- From a fresh deck, three Knights take 3 x 26 / 15 = 5.2 cards on average. That is where Lesson 11's "about five" came from.
- In the mid-game example, two more Knights take 2 x 18 / 9 = **4** cards on average.

Four cards is 12 resources. That is the real price of the bonus. Before you commit, ask what else 12 resources could build. [Lesson 19](/academy/catan/longest-route-and-largest-army/) covers when the 4-point swing is worth it.

## What does a card that never gets played tell you?

Players usually play Knights and the other action cards when they help. A card that sits in someone's hand for many turns, through robber hits and good Monopoly moments, starts to look like a Victory Point.

Start with the math, then adjust. In the mid-game example, a rival holding 2 cards you cannot see has no points with chance 12/17 x 11/16 = 132/272. So they hold at least one point 140/272 = 35/68 of the time, about **51%**. Then look at behavior. A card held for six turns is more likely a point than one built last turn. [Lesson 23](/academy/catan/threat-assessment/) turns this into a full read on who is close to winning.

## What does it mean when both copies are gone?

The smaller cards come in pairs, and pairs run out. Once both copies are face up, nobody can surprise you with that card.

- **Both Monopolies played:** nobody can take your whole stack of one resource. A pile saved for your 2:1 port is safer, from Monopoly at least. A 7 can still cost you half.
- **Both Road Buildings played:** nobody can lay 2 free roads and steal Longest Route in one quiet turn. A rival needs real brick and wood, which you can see coming.
- **Both Inventions played:** a player who is 2 cards short of a win must get them by trade or by roll.

Keep a pair list. It is one line of notes, and it tells you exactly which surprises are left.

## When should you play Monopoly?

Monopoly takes every card of one resource from every other player. Its value is the size of the haul, and the haul depends on timing. Lesson 11 gave the basics: roll first, and wait for full hands. Here is how to count it.

**Count what just came in.** Say you roll an 8 at the start of your turn. The 8 is on a wheat field touching Red's city and Orange's settlement. That roll just paid Red 2 wheat and Orange 1.

**Add what was already there.** Red traded for wheat last turn. Orange keeps asking for ore and never for wheat, which hints they have some. Your [card count](/academy/catan/card-counting/) says about 2 more across the table.

**Total it.** 2 + 1 + 2 = about 5 wheat, for a card that cost you 3. And every card you take is one a rival no longer has.

The best moments to play it:

- **Right after a big production roll of that resource,** on your turn, in your action phase.
- **Right after other players traded for it.** Trades move cards into hands you can track.
- **When you can use the haul now:** a city, a 2:1 port, or a build that the haul finishes.

A simple rule: if you expect 4 or more cards, play it. If you expect 2, wait a turn or two and keep counting.

## Try it this week

Your drill: track every development card built in one game.

1. **Make a tracker.** One row per player, with three columns: cards built, cards played (and which), and cards still unplayed.
2. **Write the pair list.** Knights 14, Victory Points 5, Road Building 2, Invention 2, Monopoly 2. Cross off each card as it is played.
3. **Count before you build.** Each time you build a card, say your odds of a Knight and of a point, using unseen cards only.
4. **Watch the long holds.** Note any card that stays in a hand for five turns or more.
5. **Count your Monopoly.** If you draw one, total the expected haul before you play it, and hold out for 4 or more.
6. **Check at the end.** When the game ends and cards are revealed, see how many Victory Points were sitting in hands. Were the long holds points?
