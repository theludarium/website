---
title: "The Pirate Islands: Scenario Playbook and Dice Math"
description: "A Pirate Islands playbook: the pirate fleet, warships, your one line of ships to your fortress, and the dice math that says when to attack and when to wait."
course: catan-seafarers
order: 16
level: 4
emailSubject: "Never attack a fortress with two warships"
pubDate: 2026-11-08
draft: false
oneIdea: "The Pirate Islands is a dice puzzle. Your warships set your odds against both the circling fleet and your fortress, so build warships before you build the last ship to the fortress, and attack only when the math favors you."
tryThis: "Before you build the ship that reaches your fortress, count your warships. If you have fewer than four, build a development card instead and wait a turn."
nextTeaser: "Next, The Wonders of Catan: five wonders, one claim each, and a race where the player who builds the most levels can win at 10 points."
---
The Pirate Islands has no robber, no Longest Route, and no Largest Army. A pirate fleet circles the board, and each player has one goal across the water: retake the fortress in their own color. You cannot win without it.

## Setup and special rules, in short

Each color starts with one settlement and one ship already on the coast of the main island in the east. You then place your usual two starting settlements on the main island, so everyone begins with three. On the western islands sit four pirate fortresses, each a settlement stacked on 3 pirate lair tokens, plus a beachhead marker for each color. In a 3 player game, the white locations are not used. Fortresses produce nothing.

The development deck changes: with 3 players, remove the Victory Point cards; with 4 players, treat them as Knight cards. The Longest Route and Largest Army tiles go back in the box, and so does the robber.

The rules that matter most:

- **The fleet moves first.** After you roll, before anyone collects or resolves a 7, the pirate moves along its path a number of hexes equal to the lower die.
- **The fleet attacks.** If it stops next to one of your buildings, it attacks you. Its strength is that same lower die. Your strength is your number of warships. If the pirate is stronger, you discard 1 random resource plus 1 more for each city. If you are stronger, you take 1 resource of your choice. A tie does nothing.
- **A 7** still makes big hands discard half. Then the roller steals 1 resource from any player.
- **One line of ships.** You may build only one unbranched line to the west. It starts at one of your coastal buildings on the main island, runs to your beachhead marker, and ends at your fortress, by the shortest path. Other routes on the main island are fine.
- **Beachhead.** Once your line reaches your beachhead marker, you may build a settlement there at normal cost.
- **Warships.** When you reveal a Knight card (or a Victory Point card at 4 players), turn the normal ship closest to your line's starting settlement on its side. It is now a warship. Knight cards do nothing else.
- **Fortress attacks.** Once your line reaches your fortress, you attack at the end of your Action phase, and your turn ends. Roll a die for the pirate's strength. More warships than that roll: remove a lair token. Fewer: lose the 2 ships nearest the fortress. Equal: lose 1. Remove all 3 lair tokens and the fortress becomes your settlement, producing and upgradable like any other. <!-- VERIFY: whether the attack is required at the end of every turn while the line touches the fortress, or optional; the rulebook says you attack "at the end of the Action phase when your route reaches the pirate fortress." -->

**To win,** you must have recaptured your fortress and have 10 or more points on your turn.

## The math that runs this scenario

**Against the fleet.** The lower of two dice is a lopsided number. Of the 36 rolls, 11 have a lower die of 1, 9 have a 2, 7 have a 3, 5 have a 4, 3 have a 5, and 1 has a 6. So:

| Your warships | You win | Tie | You lose |
| --- | --- | --- | --- |
| 0 | 0 of 36 | 0 of 36 | 36 of 36 |
| 1 | 0 of 36 | 11 of 36 | 25 of 36 |
| 2 | 11 of 36 | 9 of 36 | 16 of 36 |
| 3 | 20 of 36 | 7 of 36 | 9 of 36 |

No warships means every attack costs you cards. Three turn the fleet into a small income.

**Against your fortress.** Here the pirate rolls one die, and you need strictly more warships than the roll. With w warships, your chance to win one battle is (w minus 1) out of 6:

- 2 warships: 1 in 6
- 3 warships: 2 in 6
- 4 warships: 3 in 6
- 5 warships: 4 in 6
- 6 warships: 5 in 6

You need three wins, one per turn, and each loss costs ships to rebuild. With 2 warships you expect about 18 attacks. With 4, about 6. With 6, under 4. One warship can never win.

## Opening plan

Your two starting settlements should cover **wood and wool** for your line and **ore, grain, and wool** for development cards, since Knights are your only path to warships. A port that matches your strongest resource helps a lot.

## Midgame plan

Build your line to the beachhead and settle there for a point and a foothold. Keep buying development cards. Because warships are made from the ship nearest your starting settlement, they sit at the back of your line, safe from the 2 ships you lose in a failed attack.

A city next to the fleet's path makes every loss more expensive. A Road Building card gives two free ships, which can be the whole push from beachhead to fortress.

## The trap to avoid

Rushing the fortress. You choose when to build the last ship. Arriving with 2 warships gives you a 5 in 6 chance to lose ships. Stop one ship short, buy cards, and arrive with 4 or more. And the fortress alone is not enough: keep building cities so you reach 10 the turn you take it.

## Sources

- [CATAN Seafarers Rulebook, 6th edition (CATAN GmbH, 2025)](https://www.catan.com/sites/default/files/2025-03/CN3083%20CATAN%E2%80%93Seafarers%20Rulebook%202025%20secured%20reduced.pdf)
