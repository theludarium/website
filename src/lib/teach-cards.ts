// Teach-card packs sold on Lemon Squeezy (live 2026-11-07, products 1508002 to 1508011).
// Keyed by Academy course slug. Images live in src/assets/teach-cards/<key>.jpg.
// Source files and listings: theludarium/revenue-ops, products/cards-<slug>/.

export interface TeachCardPack {
  /** Academy course slug, or 'bundle' */
  slug: string;
  game: string;
  name: string;
  price: string;
  checkout: string;
  blurb: string;
}

const BUY = 'https://theludarium.lemonsqueezy.com/checkout/buy/';

export const TEACH_CARD_PACKS: TeachCardPack[] = [
  {
    slug: 'carcassonne',
    game: 'Carcassonne',
    name: 'Teach Cards for Carcassonne',
    price: '$5',
    checkout: `${BUY}0ffa4aff-f88b-4058-8255-6631c424114f`,
    blurb: 'A turn and scoring card for every seat, a ten-minute teach script, and a calm final count, farmers included.',
  },
  {
    slug: 'azul',
    game: 'Azul',
    name: 'Teach Cards for Azul',
    price: '$5',
    checkout: `${BUY}e02f017c-c70f-45e6-8246-588d070ac35d`,
    blurb: 'Two reference cards for every seat, a ten-minute teach script, and worked tile-scoring examples.',
  },
  {
    slug: 'wingspan',
    game: 'Wingspan',
    name: 'Teach Cards for Wingspan',
    price: '$5',
    checkout: `${BUY}929f2cfd-c491-4913-9b33-d82e825ae279`,
    blurb: 'The four actions in every hand, a ten-minute teach script, and cards for round goals and the final count.',
  },
  {
    slug: 'ticket-to-ride',
    game: 'Ticket to Ride',
    name: 'Teach Cards for Ticket to Ride',
    price: '$5',
    checkout: `${BUY}5ae13b67-b0ea-4743-82e5-e0242cd4dca9`,
    blurb: 'The turn in every hand, a ten-minute teach script, and a clean ticket reveal and longest-path count.',
  },
];

export const TEACH_CARD_BUNDLE: TeachCardPack = {
  slug: 'bundle',
  game: 'All four games',
  name: 'Teach Cards Bundle',
  price: '$15',
  checkout: `${BUY}d031b9e5-8919-4e84-9d43-cfb4d41359c9`,
  blurb: 'Carcassonne, Azul, Wingspan, and Ticket to Ride. 72 cards, four packs for the price of three.',
};

export function teachCardPack(courseSlug: string): TeachCardPack | undefined {
  return TEACH_CARD_PACKS.find((p) => p.slug === courseSlug);
}
