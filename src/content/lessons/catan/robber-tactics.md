---
title: "Robber Tactics: Whom to Hit, Where, and When"
description: "Robber tactics for Catan: whom to hit, which hex to block, and when to steal, so every 7 and every Knight works as a weapon instead of a random move. A guide."
course: catan
level: 3
levelName: Strategist
order: 22
emailSubject: "The robber is a weapon"
pubDate: 2026-10-22
draft: false
oneIdea: "Every robber move is three choices, whom to hit, which hex to block, and when to move it, and each one should slow the player most likely to win without slowing you."
levelCheck:
  - question: "Red leads. Which hex should the robber usually block? A: an 8 ore field with Red's settlement and yours. B: a 10 brick field with Red's city. C: a 4 wool field with Red's settlement. D: a 6 wheat field with Red's city."
    options: ["A", "B", "C", "D"]
    answer: "D"
    explain: "A city on a 6 is 5 pips times 2, or 10 pips of Red's income, and none of yours. The 10 with a city is 6 pips, the 4 is 3, and the 8 costs Red 5 but costs you 5 too."
  - question: "The robber sits on your best hex, an 8 wheat field. You hold a Knight you built last turn. When should you usually play it?"
    options: ["Before you roll", "After you roll", "Save it for the next 7"]
    answer: "A"
    explain: "You may play one development card before the dice. Moving the robber first means your 8 can pay you on this very roll. After the roll, that chance is gone."
  - question: "You need brick. Red, the leader, holds 8 cards with 1 brick. Blue holds 3 cards with 2 brick. Both touch the hex you are blocking. Which steal is most likely to land a brick?"
    options: ["Red, because a bigger hand means better odds", "Both are the same", "Blue, about a 2 in 3 chance", "Neither; brick cannot be stolen"]
    answer: "C"
    explain: "Blue gives you 2 chances in 3, about 67%. Red gives you 1 in 8, about 13%. If the brick finishes a build this turn, take it from Blue. If slowing the leader matters more, the block on Red's hex still does that work."
nextTeaser: "Next, the question behind every robber move: who is really winning? Lesson 23 shows how to count visible points, estimate hidden Victory Point cards, and spot the quiet player."
---
Most players treat the robber like a chore. A 7 comes up, they sigh, and they drop the gray pawn on whoever annoyed them last. That wastes the only direct attack in the game.

Strong players treat every robber move as three decisions: **whom to hit, which hex to block, and when to move it.** Get all three right and a single 7 can cost the leader a whole round of building.

## How does the robber work again?

A quick recap from [Lesson 4](/academy/catan/robber-and-development-cards/):

- On a 7, anyone with 8 or more resource cards discards half, rounded down.
- Then the roller moves the robber to a new hex.
- The roller steals 1 random resource card from a player with a settlement or city on that hex. If several players touch it, the roller picks which one.
- While the robber sits on a hex, that hex produces nothing.
- A Knight does the same move and steal, and you can play it before you roll.

So every robber move does two things: a **block** that lasts until the robber moves again, and a **steal** that happens once.

## Whom should you hit?

[Lesson 12](/academy/catan/beginner-mistakes/) gave you the simple rule: hit the leader. At this level you can sharpen it. Run down this list.

1. **The leader.** The player closest to 10, counting hidden cards as well as you can. Next lesson covers that count.
2. **The player who can build next.** A big hand or a hand that is one card short of a city is about to turn into points. A steal can break that build.
3. **The hand most likely to hold what you need.** This is where [Lesson 21](/academy/catan/card-counting/) pays off. If you know who holds the ore, steal from them.

Often one player fits all three. When they split, weigh them. Slowing the leader matters most, but a steal that finishes your own settlement this turn is worth a lot too.

Here is the math on picking a hand. The steal is random, so your odds are simply the cards you want divided by the cards they hold.

| Hand | Brick in it | Chance the steal is a brick |
| --- | --- | --- |
| Red, 8 cards | 1 | 1 in 8, about 13% |
| Blue, 3 cards | 2 | 2 in 3, about 67% |

Big hands feel juicy, but a small hand full of the right card is often the better steal.

One small trap with Knights: if you steal from a player holding exactly 8 cards, you drop them to 7, under the discard line. On a 7 that does not matter, because discards happen before the robber moves. With a Knight, it can save them half their hand on the next 7. Still worth it if they are the leader. Just know you did them that small favor.

## Which hex should you block?

The best hex costs the leader the most income and costs you nothing. Measure each option in pips:

- **Count the pips on the number disc.** A 6 or 8 is 5 pips, a 5 or 9 is 4, a 4 or 10 is 3.
- **Double it for a city.** A city collects 2 cards, so it loses twice as much.
- **Subtract yourself.** If you have a building there, the block hurts you too.

| Hex | Who is on it | Red's pips blocked | Your pips blocked |
| --- | --- | --- | --- |
| 6 wheat | Red city | 5 x 2 = 10 | 0 |
| 8 ore | Red settlement, your settlement | 5 | 5 |
| 10 brick | Red city | 3 x 2 = 6 | 0 |
| 4 wool | Red settlement | 3 | 0 |

The 6 wheat field wins easily. In a four-player game, divide pips by 9 for cards per round, as in [Lesson 18](/academy/catan/cities-first/). So 10 pips is about 1.1 cards a round taken from Red.

<!-- DIAGRAM: four hexes side by side (6 wheat, 8 ore, 10 brick, 4 wool) with Red and Blue (you) buildings drawn on the corners as in the table. Under each hex, a bar showing Red's blocked pips in red and your blocked pips in blue. The 6 wheat hex has the tallest red bar and no blue bar, and is circled as the pick. -->

How long does a block last? Each roll has a 1 in 6 chance of being a 7, so on average the next 7 comes 6 rolls later. That is about a round and a half at a four-player table. Over those 6 rolls, the 6 wheat block costs Red about 10 x 6 / 36, or roughly 1.7 cards, plus whatever you steal. Knights can cut that short, so a block on a player with Knights in hand may not last.

Two more things push a hex up the list:

- **It is the scarce resource.** Blocking the only good brick on a short-brick board stalls a road builder far more than the pips suggest.
- **It feeds a port engine.** If Red runs a 2:1 wheat port ([Lesson 20](/academy/catan/port-engine/)), the wheat hex is Red's whole economy.

And one thing pushes a hex down: **a trailing player shares it.** Blocking a hex that also feeds the player in last place is fine when it is clearly the best block. Just do not pick it when an equal option hits only the leader.

## When should you move the robber?

On a 7 you roll, you have no choice about timing. But you can still plan. About 1 roll in 6 is a 7, so before you pick up the dice, know where the robber would go. Then the move takes two seconds instead of a nervous minute.

Knights give you a real choice. You can play one development card per turn, never the one you built this turn, and a Knight can come before the roll or during your action phase.

| Play the Knight... | Why |
| --- | --- |
| Before the roll | The robber is on your best hex. Moving it first lets that number pay you on this very roll |
| Before the roll | The steal could finish a build this turn, and you want to plan trades around it |
| After the roll | You want to see what the roll paid first, then steal from the hand that just got the card you need |
| Not this turn | No hex is worth blocking and no hand is worth robbing. Hold it as insurance |

The rule of thumb: if the robber is on you, play the Knight before the roll. Otherwise, waiting until after the roll gives you more information.

Keep [Largest Army](/academy/catan/longest-route-and-largest-army/) in mind too. Knights only count once played, and you can play just one per turn. A Knight held for the perfect moment for five turns is a Knight that did nothing for five turns.

## How do you rob without making enemies?

The robber is a weapon, but it should never feel personal. A few habits keep the table friendly:

- **Say your reason.** "Red's at 8 with a city on that 6." Players accept a robber move that has a clear reason.
- **Do not chase revenge.** Robbing whoever robbed you feels good and often helps the leader.
- **Spread it fairly when scores are close.** If two players are tied for the lead, alternate.
- **Be a good sport when it is your turn to get hit.** If you are leading, you earned the robber.

## Try it this week

Your drill: say your robber reasoning out loud for a whole game.

1. **Before every roll, pick your hex.** Know where the robber goes if a 7 comes up.
2. **On every 7 or Knight, say three things out loud:** whom you are hitting, which hex, and why now. "Red, the 6 wheat, because Red is leading and has a city there."
3. **Count the pips.** Say the blocked pips for the leader and for you. If your number is not zero, look again.
4. **Pick your steal by the odds.** If two players touch the hex, say which hand is more likely to hold what you need.
5. **Play every Knight on purpose.** Before the roll if the robber is on you, after the roll if you want to see what got paid.
6. **After the game, review.** Which robber move hurt the leader most? Which one helped nobody? Write one line on each.
