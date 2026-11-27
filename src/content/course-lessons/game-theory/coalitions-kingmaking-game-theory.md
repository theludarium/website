---
title: "Coalitions and Kingmaking: Game Theory for Multiplayer Games"
description: "Coalitions and kingmaking in game theory: why tables turn on the leader, why alliances break, how the Shapley value splits gains, and how to handle kingmakers."
course: game-theory
order: 14
level: 3
emailSubject: "Why the table always turns on the leader"
pubDate: 2026-11-27
draft: false
oneIdea: "With three or more players, the game is also about who teams up with whom. Alliances form against a leader and break once the threat is gone, and your share of any deal depends on how much the group needs you."
tryThis: "At your next game with three or more players, ask once per round: who is the leader, and who has the most reason to stop them? Then decide whether that player should be you."
nextTeaser: "Level 4 begins: you stop playing the rules and start writing them. Mechanism design, I cut you choose, and how designers make good play the best play."
---
Most of the tables in this course have had two players. Add a third and the game changes shape. Now two players can gang up on one, a weak player can decide who wins, and every deal has an audience. John von Neumann and Oskar Morgenstern saw this in 1944: with three or more players, the question of who teams up with whom becomes part of the game itself.

## Why the table turns on the leader

In a game with one winner, every player who is not winning has the same problem: the leader. If you are in third, a point taken from the leader is often worth more to you than a point added to yourself. So the best reply for most of the table is to slow whoever is ahead.

That is why being visibly ahead is costly in Root, Twilight Imperium, Diplomacy, and many other games. Root even counts on it. One faction often cannot stop a runaway alone, so the table has to act together, as the [Root table talk lesson](/academy/root/root-table-talk-kingmaking/) explains. Strong players learn to look less dangerous than they are, and to point the table at someone else.

## Why alliances fall apart

William Riker's *The Theory of Political Coalitions* (1962) argued for a size principle: groups tend to form coalitions just big enough to win, because every extra partner takes a share of the prize. Later work has argued over how far that holds, but it explains a pattern every Diplomacy player knows. Two players team up to stop a third. The moment the third is no longer a threat, the alliance has no reason to exist, and each partner is now the other's biggest rival.

So when you join an alliance, plan for its end. Know where you want to stand when it breaks, and expect your partner to be planning the same.

## Who deserves what: the Shapley value

Lloyd Shapley's 1953 paper "A Value for n-Person Games" offered a way to split a group's gains fairly: pay each player the average value they add, across every order in which the group could come together. Shapley shared the 2012 Nobel Prize with Alvin Roth.

Here is a tiny example. Ana holds the only brick. Ben and Cal each hold a wheat. A deal needs one brick and one wheat, and it is worth 6 points. A second wheat adds nothing. Line the three up in every possible order, and give each player the value the deal gains when they arrive.

| Order | Ana adds | Ben adds | Cal adds |
| --- | --- | --- | --- |
| Ana, Ben, Cal | 0 | 6 | 0 |
| Ana, Cal, Ben | 0 | 0 | 6 |
| Ben, Ana, Cal | 6 | 0 | 0 |
| Ben, Cal, Ana | 6 | 0 | 0 |
| Cal, Ana, Ben | 6 | 0 | 0 |
| Cal, Ben, Ana | 6 | 0 | 0 |
| **Average** | **24 ÷ 6 = 4** | **6 ÷ 6 = 1** | **6 ÷ 6 = 1** |

Ana gets 4 of the 6, because every deal needs her and only one of the others. The lesson is simple: **scarcity sets your share.** Late in a game of Catan, the only player with brick can ask for a lot. If you are the one with wheat, your best move is to find a second source of brick, or to become needed yourself.

## Kingmaking

Kingmaking happens when a player who cannot win decides who does. Game theory has an awkward answer here: if the kingmaker's own result is the same either way, the theory gives them no reason to choose one move over the other. That is exactly why kingmaking causes so many arguments. Nothing in the payoffs settles it, so the table has to.

Some games build it in. In Root games of four or more, the Vagabond can use a dominance card to form a coalition with the player in last place. He stops scoring, and he wins if they win. Some tournaments turn that off: the [2026 World Boardgaming Championships Root event](https://www.boardgamers.org/wbc26/previews/rot.html) allowed no coalitions in its second and third heats or its semifinal. Our article on [kingmaking in board games](/articles/kingmaking-board-games/) covers calm ways to handle it.

## At the table

- **Agree on a kingmaking norm before the game.** One option: if you cannot win, play for your best finish, and if that does not change, hit whoever is closest to winning.
- **Do not look like the leader until you have to.** Count what you show.
- **Join alliances with an exit in mind.**
- **Ask what you add.** If every deal needs you, your price goes up. If anyone could replace you, it goes down.

## At work

Big projects are coalitions. A proposal needs support from people with their own goals, and the size principle warns against building the smallest group that can push it through, because the people left out may be the ones you need next quarter. The Shapley idea gives a fair way to think about credit: what would the result have been without each person? Use it to recognize the quiet contributor whose work every part depended on, not to keep score against colleagues.

## Sources

- John von Neumann and Oskar Morgenstern, *Theory of Games and Economic Behavior*, Princeton University Press (1944)
- Lloyd S. Shapley, "A Value for n-Person Games," in H. W. Kuhn and A. W. Tucker, eds., *Contributions to the Theory of Games II*, Annals of Mathematics Studies 28, Princeton University Press (1953): 307 to 317
- The Nobel Prize in Economic Sciences 2012, press release: [nobelprize.org](https://www.nobelprize.org/prizes/economic-sciences/2012/press-release/)
- William H. Riker, *The Theory of Political Coalitions*, Yale University Press (1962)
- Don Ross, "Game Theory," *Stanford Encyclopedia of Philosophy*: [plato.stanford.edu/entries/game-theory](https://plato.stanford.edu/entries/game-theory/)
