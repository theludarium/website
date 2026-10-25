---
title: "Pandemic Odds: The Next Epidemic and the Next Outbreak"
description: "Pandemic probability in plain words: the odds of an Epidemic on your next draw, the odds a known city comes up next, and when a double Epidemic is possible."
course: pandemic
order: 12
level: 3
emailSubject: "What are the odds the next card is an Epidemic?"
pubDate: 2026-10-25
draft: false
oneIdea: "Pandemic's decks are shuffled, but they are built in a known way. A few plain fractions tell you how likely the next Epidemic is, and how likely each dangerous city is to come up next."
tryThis: "In your next game, after each Epidemic, count the cards that were shuffled back on top. Then say each 3-cube city's chance of coming up in the next Infect step: the infection rate over that count."
nextTeaser: "Next, the endgame count: turning the Player deck into a number of turns, and checking whether every cure is still possible."
---
Welcome to Level 3. At Level 2 you learned to read the Infection discard pile and to plan a turn ahead. Now you put numbers on it. Pandemic hides its next cards, but it builds both decks in a fixed way, and that means you can work out real odds with nothing more than a fraction.

All the numbers here come from the setup rules in the current [rulebook](https://cdn.svc.asmodee.net/production-zman/uploads/2024/09/Pandemic_Rulebook.pdf) and our own arithmetic on them.

## How the Player deck is built

The Player deck starts as 48 City cards and 5 Event cards, 53 in all. Starting hands take 8 of them with 2 or 4 players, and 9 with 3 players. The rest are split into one pile per Epidemic, as evenly as possible, with the smaller piles on the bottom. One Epidemic is shuffled into each pile.

| Players | Introductory (4) | Standard (5) | Heroic (6) |
| --- | --- | --- | --- |
| 2 or 4 | 13, 12, 12, 12 | 10, 10, 10, 10, 10 | 9, 9, 9, 8, 8, 8 |
| 3 | 12, 12, 12, 12 | 10, 10, 10, 10, 9 | 9, 9, 8, 8, 8, 8 |

Pile sizes from top to bottom, Epidemic included. Say them out loud at setup, and anyone at the table can track them.

## The odds of an Epidemic on your next draw

Each pile holds exactly one Epidemic, in a random spot. So until it shows up, every safe card you draw from that pile makes it more likely to be in the next two.

Here is a pile of 10, the Standard pile with 2 or 4 players, drawn 2 cards at a time:

| Cards already drawn from this pile, no Epidemic yet | Chance your next draw has it |
| --- | --- |
| 0 | 20% |
| 2 | 25% |
| 4 | 33% |
| 6 | 50% |
| 8 | 100% |

The math is just 2 divided by the cards left in the pile. Two lessons follow:

- **The longer the calm, the closer the storm.** Four quiet draws into a pile, the Epidemic is a certainty on the next one.
- **Once it shows, the rest of the pile is safe.** If the Epidemic was the second card of a pile of 10, the next 8 cards hold none. That is your window to cure, move, and set up for the next one.

## When a double Epidemic is possible

You draw two Epidemics at once only when one draw takes the last card of one pile and the first of the next. That can only happen when a pile ends halfway through a draw.

With 2 or 4 players at Standard, every pile is 10 cards, an even number, so piles always end on a full draw. **A double Epidemic cannot happen.** At Heroic, the 9-card piles break that pattern, and our count puts the chance of a double Epidemic at some point in the game at about 6%. At Introductory with 2 or 4 players, it is about 2%. With 3 players at Standard, it cannot happen; at Heroic, it is about 1%.

Watch for the risky draws: the ones that straddle two piles. If the Epidemic of the upper pile has not appeared and its last card is about to be drawn together with the first card of the next pile, keep Resilient Population or One Quiet Night ready.

## The odds of a city coming up next

After an Epidemic, the discard pile goes back on top of the Infection deck. Call the number of those cards **the stack**. Until the stack is used up, every infection comes from it. Each card in the stack is equally likely to be in any position.

So the chance a given city in the stack comes up in the next Infect step is the infection rate divided by the size of the stack. Over the next several flips, it is the number of flips divided by the stack.

A worked example. In a 4-player game, the first Epidemic arrives on turn 3. The stack holds the 9 setup cities, the 4 cities infected on turns 1 and 2, and the Epidemic city: 14 cards. The rate is still 2.

- Any one city in the stack comes up in the next Infect step 2 times in 14, about 14%.
- Within the next 6 flips, three turns at rate 2, it is 6 in 14, about 43%.
- If three setup cities and the Epidemic city all still sit at 3 cubes, the chance at least one of them comes up in the very next Infect step is about 51%.

That last number is the case for the opening lesson. Bring the setup cities down before the first Epidemic, and that coin flip turns into a single risky city, the Epidemic city itself, at about 14%. Remove that one with Resilient Population, and it drops to zero.

## Odds for the Player deck too

The same thinking works for cures. If 3 yellow cards are left among 30 cards in the Player deck, the chance your next draw brings at least one is about 19%. Over a whole round of four players, it is much higher, but it may land in the wrong hand. That is why the [card flow lesson](/academy/pandemic/pandemic-share-knowledge-strategy/) plans shares before the cards arrive.

## Using odds without slowing the table

You do not need to work all this out every turn. Keep two numbers in view and say them aloud: cards drawn from the current Epidemic pile, and the size of the stack. With those two, anyone can make a good guess in seconds.
