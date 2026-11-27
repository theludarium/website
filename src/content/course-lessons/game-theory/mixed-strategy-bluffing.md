---
title: "Mixed Strategy and Bluffing: How Often Should You Bluff?"
description: "Mixed strategy and bluffing in game theory: why being predictable loses, von Neumann's minimax, Skull and poker examples, and the math of how often to bluff."
course: game-theory
order: 8
level: 2
emailSubject: "How often should you bluff?"
pubDate: 2026-11-27
draft: false
oneIdea: "When being read would cost you, the best play is a mix: choose between moves at random, in the right proportions. Bluffing is a mixed strategy, and simple arithmetic tells you roughly how often to do it."
tryThis: "In your next bluffing game, decide each bluff with a hidden die roll instead of a feeling, for example bluffing only on a 1 or a 2. Watch how much harder you are to read."
nextTeaser: "Next: the prisoner's dilemma. Why two sensible players both betray each other, how playing again and again changes it, and what Axelrod's tournaments found."
---
Welcome to Level 2. Most games so far had a box where both players were happy to stay. Some games, like rock, paper, scissors, have no such box. Whatever you do, if your opponent knows it, they beat it. The answer, strange as it sounds, is to let chance choose for you.

## When no box is stable

Go back to the rock, paper, scissors table in [lesson 3](/academy/game-theory/game-theory-basics-payoff-matrix/) and mark the best replies. If they play Rock, you want Paper. If you play Paper, they want Scissors. If they play Scissors, you want Rock. The marks chase each other around the table forever. No box is marked twice, so there is no stable single choice.

The way out is to stop choosing a single move. If you play each of the three one third of the time, at random, nothing your opponent does can beat you on average. And if they do the same, nothing you do can beat them. That pair of mixes is the equilibrium. A choice made at random in set proportions is called a **mixed strategy**.

## What von Neumann proved

In 1928, John von Neumann proved the minimax theorem. In any two-player zero-sum game with a limited number of choices, each player has a mix that guarantees them a certain average result no matter what the other player does, and the two guarantees meet at the same value. You cannot be exploited if you play your mix, and you cannot exploit an opponent who plays theirs.

It works in the real world too. Ignacio Palacios-Huerta studied more than 1,400 penalty kicks in professional soccer, where the kicker and the goalkeeper choose sides at nearly the same moment. He found that professionals mixed their choices very close to what the theory predicts.

## Bluffing is mixing

Von Neumann and Morgenstern's 1944 book includes a section on poker and bluffing, using a simplified version of the game. Their conclusion was that bluffing is not a personality quirk. It is part of the best way to play. A player who bets only with strong hands is easy to read: everyone folds when they bet. A player who bluffs too often gets called and loses. The best rate sits in between.

Skull shows the same idea at a party table. Each player has three flower discs and one skull. When you win the bid, you must flip your own discs first. If you never play your skull early, opponents learn your stack is safe and bid with confidence. If you always do, they never bid into you. A mix keeps them guessing, which is the whole game. Our article on [social deduction games](/articles/best-social-deduction-games/) covers more games built on the same tension.

## The math of a bluff

Here is a simplified poker spot, the kind *The Mathematics of Poker* by Bill Chen and Jerrod Ankenman builds on. The pot has 10 chips. You bet 10. Your opponent can fold, or call by paying 10 to win the 20 in the middle.

**Their side.** Calling risks 10 to win 20. A call breaks even if it wins one time in three. So if one of every three of your bets is a bluff, calling and folding pay them the same, and they cannot gain by guessing right about you.

Check it with three bets, two strong and one bluff, against a player who always calls:

| Your bet | They call and | Their result |
| --- | --- | --- |
| Strong hand | lose | minus 10 |
| Strong hand | lose | minus 10 |
| Bluff | win | plus 20 |
| **Total** | | **0** |

**Your side.** A bluff risks 10 to win the 10 in the pot. It pays if they fold more than half the time. So to stop your bluffs from paying, they should call half the time.

The exact numbers change with the size of the bet. The lesson does not. There is a right amount to bluff, it is neither never nor always, and you can work it out.

## How to be random on purpose

People are bad at being random. We avoid repeats and fall into patterns. So use a tool. Roll a die out of sight, or glance at the second hand on a clock, and bluff on a set result. A bluff one time in three is a 1 or 2 on a six-sided die.

## When not to mix

Mixing matters only when being read costs you. In a co-op, be as predictable as you can. In Codenames, a teammate who can read you is a gift. Mix against opponents, never against your own team.

## At the table

In bluffing games, decide your mix before the game, then let a hidden roll pick each time. In open games, vary your openings so a regular opponent cannot prepare for you.

## At work

At work, predictability is usually a strength. Colleagues trust people whose actions they can foresee, and you should never bluff your own team. Mixing earns its place in a narrow set of jobs where someone might try to dodge a check: random quality samples, spot audits, unannounced security tests. Even there, the fair way is to be open about the policy and random about the timing. Everyone knows checks happen, nobody knows when, so the best reply is to do the work right every time. That is an incentive, not a trick.

## Sources

- John von Neumann, "Zur Theorie der Gesellschaftsspiele," *Mathematische Annalen* 100 (1928), the minimax theorem
- John von Neumann and Oskar Morgenstern, *Theory of Games and Economic Behavior*, Princeton University Press (1944), the section on poker and bluffing
- Ignacio Palacios-Huerta, "Professionals Play Minimax," *Review of Economic Studies* 70, no. 2 (2003)
- Bill Chen and Jerrod Ankenman, *The Mathematics of Poker*, ConJelCo (2006)
- Skull rules, Space Cowboys, on the discs and revealing your own first
- Don Ross, "Game Theory," *Stanford Encyclopedia of Philosophy*, on mixed strategies: [plato.stanford.edu/entries/game-theory](https://plato.stanford.edu/entries/game-theory/)
