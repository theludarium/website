## 2026-10-16: Corporate events and lounges (build step 4)

- **Inquiry form runs on a Cloudflare Pages Function** (`functions/api/inquiry.ts`), Levi's choice over a form service. It checks a hidden honeypot field and Cloudflare Turnstile, validates every field, emails the inquiry through Resend with reply-to set to the sender, then redirects to `/corporate-events/thanks/`. Errors return to the form with a plain message. No database: inquiries live in Levi's inbox.
- **Settings:** `RESEND_API_KEY`, `TURNSTILE_SECRET_KEY`, and `INQUIRY_TO` (plus optional `INQUIRY_FROM`) are set in the Cloudflare Pages project, never in the repo. The public Turnstile site key goes in `src/lib/config.ts`. Previews use Cloudflare's always-pass test key until it is set. Until a domain is verified in Resend, mail comes from `onboarding@resend.dev`.
- **Two-step form:** seven fields, so it splits into "About you" and "About your team" (landing page rule 6). Without JavaScript it is one long form that still works.
- **Lounge pages are data-driven:** `src/lib/lounges.ts` lists cities; `/lounges/[city]/` builds each page with its own waitlist. Adding a city is one entry.
- **Waitlist questions:** first name, email, ZIP, what they play, how often they would come. Posts to the city's Kit form; Kit tags it (`lounge-indianapolis`) and redirects to `/lounges/thanks/`. Kit custom fields: `zip_code`, `plays`, `visit_frequency`.
- **Concept floor plan** illustration on city pages (event hall, campaign rooms, game library, open tables, cafe, lounge), clearly labeled as a concept.
- **No invented facts:** pricing, opening dates, workshop lengths, and testimonials are left out or marked as preview notes for Levi to confirm.
