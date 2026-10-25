---
title: "Attack Math: Counting to Lethal in the One Piece Card Game"
description: "One Piece Card Game attack math: how much Counter each attack forces, how many hits lethal takes, and how to spread DON!! so the defender cannot stop them all."
course: one-piece-card-game
order: 13
level: 3
emailSubject: "Is this turn lethal? Count it"
pubDate: 2026-10-25
draft: false
oneIdea: "The defender only has to stop enough attacks, and they will stop the cheapest ones. Lethal comes from making every attack expensive, not from making one attack huge."
tryThis: "On any turn your opponent is at 2 Life or fewer, say three numbers out loud before you attack: hits you need, attacks you have, and the Counter each attack forces."
nextTeaser: "Next, reading your opponent: what the public information tells you about the cards they are holding, and what their DON!! say about their next move."
---
Welcome to Level 3. At Level 2 you learned to count cards. Now you count power. The One Piece Card Game moves in steps of 1000, ties go to the attacker, and both players can see almost everything that matters. That makes it one of the most countable trading card games there is. A turn that looks like a hopeful swing can often be worked out before you rest a single card.

## Hits needed

Your opponent loses when their Leader takes damage while they have 0 Life cards. So the number of Leader hits you need is **their Life plus 1**. At 2 Life you need 3 hits. At 0 Life you need 1.

Double Attack changes the count, with one catch. A Double Attack hit deals 2 damage, so at 2 or more Life it takes 2 Life cards and counts as 2 of your hits. But the rules check for the win only once, when the hit lands: if the defender has 0 Life at that moment, you win. At 1 Life, a Double Attack hit takes the last Life card and the game goes on, so you still need one more hit. Count Double Attack as 2 hits only while the defender has at least 2 Life left. <!-- VERIFY: the Comprehensive Rules (7-1-4-1-1-1 to 7-1-4-1-1-3) repeat only the add-a-Life-card step for the second damage; confirm in an official Q&A that a Double Attack hit at 1 Life does not win. -->

## Attacks available

Count the cards that can attack this turn: your Leader, and each Character that is active and was not played this turn (unless it has Rush). Each one attacks once, because attacking rests it.

## The Counter each attack forces

From the [defense lesson](/academy/one-piece-card-game/one-piece-card-game-blocking-and-counters/): the defender needs the gap plus 1000.

**Counter forced = your attacker's power − their target's power + 1000**

If the result is zero or less, the attack fails on its own. Each DON!! you give that attacker adds 1000 to what it forces.

## The defender's side

Now count what they can stop:

- **Blockers.** Each active Blocker can take one attack. If your attacker is at least as strong as the Blocker, the Blocker is K.O.'d, but the Leader is safe.
- **Cards in hand.** Most printed Counter values are 1000 or 2000. A cautious count treats each card in hand as a possible 2000.
- **Active DON!!.** [Counter] Events cost DON!!. If they have no active DON!!, they usually cannot use one. If they kept DON!! standing, assume they might.
- **Their last Life card.** Any Life card might hold a Trigger. You cannot count it, so leave a margin.

The key fact: **the defender chooses which attacks to stop, and will stop the cheapest ones.** They block your biggest attack and counter your smallest.

## A worked example

Your opponent's Leader has 5000 power and 1 Life. They hold 2 cards, have no Blockers, and have no active DON!!.

You have a 5000 Leader, a 6000 Character, and a 5000 Character, all ready to attack, and 4 DON!! to give.

You need 2 hits. You have 3 attacks. So they must stop 2 of your 3 attacks.

**Plan A: stack.** All 4 DON!! on your Leader, which now forces 5000. Your 6000 Character forces 2000, and your 5000 Character forces 1000. They let the Leader through, take the last Life card, then stop the other two with one 2000 Counter and one 1000 Counter. Two cards, and they survive.

**Plan B: spread.** 2 DON!! on your Leader (forces 3000), 1 on the 6000 Character (forces 3000), 1 on the 5000 Character (forces 2000). Now the two cheapest attacks force 2000 and 3000, a total of 5000. Two cards worth at most 2000 each cannot cover both. Barring a Trigger, Plan B is lethal.

Same cards, same DON!!. The difference is where the DON!! went.

## Order your attacks

Once the DON!! are given, the order still matters.

- **Make them decide early.** Each attack forces the defender to choose between spending cards and taking a hit, before they know what comes next.
- **Draw out the Blocker.** A Blocker rests when it blocks and cannot block again this turn. If you lead with an attack they want to block, your later attacks are safe from it.
- **Mind your attacks on Characters.** An attack on a rested Character is an attack not spent on the Leader. On a lethal turn, only do it if removing that Character changes the count.

## When it is not lethal

Run the numbers and sometimes the answer is no. Then the question changes: which attacks still pay? From the card advantage lesson, an attack that forces two cards is a good trade even if it does not land. A non-lethal turn that strips their hand can set up a lethal one next turn.

<!-- AT OUR TABLE: one line on the lethal count Levi most often sees players get wrong, such as forgetting the Life plus 1. -->

## Practice it

Set up the board from the example and try other splits of the 4 DON!!. Then change one thing: give your opponent a 4000 Blocker, or a third card in hand. Each change shows which number the whole turn hinges on.
