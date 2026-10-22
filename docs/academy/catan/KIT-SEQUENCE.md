# Academy emails: Road to the Catan Championship in Kit

How the course runs in Kit, and the emails that are not lessons. Build this after the form in `docs/academy/catan/KIT-SETUP.md` is live. Levi does the Kit steps; Claude writes the lesson emails and keeps this plan current.

The course: 40 free lessons in six levels. Each lesson is a page at `https://theludarium.com/academy/catan/<slug>/` and one email that teases it and links back. Promise: **From kitchen table to tournament table, one lesson at a time.**

House rules for every email here: plain words, short sentences, no em dashes, warm and a little playful. Promise only what exists. There are no Ludarium game nights, lounge, or league running yet; the practice league is "something we're starting, and you hear first."

## Launch first: Level 0 only (decided 2026-10-22)

Only Level 0 is written so far, so everyone starts at Level 0 for now, whatever they pick on the form. The form still saves `catan_experience`, so the level split can switch on later without asking anyone again. Build this short version first, test it, and then we merge the site. The full plan below stays the target as more levels are written.

### What to build now

1. **Tags and form:** done (KIT-SETUP.md).
2. **Two sequences** (step A below, same settings):
   - **Catan: Welcome**: one email, the interim welcome below, as soon as possible.
   - **Catan L0: Settler**: send days every day, 8 a.m. Lesson 1 after 1 day, lessons 2 to 5 every 2 days, then the interim Level 0 wrap-up after 24 **hours**. Exclude `academy-catan-paused` only.
3. **One link trigger** (step B below): **Catan: pause lessons** only. Skip the "Too easy?" triggers until there is a level to skip to.
4. **Three automations** (step C below):
   - **C1 Catan: Start (interim).** Entry **Joins a form**, Academy: Road to the Catan Championship. Then **Email sequence** Catan: Welcome. Then **Add tag** `academy-catan-settler`. No condition step yet.
   - **C2 Catan: Level 0**, as written below, ending with **Remove tag** `academy-catan-settler` and **Add tag** `academy-catan-homesteader`.
   - **C8 Catan: Pause**, as written below.
5. **Test** with steps D3 (pause) and D4 (graduation, but expect the interim wrap-up and no lesson 6).
6. **Publish** both sequences and turn on the three automations. Then tell Claude, and we merge.

### Adding Level 1 (written 2026-10-22)

Lessons 6 to 12 and their emails are done (emails below). When you're ready, build **Catan L1: Homesteader** and automation **C3**, and add the "Too easy?" trigger for Level 0. People who already finished Level 0 hold the `academy-catan-homesteader` tag, but automations are not retroactive, so they will not enter C3 on their own. To start them: in **Subscribers**, filter by that tag, select all, **Remove tag** `academy-catan-homesteader`, then **Add tag** `academy-catan-homesteader` again. The re-add fires C3. When all levels are live, switch C1 to the full version with the four-path split.

### Adding Level 2 (written 2026-10-22)

Lessons 13 to 20 and their emails are done (emails below). Build **Catan L2: Trader** (Tuesday and Friday, 8 a.m., delays as in step A) and automation **C4** as written in step C, and add the "Too easy?" trigger for Level 1. If you build Levels 1 and 2 at the same time, end Level 1 with graduation email 2 instead of the interim Level 1 wrap-up. People who already finished Level 1 hold `academy-catan-trader`; start them by removing and re-adding that tag, the same way as Level 1. Until Level 3 is written, end the Level 2 sequence with the interim Level 2 wrap-up below, and keep C4's swap to `academy-catan-strategist` so it marks who finished.

### Lesson email footer, for now

> Busy stretch? [Pause lessons for two weeks](link trigger: Catan: pause lessons) · [Find a Catan event near you](https://theludarium.com/articles/catan-tournament-qualifier/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=events)

### The interim welcome email

Sequence **Catan: Welcome**, as soon as possible.

**Subject:** Your road to the Catan Championship starts here

**Preview text:** Your first lesson arrives tomorrow. Here's how the course works.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Road to the Catan Championship, the first course from The Ludarium Academy. From kitchen table to tournament table, one lesson at a time.
>
> **Where you start**
>
> Everyone starts at **Level 0: Settler**. By the end of it you'll set up and finish a game without the rulebook. If you already know the basics, Level 0 goes quickly, and it is a good refresher on the 6th Edition rules that tournaments now use. Your first lesson arrives tomorrow morning. Can't wait? [Read it now](https://theludarium.com/academy/catan/what-is-catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome).
>
> **How it works**
>
> - 40 lessons in six levels: Settler, Homesteader, Trader, Strategist, Contender, and Champion. Level 0 is ready now, and the next levels arrive in your inbox as they are written.
> - Each email is a two-minute read: one idea, a quick example, and one thing to try at your next game. The full lesson lives on the site, with a short Level check at the end.
> - **Busy stretch?** "Pause lessons" in any email holds them for two weeks, then they pick up where you left off.
>
> **Why this course exists**
>
> This fall I signed up for my first official Catan qualifier, a $10 local tournament at a game store north of Indianapolis. I went looking for a clear path from casual player to tournament player and couldn't find one in one place. So we're building it, one lesson at a time. [Here's the story of how it started](https://theludarium.com/articles/catan-tournament-qualifier/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome-story).
>
> One favor: reply and tell me how you play Catan now. Family game night, a group of friends, online? I read every reply, and it shapes the lessons.
>
> [Button: See all 40 lessons]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome`

### The five Level 0 lesson emails

Each one goes in **Catan L0: Settler** in this order, with the footer above. Button text: **Read the full lesson**.

#### Lesson 1

**Subject:** Welcome to the island

**Preview text:** How a 1995 board game started the modern hobby, and the one goal that matters.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Maybe you played Catan once at a friend's house, between bites of pizza, and left hooked and a little lost. That's exactly where this course starts.
>
> **The one idea:** Catan is a race to 10 victory points, and you get there by turning dice rolls and trades into roads, settlements, and cities.
>
> **A quick example:** the dice come up 8. Every settlement touching a hex marked 8 collects a card. You're one brick short of a new settlement, so you offer a neighbor two wheat for one brick. They say yes, you build, and you're a point closer to 10. That loop is the whole game.
>
> The lesson also covers where Catan came from, why it became everyone's first "real" board game, and which edition to learn.
>
> **Try it this week:** get one game on the table, start to finish. Your own copy, a friend's, a library's, or a public game night all count. Then write down one question the game left you with.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/what-is-catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-01`

#### Lesson 2

**Subject:** Your first board, built in 10 minutes

**Preview text:** 19 hexes, 18 numbers, 9 ports, and the placement order that trips up new players.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Setup is where most first games go sideways. It doesn't have to.
>
> **The one idea:** setup is a snake draft. Players place their first settlements in order 1, 2, 3, 4, then their second ones in reverse, 4, 3, 2, 1. Only your second settlement pays starting resources.
>
> **A quick example:** in a four-player game, the fourth player places two settlements in a row. That sounds unfair until you notice they also get the last say on which resources the table will be short of. And because the second settlement pays out right away, a smart player puts it next to whatever their first spot is missing.
>
> The full lesson walks the whole board: the 19 land hexes, the 18 number discs, the 9 ports, and fixed versus variable setups, with a diagram.
>
> **Try it this week:** set up a variable board alone and play out the snake draft for four imaginary players. Time yourself. The goal is under 10 minutes, no rulebook.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/catan-setup/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-02`

#### Lesson 3

**Subject:** Roll, trade, build, repeat

**Preview text:** Every turn has three beats. Learn them once and you can teach anyone.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Once you see the loop, every turn of Catan looks the same, in a good way.
>
> **The one idea:** every turn is the same loop. Roll so the island pays everyone, then trade and build as much as your cards allow.
>
> **A quick example:** you roll a 6. You collect a wheat and an ore, and so does your neighbor. Now it's your move: you trade four wool to the bank for one brick (the 4:1 trade anyone can make), add your wood, and build a road toward a better spot. Then you pass the dice.
>
> The lesson covers trading with players, the bank, and ports, plus all four building costs in one table.
>
> **Try it this week:** memorize the four costs. Road is brick and wood. Settlement is a road plus wool and wheat. Development card is wool, wheat, and ore. City is 2 wheat and 3 ore. Say them out loud every morning, and play your next game with the player aid face down.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/how-a-turn-works/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-03`

#### Lesson 4

**Subject:** Who invited the robber?

**Preview text:** What happens on a 7, why you count your cards, and what's in the development deck.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Nobody produces on a 7. Instead, the robber shows up, and somebody loses cards.
>
> **The one idea:** on a 7, anyone holding 8 or more resource cards loses half, so build before you pass the dice.
>
> **A quick example:** you're sitting on 9 cards, saving for a city. Someone rolls a 7. You discard 4, rounded down, and the city is gone. If you had built a road and a development card last turn, you would have kept almost everything.
>
> The full lesson covers moving the robber and stealing, plus all 25 development cards: Knights, Victory Points, Road Building, Invention, and Monopoly, and when you're allowed to play them. One of them can even chase the robber off your best hex before you roll.
>
> **Try it this week:** for one whole game, count your cards out loud before every roll. Whenever you're at 8 or more, note what you could have built to stay safe.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/robber-and-development-cards/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-04`

#### Lesson 5

**Subject:** 10 points: here's every way to get there

**Preview text:** Settlements, cities, two bonuses, and the hidden points nobody sees coming.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Last lesson of Level 0. This one is about the finish line.
>
> **The one idea:** there are only five ways to score, and the game ends the moment you reach 10 points on your own turn.
>
> **A quick example:** you have 3 settlements, 2 cities, and Longest Route. That's 3 plus 4 plus 2: 9 points on the table. On your turn you flip the hidden Victory Point card you've been holding. That's 10, and the game ends right there, mid-turn. Nobody saw it coming.
>
> The lesson covers each path: settlements, cities, Longest Route, Largest Army, and Victory Point cards, plus why you must claim your win on your own turn.
>
> **Try it this week:** play three games and record how each winner got to 10. Five columns: settlements, cities, Longest Route, Largest Army, VP cards. You'll be surprised how different the paths are.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/how-to-win/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-05`

### The seven Level 1 lesson emails

For **Catan L1: Homesteader**, built when Level 1 launches (see "Adding Level 1" above). Same footer and button as Level 0. When Level 1 launches, also add the "Too easy?" link to the Level 0 emails.

#### Lesson 6

**Subject:** Those little dots are the whole game

**Preview text:** Why a 6 comes up five times as often as a 2, in plain English.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Level 1. Look under any number disc and you'll see a few small dots. Most players never notice them. This lesson is about why you should.
>
> **The one idea:** the dots under each number count how many of the 36 dice combinations roll it, so adding them up tells you how often a spot will pay you.
>
> **A quick example:** a corner touching a 6, a 9, and an 11 has 5 plus 4 plus 2 dots, or 11 pips. On average, a settlement there collects about 11 cards every 36 rolls. A corner on 2, 12, and 3 has just 4 pips. Same price to build, about a third of the income.
>
> The full lesson explains why two dice favor the middle numbers, gives you a quick way to remember every number's dots, and shows what counts as a good spot. It also covers why the 8 is never "due."
>
> **Try it this week:** total the pips on every spot you consider during setup. After the game, compare each player's starting pips with the final scores.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/number-probability/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-06`

#### Lesson 7

**Subject:** The 90 seconds that decide most games

**Preview text:** A five-point checklist for the two placements that shape your whole game.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Your two starting settlements pay you, or fail to pay you, for the rest of the game. So it helps to have a way to score them before you place.
>
> **The one idea:** a strong opening passes five checks: plenty of pips, a mix of resources, a mix of numbers, early brick and wood, and room to expand.
>
> **A quick example:** your first settlement sits on 6 wheat, 9 ore, and 4 wool. For your second, one spot has 13 pips on wheat, ore, and wool. Another has 10 pips on wood, brick, and wool. The first looks richer, but it leaves you with no brick or wood, so you'd trade for every road. The second scores 5 out of 5.
>
> The full lesson walks through each check, shows how to split the work between your first and second picks, and scores that example step by step.
>
> **Try it this week:** after every game, score your opening against the checklist, one point per check. Score the winner's too. By the end of the week, you'll know which check you miss most.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/opening-settlements/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-07`

#### Lesson 8

**Subject:** Why brick feels like gold on turn 4

**Preview text:** What you need on turn 4 is not what you need on turn 24.

> Hi {{ subscriber.first_name | default: "there" }},
>
> On your fourth turn, you'd trade almost anything for one brick. By your twentieth, you might hold three that nobody wants. Same card, different game.
>
> **The one idea:** a card's value changes as the game moves. Brick and wood fuel your early growth, and ore and wheat build the cities and cards that finish it.
>
> **A quick example:** early on, every open spot is up for grabs, and reaching one takes roads plus a settlement. That's two or three bricks for a single new settlement. Later the board fills up, and your points come from cities, which need no new space at all. Building all four takes 8 wheat and 12 ore.
>
> The full lesson covers why brick and ore are the scarcest resources (only 3 hexes each), where wool fits, and how to plan your settlements and trades around the shift.
>
> **Try it this week:** keep a scrap of paper by your seat. On your turns 5, 15, and 25, write down the resource you needed most right then. After the game, see how your list changed.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/resource-value-over-time/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-08`

#### Lesson 9

**Subject:** Stop feeding the bank

**Preview text:** When 4:1 is fine, and when it quietly hands someone else the win.

> Hi {{ subscriber.first_name | default: "there" }},
>
> The bank never says no. That's exactly what makes it dangerous.
>
> **The one idea:** a bank or port trade earns its cost when it lets you build something this turn. Trading just to reshuffle your hand mostly leaks cards.
>
> **A quick example:** a 4:1 trade costs you 3 cards for good. A settlement on 11 pips needs about 13 rolls to earn 4 cards back, which is more than three trips around a four-player table. Trade 4 wool for the brick that finishes a settlement, and that's a great deal. Trade 4 wool for an ore you might use next turn, and you've thrown away three rounds of that settlement's income.
>
> The full lesson covers when 4:1 is the right call, the habits that quietly drain your hand, and when a 3:1 or 2:1 port is worth building toward.
>
> **Try it this week:** no 4:1 trades unless they build something that turn. Before you reach for the bank, name what you're building. Tally the trades you skipped, and see if any of them really cost you.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/bank-and-port-trades/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-09`

#### Lesson 10

**Subject:** The discard you didn't have to make

**Preview text:** Eight cards is the danger line. Here is how to stay under it.

> Hi {{ subscriber.first_name | default: "there" }},
>
> You were one turn from a city. Then a 7 landed, and four cards went back to the supply.
>
> **The one idea:** seven cards is safe and eight is not. When a 7 is rolled, anyone holding 8 or more resource cards loses half, so spend down to 7 or fewer before you pass the dice.
>
> **A quick example:** in a four-player game, four rolls happen before you can build again: three opponents, then you. There is about a 52% chance at least one of them is a 7. End your turn at 8 cards and you are flipping a coin on losing 4 of them. Build a development card instead and you are at 5, with nothing for the robber to take.
>
> The full lesson covers why a hand of 7 keeps more cards than a hand of 12 after a 7, the order to spend down in, and when holding 8 or more is a smart choice.
>
> **Try it this week:** end every turn at 7 or fewer. Count your hand out loud before you pass the dice, and if you choose to hold more, name the cards you would discard.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/hand-management/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-10`

#### Lesson 11

**Subject:** The cards everyone underrates

**Preview text:** When a development card beats a road, and when to play each kind.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Most players either ignore the development pile or dump leftover cards into it. Both leave points on the table.
>
> **The one idea:** a development card rarely beats a good settlement, but it often beats a road to nowhere. And each kind has one right moment to play it.
>
> **A quick example:** you hold a wool, a wheat, and an ore, and your next open spot is three roads away. Build the card. More than half the deck is Knights, and one in five cards is a hidden point. Draw a Knight, and next turn you can play it before you roll to chase the robber off your best hex.
>
> The full lesson covers what is in the 25-card deck, the odds of each draw, and the best moment for Knights, Victory Points, Road Building, Invention, and Monopoly.
>
> **Try it this week:** build three development cards in one game. Write down when you built each one, when you played it, and what it did. Then ask whether a road would have done more.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/development-cards-for-beginners/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-11`

#### Lesson 12

**Subject:** Seven ways you're losing (and how to stop)

**Preview text:** Road spam, hoarding, feeding the leader, and four more habits to drop.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Most Catan games are not lost to bad dice. They are lost to the same few habits, game after game.
>
> **The one idea:** a handful of repeat mistakes sink most beginners, and each one has a simple fix you can check every turn.
>
> **A quick example:** the leader shows 8 points and offers you 2 wool for 1 ore. It feels like a bargain. But that ore may be the last card of their winning city. Say no, and find your wool from someone else, a port, or the bank.
>
> The full lesson covers all seven: road spam, waiting too long on cities, trading with the leader, hoarding, robbing the weakest player, card timing slips, and getting boxed in. It is also the last lesson of Level 1.
>
> **Try it this week:** ask a friend to spot for you. Give them the list of seven, and have them tap the table and call the number each time you slip. After the game, the mistake with the most marks is your focus for next time.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/beginner-mistakes/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-12`

### The eight Level 2 lesson emails

For **Catan L2: Trader**, built when Level 2 launches (see "Adding Level 2" above). Same footer and button as the other levels.

#### Lesson 13

**Subject:** Every board tells you what's valuable

**Preview text:** Four questions, sixty seconds, and you know what this map rewards.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Level 2. Every Catan board is telling you something. One map is short on brick. Another is drowning in wheat. The players who notice first get to place with a plan.
>
> **The one idea:** before anyone places, total the pips for each resource, name the scarcest one, find the best corners, and check which ports have a strong supply nearby.
>
> **A quick example:** on one board, the four forests add up to 13 pips and the four pastures only 10, because one pasture sits on the 2. Wool is usually the cheap card everyone has extra of. Not on that board. Settlements and development cards will be slower for everyone, and the player with good wool gets to set the price.
>
> The full lesson walks through all four questions on a real board, shows what a "normal" total looks like for each resource, and explains why a hot number does not always make a hot corner.
>
> **Try it this week:** before each game, total the pips for each resource and name the scarcest one out loud. During the game, tally which card people beg for most. See if you called it.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/read-the-board/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-13`

#### Lesson 14

**Subject:** Pick a lane

**Preview text:** Cities, roads, ports, or balance. Each can win. Mixing them often can't.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Ask a few strong Catan players how they won, and you'll hear a few different stories. But nearly all of them fit one of four plans.
>
> **The one idea:** there are four proven roads to 10 points: the ore-wheat-wool city plan, the wood-brick road plan, the port engine, and a balanced build. The board and your opening tell you which one to commit to early.
>
> **A quick example:** you build 3 roads toward Longest Route, then change your mind and rush cities. Those roads cost 3 brick and 3 wood. That's 6 cards that scored nothing, one more card than a whole city costs. Switching once, on purpose, can be fine. Switching every few turns is how games slip away.
>
> The full lesson covers what each lane needs, a simple path to 10 for each one, its weak spot, and how to read the board and the table to choose yours.
>
> **Try it this week:** play four games, one lane each. Pick the lane before setup and stick to it, even if the board fights you. After each game, write down where your points came from.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/four-core-strategies/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-14`

#### Lesson 15

**Subject:** Fourth pick isn't a curse

**Preview text:** How first, second, third, and fourth pick change your plan.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Seat 4 has a bad reputation. The best corners are gone before you place, and you roll last. Plenty of players sit down there and sigh. They shouldn't.
>
> **The one idea:** your seat decides how many settlements land between your two picks, so plan your first pick around what will still be open at your second.
>
> **A quick example:** in seat 1, six settlements land between your picks, so take what is hardest to replace, like the board's best ore. In seat 4, nothing lands between them. If seats 1 to 3 all grab ore and wheat, you can take the best brick and the best wood back to back, and everyone has to come to you for roads.
>
> The full lesson covers each seat's edge, its trap, and what to place first, plus how much turn order matters once the dice start rolling.
>
> **Try it this week:** over four games, play once from each seat. After each setup, write down both spots, their pips, and whether the second spot you hoped for was still open.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/seat-position/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-15`

#### Lesson 16

**Subject:** Plan your next two settlements now

**Preview text:** Mark your next two spots before you roll, then race for them.

> Hi {{ subscriber.first_name | default: "there" }},
>
> The open corner next to you looks safe. Then the player on your right builds two roads in one turn and settles on it. It happens in nearly every game.
>
> **The one idea:** pick your next two settlement spots before your first roll, count who can reach them first, and point every road at one of them.
>
> **A quick example:** you need 2 roads to reach a corner. Your neighbor needs 1, and plays right after you. Build your 2 roads without the settlement, and they build 1 road and settle there anyway. Reaching a spot is not owning it. Either arrive and settle in one turn, or turn toward your other target early.
>
> The full lesson covers how the distance rule shapes your options, how to win a road race, and when a blocking road is worth it and when it's just road spam.
>
> **Try it this week:** after setup, before anyone rolls, write down Target 1 and Target 2. Aim every road at one of them. When one is taken, name a new one before your turn ends.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/expansion-planning/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-16`

#### Lesson 17

**Subject:** Every trade has a winner

**Preview text:** Lopsided offers, specific asks, and why you never feed the leader.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Two players swap a wheat for a brick. It looks even. Then one of them builds a settlement, and the other is still a card short. That trade had a winner.
>
> **The one idea:** every trade helps both players, so the real question is who it helps more. Before you say yes, ask what each of you can build afterward, and make your offers specific enough that the answer is you.
>
> **A quick example:** you need brick and have wool to spare. "Anyone have brick?" lets the table set the price, and tells the leader what you need. "Sam, two wool for your brick?" sets the price yourself and picks your partner. Even at 2-for-1, it costs you 1 card net. The bank would cost you 3.
>
> The full lesson covers when to offer 2-for-1 and when to ask for it, how to make offers on other players' turns, and the one question that keeps you from feeding the leader.
>
> **Try it this week:** make every offer specific. Name what you give, what you want, and who. After each game, mark every trade W or L, and aim for more Ws.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/art-of-the-trade/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-17`

#### Lesson 18

**Subject:** The math behind the city rush

**Preview text:** Expected cards per turn, and the moment a city beats a settlement.

> Hi {{ subscriber.first_name | default: "there" }},
>
> A city and a settlement are both worth 1 point. So which one should you build? There is a real answer, and it takes about ten seconds.
>
> **The one idea:** divide a spot's pips by 9 to get its expected cards per round in a four-player game. Then build whatever adds the most pips for the cards you spend.
>
> **A quick example:** your best settlement has 13 pips. An open 9-pip spot is one road away. The city adds 13 pips for 5 cards, about 2.6 pips per card. The settlement plus its road adds 9 pips for 6 cards, just 1.5 per card. The city wins, and it pays for itself in about half the time.
>
> The full lesson shows how to count your income at any point in a game, why early builds pay more than late ones, when a settlement is worth taking anyway, and how much ore a city rush really needs.
>
> **Try it this week:** after setup, add up your pips and divide by 9. Do it again in the middle of the game. Did your income double?
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/cities-first/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-18`

#### Lesson 19

**Subject:** Two points that change hands

**Preview text:** Two 2-point bonuses. When to chase, when to contest, when to let go.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Most points in Catan stay put. Longest Route and Largest Army do not. You can lose them, and you can take them.
>
> **The one idea:** when a bonus changes hands, you gain 2 points and the old holder loses 2. That is a 4-point swing. Chase a bonus when your plan already builds toward it, contest it when the leader holds it, and ignore it when the price is too high.
>
> **A quick example:** the leader has 8 points, including Longest Route on 6 roads. You have 7 points and a route of 5. Two more roads give you 7, which beats 6. Now you have 9 and the leader has 6. You went from 1 behind to 3 ahead for 4 cards.
>
> The full lesson covers what each bonus really costs, how a single settlement can break a route, when to stay out of a road war, and how to hold a bonus once it is yours.
>
> **Try it this week:** contest one bonus every game. Track every player's route and Knights, and make your move when the leader holds the tile or you are one step away.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/longest-route-and-largest-army/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-19`

#### Lesson 20

**Subject:** Build your own bank

**Preview text:** Turn one 2:1 port into your own private bank.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Most players land on a port by accident. A few build their whole game around one.
>
> **The one idea:** a 2:1 port doubles the value of every spare card of its resource compared with the bank. It becomes an engine only when strong production of that one resource feeds it.
>
> **A quick example:** your cities sit on a 6 wheat field and an 8 wheat field. That is about 20 wheat every 36 rolls. Keep 8 for your own builds, and 12 are spare. At the bank, those 12 become 3 cards. Through the 2:1 wheat port, they become 6 cards of anything you want.
>
> The full lesson covers how much production a port needs, when a 2:1 port beats a 3:1, which port to pick, and how to protect your engine from the robber. It is also the last lesson of Level 2.
>
> **Try it this week:** build one game around a 2:1 port. Pick it before setup ends, point a road at it, and count every card you get through it.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/port-engine/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-20`

### The interim Level 1 wrap-up

Last email in **Catan L1: Homesteader**, 24 hours after lesson 12, until Level 2 is written. Then switch to graduation email 2. Keep C3's tag swap to `academy-catan-trader` as written: with no Level 2 automation yet, the tag starts nothing, and it marks who finished Level 1. When Level 2 launches, start them the same way as Level 1 graduates: remove and re-add `academy-catan-trader`.

**Subject:** Level 1 done. Your openings have reasons now.

**Preview text:** Level 2 is next: reading any board in 60 seconds.

> Hi {{ subscriber.first_name | default: "there" }},
>
> That's Level 1: Homesteader, finished. You know what the dots mean, you can score an opening before you place it, you trade with a plan, and you keep your hand under the robber's reach. Most casual players never get this far.
>
> **What's next: Level 2, Trader.** Eight lessons on reading a board, picking a strategy, and winning trades on purpose. I'm writing it now. When it's ready, the first lesson comes straight to your inbox. You don't need to do anything.
>
> **In the meantime:** play a few games and score every opening at the table against the Lesson 7 checklist, yours and everyone else's. Then reply and tell me the best opening you saw. I read every reply.
>
> [Button: See the whole course]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-homesteader`

### The interim Level 2 wrap-up

Last email in **Catan L2: Trader**, 24 hours after lesson 20, until Level 3 is written. Then switch to graduation email 3.

**Subject:** Level 2 done. You play with a plan now.

**Preview text:** Level 3 is next: playing the people, not just the board.

> Hi {{ subscriber.first_name | default: "there" }},
>
> That's Level 2: Trader, finished. You can read a board in a minute, pick a strategy that fits it, plan your next settlements before you need them, and make trades that leave you ahead. That's the difference between playing Catan and playing it on purpose.
>
> **What's next: Level 3, Strategist.** Eight lessons on the other players: tracking what they hold, using the robber as a weapon, spotting who is really winning, and closing out games. I'm writing it now. When it's ready, the first lesson comes straight to your inbox. You don't need to do anything.
>
> **In the meantime:** before each game, name the scarcest resource and your plan out loud. After the game, check whether the plan held. Then reply and tell me which strategy won most often at your table. I read every reply.
>
> [Button: See the whole course]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-trader`

### The interim Level 0 wrap-up

Last email in **Catan L0: Settler**, 24 hours after lesson 5. Use it until the Level 1 sequence is built in Kit; then switch to graduation email 1. (Level 1's lessons are written and on the site as of 2026-10-22, and their emails are above.)

**Subject:** Level 0 done. You can play Catan now.

**Preview text:** Next up: Homesteader, where the setup mistakes stop.

> Hi {{ subscriber.first_name | default: "there" }},
>
> That's Level 0: Settler, finished. You can set up a board, run a turn, handle the robber, and count your way to 10 points. That's more than a lot of people who own the game.
>
> **What's next: Level 1, Homesteader.** Seven lessons on the choices that win games before the dice do much: what the dots under the numbers mean, where your first two settlements go, and how to keep your hand out of the robber's reach. The first lesson comes straight to your inbox soon, and you don't need to do anything. Can't wait? [Lesson 6 is on the site now](https://theludarium.com/academy/catan/number-probability/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-settler-early).
>
> **In the meantime:** play a game or two and notice which numbers actually come up. Then reply and tell me one thing that surprised you. I read every reply.
>
> [Button: See the whole course]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-settler`

## What Kit can and cannot do (checked October 2026)

The plan below is built only from things Kit's own help pages say it does. Where Kit is silent or vague, the plan says so and includes a test.

| # | Question | Answer | Source |
| --- | --- | --- | --- |
| 1 | Branch on a custom field value? | **Yes.** A Visual Automation **Condition > Custom field** can check `matches`, `contains`, `has a value`, and more, as Yes/No or as a **Split Path** with several values. A subscriber goes down the first matching path, left to right; anyone who matches none goes down **Everything else**. So the dropdown answer maps straight to a starting level tag. | [Visual Automations: Conditions](https://help.kit.com/en/articles/2502665-visual-automations-conditions) |
| 2 | Chain sequences in a Visual Automation? | **Yes.** "The subscriber will only move on to the next automation step once they receive the last email from the email sequence." A sequence must stay non-evergreen (the default) for this to work; an evergreen sequence holds people forever. | [Visual Automations: Actions](https://help.kit.com/en/articles/2502537-visual-automations-actions), [How to hold subscribers in evergreen sequences](https://help.kit.com/en/articles/5192801-how-to-hold-subscribers-in-evergreen-email-sequences) |
| 3 | Tag on a link click, and move them forward? | **Tagging: yes.** A **Link Trigger** (a Rule with the trigger "Clicks a link") adds a tag or adds to a sequence when clicked; Creator plan and up. **Moving forward: partly.** Kit's Events pull subscribers forward inside one automation, but Kit does not say whether that stops a sequence they are in, and there is no "remove from sequence" action in Visual Automations. Workaround: each level is its own automation started by its level tag, and each level's sequence **excludes** the higher level tags, so a skip both starts the next level and silences the old one. | [How to use Link Triggers](https://help.kit.com/en/articles/2502518-how-to-use-link-triggers), [Visual Automations: Events](https://help.kit.com/en/articles/2502670-visual-automations-events), [Creating and sending an Email Sequence](https://help.kit.com/en/articles/2502629-creating-and-sending-an-email-sequence-in-kit) |
| 4 | Pause for two weeks, then resume? | **No pause button, but a tag can do it.** A sequence's **Subscribers** setting can exclude a tag; Kit says this stops future emails "even if they're midway through it," does not remove them or mark them completed, and that "removing an exclusion resumes sending ... usually within a few minutes." Kit does not spell out whether the email that came due during the pause is held or skipped, so test it (step D3). **Removing and re-adding:** sequences are not repeatable by default, and a re-added subscriber gets "only the emails they haven't received yet" and resumes from the next unread one. If a sequence is set to restart, re-adding starts them over at email 1. Keep every course sequence non-repeatable. Watch out: removing someone from a sequence counts as completing it in a Visual Automation, so manual removal would push them to graduation. | [Creating and sending an Email Sequence](https://help.kit.com/en/articles/2502629-creating-and-sending-an-email-sequence-in-kit), [Troubleshooting: Why isn't my sequence sending?](https://help.kit.com/en/articles/2502568-troubleshooting-why-isn-t-my-email-sequence-sending), [Restart an Email Sequence](https://help.kit.com/en/articles/5022528-restart-an-email-sequence), [Re-add subscribers where they left off](https://help.kit.com/en/articles/5026948-how-to-re-add-subscribers-to-a-visual-automation-where-they-d-left-off), [Manually add or remove subscribers](https://help.kit.com/en/articles/6211448-how-to-manually-add-or-remove-subscribers-from-a-kit-email-sequence) |
| 5 | Send days, send time, and per-email delays? | **Yes.** Each sequence has an **Email Sequence Schedule** (which days, what time). Each email waits a number of **days** or **hours** after the previous one. Day delays obey the schedule (so "1 day" on a Tuesday and Friday schedule lands on the next Tuesday or Friday). Hour delays ignore the schedule, which is how a graduation email can go out the day after a Tuesday lesson. | [Creating and sending an Email Sequence](https://help.kit.com/en/articles/2502629-creating-and-sending-an-email-sequence-in-kit) |
| 6 | Filter broadcasts by tag and by state? | **Tag: yes.** Broadcast recipients can be filtered by tag, with Any, All, or None matching, and you can send to a **Segment**. **Custom field: probably, not confirmed.** Kit says its automation filters, which do check custom fields, are "the same as those you'd use when creating a Segment," but no current help page shows a custom field filter on a segment or a broadcast. Plan: build a segment per region on `state` (step E2) and test it once. If the segment builder will not filter on `state`, Claude makes the site form also send a region field. | [How to exclude certain subscribers from a Broadcast](https://help.kit.com/en/articles/2502648-how-to-exclude-certain-subscribers-from-a-broadcast), [How to create a Segment](https://help.kit.com/en/articles/2577659-how-to-create-a-segment), [Visual Automations: Conditions](https://help.kit.com/en/articles/2502665-visual-automations-conditions) |
| 7 | Free plan or paid? | **Paid.** Kit's Free plan (up to 10,000 subscribers) has forms, broadcasts, tags, and segments, but "visual automations ... email sequences, rules" live on Creator and Creator Pro, and "visual automations and sequences stop running while you're on the Free plan." Link Triggers are Creator and up. Kit's pricing page lists Creator at $33 a month billed yearly at the 1,000 subscriber tier. If you leave the trial for Free, access ends right away. | [The Kit Free plan](https://help.kit.com/en/articles/16627071-the-kit-free-plan), [How to use Link Triggers](https://help.kit.com/en/articles/2502518-how-to-use-link-triggers), [kit.com/pricing](https://kit.com/pricing) |

Where the original plan changed because of Kit:

- **One automation per level, not one big automation.** Kit cannot pull someone out of a sequence on a click, and its condition branches do not rejoin. Six small automations, each started by its level tag, make skip-ahead work with documented features only.
- **The graduation email lives inside each level's sequence** as its last email, sent 24 hours after the last lesson. The automation does the tag swap right after it sends. An email cannot change tags by itself.
- **Pause uses a tag that the sequences exclude**, plus a tiny automation that removes the tag after 14 days. It needs one test before launch (D3).
- **Regional alerts use a segment on `state`.** Needs one test (E2).
- **The course runs about 19 weeks, not 17,** for someone who starts at Level 0. The math is below.

## How it fits together

**Tags** (all made in `KIT-SETUP.md`, step 2)

| Tag | Meaning |
| --- | --- |
| `academy`, `academy-catan` | Signed up (form rules) |
| `academy-catan-settler` ... `academy-catan-champion` | The level they are on now. Exactly one at a time. |
| `academy-catan-paused` | Lessons on hold. Removed automatically after 14 days. |
| `academy-catan-complete` | Finished the whole course |
| `academy-catan-league-interest` | Clicked "Count me in" for the practice league |

**Sequences** (seven)

| Sequence | Emails | Schedule |
| --- | --- | --- |
| Catan: Welcome | 1 (the welcome) | Every day, as soon as possible |
| Catan L0: Settler | Lessons 1 to 5, then graduation | Every day, 7:00 am |
| Catan L1: Homesteader | Lessons 6 to 12, then graduation | Tuesday and Friday, 7:00 am |
| Catan L2: Trader | Lessons 13 to 20, then graduation | Tuesday and Friday, 7:00 am |
| Catan L3: Strategist | Lessons 21 to 28, then graduation | Tuesday and Friday, 7:00 am |
| Catan L4: Contender | Lessons 29 to 35, then graduation | Tuesday and Friday, 7:00 am |
| Catan L5: Champion | Lessons 36 to 40, graduation, then course complete | Tuesday and Friday, 7:00 am |

**Visual Automations** (eight)

1. **Catan: Start.** Form signup, welcome email, then a split on `catan_experience` adds the starting level tag.
2. to 7. **Catan: Level 0** through **Catan: Level 5.** Each starts when its level tag is added, runs that level's sequence, then swaps the tag up one rank, which starts the next level.
8. **Catan: Pause.** Starts when `academy-catan-paused` is added, waits 14 days, removes it.

**Link Triggers** (seven, made under Rules)

- Five skip-ahead triggers, one per level from Settler to Contender. Each adds the next level's tag.
- One pause trigger. Adds `academy-catan-paused`.
- One league trigger in the course-complete email. Adds `academy-catan-league-interest`.

**Starting level from the dropdown**

| `catan_experience` | Starting tag | Starts at |
| --- | --- | --- |
| Never played | `academy-catan-settler` | Level 0, lesson 1 |
| Played a few times | `academy-catan-homesteader` | Level 1, lesson 6 |
| I play regularly | `academy-catan-trader` | Level 2, lesson 13 |
| I want to compete | `academy-catan-contender` | Level 4, lesson 29 |
| (anything else or blank) | `academy-catan-settler` | Level 0, lesson 1 |

## Cadence and the math

- **Welcome:** as soon as they confirm.
- **Level 0:** lesson 1 the next morning, then a lesson every 2 days.
- **Levels 1 to 5:** Tuesday and Friday mornings at 7:00 am, in the account's time zone (set it to Eastern under **Settings > General** or wherever Kit keeps the account time zone, if it is not already).
- **Graduations:** 24 hours after a level's last lesson.
- **Course complete:** the next Tuesday or Friday morning after the Champion graduation.

**The 48 emails** for someone who starts at Level 0: 1 welcome + 40 lessons + 6 graduations + 1 course complete = 48.

Why six graduations: there are six levels and each one ends with one. The first five move you up a level (Settler to Homesteader, Homesteader to Trader, Trader to Strategist, Strategist to Contender, Contender to Champion). The sixth closes the Champion level and leads into the course-complete email a few days later.

People who start higher get fewer: Level 1 starters get 42 emails, Level 2 starters 34, Level 4 starters 16.

**How long it takes, from Level 0** (days counted from the confirm click):

- Level 0: lesson 1 on day 1, lesson 5 on day 9, graduation on day 10. About a week and a half.
- Levels 1 to 5 are 35 lessons on 35 back-to-back Tuesday and Friday slots. That is 34 gaps between lessons, alternating 3 days (Tuesday to Friday) and 4 days (Friday to Tuesday), so 17 × 3 + 17 × 4 = **119 days, exactly 17 weeks.** Graduations go out the next day, before the following slot, so they never push a lesson back.
- Add the wait from the Level 0 graduation to the first Tuesday or Friday slot (1 to 4 days), and the Champion graduation plus course complete at the end (3 to 4 days).
- **Total: 133 to 136 days, about 19 weeks (four and a half months),** depending on the weekday they sign up.

So the "17 weeks" was right for Levels 1 to 5 alone. For a Level 0 starter the whole course is about 19 weeks. Starting points: Level 1 about 18 weeks, Level 2 about 14 weeks, Level 4 about 6 weeks. Each pause adds 2 weeks.

## Build it in Kit

Build in this order so nothing fires half finished: sequences first (as drafts), then link triggers, then automations, then test, then publish. Visual Automations are not retroactive, so anyone who signs up before an automation is live will not enter it.

### A. The seven sequences

**Automation > Email Sequences > + New sequence** for each one in the sequences table above.

For every sequence, open the **Settings** tab:

- **Email Sequence Schedule:** the days and time from the table.
- **Restart (repeatable):** leave on **No**. This is what makes a pause or a fix resume where someone left off instead of starting over.
- **Sequence behavior (evergreen):** leave on **No**. People must finish the sequence so the automation moves them on.
- **Subscribers (exclusions):** for the six level sequences only, exclude:
  - the tag `academy-catan-paused` (this is the pause), and
  - every **higher** level tag, plus `academy-catan-complete`. For example, **Catan L1: Homesteader** excludes `academy-catan-trader`, `academy-catan-strategist`, `academy-catan-contender`, `academy-catan-champion`, and `academy-catan-complete`. **Catan L5: Champion** excludes only `academy-catan-paused` and `academy-catan-complete`. This is what silences a level when someone skips past it.

Delays for each email (**Send this email > After a delay**):

| Sequence | First email | Each lesson after that | Graduation | Course complete |
| --- | --- | --- | --- | --- |
| Catan: Welcome | As soon as possible | | | |
| Catan L0: Settler | 1 day | 2 days | 24 **hours** | |
| Catan L1 to L4 | 1 day | 1 day (lands on the next Tue or Fri) | 24 **hours** | |
| Catan L5: Champion | 1 day | 1 day | 24 **hours** | 1 day (lands on the next Tue or Fri) |

The graduation delay must be in hours, not days. Hour delays ignore the Tuesday and Friday schedule, so the graduation lands the day after the last lesson. A "1 day" delay there would wait for the next Tuesday or Friday instead.

Paste each email from this doc (welcome, graduations, course complete) and from the lesson emails Claude writes. Leave the sequences unpublished until step D.

To edit an email's body in Kit's editor, select all twice (the first select-all only takes the current paragraph) before deleting or pasting.

### B. The link triggers

**Automate > Rules > + New rule**, trigger **Clicks a link**. Give each a name, a destination URL, and the action **Add tag**.

| Name | Destination URL | Adds tag | Goes in |
| --- | --- | --- | --- |
| Catan: skip to Homesteader | `https://theludarium.com/academy/catan/number-probability/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=skip-homesteader` | `academy-catan-homesteader` | Level 0 lesson emails |
| Catan: skip to Trader | `https://theludarium.com/academy/catan/read-the-board/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=skip-trader` | `academy-catan-trader` | Level 1 lesson emails |
| Catan: skip to Strategist | `https://theludarium.com/academy/catan/card-counting/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=skip-strategist` | `academy-catan-strategist` | Level 2 lesson emails |
| Catan: skip to Contender | `https://theludarium.com/academy/catan/how-catan-tournaments-work/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=skip-contender` | `academy-catan-contender` | Level 3 lesson emails |
| Catan: skip to Champion | `https://theludarium.com/academy/catan/planning-a-season/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=skip-champion` | `academy-catan-champion` | Level 4 lesson emails |
| Catan: pause lessons | `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=pause` | `academy-catan-paused` | Every lesson email |
| Catan: league interest | `https://theludarium.com/academy/catan/the-long-game/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=league` | `academy-catan-league-interest` | Course complete email |

Each skip link drops the reader on the first lesson of their new level, so the click itself shows them where they landed. The pause link goes to the course page for now; a small "Lessons paused for two weeks" page would be clearer, and Claude can add one at `/academy/catan/paused/` if you want it (then change this destination).

Champion lessons have no skip link, since there is no level above.

To put a link trigger in an email: highlight the text, click the link icon, leave the URL box empty, click **Link Trigger**, pick the trigger, and **Apply**. For a button, click the lightning bolt next to its URL setting.

### C. The automations

**Automation > Visual Automations > + New Automation**, start from scratch.

**C1. Catan: Start**

1. Entry point: **Joins a form**, **Academy: Road to the Catan Championship**.
2. Action: **Email sequence**, **Catan: Welcome**.
3. Condition: **Custom field**, `catan_experience`, **Split Path**. Add four paths with **matches**, in this order:
   - `I want to compete`: then Action **Add tag** `academy-catan-contender`
   - `I play regularly`: then **Add tag** `academy-catan-trader`
   - `Played a few times`: then **Add tag** `academy-catan-homesteader`
   - `Never played`: then **Add tag** `academy-catan-settler`
   - **Everything else**: then **Add tag** `academy-catan-settler`

The welcome goes out first, then the tag starts the right level. Kit's paths do not join back together, which is why each level is its own automation.

**C2. Catan: Level 0** (Settler)

1. Entry point: **Tag is added**, `academy-catan-settler`.
2. Action: **Email sequence**, **Catan L0: Settler**.
3. Action: **Remove tag** `academy-catan-settler`.
4. Action: **Add tag** `academy-catan-homesteader`.

**C3 to C6. Catan: Level 1 to Level 4** (same shape; Level 1 shown)

1. Entry point: **Tag is added**, `academy-catan-homesteader`.
2. Action: **Remove tag** `academy-catan-settler`. (Tidy-up for people who skipped ahead. Harmless for everyone else.)
3. Action: **Move subscriber > Remove from another automation**, **Catan: Level 0**. (Same tidy-up.)
4. Action: **Email sequence**, **Catan L1: Homesteader**.
5. Action: **Remove tag** `academy-catan-homesteader`.
6. Action: **Add tag** `academy-catan-trader`.

| Automation | Entry tag | Tidy-up removes | Sequence | Then swaps to |
| --- | --- | --- | --- | --- |
| Catan: Level 1 | `academy-catan-homesteader` | `academy-catan-settler`, automation Level 0 | Catan L1: Homesteader | `academy-catan-trader` |
| Catan: Level 2 | `academy-catan-trader` | `academy-catan-homesteader`, automation Level 1 | Catan L2: Trader | `academy-catan-strategist` |
| Catan: Level 3 | `academy-catan-strategist` | `academy-catan-trader`, automation Level 2 | Catan L3: Strategist | `academy-catan-contender` |
| Catan: Level 4 | `academy-catan-contender` | `academy-catan-strategist`, automation Level 3 | Catan L4: Contender | `academy-catan-champion` |

**C7. Catan: Level 5** (Champion): same shape. Entry `academy-catan-champion`; tidy-up removes `academy-catan-contender` and automation Level 4; sequence **Catan L5: Champion**; then **Remove tag** `academy-catan-champion` and **Add tag** `academy-catan-complete`.

How a skip works: a Level 1 reader clicks "Too easy?" The trigger adds `academy-catan-trader`. That starts **Catan: Level 2**, which removes the old tag and pulls them out of the Level 1 automation. The Level 1 sequence excludes `academy-catan-trader`, so even if Kit leaves them sitting in it, no more Level 1 emails go out. Someone who skips two levels in a row may leave a stalled entry in an old automation; it sends nothing and can be ignored.

**C8. Catan: Pause**

1. Entry point: **Tag is added**, `academy-catan-paused`.
2. Action: **Delay**, 14 days.
3. Action: **Remove tag** `academy-catan-paused`.

While the tag is on, every level sequence holds their next email. When it comes off, Kit resumes sending. Because the automation removes its own trigger tag at the end, a reader can pause again later and it runs again ([How to continuously loop subscribers](https://help.kit.com/en/articles/8885098-how-to-continuously-loop-subscribers-through-a-visual-automation)). To unpause someone early, remove the tag from their profile by hand.

### D. Test before launch

Use your own address (or a `+` variant such as `you+catan1@gmail.com`). For the tests, temporarily set the pause delay to 1 hour and each sequence's delays to minutes or hours, then put them back.

1. **Starting level.** Sign up once per dropdown answer. Each should get the welcome, then the right level tag, then the right first lesson.
2. **Skip ahead.** From a Level 1 test subscriber, click "Too easy?" Check: tag swaps to Trader, Level 1 emails stop, the next email is lesson 13.
3. **Pause.** Click "Pause lessons" while an email is due. Wait for the (shortened) pause to end. Check that the email that came due during the pause arrives within a few minutes, and that the next one follows on schedule. **If the held email never arrives** (Kit skipped it instead of holding it), switch the pause to the fallback below.
4. **Graduation.** Let a test subscriber finish Level 0. Check: graduation arrives a day after lesson 5, the tag becomes Homesteader, lesson 6 follows on the next Tuesday or Friday.
5. Publish all seven sequences, turn on all eight automations, and restore the real delays.

**Pause fallback, only if test D3 fails.** Keep the exclusion (it still stops sends during the pause) and extend **Catan: Pause**: before the delay, add **Move subscriber > Remove from another automation** for the level automation they are in (a Split Path on the six level tags picks which), and after the delay, remove and re-add their current level tag. That restarts their level automation, and because the sequences are not repeatable, Kit sends only the lessons they have not had yet. The cost: more steps, and a few minutes where the tag is off. One sequence per level keeps any surprise small: at worst it touches one level, never the whole course.

### Known risk: link scanners

Some work and school email systems click every link in an email to check it for safety. Kit counts those as real clicks, so a scanner could press "Pause" or "Too easy?" for a reader who never touched them ([Why are my emails being automatically opened or clicked?](https://help.kit.com/en/articles/3643376-why-are-my-emails-being-automatically-opened-or-clicked)). Most course readers will use personal addresses, so start without a guard. Watch for it: a reader who pauses and skips on the same email within a minute of it sending is almost certainly a scanner. If it shows up, Kit's suggested check is a hidden link that only scanners click; Claude can add that guard to the skip and pause automations.

## The lesson email template

Every lesson email has the same shape. Claude drafts all 40 from the lesson pages; Levi edits.

**Subject:** the lesson's email subject (table below).

**Preview text:** one line that adds to the subject (table below).

**Body, 150 to 250 words:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> One short opening line that hooks.
>
> **The one idea:** the lesson's big idea in two to four sentences.
>
> **A quick example:** one concrete moment at the table.
>
> **Try it this week:** the lesson's drill, in one or two sentences.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

The button links to the lesson with tracking:

`https://theludarium.com/academy/catan/<slug>/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=lesson-NN`

where `NN` is the two-digit lesson number (`lesson-01` to `lesson-40`).

**Footer** (above Kit's own unsubscribe and address lines):

> Too easy? [Jump to the next level](link trigger: the skip trigger for this level) · Busy stretch? [Pause lessons for two weeks](link trigger: Catan: pause lessons) · [Find a Catan event near you](https://theludarium.com/articles/catan-tournament-qualifier/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=events)

The events link points to the qualifier article for now. It will change to an events page when The Ludarium has one. Champion lessons (36 to 40) drop the "Too easy?" link, since there is no next level.

### Example: lesson 6

**Subject:** Those little dots are the whole game

**Preview text:** Why a 6 comes up five times as often as a 2, in plain English.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Look at any number token in Catan and you'll see dots under the number. Most new players ignore them. They are the most useful thing on the board.
>
> **The one idea:** the dots count how many ways two dice can make that number. Two dice can land 36 ways. A 6 or an 8 can be rolled 5 ways each, so they get 5 dots. A 2 or a 12 can be rolled only 1 way, so they get 1. Add up the dots around a spot and you know how often it pays you.
>
> **A quick example:** a settlement touching a 6, a 9, and a 4 has 5 + 4 + 3 = 12 dots. One touching a 2, an 11, and a 10 has 1 + 2 + 3 = 6. Same settlement, same cost, but the first pays about twice as often. And 7 has the most ways of all, 6 out of 36, which is why the robber shows up about one roll in six.
>
> **Try it this week:** before you place anything, total the dots on every spot you are considering. Out loud, if your table will let you.
>
> [Button: Read the full lesson]
>
> Levi
> The Ludarium

## All 40 lesson emails

"Example day" counts days from the confirm click for someone who starts at Level 0 and confirms on a Monday. Other sign-up days shift it by a day or two, but Levels 1 to 5 always land on a Tuesday or Friday. Kit delay settings are in step A.

| # | Level | Subject | Preview line | Lesson URL | Sends | Example day |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | 0 Settler | Welcome to the island | How a 1995 board game started the modern hobby, and the one goal that matters. | `https://theludarium.com/academy/catan/what-is-catan/` | 1 day after the welcome | 1 (Tue) |
| 2 | 0 Settler | Your first board, built in 10 minutes | 19 hexes, 18 numbers, 9 ports, and the placement order that trips up new players. | `https://theludarium.com/academy/catan/catan-setup/` | 2 days after the previous lesson | 3 (Thu) |
| 3 | 0 Settler | Roll, trade, build, repeat | Every turn has three beats. Learn them once and you can teach anyone. | `https://theludarium.com/academy/catan/how-a-turn-works/` | 2 days after the previous lesson | 5 (Sat) |
| 4 | 0 Settler | Who invited the robber? | What happens on a 7, why you count your cards, and what is in the development deck. | `https://theludarium.com/academy/catan/robber-and-development-cards/` | 2 days after the previous lesson | 7 (Mon) |
| 5 | 0 Settler | 10 points: here's every way to get there | Settlements, cities, two bonuses, and the hidden points nobody sees coming. | `https://theludarium.com/academy/catan/how-to-win/` | 2 days after the previous lesson | 9 (Wed) |
| 6 | 1 Homesteader | Those little dots are the whole game | Why a 6 comes up five times as often as a 2, in plain English. | `https://theludarium.com/academy/catan/number-probability/` | Next Tue or Fri, at least 1 day after the level starts | 11 (Fri) |
| 7 | 1 Homesteader | The 90 seconds that decide most games | A five-point checklist for the two placements that shape your whole game. | `https://theludarium.com/academy/catan/opening-settlements/` | Next Tue or Fri | 15 (Tue) |
| 8 | 1 Homesteader | Why brick feels like gold on turn 4 | What you need on turn 4 is not what you need on turn 24. | `https://theludarium.com/academy/catan/resource-value-over-time/` | Next Tue or Fri | 18 (Fri) |
| 9 | 1 Homesteader | Stop feeding the bank | When 4:1 is fine, and when it quietly hands someone else the win. | `https://theludarium.com/academy/catan/bank-and-port-trades/` | Next Tue or Fri | 22 (Tue) |
| 10 | 1 Homesteader | The discard you didn't have to make | Eight cards is the danger line. Here is how to stay under it. | `https://theludarium.com/academy/catan/hand-management/` | Next Tue or Fri | 25 (Fri) |
| 11 | 1 Homesteader | The cards everyone underrates | When a development card beats a road, and when to play each kind. | `https://theludarium.com/academy/catan/development-cards-for-beginners/` | Next Tue or Fri | 29 (Tue) |
| 12 | 1 Homesteader | Seven ways you're losing (and how to stop) | Road spam, hoarding, feeding the leader, and four more habits to drop. | `https://theludarium.com/academy/catan/beginner-mistakes/` | Next Tue or Fri | 32 (Fri) |
| 13 | 2 Trader | Every board tells you what's valuable | Four questions, sixty seconds, and you know what this map rewards. | `https://theludarium.com/academy/catan/read-the-board/` | Next Tue or Fri, at least 1 day after the level starts | 36 (Tue) |
| 14 | 2 Trader | Pick a lane | Cities, roads, ports, or balance. Each can win. Mixing them often can't. | `https://theludarium.com/academy/catan/four-core-strategies/` | Next Tue or Fri | 39 (Fri) |
| 15 | 2 Trader | Fourth pick isn't a curse | How first, second, third, and fourth pick change your plan. | `https://theludarium.com/academy/catan/seat-position/` | Next Tue or Fri | 43 (Tue) |
| 16 | 2 Trader | Plan your next two settlements now | Mark your next two spots before you roll, then race for them. | `https://theludarium.com/academy/catan/expansion-planning/` | Next Tue or Fri | 46 (Fri) |
| 17 | 2 Trader | Every trade has a winner | Lopsided offers, specific asks, and why you never feed the leader. | `https://theludarium.com/academy/catan/art-of-the-trade/` | Next Tue or Fri | 50 (Tue) |
| 18 | 2 Trader | The math behind the city rush | Expected cards per turn, and the moment a city beats a settlement. | `https://theludarium.com/academy/catan/cities-first/` | Next Tue or Fri | 53 (Fri) |
| 19 | 2 Trader | Two points that change hands | Two 2-point bonuses. When to chase, when to contest, when to let go. | `https://theludarium.com/academy/catan/longest-route-and-largest-army/` | Next Tue or Fri | 57 (Tue) |
| 20 | 2 Trader | Build your own bank | Turn one 2:1 port into your own private bank. | `https://theludarium.com/academy/catan/port-engine/` | Next Tue or Fri | 60 (Fri) |
| 21 | 3 Strategist | You can know what they're holding | Track every hand at the table, plus the tournament rule to know. | `https://theludarium.com/academy/catan/card-counting/` | Next Tue or Fri, at least 1 day after the level starts | 64 (Tue) |
| 22 | 3 Strategist | The robber is a weapon | Whom to hit, which hex, and when. | `https://theludarium.com/academy/catan/robber-tactics/` | Next Tue or Fri | 67 (Fri) |
| 23 | 3 Strategist | The quiet player is about to win | Visible points lie. Here is how to spot the real leader. | `https://theludarium.com/academy/catan/threat-assessment/` | Next Tue or Fri | 71 (Tue) |
| 24 | 3 Strategist | Win the table, win the game | Persuasion, alliances of convenience, and talking the robber elsewhere. | `https://theludarium.com/academy/catan/table-talk-and-negotiation/` | Next Tue or Fri | 74 (Fri) |
| 25 | 3 Strategist | How games actually end | From 7 points to 10: plan the path before you roll. | `https://theludarium.com/academy/catan/endgame/` | Next Tue or Fri | 78 (Tue) |
| 26 | 3 Strategist | 14 Knights, 5 points, and the odds | How the odds shift as the development deck thins. | `https://theludarium.com/academy/catan/development-card-math/` | Next Tue or Fri | 81 (Fri) |
| 27 | 3 Strategist | Your opening was bad. Now what? | A weak start is not a lost game. Here is how to play from behind. | `https://theludarium.com/academy/catan/recovering-from-a-bad-start/` | Next Tue or Fri | 85 (Tue) |
| 28 | 3 Strategist | The habit every strong player has | Three lines after every game. The habit that builds strong players. | `https://theludarium.com/academy/catan/reviewing-your-games/` | Next Tue or Fri | 88 (Fri) |
| 29 | 4 Contender | Yes, there's a Catan World Championship | From a local qualifier to the World Championship, step by step. | `https://theludarium.com/academy/catan/how-catan-tournaments-work/` | Next Tue or Fri, at least 1 day after the level starts | 92 (Tue) |
| 30 | 4 Contender | The robber is live on turn one | The official rules that differ from your kitchen table. | `https://theludarium.com/academy/catan/tournament-rules/` | Next Tue or Fri | 95 (Fri) |
| 31 | 4 Contender | Five minutes to read the board | A five-minute checklist before anyone places a settlement. | `https://theludarium.com/academy/catan/map-study/` | Next Tue or Fri | 99 (Tue) |
| 32 | 4 Contender | Two minutes. Place your settlement. | Two minutes per placement, three for the double. Practice makes it calm. | `https://theludarium.com/academy/catan/placing-under-the-clock/` | Next Tue or Fri | 102 (Fri) |
| 33 | 4 Contender | Losing well is a skill | Tiebreakers reward every point. Here is how to lose well. | `https://theludarium.com/academy/catan/play-for-points/` | Next Tue or Fri | 106 (Tue) |
| 34 | 4 Contender | Plan on their turn, act on yours | Do your thinking on their turn so yours is quick and clean. | `https://theludarium.com/academy/catan/beating-the-turn-timer/` | Next Tue or Fri | 109 (Fri) |
| 35 | 4 Contender | I played my first Catan qualifier. Here's what happened. | Logistics, mindset, and etiquette from my first qualifier. | `https://theludarium.com/academy/catan/your-first-qualifier/` | Next Tue or Fri | 113 (Tue) |
| 36 | 5 Champion | Plan your season like a pro | Local qualifiers, the regional, and the calendar, in one plan. | `https://theludarium.com/academy/catan/planning-a-season/` | Next Tue or Fri, at least 1 day after the level starts | 116 (Fri) |
| 37 | 5 Champion | Four games. No final table. | Four steady games beat one brilliant one. | `https://theludarium.com/academy/catan/regional-preliminary-prep/` | Next Tue or Fri | 120 (Tue) |
| 38 | 5 Champion | What it takes to win Nationals | The format, the seat choice on the clock, and serpentine seating. | `https://theludarium.com/academy/catan/inside-the-national-championship/` | Next Tue or Fri | 123 (Fri) |
| 39 | 5 Champion | Learn from the world champions | Watch a championship final turn by turn, the way a coach would. | `https://theludarium.com/academy/catan/study-championship-finals/` | Next Tue or Fri | 127 (Tue) |
| 40 | 5 Champion | You're not training alone | Masters, international events, and the group that keeps you sharp. | `https://theludarium.com/academy/catan/the-long-game/` | Next Tue or Fri | 130 (Fri) |

grad 0 10 Thu
grad 1 33 Sat
grad 2 61 Sat
grad 3 89 Sat
grad 4 114 Wed
grad 5 131 Sat
complete 134 Tue 19.142857142857142

Graduations (the last email in each level's sequence, 24 hours after the level's last lesson; example days for the same Monday sign-up): Level 0 day 10, Level 1 day 33, Level 2 day 61, Level 3 day 89, Level 4 day 114, Level 5 day 131. Course complete: day 134.

## The welcome email

Sequence **Catan: Welcome**, email 1, as soon as possible after confirming. Kit's Liquid can read custom fields as `{{ subscriber.catan_experience }}`, so one email tells each reader where they start ([Basic email personalization with Liquid](https://help.kit.com/en/articles/2502633-basic-email-personalization-with-liquid-faqs)). Put each `{% ... %}` line on its own line in Kit's editor, and check all four versions with Kit's preview before publishing.

**Subject:** Your road to the Catan Championship starts here

**Preview text:** Where you start, how the lessons work, and what to do if a week gets busy.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Road to the Catan Championship, the first course from The Ludarium Academy. From kitchen table to tournament table, one lesson at a time.
>
> **Where you start**
>
> {% if subscriber.catan_experience == "I want to compete" %}
> You told us you want to compete, so you start at **Level 4: Contender**. You'll learn how the tournament ladder works, the official rules, and how to play on the clock. Your first lesson arrives Tuesday or Friday morning, whichever comes first. Can't wait? [Read it now](https://theludarium.com/academy/catan/how-catan-tournaments-work/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome).
> {% elsif subscriber.catan_experience == "I play regularly" %}
> You play regularly, so you start at **Level 2: Trader**. You'll learn to read any board, commit to a plan, and win trades on purpose. Your first lesson arrives Tuesday or Friday morning, whichever comes first. Can't wait? [Read it now](https://theludarium.com/academy/catan/read-the-board/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome).
> {% elsif subscriber.catan_experience == "Played a few times" %}
> You've played a few times, so you start at **Level 1: Homesteader**. No more setup mistakes, and openings you can explain. Your first lesson arrives Tuesday or Friday morning, whichever comes first. Can't wait? [Read it now](https://theludarium.com/academy/catan/number-probability/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome).
> {% else %}
> You start at **Level 0: Settler**, the very beginning. By the end of it you'll set up and finish a game without the rulebook. Your first lesson arrives tomorrow morning. Can't wait? [Read it now](https://theludarium.com/academy/catan/what-is-catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome).
> {% endif %}
>
> **How it works**
>
> - 40 lessons in six levels: Settler, Homesteader, Trader, Strategist, Contender, and Champion.
> - Each email is a two-minute read: one idea, a quick example, and one thing to try at your next game. The full lesson lives on the site, with a short Level check at the end.
> - **Too easy?** Every lesson email has a "Jump to the next level" link. One click moves you up.
> - **Busy stretch?** "Pause lessons" holds them for two weeks, then they pick up where you left off.
>
> **Why this course exists**
>
> This fall I entered my first official Catan qualifier, a $10 local tournament at a game store north of Indianapolis. I went looking for a clear path from casual player to tournament player and couldn't find one in one place. So we're building it, one lesson at a time. [Here's the story of how it started](https://theludarium.com/articles/catan-tournament-qualifier/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome-story).
>
> One favor: reply and tell me how you play Catan now. Family game night, a group of friends, online? I read every reply, and it shapes the lessons.
>
> [Button: See all 40 lessons]
>
> See you at the table,
>
> Levi
> The Ludarium

Button destination: `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=welcome`

## The six graduation emails

Each is the last email in its level's sequence, sent 24 hours after the level's last lesson. Right after it sends, the level automation swaps the tag up one rank and the next level begins. Each button opens the first lesson of the new level, with `utm_content=grad-<level just finished>`.

### 1. Settler to Homesteader (end of Level 0)

**Subject:** Level 0 done. You can play Catan now.

**Preview text:** Next up: Homesteader, where the setup mistakes stop.

> Hi {{ subscriber.first_name | default: "there" }},
>
> That's Level 0: Settler, finished. You can set up a board, run a turn, handle the robber, and count your way to 10 points. That's more than a lot of people who own the game.
>
> **You're a Homesteader now.** Level 1 is seven lessons on the choices that win games before the dice do much: what the dots mean, where your first two settlements go, and how to keep your hand out of the robber's reach. By the end you'll stop making setup mistakes, and you'll be able to explain every placement.
>
> **One change in your inbox:** lessons now come twice a week, Tuesday and Friday mornings. That leaves room for a game or two in between.
>
> **Before the next one:** play a game this week and notice which numbers actually come up.
>
> [Button: Preview Level 1]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/number-probability/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-settler`

### 2. Homesteader to Trader (end of Level 1)

**Subject:** No more setup mistakes. Now read the board.

**Preview text:** Level 1 done. Trader is where you start playing with a plan.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Level 1: Homesteader is done. Your openings have reasons now: dots, variety, brick and wood, room to grow. That alone wins a lot of kitchen-table games.
>
> **You're a Trader now.** Level 2 is eight lessons on reading any board in a minute, picking a strategy that fits it, and winning trades on purpose. By the end you'll sit down, read the map, and commit to a plan before you place a thing.
>
> Your next lesson arrives Tuesday or Friday morning.
>
> **Before then:** at your next game, name the scarcest resource on the board out loud before anyone places. You'll see why in the first Trader lesson.
>
> [Button: Preview Level 2]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/read-the-board/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-homesteader`

### 3. Trader to Strategist (end of Level 2)

**Subject:** You have a plan. Now play the people.

**Preview text:** Level 2 done. Strategist is about everyone else at the table.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Level 2: Trader is done. You can read a board, pick a lane, and make trades that help you more than the other person.
>
> **You're a Strategist now.** Level 3 turns your eyes from the board to the table: tracking hands, aiming the robber, spotting the real leader, talking your way out of trouble, and closing out your last three points. Eight lessons. By the end you'll play the opponents, not just the board.
>
> Your next lesson arrives Tuesday or Friday morning.
>
> **Before then:** in your next game, guess what one opponent is holding each round. No pressure to be right yet.
>
> [Button: Preview Level 3]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/card-counting/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-trader`

### 4. Strategist to Contender (end of Level 3)

**Subject:** Ready for a real tournament table?

**Preview text:** Level 3 done. Contender gets you ready for an official qualifier.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Level 3: Strategist is done. You track hands, aim the robber with a reason, and know how games really end. That makes you a strong player at any home table.
>
> **You're a Contender now.** Level 4 is seven lessons on the tournament itself: how the CATAN Championship ladder works, the official rules that change your play, a five-minute map study, placing on the clock, and what a first qualifier is really like. By the end you can walk into an official qualifier knowing the format, the rules, and the clock.
>
> If you told us your state when you signed up, we'll pass along qualifiers we hear about in your region.
>
> Your next lesson arrives Tuesday or Friday morning.
>
> [Button: Preview Level 4]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/how-catan-tournaments-work/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-strategist`

### 5. Contender to Champion (end of Level 4)

**Subject:** Qualifier ready. Now plan a season.

**Preview text:** Level 4 done. Champion is the path to Regionals and Nationals.

> Hi {{ subscriber.first_name | default: "there" }},
>
> Level 4: Contender is done. You know the format, the rules, and the clock. If you haven't signed up for a local qualifier yet, this is a great week to do it.
>
> **You're on the Champion level now, the last one.** Five lessons on planning a season, preparing for a Regional Preliminary, what the National Championship looks like up close, studying championship finals, and the long game after that. By the end you'll have a real plan for a run at Regionals and Nationals.
>
> Your next lesson arrives Tuesday or Friday morning.
>
> **Before then:** look up the next three qualifiers within driving distance and put one on your calendar.
>
> [Button: Preview Level 5]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/planning-a-season/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-contender`

### 6. Champion level complete (end of Level 5)

This one does not move anyone up a level; there is no seventh. It closes the course, and the course-complete email follows on the next Tuesday or Friday. After it sends, the Level 5 automation swaps `academy-catan-champion` for `academy-catan-complete`.

**Subject:** Six levels. Forty lessons. You did it.

**Preview text:** You finished the Champion level. One more email is on its way.

> Hi {{ subscriber.first_name | default: "there" }},
>
> You finished Level 5: Champion, and with it every lesson in Road to the Catan Championship.
>
> Look how far the road went:
>
> - **Settler:** set up and finish a game without the rulebook.
> - **Homesteader:** openings you can explain.
> - **Trader:** a plan for any board.
> - **Strategist:** play the table, not just the board.
> - **Contender:** ready for the format, the rules, and the clock.
> - **Champion:** a plan for Regionals and Nationals.
>
> Wherever you started, that's real work. Thank you for spending it with us.
>
> One more email comes in a few days, about what's next, including the practice league we're starting.
>
> Until then, a favor: reply and tell me which lesson changed your game the most. I read every reply.
>
> [Button: Revisit all 40 lessons]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: `https://theludarium.com/academy/catan/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=grad-champion`

## The course-complete email

Last email in **Catan L5: Champion**, delay 1 day (lands on the next Tuesday or Friday after the Champion graduation). The button is a link trigger, so every click is a name on the practice league list and a count of real demand.

**Subject:** From kitchen table to tournament table

**Preview text:** What comes after the course, and the practice league we're starting.

> Hi {{ subscriber.first_name | default: "there" }},
>
> You've finished Road to the Catan Championship. Here's what comes next.
>
> **The practice league.** The Ludarium is starting a Catan practice league: a standing group of players who want to get better together, like the training group from the last lesson. It isn't running yet. Course graduates hear about it first, and if you want in, the button below puts your name down. No commitment.
>
> **Find a qualifier.** Local qualifiers run at game stores and conventions all season. [Here's how the ladder works and how to find one near you](https://theludarium.com/articles/catan-tournament-qualifier/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=complete-qualifier).
>
> **Keep the games coming.** The Ludarium newsletter shares game night ideas, new tools, and news about the lounge we're building in Indianapolis. [Join here](https://theludarium.com/newsletter/?utm_source=kit&utm_medium=email&utm_campaign=academy-catan&utm_content=complete-newsletter) if you haven't already.
>
> **Tell me how it goes.** When you play your first qualifier, reply and tell me. Win or lose, I want to hear it.
>
> [Button: Count me in for the league]
>
> See you at the table,
>
> Levi
> The Ludarium

Button: link trigger **Catan: league interest** (adds `academy-catan-league-interest`).

## Broadcasts stay separate

Sequences carry the course. Everything timely goes out as a **broadcast**, never added to a sequence, so the course stays evergreen and the same for everyone. Send broadcasts on Monday, Wednesday, or Thursday so they don't land on top of a Tuesday or Friday lesson.

**E1. The newsletter (Ludarium Letters).** Send it to people who joined the newsletter: recipients filtered to **Subscribed to form: Ludarium Letters** (add the Indianapolis waitlist form too, if you want those readers on it). Do not send it to "All subscribers" once Academy signups arrive, or course-only readers get mail they did not ask for. Course readers are invited to join in the course-complete email.

**E2. Qualifier alerts, by region.** CATAN Studio splits the US into three regions for its Regional Preliminaries, and a local qualifier winner goes to the Regional Preliminary for the state where they won. The 2026-2027 map ([United States Regional Structure](https://catanevents.com/players/champ/us-regional/), updated September 2026; the full list comes from the map image on that page, which also names Alabama, Florida, and Georgia moving to Pirate and Texas moving to Knight this season):

| Region | States |
| --- | --- |
| **Knight** (middle of the country, including Indiana) | AR, IA, IL, IN, KS, KY, LA, MI, MN, MO, MS, ND, NE, OH, OK, SD, TN, TX, WI (19) |
| **Merchant** (West) | AK, AZ, CA, CO, HI, ID, MT, NM, NV, OR, UT, WA, WY (13) |
| **Pirate** (East) | AL, CT, DC, DE, FL, GA, MA, MD, ME, NC, NH, NJ, NY, PA, RI, SC, VA, VT, WV (18 states plus DC) |

Build one segment per region. **Subscribers > + Create a Segment**, named for example **Catan alerts: Knight**:

- Filter group 1, matching **all**: tag `academy-catan`.
- Filter group 2, matching **any**: custom field `state` is `IN`, then `IL`, and so on for each Knight state.

Then send qualifier alerts to that segment. Test it once with your own profile set to `IN`. If Kit's segment builder does not offer the `state` custom field, tell Claude: the site form can send a `region` value (`knight`, `merchant`, `pirate`, or `outside-us`) alongside `state`, and a simple tag on signup replaces the 19-row filter.

Readers who skipped the state question or chose "Outside the US" get no regional alerts. Once CATAN redraws the map (they review it every year), update the segments.

**E3. Game nights and the lounge.** The Ludarium does not run game nights yet. When it does, announce them by broadcast to the people near them (the Knight segment with `state` = `IN`, or the `lounge-indianapolis` tag), never as a course email.

## Measuring it

**1. Clicks from each email to the site.**

- **In Kit:** **Automation > Email Sequences**, open a sequence, **Analytics** tab. Each email shows sends, open rate, click rate, and unsubscribes. Click an email for its **Engagement Overview**, which counts clicks on each link, so you can see "Read the full lesson" against skip and pause ([Email Sequence Analytics explained](https://help.kit.com/en/articles/3714889-email-sequence-analytics-explained)). Click rate matters more than open rate; Apple Mail inflates opens.
- **In Google Analytics 4:** every course link carries `utm_campaign=academy-catan`. **Reports > Acquisition > Traffic acquisition**, change the table's first column to **Session campaign**, and click `academy-catan`. Add **Session manual ad content** as a secondary column to split it by email (`lesson-01` to `lesson-40`, `welcome`, `grad-...`, `skip-...`, `pause`).

**2. Level completion and drop-off.**

- Each level sequence's **Analytics** tab shows **Active** (still in it), **Completed** (finished the level), **Unsubscribed** (left from one of its emails), and **Didn't complete** (left for another reason). Completed divided by everyone who entered is the level's completion rate.
- **Drop-off:** in the same tab, compare sends on the first email with sends on the last. The email where sends fall or unsubscribes jump is the one to rewrite.
- **Where everyone is now:** in **Subscribers**, the count on each level tag is how many readers sit on that level today. `academy-catan-complete` counts graduates. `academy-catan-paused` shows who is on a break.
- **Skips:** the click counts on the skip links, per level, show where readers find it too easy. Lots of skips out of one level means it starts too slow.
- Each Visual Automation also shows how many subscribers sit at each step.

**3. Level check completions.** When a reader opens every answer in a lesson's Level check, the site sends a GA4 event named `level_check_complete` with a `lesson` parameter holding the lesson slug (for example `number-probability`).

- **Quick count:** **Reports > Engagement > Events**, then click `level_check_complete`.
- **By lesson:** first register the parameter once: **Admin > Data display > Custom definitions > Create custom dimension**, name **Lesson**, scope **Event**, event parameter `lesson`. It only collects from that day forward, so do it now. Then **Explore > Free form**: rows **Lesson**, values **Event count**, filter **Event name** exactly `level_check_complete`.
- Compare against lesson page views to get the share of readers who finish the check.

**4. Qualifier and game night signups from Academy readers.** Qualifier registration happens on CATAN's own event site, so The Ludarium cannot see it directly. Measure what we can:

- Clicks on qualifier links in alerts sent to the Academy segments (Kit link clicks, plus `utm_campaign` on any link to our own pages).
- Replies to "tell me when you play your first qualifier."
- When The Ludarium runs its own game nights or the practice league, their signup forms tag subscribers, and a segment of `academy-catan` plus that tag counts Academy readers who came.
- `academy-catan-league-interest` is the practice league's waitlist. Its size is the case for starting the league.

## Things to confirm in Kit while building

- **Pause holds, not skips** (test D3). Kit's docs say lifting an exclusion resumes sending but do not say outright that the email due during the pause is kept.
- **Segment on `state`** (E2). Kit's docs imply segments can filter on custom fields but do not show it.
- **Welcome timing.** The newsletter form showed that Kit runs form rules only after the confirm click. Confirm in test D1 that **Catan: Start** behaves the same and the welcome arrives only after confirming.
- **Time zone.** Kit's docs do not say whether the sequence send time uses the account's time zone or the reader's. Check the account time zone is Eastern; readers in other zones may get lessons at a different local hour.
