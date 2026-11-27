---
title: "Dominant Strategy in Game Theory: Cross Out the Bad Moves First"
description: "Dominant strategy in game theory, shown with board games: spot a move that is best no matter what, cross out dominated moves, and solve a game step by step."
course: game-theory
order: 4
level: 1
emailSubject: "Cross out the bad moves first"
pubDate: 2026-11-27
draft: false
oneIdea: "A dominant strategy is a move that is best no matter what the others do, so you play it. A dominated move is worse than another move in every case, so you cross it out. Crossing out bad moves, round by round, can solve a whole game."
tryThis: "On your next long turn, name one move that is worse than another move whatever happens, and cross it off in your head before you weigh the rest."
nextTeaser: "Next: what to do when nobody has a dominant strategy. Best replies, Nash equilibrium, and the focal points that let players agree without talking."
---
Welcome to Level 1. You can map a game as a table or a tree. Now you start solving them. The first tool is the simplest, and it is the one strong players use on every turn without naming it: before you look for the best move, throw out the moves that are clearly worse.

## Two definitions

**A dominant strategy** is a choice that gives you a better result than any other choice, whatever the other players do. If you have one, play it. You do not need to guess anyone's mind.

**A dominated strategy** is a choice that is worse than some other choice in every case. If you have one, cross it out. No sensible player picks it.

There is a softer version too. A move is weakly dominant if it is never worse and sometimes better. That is still a good reason to choose it.

## A real one: the final turn in Ticket to Ride

In Ticket to Ride, the end is triggered when a player has two or fewer trains left at the end of their turn. Then every player, including that one, takes one final turn.

On that final turn, drawing train cards scores nothing, because the game ends before you can use them. Claiming any route you have the cards and trains for scores at least one point, and might complete a ticket. So, for your own score, claiming a route dominates drawing cards. (Drawing new destination tickets is not dominated in the same clean way, since a new ticket could happen to be complete already, but it is usually a bad gamble.) The point is not the exact rule. It is the habit: on a final turn, many options vanish once you ask which ones can still pay.

## Solve a game by crossing out

Here is a made-up mini game, with the kind of secret choice you make in Diplomacy, where every player writes orders in secret and they are revealed together. You and a rival each choose where to send a scout: you pick Forest, Hills, or Swamp, and your rival picks Forest or Hills. Payoffs are points, yours first.

| | They pick Forest | They pick Hills |
| --- | --- | --- |
| **You pick Forest** | 1, 2 | 4, 3 |
| **You pick Hills** | 3, 1 | 2, 2 |
| **You pick Swamp** | 2, 4 | 1, 0 |

At first, nobody has a dominant strategy. Your best move depends on theirs, and theirs depends on yours. So cross out.

**Step 1.** Compare your Swamp with your Hills. Against Forest, Hills gives you 3 and Swamp gives 2. Against Hills, Hills gives 2 and Swamp gives 1. Hills beats Swamp in both columns, so Swamp is dominated. Cross out the Swamp row.

**Step 2.** Now look at your rival's choices in the two rows that are left. If you pick Forest, they get 2 from Forest and 3 from Hills. If you pick Hills, they get 1 from Forest and 2 from Hills. With Swamp gone, Hills beats Forest for them every time. Cross out their Forest column. Notice that they only had this dominant choice because Swamp was gone: against Swamp, Forest paid them 4.

**Step 3.** Only their Hills column is left. You get 4 from Forest and 2 from Hills. Pick Forest.

The game ends at **you Forest, they Hills: 4 points to you, 3 to them.** Neither of you guessed. You simply refused to play bad moves and assumed your rival would refuse too.

That assumption matters. Step 2 works only if your rival knows you will never pick Swamp. Crossing out in rounds relies on each player trusting that the others are thinking clearly, and on each knowing the others trust that too. Against a brand-new player, take an extra look.

## The trap: crossing out the wrong thing

Dominance is only as good as your payoffs. A move can look dominated in points and still be the move a player wants. A friend playing to block you, or a player happy just to finish their favorite route, has different payoffs from yours. Cross out moves using their goals, not yours.

## At the table

Make crossing out your first step on any long turn. Most turns have several moves that are clearly worse than another, such as spending a resource you will need next turn for no gain. Removing them shrinks the decision, and a smaller decision is the best cure for [analysis paralysis](/articles/analysis-paralysis-board-games/). Then weigh what is left.

The same tool solves the most famous game in the field. In the prisoner's dilemma, betraying your partner is a dominant strategy, and that is exactly the problem. Lesson 9 takes it apart.

## At work

**Cross out dominated options.** In a vendor choice or a project plan, an option that costs more, takes longer, and carries more risk than another in every scenario you can imagine is dominated. Remove it from the slide. Meetings get shorter when the list does.

**Design for a dominant honest move.** The best incentives make the right action the best one whatever others do. If people who flag a delay early are thanked and helped, and people who hide it are not, flagging early becomes a dominant strategy. If early flags get punished, silence dominates, and the project learns about problems last.

## Sources

- Avinash Dixit and Barry Nalebuff, *Thinking Strategically*, W. W. Norton (1991), on using dominant strategies and eliminating dominated ones
- Don Ross, "Game Theory," *Stanford Encyclopedia of Philosophy*, on dominance and the assumption that players know each other are rational: [plato.stanford.edu/entries/game-theory](https://plato.stanford.edu/entries/game-theory/)
- Ticket to Ride rules, Days of Wonder, on the final turn and destination tickets
- Diplomacy rules, Avalon Hill, on writing orders in secret and revealing them together
