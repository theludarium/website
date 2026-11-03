---
title: "Arcs Battle Dice: Assault, Skirmish, and Raid Odds"
description: "Arcs battle dice odds: what each assault, skirmish, and raid die face does, expected hits and self-hits, intercept risk, raiding math, and how to pick a pool."
course: arcs
order: 7
level: 3
emailSubject: "Which Arcs dice to roll, with the math"
pubDate: 2026-11-03
draft: false
oneIdea: "In Arcs the attacker picks the risk. Skirmish dice are safe and slow, assault dice are fast and cost you ships, and raid dice steal and hit buildings but invite the intercept. Choose the pool for the job, not for the biggest number."
tryThis: "Before each battle in your next game, say the job out loud (clear ships, hit a building, or steal) and pick dice using the tables in this lesson."
nextTeaser: "Next, Leaders and Lore: how the draft works, what a leader changes, and how to pick a pair that fits your plan."
---
Welcome to Level 3. At Level 2 you learned what to fight for. Now you learn how to fight. Arcs battle is unusual: only the attacker rolls, and the attacker chooses which dice to roll, one per attacking ship. So every battle starts with a question you answer before the dice leave your hand. What is this fight for?

## The three dice

Each attacking ship lets you collect one die of any type, and you can mix types. You may take fewer dice than ships, but never more than six of one type.

<!-- VERIFY: the rulebook does not list die faces in text. These layouts match two independent fan sources (Void Companion and the wretched.computer dice analysis), and every table below was recomputed from them; confirm on the physical dice. -->

**Skirmish:** three blank faces and three faces with one hit.

**Assault:** one blank face, one with two hits, one with two hits and a self-hit, one with a hit and an intercept, and two with a hit and a self-hit.

**Raid:** one with an intercept and two keys, one with a hit and a key, one with a building hit and a key, two with a hit and a building hit, and one with only an intercept.

## Per die, on average

| Die | Hits | Self-hits | Building hits | Keys | Chance of intercept |
| --- | --- | --- | --- | --- | --- |
| Skirmish | 0.50 | 0 | 0 | 0 | 0% |
| Assault | 1.17 | 0.50 | 0 | 0 | 17% |
| Raid | 0.50 | 0 | 0.50 | 0.67 | 33% |

Assault deals more than twice the hits of a skirmish die, and it costs you half a hit on your own ships for every die.

## The intercept

If any die shows an intercept, the defender intercepts once: you take one hit for each **fresh** defending ship. One intercept or five, it happens once per battle. That makes the intercept a pool-level risk:

| Dice | Chance of an intercept |
| --- | --- |
| 2 assault | 31% |
| 3 assault | 42% |
| 2 raid | 56% |
| 3 raid | 70% |

Against three fresh defending ships, an intercept is three hits on your fleet. Against none, it is nothing. So raid and assault dice are safest when the defender's ships are already damaged or gone.

## Order matters

The attacker resolves everything in a fixed order: your self-hits, then the intercept, then your hits on ships, then building hits, then raiding. Hits on ships spill over to buildings once no defending ships remain. And you can only raid if at least one of your attacking ships survives the first two steps.

That last rule is the trap. A small raid with two ships can roll well and still lose both ships to self-hits and an intercept before it steals anything.

## Clearing ships

When the job is to damage or destroy defending ships, these are your chances of rolling at least the given number of hits:

| Pool | 2+ hits | 3+ hits | 4+ hits |
| --- | --- | --- | --- |
| 3 skirmish | 50% | 13% | 0% |
| 3 assault | 95% | 80% | 51% |
| 2 assault, 1 skirmish | 89% | 62% | 28% |
| 4 skirmish | 69% | 31% | 6% |
| 4 assault | 99% | 94% | 80% |

Three assault dice average 3.5 hits but also 1.5 self-hits, plus the intercept risk. A useful middle pool is two assault and a skirmish: most of the punch, one fewer self-hit on average.

Remember what a hit does. Fresh pieces become damaged, and damaged pieces are destroyed. Two fresh defending ships need four hits to destroy, but only two to damage, and damaged ships no longer count for control.

## Hitting buildings and raiding

Raid dice are the building and theft dice. You can only collect them if the defender has buildings in the battle system, or has no buildings anywhere.

Against a building with no defending ships, every hit and building hit lands on buildings:

| Raid dice | 1+ building hit | 2+ building hits | 2+ keys | 3+ keys |
| --- | --- | --- | --- | --- |
| 1 | 67% | 33% | 17% | 0% |
| 2 | 89% | 67% | 42% | 14% |
| 3 | 96% | 85% | 62% | 33% |

Keys pay for theft. Each resource slot on a player board and each Guild card shows a **raid cost** in keys, and you steal one item at a time by spending that many. Stealing a resource can swing an ambition twice: you gain one and your Rival loses one. A destroyed city also makes you Provoke Outrage and lets you Ransack the Court, so check what you hold of that planet type before you burn it.

## A fight checklist

1. **Name the job.** Control, Trophies, a building, or theft.
2. **Count fresh defenders.** That is your intercept cost.
3. **Pick the pool.** Skirmish when you cannot afford losses, assault to clear ships, raid for buildings and keys.
4. **Check Warlord.** Your destroyed ships become their Trophies.
5. **Keep ships fresh afterward.** Damaged ships do not hold control.

For a Leder Games game with very different battle math, see the [Root battle odds lesson](/academy/root/root-battle-odds/).
