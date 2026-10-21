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
