# The Ludarium Catalog: system spec (v1)

The source of truth for how games are filed and how picks are scored. The prototype in `tools/card-catalog/prototype-artifact.html` implements exactly this.

## Call numbers

`<subsection> <cutter> <year>`, for example `520 WIN 2019` (Wingspan). The cutter is the first three letters of the title without a leading "The", "A" or "An". Classics with no publication year leave the year off (`310 EUC`). A game goes on one shelf only, chosen by its main activity.

| Shelf | Name | Subsections |
| --- | --- | --- |
| 000 | Party & Dexterity | 010 Word games, 020 Guessing & wavelength, 030 Drawing, 040 Storytelling, 050 Dexterity |
| 100 | Deduction & Hidden Roles | 110 Hidden roles, 120 Bluffing & clue-giving, 130 Logic deduction, 140 Co-op deduction |
| 200 | Cooperative | 210 Crisis management, 220 Limited communication, 230 Heavy co-op, 240 Two-player co-op |
| 300 | Classic Cards | 310 Trick-taking, 320 Pegging & melding, 330 Shedding & climbing |
| 400 | Drafting & Collecting | 410 Card drafting, 420 Sets & routes |
| 500 | Engines & Tableaus | 510 Deck-building, 520 Tableau engines, 530 Economic engines, 540 Worker placement |
| 600 | Head-to-Head | 610 Dice brawls, 620 Asymmetric conflict, 630 Area control, 650 Racing |
| 700 | Trade & Negotiation | 710 Trading, 720 Negotiation & bribes, 730 Auctions |
| 800 | Abstract & Puzzle | 810 Tile & pattern, 820 Spatial puzzles, 830 Classic abstracts |
| 900 | Story & Campaign | 910 Dungeon campaigns, 920 Mystery & narrative, 930 Living card campaigns |

## The six feel dimensions

Each has three levels, stored as 1, 2 or 3.

| Key | Dimension | 1 | 2 | 3 |
| --- | --- | --- | --- | --- |
| `theme` | Theme | Abstract | Themed | Immersive |
| `luck` | Chance | Luck-driven | Tactical | Skill-driven |
| `inter` | Interaction | Solo-ish | Indirect | Direct |
| `learn` | Learning | Intuitive | Moderate | Heavy |
| `tempo` | Tempo | Light | Thoughtful | Intense |
| `talk` | Table Talk | Quiet | Chatty | Raucous |

The first five come from Tabletop Library's classification. **Table Talk is The Ludarium's addition** and is always filed by hand, never derived from BGG. Co-op games rate Direct on Interaction.

## Game record

```json
{
  "name": "Wingspan", "shelf": "500", "sub": "520", "call": "520 WIN 2019", "year": 2019,
  "dims": {"theme": 2, "luck": 2, "inter": 1, "learn": 2, "tempo": 2, "talk": 1},
  "players": [1, 5], "best": [3, 4], "minutes": 70,
  "occasions": ["Date night", "Game group"]
}
```

Occasions: Date night, Family, New friends, Team building, Game group, Two-player.

## Play Profile

Each signal adds a weight to the three-level row of every dimension the game sits on.

| Signal | Weight |
| --- | --- |
| Rating 5 / 4 / 3 / 2 / 1 stars | +2 / +1 / 0 / -1 / -2 |
| Can teach | +1 |
| Want to learn | +0.5 |
| Logged play, "play again: yes" | +0.5 each |
| Logged play, "probably not" | -0.5 each |
| Unrated but played | +0.15 per play, up to 4 plays |
| Not for me | Veto: -3, and never recommended |

A profile makes picks after 3 games carry weight. Confidence label: under 3 "Getting to know you," under 10 "Taking shape," then "Confident."

## Fit for one person

For each dimension with any weight: `score += (row[level] - mean(row)) / (sum(|row|) + 1)`, multiplied by 1.5 for Table Talk. Centering on the mean makes a miss count against the game. Personal picks add up to ±0.5 for shelf affinity. As a percentage: `1 / (1 + e^(-2.2 × score))`.

## Group picks (Game night)

1. **Hard rules first, in code:** player count inside the box range; occasion if chosen; "owned by someone here" if chosen; any Not for me at the table removes the game; estimated time over the limit removes it; a Heavy game needs someone at the table who can teach it or has played it.
2. **Estimated time** is the median of logged minutes at that player count, otherwise the box time.
3. **Group fit** is the geometric mean of each confident member's fit (floor 0.02). Members with fewer than 3 games are shown as "new" and left out of the mean.
4. **Adjustments:** +0.06 when someone can teach and someone else wants to learn; +0.03 when only a learner is present; +0.05 when the player count is in the game's best range, -0.03 when it is outside a known best range; -0.03 when everyone has already played it.
5. **Slate:** top 5, plus one Discovery pick from a shelf not in the top 5 with at least 40% fit.
6. **Guests** (no account) get a preference row of +2 on each level they pick. Picking an extreme (level 1 or 3) also puts -1 on the other extreme.
7. **The Librarian (AI):** given the top 24 games that pass the rules, each member's likes and dislikes, and the mood text, Claude returns up to 5 indices with a one-line reason. Code drops invalid or duplicate indices. Picks go stale when the table or filters change.

## Logged play

`{date, players, minutes, taught, result: won|lost|coopwin|cooplost|none, with[], again: yes|maybe|no, energy: 1 quiet|2 chatty|3 raucous, note}`. `energy` is the togethering outcome: over time it checks each game's Table Talk level against real tables.
