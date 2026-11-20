---
title: "CubeCobra Guide: Listing, Testing, and Sharing a Cube"
description: "A CubeCobra guide for Cube owners: how to list your Cube, build sample packs, draft against bots, keep a changelog, and share the full list with your playgroup."
pubDate: 2026-10-18
category: Magic & Cube
tags: ["CubeCobra", "Cube cobra tutorial", "how to use CubeCobra", "Cube list online", "Cube playtest tools", "Cube changelog", "Cube Commonwealth"]
draft: true
---
CubeCobra is the free website where most of the Cube community keeps its lists. You paste in your cards, and the site gives you a sortable list, a visual spoiler, a mana curve, sample packs, a way to draft the Cube against bots or with friends online, and a blog that tracks every change you make. If you own a Cube and your list lives in a spreadsheet, moving it to CubeCobra is an afternoon that pays off for years.

This guide walks through setting up a Cube on the site, the testing tools that matter most, and how to use it to share the list with a weekly group. It is written for Magic players who know the game but are new to running a Cube. Details of the interface change; check cubecobra.com for the current layout. <!-- EDITOR: confirm feature names against the live site before publishing -->

## What is CubeCobra and why use it?

CubeCobra is a community-built, free site for Magic Cube owners. It replaced an older generation of Cube tools that had gone quiet, and it added things they never had: draft bots trained on real pick data, a Cube-wide search across thousands of public lists, and card analytics tied to your own list.

Three reasons it is worth the move from a spreadsheet:

1. **The list becomes shareable.** One URL, always current, that your drafters can browse on their phone before the night. New players can read it ahead of time and show up with an idea of what the archetypes are.
2. **Testing is built in.** Sample packs and bot drafts let you check a change before the group ever sees it. See [how to update a Cube](/articles/how-to-update-a-cube/) for where that fits in the process.
3. **The history is automatic.** Every change you make is recorded as a changelog post, so a year from now you know why a card is in the list and when it arrived.

## How do you set up a Cube on CubeCobra?

**Create an account and a Cube.** Sign up, then create a new Cube. You will name it, pick a category such as Vintage, Legacy, Modern, Pauper, or Peasant, and set the card count. The category helps other owners find comparable lists and helps the draft bots pick sensibly.

**Add the cards.** The fastest way is to paste a plain list, one card name per line. CubeCobra also imports CSV files, which is how you bring over a spreadsheet. If a name is ambiguous because the card has several printings, the site picks a default and lets you change it afterward.

**Write the overview.** The overview page has a description field. Use it as a primer: what power level the Cube is, which archetypes it supports, and any house rules. A good primer is the single most useful thing a new drafter can read.

**Tag the cards.** Tags are free-text labels you attach to cards. Common uses: tag each card with its archetype ("aggro," "reanimator," "sacrifice"), its role ("removal," "one-drop," "fixing"), or its owner status ("proxy," "borrowed"). Tags let you filter the list later and count things like how many one-drops white has, which is exactly the count you need to keep aggro healthy.

**Set up the maybeboard.** Alongside the main list is a maybeboard, a holding pen for cards you are considering. Putting candidates there instead of in a notes file means they show up in the same views as the real list, with the same filters.

*If this is useful, the newsletter sends more like it.*

## What are the list views good for?

The list page shows your Cube in several ways, and each one answers a different question.

| View | Shows | Use it to |
|---|---|---|
| Table | Cards in columns by color, sorted by mana value | Read the whole Cube at a glance, spot gaps in a curve |
| Visual spoiler | Card images in a grid | Browse like a set, show new drafters what is in the box |
| Curve | Mana curve per color | Check that each color has enough cheap plays |
| List | Plain sortable text | Export, compare, or count with filters |

The sorting is where the design work happens. You can sort the table by any two attributes at once: color then mana value, color then type, tag then color. Sorting white by mana value and seeing four one-drops next to twelve four-drops is how you find a problem that no amount of staring at a spreadsheet will show you.

Filters use a search syntax similar to Scryfall's. "c:w mv=1 t:creature" shows white one-drop creatures. "tag:removal" shows everything you tagged removal. Combined with the counts the page displays, the filters turn "I think we have enough fixing" into "we have 18 dual lands and 6 rocks."

## How do you test a Cube on CubeCobra?

The playtest page is the reason to move your Cube here. Four tools, in order of how often you will use them.

**Sample pack.** Generates a random fifteen-card pack from your list. Click it twenty times. Are there packs with no playable for an aggro drafter? Packs with three bombs? Packs where every card is a four-drop? This is the fastest check for whether a Cube drafts the way you intend. You can also enter a seed, any word or number, and the same seed gives the same pack as long as the list has not changed, which is useful for showing someone a specific pack.

**Draft against bots.** Starts an eight-seat draft with you in one seat and bots in the other seven. The bots pick based on a model of what real drafters take, weighted toward cards in your Cube's category, so they play reasonably. A bot draft shows you which cards go early, whether lanes stay open, and what a mediocre drafter would end up with. Save the deck when you finish; saved decks appear on the Cube's page and build up a record over time.

**Multiplayer draft.** CubeCobra hands off to Draftmancer, a separate free site, for live drafts with other people and bots filling empty seats. Everyone gets a link, drafts in a browser, and the results come back to your CubeCobra page. This is how remote friends draft a Cube together, and it is how a group can test a big update before the next physical night.

**Grid draft and sealed.** The playtest page also offers Grid draft, a two-player open-information format, and a standard sealed pool. Both are quick ways to check a new list from a different angle. Our [two-player Cube formats](/articles/two-player-cube-formats/) article explains how Grid works.

Beyond the playtest page, the analysis tools show your Cube's color balance, type breakdown, mana curve, and how your card choices compare to other Cubes in the same category. The comparison is the useful part. If a card is in 90 percent of legacy Cubes and not in yours, you should at least know why.

**Custom draft formats.** If your Cube does something unusual, such as a fixed land slot in every pack, you can define a custom format with per-pack steps of pick, pass, and trash.

## How do you share the Cube with your group?

**The URL.** Every Cube has a short link. Put it in your Discord channel description, your weekly post, and anywhere new players will look. The list page works well on phones.

**The blog.** Every time you save a change to the list, CubeCobra creates a changelog post showing what came in and what went out, for both the mainboard and the maybeboard. You can add text to each post explaining why. This is the changelog that a good update process depends on, kept for you without effort. Drafters who follow the Cube see the posts in their feed.

**Followers.** Players can follow a Cube, which puts its blog posts in their home feed on the site. Ask your regulars to follow. It turns "did the list change?" into something they already know.

**Export.** The list exports to several formats: plain text, CSV, and formats for programs like Cockatrice, Forge, and Magic Online. The CSV export is also the right backup. Download it after every major update and keep it somewhere that is not CubeCobra, because any site can go away.

**Decks.** Saved decks from bot drafts, Draftmancer sessions, and manual uploads appear on the Cube's page. Over months, that becomes a real record of what the Cube produces.

**Privacy.** A Cube can be public, unlisted, or private. Most owners go public; the community benefits from seeing more lists.

## A few habits that make CubeCobra more useful

- **Update the site before the physical Cube.** Make the change online, run three sample packs and a bot draft, then pull the physical cards. The order matters because the online version is the one you can undo.
- **Tag on entry.** Tagging 360 cards after the fact is a chore. Tagging each card as you add it is thirty seconds.
- **Write one sentence per changelog post.** Future you will thank present you.
- **Browse other Cubes in your category once a month.** Not to copy them, but to notice what you have missed and what everyone else is trying.

## FAQ

### Is CubeCobra free?

Yes. It is community-built and free to use. There is no cost to list, test, or share a Cube.

### Can you draft a Cube online with friends using CubeCobra?

Yes. The multiplayer draft option sends everyone to Draftmancer, a free companion site, and the results return to your CubeCobra Cube page.

### How do I import a Cube list into CubeCobra?

Paste a plain list with one card name per line, or upload a CSV. The site matches names to cards and lets you fix any ambiguous printings afterward.

### What is the maybeboard on CubeCobra?

A second list attached to your Cube for cards you are considering but have not added. It uses the same views and filters as the main list, and changes to it get their own changelog entries.

## The list is a conversation

A Cube list on CubeCobra is a thing your group can read, follow, argue with, and draft from anywhere. The game is the reason. The people are the point.

Subscribe to The Ludarium newsletter for new pieces on Cube and the communities that draft it. Indianapolis readers can see our list in person at [Cube Commonwealth](/articles/cube-draft-indianapolis/), and online on CubeCobra. <!-- EDITOR: add detail: link to the Cube Commonwealth list -->
