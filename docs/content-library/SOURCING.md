# Sourcing pass — instructions

Goal: every `<!-- VERIFY -->` tag in your assigned files is resolved so a reader can trust the claim and click through to the source.

For each tag:
1. Read the sentence(s) before it. Use WebSearch (and WebFetch to open the page) to find a reputable primary or near-primary source: the study itself, the publishing institution, a government agency, a major outlet reporting the study, the publisher's own page for game facts, or BoardGameGeek for game data. Do not use content farms or AI-written summaries.
2. If a source supports the claim: adjust the sentence so the figure and wording match the source (keep "roughly"/"about" if the source gives a range), add an inline markdown link on the most natural phrase, e.g. `the [2023 Surgeon General advisory](https://www.hhs.gov/...)`, and delete the `<!-- VERIFY -->` tag.
3. If the source contradicts the claim: fix the claim to match the source, link it, delete the tag.
4. If you cannot find a source within two or three searches: remove the specific number and rewrite as a hedged qualitative statement, or cut the sentence, so nothing unverifiable remains. Delete the tag. Leave an `<!-- EDITOR: could not source; softened -->` comment only when the cut changes the argument.
5. Never paraphrase a source closely or quote more than a short phrase; write the claim in the article's own voice.
6. Keep the article's voice, length band (1,200–1,800 body words), and structure. Do not add new sections. Do not touch anything that isn't tied to a VERIFY tag, except that you may add a short "Sources" H2 at the very end listing the links you used (title + URL) if there are three or more.
7. Prices and costs: link to the publisher, a major retailer, or a market report; if none, give a wider range and say "at the time of writing".

When done, run `python3 -I /home/claude/ludarium/check.py <folder>` and confirm your files still pass (word count, links, signature line). Report: per file, tags resolved with a source vs. softened/cut, and any claims you changed materially.
