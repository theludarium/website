# Newsletter setup: Kit and hello@theludarium.com

The site's signup forms are already built. They post straight to Kit and need only each Kit form's address. This guide is the part only Levi can do: accounts, DNS, and Kit settings. About 30 minutes. Menu names below match Kit and Cloudflare as of October 2026; if a label has moved, search the settings for the words in bold.

Decisions (2026-10-21): send from **hello@theludarium.com**, **double opt-in** (people confirm by email), a **PO box or virtual mailbox** for the legally required mailing address, and a welcome email drafted in `docs/newsletter/emails.md`.

## 1. Make hello@theludarium.com (Cloudflare Email Routing, free)

1. In the Cloudflare dashboard, open **theludarium.com**, then **Email > Email Routing**, and click **Get started**.
2. Custom address: `hello`. Action: **Send to an email**. Destination: your Gmail.
3. Cloudflare emails your Gmail a verification link. Click it.
4. When Cloudflare offers to add the DNS records (MX and a TXT record starting `v=spf1`), click **Add records and enable**.
5. Test: send a message to hello@theludarium.com from another account. It should land in your Gmail.

Replies: you will read hello@ mail in Gmail. Replying from Gmail shows your Gmail address, which is fine for now.

## 2. A mailing address for the email footer

US law (CAN-SPAM) requires a physical postal address in every marketing email. Use a USPS PO box or a virtual mailbox service, not your home. Kit asks for it during account setup; you can start with a placeholder only if Kit allows saving, but do not send any email until the real address is in.

## 3. Create the Kit account

1. Sign up at kit.com with **hello@theludarium.com** as the login email (you will receive Kit's mail through the forwarding from step 1). The free Newsletter plan covers what we need to start.
2. Creator or business name: **The Ludarium**.
3. Sender: name **The Ludarium**, address **hello@theludarium.com**.
4. Mailing address: the PO box or virtual address from step 2.

## 4. Verify the domain in Kit (DNS in Cloudflare)

This lets Kit send as hello@theludarium.com without landing in spam.

1. In Kit, find **Settings > Email > Sending domain** (or **Domain authentication**) and add `theludarium.com`.
2. Kit shows a few DNS records, usually CNAME records. In Cloudflare, **theludarium.com > DNS > Records > Add record** for each one, copying the type, name, and value exactly.
3. Important: set each new record's **Proxy status to DNS only** (grey cloud, not orange). Proxied records break email verification.
4. If Kit asks for a **TXT record starting `v=spf1`** on the root domain, do not add a second one. A domain can have only one SPF record, and Email Routing already made one. Send me both values and I will merge them into one line.
5. Back in Kit, click **Verify**. DNS can take a few minutes to an hour.

## 5. Form 1: The Ludarium newsletter

1. **Grow > Landing Pages & Forms > Create new > Form > Inline**. Pick any template; the site uses its own design, so the look in Kit does not matter.
2. Name it **The Ludarium newsletter**.
3. In the form's **Settings**:
   - **Incentive**: turn on **Send incentive email** (this is double opt-in). Use the confirmation email copy in `docs/newsletter/emails.md`.
   - **Redirect after confirmation**: `https://theludarium.com/newsletter/confirmed/`
   - **Success**: choose **Redirect to an external page**: `https://theludarium.com/newsletter/thanks/`
4. Save.
5. **Embed > HTML**. In the code, find `action="https://app.kit.com/forms/1234567/subscriptions"` and copy that whole address. Also check the email input's name; it should be `email_address`.

## 6. Form 2: Indianapolis lounge waitlist

1. Create a second inline form named **Lounge waitlist: Indianapolis**.
2. Same incentive setting (double opt-in) and confirmation email.
   - **Redirect after confirmation**: `https://theludarium.com/newsletter/confirmed/`
   - **Success** redirect: `https://theludarium.com/lounges/thanks/`
3. Custom fields: in **Grow > Subscribers**, open the field settings and add four custom fields with exactly these keys: `last_name`, `zip_code`, `plays`, `visit_frequency`. (First name and email are built in; Kit has no built-in last name.)
4. Tag: in **Automate > Rules**, add a rule: trigger **Subscribes to a form: Lounge waitlist: Indianapolis**, action **Add tag: `lounge-indianapolis`**. Future cities reuse the pattern (`lounge-<city>`).
5. Copy its `action` address from **Embed > HTML**, as above.

## 7. The welcome email

In **Automate > Sequences**, create a sequence **Welcome**, paste the welcome email from `docs/newsletter/emails.md` as email 1 (send immediately), then add a rule: trigger **Subscribes to a form** (both forms), action **Subscribe to sequence: Welcome**. Add more emails to the sequence later if you want a short series.

## 8. Send Claude the two form addresses

Paste the two `action` addresses into the chat. Claude puts them in `src/lib/config.ts`, builds a preview, and tests a real signup with you. Nothing goes live until you approve the merge.

## Ludarium Letters: four newsletters, four forms (2026-10-28)

Ludarium Letters is four newsletters, each a weekly broadcast on its own day to its own Kit segment, so a reader only gets the letters they asked for. Course signups (the Academy forms) never join a letter.

| Letter | Kit form | Tag | Segment | Send day |
| --- | --- | --- | --- | --- |
| Ludarium Letters - General | 10079099 (the original newsletter form, renamed) | `LL: General` | LL - General | Friday |
| Ludarium Letters - Cube | 10111145 | `LL: Cube` | LL - Cube | Wednesday |
| Ludarium Letters - Industry | 10111152 | `LL: Industry` | LL - Industry | Thursday |
| Ludarium Letters - Tabletop | 10111160 | `LL: Tabletop` | LL - Tabletop | Tuesday |

All four forms are inline (Clare template; the site uses its own design), with **Send confirmation email** on (double opt-in), success redirect `https://theludarium.com/newsletter/thanks/`, and after-confirmation redirect `https://theludarium.com/newsletter/confirmed/`. The tags and the segments (each one filter: has that tag) already exist in Kit.

On the site, `KIT_LETTERS_FORMS` in `src/lib/config.ts` holds the four form addresses. `NewsletterForm.astro` takes `letters="cube"` (or `tabletop`, `industry`); with nothing passed it joins General. `/newsletter/` has the General form in its hero and a card with a form for each letter below it (anchors `#general`, `#cube`, `#tabletop`, `#industry`). Article pages pick the letter from the category (`letters` on each entry in `src/lib/site.ts`: Magic & Cube joins Cube; Game Guides, Game Shelf and Game Design join Tabletop; the rest join General), and an article can override that with `letters:` in its frontmatter.

Still to do in Kit, one per letter:

1. **Automate > Rules**: trigger **Subscribes to a form: Ludarium Letters - Cube**, actions **Add tag: `LL: Cube`** and **Subscribe to sequence: Welcome - Cube** (once that sequence exists). Same for General, Tabletop and Industry. A Visual Automation with the form as its entry point does the same job.
2. **Automate > Sequences**: a three-email welcome sequence per letter, written in `letters-welcome-emails.md` with the Kit settings for each. The General one is the existing "Welcome" sequence (2939465), renamed and extended. Publish each email and set the sequence to Active, or nothing sends.
3. Send each weekly broadcast to its segment only, never to All subscribers.

## Later

- **Malaphors form: done 2026-10-22.** Form 10080181 "Malaphor submissions" (fields `last_name`, `malaphor`, `parents`, `context`; rule tags `malaphors`; success redirect `/malaphors/thanks/`, after confirmation `/malaphors/confirmed/`).
- **Academy waitlist** (`academy` plus a per-course tag such as `academy-game-design`): when the Academy page gets its form.
- **Sending from Gmail as hello@**: needs an SMTP service; skip until replies from your Gmail address become a problem.

## Last names (added 2026-10-22)

The waitlist, malaphor, and Academy forms ask for first and last name. Kit stores first name on its own, but last name is a custom field: create it once, in **Subscribers**, open any profile, **Custom Fields > Add new**, named exactly `last_name`. Every form then fills it. Until it exists, Kit quietly drops the last name and the signup still works.
