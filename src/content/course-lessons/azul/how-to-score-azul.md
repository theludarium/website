---
title: "How to Score a Game of Azul by Hand"
description: "How to score Azul by hand: a calm wall-tiling routine, worked adjacency examples, the floor line, and a final count of rows, columns, and colors that adds up."
course: azul
order: 3
level: 0
emailSubject: "Score your Azul wall without a single argument"
pubDate: 2026-10-25
draft: false
oneIdea: "Scoring is a routine, not a puzzle: one player at a time, one pattern line at a time from the top, row count then column count, then the floor. Do it the same way every round and the numbers take care of themselves."
tryThis: "In your next game, score one player at a time while the table watches, and have the next player call out each tile's row and column count before the marker moves."
nextTeaser: "Level 1 starts with your first three games: the rules slips and strategy traps almost every new table falls into, and how to fix each one."
---
Azul's scoring rule fits in two sentences, yet it is where most first games go quietly wrong. Someone counts a tile twice, someone forgets the floor, and the final bonuses get added in a rush while people pack up. None of that is hard to fix. It just needs a routine.

This lesson gives you that routine, with worked examples you can set up on a real board. To keep it simple, we name spaces by row and column: row 1 is the top of the wall, column 1 is the left edge. So (3,3) is the center space.

## The wall-tiling routine

The rulebook lets everyone tile at the same time. That is quick, but it hides mistakes. Until your table is confident, score one player at a time:

1. **Go top to bottom.** Start with pattern line 1, then 2, and so on.
2. **For each complete line,** slide its rightmost tile to the matching color in that row of the wall.
3. **Score that tile now,** before you touch the next line.
4. **Clear the leftovers** from each complete line to the box lid. Incomplete lines stay.
5. **Then the floor.** Subtract the floor penalty, and put the fallen tiles in the lid. If you hold the starting player marker, keep it in front of you.

Order matters in step 3, and the next example shows why.

## Counting one tile

A tile with no neighbors, above, below, left, or right, scores 1. Otherwise:

- **Count across.** If any tile touches it in its row, count the unbroken run of tiles in that row, the new tile included.
- **Count down.** If any tile touches it in its column, count the unbroken run in that column, the new tile included.
- **Add the two.** A tile with neighbors on only one axis scores only that run.

Say it out loud: "two across, three down, five." That one habit catches most mistakes.

## Worked example: why you go top to bottom

Your wall has one tile, at (1,3). This round you complete pattern lines 1 and 2, and they will land at (1,2) and (2,2).

**In order.** Line 1 first. The tile at (1,2) touches (1,3), so it scores 2 across. Nothing touches it above or below yet, so that is 2. Then line 2: the tile at (2,2) touches (1,2) above it, so it scores 2 down. Nothing in its row, so that is 2. Round total: 4.

**Out of order.** Score line 2 first, and (2,2) is alone, so 1. Then (1,2) touches (1,3) and (2,2), so it scores 2 across plus 2 down, 4. Total: 5. One point too many, from scoring in the wrong order. Top to bottom is the rule, and it settles every case like this.

## Worked example: gaps and big tiles

**A gap breaks the run.** Row 4 holds (4,1), (4,2), and (4,4). You place (4,5). Its run across is (4,4) and (4,5), so 2. The tiles at (4,1) and (4,2) do not count, because (4,3) is empty.

**The center tile.** Your wall holds (3,2), (3,4), (2,3), and (4,3), a plus sign with a hole in the middle. You place (3,3). Across: (3,2), (3,3), (3,4), so 3. Down: (2,3), (3,3), (4,3), so 3. The tile scores 6, and it counts itself in both runs. That double count is correct, and it is why tiles in a block score so well.

## The floor line

After the wall, count the tiles on your floor line, the starting player marker included, and subtract.

| Floor tiles | 1 | 2 | 3 | 4 | 5 | 6 | 7 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Points lost | 1 | 2 | 4 | 6 | 8 | 11 | 14 |

Your score cannot drop below 0. Once the seven spaces are full, any more fallen tiles go to the lid at no extra cost.

## The final count

When the game ends, finish that round's wall-tiling and floor first. Then add the bonuses, one player at a time:

- **Rows: 2 each.** Run a finger across each row of 5.
- **Columns: 7 each.** Run a finger down each column of 5.
- **Colors: 10 each.** On the colored side, each color's five spaces form a diagonal that wraps around the edge. Check one color at a time.

A player with 2 full rows, 1 full column, and 1 full color adds 4, 7, and 10, so 21 points. Write each bonus down before you move the marker, so a slip is easy to find.

If two players tie, the one with more complete horizontal rows wins. If that is tied too, they share the win.

<!-- AT OUR TABLE: one line on how Levi runs the final count at his table (who scores, out loud or on paper), and the slip he catches most often. -->

## A scoresheet helps

The score track works, but a marker gets bumped. A simple sheet with a column per player and a row per round costs nothing and makes every total easy to check. Write each player's score at the end of every round. The World Boardgaming Championships event asks players to do exactly that, as the competitive lesson at the end of this course explains.

With a routine like this, scoring stops being the slow part of the game. Everyone sees how adjacency pays, and that is the first step toward building a wall that scores well. Our [Azul strategy guide](/articles/azul-strategy/) shows where that leads.
