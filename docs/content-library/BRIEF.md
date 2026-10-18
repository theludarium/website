# The Ludarium — Writer's Brief

## Brand
- The Ludarium (theludarium.com): a game lounge venture starting in Indianapolis. Long-term: membership-based lounges (coworking, but for playing tabletop games together). Near-term revenue: content → community → e-products (RPG demo PDFs), affiliate links, and a corporate tabletop events service (leadership/team training for HR).
- Mission line: "Togethering for a lifetime." Short form: "Never stop playing."
- "Togethering" (noun): people coming together, usually in person, to share life. The tabletop game is just the medium that initiates and guides the time together.
- Signature line, use once per article, usually near the close: "The game is the reason. The people are the point."
- Connected: Cube Commonwealth (the founder's Magic: The Gathering Cube community); the LEV Institute (longevity ethics — games as mental/social health).

## Voice
- Warm, confident, plain. Short sentences. No hype, no corporate speak, no emoji.
- Specifics over adjectives. Concrete examples from real, well-known games (Catan, Codenames, Wingspan, Pandemic, Ticket to Ride, Azul, The Crew, Wavelength, Gloomhaven, D&D, etc.).
- Never use the words "genuinely", "honestly", "straightforward", "delve", "unlock", "elevate", "game-changer".
- Health/science claims: name the source in prose (e.g., Harvard Study of Adult Development, U.S. Surgeon General's 2023 loneliness advisory), hedge figures as approximate, and add a `<!-- VERIFY -->` HTML comment after any statistic so the editor links a source before publishing. Never invent studies or numbers.
- Write for a smart general reader, not hobbyists only.

## SEO structure (every article)
Front matter block at top, YAML:
```
---
title: <SEO title, ≤60 chars, primary keyword near the front>
slug: <kebab-case>
meta_description: <≤155 chars, includes keyword, has a reason to click>
primary_keyword: <phrase>
secondary_keywords: [<3-5 phrases>]
category: <one of the two categories>
reading_time: <N min>
---
```
Then:
- H1 = the article title (may differ slightly from SEO title; can be more human).
- Lead paragraph: answers the search intent in the first 2–3 sentences; primary keyword appears naturally in the first 100 words.
- H2s phrased as questions or clear statements that match related searches; include the keyword or a close variant in 2–3 H2s, not all.
- 1,200–1,800 words. Short paragraphs (≤3 sentences). Bulleted or numbered lists where the content is parallel. One table if it clarifies a comparison.
- One "FAQ" H2 near the end with 3–4 questions as H3s and 1–2 sentence answers (featured-snippet bait).
- Internal links: 2–3 placeholders in the form `[anchor text](/articles/<slug-of-another-article-from-this-batch>)` — use the slugs listed in ARTICLES.md.
- Close with a short call to action whose primary ask is to SUBSCRIBE TO THE LUDARIUM NEWSLETTER. Vary the wording per article; tie it to the article's topic (e.g., "Get one game-night idea a week" or "New articles on play and health, first to subscribers"). Mention the Indianapolis lounge in passing where natural. For workplace articles, the CTA is the corporate events service first, then the newsletter. No hard sell; 2–4 sentences, under its own H2 or as a closing paragraph.
- Also place ONE mid-article newsletter mention, a single italic line after a major section, e.g. *If this is useful, the newsletter sends one piece like it every week.* Keep it to one line.
- No keyword stuffing. Read it aloud test: if a sentence only exists for Google, cut it.
