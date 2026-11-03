# Brief: Academy search quick wins (2026-11-03)

Search Console shows these Academy lessons already ranking on page one or two of Google (positions 5 to 15) for specific searches. The goal is to move each one up by answering the search directly: in the title, the description, and the first lines of the lesson. This is editing, not new courses.

Work ONLY in `/Users/leviwilson/Developer/theludarium-batch` (branch `academy/quick-wins`, already checked out), and only on the files your task names. Other agents are editing other lessons in the same folder at the same time. No git commands that change state, no `npm run build`, no dev server.

## Rules
- Read `docs/academy/COURSES.md` (voice and hard rules) and follow it. No em or en dashes, no banned words, no "non-gamers", no first-person play stories, no prices, no claims that Ludarium events exist.
- **Never change a lesson's file name** (that is its URL, and Google already has it). Do not change `order` or `level`.
- **Title:** lead with the words people search (given in your task). Keep it under 65 characters. Keep the topic the lesson already covers in the title too, since it ranks for those words as well.
- **Description:** 150 to 160 characters exactly, opening with the direct answer.
- **First paragraph:** answer the search in one or two plain sentences, before anything else. Then the lesson continues as it was. Add a short section or table where your task asks for one. Keep lessons under 1,200 words.
- **Accuracy:** every fact you add (player counts, rules, numbers) must come from the official rulebook or publisher page, which you open with WebSearch and WebFetch. "Best at" claims: only say what the publisher says, or say plainly what changes at each count. Do not quote BoardGameGeek poll numbers. If you cannot confirm something, leave `<!-- VERIFY: what to check -->` rather than guess.
- **Links:** Amazon only, as `https://www.amazon.com/dp/<ASIN>?tag=cubecommonw0a-20`, found only with WebSearch `allowed_domains: ["amazon.com"]` (never fetch Amazon). Keep existing links as they are.
- Run `PATH=/Users/leviwilson/.local/node/bin:$PATH node scripts/check-course.mjs <slug>` for every course you touched. Zero errors.

## Report
Under 300 words: per file, the old title and the new title, what you added, and any VERIFY markers.
