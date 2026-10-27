---
title: "Kingdomino Scoring: The Math Behind Every Square"
description: "Kingdomino scoring math made simple: squares times crowns, what one more square or crown is worth, why merging territories pays, and how to score at a glance."
course: kingdomino
order: 4
level: 1
emailSubject: "What is one more square worth?"
pubDate: 2026-10-27
draft: false
oneIdea: "A territory scores squares times crowns, so one more square is worth as many points as the territory has crowns, and one more crown is worth as many points as it has squares."
tryThis: "Next game, before each placement, say the points it adds: the crowns of the territory you grow, or the squares of the territory that gains a crown. Pick the placement with the bigger number."
nextTeaser: "Next, the draft: why the best domino in the line is not always the right pick, and what going first next round is worth."
---
Kingdomino scoring is one multiplication per territory. That simplicity hides a useful tool. Once you see each territory as squares times crowns, you can price any domino in your head before you pick it. This lesson builds that habit with small, exact examples.

## The rule, restated

A territory is a group of same-terrain squares connected side to side. It scores:

**squares × crowns**

Crowns sit on individual squares, and every crown on a square in the territory counts. A territory with zero crowns scores zero.

## What one more square is worth

Say you have a forest of 5 squares with 2 crowns. It scores 10. Add one plain forest square and it becomes 6 squares with 2 crowns: 12. The square added 2 points, exactly the number of crowns.

That is the first rule of thumb: **a plain square is worth the crowns of the territory it joins.**

- Joining a territory with 0 crowns: worth 0.
- Joining a territory with 1 crown: worth 1.
- Joining a territory with 3 crowns: worth 3.

So the same plain square can be worth nothing or a lot, depending only on where it goes.

## What one more crown is worth

Take the same forest, 5 squares and 2 crowns. Add a forest square with a crown on it. Now it is 6 squares and 3 crowns: 18. That one square added 8 points.

Split that into its parts: the crown multiplies the 5 squares already there (5 points), the square counts once for each of the 2 crowns already there (2 points), and the new square and its own crown add 1 more. In general, a crowned square joining a territory of **n** squares and **c** crowns adds **n + c + 1** points.

The second rule of thumb follows: **a crown is worth about the size of the territory it joins.** A crown in a 1-square territory is nearly worthless. The same crown in a 10-square territory adds more than 10.

## Why merging pays

Two territories of the same terrain that do not touch score separately. Join them, and each one's squares get multiplied by the other's crowns too.

If one territory has **a** squares and **c1** crowns, and another has **b** squares and **c2** crowns, joining them adds **a × c2 + b × c1** points, plus whatever the joining squares bring.

A worked example. Two wheat fields:

- Field one: 4 squares, 1 crown. Scores 4.
- Field two: 3 squares, 1 crown. Scores 3.

Separately, 7 points. Join them with one more plain wheat square: 8 squares, 2 crowns, 16 points. The joining square added 9 points, more than doubling the pair. Every split territory is points waiting for a bridge.

## Spread or stack?

Here is the choice in its clearest form. You have 4 crowns and 16 squares to spend on two terrains.

- **Spread:** two territories of 8 squares with 2 crowns each. 16 + 16 = 32.
- **Stack:** one territory of 16 squares with all 4 crowns. 64.

Multiplication rewards concentration. Given the same squares and crowns, one territory always scores at least as much as two, and usually much more.

That does not mean one terrain for the whole game. You rarely get to choose, because the line offers what it offers. It means two habits: grow your biggest crowned territory whenever the price is close, and treat a new separate territory as a cost unless it brings crowns of its own.

## Scoring a full kingdom at a glance

At the end, score territory by territory and say each one out loud. A sample kingdom:

| Territory | Squares | Crowns | Points |
| --- | --- | --- | --- |
| Forest | 8 | 3 | 24 |
| Lake | 6 | 2 | 12 |
| Wheat | 5 | 1 | 5 |
| Swamp | 2 | 2 | 4 |
| Grassland | 3 | 0 | 0 |
| Total | 24 |  | 45 |

The 24 squares plus the castle make the full 25. Notice where the points came from: the forest is a third of the kingdom and more than half the score.

## Pricing a domino before you pick it

Put the two rules together and you can value any domino in a few seconds:

1. For each square, find the territory it would join in your kingdom.
2. A plain square adds that territory's crowns.
3. A crowned square adds that territory's squares, plus its crowns, plus 1.
4. A square that starts a new territory adds its own crowns times 1, which is usually small.

A two-crown grassland square is worth 2 points if it starts a lonely grassland. Put it at the end of an existing 6-square grassland with 1 crown instead, and that grassland goes from 6 squares and 1 crown (6 points) to 7 squares and 3 crowns (21 points). Same square, 15 points. For a square with more than one crown, the shortcut is: squares times its crowns, plus the territory's crowns, plus its own crowns. Here, 6 × 2 + 1 + 2 = 15.

The draft is a trade between that number and turn order, and that is the next lesson. For a wider look at how luck and planning mix in light games like this one, see our piece on [luck and skill in board games](/articles/luck-vs-skill-board-games/).
