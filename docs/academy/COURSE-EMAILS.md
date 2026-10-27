# Game course emails in Kit

Every game course (src/content/courses/) can send its lessons by email, one lesson per email, using the template in `LESSON-EMAIL.md`. This file maps what exists in Kit and how to add the next course. Built 2026-10-26: the five Start here courses first, then the other 26 the same day. Riftbound waits until it is published.

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
| Azul | Academy: Azul 10099858 | course-azul 25046867 | Course: Azul 2945007 | 13 | 5668775 |
| Carcassonne | Academy: Carcassonne 10099859 | course-carcassonne 25046883 | Course: Carcassonne 2945008 | 19 | 5668777 |
| Pandemic | Academy: Pandemic 10099861 | course-pandemic 25046888 | Course: Pandemic 2945012 | 17 | 5668778 |
| King of Tokyo | Academy: King of Tokyo 10099862 | course-king-of-tokyo 25046891 | Course: King of Tokyo 2945013 | 13 | 5668779 |
| Splendor | Academy: Splendor 10099864 | course-splendor 25046896 | Course: Splendor 2945014 | 13 | 5668783 |
| Cascadia | Academy: Cascadia 10099865 | course-cascadia 25046902 | Course: Cascadia 2945015 | 18 | 5668784 |
| Flip 7 | Academy: Flip 7 10099867 | course-flip-7 25046906 | Course: Flip 7 2945016 | 13 | 5668785 |
| Sky Team | Academy: Sky Team 10099870 | course-sky-team 25046910 | Course: Sky Team 2945018 | 13 | 5668787 |
| Heat | Academy: Heat 10099872 | course-heat 25046917 | Course: Heat 2945019 | 18 | 5668788 |
| 7 Wonders | Academy: 7 Wonders 10099875 | course-7-wonders 25046923 | Course: 7 Wonders 2945020 | 18 | 5668790 |
| Everdell | Academy: Everdell 10099878 | course-everdell 25046928 | Course: Everdell 2945021 | 18 | 5668791 |
| Terraforming Mars | Academy: Terraforming Mars 10099879 | course-terraforming-mars 25046934 | Course: Terraforming Mars 2945023 | 22 | 5668793 |
| Dinosaur Island | Academy: Dinosaur Island 10099884 | course-dinosaur-island 25046942 | Course: Dinosaur Island 2945024 | 18 | 5668797 |
| Dune: Imperium | Academy: Dune: Imperium 10099889 | course-dune-imperium 25046947 | Course: Dune: Imperium 2945025 | 22 | 5668798 |
| Ark Nova | Academy: Ark Nova 10099892 | course-ark-nova 25046956 | Course: Ark Nova 2945026 | 22 | 5668806 |
| Root | Academy: Root 10099897 | course-root 25046959 | Course: Root 2945028 | 21 | 5668808 |
| Brass: Birmingham | Academy: Brass: Birmingham 10099901 | course-brass-birmingham 25046968 | Course: Brass: Birmingham 2945030 | 21 | 5668810 |
| Spirit Island | Academy: Spirit Island 10099905 | course-spirit-island 25046972 | Course: Spirit Island 2945032 | 23 | 5668817 |
| Dominion | Academy: Dominion 10099909 | course-dominion 25046975 | Course: Dominion 2945035 | 22 | 5668819 |
| Lost Ruins of Arnak | Academy: Lost Ruins of Arnak 10099912 | course-lost-ruins-of-arnak 25046980 | Course: Lost Ruins of Arnak 2945036 | 17 | 5668821 |
| Castles of Burgundy | Academy: Castles of Burgundy 10099915 | course-castles-of-burgundy 25046988 | Course: Castles of Burgundy 2945037 | 22 | 5668823 |
| Power Grid | Academy: Power Grid 10099916 | course-power-grid 25046995 | Course: Power Grid 2945038 | 21 | 5668825 |
| One Piece | Academy: One Piece 10099920 | tcg-one-piece-card-game 25047025 | Course: One Piece 2945039 | 22 | 5668827 |
| Lorcana | Academy: Lorcana 10099924 | tcg-lorcana 25047033 | Course: Lorcana 2945041 | 22 | 5668829 |
| Yu-Gi-Oh! | Academy: Yu-Gi-Oh! 10099926 | tcg-yugioh 25047041 | Course: Yu-Gi-Oh! 2945043 | 22 | 5668830 |
| Cube draft | Academy: Cube draft 10099930 | tcg-cube-draft 25047043 | Course: Cube draft 2945044 | 23 | 5668833 |

Shared: tag `academy-paused` 25038863, pause rule 5668327, automation Academy: Pause 2139548. Catan keeps its own level-based setup (`docs/academy/catan/`).

## Adding a course

1. `node scripts/course-emails.mjs <slug> [<slug> ...] <out-dir>` writes one JSON file per course (subject, preview text, HTML per lesson) and an HTML preview to read through first.
2. In Kit: create the tag (`course-<slug>`, or `tcg-<slug>`), duplicate an existing "Academy: <Game>" form, then change its two redirect URLs, the confirmation email's subject, course title, game name and button text, and rename it.
3. Create the sequence "Course: <Game>" with the same settings as the others (8 a.m. Indiana (East), exclude `academy-paused`), delete the blank email Kit adds, and load the lessons: lesson 1 "as soon as possible" every day, every other lesson "after 1 day" on Tuesday and Friday only. Publish every email.
4. Add a rule: subscribes to the form, then subscribe to the sequence and add the tag.
5. Add the form's action URL to `KIT_COURSE_FORMS`, build, check the preview, and do a test signup.

The 2026-10-26 build loaded the emails through the same requests Kit's own editor makes, from a signed-in browser session; the notes for that are in the session log, not here, because Kit can change its internals at any time. Building by hand in the editor works the same way, just slower.
