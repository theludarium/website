# Writing an article

1. Add a file to `src/content/articles/`. The file name becomes the URL:
   `how-to-teach-a-board-game.md` is published at `/articles/how-to-teach-a-board-game/`.
   Use lowercase words and hyphens. Use `.mdx` instead of `.md` when the article needs components (such as affiliate links).
2. Start the file with this frontmatter:

```yaml
---
title: How to Teach a Board Game in Five Minutes
description: 150 to 160 characters. This is the snippet people see in Google and when the link is shared.
pubDate: 2026-10-14
updatedDate: 2026-11-02     # optional, only when you revise it
category: Game Guides       # Game Guides, Game Night, Togethering, or Game Culture
tags: [teaching, beginners]
heroImage: ./images/teach-hero.jpg   # optional, path relative to the article
heroAlt: Four friends leaning over a board game   # required if heroImage is set
draft: true
---
```

3. Write the article below the frontmatter in Markdown. Use `##` for sections and `###` for sub-sections. Articles with three or more `##` sections get a table of contents automatically.
4. **Drafts:** `draft: true` keeps an article off the live site. Drafts still show, with a Draft badge, when you run the site locally and on Cloudflare preview links for any branch other than `main`. Set `draft: false` to publish.
5. Reading time, related articles, the end-of-article signup, and the share and search metadata are all automatic.

House rules: no em dashes anywhere. Plain words, short sentences. The build stops with a clear message if the description is the wrong length, the category is misspelled, or a hero image has no alt text.

## Affiliate links

Use an `.mdx` file, import the two components after the frontmatter, and put the notice near the top:

```mdx
import AffiliateLink from '@/components/mdx/AffiliateLink.astro';
import AffiliateNotice from '@/components/mdx/AffiliateNotice.astro';

<AffiliateNotice />

Our favorite two-player game is <AffiliateLink href="https://example.com/your-link">Patchwork</AffiliateLink>.
```

`AffiliateLink` marks the link `rel="sponsored noopener"` and opens it in a new tab. `AffiliateNotice` links to the disclosure page.

## Linking to other articles

Link freely to any article with `/articles/<slug>/`, published or not. On the live site, a link to an article that is still a draft shows as plain text, and it turns into a real link automatically the day that article publishes. The build fails if a link points at a page that does not exist at all.
