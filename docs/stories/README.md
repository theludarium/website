# The recurring stories

Three stories run on a fixed calendar from the Ludometer and the industry pages (plan sections 7 and 8). They need data that does not exist yet: the Ludometer's own snapshots start the day the Worker is deployed, and the first Shelf Life report checks the SPIEL 2026 cohort at three months on January 26, 2027. This file holds the templates and checklists so each issue is assembly, not invention.

| Story | Cadence | First issue | Where |
| --- | --- | --- | --- |
| Ludometer Reading | Weekly, Tuesday 7 am ET | November 3, 2026 (by hand from BGG's public Hotness page until the license) | Ludarium Letters section; mirrored on /ludometer once live |
| Shelf Life | Quarterly, last Tuesday of Jan, Apr, Jul, Oct | January 26, 2027 | Site article (Game Culture), newsletter summary, video |
| The Ludarium Ledger | Quarterly, last Thursday of Jan, Apr, Jul, Oct | January 28, 2027 | Site column (Game Culture), newsletter summary |

## Ludometer Reading (400 to 600 words)

1. One-sentence read of the week.
2. Three to five movers. For each: the game, what moved (attention rank and Ludarium plays), the trigger (release, award, convention, video, crowdfunding), a verdict (hot or lasting), and one action (teach sheet, course, Watch this game).
3. Hot against played: one game high on attention but not on tables, and one the reverse.
4. Next week's triggers.

**Verdict rule** (say which one fired): *hot* when the trigger is a one-off event and the rating count is still small; *lasting* when the rating count has grown three weeks running and plays show up in the app.

**Monday, about 90 minutes:** pull the movers (the Worker's admin page, or BGG's public Hotness page by hand until then) · find each trigger and link it · write 60 words per mover, the pair, and next week · paste into the Kit broadcast template (the Worker's `/api/ludometer/admin/broadcast` drafts it) and schedule for Tuesday 7 am ET · Thursday: one Short on the top mover.

The first five issues are decided: November 3 (what stuck after SPIEL), November 10 and 17 (the pre-BGG.CON watch, with Wave 1 courses as the actions), November 24 (BGG.CON, November 18 to 22), December 8 (PAX Unplugged, December 4 to 6).

## Shelf Life (1,200 words, one chart, one dataset)

The cohort is every game that entered the attention list in a quarter, revisited at 3, 6 and 12 months: rank then and now, rating-count growth, average-rating change, owner growth, Ludarium plays, and a verdict (graduated, faded, too early). Open with the cohort's graduation rate, show the chart, name the three graduates and the three biggest fades, close with what the pattern says about next quarter. Say plainly how far back the data goes.

**Working graduation rule** (calibrate after two reports): still inside BGG's top 500, rating count at least three times its first-week figure, average rating within 0.2 points of where it started.

**Components (MDX article):**

```mdx
import ScatterChart from '@/components/mdx/ScatterChart.astro';
import GatedDownload from '@/components/mdx/GatedDownload.astro';

<ScatterChart
  title="SPIEL 2026 cohort at three months"
  xLabel="Rating count growth" xSuffix="x"
  yLabel="Average rating change"
  groups={['Graduated', 'Faded', 'Too early']}
  points={[{ label: 'Game', x: 3.4, y: 0.05, group: 'Graduated' }]}
  labelled={['Game']}
  source="The Ludarium's daily snapshots of BGG data. Powered by BGG."
/>

<GatedDownload kind="dataset" title="Get the cohort data" text="Every game in the cohort, every measure, as a CSV." />
```

**Two days:** day 1 pull the cohort and export the CSV · day 2 compute the rate, chart, write, QA every figure against the data, publish with the gated CSV, send the summary, record the video.

## The Ludarium Ledger (1,000 words, one chart)

Five numbers that moved this quarter, one chart, then four short sections: who is winning (public company results), crowdfunding totals, tariffs and prices, what it means for players and store owners. Close with one Ludarium note. The audience is publishers and store owners; keep every figure sourced and plain.

**Calendar:** January, the year in numbers (ICv2's prior-year report, Hasbro, Asmodee, the holiday tariff picture, Kickstarter's year). April, ICv2's new annual report and Q1. July, pre-Gen Con with Q2. October, post-SPIEL and the holiday outlook with Q3. Re-pull every quarter: Hasbro and Asmodee investor pages, Games Workshop results, ICv2, BoardGameWire, Kickstarter tabletop totals, the tariff trackers.

**Components (MDX article):**

```mdx
import FiveNumbers from '@/components/mdx/FiveNumbers.astro';
import BarChart from '@/components/mdx/BarChart.astro';
import GatedDownload from '@/components/mdx/GatedDownload.astro';

<FiveNumbers period="Q4 2026" numbers={[{ label: 'Hobby games market, 2025', value: '$3.66B', change: '+40%', vs: '2024', source: 'ICv2', url: 'https://icv2.com/...' }]} />
<BarChart title="Tabletop funding on Kickstarter, by year" bars={[{ label: '2025', value: 0 }]} prefix="$" suffix="M" source="Kickstarter" />
<GatedDownload kind="ledger" title="Get the Ledger first" text="The industry edition arrives a day before the public column." />
```

**Two days:** day 1 pull filings and trade reports and fill the five numbers · day 2 chart, write, QA every figure against its source, publish, send to the ledger tag first and the main list second.

## Shared QA (every piece)

Every rule or number traced to its source and linked · notice line, affiliate disclosure and image credits where they apply · original images only · short sentences, plain words, no em dashes · links clicked, phone layout checked, test send received · title and description carry the top keyword.
