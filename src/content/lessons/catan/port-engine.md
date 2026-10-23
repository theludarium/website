---
title: "Ports as an Engine"
description: "How to build a Catan game around a 2:1 port: choosing which port, feeding it the right resource, and turning one port into your own private bank all game."
course: catan
level: 2
levelName: Trader
order: 20
emailSubject: "Build your own bank"
pubDate: 2026-10-22
draft: false
oneIdea: "A 2:1 port doubles the value of every spare card of its resource compared with the bank, so it becomes an engine only when strong production of that one resource feeds it."
levelCheck:
  - question: "You own the 2:1 ore port and expect about 12 spare ore every 36 rolls. How many cards of your choice can that become, compared with the bank?"
    options: ["4 instead of 3", "12 instead of 3", "6 instead of 3", "6 instead of 4"]
    answer: "C"
    explain: "At 2:1, 12 ore become 6 cards. At the bank's 4:1, they become 3. The port doubles what your spare ore is worth."
  - question: "Every 36 rolls you expect 10 spare wheat, plus 8 spare cards spread over other resources. Which single port helps you more?"
    options: ["A 3:1 port: about 6 cards", "The 2:1 wheat port: about 7 cards", "They come out exactly even", "Neither; the bank is just as good"]
    answer: "B"
    explain: "The 2:1 port turns 10 wheat into 5 cards, and the other 8 still go 4:1 for 2 more, so 7. A 3:1 port turns all 18 into 6. The 2:1 wins because your wheat surplus is more than half the rest."
  - question: "Which 2:1 port is the weakest pick for you?"
    options: ["The wool port, with wool on a 6 and a 9 near you and little use for it", "The wheat port, next to two wheat fields you plan to upgrade with cities", "The brick port, late in a game when your brick has nothing left to build", "The ore port, when you touch one 3-pip mountain and need all your ore for cities"]
    answer: "D"
    explain: "A port is only as good as the spare cards you feed it. Three ore pips is about 3 ore every 36 rolls, and your cities will eat all of it. That port would sit idle."
nextTeaser: "Next, Level 3: Strategist begins. Lesson 21, Card Counting in Catan: Tracking Every Hand, shows how to know what every player is holding without peeking."
---
Most players treat a port as a nice extra. They land on one by accident, use it now and then, and forget it the rest of the time. A few players do the opposite. They pick one 2:1 port, point their whole economy at it, and spend the game turning a pile of one resource into whatever they need.

That second way is the port engine. This lesson shows when it works, how to pick the port, and the math that tells you whether it is worth it.

## What makes a port an engine?

Two things, working together:

1. **A 2:1 port.** You give 2 cards of the resource shown on it, and take 1 of any resource from the supply.
2. **Strong production of that resource.** Enough that you have spare cards of it most rounds.

Either one alone does little. A wheat port with no wheat fields is a coastal settlement that rarely trades. A big wheat income with no port means trading wheat at 4:1, or hoping the table needs it.

Put them together and your spare wheat becomes every resource at once. You stop waiting for the right roll and stop begging the table. That is why players call it a private bank.

## What is the math against 4:1 and 3:1?

Start with the rates from [Lesson 9](/academy/catan/bank-and-port-trades/). Here is what 12 spare cards of one resource become at each:

| Rate | 12 spare cards become | Extra cards over the bank |
| --- | --- | --- |
| Bank, 4:1 | 3 | none |
| 3:1 port | 4 | 1 |
| 2:1 port | 6 | 3 |

Put simply, a spare card is worth a quarter of a card at the bank, and half a card through a 2:1 port. **The port doubles the value of every spare card of its resource.**

That gain grows with your production. For every 4 spare cards you feed a 2:1 port, you get 1 more card than the bank would give you. Feed it 4 spare cards over a game and the port barely matters. Feed it 20 and it hands you 5 extra cards, more than a settlement's worth.

## How much production does it take?

Use the pip math from [Lesson 18](/academy/catan/cities-first/). Your pips of a resource are about how many of those cards you collect every 36 rolls, or 9 rounds of a four-player game.

Take Blue. Her settlements touch a 6 wheat field and an 8 wheat field. That is 5 + 5 = 10 wheat pips, about 10 wheat every 36 rolls. Then she upgrades both to cities. Now she collects 2 wheat on each of those rolls: 20 wheat pips, about 20 wheat every 36 rolls.

Her cities and development cards use some of that. Say she keeps 8 and has 12 to spare. Through the 2:1 wheat port, those 12 become 6 cards of anything. Without it, they become 3.

<!-- DIAGRAM: a small coastal section of board. Blue has a settlement on the 2:1 wheat port, a city touching a 6 wheat field, and a city touching an 8 wheat field, with a road linking them. Label the wheat pips (5 and 5, doubled to 10 and 10 by the cities) and an arrow from the wheat fields to the port showing "2 wheat to 1 of anything". -->

A good rough guide: **aim for 10 or more pips of the port's resource, with a plan to double some of it with cities.** Below that, a 3:1 port or plain player trades usually serve you just as well.

## When does a 2:1 port beat a 3:1 port?

A 3:1 port helps with everything a little. A 2:1 port helps with one thing a lot. Which is better depends on how lopsided your spare cards are.

Here is the break-even. **A 2:1 port beats a 3:1 port when your spare cards of that resource are more than half your spare cards of everything else combined.**

Check it with numbers. Say you have 8 spare wheat and 16 other spare cards.

- **2:1 wheat port:** 8 wheat become 4 cards. The other 16 still go to the bank at 4:1 for 4 more. Total: 8.
- **3:1 port:** all 24 cards go 3:1. Total: 8.

Dead even. Push your wheat above 8, or your other spares below 16, and the 2:1 port pulls ahead. Own both, and you get the best rate on every card.

## Which port should you pick?

Pick the resource you make a lot of and need little of yourself.

- **Wool** is a classic choice. Only settlements and development cards use it, one card each, so it piles up. A wool port turns that pile into brick and ore.
- **Wheat** works well because wheat fields are common, and a city plan makes lots of it.
- **Ore** is great only if you make more than your cities can use. Most ore-heavy players spend it all on cities.
- **Brick or wood** shines late. Once the board fills, brick and wood often go dead, as [Lesson 8](/academy/catan/resource-value-over-time/) showed. A brick port turns that dead brick into ore.

Then look at the board. Is the port on a coast you can reach before anyone else? Plan the road there in setup. Most players reach a port with their third or fourth settlement, so point your opening roads at it.

## How do you protect the engine?

An engine has one weak spot: it runs on one resource. Everyone at the table can see that.

- **Feed it from two hexes on different numbers.** One cold number, or one robber, cannot shut it down.
- **Expect the robber.** Your best feeding hex is an obvious target. Keep a Knight ready to chase it off before you roll, as [Lesson 11](/academy/catan/development-cards-for-beginners/) showed.
- **Watch your hand size.** Engine players often hold lots of one card. Trade it down before you pass the dice. Each 2:1 trade drops your hand by 1 card and hands you something you can use.
- **Pair it with Monopoly.** If you draw Monopoly, name your port's resource. Every card you take becomes half a card of anything.

The engine has a quiet bonus too. Port trades never help another player. Late in the game, when the table stops trading with you, your bank stays open.

## What did Level 2 give you?

That is the end of Level 2. You can now read a board, pick a lane, plan your growth, win trades on purpose, count your income, choose your bonuses, and build your own bank. Congratulations, Trader.

## Try it this week

Your drill: build one game around a 2:1 port.

1. **Pick the port before setup ends.** Find the 2:1 port whose resource you can make the most of. Count the pips of that resource you could reach.
2. **Point a road at it.** Plan your third or fourth settlement on the port, and aim an opening road that way.
3. **Feed it.** Look for a second hex of the same resource on a different number. Make your first city on a settlement that touches it.
4. **Use it every turn it helps.** Trade 2:1 whenever it finishes a build, or keeps you at 7 or fewer cards.
5. **Keep a tally.** Count every card you got through the port. After the game, divide by 2 to see how many the bank would have given you instead. The difference is what your engine earned.
