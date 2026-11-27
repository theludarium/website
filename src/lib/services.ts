// Everything The Ludarium sells as a service. The /services/ hub and the
// Services menu in the header both read this list, so a new service (coaching,
// for example) is one new entry here plus its own page.
export type Service = {
  href: string;
  name: string;
  /** Short line for the header menu. */
  menuLine: string;
  /** Who it is for, shown above the name on the hub. */
  audience: string;
  blurb: string;
  cta: string;
};

export const SERVICES: Service[] = [
  {
    href: '/corporate-events/',
    name: 'For Teams',
    menuLine: 'Leadership and team training through tabletop games.',
    audience: 'For HR and L&D leaders',
    blurb:
      'Hands-on workshops where your people practice communication, decisions, and leadership at the table, then connect it straight back to their work. Run at your office.',
    cta: 'Plan your team’s workshop',
  },
  {
    href: '/game-theory-workshops/',
    name: 'Game Theory Workshops',
    menuLine: 'Strategy, negotiation, and incentives, practiced at the table.',
    audience: 'For leaders and teams',
    blurb:
      'Your people play short, sharp games, then map the real decisions in front of them the same way: who the players are, what each wants, and the move that wins for everyone. Run at your office.',
    cta: 'Plan your strategy workshop',
  },
];
