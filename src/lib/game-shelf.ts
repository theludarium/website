// The Game Shelf course: six article series in reading order, with the
// one-line summaries shown on the course page at /academy/game-shelf/. That
// page is also where the Game Shelf email series (Kit) is offered; see
// docs/newsletter/GAME-SHELF-SERIES.md. Keep slugs in step with the files in
// src/content/articles/.

export const GAME_SHELF_CATEGORY_SLUG = 'game-shelf';

/** How the course appears in the Academy catalog. */
export const GAME_SHELF_COURSE = {
  slug: 'game-shelf',
  title: 'The Game Shelf',
  /** The Academy track, shown as the card eyebrow. */
  track: 'Game library',
  description:
    'Six series on building, sharing, and organizing a game collection worth playing, from the One Copy Rule to library science for gamers. One short article at a time, by email and on the site.',
};

export interface GameShelfSeries {
  /** Anchor on the hub page. */
  slug: string;
  name: string;
  summary: string;
  articles: { slug: string; summary: string }[];
}

export const GAME_SHELF_SERIES: GameShelfSeries[] = [
  {
    slug: 'shared-shelf',
    name: 'The Shared Shelf',
    summary: 'Turn your group\'s separate collections into one shared library, with more games for the same money.',
    articles: [
      { slug: 'one-copy-rule', summary: 'Why duplicate copies add cost but zero plays, and a plan to pool your group\'s games.' },
      { slug: 'when-a-second-copy-is-worth-it', summary: 'One test settles every case, plus a checklist and the excuses that only sound like reasons.' },
      { slug: 'claim-a-lane', summary: 'Six lanes, who should take each one, and how to rebalance when someone joins or leaves.' },
      { slug: 'shared-shelf-social-contract', summary: 'Fair answers for the friend who never hosts and the one who always buys, plus a charter to copy.' },
      { slug: 'gifting-as-library-strategy', summary: 'Why one person\'s gift improves everyone\'s game night, plus the etiquette that keeps it easy.' },
      { slug: 'two-groups-two-years', summary: 'One group buys the same hits, the other coordinates, and ends up with double the library.' },
      { slug: 'cube-perfect-shared-library', summary: 'No Magic needed: three habits from Cube drafting that any shared game shelf can borrow.' },
      { slug: 'audit-your-group-shelf', summary: 'Price your duplicates, spot the empty lanes, and turn the gaps into a group wishlist.' },
    ],
  },
  {
    slug: 'building-your-library',
    name: 'Building Your Library on Purpose',
    summary: 'Grow a board game shelf in stages, from free plays to a lifetime library your table loves.',
    articles: [
      { slug: 'play-before-you-pay', summary: 'Free places to play, a 90-second taste log, and three signs you are ready to buy.' },
      { slug: 'your-first-40-dollars', summary: 'Score games on four qualities, see picks for couples, families, and parties, and what to skip.' },
      { slug: 'starter-shelf-40-to-300', summary: 'Six roles, one game each, a buying order, and how to split the shelf with your friends.' },
      { slug: 'core-library-300-to-1000', summary: 'Let your play log steer spending: when to expand, when a role earns a second game, who to buy for.' },
      { slug: 'curator-1000-and-beyond', summary: 'Set a cap, name the game that leaves before you buy, and hold a yearly keep-or-go review.' },
      { slug: 'lifetime-library', summary: 'Four traits that make a game last, and how to keep, note, and hand down the ones that do.' },
    ],
  },
  {
    slug: 'math-of-game-night',
    name: 'The Math of Game Night',
    summary: 'Use one formula to see what game night really costs, then make every dollar buy more play.',
    articles: [
      { slug: 'cost-per-play-explained', summary: 'Divide price by plays, players, and hours, and see why your group is where the value lives.' },
      { slug: 'shelf-of-shame-infinite-cost', summary: 'Why games stall, a quick shelf audit, and a no-guilt plan: schedule it, trade it, or admit it.' },
      { slug: 'board-games-vs-everything-else', summary: 'Ballgames, movies, and concerts run through the same formula. The table wins, if you play.' },
      { slug: 'how-much-do-gamers-spend', summary: 'Where hobbyists land, plus a short method for setting your own yearly budget from hours played.' },
      { slug: 'why-board-games-cost-more-now', summary: 'Tariffs and thin margins explain the price tag. Plays, players, and hours are still yours to set.' },
    ],
  },
  {
    slug: 'smart-buying',
    name: 'Smart Buying',
    summary: 'Buy used, weigh expansions and campaigns, shop cons, sell what sits, and cap the shelf so every box gets played.',
    articles: [
      { slug: 'how-to-buy-used-board-games', summary: 'Where the good boxes turn up, what to count before you pay, and which games to skip.' },
      { slug: 'expansions-worth-it', summary: 'The core test: has your group seen the edges of the base game yet?' },
      { slug: 'kickstarter-question', summary: 'Ask if you\'d buy it at retail, usually skip the deluxe tier, and pick one backer for your group.' },
      { slug: 'trading-and-selling-games', summary: 'Know when a game is done, let your group claim it first, then list it with honest photos.' },
      { slug: 'convention-buying-without-regret', summary: 'Shop from a gap list, demo first, sleep on big buys, and pick one buyer per game in your group.' },
      { slug: 'one-in-one-out-shelf-cap', summary: 'Choose a limit that fits how you play, then make every new game beat your weakest one.' },
    ],
  },
  {
    slug: 'running-a-play-group',
    name: 'Running a Play Group',
    summary: 'Start a game group, share the hosting and the shelf, and keep it going for years.',
    articles: [
      { slug: 'how-to-start-a-play-group', summary: 'Who to invite, which night to protect, and what to play the first three times you meet.' },
      { slug: 'rotating-hosts-rotating-shelves', summary: 'A schedule anyone can recite, who brings what, and a real job for the member who can\'t host.' },
      { slug: 'match-games-to-your-group', summary: 'Before any purchase, name who will teach it and which night it will hit the table.' },
      { slug: 'teachers-shelf', summary: 'The games that rescue a night, and a teaching order that works: goal, turn, example, go.' },
      { slug: 'keeping-a-group-together', summary: 'Small rituals people would miss, and a simple plan to revive a group that went quiet.' },
    ],
  },
  {
    slug: 'library-science',
    name: 'Library Science for Gamers',
    summary: 'Borrow a few habits from libraries to shelve, code, and track your games so the whole group can find them.',
    articles: [
      { slug: 'organize-by-role-not-box-size', summary: 'Seven roles and a doorway test, so a friend can pick tonight\'s game without asking you.' },
      { slug: 'ludarium-classification-system', summary: 'Five facts in one code on the spine, so friends can compare shelves by text message.' },
      { slug: 'tracking-plays-changes-what-you-buy', summary: 'Five fields per play add up to a report: your real top five, real play time, and what to trade.' },
      { slug: 'group-shelf-feature', summary: 'One shared sheet spots duplicates, tracks loans, and routes expansion wishes to the right friend.' },
    ],
  },
];
