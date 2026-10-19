## 2026-10-19: Google Search Console and Google Analytics

- **Search Console:** Domain property for theludarium.com, verified with a TXT record in Cloudflare (keep it; removing it unverifies the site). Sitemap submitted. Google's one-click Cloudflare connection was skipped on purpose so Google has no standing access to the Cloudflare account.
- **Google Analytics, Levi's choice** over cookie-free Cloudflare Web Analytics, set to **count every visitor** (Levi's call, replacing a first opt-in-only version):
  - US and most countries: GA runs from the first page view with cookies, disclosed in the privacy policy, opt-out via "Cookie settings" in the footer.
  - EU/EEA, UK, Switzerland: a banner asks before cookies; until then Google Consent Mode sends cookieless pings so visits are still counted (modeled), without storing anything.
  - "No thanks" and Global Privacy Control mean cookieless only, everywhere; opting out deletes the `_ga` cookies.
  - Ad signals are always denied, so nothing is sold or shared for advertising.
  - Country for the banner decision comes from `functions/api/country.ts` (Cloudflare's location data, nothing stored), cached in the visitor's browser.
- **Privacy policy rewritten** to describe this model, including a short rights section. It promises advertising features and Google Signals off and 14-month retention; the GA property must be set that way. Not legal advice; worth a professional review.
- **The measurement ID goes in `GA_MEASUREMENT_ID`** in `src/lib/config.ts`. While blank, no banner shows and nothing loads.
