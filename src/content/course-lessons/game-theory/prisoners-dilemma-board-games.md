---
title: "The Prisoner's Dilemma in Board Games: Trust, Tit for Tat, and Axelrod"
description: "The prisoner's dilemma in board games: why both players defect, how repeated play changes it, what Axelrod's tournaments found, and how tit for tat plays out."
course: game-theory
order: 9
level: 2
emailSubject: "Why good players betray each other"
pubDate: 2026-11-27
draft: false
oneIdea: "In a prisoner's dilemma, each player does better by defecting whatever the other does, yet both do worse when both defect. Play it once and defection wins. Play it again and again, and a simple, forgiving habit like tit for tat can keep cooperation alive."
tryThis: "In your next game with deals or alliances, play tit for tat on purpose: keep your first promise, answer a betrayal once, then offer peace again. Note how the table responds."
nextTeaser: "Next: hidden information. What other players know that you do not, which signals you can trust, why cheap talk is cheap, and how hidden-role games turn it into play."
---
This is the most famous game in game theory, and you have played it many times without the name. Two players can both do well by holding back. Each is tempted to grab a little more. If both grab, both lose. Learning to see this shape, and what keeps people out of it, is one of the most useful things in this course.

## Where it came from

In 1950, Merrill Flood and Melvin Dresher, two researchers at the RAND Corporation, had two colleagues play a game with this shape 100 times in a row, to see whether they would land on the Nash equilibrium. They did not, quite: they cooperated far more often than the theory predicted. That same year, the Princeton mathematician Albert Tucker gave a talk to psychologists at Stanford and dressed the game up as a story about two prisoners questioned separately, each offered a deal to testify against the other. The story stuck, and the game came to be called the prisoner's dilemma.

## The game in points

Here it is in points, with your payoff first.

| | They cooperate | They defect |
| --- | --- | --- |
| **You cooperate** | 3, 3 | 0, 5 |
| **You defect** | 5, 0 | 1, 1 |

Use the tool from [lesson 4](/academy/game-theory/dominant-strategy/). If they cooperate, defecting gets you 5 instead of 3. If they defect, defecting gets you 1 instead of 0. Defect is a dominant strategy, for both of you. So the only Nash equilibrium is "defect, defect," at 1 point each, though "cooperate, cooperate" would give each of you 3. Each player is being sensible, and the pair ends up worse off. That gap is the dilemma.

## Where you have seen it

**Military in 7 Wonders.** At the end of each Age, you compare shields with each neighbor. More shields takes a victory token, fewer takes a minus 1, and a tie gives neither of you anything. If you both skip military, you tie and both spend your picks elsewhere. If one of you builds, that player wins the token and the other takes the minus 1. If both build, you tie again, and you both spent picks to get nowhere. That is the dilemma's shape, played out card by card. The [7 Wonders course](/academy/7-wonders/) covers when military is worth the picks.

**Alliances in Diplomacy.** Nothing in the rules makes a promise binding. Two allies both gain by holding a border together. Each gains more by stabbing first.

**Leader-bashing.** Everyone gains if the leader is slowed, but each player would rather someone else spend the turn doing it.

## Play it again

The picture changes when the same players meet again. A defection today can be answered tomorrow. Robert Axelrod called this the shadow of the future: the longer it falls across today, the more cooperation pays.

Notice the catch from [lesson 6](/academy/game-theory/backward-induction-game-trees/). If everyone knows exactly when the last round is, there is no future to protect in it, so defection wins there. Then the round before it looks like a last round too, and so on back. In theory, a known end can unravel cooperation all the way. In practice, people cooperate more than that, but you can feel trust thin out as the end of a game nears.

## Axelrod's tournaments

Around 1980, Axelrod invited experts to submit computer programs to play the repeated prisoner's dilemma against each other. Fourteen entries came in, and he added one that chose at random. The winner was the simplest program in the field, sent in by the psychologist Anatol Rapoport: **tit for tat**. It cooperates on the first move, then copies whatever the other player did last time.

Axelrod published the results and ran a second tournament. Sixty-two entries came in, and every entrant knew the first results. Tit for tat won again. In *The Evolution of Cooperation* (1984), Axelrod named four traits behind its success:

- **Nice.** It is never the first to defect.
- **Retaliatory.** It answers a defection right away.
- **Forgiving.** It returns to cooperating as soon as the other player does.
- **Clear.** It is easy for others to read, so they learn quickly that cooperating pays.

One caution. Later research found that tit for tat's success depends on the field it faces and on the exact payoffs. When moves can be mistaken, for example, a little extra forgiveness does better, because two tit for tat players can get stuck answering each other's accidents. The four traits travel well. The exact program does not.

<!-- AT OUR TABLE: a moment from Levi's regular group where a broken deal carried over to the next game night, and how the group got past it. -->

## At the table

**Your group is a repeated game.** A stab in tonight's game is remembered next month. Players with a reputation for keeping deals get offered better ones. That does not mean never betraying in a game built on it, such as Diplomacy, where the table expects it. It means knowing that your table keeps score across games.

**Play the four traits.** Open with a fair deal. If someone breaks one, answer once, in proportion. Then offer a clean slate. Say what you are doing so others can read you.

## At work

Many teams sit in a prisoner's dilemma without seeing it. Two departments share a budget, and each pads its request in case the other does. Both padding leads to bad plans for everyone. Lectures about trust rarely fix it. Changing the game does:

- **Change the payoffs.** Reward accurate forecasts, not big ones.
- **Lengthen the shadow of the future.** Make the work visible and ongoing, so good faith is noticed and remembered.
- **Lead with cooperation, answer in proportion, and forgive.** It is tit for tat with a human face, and it builds the kind of reputation that makes the next deal easy.

## Sources

- Steven Kuhn, "Prisoner's Dilemma," *Stanford Encyclopedia of Philosophy*: [plato.stanford.edu/entries/prisoner-dilemma](https://plato.stanford.edu/entries/prisoner-dilemma/)
- Merrill M. Flood, "Some Experimental Games," Research Memorandum RM-789-1, RAND Corporation (1952), reporting the 1950 experiment with Melvin Dresher
- Robert Axelrod, "Effective Choice in the Prisoner's Dilemma," *Journal of Conflict Resolution* 24, no. 1 (1980), and "More Effective Choice in the Prisoner's Dilemma," *Journal of Conflict Resolution* 24, no. 3 (1980)
- Robert Axelrod, *The Evolution of Cooperation*, Basic Books (1984)
- Amnon Rapoport, Darryl A. Seale, and Andrew M. Colman, "Is Tit-for-Tat the Answer? On the Conclusions Drawn from Axelrod's Tournaments," *PLoS ONE* (2015)
- 7 Wonders rulebook, second edition (2020), Repos Production, on military conflicts
- Diplomacy rules, Avalon Hill, on negotiation
