# The Ludarium Guild of Game Guides: writer's guide

The Guild is the Academy's skills program on how to teach a board game. Every other Academy course teaches one game; this one teaches the teacher. It grew out of the article [How to Teach a Board Game in Five Minutes](../../src/content/articles/how-to-teach-a-board-game.md) and Levi's course blueprint ("The Ludarium Guild of Game Guides: Program Blueprint", a Claude doc, October 26, 2026). Decisions are logged in `DECISIONS.md` (2026-10-26).

## Who it is for

The Ludarium reader who always wants to play more and keeps having to convince non-gamers to play: a partner, parents, in-laws, coworkers, kids, the friend who "doesn't really do board games." Non-gamers have a much lower tolerance for the pain of learning a game. If the reader learns to teach well, more people want to play, which is what the reader wants.

**The one score:** the Second Game. Did the newcomer say yes to playing again? Every lesson serves that score.

## Files

| File | What it is |
| --- | --- |
| `src/lib/guild.ts` | Program title, promise, modules, ranks, principles, helpers |
| `src/lib/guild-tools.ts` | The toolkit list (slugs, names, public or kit) |
| `src/content/guild-lessons/<slug>.md` | One file per lesson; the file name is the URL slug |
| `src/data/guild/*.json` | Toolkit data: the Gotcha Index, the Jargon Translator, the Scorecard |
| `src/pages/academy/guild/` | The program page, lesson pages, toolkit pages, the capstone, the certificate |
| `functions/api/guild-capstone.ts` | Emails a capstone submission to Levi for review |

URLs: `/academy/guild/`, `/academy/guild/<lesson-slug>/`, `/academy/guild/toolkit/<tool>/`, `/academy/guild/capstone/`.

## The method

Five moves, one module each, between a mindset module and a field guide:

1. **Pick** the game for this person and this evening.
2. **Prep** so you can teach without the rulebook, from a timed script.
3. **Teach** in five minutes: the theme in one sentence, how you win, one turn with real pieces, the one gotcha, then start playing.
4. **Play** the first game as the second half of the teach.
5. **Close** with a debrief and the next game on the calendar.

Five principles under every lesson: **Frame before facts. Just in time, not just in case. First win early. Protect dignity. End on a high.**

Four numbers the program holds students to: the teach takes under five minutes before the first move (games over an hour get a two-part teach); by the end of round two everyone knows the core rules; the newcomer makes a good move inside ten minutes; the newcomer is never out of the game before it ends.

Use these names exactly. Lessons refer back to them often, so a student hears the same words every time.

## Ranks and certification

- **Apprentice** after Modules 0 to 2.
- **Journeyman** after Modules 3 to 5.
- **Expert Game Guide** after Modules 6 and 7 and an accepted capstone: the student teaches one non-gamer, fills in the Self-Assessment and the newcomer's Feedback Card, and submits them. Levi reviews it and sends the certificate. The title is earned only when the newcomer agreed to a second game.

The first two ranks are milestones the student claims; only the last is reviewed. Do not promise a badge, a roster, or anything else that does not exist yet.

## Lesson frontmatter

```yaml
---
title: "The Second Game Is the Only Score"
description: "150 to 160 characters exactly, with the search phrase a reader would type."
module: 0
order: 1
emailSubject: "A short subject line a friend would write"
pubDate: 2026-10-26
draft: false
oneIdea: "The single idea of the lesson, one or two sentences."
drill: "One concrete thing to do before the next lesson."
nextTeaser: "One or two sentences about the next lesson."
tool: teach-script        # optional: the toolkit item the drill uses
check:                     # two or three self-check questions
  - question: "..."
    options: ["...", "...", "..."]
    answer: B
    explain: "One or two sentences."
games: [ticket-to-ride]    # On the Table slugs of games used as worked examples (only slugs other courses already use)
---
```

The body starts with an opening paragraph (no heading), then three to five `##` sections, one idea each. **600 to 900 words.** Do not repeat `oneIdea` or `drill` in the body; the page shows them in their own boxes. Every lesson has one **worked example** on a named, widely owned game, in its own section.

## Voice and hard rules

- Warm, smart, a little playful. Plain words, short sentences. Inviting to newcomers, credible to hobbyists, never gatekeepy. Speak to the reader as "you."
- **No em dashes or en dashes anywhere.** Use commas, colons, periods, or "to" for ranges.
- Never use: genuinely, honestly, straightforward, delve, elevate, game-changer, unlock, journey, ultimate, must-have, "dive in."
- **Never sneer at non-gamers.** They are the guests of honor. The problem is always the teach, never the learner.
- **No invented experience.** No "at our table," "when I taught," or any first-person story. Scenarios are written as "picture this" or about "you." Where Levi's own story would help, leave `<!-- AT OUR TABLE: what Levi should add, in one line -->`. Use at most one per lesson, and only where it adds something.
- **Ludarium events do not exist yet.** No Ludarium game nights or open lounge. Point to `/lounges/indianapolis/` only as "coming."
- **Rules accuracy.** Every rule you state about a named game must match its current rulebook. The Academy's game courses in `src/content/course-lessons/<game>/` and `src/content/courses/<game>.yaml` were checked against the official rules: use them as your source and link to them. When you cannot confirm a rule, phrase it generally or leave `<!-- VERIFY: what to check -->`.
- **Research claims.** Ideas from learning science or teaching (the curse of knowledge, cognitive load, worked examples, retrieval) can be named plainly. Name a book or study only if you are sure it says what you claim; no invented statistics.
- **Our own words.** No quotes from rulebooks, articles, or videos beyond one short phrase. Mention other teachers (Watch It Played, Shut Up and Sit Down) only as resources, never as sources of claims you cannot check.

## Linking

- Link the game's Academy course or teach sheet the first time you name a game that has one: `/academy/<slug>/` or `/academy/<slug>/teach-sheet/`. Course slugs: `ls src/content/courses/`. Catan's course is `/academy/catan/`.
- Link other Guild lessons by URL (`/academy/guild/<slug>/`) when a lesson builds on one.
- Link toolkit pages by URL (`/academy/guild/toolkit/<tool>/`).
- Link `/articles/how-to-teach-a-board-game/` from Module 3 once.

## The lesson plan

Each row: the outcome, what to teach, the worked example, and the drill. Write to it. Better ideas are welcome inside the lesson as long as the outcome holds.

### Module 0: The Second Game (Mindset)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | `the-second-game` | The Second Game Is the Only Score | Judge a teach by whether the newcomer would play again, not by rules accuracy | The newcomer decides during your teach whether games are for them. "Did they understand?" is the wrong question. Introduce the program: five moves, five principles, the ranks | A Catan night with perfect rules and no second game | Grade your last three teaches on the Second Game |
| 2 | `the-newcomers-ledger` | The Newcomer's Ledger | Name the costs a non-gamer pays while learning | Feeling lost, feeling stupid, the rules dump, jargon, public correction, the blowout, your impatience. The fun has to clear the cost | A twenty-minute Wingspan rules dump, told from the in-law's chair | Write the three things your most reluctant friend dislikes about learning games |
| 3 | `host-not-referee` | You Are the Host, Not the Referee | Spot your own curse of knowledge | Once you know a game you cannot imagine not knowing it, so you over-explain rules and under-explain the point. The job is to hand over confidence | Ticket to Ride explained in sixty seconds into a voice memo | Record yourself explaining a game in one minute and count the hobby words |

### Module 1: Pick (Choose the game)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 4 | `match-the-game-to-the-person` | Match the Game to the Person | Build a three-game shortlist for one named person | Three questions: what do they already enjoy, how much time and attention tonight, how many people. "Gateway game" lists are for strangers | The crossword lover gets Codenames, the poker player gets a bluffing game, the puzzle person gets Azul | Shortlist three games for one person you want to play with more |
| 5 | `the-teachability-scorecard` | The Teachability Scorecard | Score any game on how teachable it is, not how light it is | One core action a turn, few exceptions, visible progress, interaction that is not mean, forgiving decisions, under 45 minutes, good at your player count. Tool: `teachability-scorecard` | Ticket to Ride against Catan | Score five games you own |
| 6 | `build-a-game-ladder` | Build a Ladder, Not a List | Sequence games for one person over weeks | Each rung adds one new idea. Rung one is a short game. Never jump two rungs. Tool: `game-ladder` | A ladder of Flip 7, then Ticket to Ride, then Carcassonne, then Wingspan | Write a four-rung ladder for a partner or a parent |
| 7 | `read-the-room` | Read the Room on the Night | Pick a plan A, B and C before guests arrive | Energy, drinks, kids, late arrivals and a late start all change the pick. Plan B is a fifteen-minute game; plan C is no game | The ninety-minute game that should have been a twenty-minute one | Plan A, B and C for your next gathering |

### Module 2: Prep (Before they arrive)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 8 | `the-solo-run` | The Solo Run | Know a game well enough to teach it without the book | Read once, set up, play three turns alone, watch one how-to-play video, write down where you stumbled: those are where your friends will stumble | An Azul solo run: the wall pattern and the floor line are the stumbles | Do a solo run and list your three stumbles |
| 9 | `write-your-teach-script` | Write the Five-Minute Teach Script | Write and time a one-page script | The script: theme sentence, win sentence, the turn, the gotcha, what to skip, the first-round plan. Rehearse aloud with a timer and cut until it fits. Tool: `teach-script` | A finished script for Carcassonne, with fields left out | Write and time a script for one game |
| 10 | `set-the-table` | Set the Table Before They Arrive | Run the pre-flight checklist | Setup done, pieces sorted by player, references visible, rulebook open to the summary, expansions and variants back in the box, the newcomer seated beside you. Tool: `pre-flight-checklist` | Ticket to Ride with destination tickets dealt before anyone sits | Use the checklist once and note what you forgot |
| 11 | `translate-the-jargon` | Translate the Jargon | Replace every hobby word with a plain one | "Worker placement" becomes "put a piece on a spot to claim it," "drafting" becomes "pick one, pass the rest," "engine" becomes "stuff that gets you more stuff." Never compare to a game they have not played. Tool: `jargon-translator` | Wingspan's resources and powers in plain words | Translate the five hobby words in your favorite game |

### Module 3: The Five-Minute Teach (The teach)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 12 | `theme-in-one-sentence` | The Theme in One Sentence | Open with a hook that says who you are and what you want | A story makes rules stick. The sentence has a role, a goal, and a little fun. It is the newcomer's first reason to care | Carcassonne: building a medieval landscape tile by tile and competing for its cities, roads and fields | Write hooks for five games and test one on someone |
| 13 | `how-you-win` | How You Win | State the end and the win in one breath | "The game ends when X. The winner has the most Y." Then the ways to score, biggest first. Every later rule now has a reason (Frame before facts) | Ticket to Ride: routes score, tickets score or cost you, the longest route bonus | Win sentences for the same five games |
| 14 | `one-turn-with-real-pieces` | One Turn With Real Pieces | Show a turn, never describe one | "On your turn you do one of these things," pointing and moving pieces. Say "you," not "a player." Hands busy, eyes on the table | An Azul turn walked through with tiles in hand | Record a turn demo and count the abstractions |
| 15 | `the-one-gotcha` | The One Gotcha | Name the single rule that surprises people, and nothing else | Every game has one. Say it now and again when it first happens. The rest waits. Tool: `gotcha-index` | Ticket to Ride's unfinished tickets, Azul's floor line, Catan's seven | Name the gotcha for every game you own |
| 16 | `the-rolling-teach` | Start Playing: The Rolling Teach | Hold back the rest of the rules until they happen | Rare rules arrive when they occur. Park early edge-case questions kindly. By the end of round two everyone knows the core (Just in time, not just in case). When a rolling teach is the wrong choice | Catan's development cards taught the first time someone buys one | List the rules you will hold back for one game |
| 17 | `delivery` | Delivery | Teach with pace, warmth, and checks | Short sentences and pauses. "What questions do you have?" rather than "Any questions?" Never read the book aloud. No strategy tips. Teach the newcomers; the gamers can wait. Tool: `feedback-card` | The same teach given twice: once to the room, once to the quietest person in it | Teach a friend and ask them the feedback card questions |

### Module 4: Play (The first game)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 18 | `the-open-first-round` | The Open First Round | Run a practice round nobody can lose | Hands face up, thinking aloud welcome, "what should I do?" is a good question. Offer a fresh start after the round (Protect dignity) | Codenames: a practice round where everyone talks through the first clue | Run one open round and note who asked what |
| 19 | `training-wheels` | Training Wheels | Set up an early good move | Offer two decent options instead of the answer, let them pick, and name the move as good when it pays off (First win early) | Azul: "the blue row or the red row, both work" | Plan the first-ten-minutes move for one game |
| 20 | `mistakes-yours-and-theirs` | Mistakes, Yours and Theirs | Fix rules errors without shaming anyone | Let it ride if play has moved on. Admit your own error fast. Never make a newcomer take back a move in front of the table. "Tonight we are playing it this way" | The robber placed wrong in Catan two turns ago | Write your let-it-ride policy for one game |
| 21 | `no-blowouts` | No Blowouts | Play hard enough to be fun, never hard enough to crush | Do not throw the game; they can tell. Narrate your own moves so they learn from them. Choose games with close scores. In cooperative games, ask rather than tell | Wingspan, won by ninety and won by nine | Compare your last three scores with the newcomer's |
| 22 | `reading-the-table` | Reading the Table Mid-Game | Notice when someone checks out, and act | Signs: the phone, silence, "whatever you think." Moves: shorten, call it at a natural stop, switch to a short game. A game ended early beats a game finished badly (End on a high) | Calling the last round of Ticket to Ride early | Decide your "call it" signal before the night |

### Module 5: Close (After the game)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 23 | `the-debrief` | The Debrief | Ask what they liked, not whether they liked it | "Favorite moment?" and "What would you try next time?" plant the next game. Thank them for playing, not for being a good sport | The in-law who liked the puzzle part, and gets Azul next | Script three debrief questions |
| 24 | `the-next-ask` | The Next Ask | Leave with a date and a game | Propose the next rung of the ladder before anyone stands up. Make it specific | "Next time you pick the birds": Wingspan promised after Carcassonne | Script your close for one person |
| 25 | `keep-the-streak` | Keep the Streak | Turn one night into a habit | Same night, same people, one new game a month. Let the newcomer teach a game to someone else, which makes them a player for good | The friend who teaches Codenames to her office | Put the next three dates on a calendar |

### Module 6: The Field Guide (Special situations)

Each lesson stands alone: students read the one they need the night they need it.

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 26 | `a-table-of-newcomers` | A Full Table of Newcomers | Teach when nobody else knows the game | Play too, slowly. Teach to the fastest learner and let them help. Start with a cooperative or party game | Codenames for five newcomers | Plan a newcomers-only night |
| 27 | `mixed-tables` | Mixed Tables | Keep the gamers from teaching over you | One voice teaches. Gamers keep strategy talk until the game ends. Seat newcomers beside gamers who will help, not compete | Two gamers arguing a rule in front of a newcomer | Brief your gamers before the night |
| 28 | `teaching-kids` | Teaching Kids | Teach by age band | Under 8: shorten, let them move the pieces, cooperative games. 8 to 12: full rules, open hands. Teens: treat them as adults | A first game with a six-year-old; Ticket to Ride with a ten-year-old | Pick a game for each child you play with |
| 29 | `cooperative-games` | Cooperative Games | Stop quarterbacking before it starts | One voice a turn: the active player decides; others may ask questions. The teacher holds the rules, not the plan | Pandemic with a "current player speaks first" rule | Run one cooperative game with the one-voice rule |
| 30 | `party-games` | Party and Word Games | Teach by playing, not explaining | Sixty seconds of rules, then a demo round that does not count. The first real round is the teach | Codenames: show one clue and its guesses, then start | Teach a party game in under a minute |
| 31 | `heavier-games` | Heavier Games | Teach a long game in two sittings | First sitting: the core rules and four turns, then stop and restart. Second sitting: the rest. Or play it solo first | Wingspan's end-of-round goals left for later | Write the core rule set for one heavy game |
| 32 | `learning-together` | When You Do Not Know It Either | Learn a game together without the rules dump | One person reads one section ahead. Watch a short video together. Play the first round from the summary | A new game opened on a holiday morning | Try the learn-together steps once |

### Module 7: The Capstone (Certification)

| # | Slug | Title | Outcome | Teach this | Worked example | Drill |
| --- | --- | --- | --- | --- | --- | --- |
| 33 | `the-teach-library` | The Teach Library | Teach a gateway game from a finished script | How to use and edit a teach sheet, and how to write your own from the script. Tool: `teach-library` | Teaching Ticket to Ride from its Ludarium teach sheet | Teach one game from a sheet, then edit the sheet |
| 34 | `score-your-teach` | Score Your Teach | Score your own teach on ten lines | Hook, goal, turn demo, gotcha, holding back, pace, checks, open round, blowout control, close. One to five each. Tool: `self-assessment` | A scored Ticket to Ride teach | Score yourself after your next teach |
| 35 | `the-capstone` | The Capstone: Earn the Title | Teach one non-gamer and report back | Teach a game to one person who does not play. Fill in the Self-Assessment and the Feedback Card and submit both. The title is earned when they agree to play again. Tool: `capstone` | Walking through a submission | Submit the capstone |

## Before you hand in

Run `node scripts/check-guild.mjs`. Zero errors is required. It checks frontmatter, word counts, dashes, banned words, orders, and links to other Guild lessons and tools.
