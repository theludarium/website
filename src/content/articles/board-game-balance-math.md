---
title: "Board Game Balance Math: Distribution, Variance, Feel"
description: "Board game balance math for designers who are not mathematicians. How card distribution, dice variance, and point curves shape whether a game feels fair."
pubDate: 2026-10-20
category: Game Design
tags: ["board game balance math", "game balance for designers", "probability in board games", "card distribution design", "dice variance board games", "balancing a card game", "Tabletop game design"]
draft: false
---
Board game balance math sounds like something you need a statistics degree for. You do not. Most of the math that matters in a card or dice game is counting, a little probability, and a clear sense of what you want the player to feel. Designers who skip it build games that seem fine for ten plays and then collapse when someone finds the one card that always wins.

This article covers the three ideas that do most of the work: how cards are distributed, how much variance a game has, and how both of those turn into what players call fairness.

## What does "balanced" actually mean?

Players use the word to mean several different things, and a designer should know which one they are chasing.

**Option balance.** No single card, strategy, or faction is strictly better than the others. If a game has five strategies and one wins 60 percent of the time, it is unbalanced in this sense, and experienced players will find it.

**Positional balance.** Going first, or sitting in a particular seat, does not confer a large advantage. Many games give later players a small bonus for exactly this reason.

**Outcome balance.** Final scores are close more often than not. A game can be perfectly fair in options and still produce blowouts, which players also call unbalanced.

**Felt balance.** The player who lost believes they could have won with better decisions. This one is about perception, and it depends on the other three but is not the same as any of them.

Most designers aim for the first two and tune the third. The fourth is the real target, and it is where variance comes in.

## How should cards be distributed?

A deck is a probability distribution you can hold. Every choice about how many of each card to include is a choice about what players will see and when.

A few principles.

**Count what the player experiences, not what is in the box.** A 60-card deck where players see 15 cards per game is a 15-card experience. The rare card that appears in one game out of four is not part of most players' mental model, which can be a feature or a bug.

**Common cards set the baseline; rare cards set the ceiling.** In most well-tuned card games, the majority of the deck is solid but unexciting, and a small minority is powerful. Players remember the powerful cards, which creates excitement. But if the powerful cards are too strong or too frequent, the game becomes a lottery for who draws them.

**Match frequency to impact.** A rough rule: the stronger a card is, the fewer copies belong in the deck. A card that can swing the game should appear once. A card that is a reliable workhorse can appear six times.

**Watch the tails.** The worst draws matter as much as the best. If it is possible to draw five dead cards in a row, someone will, and they will not enjoy it. Many designers put a floor on bad luck by guaranteeing a minimum of useful cards, or by letting players redraw.

Dominion offers a clear example. The ten copies of each Kingdom card mean a strategy built around one card is possible but contested. Province cards are limited to eight in a two-player game, which caps the maximum score and creates the end-game race. Both numbers were chosen, and both shape every game.

## How much variance is right?

Variance is the spread of outcomes around what a player can expect. A game with no variance is chess. A game with maximum variance is a coin flip. Almost every tabletop game sits between them, and where it sits is a design decision.

Here is a simple way to think about dice, since they are the clearest case.

| Roll | Range | Shape of outcomes | What it feels like |
|---|---|---|---|
| 1d6 | 1 to 6 | Flat; every result equally likely | Swingy; a 1 is as common as a 6 |
| 2d6 | 2 to 12 | Peaked at 7; extremes rare | Predictable middle with occasional drama |
| 3d6 | 3 to 18 | Strongly peaked at 10 or 11 | Reliable; extremes feel like events |
| 1d20 | 1 to 20 | Flat and wide | Highly swingy; built for drama |
| 2d6, keep highest | 1 to 6 | Skewed toward high results | Generous; failure feels rare |

[Catan](https://link.amazon/B0h8BDGR2) rolls two six-sided dice for resource production. A 7 comes up about one time in six, and a 2 or 12 about one in thirty-six. The settlement on an 8 produces far more often than one on a 3. Players learn this shape intuitively, which is why the numbered tiles have dots on them to show it. The game would be unrecognizable with a single twelve-sided die.

[Dungeons & Dragons](https://www.amazon.com/dp/0786969687?tag=cubecommonw0a-20) uses a d20 for most checks precisely because it is swingy. A first-level character can hit a dragon, and a veteran can miss a goblin. That drama is the point. In a strategy game it would be infuriating.

The rule of thumb: the more decisions a player makes between random events, the more variance the game can carry. A game with twenty decisions and one die roll feels fair. A game with one decision and twenty die rolls feels like a slot machine. Our article on [luck versus skill](/articles/luck-vs-skill-board-games/) takes the idea further.

*If this is useful, the newsletter sends more like it.*

## How do you balance point values?

Most card games assign points or costs to cards, and the relationship between cost and effect is where option balance lives.

Start with a unit. Pick the simplest effect in the game, say "gain one coin," and decide what it costs. Everything else is priced relative to that. A card that gains two coins should cost roughly twice as much, minus a little because it uses one card slot instead of two.

Then add adjustments.

- **Flexibility costs more.** A card that gives you a choice of two effects is worth more than either effect alone.
- **Timing costs more.** An effect you can use whenever you like is worth more than one tied to a phase.
- **Conditions cost less.** An effect that only works if you control three regions should be stronger than an unconditional one, because sometimes it does nothing.
- **Tempo matters.** An effect now is worth more than the same effect later, and the exchange rate depends on how long the game is.

None of this produces exact numbers. It produces a first draft that is close enough to test, and testing does the rest. Keep a spreadsheet of every card with its cost, effect, and win rate when drawn, and the outliers will show themselves after thirty plays.

## What is the role of catch-up and rubber-banding?

Even a perfectly balanced game can produce runaways, because small early advantages compound. Designers add mechanisms that pull the trailing player back, and the math of these is delicate. Too weak and they do nothing. Too strong and leading becomes a disadvantage, which players notice and resent.

[Ticket to Ride](https://link.amazon/B0jh8RB7f) has a mild one: long routes score disproportionately, so a player who fell behind on short routes can recover with a bold play. [Power Grid](https://www.amazon.com/dp/B07HM7WZT9?tag=cubecommonw0a-20) has a strong one: turn order is set by player standing, and the leader buys resources last and pays more. Each is tuned to its game's length and swing. The broader toolkit is covered in our piece on [catch-up mechanics](/articles/catch-up-mechanics-board-games/).

## How do you measure balance in testing?

Numbers beat impressions. Track these across plays.

1. **Win rate by strategy, faction, or starting position.** Any option that keeps winning well beyond its fair share in a multiplayer game deserves a look; the threshold is yours to set, but set it before you start counting.
2. **Score spread.** The gap between first and last. If it keeps growing across the game, you have a snowball.
3. **Card pick rates.** Which cards are taken first and which are never taken. Both extremes signal mispriced cards.
4. **Game length by player count.** A game that takes 40 minutes with two and 110 with four is not the same game.
5. **"I had no chance" moments.** Ask after every test. If the answer is yes more than occasionally, variance is too high or catch-up is too weak.

Thirty plays is a reasonable minimum before trusting any of these. Fewer than ten and you are reading noise.

## Why does feel beat math in the end?

A game can be mathematically fair and feel unfair, and the players are not wrong. If the losing player cannot see what they could have done differently, the math did not help them. If the winning player felt lucky rather than clever, the math did not help them either.

So the math is in service of a feeling: that this table, on this evening, had a contest worth having, and everyone walked away thinking about what they would do next time. That feeling is what brings people back. The game is the reason. The people are the point.

## FAQ

### How do you balance a card game?

Price every card relative to a base unit, adjust for flexibility, timing, and conditions, then track win rates and pick rates across at least thirty plays and fix the outliers.

### Why does Catan use two dice instead of one?

Two six-sided dice produce a bell-shaped distribution where 6 and 8 are common and 2 and 12 are rare. That shape makes placement decisions meaningful. One die would make every number equally likely.

### What is variance in board game design?

Variance is how far outcomes can swing from what a player expects. High variance means dramatic, luck-driven results; low variance means skill decides. Most games sit somewhere in between on purpose.

### Is a 50 percent win rate the goal?

For each strategy or faction in a two-player game, roughly yes. In multiplayer games, each option should win about one game in N, where N is the player count, within a modest margin.

## Count, then play

If you are tuning a prototype, numbers from people who have never seen it beat numbers from your regular group. The Ludarium plans open playtest nights for designers once its Indianapolis lounge opens. For new articles on design, hosting, and play, with new pieces reaching subscribers first, subscribe to the newsletter.
