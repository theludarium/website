---
title: "Threat Assessment: Who Is Actually Winning?"
description: "Threat assessment in Catan: count visible points, estimate hidden Victory Point cards, and spot the quiet player who is one turn away from winning the game."
course: catan
level: 3
levelName: Strategist
order: 23
emailSubject: "The quiet player is about to win"
pubDate: 2026-10-22
draft: false
oneIdea: "The real score is visible points plus a fair guess at hidden Victory Point cards, plus how fast each player can score next, and the quiet player is often closer than the loud one."
levelCheck:
  - question: "Green has 3 settlements, 2 cities, and Largest Army. How many visible points does Green have?"
    options: ["7", "8", "9", "10"]
    answer: "C"
    explain: "Settlements are 1 each, so 3. Cities are 2 each, so 4. Largest Army is 2. That is 3 plus 4 plus 2, or 9. Green can win with any single point."
  - question: "Ten development cards have been played, none of them Victory Points. You hold 1 Knight. No Victory Point card has been revealed. About how likely is any one hidden card to be a Victory Point?"
    options: ["20%, the same as a fresh deck", "About 36%", "50%", "Under 10%"]
    answer: "B"
    explain: "Take away the 10 played cards and your own card: 25 minus 11 leaves 14 unknown cards, in the deck or in other hands. All 5 Victory Points are among them, so each one is about 5 in 14, or 36%."
  - question: "Which player is usually the bigger threat?"
    options: ["Blue: 7 visible, two development cards held for many turns, and 8 cards in hand", "Red: 8 visible, no development cards, and 2 cards in hand", "They are equal, since one point barely matters"]
    answer: "A"
    explain: "Cards held for many turns without being played lean toward Victory Points, so Blue could be at 9. A hand of 8 can also turn into a build. Red's 8 is real, but Red has no hidden points and little to build with."
nextTeaser: "Next, the softest skill in the game. Lesson 24 covers table talk: how to persuade, when to form a short alliance, and how to talk the robber off your best hex."
---
Every Catan player has seen it. The table spends the whole game watching the loud player with Longest Route. Nobody trades with them. The robber lives on their hexes. Then the quiet player across the table builds a city, flips over two Victory Point cards, and says, "I think that's ten."

The quiet player did not get lucky. They were winning for several turns, and nobody counted. This lesson is how you count.

## What does the board tell you?

Start with what everyone can see. [Lesson 5](/academy/catan/how-to-win/) listed every way to score.

| Source | Points |
| --- | --- |
| Settlement | 1 each |
| City | 2 each |
| Longest Route | 2 |
| Largest Army | 2 |
| Revealed Victory Point card | 1 each |

Add these up for every player at least once a round. It takes ten seconds once you are used to it. Count from the board, not from memory: a city upgrade or a bonus changing hands can move a score by 2 or more in one turn.

But visible points are only part of the score. The rest is hiding in face-down cards.

## Where are the five Victory Point cards?

The development deck has 25 cards, and 5 are Victory Points. They stay hidden until their owner reveals them, usually on the turn they win. So every face-down development card in front of an opponent might be a point.

From a fresh deck, any one card is a Victory Point 1 time in 5, or 20%. But that number changes as the game goes on, and you can update it with what you have seen. Here is the method:

1. **Count the unknown cards.** Start with 25. Take away every card that has been played face up, and every card in your own hand. What is left is in the deck or hidden in other hands.
2. **Count the Victory Points still unknown.** Start with 5. Take away any you hold and any that have been revealed.
3. **Divide.** That is the chance any one hidden card is a Victory Point.

Say 10 cards have been played so far: 8 Knights, 1 Road Building, and 1 Monopoly. You hold 1 Knight. Nobody has revealed a point.

- Unknown cards: 25 minus 10 played minus your 1 = 14
- Unknown Victory Points: 5
- Chance per hidden card: 5 in 14, about 36%

That is much higher than 20%. And it makes sense. Knights, Road Building, and the rest get played, so they come out into the open. Victory Points do not. As the game goes on, the cards that stay hidden tend to be more and more likely to be points. Lesson 26 goes deeper into how the deck's odds shift as it thins.

## How many hidden points does one player have?

Now apply that to a player. Blue holds 3 face-down development cards.

- **Expected hidden points:** 3 cards times 5 in 14 is 15 in 14, about 1.1 points.
- **Chance of at least one:** the chance none of them is a point is 9/14 x 8/13 x 7/12, about 23%. So there is about a 77% chance Blue has at least one.

This treats Blue's cards as random draws, which is a fine starting point. Then adjust for behavior:

- **A card held for many turns leans toward a point.** Most players play Knights when the robber sits on them. If the robber has been on Blue's best hex for two turns and Blue has not played anything, those cards are probably not Knights.
- **A card built this turn can still be a point.** You may reveal one the moment it wins the game.
- **A player who builds cards and never plays any** is the classic quiet threat.

## What is each player's real score?

Put it together in two numbers for each player.

- **Estimate:** visible points plus hidden cards times the Victory Point chance.
- **Ceiling:** visible points plus every hidden card, but never more than the unknown Victory Points left.

Using the 36% chance from above:

| Player | Visible | Hidden cards | Estimate | Ceiling |
| --- | --- | --- | --- | --- |
| Red | 8 | 0 | 8 | 8 |
| Green | 7 | 1 | about 7.4 | 8 |
| Blue | 6 | 3 | about 7.1 | 9 |

Everyone at this table is watching Red, and Red is the leader on paper. But Blue could already be at 9. If you only watch visible points, Blue is in third place. If you count, Blue is one point from winning.

One useful limit: a player who reaches 10 on their own turn wins right then, hidden points included. So when your turn starts, an opponent is almost never sitting on 10. The ceiling that matters is 9, which means "can win with any single point on their next turn."

## How fast can they score next?

A score is where a player is. Speed is how soon they get the next point. Count both.

- **Their hand.** From [Lesson 21](/academy/catan/card-counting/), you may know exactly what they hold. Two wheat and three ore is a city on their next turn.
- **Their income.** A player with 15 pips gets about 1.7 cards a round in a four-player game (15 divided by 9). A player with 25 pips gets nearly 3.
- **Open spots.** A road away from a free corner means a settlement could come fast.
- **A bonus within reach.** One road or one Knight from taking [Longest Route or Largest Army](/academy/catan/longest-route-and-largest-army/) is a 2-point jump that can come out of nowhere.

A player at 7 with a full hand and a bonus in reach is more dangerous than a player at 8 with two cards and nowhere to build.

## How do you spot the quiet player?

They do not look like a leader. That is the point. Watch for these signs:

- They build development cards steadily and rarely play them.
- They say "no thanks" to trades instead of haggling.
- Their cities go up without fuss, often on ore and wheat.
- Their hand count keeps growing without a robber on them.
- Nobody has robbed them in a while.

None of these proves anything alone. Two or three together should move a player to the top of your list.

## What do you do once you know?

Use the tools from earlier lessons on the real leader, not the loud one.

- **The robber** goes on their best hex ([Lesson 22](/academy/catan/robber-tactics/)).
- **No trades** that finish a build for them ([Lesson 17](/academy/catan/art-of-the-trade/)).
- **Contest their bonus** if they hold one.

Next lesson covers the fourth tool: telling the table, kindly and with numbers, who is really winning.

## Try it this week

Your drill: write every player's estimated score each round.

1. **Make a small grid.** One row per player, including you. Columns for visible points, hidden development cards, and your estimate.
2. **Track played cards.** Keep a tally of every development card played face up. That gives you the unknown pool.
3. **Update once a round.** At the start of your turn, recount visible points from the board and update the Victory Point chance.
4. **Circle anyone whose ceiling is 9.** That player can win on their next turn with any single point.
5. **Name the leader out loud to yourself** before each robber move or trade.
6. **Check at the end.** When the game ends, ask everyone to flip their development cards face up. Compare each player's final score with your last estimate. Who surprised you, and why?
