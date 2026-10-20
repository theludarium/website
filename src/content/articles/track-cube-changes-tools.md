---
title: "Track Cube Changes: CubeCobra, Diffs, and Lists"
description: "Tools to track cube changes: CubeCobra history, Lucky Paper's List Differ, plain diffs, and a routine for following the Vintage Cube and your own list."
pubDate: 2026-10-18
category: Magic & Cube
tags: ["track cube changes", "cube changelog tools", "CubeCobra history", "compare cube lists", "cube list diff", "Vintage Cube changelist tracking", "Cube Commonwealth"]
draft: true
---
To track cube changes well you need three things: a canonical list in plain text, a record of every swap with a date and a reason, and a way to compare two versions of a list in seconds. CubeCobra gives you the first two for your own cube. A text differ gives you the third for anyone's. The rest is habit.

This guide covers the tools we use to follow the MTGO Vintage Cube's updates and to manage our own list, with what each one does well and where it falls short. Where a feature is documented, we link the source. Where we describe our own routine, it is a house practice, not a standard.

## What does CubeCobra do for tracking changes?

CubeCobra is the default cube manager, and we have covered listing and sharing on it elsewhere. For change tracking specifically, three features matter, all described on the [CubeCobra developer blog](https://cubecobra.com/dev/blog):

- **History tab.** Every cube has one, backfilled from earlier blog posts, and later changes including card attribute edits are tracked. This is the feature that makes CubeCobra a changelog rather than a list.
- **Blog posts per cube.** Each cube can carry posts, and the site generates one automatically when a cube is cleaned of invalid cards. Owners who write a sentence per swap build a readable record with no extra tooling.
- **Changelogs linked to tracked data.** Changelogs used to be plain text; they now reflect the tracked data with autocard links, so a swap in the history shows the actual cards.

What CubeCobra did not have, as of the dev blog posts we read: undoing a change, a point-in-time view of a cube, or comparing a past version with another cube. The [dev blog](https://cubecobra.com/dev/blog) says the history system was designed to support those, so they may arrive. Until then, comparing two cubes means exporting both and diffing.

Two more CubeCobra features help indirectly. The per-cube Elo and the ranking tab show each card's pick-pass ratio and mainboard-sideboard ratio from playtest drafts, which is the data you want when deciding what to cut. And the bulk text upload lets you paste a whole list, which is how we load the MTGO Vintage Cube for side-by-side comparison.

## How do you diff two cube lists?

A cube list is a list of card names, one per line. Two versions of it differ by some lines added and some removed. Any text diff tool shows that, and for cube the plain ones are better than the clever ones.

| Tool | What it does | Best for |
|---|---|---|
| [Lucky Paper List Differ](https://luckypaper.co/resources/) | Compares two pasted lists and reports adds and removes; the same page hosts a Spellchecker for card names and a List Formatter that enriches a list with Scryfall data | The quick check: paste last month's list and this month's |
| CubeCobra history tab | Shows the cube's own change record over time | Your own cube, or any public cube whose owner uses it |
| A spreadsheet with one column per date | COUNTIF or a lookup to flag names present in one column and not the other | Owners who already keep their list in Sheets |
| Command-line diff (`diff`, `comm`) on sorted text files | Exact set difference, scriptable | Anyone comfortable in a terminal; it is what we use |
| Lucky Paper Cube Cobra to Google Sheets script | Loads a CubeCobra list into a sheet automatically | Keeping a Sheets archive without copy-paste |

The one rule for all of them: sort the lists and normalize names first. "Fire // Ice" and "Fire / Ice" are the same card to you and different lines to a differ. The Spellchecker exists for exactly that.

*If this is useful, the newsletter sends more like it.*

## How do you track the MTGO Vintage Cube specifically?

The Vintage Cube is the easiest cube in the world to track because the curator publishes the diff. Each update article on mtgo.com has a changelist table of cards in and out, and the [card list page](https://www.mtgo.com/vintage-cube-cardlist) has a drop-down with the changelog and the full list, with an effective date at the top. Our guide to [how the updates work](/articles/how-mtgo-vintage-cube-updates-work/) explains the cadence.

Our routine, which takes about twenty minutes per update:

1. **Save the full list as a dated text file** the day the update posts. One card per line, sorted. The October 7, 2026 list is `vintage-cube-2026-10-07.txt` in our archive. <!-- EDITOR: adjust to actual file naming -->
2. **Diff it against the previous file.** The result should match the article's changelist exactly. When it does not (the August 2026 Hobbit article said 21 changes and its table showed 19 pairs), the diff is the truth and the discrepancy is worth a note.
3. **Copy the changelist into a running spreadsheet** with columns for date, card, in or out, the curator's reason, and our one-word verdict. By October 2026 that sheet covers eight updates and more than 200 swaps since August 2025, counting from the posted changelists.
4. **Flag the repeat movers.** A pivot on card name shows which cards have moved more than once. Leovold, Channel, Brightglass Gearhulk, Paradoxical Outcome, Bloodchief's Thirst and Dark Depths all show two or three moves in fourteen months. Those are the cards whose next move is predictable.

Step four is the payoff. A single changelist tells you what changed. The accumulated sheet tells you what the curator keeps trying, and that is the information a paper owner can actually use.

## How should you track your own cube?

The same way, with less ceremony. The minimum that works:

- **One canonical list** in CubeCobra, so there is never a question of which version is real.
- **One sentence per swap** in the CubeCobra blog or a changelog file, with the date. "Out: Tarmogoyf. In: Caustic Bronco. Goyf never did anything on the turn it came down." That is enough, and drafters read it more than you would expect.
- **A dated export every time you change the list.** CubeCobra's history covers this for the site, but a text file in a folder is yours forever and diffs against anything.
- **A quarterly diff against your reference cubes.** Not to copy them, but to notice when a card you still run has been cut everywhere else. See our list of [the reference cubes we follow](/articles/reference-cubes-we-follow/) for which ones.

What not to do: keep the list in your head, in a sleeved box, or in a group chat. All three are lists you cannot diff.

## Which tools are overkill?

Version control (git) works for cube lists and some owners love it. Every commit is a dated diff with a message, which is exactly a changelog. The cost is the learning curve, and CubeCobra's history tab now delivers most of the benefit for free. We use git for our archive because we already use it for everything else. We would not tell a new owner to learn it for a cube.

Custom databases, Scryfall API scripts and the Lucky Paper MTG Scripting Toolkit are for people building tools, not tracking a list. If you want to know whether a card is in the Vintage Cube, Ctrl-F on the card list page is faster than any of them.

## FAQ

### Does CubeCobra show a cube's change history?

Yes. Every cube has a history tab, backfilled from earlier blog posts, and later changes are tracked, per the CubeCobra developer blog.

### How do I compare two cube lists?

Export both as plain text, one card per line, normalize the names, and paste them into Lucky Paper's List Differ or run a command-line diff on the sorted files.

### Where is the MTGO Vintage Cube changelog?

In each update article on mtgo.com and in the drop-down on the [Vintage Cube card list page](https://www.mtgo.com/vintage-cube-cardlist), which also states the list's effective date.

### How often should I export my own cube list?

Every time you change it. A dated text file per version costs nothing and lets you answer "when did we cut that?" in one command.

## We do the tracking so you can do the drafting

Our running sheet of Vintage Cube changes since August 2025 goes to newsletter subscribers after each update, with the repeat movers flagged. The game is the reason. The people are the point. Subscribe to The Ludarium newsletter, and if you are in Indianapolis, join [Cube Commonwealth](/articles/cube-draft-indianapolis/) and help us keep the changelog honest.
