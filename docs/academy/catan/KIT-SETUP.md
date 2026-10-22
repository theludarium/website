# Academy setup: the Road to the Catan Championship form

The course signup form on the site is already built (`src/components/AcademyForm.astro`). It posts straight to Kit and needs only the Kit form's address. This guide is the part only Levi can do: the Kit form, its two custom fields, and its tags. About 20 minutes. The lesson emails, sequences, and automations come after this, in `docs/academy/catan/KIT-SEQUENCE.md`.

Menu names below match Kit as of October 2026. Kit has been moving menus around (some help pages say **Automate**, newer ones say **Automation**); if a label has moved, search the settings for the words in bold.

Decisions (2026-10-22): one Kit form for this course, **double opt-in** like the newsletter, sender **The Ludarium <hello@theludarium.com>** (already set and verified), and two signup tags, `academy` and `academy-catan`.

## What the site's form sends

You do not design anything in Kit. The site sends these inputs, and Kit only needs to know where to put them:

| Input name | What it holds | Kit side |
| --- | --- | --- |
| `email_address` | Email | Built in |
| `fields[first_name]` | First name | Built in |
| `fields[catan_experience]` | Exactly one of: `Never played`, `Played a few times`, `I play regularly`, `I want to compete` | Custom field `catan_experience` (step 1) |
| `fields[state]` | Optional. A two-letter US state code such as `IN`, or `Outside the US`, or blank | Custom field `state` (step 1) |

The four experience answers must stay spelled exactly like that, capital letters included. The automation in `KIT-SEQUENCE.md` matches on them to pick each person's starting level.

## Before you start: the plan

The form, custom fields, tags, and the confirmation email all work on Kit's Free plan. Everything that makes the course run (email sequences, visual automations, rules, and link triggers) needs the **Creator** plan or higher. The account is on a Creator trial now; if it drops to Free, sequences and automations stop until you upgrade again. Details and sources are in `KIT-SEQUENCE.md`.

## 1. Create the two custom fields

Custom fields belong to the whole account, so you only make each one once.

1. Go to **Subscribers** and click any subscriber (your own test address is fine) to open their profile.
2. In the left sidebar, click the three dots next to **Custom Fields**, then **Add new**.
3. Name it exactly `catan_experience`. Leave the value blank. Save.
4. Repeat for a second field named exactly `state`.

Use the names exactly as written: lowercase, with the underscore. Kit uses the name as the key the site posts to (`fields[catan_experience]`), and in email personalization (`{{ subscriber.catan_experience }}`). Source: [How to add and manage custom fields](https://help.kit.com/en/articles/2502504-how-to-add-and-manage-custom-fields).

## 2. Create the tags

Making the tags up front means you pick them from a list later instead of typing them, so a typo cannot split one tag into two. In **Subscribers**, use **Create a tag** (or **+ Add tag**) for each of these:

- `academy` (skip if it already exists)
- `academy-catan`
- `academy-catan-settler`
- `academy-catan-homesteader`
- `academy-catan-trader`
- `academy-catan-strategist`
- `academy-catan-contender`
- `academy-catan-champion`
- `academy-catan-paused`
- `academy-catan-complete`
- `academy-catan-league-interest`

The first two are the signup tags. The six level tags say where each person is in the course. The last three are for pausing, finishing, and raising a hand for the practice league; `KIT-SEQUENCE.md` explains each one.

## 3. Create the form

1. **Grow > Landing Pages & Forms > Create new > Form > Inline**. Pick any template; the site uses its own design, so the look in Kit does not matter.
2. Name it **Academy: Road to the Catan Championship**.
3. In the form's **Settings**:
   - **Incentive**: turn on **Send incentive email** (this is double opt-in). Paste the confirmation email below.
   - **Redirect after confirmation**: `https://theludarium.com/academy/confirmed/`
   - **Success**: choose **Redirect to an external page**: `https://theludarium.com/academy/thanks/`
4. Save.

You do not need to add the custom fields to the form's design in Kit. Kit fills any custom field whose key matches a `fields[...]` input that arrives with the signup.

## 4. Tag every signup

Two rules, one tag each. Kit runs form rules only after the person confirms, so unconfirmed signups never get tagged.

1. **Automate > Rules > + New rule**.
2. Trigger: **Subscribes to a form**, then pick **Academy: Road to the Catan Championship**.
3. Action: **Add tag**, then pick `academy`. Save.
4. Make a second rule the same way with the action **Add tag** `academy-catan`.

If Kit lets one rule add both tags, one rule is fine.

The level tags are not set here. The course's start automation reads `catan_experience` and adds the right level tag right after the welcome email; that is step C1 in `KIT-SEQUENCE.md`.

## 5. Copy the form's address

**Embed > HTML**. In the code, find `action="https://app.kit.com/forms/1234567/subscriptions"` and copy that whole address. Also check the email input's name; it should be `email_address`.

## 6. Send Claude the address

Paste the `action` address into the chat. Claude puts it in `src/lib/config.ts` (`KIT_ACADEMY_FORMS.catan.action`), builds a preview, and tests a real signup with you:

1. Sign up on the preview with your own address, choosing **I want to compete** and **IN**.
2. You should land on `/academy/thanks/`, then get the confirmation email below.
3. Click the button. You should land on `/academy/confirmed/`.
4. In Kit, open your subscriber profile. Check that `catan_experience` says `I want to compete`, `state` says `IN`, and the tags `academy` and `academy-catan` are there.

Nothing goes live until you approve the merge.

## The confirmation email (Kit "incentive email", double opt-in)

Kit sends this the moment someone signs up. Its only job is the click.

**Subject:** One click to start your Catan lessons

**Body:**

> Hi,
>
> Thanks for signing up for Road to the Catan Championship, the free course from The Ludarium Academy. Click the button below to confirm, and your welcome email arrives right after.
>
> [Button: Yes, start my Catan lessons]
>
> If you didn't sign up, ignore this email and you won't hear from us.
>
> The Ludarium

Button text in Kit: **Yes, start my Catan lessons**. The button's destination is Kit's confirmation link, which then redirects to `https://theludarium.com/academy/confirmed/`.

The greeting is a plain "Hi," on purpose, the same as the newsletter's confirmation email. Some Kit confirmation emails do not fill in personalization, and "Hi there" reads better than a blank name.

## Later

- **The thanks page wording.** `/academy/thanks/` says the first lesson follows right after confirming. With the cadence in `KIT-SEQUENCE.md`, the welcome email follows right away and links to the first lesson; the first lesson email arrives the next morning (Level 0) or the next Tuesday or Friday morning (other levels). Ask Claude to adjust the page if you want the words to match exactly.
- **Other Academy courses** reuse this pattern: one form per course, the `academy` tag plus a course tag (`academy-<course>`), and level tags named `academy-<course>-<level>`.
