---
title: "Game Theory Basics: How to Read a Payoff Matrix and a Game Tree"
description: "Game theory basics: map any game by its players, choices, payoffs, and information, then draw it as a payoff matrix or a game tree to sketch on a score pad."
course: game-theory
order: 3
level: 0
emailSubject: "Draw the game before you play it"
pubDate: 2026-11-27
draft: false
oneIdea: "Any game can be mapped by its players, choices, payoffs, and information. When players choose at the same time, draw a payoff table. When they take turns, draw a game tree."
tryThis: "At your next game, sketch one decision on the score pad as a small table or tree, with your best guess at each player's payoff. Then check it against what happens."
nextTeaser: "Level 1 starts with dominant strategies: how to spot a move that is best no matter what, and how crossing out bad moves can solve a game."
---
Game theorists draw games before they solve them. The drawings are simple: a grid for choices made at the same time, and a branching tree for choices made in turns. You can sketch either one on the back of a score pad in under a minute. This lesson shows how to read and draw both, using the four questions from [lesson 1](/academy/game-theory/what-is-game-theory/).

## The four parts of every game

**Players.** The people who decide. In Pandemic the disease deck shapes every turn, but it wants nothing, so it is part of the setting, not a player. Game theorists treat it as chance, sometimes called Nature. In a negotiation, a person who never speaks but can veto the deal is a player.

**Choices.** What each player can do. Game theorists call a full plan of choices a strategy.

**Payoffs.** What each player gets from each outcome, measured in whatever they care about. Points are a good start. Wins, fun, and pride count too.

**Information.** Who knows what. Chess has perfect information: everything is on the board. In Codenames, the spymasters see the key card and their operatives do not. Information also covers timing. In chess, you see a move before you answer it. In Cosmic Encounter, the two main players each choose an encounter card in secret and reveal them together, so neither sees the other's choice first.

That last difference decides which drawing you use.

## Same time: the payoff table

When players choose at the same moment, or without seeing each other's choice, draw a table. Your choices go down the side. Theirs go across the top. Each box shows what happens, with your payoff first.

Rock, paper, scissors is the classic. Score a win as 1, a loss as minus 1, and a tie as 0.

| | They play Rock | They play Paper | They play Scissors |
| --- | --- | --- | --- |
| **You play Rock** | 0, 0 | -1, 1 | 1, -1 |
| **You play Paper** | 1, -1 | 0, 0 | -1, 1 |
| **You play Scissors** | -1, 1 | 1, -1 | 0, 0 |

**How to read it.** Pick a column, which means you assume what they will do. Look down that column at your numbers and find your best reply. If they play Rock, your best reply is Paper, because 1 beats 0 and minus 1. Mark it. Do the same for every column. Then do the same for them, across each row.

That one habit, finding the best reply to each possible move, is the engine of the next three lessons.

Notice something else: in every box, the two numbers add up to zero. Whatever you win, they lose. Lesson 7 is about games where that is not true.

## Turns: the game tree

When players take turns and see what came before, draw a tree. Each fork is a decision. The ends of the branches show the payoffs.

Take a trade in Catan. On your turn, you may trade resources with the other players. Say you need ore, and your neighbor needs wool. You can make a generous offer or a stingy one, and then they accept or decline. Here is a tree with made-up payoffs, measured as "how much closer this gets me to winning," yours first:

- **You offer two wool for one ore**
  - They accept: **2, 2**
  - They decline: **0, 0**
- **You offer one wool for one ore**
  - They accept: **3, 1**
  - They decline: **0, 0**

**How to read it.** Start at the ends and work back. If you make either offer, your neighbor gains by accepting (2 or 1 beats 0). So they accept both. Knowing that, you compare 2 against 3 and make the stingy offer.

Now the human part. If the stingy offer annoys your neighbor, their real payoff for accepting might drop below zero, and they decline. The tree did not fail. The payoffs were wrong. Good maps include what people actually feel. Lesson 6 goes deeper into trees, and the Catan course has a full lesson on [the art of the trade](/academy/catan/art-of-the-trade/).

## Payoffs are what players want

The most common mapping mistake is to assume everyone wants the most points. In The Crew, everyone shares one payoff: the team wins or loses the mission together. A new player might care most about not looking foolish. A player who cannot win may care about who does, which is where [kingmaking](/articles/kingmaking-board-games/) comes from. Write down what each player wants, not what you would want in their seat.

## At the table

Use a sketch only for big decisions: a trade that could decide the game, a bid, a final turn. Ask the four questions, choose the table or the tree, fill in rough payoffs, and find each player's best reply. Rough numbers are fine. The point is to see the other side's choice clearly.

## At work

Before a decision that involves another team, sketch it. Say two teams each choose whether to share a tool or build their own. A two by two table with your honest guess at each team's payoffs often shows the problem at once: maybe sharing is better for both, but each team is rewarded only for its own launch date. Then the fix is not persuasion. It is changing what each team is rewarded for, so the shared choice is the best reply for both.

## Sources

- John von Neumann and Oskar Morgenstern, *Theory of Games and Economic Behavior*, Princeton University Press (1944), which set out games as tables of strategies and as trees of moves
- Don Ross, "Game Theory," *Stanford Encyclopedia of Philosophy*: [plato.stanford.edu/entries/game-theory](https://plato.stanford.edu/entries/game-theory/)
- Avinash Dixit and Barry Nalebuff, *The Art of Strategy*, W. W. Norton (2008), on payoff tables and game trees
- CATAN base game rules, Catan GmbH, on trading with other players during your turn
- Cosmic Encounter rulebook, Fantasy Flight Games, on choosing and revealing encounter cards
