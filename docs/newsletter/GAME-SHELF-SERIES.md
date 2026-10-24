# Game Shelf email series

Built in Kit on 2026-10-23. Readers of any of the 34 Game Shelf cluster articles can opt in at the end of the article ("Get the whole series by email."). They then get one short email per article, Tuesday and Friday at 8 a.m. Indiana time, series by series, each teasing an article and linking to it. Every opt-in also gets the newsletter Welcome sequence.

The email copy (subject, preview, HTML for all 40 emails) is in `game-shelf-emails.json` next to this file. Kit is the live copy; edit there, then update the JSON so the two stay in step.

## How it flows

1. **Opt-in form** "Offer: Game Shelf series" (10089038), copied from Ludarium Letters: double opt-in, redirects to `/newsletter/thanks/`, then `/newsletter/confirmed/`. Its confirmation email is rewritten for the series. Site wiring: `KIT_OFFER_FORMS['game-shelf']` in `src/lib/config.ts` and `offer: game-shelf` in each article's frontmatter.
2. **Rule 5664600:** subscribes to form 10089038 → add tag `game-shelf`, add tag `game-shelf-shared-shelf`, subscribe to Welcome (2939465).
3. **Six visual automations chain the six sequences.** Each one: tag `game-shelf-<series>` added → the series sequence → remove that tag → add the next series tag. The last adds `game-shelf-complete`.
4. **Footer links** in every article email: skip to the next series (not in series 6), pause for two weeks, browse the whole series.
5. **The hub** at `/articles/category/game-shelf/` offers the same form above the fold and lists the six series in order with a one-line summary per article (`src/lib/game-shelf.ts`). The emails' "Browse the whole series" link lands there.

| # | Series | Entry tag | Sequence | Automation | Emails |
|---|---|---|---|---|---|
| 1 | The Shared Shelf | `game-shelf-shared-shelf` | 2942240 | 2129881 | 8 + wrap |
| 2 | Building Your Library on Purpose | `game-shelf-building` | 2942244 | 2129899 | 6 + wrap |
| 3 | The Math of Game Night | `game-shelf-math` | 2942245 | 2129907 | 5 + wrap |
| 4 | Smart Buying | `game-shelf-buying` | 2942246 | 2129915 | 6 + wrap |
| 5 | Running a Play Group | `game-shelf-play-group` | 2942248 | 2129924 | 5 + wrap |
| 6 | Library Science for Gamers | `game-shelf-library` | 2942249 | 2129934 | 4 + final wrap |

Every sequence sends only on Tuesday and Friday around 8 a.m. (GMT-4) Indiana (East), every email "after 1 day," so a new subscriber's first email lands on the next Tuesday or Friday. Each sequence excludes `game-shelf-paused`, `game-shelf-complete`, and every later series tag, so a skip stops the old series at once.

**Drafts in series 6:** the emails for `ludarium-classification-system` and `group-shelf-feature` sit in sequence 6 unpublished, because those two articles are still drafts. Publish each email when its article goes live; until then series 6 is two articles plus the wrap-up.

## Skip and pause

Kit link triggers match the clicked URL exactly, so the footer URLs must stay as they are.

| Rule | Link | Adds tag |
|---|---|---|
| 5664611 Game Shelf: skip to Building | `/articles/play-before-you-pay/?utm_source=kit&utm_medium=email&utm_campaign=game-shelf&utm_content=skip-building` | `game-shelf-building` |
| 5664613 skip to Math | `/articles/cost-per-play-explained/?…&utm_content=skip-math` | `game-shelf-math` |
| 5664614 skip to Buying | `/articles/how-to-buy-used-board-games/?…&utm_content=skip-buying` | `game-shelf-buying` |
| 5664615 skip to Play Group | `/articles/how-to-start-a-play-group/?…&utm_content=skip-play-group` | `game-shelf-play-group` |
| 5664617 skip to Library | `/articles/organize-by-role-not-box-size/?…&utm_content=skip-library` | `game-shelf-library` |
| 5664618 Game Shelf: pause | `/articles/category/game-shelf/?utm_source=kit&utm_medium=email&utm_campaign=game-shelf&utm_content=pause` | `game-shelf-paused` |

Automation **Game Shelf: Pause** (2129944): `game-shelf-paused` added → wait 14 days → remove the tag. Kit stops sequence emails while an excluded tag is on and resumes within minutes of its removal, picking up where the subscriber left off (see the Catan plan's research table in `docs/academy/catan/KIT-SEQUENCE.md`). A skip works the same way: the old series stays on hold for good, because each later series tag stays excluded.

## Tags

`game-shelf` 24955239, `game-shelf-shared-shelf` 24955240, `game-shelf-building` 24955241, `game-shelf-math` 24955242, `game-shelf-buying` 24955243, `game-shelf-play-group` 24955244, `game-shelf-library` 24955245, `game-shelf-paused` 24955246, `game-shelf-complete` 24955247.

## Not covered

- Existing newsletter subscribers are not added automatically. To enroll someone by hand, add the `game-shelf-shared-shelf` tag.
- Sequences are a paid Kit feature; the account was on the Creator trial when this was built.
