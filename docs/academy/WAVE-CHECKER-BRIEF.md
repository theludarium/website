# Brief: fact-check one Academy course (wave 6)

You are the second reader on a free Academy course for theludarium.com. A writer just finished it. Your job is to catch wrong rules, unsupported claims, and style breaks before Levi (the owner) sees it. Work ONLY in `/Users/leviwilson/Developer/theludarium-batch` and only on your course's files: `src/content/courses/<slug>.yaml`, `src/content/course-lessons/<slug>/*.md`, `public/academy/<slug>/setup.svg`, `public/academy/<slug>/card.svg`. Other agents are editing other courses in the same folder. No git commands that change state, no `npm run build`.

Read `docs/academy/COURSES.md` first for the rules the course must follow.

## What to check
1. **Rules accuracy, every rule statement.** Open the official rulebook and FAQ or errata yourself (publisher site or PDF, via WebSearch and WebFetch), independently of the writer. Check every number, every setup step, every turn step, every scoring rule, the teach sheet, the FAQ answers, the setup diagram (does it match the rulebook setup?), and the YAML facts (players, play time, ages). Fix what is wrong directly in the files. Where the official sources do not settle it, rewrite it more generally or leave `<!-- VERIFY: what to check -->`. Remove VERIFY markers the writer left if you can confirm the fact from an official source.
2. **Strategy claims.** Cut or soften anything presented as fact without support: invented percentages, win rates, "the best faction" claims that are not community consensus. Simple math the lesson shows is fine; check the math.
3. **Facts about tournaments, events, online platforms, dates.** Each must come from a page you can open. Otherwise VERIFY or cut.
4. **Product links.** Amazon links must be `https://www.amazon.com/dp/<ASIN>?tag=cubecommonw0a-20`. Spot-check ASINs with WebSearch using `allowed_domains: ["amazon.com"]` (never WebFetch Amazon). Wrong or doubtful: remove the link, keep the name, and add `<!-- AFFILIATE: product name -->`. No links to other stores. No prices anywhere.
5. **Style.** No em or en dashes; none of the banned words; no "non-gamers"; no first-person play stories; no claims that Ludarium events or an open lounge exist; plain words, short sentences, warm and never gatekeepy. Each lesson keeps one AT OUR TABLE placeholder only where useful (lesson 3 must have one). Descriptions 150 to 160 characters. Internal links point to real files (`src/content/articles/<slug>.md`, or lessons in this course).
6. **Copyright.** No rulebook passages copied (one short quoted sentence at most), no publisher art in the SVGs.

## Finish
Run `PATH=/Users/leviwilson/.local/node/bin:$PATH node scripts/check-course.mjs <slug>` and get zero errors. Reply with a short report (under 300 words): each fix you made (file and one line), markers you added or removed, anything still doubtful, and your confidence that the rules are now correct.
