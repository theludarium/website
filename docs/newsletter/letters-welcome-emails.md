# Ludarium Letters: welcome sequences

Four Kit sequences, one per letter, three emails each. A reader who joins one letter gets that letter's welcome only. Someone who joins two letters gets two welcomes, which is fine: they asked for both.

Why three emails: email 1 says what the letter is and gives the first thing to read. Email 2 gives one idea worth the click. Email 3 sets the weekly expectation, asks one question, and names the other letters once. Nothing sells. Each email has one ask: read this, try this, or reply.

Written 2026-10-28. Companion to `KIT-SETUP.md` (forms, tags, segments) and `emails.md` (the confirmation email and the waitlist welcome, which stay as they are).

## House rules for these emails

- Plain words, short sentences, no em dashes. Sent as Levi, replies to hello@theludarium.com.
- Greeting: `Hi {{ subscriber.first_name | default: "there" }},` (Kit's Liquid tag; the site's forms collect only an email, so most readers see "there").
- Every link below is a live page as of 2026-10-28. Draft articles are not linked.
- Send days (decided 2026-10-28): Tabletop on Tuesday, Cube on Wednesday, Industry on Thursday, General on Friday. General recaps the week's three letters, so it goes last. The emails name these days; change them here and in `/newsletter/` together.
- The "other letters" paragraph in each email 3 points at theludarium.com/newsletter/, which has a signup form for each letter (anchors `#general`, `#cube`, `#tabletop`, `#industry`).
- Kit timing: email 1 "as soon as possible", email 2 "after 2 days", email 3 "after 3 days" (day 5). Publish every email and set the sequence to Active, or nothing sends.
- To replace an email's body in Kit's editor, select all twice (the first select-all only takes the current paragraph) before deleting or pasting.

## Kit setup

| Letter | Sequence | Rule |
| --- | --- | --- |
| General | **Welcome - General**: the existing sequence "Welcome" (2939465), renamed. Replace its one email with email 1 below and add emails 2 and 3. | Rule 5660412 (form Ludarium Letters - General, formerly "Ludarium Letters") already subscribes readers to it. Add the action **Add tag: `LL: General`** to that rule. |
| Cube | **Welcome - Cube**, new | New rule: trigger **Subscribes to a form: Ludarium Letters - Cube**; actions **Add tag: `LL: Cube`** and **Subscribe to sequence: Welcome - Cube**. |
| Tabletop | **Welcome - Tabletop**, new | Same shape, with the Tabletop form, `LL: Tabletop` and Welcome - Tabletop. |
| Industry | **Welcome - Industry**, new | Same shape, with the Industry form, `LL: Industry` and Welcome - Industry. |

Kit runs form rules only after the reader confirms, so email 1 lands right after the confirm click. The weekly letters themselves are broadcasts to each letter's segment (LL - General, LL - Cube, LL - Tabletop, LL - Industry), never to All subscribers.

---

## General

### Email 1, day 0: Welcome to the table

**Subject:** Welcome to the table
**A/B alternate:** You're in. Here is what to read first.

**Preview text:** What this letter is, what to read first, and what to play tonight.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to The Ludarium. You just joined a group of people who think the best nights happen around a table.
>
> Here is the idea behind everything we make: **the game is the reason. The people are the point.** We call it togethering. A game gives a room of people something to do together, and that is how strangers become regulars and regulars become friends.
>
> **What you signed up for**
>
> This is Ludarium Letters, the General edition: one email a week with the best of what we wrote, one game worth trying, one idea for your next game night, and news on what we are building. We also write three smaller letters, on Cube, on tabletop games, and on the business of the industry. You are not on those unless you ask. More on them in a few days.
>
> **Start here**
>
> - [10 gateway board games](https://theludarium.com/articles/gateway-board-games/), if you want the right first game for your people.
> - [Game night lineup: opener, main event, closer](https://theludarium.com/articles/game-night-lineup/), if you are hosting soon.
> - [How to start a board game group that lasts](https://theludarium.com/articles/how-to-start-a-game-night-group/), if you want a standing night.
> - [Why we needed a new word](https://theludarium.com/articles/togethering-meaning/), if you want the why.
>
> **Play something tonight**
>
> - [Game Night Madness](https://theludarium.com/game-night-madness/): can't decide what to play? Put your shelf in a bracket and let the table vote.
> - [The RPG Demo Library](https://theludarium.com/rpg-demo-library/): try a tabletop roleplaying game in 20 minutes, free, in your browser.
> - [The Card Catalogue](https://theludarium.com/card-catalogue/): find games by how they feel, and get picks for your whole group.
>
> **What's coming**
>
> We're building The Ludarium Game Lounge in Indianapolis: a membership space where game groups of every kind meet, play, and belong. You'll hear about it here first.
>
> One favor: reply and tell me what you play, and who you play with. I read every reply, and it shapes what we write next.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 2, day 2: The cheapest health habit nobody prescribes

**Subject:** The cheapest health habit nobody prescribes
**A/B alternate:** Why your doctor should ask if you play games

**Preview text:** What the research says about play, connection, and living longer.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> The first email was the idea. This one is the evidence.
>
> The Harvard Study of Adult Development has followed the same families since 1938, and its directors keep landing on the same finding: the quality of your relationships in midlife predicts your health in old age better than your cholesterol does. The U.S. Surgeon General's 2023 advisory on loneliness put a number on the other side: lacking social connection carries a mortality risk it compared to smoking up to 15 cigarettes a day.
>
> Here is the part that matters for this letter. Relationships do not maintain themselves. They need repeated, low-stakes contact. A standing game of Wingspan every other Thursday is exactly that. You do not plan a dinner party or come up with conversation. The game carries the evening, and the friendship accrues on the side.
>
> The article walks through the research in plain language, with the hedges where they belong.
>
> Read: [Benefits of play for adults: the case for playing](https://theludarium.com/articles/benefits-of-play-for-adults/)
>
> One small ask: think of one person you have not sat across a table from in six months. Hold that name until the next email.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 3, day 5: One name, one text, one night

**Subject:** One name, one text, one night
**A/B alternate:** What the General letter looks like from here

**Preview text:** The one rule that keeps a game night alive, plus the three other letters we write.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Last time I asked you to hold one name. Here is what to do with it.
>
> Most game nights die by month three. The first one is great, the second is fine, the third gets rescheduled, and nobody sends the fourth invite. The fix is a standing time: second Tuesday, 7 p.m., same place, whether four people show or two. No poll, no group text. The night exists, and people fit themselves to it.
>
> Send one text today: "I'm starting a game night, second Tuesday of the month. Want in?" That is the whole job. The full playbook, including what to do about the person who never comes, is here:
>
> Read: [How to start a board game group that lasts](https://theludarium.com/articles/how-to-start-a-game-night-group/)
>
> **What arrives from now on**
>
> Every Friday, one General letter, the same shape each week: one idea about playing together, one game and who it is for, the best of what we published, and the week's highlights from the three smaller letters, in case you missed them. No sales emails in between. When the Indianapolis lounge gets close, you hear it here first.
>
> **The three smaller letters**
>
> - **Cube**, for Magic Cube drafters and builders.
> - **Tabletop**, for board game picks, strategy, and shelf advice.
> - **Industry**, for the business of tabletop: what the companies are doing and where the money goes.
>
> Each is its own weekly email. Pick any of them at [theludarium.com/newsletter](https://theludarium.com/newsletter/), and you get only what you pick.
>
> One question before I go: what game got you into this? Not the best game you own. The first one that made you think, "I want to do that again with these people." Reply with one title. The best answers end up in the letter, with your first name if you say yes.
>
> See you at the table,
>
> Levi
> The Ludarium

---

## Cube

### Email 1, day 0: Welcome to the Cube letter

**Subject:** Welcome to the Cube letter
**A/B alternate:** You're in. Pick one, pass left.

**Preview text:** What this letter covers, who writes it, and the four Cube guides to read first.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Ludarium Letters: Cube. I'm Levi. I have drafted the same Cube with the same people in Indianapolis for years, and that group grew into Cube Commonwealth, a community built around one Cube. This letter is where I write about Cube every week.
>
> **What you get**
>
> One email a week with what's new in Cube on theludarium.com, the best of what other Cube designers and creators are putting out, what changed in the wider Cube world that week and why it matters for your paper Cube, and what Cube Commonwealth is up to. If you build, draft, or run Cubes, it is for you.
>
> **Start here**
>
> - [What is a Magic Cube](https://theludarium.com/articles/what-is-a-magic-cube/), if you are new, or need to explain it to your table.
> - [Cube draft strategy: picks, signals, and the table](https://theludarium.com/articles/cube-draft-strategy/), if you draft.
> - [How to build a Cube: your first Cube under $200](https://theludarium.com/articles/how-to-build-a-cube-mtg/), if you want to build.
> - [How to run a Cube draft: 8 players, 3 hours](https://theludarium.com/articles/how-to-run-a-cube-draft/), if you run the night.
>
> One favor: reply with the Cube you draft most, yours or someone else's. A CubeCobra link is perfect. I read every reply, and the Cubes you send shape what I review next.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 2, day 2: Read any Cube list in ten minutes

**Subject:** Read any Cube list in ten minutes
**A/B alternate:** Draft better by Friday

**Preview text:** One skill that makes every draft better, and a free course if you want more.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> The best pick in a Cube draft is often decided before pack one opens, by how well you read the list.
>
> Every Cube is an argument about what Magic should feel like. The sections tell you the archetypes the designer wants you to draft. The card count per color tells you how contested each lane will be. The fixing tells you how greedy you can be. Ten minutes with the list, and you walk into the draft knowing which decks are supported and which are traps.
>
> Read: [How to read a Cube list in ten minutes](https://theludarium.com/articles/how-to-read-a-cube-list/)
>
> If you want the longer version, the Academy's Cube Draft course sends short lessons by email, free: [Cube Draft](https://theludarium.com/academy/cube-draft/). It is a separate signup, so this letter stays this letter.
>
> One small ask: before your next draft, open the list and count the fixing. Then tell me if it changed your first pick.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 3, day 5: Where Cube Commonwealth plays

**Subject:** Where Cube Commonwealth plays
**A/B alternate:** What arrives every Wednesday

**Preview text:** Our Indianapolis Cube community, the weekly letter's shape, and the other letters we write.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> A word about the community behind this letter.
>
> Cube Commonwealth is a group of Cube players in and around Indianapolis who draft together every week, and everyone who drafts has a say in how the Cube changes. If you are near Indy, [Where We Play](https://theludarium.com/cube-commonwealth/where-we-play/) shows where our members draft and lets you add yourself to the map, and [Magic in Indianapolis: where to play](https://theludarium.com/articles/where-to-play-magic-indianapolis/) lists the stores running events. If you are not, the letter brings the table to you.
>
> **What arrives from now on**
>
> Every Wednesday, one Cube letter: what's new from us, one Cube or creator worth your attention, what moved in the Cube world that week, and Commonwealth news. No sales emails in between.
>
> **The other letters**
>
> The Ludarium also writes a **General** letter (the big picture and the best of everything we publish), a **Tabletop** letter (board games and card games that aren't TCGs), and an **Industry** letter (the business of tabletop). Each is its own weekly email. Pick any of them at [theludarium.com/newsletter](https://theludarium.com/newsletter/), and you get only what you pick.
>
> One question: what is the one card you would never cut from your Cube? Reply with the card and the reason. The best answers end up in the letter, with your first name if you say yes.
>
> See you at the table,
>
> Levi
> The Ludarium

---

## Tabletop

### Email 1, day 0: Welcome to the Tabletop letter

**Subject:** Welcome to the Tabletop letter
**A/B alternate:** You're in. Here is the first game to bring.

**Preview text:** What this letter covers, the four guides to read first, and three free tools for tonight.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Ludarium Letters: Tabletop. This is the letter about the games themselves: which board game to bring, how to teach it in five minutes, how to win at it (sometimes), and how to build a shelf your group actually plays.
>
> **What you get**
>
> One email a week with one game worth trying and who it is for, one hosting or teaching idea, the newest guides from theludarium.com, and new free lessons from the Academy.
>
> **Start here**
>
> - [10 gateway board games](https://theludarium.com/articles/gateway-board-games/), the list we send most often when someone asks what to bring.
> - [Easiest board games to learn: teach them in one sentence](https://theludarium.com/articles/easiest-board-games-to-learn/), for a table of first-timers.
> - [15 best cooperative board games](https://theludarium.com/articles/best-cooperative-board-games/), for groups who hate losing to each other.
> - [Board game weight explained](https://theludarium.com/articles/board-game-weight-explained/), so a "2.5" on a box means something.
>
> **Play something tonight**
>
> - [The Card Catalogue](https://theludarium.com/card-catalogue/): find games by how they feel, and get picks for your whole group.
> - [Game Night Madness](https://theludarium.com/game-night-madness/): put your shelf in a bracket and let the table vote.
> - [The Academy](https://theludarium.com/academy/): free lessons on Wingspan, Azul, Carcassonne, Ticket to Ride, and more.
>
> One favor: reply with the game on your table this week, and who you played it with. I read every reply.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 2, day 2: Your play group only needs one Catan

**Subject:** Your play group only needs one Catan
**A/B alternate:** The One Copy Rule

**Preview text:** Why a shared shelf beats five matching ones, and a starter shelf from $40.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> The first email was about what to bring. This one is about what to buy, and the answer is less than you think.
>
> A play group needs one copy of a game, not one per person. Five friends who each own Catan own four copies that never leave the shelf. Five friends who own five different games own a library. We call it the One Copy Rule, and it changes how you shop: before you buy a game, ask who in your group already has it.
>
> Read: [The One Copy Rule](https://theludarium.com/articles/one-copy-rule/)
>
> If your shelf is empty, or nearly, this is the companion piece: a starter shelf that covers most game nights, built in steps from $40 to $300.
>
> Read: [The Starter Shelf](https://theludarium.com/articles/starter-shelf-40-to-300/)
>
> One small ask: text your group one line today: "What games do you own?" The answers are your first library.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 3, day 5: What arrives every Tuesday

**Subject:** What arrives every Tuesday
**A/B alternate:** The game that started it

**Preview text:** The weekly letter's shape, free lessons by email, and the other letters we write.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Two emails in, you know what we think a good game night takes: the right first game, and a shelf your group shares. Here is what comes next.
>
> **What arrives from now on**
>
> Every Tuesday, one Tabletop letter: one game and who it is for, one idea for hosting or teaching, the newest guides, and new Academy lessons. No sales emails in between.
>
> If you want to go deep on one game, the Academy sends short lessons by email, free, for games like Wingspan, Azul, Carcassonne, and Ticket to Ride. Each course is its own signup, so this letter stays this letter: [The Ludarium Academy](https://theludarium.com/academy/).
>
> **The other letters**
>
> The Ludarium also writes a **General** letter (the big picture and the best of everything we publish), a **Cube** letter (Magic Cube drafting and building), and an **Industry** letter (the business of tabletop). Each is its own weekly email. Pick any of them at [theludarium.com/newsletter](https://theludarium.com/newsletter/), and you get only what you pick.
>
> One question: what game got you into this? Not the best game you own. The first one that made you think, "I want to do that again with these people." Reply with one title. The best answers end up in the letter, with your first name if you say yes.
>
> See you at the table,
>
> Levi
> The Ludarium

---

## Industry

### Email 1, day 0: Welcome to the Industry letter

**Subject:** Welcome to the Industry letter
**A/B alternate:** You're in. Here is where the money goes.

**Preview text:** What this letter covers, who it is for, and four reports to read first.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to Ludarium Letters: Industry. This is the business letter: what tabletop companies are doing, where the money comes from and where it goes, and how people make a living in this hobby.
>
> **What you get**
>
> One email a week with the week's industry news and what it means, one number worth knowing, one company or creator doing something smart, and open jobs in the industry when we find them. No fan talk, no hot takes. Numbers, sources, and what we would do about them.
>
> **Who it is for**
>
> Publishers, store and cafe owners, designers, creators, investors, and anyone building something in tabletop. We are building something too, a membership game lounge in Indianapolis, and we show our own math as we go.
>
> **Start here**
>
> - [How much do board gamers actually spend per year?](https://theludarium.com/articles/how-much-do-gamers-spend/)
> - [Why board games cost more now](https://theludarium.com/articles/why-board-games-cost-more-now/)
> - [Kickstarter board game campaigns: a sober look](https://theludarium.com/articles/kickstarter-board-game/)
> - [Game lounge membership model: how the math works](https://theludarium.com/articles/game-lounge-membership-model/)
>
> One favor: reply and tell me what you do in the industry, or what you are building. Publisher, retailer, designer, creator, investor, or just curious. I read every reply, and it decides which numbers we chase first.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 2, day 2: What coworking got right that game stores got wrong

**Subject:** What coworking got right that game stores got wrong
**A/B alternate:** 12 lessons from board game cafe owners

**Preview text:** Two reports on the business of giving people a place to play.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Most tabletop businesses sell boxes. The ones we study most sell time and a seat.
>
> A game store makes money on margin per box, and the margin is thin. A coworking space makes money on membership, which pays whether a member comes once a week or every day, and makes the fifth visit free. We think the second model is the one tabletop has been missing, and we are betting a lounge on it.
>
> Read: [What coworking got right that game stores got wrong](https://theludarium.com/articles/coworking-vs-game-stores/)
>
> For the view from the floor, twelve owners who run board game cafes on what works and what nearly closed them:
>
> Read: [How to run a board game cafe: 12 lessons from owners](https://theludarium.com/articles/how-to-run-a-board-game-cafe/)
>
> One small ask: if you run a tabletop business, reply with the one number you watch every week. We will compare notes.
>
> See you at the table,
>
> Levi
> The Ludarium

### Email 3, day 5: What arrives every Thursday

**Subject:** What arrives every Thursday
**A/B alternate:** The Ledger, and the other letters

**Preview text:** The weekly letter's shape, a quarterly money column, and one question.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Here is what comes next, and one thing that is coming later.
>
> **What arrives from now on**
>
> Every Thursday, one Industry letter: the week's news and what it means, one number, one company or creator doing something smart, and open jobs when we find them. No sales emails in between.
>
> **Coming later**
>
> The Ludarium Ledger, a quarterly column on industry money: five numbers and one chart. Industry readers get it a day before it goes public. The first one lands in the new year.
>
> **The other letters**
>
> The Ludarium also writes a **General** letter (the big picture and the best of everything we publish), a **Cube** letter (Magic Cube drafting and building), and a **Tabletop** letter (board game picks, strategy, and shelf advice). Each is its own weekly email. Pick any of them at [theludarium.com/newsletter](https://theludarium.com/newsletter/), and you get only what you pick.
>
> One question: what is the most underrated business in tabletop right now? A publisher, a store, a creator, a tool. Reply with the name and one line on why. The best answers end up in the letter, with your first name if you say yes.
>
> See you at the table,
>
> Levi
> The Ludarium

---

## Before the sequences go live

1. In Kit: rename "Welcome" to "Welcome - General" and load its three emails; create the three new sequences; add the rules in the table above; set every sequence to Active.
2. Test each form with a real email address: confirm, then check the subscriber has only that letter's tag, sits only in that letter's segment, and received that letter's email 1.
3. Keep the send days in step: the emails, `/newsletter/`, and the broadcast schedule in Kit all say Tuesday, Wednesday, Thursday, Friday.
