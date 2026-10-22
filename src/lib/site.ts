export const SITE = {
  name: 'The Ludarium',
  url: 'https://theludarium.com',
  tagline: 'The game is the reason. The people are the point.',
  shortMtp: 'Never stop playing.',
  description:
    'The Ludarium is a home for tabletop players: guides, game night ideas, free tools, and a membership game lounge coming to Indianapolis.',
  locale: 'en_US',
};

export type NavLink = { href: string; label: string; description?: string };
export type NavItem = NavLink & { children?: NavLink[] };

export const CATEGORIES = [
  {
    slug: 'game-guides',
    name: 'Game Guides',
    description: 'How to play, how to teach, and how to win (sometimes).',
    tint: 'var(--brand-felt)',
  },
  {
    slug: 'game-night',
    name: 'Game Night',
    description: 'What to play, who to invite, and how to host a night people remember.',
    tint: 'var(--brand-lamplight)',
  },
  {
    slug: 'togethering',
    name: 'Togethering',
    description: 'Why we gather, and how games make it easier.',
    tint: 'var(--brand-stone)',
  },
  {
    slug: 'game-culture',
    name: 'Game Culture',
    description: 'The people, stories, and ideas behind the hobby.',
    tint: '#6e9c8d',
  },
  {
    slug: 'game-design',
    name: 'Game Design',
    description: 'How games work, and how to make your own.',
    tint: '#9a7b5f',
  },
  {
    slug: 'magic-and-cube',
    name: 'Magic & Cube',
    description: 'Cube drafting, cube building, and the Cube Commonwealth community.',
    tint: '#7d6a92',
  },
] as const;

export const MAIN_NAV: NavItem[] = [
  {
    href: '/articles/',
    label: 'Articles',
    children: [
      { href: '/articles/', label: 'All articles', description: 'Everything we have written, newest first.' },
      ...CATEGORIES.map((c) => ({
        href: `/articles/category/${c.slug}/`,
        label: c.name,
        description: c.description,
      })),
    ],
  },
  {
    href: '/play/',
    label: 'Play',
    children: [
      { href: '/play/', label: 'All tools', description: 'Free tools for players and game nights.' },
      { href: '/card-catalogue/', label: 'Card Catalogue', description: 'Find games by how they feel. Picks for your whole table.' },
      { href: '/rpg-demo-library/', label: 'RPG Demo Library', description: 'Try a role-playing game before you buy it.' },
      { href: '/game-night-madness/', label: 'Game Night Madness', description: 'Let a bracket pick tonight’s game.' },
      { href: '/store/', label: 'Store', description: 'PDFs and digital goods for your table.' },
    ],
  },
  { href: '/academy/', label: 'Academy' },
  {
    href: '/lounges/',
    label: 'Lounges',
    children: [
      { href: '/lounges/', label: 'The Lounges', description: 'A membership home for players, city by city.' },
      { href: '/lounges/indianapolis/', label: 'Indianapolis', description: 'Lounge No. 001. Join the waitlist.' },
    ],
  },
  { href: '/corporate-events/', label: 'For Teams' },
  { href: '/about/', label: 'About' },
];

export const FOOTER_NAV: { title: string; links: NavLink[] }[] = [
  {
    title: 'Explore',
    links: [
      { href: '/articles/', label: 'Articles' },
      { href: '/play/', label: 'Game tools' },
      { href: '/academy/', label: 'Academy' },
      { href: '/store/', label: 'Store' },
      { href: '/books/', label: 'Books' },
      { href: '/search/', label: 'Search' },
    ],
  },
  {
    title: 'The Ludarium',
    links: [
      { href: '/about/', label: 'About' },
      { href: '/lounges/', label: 'The lounges' },
      { href: '/lounges/indianapolis/', label: 'Indianapolis' },
      { href: '/corporate-events/', label: 'Corporate events' },
      { href: '/support/', label: 'Support us' },
    ],
  },
  {
    title: 'Fine print',
    links: [
      { href: '/newsletter/', label: 'Newsletter' },
      { href: '/privacy/', label: 'Privacy' },
      { href: '/terms/', label: 'Terms' },
      { href: '/affiliate-disclosure/', label: 'Affiliate disclosure' },
    ],
  },
];
