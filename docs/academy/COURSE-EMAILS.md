# Game course emails in Kit

Every game course (src/content/courses/) can send its lessons by email, one lesson per email, using the template in `LESSON-EMAIL.md`. This file maps what exists in Kit and how to add the next course. Built 2026-10-26 for the five Start here courses; the other courses follow the same steps.

## How a signup flows

1. The course page's form (`CourseForm.astro`) posts first name and email to the course's Kit form (`KIT_COURSE_FORMS` in `src/lib/config.ts`).
2. Kit redirects to `/academy/<slug>/thanks/` and sends the double opt-in email ("One click to start your <Game> lessons").
3. The confirm button lands on `/academy/<slug>/confirmed/`, which links lesson one.
4. A Kit rule on the form subscribes them to the course's sequence and adds the course tag.
5. Lesson 1 sends as soon as they confirm. Every later lesson sends one day after the one before, only on Tuesday or Friday, around 8 a.m. Indiana (East). A 22-lesson course takes about ten weeks.
6. Every email's footer has "Pause your Academy lessons for two weeks". The link fires rule 5668327, which adds `academy-paused`; every course sequence excludes that tag, and automation **Academy: Pause** (2139548) removes it after 14 days, so lessons pick up where they left off. One pause covers every course a reader is taking.

The pause URL must stay exactly `https://theludarium.com/academy/?utm_source=kit&utm_medium=email&utm_campaign=academy&utm_content=pause` (Kit link triggers match the whole URL).

## What exists

| Course | Form | Tag | Sequence | Emails | Rule |
| --- | --- | --- | --- | --- | --- |
| Ticket to Ride | Academy: Ticket to Ride 10098564 | course-ticket-to-ride 25038877 | Course: Ticket to Ride 2944583 | 19 | 5668321 |
| Wingspan | Academy: Wingspan 10098569 | course-wingspan 25038880 | Course: Wingspan 2944590 | 18 | 5668323 |
| Codenames | Academy: Codenames 10098583 | course-codenames 25038881 | Course: Codenames 2944591 | 13 | 5668324 |
| Pokémon TCG | Academy: Pokémon TCG 10098588 | tcg-pokemon-tcg 25038882 | Course: Pokémon TCG 2944592 | 22 | 5668325 |
| Magic | Academy: Magic: The Gathering 10098589 | tcg-magic 25038883 | Course: Magic: The Gathering 2944593 | 22 | 5668326 |

Shared: tag `academy-paused` 25038863, pause rule 5668327, automation Academy: Pause 2139548. Catan keeps its own level-based setup (`docs/academy/catan/`).

## Adding a course

1. `node scripts/course-emails.mjs <slug> [<slug> ...] <out-dir>` writes one JSON file per course (subject, preview text, HTML per lesson) and an HTML preview to read through first.
2. In Kit: create the tag (`course-<slug>`, or `tcg-<slug>`), duplicate an existing "Academy: <Game>" form, then change its two redirect URLs, the confirmation email's subject, course title, game name and button text, and rename it.
3. Create the sequence "Course: <Game>" with the same settings as the others (8 a.m. Indiana (East), exclude `academy-paused`), delete the blank email Kit adds, and load the lessons: lesson 1 "as soon as possible" every day, every other lesson "after 1 day" on Tuesday and Friday only. Publish every email.
4. Add a rule: subscribes to the form, then subscribe to the sequence and add the tag.
5. Add the form's action URL to `KIT_COURSE_FORMS`, build, check the preview, and do a test signup.

The 2026-10-26 build loaded the emails through the same requests Kit's own editor makes, from a signed-in browser session; the notes for that are in the session log, not here, because Kit can change its internals at any time. Building by hand in the editor works the same way, just slower.
