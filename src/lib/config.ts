// Account settings for outside services. None of these are secrets: they
// all end up in public page HTML. Blank values show a reminder on preview
// builds (never on the live site) so nothing ships half wired.

/**
 * Kit newsletter form, copied from Kit's HTML embed code (Embed > HTML).
 * `action` is the form's action URL; `emailField` is the name of its email input.
 */
export const KIT_NEWSLETTER_FORM = {
  action: '',
  emailField: 'email_address',
};

/** Public URL of the Lemon Squeezy store, for example https://theludarium.lemonsqueezy.com */
export const STORE_URL = '';

/** Where people can reach The Ludarium, including privacy requests. */
export const CONTACT_EMAIL = '';

/** Legal name of the business that runs the site, used in the privacy policy. */
export const LEGAL_NAME = '';

/** State or country whose law the business is organized under, for the privacy policy. */
export const LEGAL_LOCATION = '';
