---
title: "Cities First? The Production Math of Tempo"
description: "Cities first or settlements first in Catan? The production math of tempo, expected cards per round, and how to tell when a city beats a brand new settlement."
course: catan
level: 2
levelName: Trader
order: 18
emailSubject: "The math behind the city rush"
pubDate: 2026-10-22
draft: false
oneIdea: "Divide a spot's pips by 9 to get its expected cards per round in a four-player game, then build whatever adds the most pips for the cards you spend."
levelCheck:
  - question: "Your settlement touches a 6, a 9, and a 4. In a four-player game, about how many cards does it earn per round?"
    options: ["About 0.3", "About 1.3", "About 2.7", "About 12"]
    answer: "B"
    explain: "That is 5 + 4 + 3 = 12 pips. Each roll pays 12/36, or one third of a card, and a round is 4 rolls, so 12 x 4 / 36 = about 1.3. As a city, it would earn about 2.7."
  - question: "Your best settlement has 12 pips. An open 10-pip spot is one road away. Which adds more income for the cards you spend?"
    options: ["The settlement: 10 pips for 4 cards", "They come out exactly even", "The settlement, because a new spot always beats an upgrade", "The city: 12 pips for 5 cards, versus 10 pips for 6 cards"]
    answer: "D"
    explain: "The city adds 12 pips for 5 cards, about 2.4 pips per card. The settlement needs a road too, so it costs 6 cards for 10 pips, about 1.7 per card. Forgetting the road is the classic mistake."
  - question: "The math favors a city, but you build the settlement anyway. Which reason makes that a good call?"
    options: ["The spot reaches a port or a resource you lack, and a neighbor is about to take it", "Settlements produce more cards than cities on the same hexes", "Cities cannot be built until every settlement is placed"]
    answer: "A"
    explain: "A city can wait, because nobody can take it from you. A contested spot cannot. New resources, new numbers, and a port are all worth more than raw pips suggest."
nextTeaser: "Next, the two bonuses that change hands. Lesson 19 shows when Longest Route and Largest Army are worth chasing, when to contest them, and when to let them go."
---
You have 2 wheat and 3 ore in hand. You could build a city right now. Or you could trade toward a road and a new settlement. Both are worth 1 point. Which one actually wins you the game?

There is a real answer, and it takes about ten seconds of math. This lesson shows you how to count your income in cards per round, and how to use that count to choose between a city and a new settlement.

## How many cards does a spot really earn?

From [Lesson 6](/academy/catan/number-probability/), a spot's pips tell you how many times it pays out in 36 rolls. So a spot's **expected cards per roll** is its pips divided by 36.

A 12-pip settlement earns 12/36 of a card per roll. That is one third of a card, which sounds tiny. But remember, every roll can pay you, not only your own. In a four-player game, one trip around the table is 4 rolls.

So per round: **pips x 4 / 36, which is just pips / 9.**

| Pips on the spot | Cards per roll | Settlement, per round | City, per round |
| --- | --- | --- | --- |
| 6 | 0.17 | 0.67 | 1.33 |
| 9 | 0.25 | 1.00 | 2.00 |
| 10 | 0.28 | 1.11 | 2.22 |
| 13 | 0.36 | 1.44 | 2.89 |

A city collects 2 cards instead of 1 each time its numbers roll, so it doubles everything in the last column.

In a three-player game, a round is 3 rolls, so divide by 12 instead of 9.

## What is your income right now?

Add the pips on all your buildings, counting each city twice. Divide by 9. That is your expected cards per round.

Take Blue's opening on two spots:

- **Settlement A:** 6 ore, 5 wheat, 9 brick. That is 5 + 4 + 4 = 13 pips.
- **Settlement B:** 8 wood, 10 wheat, 11 wool. That is 5 + 3 + 2 = 10 pips.

Together that is 23 pips. 23 / 9 is about **2.6 cards per round**.

These are averages. Streaky dice, the robber, and 7s will push any single game around. But over many games, this number is the best guide you have to how fast you will build.

## Why does tempo matter so much?

Tempo is how early your income grows. A build pays you every round from the moment it lands. So the earlier it lands, the more it pays in total.

Say a city adds 1.44 cards per round. Build it five rounds earlier, and it hands you about 5 x 1.44 = 7 extra cards over the game. That is more than a whole extra settlement's worth of cards, just from timing.

This is why strong players care so much about their first two or three builds. Early income compounds. Every card that arrives sooner lets the next build arrive sooner too.

## When does a city beat a new settlement?

Both give you 1 point. So compare the income each one adds, and what it costs.

- **A city** adds the pips of the settlement you upgrade. It costs 5 cards: 2 wheat and 3 ore.
- **A new settlement** adds the pips of the new spot. It costs 4 cards, plus 2 more for every road you need to reach it.

Divide pips added by cards spent. The bigger number wins on income.

Back to our opening. Blue can upgrade Settlement A, or reach a 9-pip spot that is one road away.

| | City on A | Settlement plus 1 road |
| --- | --- | --- |
| Pips added | 13 | 9 |
| Cards spent | 5 | 6 |
| Pips per card | 2.6 | 1.5 |
| Income after, per round | 36 / 9 = 4.0 | 32 / 9 = 3.6 |
| Rounds to earn back its cost | 5 / 1.44 = about 3.5 | 6 / 1.00 = 6 |

The city wins easily. It costs fewer cards, adds more income, and pays for itself in about half the time.

Here is the shortcut. **If the new spot needs a road, a city on a settlement with about the same pips usually wins.** If the new spot is already connected, the settlement costs only 4 cards, so it wins unless your city spot has roughly a quarter more pips. A 10-pip connected spot (10 / 4 = 2.5) narrowly beats a city on 12 pips (12 / 5 = 2.4), and narrowly loses to a city on 13 (2.6).

## When should you build the settlement anyway?

Pips are not the whole story. A new settlement can be worth more than its numbers when:

- **Someone is about to take the spot.** A city can wait, since nobody can take it from you. An open corner cannot. [Lesson 16](/academy/catan/expansion-planning/) covers that race.
- **It adds a resource or number you lack.** New income on a fresh number is steadier, and the robber cannot block all of it at once.
- **It reaches a port.** Lesson 20 shows how one port can change your whole economy.
- **You have no ore.** Ore is scarce, with only three mountains on the board. If you must trade for all 3 ore, the city really costs you more than 5 cards.

And a city has one hidden risk. It puts more income on fewer hexes. When the robber lands on a city's best hex, you lose 2 cards per roll of that number instead of 1.

## How fast can a city rush go?

A city rush means building cities early, before most of your settlements. It only works with strong ore and wheat.

To find out how long your first city will take, divide the cards you need by what you earn of that resource per round. Ore is usually the slow part.

- **5 ore pips** (one 6 or 8 mountain): 5 / 9 is about 0.56 ore per round. Three ore takes about 3 / 0.56 = 5.4 rounds.
- **9 ore pips** (say, a 6 and a 9 mountain): 9 / 9 is 1 ore per round. Three ore takes about 3 rounds.

That gap is the whole story of the city rush. With strong ore, cities come fast and snowball. With weak ore, you are trading for every city, and settlements are usually the better plan. [Lesson 14](/academy/catan/four-core-strategies/) puts this into a full strategy.

## Try it this week

Your drill: calculate your expected cards per round at the start and the middle of a game.

1. **After setup, add your pips.** Total both settlements. Divide by 9 (or 12 at a three-player table). Write the number down.
2. **Do it again in the middle of the game.** Pick the moment you build your third settlement or first city. Count cities twice. Write that number down too.
3. **Run the city test once.** The next time you choose between a city and a settlement, divide pips added by cards spent for each. Say the two numbers in your head before you build.
4. **Time your first city.** Note the round you could first afford one. Compare it with the ore estimate from this lesson.
5. **After the game, compare.** Did your income at least double from start to middle? If not, look for the build that would have grown it fastest.
