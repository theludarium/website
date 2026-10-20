## 2026-10-16: Core pages (build step 3)

- **Newsletter signup posts straight to Kit** from our own form (no Kit script, no extra JavaScript), so it stays fast and on-brand. The Kit action URL and email field name come from Kit's HTML embed code and live in `src/lib/config.ts`. Kit redirects new subscribers to `/newsletter/thanks/`. Until it is set, the form falls back to `/newsletter/`.
- **Service settings in one file:** `src/lib/config.ts` (Kit form, store URL, contact email, legal name, location). None are secrets.
- **Preview-only notes** (`PreviewNote`): reminders for missing settings or copy Levi still needs to write. They show in dev and on preview branches, never on the live site. The About page's founder section is preview-only until Levi writes it.
- **Newsletter page** built to the landing page rules: outcome headline, subheadline, a sketch of an issue as proof, one form, three objections, privacy link.
- **Home** shows the three latest articles once any are published, and the category cards until then.
- **About:** the name (ludus, play and school; -arium, a place for), togethering, the Now / Next / Then roadmap.
- **Store:** intro plus a link out to Lemon Squeezy; shows "opens soon" with a newsletter link until the store URL is set.
- **Affiliate disclosure and privacy policy** in plain language. The privacy policy is a draft, not legal advice; it needs the business details and a professional review before launch on theludarium.com.
- **Affiliate components** for articles: `AffiliateLink` (`rel="sponsored noopener"`) and `AffiliateNotice`. Usage in `docs/writing-articles.md`.
