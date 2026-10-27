# The Guild of Game Guides in Kit

The Guild's signup works like a game course's (`docs/academy/COURSE-EMAILS.md`), with three differences: it sends a lesson every weekday, its first email carries the toolkit link, and it has a capstone that comes to Levi by email, not through Kit.

Until the Kit form exists, every Guild signup form posts to the general newsletter form (the `CourseForm` fallback), so no email is lost, and previews show a reminder.

## Signup: form, tag, sequence, rule

**Live since 2026-10-27:** form "Academy: Guild of Game Guides" 10104085, tag `course-guild` 25081798, sequence "Course: Guild of Game Guides" 2946196 (35 emails), rule 5670545. The confirmation email reads "One click to start your Guild training", with the button "Start my training".

1. **Emails.** `node scripts/guild-emails.mjs <out-dir>` writes `guild.json` (subject, preview text and HTML for each of the 35 lessons) and `guild.html` (read this first).
2. **Tag:** `course-guild`.
3. **Form:** duplicate an "Academy: <Game>" form and name it "Academy: Guild of Game Guides". Redirect after signup: `https://theludarium.com/academy/guild/thanks/`. Redirect after confirming: `https://theludarium.com/academy/guild/confirmed/`. Confirmation email subject: "One click to start your Guild training". Button: "Start my training".
4. **Sequence:** "Course: Guild of Game Guides", 8 a.m. Indiana (East), excluding `academy-paused`. Lesson 1 "as soon as possible" every day; every other lesson "after 1 day", Monday to Friday only. 35 lessons take about seven weeks.
5. **Rule:** subscribes to the form, then subscribe to the sequence and add `course-guild`.
6. **Site:** add `guild: { action: 'https://app.kit.com/forms/<id>/subscriptions' }` to `KIT_COURSE_FORMS` in `src/lib/config.ts`, build, check a preview, and do a test signup.

The shared pause (tag `academy-paused`, rule 5668327, automation Academy: Pause 2139548) covers the Guild with no extra setup, because every email's footer uses the same pause link.

## Capstone: email, not Kit

The capstone form at `/academy/guild/capstone/` posts to the Pages Function `functions/api/guild-capstone.ts`, which emails the submission to Levi through the `ludarium-notify` Worker and Cloudflare Email Routing, with reply-to set to the student. It uses the corporate inquiry form's settings (the `NOTIFY` service binding and `TURNSTILE_SECRET_KEY`); see "Form notices" in the README.

**Reviewing one:** the email shows the student's ten scores and the newcomer's five answers.
- If the newcomer said yes to another game and the teach holds up, open `/academy/guild/certificate/?name=<name>&date=<date>&no=<number>`, print it to PDF (landscape, no headers), and reply to the email with it attached. Number certificates in order from 0001 and keep a list.
- If not, reply with encouragement and the one line from their Self-Assessment to work on. They can send another capstone anytime.

Promise a reply within about a week; the lessons and the capstone page say so.
