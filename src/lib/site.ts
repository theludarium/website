import { SERVICES } from './services';
import type { LettersKey } from './config';

export const SITE = {
  name: 'The Ludarium',
  url: 'https://theludarium.com',
  tagline: 'The game is the reason. The people are the point.',
  shortMtp: 'Never stop playing.',
  description:
    'The Ludarium is a home for tabletop players: guides, game night ideas, free tools, and a membership game lounge coming to Indianapolis.',
  locale: 'en_US',
};

// The Ludarium's own social profiles: footer links and Organization sameAs.
export const SOCIAL = [
  { name: 'LinkedIn', href: 'https://www.linkedin.com/company/the-ludarium/', icon: 'linkedin' },
  { name: 'Pinterest', href: 'https://www.pinterest.com/theludarium/', icon: 'pinterest' },
] as const;

export const FOUNDER = {
  name: 'Levi JA Wilson',
  role: 'Founder',
  city: 'Indianapolis, Indiana',
  email: 'lwilson@theludarium.com',
  linkedin: 'https://www.linkedin.com/in/levijawilson/',
  website: 'https://leviwilson.me/',
  photo: '/images/about/levi-wilson.webp',
};

/** group: a small heading drawn above the first link of each group in a menu. */
export type NavLink = { href: string; label: string; description?: string; group?: string };
/** topLink: the label itself links to href, and a separate chevron opens the menu. */
export type NavItem = NavLink & { children?: NavLink[]; topLink?: boolean };

export interface ArticleCategory {
  slug: string;
  name: string;
  description: string;
  /** Accent used on category tags and cards. */
  tint: string;
  /** An Academy course that reads this category's articles in order; drawn as a band on the category page. */
  course?: { title: string; href: string };
  /**
   * Which Ludarium Letter the end-of-article signup offers for this category
   * (a key of KIT_LETTERS_FORMS in src/lib/config.ts). Unset means the general
   * letter. An article can override it with `letters:` in its frontmatter.
   */
  letters?: LettersKey;
}

export const CATEGORIES: ArticleCategory[] = [
  {
    slug: 'what-to-play',
    letters: 'tabletop',
    name: 'What to Play',
    description: 'Picks, comparisons, and gift guides for finding the right game for your table.',
    tint: 'var(--brand-felt)',
  },
  {
    slug: 'how-to-play',
    letters: 'tabletop',
    name: 'How to Play',
    description: 'Rules, strategy, and the words players use, explained plainly. How to play, how to teach, and how to win (sometimes).',
    tint: '#4f7a8c',
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
    slug: 'game-shelf',
    letters: 'tabletop',
    name: 'Game Shelf',
    description: 'Building, sharing, and organizing a game collection worth playing.',
    tint: '#a0824f',
    course: { title: 'The Game Shelf', href: '/academy/game-shelf/' },
  },
  {
    slug: 'game-design',
    letters: 'tabletop',
    name: 'Game Design',
    description: 'How games work, and how to make your own.',
    tint: '#9a7b5f',
  },
  {
    slug: 'magic-and-cube',
    letters: 'cube',
    name: 'Magic & Cube',
    description: 'Cube drafting, Cube building, and the Cube Commonwealth community.',
    tint: '#7d6a92',
  },
] as const;

export const MAIN_NAV: NavItem[] = [
  {
    href: '/articles/',
    label: 'Articles',
    topLink: true,
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
      { group: 'Play online', href: '/play/', label: 'All tools', description: 'Free tools for players and game nights.' },
      { group: 'Play online', href: '/card-catalogue/', label: 'Card Catalogue', description: 'Find games by how they feel. Picks for your whole table.' },
      { group: 'Play online', href: '/rpg-demo-library/', label: 'RPG Demo Library', description: 'Try a role-playing game before you buy it.' },
      { group: 'Play online', href: '/game-night-madness/', label: 'Game Night Madness', description: 'Let a bracket pick tonight’s game.' },
      { group: 'Play online', href: '/head-judge-arbiter/', label: 'Head Judge Arbiter', description: 'Settle a Magic rules question mid-game.' },
      { group: 'Play in person', href: '/lounges/', label: 'The Lounges', description: 'A membership home for players, city by city.' },
      { group: 'Play in person', href: '/cube-commonwealth/', label: 'Cube Commonwealth', description: 'Our Magic Cube community: weekly drafts and the CQC.' },
      { group: 'Play in person', href: '/lounges/indianapolis/', label: 'Indianapolis', description: 'Lounge No. 001. Join the waitlist.' },
    ],
  },
  { href: '/academy/', label: 'Academy' },
  {
    href: '/store/',
    label: 'Store',
    topLink: true,
    children: [
      { href: '/store/', label: 'The whole store', description: 'Everything we make for your table.' },
      { href: '/store/#games', label: 'Games to play', description: 'Print-and-play board games, one-page RPGs and adventures.' },
      { href: '/store/#teach', label: 'Teach and host', description: 'Teach cards and kits for whoever runs game night.' },
      { href: '/store/#wear', label: 'Tees and hoodies', description: 'Shirts other players will recognize, printed to order.' },
      { href: '/store/#read', label: 'Books and calendars', description: 'Our books, and a calendar of 12,000 years of play.' },
    ],
  },
  {
    href: '/services/',
    label: 'Services',
    children: [
      { href: '/services/', label: 'All services', description: 'Ways to work with The Ludarium.' },
      ...SERVICES.map((s) => ({ href: s.href, label: s.name, description: s.menuLine })),
    ],
  },
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
      { href: '/services/', label: 'Services' },
      { href: '/corporate-events/', label: 'For teams' },
      { href: '/press/', label: 'Press' },
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
