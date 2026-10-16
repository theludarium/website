// Every Ludarium Game Lounge, one entry per city. Adding a city here creates
// its page at /lounges/<slug>/ with a waitlist; no other code changes needed.

export type LoungeStatus = 'waitlist' | 'open';

export type Lounge = {
  slug: string;
  city: string;
  region: string;
  number: string;
  status: LoungeStatus;
  /** Kit tag applied to this city's waitlist signups. */
  kitTag: string;
  blurb: string;
};

export const LOUNGES: Lounge[] = [
  {
    slug: 'indianapolis',
    city: 'Indianapolis',
    region: 'Indiana',
    number: '001',
    status: 'waitlist',
    kitTag: 'lounge-indianapolis',
    blurb: 'The first Ludarium Game Lounge. Join the waitlist to help decide where and when it opens.',
  },
];

/** What people play, for the waitlist. Tells us which communities to bring in first. */
export const PLAY_OPTIONS = [
  'Board games',
  'Card games',
  'Role-playing games',
  'Miniatures',
  'Chess',
  'Go',
  'Mahjong',
  'Designing games',
];

export const VISIT_OPTIONS = ['Every week', 'A few times a month', 'Once a month', 'Now and then'];
