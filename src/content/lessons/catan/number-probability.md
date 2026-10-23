---
title: "The Dots Matter: Catan Number Probability in Plain English"
description: "What the dots on Catan number discs mean, why 6 and 8 roll most often, and how to total pips so the spots you settle keep paying you all game long, every game."
course: catan
level: 1
levelName: Homesteader
order: 6
emailSubject: "Those little dots are the whole game"
pubDate: 2026-10-22
draft: false
oneIdea: "The dots under each number count how many of the 36 dice combinations roll it, so adding them up tells you how often a spot will pay you."
levelCheck:
  - question: "How many dots sit under the 9 on a number disc?"
    options: ["3", "5", "4", "2"]
    answer: "C"
    explain: "Two dice can make 9 four ways (3 and 6, 4 and 5, 5 and 4, 6 and 3), so the 9 has 4 dots. The 5 has 4 too, since it sits the same distance from 7."
  - question: "A corner touches hexes numbered 5, 8, and 10. How many pips is that?"
    options: ["12", "11", "13"]
    answer: "A"
    explain: "The 5 has 4 dots, the 8 has 5, and the 10 has 3. That adds up to 12, a strong spot that pays about 12 cards every 36 rolls."
  - question: "Nobody has rolled an 8 in ten turns. What is true about the next roll?"
    options: ["The 8 is due, so it is more likely now", "The 8 is exactly as likely as ever: 5 chances in 36", "The 8 is less likely now, because the dice are running cold"]
    answer: "B"
    explain: "Dice have no memory. Every roll starts fresh, so the 8 always has the same 5 in 36 chance, no matter what happened before."
nextTeaser: "Next, you put the dots to work. Lesson 7 gives you a five-point checklist for your first two settlements, so you can score an opening before you place it."
---
Look under any number disc and you will see a row of small dots. Most new players never notice them. Strong players read them before they read anything else on the board. This lesson explains what the dots mean, why they work, and how to use them to judge any spot in a few seconds.

You do not need to like math for this. You only need to count to 13.

## Why do two dice favor some numbers?

One die is fair. Each face comes up 1 time in 6. Add two dice together, though, and the totals stop being fair.

Picture one red die and one white die. Each can land 6 ways, so together they can land 6 times 6, or **36 ways**. Now count how many of those 36 make each total:

- **2** needs a 1 on both dice. That is the only way. 1 in 36.
- **3** can be red 1 and white 2, or red 2 and white 1. 2 ways.
- **7** can be 1 and 6, 2 and 5, 3 and 4, and the reverse of each. 6 ways, the most of any total.

The middle totals have more ways to happen, so they come up more often. The totals at the edges, 2 and 12, almost never do.

## What do the dots on a number disc mean?

Each dot is one of those 36 ways. That is all. Players call the dots **pips**.

<figure class="hexmap pipchart">
<svg viewBox="0 0 524 260" role="img" aria-labelledby="pips-title">
<title id="pips-title">Dots per number: 2 and 12 have 1, 3 and 11 have 2, 4 and 10 have 3, 5 and 9 have 4, 6 and 8 have 5. The 7 has no disc; it rolls 6 ways out of 36 and moves the robber.</title>
<circle class="pipchart__dot" cx="42" cy="188" r="7"/>
<text class="pipchart__num" x="42" y="222">2</text>
<text class="pipchart__count" x="42" y="242">1/36</text>
<circle class="pipchart__dot" cx="86" cy="188" r="7"/>
<circle class="pipchart__dot" cx="86" cy="171" r="7"/>
<text class="pipchart__num" x="86" y="222">3</text>
<text class="pipchart__count" x="86" y="242">2/36</text>
<circle class="pipchart__dot" cx="130" cy="188" r="7"/>
<circle class="pipchart__dot" cx="130" cy="171" r="7"/>
<circle class="pipchart__dot" cx="130" cy="154" r="7"/>
<text class="pipchart__num" x="130" y="222">4</text>
<text class="pipchart__count" x="130" y="242">3/36</text>
<circle class="pipchart__dot" cx="174" cy="188" r="7"/>
<circle class="pipchart__dot" cx="174" cy="171" r="7"/>
<circle class="pipchart__dot" cx="174" cy="154" r="7"/>
<circle class="pipchart__dot" cx="174" cy="137" r="7"/>
<text class="pipchart__num" x="174" y="222">5</text>
<text class="pipchart__count" x="174" y="242">4/36</text>
<circle class="pipchart__dot pipchart__dot--hot" cx="218" cy="188" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="218" cy="171" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="218" cy="154" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="218" cy="137" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="218" cy="120" r="7"/>
<text class="pipchart__num pipchart__num--hot" x="218" y="222">6</text>
<text class="pipchart__count" x="218" y="242">5/36</text>
<circle class="pipchart__dot pipchart__dot--seven" cx="262" cy="188" r="7"/>
<circle class="pipchart__dot pipchart__dot--seven" cx="262" cy="171" r="7"/>
<circle class="pipchart__dot pipchart__dot--seven" cx="262" cy="154" r="7"/>
<circle class="pipchart__dot pipchart__dot--seven" cx="262" cy="137" r="7"/>
<circle class="pipchart__dot pipchart__dot--seven" cx="262" cy="120" r="7"/>
<circle class="pipchart__dot pipchart__dot--seven" cx="262" cy="103" r="7"/>
<text class="pipchart__num pipchart__num--seven" x="262" y="222">7</text>
<text class="pipchart__count" x="262" y="242">robber</text>
<circle class="pipchart__dot pipchart__dot--hot" cx="306" cy="188" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="306" cy="171" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="306" cy="154" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="306" cy="137" r="7"/>
<circle class="pipchart__dot pipchart__dot--hot" cx="306" cy="120" r="7"/>
<text class="pipchart__num pipchart__num--hot" x="306" y="222">8</text>
<text class="pipchart__count" x="306" y="242">5/36</text>
<circle class="pipchart__dot" cx="350" cy="188" r="7"/>
<circle class="pipchart__dot" cx="350" cy="171" r="7"/>
<circle class="pipchart__dot" cx="350" cy="154" r="7"/>
<circle class="pipchart__dot" cx="350" cy="137" r="7"/>
<text class="pipchart__num" x="350" y="222">9</text>
<text class="pipchart__count" x="350" y="242">4/36</text>
<circle class="pipchart__dot" cx="394" cy="188" r="7"/>
<circle class="pipchart__dot" cx="394" cy="171" r="7"/>
<circle class="pipchart__dot" cx="394" cy="154" r="7"/>
<text class="pipchart__num" x="394" y="222">10</text>
<text class="pipchart__count" x="394" y="242">3/36</text>
<circle class="pipchart__dot" cx="438" cy="188" r="7"/>
<circle class="pipchart__dot" cx="438" cy="171" r="7"/>
<text class="pipchart__num" x="438" y="222">11</text>
<text class="pipchart__count" x="438" y="242">2/36</text>
<circle class="pipchart__dot" cx="482" cy="188" r="7"/>
<text class="pipchart__num" x="482" y="222">12</text>
<text class="pipchart__count" x="482" y="242">1/36</text>
<line class="pipchart__base" x1="20" y1="200" x2="504" y2="200"/>
</svg>
<figcaption>Each dot is one of the 36 ways two dice can land. A 6 or 8 rolls 5 ways out of 36; a 2 or 12, just 1. The 7 has no disc: it rolls 6 ways and brings the robber.</figcaption>
</figure>

Here is the whole pattern in one table.

| Numbers | Dots on each | Rolls out of 36, on average |
| --- | --- | --- |
| 2 and 12 | 1 | 1 |
| 3 and 11 | 2 | 2 |
| 4 and 10 | 3 | 3 |
| 5 and 9 | 4 | 4 |
| 6 and 8 | 5 | 5 |
| 7 | 6 (no disc) | 6 |

Notice the last column. The number of dots is also the number of times that total comes up, on average, in 36 rolls. So the dots are not a vague hint. They are a count you can use.

That is why a 6 pays about five times as often as a 2. It has 5 dots to the 2's single dot.

There is an easy way to remember it. The 7 has 6 ways. Every step away from 7 loses one. So 6 and 8 have 5, then 5 and 9 have 4, and so on down to 2 and 12 with 1 each. You will never need the table again.

## How do you total the pips on a spot?

A settlement sits on a corner, and a good inland corner touches three hexes. Add up the dots on those three hexes. That total is the spot's **pip count**.

Say a corner touches a 6, a 9, and an 11. That is 5 plus 4 plus 2, or **11 pips**. On average, a settlement there collects about 11 cards every 36 rolls. Upgrade it to a city and that becomes about 22.

Now compare a corner touching a 2, a 12, and a 3. That is 1 plus 1 plus 2, or **4 pips**. Same cost to build, about a third of the income.

A few things count as zero:

- **The desert.** No disc, no dots, no cards.
- **The sea.** Coastal corners touch only one or two land hexes, so their pip counts run lower. Ports can make up for that, which Lesson 9 covers.

## What counts as a good pip count?

The whole board holds 58 pips spread over 18 numbered hexes, a little over 3 per hex. So an average three-hex corner lands just under 10. Use that as your baseline.

| Pips on one settlement | What it usually means |
| --- | --- |
| 13 or more | Excellent. Often gone in the first few picks. |
| 10 to 12 | Strong. A solid place to start. |
| 7 to 9 | Fair. Fine if it brings a resource you need. |
| 6 or fewer | Weak, unless it gives you a port or a scarce resource. |

This is a rough guide, not a law. A 9-pip spot with the only good brick on the board can beat a 12-pip spot full of wool. Lessons 7 and 8 show you how to weigh that.

## Do the dots tell you what will happen this game?

No. They tell you what tends to happen over many rolls. One game is only a few dozen rolls, and a few dozen rolls can be streaky. A 4 can come up five times while an 8 hides all night. Everyone has a story about that game.

Two things to keep in mind:

- **Dice have no memory.** If the 8 has not rolled in a while, it is not "due." It still has exactly 5 chances in 36 on the next roll.
- **Pips are your best bet, not a promise.** Bet on them anyway. Over a season of games, the player on the high-pip spots collects more cards. That is the whole reason to count.

One way to soften the streaks is to spread your income across several different numbers, so one cold number does not freeze you. That is part of the checklist in Lesson 7.

## Why does the 7 matter if it has no disc?

The 7 is the most common roll: 6 ways out of 36, or about 1 roll in 6. In a four-player game, that is roughly once every trip around the table. Every one of those rolls pays nobody, and it sends the robber out instead, as you saw in [Lesson 4](/academy/catan/robber-and-development-cards/).

So in every 36 rolls, about 6 produce nothing at all. That is why holding a big hand is risky, and it is the subject of Lesson 10.

The good news sits right next to it. The 6 and the 8 together make up 10 of the 36 combinations, more than a quarter of all rolls. That is why players fight over them in setup.

## How does this change the way you play?

Once you see the dots, a few habits follow on their own.

- **Read pips before pictures.** A pretty spot with three resources means little if they sit on 2, 3, and 12.
- **Upgrade your best corner first.** A city doubles what a corner collects, so put your first city where the pips are highest.
- **Aim the robber at pips.** When you move the robber, a 6 or 8 hex that pays the leader hurts them most.
- **Count pips per resource.** Add up the dots on all the hills, then all the mountains, and so on. The resource with the fewest pips will be the hardest to find. Lesson 8 builds on this.

For more on how this fits a whole game plan, see our guide on [how to win at Catan](/articles/how-to-win-at-catan/).

## Try it this week

Your drill is to total the pips on every spot you consider. Here is how to make it stick.

1. **Learn the ladder.** Say it out loud from 2 to 12: 1, 2, 3, 4, 5, then 6 for the 7, then 5, 4, 3, 2, 1. Do it each morning until it is automatic.
2. **Count before you place.** In setup, total the pips on every corner you are thinking about. Do it in your head, or quietly on a scrap of paper.
3. **Write down your top three.** Before you place, note your best three spots and their pip counts. Then place on one and see what others took.
4. **Total the whole table.** After setup, add up each player's pips across both settlements. Write the four numbers down.
5. **Check it at the end.** When the game ends, compare the pip totals with the final scores. Did the high-pip player win? If not, write one reason why.
