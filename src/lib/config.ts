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

/**
 * Newsletter offers: a free download delivered by its own Kit form. An article
 * opts in with `offer: <key>` in its frontmatter, and its end-of-article signup
 * then shows this copy and posts to this form. In Kit, each form uses double
 * opt-in with the download as its incentive, tags subscribers with the key,
 * and redirects to /newsletter/thanks/. While `action` is blank, the signup
 * posts to the general newsletter form and previews show a reminder.
 */
export const KIT_OFFER_FORMS = {
  'mixtape-j-card': {
    // Kit form "Offer: Mixtape J-card" (10088125); rule 5664112 tags mixtape-j-card.
    action: 'https://app.kit.com/forms/10088125/subscriptions',
    heading: 'Get the free Mixtape J-card.',
    lede: 'A printable, real-size cassette insert for the winning tape. Join The Ludarium newsletter and it arrives when you confirm your email.',
    buttonLabel: 'Send me the free J-card',
  },
  'game-shelf': {
    // Kit form "Offer: Game Shelf series" (10089038). Its rule tags game-shelf and
    // game-shelf-shared-shelf (which starts the six chained sequences) and adds Welcome.
    action: 'https://app.kit.com/forms/10089038/subscriptions',
    heading: 'Get the whole series by email.',
    lede: 'All six series, two short emails a week, each one a quick read that links to the full article. Join The Ludarium newsletter and the first one arrives the next Tuesday or Friday morning.',
    buttonLabel: 'Send me the series',
  },
} satisfies Record<string, { action: string; heading: string; lede: string; buttonLabel: string }>;

export type KitOfferKey = keyof typeof KIT_OFFER_FORMS;
export const KIT_OFFER_KEYS = Object.keys(KIT_OFFER_FORMS) as [KitOfferKey, ...KitOfferKey[]];

/** Public URL of the Lemon Squeezy store, for example https://theludarium.lemonsqueezy.com */
export const STORE_URL = 'https://theludarium.lemonsqueezy.com';

/** Where people can reach The Ludarium, including privacy requests. */
export const CONTACT_EMAIL = 'hello@theludarium.com';

/** Legal name of the business that runs the site, used in the privacy policy. */
export const LEGAL_NAME = '';

/** State or country whose law the business is organized under, for the privacy policy. */
export const LEGAL_LOCATION = '';

/**
 * Cloudflare Turnstile site key for the corporate inquiry form (public).
 * The matching secret key lives only in the Cloudflare Pages project settings.
 * Previews and local dev always use Cloudflare's always-pass test key instead.
 */
export const TURNSTILE_SITE_KEY = '0x4AAAAAAFn938ZOMnd8PSUH';

/**
 * Kit waitlist form for each lounge city, keyed by city slug (see src/lib/lounges.ts).
 * Copy `action` from the Kit form's HTML embed. In Kit, add a rule so this form
 * tags subscribers with the city's tag (for example lounge-indianapolis), and create
 * custom fields with these keys: last_name, zip_code, plays, visit_frequency.
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
 * last_name, malaphor, parents, context.
 */
export const KIT_MALAPHOR_FORM = { action: 'https://app.kit.com/forms/10080181/subscriptions' };

/** The malaphor field guide on Amazon (paperback page; it links the Kindle edition too). A plain link, not an affiliate link. */
export const MALAPHOR_BOOK_URL = 'https://www.amazon.com/dp/B0HNTSXVS6';

/** The same book's Kindle edition on Amazon. */
export const MALAPHOR_KINDLE_URL = 'https://www.amazon.com/dp/B0HNTT7KKV';

/**
 * Kit form for each Academy course, keyed by course slug (see src/lib/academy.ts).
 * Copy `action` from the Kit form's HTML embed. Setup steps, tags, and custom
 * fields (catan_experience, state) are in docs/academy/catan/KIT-SETUP.md.
 * While blank, the form shows a preview note and does not submit to Kit.
 */
export const KIT_ACADEMY_FORMS: Record<string, { action: string }> = {
  catan: { action: 'https://app.kit.com/forms/10083674/subscriptions' },
};

/**
 * Kit forms for the game courses (src/content/courses/), keyed by course slug.
 * `action` is the "Academy: <Game>" form (tags course-<slug>, or tcg-<slug> for
 * trading card games, and starts the course's sequence; see docs/academy/COURSE-EMAILS.md); `alerts` is the optional set-alerts form for TCG courses.
 * Until a course has an entry, its signup posts to the general newsletter form
 * so no email is lost, and previews show a reminder.
 */
export const KIT_COURSE_FORMS: Record<string, { action: string; alerts?: string }> = {
  'ticket-to-ride': { action: 'https://app.kit.com/forms/10098564/subscriptions' },
  wingspan: { action: 'https://app.kit.com/forms/10098569/subscriptions' },
  codenames: { action: 'https://app.kit.com/forms/10098583/subscriptions' },
  'pokemon-tcg': { action: 'https://app.kit.com/forms/10098588/subscriptions' },
  magic: { action: 'https://app.kit.com/forms/10098589/subscriptions' },
  azul: { action: 'https://app.kit.com/forms/10099858/subscriptions' },
  carcassonne: { action: 'https://app.kit.com/forms/10099859/subscriptions' },
  pandemic: { action: 'https://app.kit.com/forms/10099861/subscriptions' },
  'king-of-tokyo': { action: 'https://app.kit.com/forms/10099862/subscriptions' },
  splendor: { action: 'https://app.kit.com/forms/10099864/subscriptions' },
  cascadia: { action: 'https://app.kit.com/forms/10099865/subscriptions' },
  'flip-7': { action: 'https://app.kit.com/forms/10099867/subscriptions' },
  'sky-team': { action: 'https://app.kit.com/forms/10099870/subscriptions' },
  heat: { action: 'https://app.kit.com/forms/10099872/subscriptions' },
  '7-wonders': { action: 'https://app.kit.com/forms/10099875/subscriptions' },
  everdell: { action: 'https://app.kit.com/forms/10099878/subscriptions' },
  'terraforming-mars': { action: 'https://app.kit.com/forms/10099879/subscriptions' },
  'dinosaur-island': { action: 'https://app.kit.com/forms/10099884/subscriptions' },
  'dune-imperium': { action: 'https://app.kit.com/forms/10099889/subscriptions' },
  'ark-nova': { action: 'https://app.kit.com/forms/10099892/subscriptions' },
  root: { action: 'https://app.kit.com/forms/10099897/subscriptions' },
  'brass-birmingham': { action: 'https://app.kit.com/forms/10099901/subscriptions' },
  'spirit-island': { action: 'https://app.kit.com/forms/10099905/subscriptions' },
  dominion: { action: 'https://app.kit.com/forms/10099909/subscriptions' },
  'lost-ruins-of-arnak': { action: 'https://app.kit.com/forms/10099912/subscriptions' },
  'castles-of-burgundy': { action: 'https://app.kit.com/forms/10099915/subscriptions' },
  'power-grid': { action: 'https://app.kit.com/forms/10099916/subscriptions' },
  'one-piece-card-game': { action: 'https://app.kit.com/forms/10099920/subscriptions' },
  lorcana: { action: 'https://app.kit.com/forms/10099924/subscriptions' },
  yugioh: { action: 'https://app.kit.com/forms/10099926/subscriptions' },
  'cube-draft': { action: 'https://app.kit.com/forms/10099930/subscriptions' },
};
/**
 * Kit forms for the recurring stories (docs/stories/README.md): `dataset` is
 * the Shelf Life CSV download (tag dataset), `ledger` the industry readers form
 * (tag ledger). Blank until the forms exist in Kit; until then signups join the
 * general newsletter.
 */
export const KIT_STORY_FORMS = {
  dataset: '',
  ledger: '',
};

