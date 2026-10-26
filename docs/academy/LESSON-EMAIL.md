# Lesson email template (Kit)

One email per lesson, in each course's Kit sequence. The lesson lives on theludarium.com; the email teases it and sends the reader there. Build the sequence when the course's Kit form exists (`KIT_COURSE_FORMS` in `src/lib/config.ts`).

## Timing

Level ladder courses (October 2026 on): lesson 1 as soon as the reader confirms, then every lesson one day after the last, on Tuesdays and Fridays only, around 8 a.m. Indiana time. See `COURSE-EMAILS.md`. The table below is the original plan for the 8-lesson formats.

| Format | Sequence |
| --- | --- |
| Full course (8) | Lesson 1 at once, lessons 2 and 3 on days 2 and 4, lessons 4 to 8 weekly |
| Masterclass (7) | Lesson 1 at once, lesson 2 on day 3, lessons 3 to 7 weekly |
| Teach It Tonight (2) | Lesson 1 at once with the teach sheet, lesson 2 on day 2 |
| TCG (8) | Lesson 1 at once, then one lesson every 3 days; set alerts go to the same tag before each set |

## The email

- **Subject:** the lesson's `emailSubject`.
- **Preview text:** the lesson's `oneIdea`, cut to about 90 characters.
- **Body** (paste as HTML, the same way the Catan and Game Shelf emails were built):

```html
<p>Hi {{ subscriber.first_name | default: "there" }},</p>
<p><strong>Lesson N of 8: LESSON TITLE</strong></p>
<p>HOOK: two sentences, in our own words, from the lesson's opening.</p>
<p><strong>The one idea:</strong> ONE IDEA.</p>
<p><a href="https://theludarium.com/academy/SLUG/LESSON-SLUG/?utm_source=kit&amp;utm_medium=email&amp;utm_campaign=course-SLUG&amp;utm_content=lesson-N"><strong>Read lesson N &rarr;</strong></a></p>
<p><strong>At your next game:</strong> TRY THIS.</p>
<p>Levi<br>The Ludarium</p>
<p>P.S. THE ONE-STEP MOVE (below).</p>
```

One link to the lesson, nothing else competing with it.

## The P.S. move, by lesson

| Lesson | P.S. |
| --- | --- |
| 1 | Reply with the one rule that confused your table; it shapes lesson 3. |
| 2 | Forward this to your game group, and print the teach sheet (link). |
| 3 | The teach sheet link again, for the friend who missed game night. |
| 4 to 6 | One related Ludarium article. |
| 7 | The expansion links, with the affiliate line "Some links are affiliate links; The Ludarium may earn a small commission at no cost to you." |
| 8 | The Indianapolis list: first word on Ludarium learn-to-play nights. |

Footer: Kit's unsubscribe and address, plus "Pause for two weeks" with a link trigger and a pause automation, the same pattern as the Catan and Game Shelf series (docs/newsletter/GAME-SHELF-SERIES.md).
