# Paid certification: setup and the review routine

The Guild training is free. The capstone review that earns the Expert Game Guide title costs $39 (`GUILD_CERT_PRICE` in `src/lib/config.ts`). See DECISIONS.md, 2026-11-02.

## Lemon Squeezy product (created 2026-11-02)

Product ID 1496230, "Expert Game Guide certification review", $39 single payment, tax category Digital Goods or Services, hidden from the storefront (sold only from the capstone page). The confirmation pop-up and receipt both have a "Send my capstone" button to the capstone form. Checkout: `GUILD_CERT_CHECKOUT_URL` in `src/lib/config.ts`.

## One-time setup (Levi)

1. **Lemon Squeezy product.** In the store "The Ludarium", create a product:
   - Name: Expert Game Guide certification review
   - Price: $39, single payment
   - Description: A personal review of your Guild of Game Guides capstone. If your newcomer said yes to a second game, you receive your Expert Game Guide certificate. Covers one resubmission.
   - Tax category: pick the one that fits a personal review or training service, then click "Save changes" (it does not save during creation).
   - No file to deliver. Under confirmation, set the button to link to `https://theludarium.com/academy/guild/capstone/#capstone-form` with the label "Send my capstone".
2. **Send Claude the checkout link** (`https://theludarium.lemonsqueezy.com/checkout/buy/...`). It goes in `GUILD_CERT_CHECKOUT_URL`. Until then, the capstone page says payment opens soon.
3. **Kit emails.** The capstone lesson email should match the updated lesson (`src/content/guild-lessons/the-capstone.md`): rebuild with `scripts/guild-emails.mjs` and paste it into the Guild sequence.
4. **Check the early-member date** (`GUILD_CERT_FREE_BEFORE`) matches the day this goes live.

## Each capstone

1. The email shows the order number, or says the student joined early.
   - Paid: find the order in Lemon Squeezy. No order, no review; reply and ask for it.
   - Early: check the student's Kit signup date is before `GUILD_CERT_FREE_BEFORE`.
2. Review as before. If the newcomer said yes and the teach holds up, open the certificate maker link in the email.
3. Give the next certificate number. Print to PDF.
4. If the student asked to be on the register, tick "On the register" and add the register line to `src/data/guild-register.json`.
5. Reply with the PDF and the LinkedIn link.
6. Not yet: reply with what to try next. Their fee covers one resubmission; the second email should show the same order number.
