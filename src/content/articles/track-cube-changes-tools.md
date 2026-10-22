---
title: "Track Cube Changes: CubeCobra, Diffs, and Lists"
description: "Tools to track cube changes: CubeCobra history, Lucky Paper's List Differ, plain diffs, and a routine for following the Vintage Cube and your own list."
pubDate: 2026-10-22
category: Magic & Cube
tags: ["track cube changes", "cube changelog tools", "CubeCobra history", "compare cube lists", "cube list diff", "Vintage Cube changelist tracking", "Cube Commonwealth"]
draft: false
---
To track cube changes well you need three things: a canonical list in plain text, a record of every swap with a date and a reason, and a way to compare two versions of a list in seconds. CubeCobra gives you the first two for your own cube. A text differ gives you the third for anyone's. The rest is habit.

This guide covers the tools we use to follow the MTGO Vintage Cube's updates and to manage our own list, with what each one does well and where it falls short. Where a feature is documented, we link the source. Where we describe our own routine, it is a house practice, not a standard.

## What does CubeCobra do for tracking changes?

CubeCobra is the default cube manager, and we have covered listing and sharing on it elsewhere. For change tracking specifically, three features matter, all described on the [CubeCobra developer blog](https://cubecobra.com/dev/blog):

- **Changelog.** Every cube's About tab has one: an entry for each saved edit, newest first, with the date and the cards added, removed, swapped, or edited. This is the feature that makes CubeCobra a changelog rather than a list.
- **Blog posts per cube.** Tick Create Blog Post when saving an edit and the post shows the change list next to your write-up. Owners who write a sentence per swap build a readable record with no extra tooling.
- **Point-in-time views.** Each changelog entry opens the list as it stood after that change, and Compare with Present shows what has come and gone since.

CubeCobra now covers the rest. Any changelog entry opens a point-in-time view you can download or compare with the present. Owners can roll the list back under Settings, Restore. The Compare button in the header puts any two cubes side by side and exports the difference, per the [dev blog](https://cubecobra.com/dev/blog) and the site's wiki.

Two more CubeCobra features help indirectly. The Playtest Data report on the Analysis tab shows each card's pick rate, average pick, wheel rate, and how many decks it made in the cube's drafts, which is the data you want when deciding what to cut. And the bulk text upload lets you paste a whole list, which is how we load the MTGO Vintage Cube for side-by-side comparison.

## How do you diff two cube lists?

A cube list is a list of card names, one per line. Two versions of it differ by some lines added and some removed. Any text diff tool shows that, and for cube the plain ones are better than the clever ones.

| Tool | What it does | Best for |
|---|---|---|
| [Lucky Paper List Differ](https://luckypaper.co/resources/) | Compares two pasted lists and reports adds and removes; the same page hosts a Spellchecker for card names and a List Formatter that enriches a list with Scryfall data | The quick check: paste last month's list and this month's |
| CubeCobra changelog and Compare | The cube's change record, plus a side-by-side compare with any past version or any other cube | Your own cube, or any cube you can see |
| A spreadsheet with one column per date | COUNTIF or a lookup to flag names present in one column and not the other | Owners who already keep their list in Sheets |
| Command-line diff (`diff`, `comm`) on sorted text files | Exact set difference, scriptable | Anyone comfortable in a terminal; it is what we use |
| Lucky Paper Cube Cobra + Google Sheets Integration | Loads a CubeCobra list into a sheet automatically | Keeping a Sheets archive without copy-paste |

The one rule for all of them: sort the lists and normalize names first. "Fire // Ice" and "Fire / Ice" are the same card to you and different lines to a differ. The Spellchecker exists for exactly that.

*If this is useful, the newsletter sends more like it.*

## How do you track the MTGO Vintage Cube specifically?

The Vintage Cube is the easiest cube in the world to track because the curator publishes the diff. Each update article on mtgo.com has a changelist table of cards in and out, and the [card list page](https://www.mtgo.com/vintage-cube-cardlist) has a drop-down with the changelog and the full list, with an effective date at the top. Our guide to [how the updates work](/articles/how-mtgo-vintage-cube-updates-work/) explains the cadence.

Our routine, which takes about twenty minutes per update:

1. **Save the full list as a dated text file** the day the update posts. One card per line, sorted. Name each file by date, such as `vintage-cube-2026-10-07.txt` for the October 7, 2026 list.
2. **Diff it against the previous file.** The result should match the article's changelist exactly. When it does not (the August 2026 Hobbit article said 21 changes and its table showed 19 pairs), the diff is the truth and the discrepancy is worth a note.
3. **Copy the changelist into a running spreadsheet** with columns for date, card, in or out, the curator's reason, and our one-word verdict. By October 2026 that sheet covers eight updates and more than 200 swaps since August 2025, counting from the posted changelists.
4. **Flag the repeat movers.** A pivot on card name shows which cards have moved more than once. Leovold, Channel, Brightglass Gearhulk, Paradoxical Outcome, Bloodchief's Thirst and Dark Depths all show two or three moves in fourteen months. Those are the cards whose next move is predictable.

Step four is the payoff. A single changelist tells you what changed. The accumulated sheet tells you what the curator keeps trying, and that is the information a paper owner can actually use.

## How should you track your own cube?

The same way, with less ceremony. The minimum that works:

- **One canonical list** in CubeCobra, so there is never a question of which version is real.
- **One sentence per swap** in the CubeCobra blog or a changelog file, with the date. "Out: Tarmogoyf. In: Caustic Bronco. Goyf never did anything on the turn it came down." That is enough, and drafters read it more than you would expect.
- **A dated export every time you change the list.** CubeCobra's changelog covers this, and any entry downloads as a point-in-time list, but a text file in a folder is yours forever and diffs against anything.
- **A quarterly diff against your reference cubes.** Not to copy them, but to notice when a card you still run has been cut everywhere else. See our list of [the reference cubes we follow](/articles/reference-cubes-we-follow/) for which ones.

What not to do: keep the list in your head, in a sleeved box, or in a group chat. All three are lists you cannot diff.

## Which tools are overkill?

Version control (git) works for cube lists and some owners love it. Every commit is a dated diff with a message, which is exactly a changelog. The cost is the learning curve, and CubeCobra's changelog now delivers most of the benefit for free. If you already use git, it is a natural fit. We would not tell a new owner to learn it for a cube.

Custom databases, Scryfall API scripts and the Lucky Paper MTG Scripting Toolkit are for people building tools, not tracking a list. If you want to know whether a card is in the Vintage Cube, Ctrl-F on the card list page is faster than any of them.

## FAQ

### Does CubeCobra show a cube's change history?

Yes. Every cube's About tab has a changelog with an entry for each saved edit, and each entry can show the list as it was then.

### How do I compare two cube lists?

Export both as plain text, one card per line, normalize the names, and paste them into Lucky Paper's List Differ or run a command-line diff on the sorted files.

### Where is the MTGO Vintage Cube changelog?

In each update article on mtgo.com and in the drop-down on the [Vintage Cube card list page](https://www.mtgo.com/vintage-cube-cardlist), which also states the list's effective date.

### How often should I export my own cube list?

Every time you change it. A dated text file per version costs nothing and lets you answer "when did we cut that?" in one command.

## Keep the record

A dated file per update and a short note on why is all the tracking most owners need. The game is the reason. The people are the point. Subscribe to The Ludarium newsletter for new cube pieces. If you are in Indianapolis, [Cube Commonwealth](/articles/cube-draft-indianapolis/), our cube group, is relaunching as part of The Ludarium; subscribers hear first when the first night is set.
