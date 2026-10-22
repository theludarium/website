# Newsletter emails

Drafts for Kit. Edit freely; keep the house rules: plain words, short sentences, no em dashes, and no schedule promises ("weekly") until there is a schedule.

## Confirmation email (Kit "incentive email", double opt-in)

Kit sends this the moment someone signs up. Its only job is the click.

**Subject:** One click and you're in

**Body:**

> Hi,
>
> Thanks for joining The Ludarium newsletter. Click the button below to confirm, and you're in.
>
> [Button: Yes, send me game night ideas]
>
> If you didn't sign up, ignore this email and you won't hear from us.
>
> The Ludarium

Button text in Kit: **Yes, send me game night ideas**. The button's destination is Kit's confirmation link, which then redirects to `https://theludarium.com/newsletter/confirmed/`.

## Welcome email (Welcome sequence, email 1, sent right after confirming)

**Subject:** Welcome to the table

**Preview text:** What to read first, what to play tonight, and what we're building in Indianapolis.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> Welcome to The Ludarium. You just joined a group of people who think the best nights happen around a table.
>
> Here is the idea behind everything we make: **the game is the reason. The people are the point.** We call it togethering. A game gives a room of people something to do together, and that is how strangers become regulars and regulars become friends.
>
> **Start here**
>
> - [10 gateway board games that turn non-gamers into regulars](https://theludarium.com/articles/gateway-board-games/), if you want the right first game for your people.
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

Notes:

- `{{ subscriber.first_name | default: "there" }}` is Kit's Liquid tag; it prints the first name when the form collected one (the lounge waitlist does) and "there" otherwise.
- Replies go to hello@theludarium.com and forward to Levi's Gmail.
- Every link above points to a live page as of 2026-10-21.

## Indianapolis waitlist welcome (its own sequence, sent right after confirming)

For people who join through the **Lounge waitlist: Indianapolis** form. It replaces the newsletter welcome for them, so they get one welcome, not two. It promises only what the Indianapolis page promises: first word on location, opening and pricing, and a say in what gets built. No founding-member deals or dates until those exist.

**Subject:** You're on the list for The Ludarium, Indianapolis

**Preview text:** Lounge No. 001 is coming. Here's what being on the list means.

**Body:**

> Hi {{ subscriber.first_name | default: "there" }},
>
> You're on the waitlist for The Ludarium Game Lounge in Indianapolis, Lounge No. 001. Thank you. Every name on this list moves it closer.
>
> **What we're building**
>
> A membership game lounge and community center where every game community in the city meets: board game nights, RPG campaigns, card leagues, chess and Go clubs, the mahjong table, designers testing prototypes. A place you can walk into on your own and find a seat.
>
> **What being on the list means**
>
> - **You hear first.** Where it will be, when it opens, and what membership costs, before anyone else.
> - **You get a say.** The list tells us where to build, how big, and which groups to bring in first. What you told us about what you play and how often you'd come is already part of that.
>
> **Help it happen sooner**
>
> - **Reply and tell me what group, club, or game night you're part of now.** I read every reply, and those groups are who we build around.
> - **Know someone who'd want a seat?** Send them to [theludarium.com/lounges/indianapolis](https://theludarium.com/lounges/indianapolis/). The more people on the list, the sooner it opens.
>
> **While you wait**
>
> - [Board game stores in Indianapolis, by neighborhood](https://theludarium.com/articles/indianapolis-board-game-stores/)
> - [How to find a public game night near you](https://theludarium.com/articles/board-game-night-near-me/)
> - [Game Night Madness](https://theludarium.com/game-night-madness/), for the next time your group can't decide what to play
>
> See you at the table,
>
> Levi
> The Ludarium

### Kit setup for the two welcomes

Built 2026-10-21: sequence **Welcome** (2939465, rule 5660412 from Ludarium Letters) and **Welcome: Indianapolis waitlist** (2939467, its own rule from the waitlist form, alongside tag rule 5659971). Each is one email, sent as soon as possible after confirming. Sequences are a paid Kit feature; check they still run if the account drops to the free plan.

To edit an email's body in Kit's editor (Slate), select all twice (the first select-all only takes the current paragraph) before deleting or pasting.

- **Sequence "Welcome"** (the newsletter welcome above). Rule: trigger **Subscribes to a form: Ludarium Letters**, action **Subscribe to sequence: Welcome**.
- **Sequence "Welcome: Indianapolis waitlist"** (this email). Rule: trigger **Subscribes to a form: Lounge waitlist: Indianapolis**, action **Subscribe to sequence: Welcome: Indianapolis waitlist**. (The existing rule 5659971 already tags these subscribers `lounge-indianapolis`; add the sequence as a second action on it or as its own rule.)
- Kit runs form rules only after the subscriber confirms, so each welcome arrives right after the confirm click.
- Someone who joins both forms gets both welcomes, which is fine: they asked for both.
