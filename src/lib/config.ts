// Account settings for outside services. None of these are secrets: they
// all end up in public page HTML. Blank values show a reminder on preview
// builds (never on the live site) so nothing ships half wired.

/**
 * Kit newsletter form, copied from Kit's HTML embed code (Embed > HTML).
 * `action` is the form's action URL; `emailField` is the name of its email input.
 */
export const KIT_NEWSLETTER_FORM = {
  action: 'https://app.kit.com/forms/10079099/subscriptions',
  emailField: 'email_address',
};

/** Public URL of the Lemon Squeezy store, for example https://theludarium.lemonsqueezy.com */
export const STORE_URL = '';

/** Where people can reach The Ludarium, including privacy requests. */
export const CONTACT_EMAIL = 'hello@theludarium.com';

/** Legal name of the business that runs the site, used in the privacy policy. */
export const LEGAL_NAME = '';

/** State or country whose law the business is organized under, for the privacy policy. */
export const LEGAL_LOCATION = '';

/**
 * Cloudflare Turnstile site key for the corporate inquiry form (public).
 * The matching secret key lives only in the Cloudflare Pages project settings.
 * While blank, previews use Cloudflare's always-pass test key.
 */
export const TURNSTILE_SITE_KEY = '';

/**
 * Kit waitlist form for each lounge city, keyed by city slug (see src/lib/lounges.ts).
 * Copy `action` from the Kit form's HTML embed. In Kit, add a rule so this form
 * tags subscribers with the city's tag (for example lounge-indianapolis), and create
 * custom fields with these keys: zip_code, plays, visit_frequency.
 */
export const KIT_WAITLIST_FORMS: Record<string, { action: string }> = {
  indianapolis: { action: 'https://app.kit.com/forms/10079113/subscriptions' },
};

/**
 * Google Analytics 4 measurement ID (looks like G-XXXXXXXXXX). Public.
 * Analytics runs for every visitor, with regional consent handling in
 * src/components/ConsentBanner.astro. While blank, nothing loads.
 */
export const GA_MEASUREMENT_ID = 'G-38F1N7Q117';

/**
 * Kit form for malaphor submissions (the /malaphors/ page, printed in the book).
 * Copy `action` from the Kit form's HTML embed. In Kit, add a rule so this form
 * tags subscribers `malaphors`, and create custom fields with these keys:
 * malaphor, parents, context.
 */
export const KIT_MALAPHOR_FORM = { action: '' };
