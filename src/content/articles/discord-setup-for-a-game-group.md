---
title: "Discord for a Game Group: Channels, Roles, Weekly Post"
description: "Discord for a game group: the channels, roles, and weekly post that Cube Commonwealth used to get members of a 300-person local server to the table each week."
pubDate: 2026-10-18
category: Magic & Cube
tags: ["Discord game group", "Discord server for board game group", "Discord setup for Magic group", "game night Discord channels", "weekly game night post", "Discord roles for a club", "Cube Commonwealth"]
draft: true
---
A Discord game group lives or dies on one post a week. Everything else in the server exists to make that post land. Cube Commonwealth ran a roughly 300-member, mostly local Discord in Indianapolis for about three years, and it turned a cube and a Thursday into 12 to 16 players a week. Most of the server was clutter. A small part of it did all the work. This is the small part, written so you can copy it in an afternoon.

## What is a Discord server for, in a game group?

Three jobs, in order of importance.

1. **Getting people to the table.** The weekly post, the RSVP, the headcount, the address.
2. **Keeping the week warm between nights.** Results, photos, trash talk, a card someone wants cut.
3. **Onboarding new people without the host doing it by hand.** A pinned "start here" that answers the five questions every first-timer asks.

Anything that does not serve one of those three jobs is a channel nobody reads. We learned that by building about twenty channels and watching four of them get used.

## Which channels do you need?

Fewer than you think. Here is the layout we ended up with after pruning, and what each channel is for.

| Channel | Purpose | Who posts |
|---|---|---|
| #start-here | Pinned: what we are, when and where we meet, what to bring (nothing), how to RSVP | Host only, rarely |
| #this-week | The weekly post and nothing else. One post, reactions as RSVP, headcount updates in the thread | Host; members react and reply in-thread |
| #results | The day-after post: who went 3-0, deck of the night, a photo or two | Host or whoever tracked records |
| #general | Everything else. Card talk, memes, "anyone want to play Saturday" | Everyone |
| #the-cube | The change log and the lobbying. What came in, what went out, what should | Host posts changes; everyone argues |
| #new-players | Questions nobody wants to ask in #general | Everyone; veterans answer |
| #pod-a, #pod-b | Threads created per night for pairings on two-pod weeks, archived after | Host |

Seven channels. We had a trade channel, a Commander channel, a video games channel, and a memes channel at various points. All of them split attention away from the one post that mattered, and all of them went quiet within a month. If a channel has not had a message in two weeks, archive it.

The weekly post channel is the key design decision. It contains only the weekly post. No conversation, no card talk, no "lol." When someone opens #this-week, the most recent message is always the current week's post. That is worth more than any bot.

## What does the weekly post look like?

Identical every week. That is the feature. People do not read a weekly post; they recognize it and react. Ours was, nearly word for word:

> **Cube, [day], [time]**
> [Venue or address] <!-- EDITOR: add detail -->
> Packs open at [time] sharp. Two pods if we hit 12.
> React with ✅ if you're in. Un-react by the afternoon if plans change.
> New? Read #start-here and come anyway. We'll seat you with someone who helps.

Five lines. The day it went up never changed. The reaction count became a public headcount, and the headcount is what pulls in the seventh and eighth player, which we covered in [how to get eight players to show up](/articles/how-to-get-eight-players-for-a-draft/).

Three rules we held to:

- **Same day, same time, same wording.** Change the post when the facts change, not for variety.
- **One ask.** React. Not "react and also tell us your color preference and also whether you want pizza."
- **The headcount gets updated in the thread, by the host, the afternoon of.** "Nine in. Room for a second pod."

## Which roles matter?

Roles in Discord do two things: permissions and pings. You want very few of each.

- **@regular.** Anyone who has come three times. Can post in #results and create threads. Mostly it is a small badge that says "you belong here."
- **@host.** The people who can run a night: deal packs, run pairings, make a ruling. Two or three people, never one. We wrote about why one is dangerous in [relaunching a game community](/articles/relaunching-a-game-community/).
- **@new.** Assigned on join, removed after the first visit. Lets veterans see who in #general has not been to a night yet and say hello.
- **@cube-pings.** Opt-in. The only role the weekly post mentions. People who want a notification get one; people who do not, do not. Pinging @everyone once a week is how you train people to mute the server.

We did not have moderator roles beyond the hosts, because a 300-member local server with a clear purpose rarely needs them. In three years we removed a handful of people, all for the same reason, which was being unkind at the table rather than anything they typed.

*If this is useful, the newsletter sends one piece like it every week.*

## How do you onboard someone without doing it by hand?

The pinned #start-here post. It answers, in this order, the five things every new person wants to know and is slightly embarrassed to ask:

1. What is this? One sentence. "A weekly Magic cube draft in Indianapolis. One shared cube, no cards needed."
2. When and where? The fixed night, the venue, parking if it matters. <!-- EDITOR: add detail -->
3. What does it cost? The real answer, including the drink you should buy if the venue is a bar.
4. What should I bring? Nothing. Maybe a playmat.
5. How do I say I'm coming? "React to the post in #this-week."

Then a link to our piece on what a cube is, and a line that says the host's name and that they will message you before your first night. That last line matters more than the rest combined. A stranger is more likely to walk into a room if one person in it is expecting them.

For a longer version of how we handle first-timers at the table, see [new-player cube night](/articles/cube-for-new-magic-players/).

## What did we get wrong with the server?

**Too many channels, too early.** Built for the community we imagined, not the one we had. Prune to what gets used.

**Letting the weekly post channel fill with chatter.** The second the post is buried under replies, people stop finding it. Thread the replies or lock the channel to the host.

**Pinging everyone.** Once a week felt reasonable. It was not. Opt-in pings or nothing.

**Running the pause in silence.** When the night went quiet for a stretch, we did not say so in the server. People kept checking #this-week and finding last month's post. A single pinned "we're pausing, here's why, here's when we'll say more" would have kept the trust that we then had to rebuild. The relaunch article covers what that cost.

**Treating 300 members as 300 players.** The membership count was never the point. About forty people were active in any given month, and six were the core. A server's health is measured by the weekly reaction count, not the member count.

## What about bots and tools?

A few things earned their place.

- **A reaction-role bot** for the opt-in @cube-pings role. Set it up once.
- **A pinned pairing sheet or a free pairing app** on two-pod nights, with each pod's pairings posted in its own thread so nobody has to find the host to learn who they play.
- **A scheduled event** in Discord's own events feature, duplicating the weekly post. Some people live by the events tab. It costs nothing.

Things we tried and dropped: an attendance-tracking bot (a spreadsheet did it better), a card-price bot (nobody is buying cards in a cube group), and a leveling bot (it rewarded people for typing, and we wanted to reward people for showing up).

## FAQ

### How many channels should a game group Discord have?

Five to seven. A start-here pin, a weekly post channel that holds only the weekly post, a results channel, a general channel, and one or two topic channels. Archive anything quiet for two weeks.

### How do you take RSVPs for a game night on Discord?

One weekly post, one emoji reaction to say you are in, and a norm that people un-react if plans change. The reaction count becomes a public headcount.

### Should you ping everyone for a weekly game night?

No. Make an opt-in role for notifications and mention only that role. Pinging everyone trains people to mute the server.

### Do you need moderators for a local game group Discord?

Rarely, if the server has a clear purpose and a small set of hosts. Most problems in a local group happen at the table, not in the chat.

## Pull up a chair

If you are in Indianapolis, the Cube Commonwealth server is open again and the weekly post is back in #this-week. Join <!-- EDITOR: add Discord invite link --> and react when you can make it. If you are setting up a server for your own group, subscribe to The Ludarium newsletter: one piece like this every week on running a game community, and first word when the lounge opens here. The game is the reason. The people are the point.
