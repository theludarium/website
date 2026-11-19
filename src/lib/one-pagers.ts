// Game Night One-Pagers and the Make Your Own One-Page RPG kit, sold on Lemon Squeezy.
// Source files and the PDF build live in theludarium/revenue-ops (products/one-pagers/).
// The free game, Under the Couch, is delivered by the Kit form in KIT_OFFER_FORMS['under-the-couch'].
export const ONE_PAGER_PRODUCTS = [
  {
    slug: 'bundle',
    // Lemon Squeezy product 1533967
    name: 'Game Night One-Pagers',
    eyebrow: 'Ten one-page RPGs',
    blurb: 'Ten complete tabletop RPGs about the night you play, each on one printable page. 13-page PDF.',
    price: '$12',
    checkout: 'https://theludarium.lemonsqueezy.com/checkout/buy/7ec9f95f-a034-4878-b9ad-a42810485435',
    alt: 'Pages from Game Night One-Pagers fanned out',
  },
  {
    slug: 'kit',
    // Lemon Squeezy product 1533969
    name: 'Make Your Own One-Page RPG',
    eyebrow: 'Design kit',
    blurb: 'A weekend workbook from first idea to a finished, playtested one-pager. 11-page PDF.',
    price: '$7',
    checkout: 'https://theludarium.lemonsqueezy.com/checkout/buy/2788a061-d701-458c-bde1-ad395996fc31',
    alt: 'Worksheet pages from the Make Your Own One-Page RPG kit',
  },
] as const;
