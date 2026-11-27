---
title: "Nash Equilibrium Explained with Board Games and Focal Points"
description: "Nash equilibrium explained for board gamers: best replies, why nobody changes alone, coordination games, and Schelling's focal points in Codenames and co-ops."
course: game-theory
order: 5
level: 1
emailSubject: "Nobody moves first"
pubDate: 2026-11-27
draft: false
oneIdea: "A Nash equilibrium is an outcome where every player is already making their best reply to the others, so nobody gains by changing alone. Some games have more than one, and players often settle on the one that stands out: a focal point."
tryThis: "Before your next co-op or team game, agree on one simple habit, such as what a certain kind of play means. Notice how often that shared habit saves you a guess."
nextTeaser: "Next: games played in turns. How to work back from the last move with backward induction, and why some threats across the table are empty."
---
Crossing out bad moves solves some games. Many it does not. When every choice is good against something, you need a different question: which outcomes are stable? That question is John Nash's, and it may be the most used idea in the field.

## Best replies, again

In [lesson 3](/academy/game-theory/game-theory-basics-payoff-matrix/) you marked your best reply in each column of a payoff table. Do that, then mark your opponent's best reply in each row. Any box marked twice is a **Nash equilibrium**: each player is making their best reply to what the other is doing. Nobody can do better by changing on their own.

The scout game from [lesson 4](/academy/game-theory/dominant-strategy/) ended at you Forest, they Hills. Check it. If they pick Hills, your Forest gives 4, better than 2 or 1. If you pick Forest, their Hills gives 3, better than 2. Both best replies, so it is an equilibrium. Whenever crossing out leaves a single box, that box is an equilibrium.

## What Nash proved

In 1950, Nash showed that every game with a limited number of players and choices has at least one equilibrium, as long as players may mix their choices at random. Rock, paper, scissors has no stable box at all, which is why its equilibrium is a mix, the topic of lesson 8.

Two warnings come with the idea. First, an equilibrium is not always good for anyone. The prisoner's dilemma in lesson 9 has one equilibrium, and both players hate it. Second, many games have more than one, and then the theory alone cannot tell you which will happen.

## Coordination: when you both want to match

Here is a game with two stable boxes. You and a friend each bring one game to a meetup without texting first. You prefer Wingspan, they prefer Root, and you both would rather play the same game together than bring different ones and play neither. Payoffs, yours first:

| | They bring Wingspan | They bring Root |
| --- | --- | --- |
| **You bring Wingspan** | 3, 2 | 0, 0 |
| **You bring Root** | 0, 0 | 2, 3 |

Mark the best replies. If they bring Wingspan, you should too (3 beats 0). If they bring Root, you should too (2 beats 0). Their best replies match yours. So both "Wingspan, Wingspan" and "Root, Root" are equilibria. (There is also a third, mixed equilibrium, where each of you picks at random, and it leaves you both worse off than either match.) The hard part is not finding a stable outcome. It is landing on the same one.

Some games are pure coordination, where everyone wants exactly the same thing. Codenames is one inside each team. The spymaster and the operatives want the same cards guessed. The trouble is only reading the clue the same way. "Jupiter" could mean a planet or a god, and the team wins when everyone picks the same reading.

## Focal points

Thomas Schelling noticed that people coordinate far better than the math suggests. In *The Strategy of Conflict* (1960), he asked people where and when they would meet someone in New York if neither had been told the place and they could not communicate. The most common answer was noon, at the information booth in Grand Central Station. Nothing about the station made it a better place to meet. It simply stood out. Schelling called answers like that **focal points**: the choice everyone expects everyone else to expect. Later lab experiments, including one by Judith Mehta, Chris Starmer, and Robert Sugden in 1994, found the same pull.

Board games are full of them. A round number in a trade. An even split. The obvious reading of a clue. Co-ops that limit talk lean on them hard. In Sky Team, once the dice are rolled, nobody may talk until the round ends. In The Crew, you may not hint at your cards except with one limited communication. The teams that do well build shared habits that make the next move obvious. The [Sky Team lesson on reading your partner](/academy/sky-team/sky-team-reading-your-partner/) shows what that looks like in practice.

## At the table

**In a coordination spot, be obvious.** A clever clue that only you understand loses to a plain clue the whole team reads the same way. The best Codenames clues are focal points.

**In a deal, offer the focal split.** Even shares and round numbers get accepted faster, because both sides can see them as fair without a long argument.

**Agree on habits before a co-op.** "If I play a high card early, I am saving my low ones" turns a guess into a shared expectation.

## At work

Many habits at work are equilibria. A meeting culture where everyone arrives five minutes late is stable: arriving on time alone just means you wait. Nobody gains by changing first, so nobody does. That is why speeches about punctuality fail. What works is moving everyone at once with a clear new focal point: "We start at the stated time, and the first five minutes are the decisions." When a leader names the new default and keeps it, being on time becomes the best reply for each person.

The same goes for file names, response times, and which channel a question belongs in. Pick a plain standard, say it out loud, and let it become the thing everyone expects.

## Sources

- John F. Nash, "Equilibrium Points in n-Person Games," *Proceedings of the National Academy of Sciences* 36, no. 1 (1950)
- The Nobel Prize in Economic Sciences 1994, press release, on Nash equilibrium: [nobelprize.org](https://www.nobelprize.org/prizes/economic-sciences/1994/press-release/)
- Thomas C. Schelling, *The Strategy of Conflict*, Harvard University Press (1960), on focal points and the New York question
- Judith Mehta, Chris Starmer, and Robert Sugden, "The Nature of Salience: An Experimental Investigation of Pure Coordination Games," *American Economic Review* 84, no. 3 (1994)
- Don Ross, "Game Theory," *Stanford Encyclopedia of Philosophy*: [plato.stanford.edu/entries/game-theory](https://plato.stanford.edu/entries/game-theory/)
