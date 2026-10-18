# Batch 5 writer instructions (read with BRIEF.md, WRITER3.md and ARTICLES5.md)
- WRITER3.md rules apply, with ARTICLES5.md as the table and /home/claude/ludarium/articles5/ as the folder. Category: "Cube Commonwealth".
- Audience: Magic players who cube or want to. Be concrete: name real cards, real archetypes, real numbers (counts per section, curve targets), and say when a number is a house guideline rather than a standard.
- Do not repeat the 30 existing Magic/Cube articles (articles2/mtg-*, articles4/cube-*); read their front matter and link to them instead.
- Searching is allowed and expected for anything current: set names and card lists, MTGO Vintage Cube update posts, CubeCobra features, public cube lists. Link sources inline. Anything you state from memory that is a date, price, count, or a claim about a named cube or person gets <!-- VERIFY -->.
- Never invent quotes, people, or cube lists. For member spotlights and interviews, write a template with <!-- EDITOR: ... --> placeholders.
- The signature line once, one italic mid-article newsletter line, closing CTA: subscribe plus join Cube Commonwealth (/articles/cube-draft-indianapolis).
- Where the table has <placeholders> (set reviews), replace them with real sets after searching, update file names/slugs/titles accordingly, and report what you chose.
- Run `python3 -I /home/claude/ludarium/check.py /home/claude/ludarium/articles5`, fix your files, report one line per article.
