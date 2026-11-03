# Brief: write one Academy game course (wave 6)

You are writing one free Academy course for theludarium.com, an Astro site for The Ludarium, a tabletop gaming brand. Work ONLY in `/Users/leviwilson/Developer/theludarium-batch` (git branch `academy/wave-6`, already checked out). Four other writers are working in the same folder on other games at the same time, so touch only your own course's files (listed below). Do not run git commands that change state (no commit, checkout, stash, reset). Do not run `npm run build` or the dev server.

## Why this course exists
Search Console shows that deep strategy games with factions, characters, or dense rules (Root, Spirit Island, Dune: Imperium) earn 3 to 8 times more Google impressions per lesson than light games, because players search one specific question at a time ("root exiles and partisans", "spirit island adversaries"). So each lesson should answer one question people actually type into Google, with the keyword in the title and description, and answer it better than anyone else. Accuracy is the brand: these are heavy games and their players will notice a wrong rule.

## Read first (required)
1. `docs/academy/COURSES.md`: the full writer's guide. Follow it exactly: YAML fields, lesson frontmatter, voice, hard rules, setup diagram spec, level ladders, affiliate markers.
2. A finished model course: `src/content/courses/root.yaml` and three lessons in `src/content/course-lessons/root/` (`how-to-play-root.md`, `root-rules-mistakes.md`, `root-battle-odds.md`). Match their depth, tone, and structure. Also look at `public/academy/root/setup.svg` and `public/academy/root/card.svg` for the art style.
3. The project rules in `CLAUDE.md` (brand, no em dashes).

## Shape: 12 lessons, six levels, two lessons per level
Use `format: masterclass` with a `levels:` ladder of 6 levels (0 to 5), exactly 2 lessons per level, `order` 1 to 12. Suggested plan, adapt to the game:
- Level 0 (Learn to play): 1. How to Play <Game> (with the setup diagram). 2. How to Teach <Game> (host script, links the teach sheet `/academy/<slug>/teach-sheet/`).
- Level 1 (Beginner): 3. Rules new players get wrong (sourced from the rulebook, official FAQ, and common rules questions; one `<!-- AT OUR TABLE: ... -->` placeholder). 4. A first-game plan or openings.
- Level 2 (Intermediate) and Level 3 (Advanced): four lessons on the game's highest-search, highest-value topics: factions or characters (one lesson can survey all of them with a plan for each), the core engine or economy, combat or conflict math, scoring math, endgame timing, reading opponents. Pick the topics people search most for this game.
- Level 4 (Tournament ready): one lesson on player counts, variants, and expansions (the home for product links), plus one deep lesson (an advanced technique, setup variant, or competitive setup).
- Level 5 (The championship path): competitive play and where to find it (official or community tournaments, the World Boardgaming Championships if the game has an event there, online play), and a practice plan. If the game has no real tournament scene, label the top levels "Expert" and "Mastery" as the guide says and make them about the hardest challenges.
Every lesson: 600 to 900 words, one idea, frontmatter with `level`, `oneIdea`, `tryThis`, `nextTeaser` (omit on lesson 12), `pubDate: 2026-11-03`, `draft: false`, and a description of 150 to 160 characters exactly that leads with the search keyword. Lesson file names are the URL slugs; make them keyword slugs like the Root ones (`root-vagabond-strategy.md`).

## Files you create (and nothing else)
- `src/content/courses/<slug>.yaml` (with `wave: "6"`, `draft: false`, the `order` and `games` given below, `levels`, a teach sheet that fits one printed page)
- `src/content/course-lessons/<slug>/*.md` (12 files)
- `public/academy/<slug>/setup.svg`: original setup diagram, viewBox `0 0 480 320`, brand palette, labeled zones, accurate to the rulebook setup.
- `public/academy/<slug>/card.svg`: original catalog card art, viewBox `0 0 640 360`, in the style of `public/academy/root/card.svg` (an evocative abstract illustration of the game's table, with a `<title>`; no text labels needed, no publisher art, no logos, no copied iconography).

## Rules accuracy (most important)
- Find and read the current official rulebook (publisher site or PDF, use WebSearch then WebFetch on the publisher's own pages or PDFs) and the official FAQ or errata. Name the edition in `rulesEdition` and the URL in `rulesSource`.
- Every rule statement must match the official rules. Use the game's own terms. When you cannot confirm something from an official source, phrase it generally or leave `<!-- VERIFY: what to check -->`. A VERIFY marker is far better than a confident wrong rule.
- Strategy claims must be defensible: well-established community consensus or simple math you show. No invented win rates or statistics.
- Tournament facts (events, dates, formats) come from a page you opened; otherwise VERIFY.
- Our own words only. Quote at most one short sentence of a rulebook, only when exact wording matters.

## Voice and hard rules (the checker enforces some of these)
- No em dashes or en dashes anywhere, including the SVGs and alt text. Use commas, colons, periods, or "to".
- Banned words: genuinely, honestly, straightforward, delve, elevate, game-changer, unlock, journey, ultimate, must-have, "dive in". (If the game has an official term that hits this list, write around it.)
- Never say "non-gamers". Do not overpromise.
- No first-person stories of play ("at our table", "when we played"). Use the AT OUR TABLE placeholder for spots where Levi's own notes would help.
- No Ludarium events exist yet: no Ludarium game nights, leagues, or an open lounge. For local play, point to the publisher's store locator or organized play, BoardGameGeek forums, online platforms, and `/lounges/indianapolis/` ("first word on local learn-to-play nights as The Ludarium grows").
- No prices anywhere.

## Product links (the Level 4 player counts and expansions lesson, and anywhere a product is named as a purchase)
Levi's rule: link games and expansions to Amazon with the tag `cubecommonw0a-20`, as `https://www.amazon.com/dp/<ASIN>?tag=cubecommonw0a-20`. Do not link any other store. Find ASINs ONLY with WebSearch using `allowed_domains: ["amazon.com"]`; never WebFetch an Amazon page. If you cannot find a confident ASIN for a product, name it unlinked and leave `<!-- AFFILIATE: product name -->` after the paragraph. Publisher pages may be linked for rules, FAQs, and news (not as a store).

## Internal links
Search `src/content/articles/` for the game's name and link the most relevant existing articles where they help; list them in `related` in the YAML (slugs = file names without .md; only slugs that exist). Good general ones exist too, such as `how-to-teach-a-board-game`, `area-control-board-games`, `analysis-paralysis-board-games`, `board-game-weight-explained`, `expansions-worth-it`. Link lessons within your own course as `/academy/<slug>/<lesson-slug>/`.

## Finish
1. Run `node scripts/check-course.mjs <slug>` (Node is at `/Users/leviwilson/.local/node/bin`, so use `PATH=/Users/leviwilson/.local/node/bin:$PATH`). Zero errors required. Fix notes about word counts too.
2. Re-read your own lessons once for rule accuracy against the rulebook.
3. Reply with a short report: the 12 lesson titles with slugs, the rulebook edition and URL you used, every VERIFY and AFFILIATE marker you left (file and one line each), the AT OUR TABLE placeholders, Amazon ASINs used, and anything you were unsure of. Keep it under 400 words.
