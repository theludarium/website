---
title: "Backward Induction: Think Ahead in Game Trees and Spot Empty Threats"
description: "Backward induction for board gamers: solve a game from the last move back, win the take-away counting game, and see why some threats at the table are empty."
course: game-theory
order: 6
level: 1
emailSubject: "Start at the end"
pubDate: 2026-11-27
draft: false
oneIdea: "In a game played in turns, start at the last move and work back: at each fork, assume the player there makes their best choice. That shows you the right move now, and it shows which threats are empty, because a threat the player would not want to carry out will not be carried out."
tryThis: "In your next game, during the last round, ask what each player will do on their final turn. Then plan your second to last turn around those answers."
nextTeaser: "Next: zero-sum and positive-sum games. How to tell whether only one of you can win, and why trades, co-ops, and semi-co-ops change your best move."
---
Strong players seem to see the future. Mostly they look at the end of the game first and work back to now. Game theorists call it backward induction. Avinash Dixit and Barry Nalebuff boil it down to a rule of thumb: look forward, reason backward. This lesson gives you a game to practice it on tonight, then uses it to spot threats that are only talk.

## A game you can play with coins

Put 21 coins in a pile. Two players take turns removing 1, 2, or 3 coins. Whoever takes the last coin wins.

Start at the end.

- **1, 2, or 3 coins left on your turn:** take them all and win.
- **4 coins left:** whatever you take, you leave 1, 2, or 3, and your opponent wins. Four is a losing spot.
- **5, 6, or 7 coins left:** take enough to leave exactly 4, and your opponent is stuck. You win.
- **8 coins left:** whatever you take leaves 5, 6, or 7, and your opponent leaves you 4. Another losing spot.

The pattern: any pile that is a multiple of 4 loses for the player about to move. From 21, the first player takes 1, leaving 20. After that, whenever the opponent takes some coins, take enough to make the total for the round 4. The pile goes 20, 16, 12, 8, 4, 0, and the first player takes the last coin.

Games like this have a long history. Charles Bouton published a full solution to Nim, a cousin of this game with several piles where you may take any number from one pile, in the *Annals of Mathematics* in the early 1900s. Play the 21 game a few times with someone who has not seen the trick. It is the clearest ten-second demo of thinking backward there is.

## Why chess is still interesting

Ernst Zermelo asked in 1913 whether chess, played perfectly, has a fixed result. For any game with no hidden information, no dice, and a guaranteed end, working back from every possible ending would, in principle, give the answer. Chess has too many positions for anyone to do it, so it is still unsolved. Checkers is smaller. In 2007, a team led by Jonathan Schaeffer finished the computation and showed that checkers, played perfectly by both sides, is a draw.

## Empty threats

Backward induction has a second use: testing whether a threat is real.

Picture the last round of a game. A player who cannot win says: "Give me that card, or I will spend my last turn making sure you lose." Carrying out the threat would also cost them, say, dropping from second place to third. Here is the tree, with made-up payoffs for final standing, yours first:

- **You give in**
  - Result: **1, 3**
- **You refuse**
  - They carry out the threat: **0, 0**
  - They let it go: **3, 2**

Work back. If you refuse, they choose between 0 and 2. They let it go. Knowing that, you compare giving in (1) with refusing (3) and refuse. The threat was empty, because once the moment came, carrying it out would have been their worse move.

Reinhard Selten made this precise in the 1960s and 1970s with the idea of a subgame perfect equilibrium: only count plans that a player would still want to follow when the moment actually arrives. It was part of his share of the 1994 Nobel prize.

Two cautions. First, check their real payoffs. A player who enjoys revenge, or who wants a reputation for keeping threats over many game nights, may carry it out after all. Lesson 13 covers how people make threats believable on purpose. Second, a refusal can still sting. Be kind about it. Our article on [kingmaking](/articles/kingmaking-board-games/) has calm ways to handle a player who decides the winner.

## The last round changes everything

Backward induction also explains a pattern you have seen many times. Deals get harder near the end. A favor now is usually repaid later, but in the final round there is no later. Players who think ahead see that, so the round before gets shaky too. In Ticket to Ride, the final round starts when someone ends a turn with two or fewer trains, and you can feel the table change. Lesson 9 shows how repeated games keep cooperation alive, and why a known end strains it.

## A limit worth knowing

Real people do not reason back as far as the theory says. In the centipede game, two players take turns either grabbing a growing pot or passing it on. Backward induction says the first player should grab it at once. In experiments Richard McKelvey and Thomas Palfrey published in 1992, players kept passing much longer than that. Thinking backward tells you what a perfectly logical player would do. Your friends are a little more hopeful than that.

## At the table

In the last round, list each player's best final move before you take your second to last turn. In any race to a target, find the "multiple of 4" spots: the positions you want to hand your opponent.

## At work

**Plan from the finish.** Before a project, write the end state, then ask what must be true one step before it, then one step before that. Deadlines slip less when the plan is built backward.

**Make only threats you would carry out, and prefer promises.** A policy like "late requests will never be accepted" is not believed if everyone knows you will cave for a big client. Set rules you will actually keep. Better still, offer clear, fair commitments people want, such as "requests in by Tuesday ship Friday."

## Sources

- Avinash Dixit and Barry Nalebuff, *Thinking Strategically*, W. W. Norton (1991), on looking forward and reasoning backward
- Charles L. Bouton, "Nim, a Game with a Complete Mathematical Theory," *Annals of Mathematics* 3 (1901 to 1902)
- Ulrich Schwalbe and Paul Walker, "Zermelo and the Early History of Game Theory," *Games and Economic Behavior* 34 (2001)
- Jonathan Schaeffer and others, "Checkers Is Solved," *Science* 317 (2007)
- The Nobel Prize in Economic Sciences 1994, press release, on Selten's work: [nobelprize.org](https://www.nobelprize.org/prizes/economic-sciences/1994/press-release/)
- Richard D. McKelvey and Thomas R. Palfrey, "An Experimental Study of the Centipede Game," *Econometrica* 60, no. 4 (1992)
- Ticket to Ride rules, Days of Wonder, on the final round
