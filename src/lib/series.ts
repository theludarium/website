// How readers find their way through the articles: series (groups of related articles read in order),
// hand-picked "Start here" articles for each category, and the reader paths on /articles/.
// Series come from a shared tag, except the Game Shelf series, which keep their own order in game-shelf.ts.
import { GAME_SHELF_SERIES } from './game-shelf';
import type { Article } from './articles';

export interface Series {
  /** Anchor on the category page: #series-<slug>. */
  slug: string;
  name: string;
  blurb: string;
  /** Category (by name) whose page shows this series. */
  category: string;
  /** Members share this tag, in publish order. */
  tag?: string;
  /** Or an explicit reading order of article slugs. */
  order?: string[];
}

const TAG_SERIES: Series[] = [
  { slug: 'picks', tag: 'What to play', name: 'Picks for every table', blurb: 'Short lists of games that fit a group, a mood, or a night.', category: 'What to Play' },
  { slug: 'comparisons', tag: 'Comparisons', name: 'Head to head', blurb: 'Two games, one shelf spot: which one fits your table.', category: 'What to Play' },
  { slug: 'co-op-and-campaign', tag: 'Cooperative and campaign games', name: 'Co-op and campaign games', blurb: 'Games where the table wins or loses together.', category: 'What to Play' },
  { slug: 'gift-guides', tag: 'Gift guides', name: 'Gift guides', blurb: 'The right game for the person you are shopping for.', category: 'What to Play' },
  { slug: 'strategy-guides', tag: 'Strategy guides', name: 'Strategy guides', blurb: 'Get better at the games you already own.', category: 'How to Play' },
  { slug: 'glossary', tag: 'Glossary', name: 'The board game glossary', blurb: 'The words players use, in plain English.', category: 'How to Play' },
  { slug: 'rpgs-for-beginners', tag: 'Tabletop RPGs for beginners', name: 'Tabletop RPGs for beginners', blurb: 'From your first session to running the table.', category: 'How to Play' },
  { slug: 'solo-rpgs', tag: 'solo rpg', name: 'Solo RPGs', blurb: 'Roleplaying games you can play by yourself.', category: 'How to Play' },
  { slug: 'hosting', tag: 'Hosting and game-night craft', name: 'Hosting game night', blurb: 'The craft of a night people want to come back to.', category: 'Game Night' },
  { slug: 'programming', tag: 'Game night programming', name: 'Game night programming', blurb: 'Leagues, tournaments, themes, and events for bigger groups.', category: 'Game Night' },
  { slug: 'who-its-for', tag: "Who it's for", name: 'Games for every kind of group', blurb: 'What to play with the people you actually have.', category: 'Game Night' },
  { slug: 'family', tag: 'Family and intergenerational play', name: 'Family play', blurb: 'Kids, parents, and grandparents at one table.', category: 'Game Night' },
  { slug: 'social-benefits', tag: 'Social benefits of playing in person', name: 'Why play in person', blurb: 'What a shared table does for friendship and belonging.', category: 'Togethering' },
  { slug: 'play-and-health', tag: 'Play and health', name: 'Play and health', blurb: 'What the research says about games, stress, and the brain.', category: 'Togethering' },
  { slug: 'longevity', tag: 'Play and longevity', name: 'Play for a lifetime', blurb: 'Why play matters more, not less, as we get older.', category: 'Togethering' },
  { slug: 'workplace', tag: 'Games for the workplace', name: 'Games at work', blurb: 'Team building and connection that does not feel forced.', category: 'Togethering' },
  { slug: 'third-places', tag: 'Game lounges and third places', name: 'Third places', blurb: 'Where adults go to belong, and why game lounges work.', category: 'Togethering' },
  { slug: 'conventions', tag: 'Conventions', name: 'Conventions', blurb: 'Gen Con and beyond, from first visit to pitching a game.', category: 'Game Culture' },
  { slug: 'indianapolis', tag: 'Indianapolis', name: 'Playing in Indianapolis', blurb: 'Stores, cafes, and game nights in our home city.', category: 'Game Culture' },
  { slug: 'building-the-ludarium', tag: 'Building The Ludarium', name: 'Building The Ludarium', blurb: 'How and why we are building a game lounge.', category: 'Game Culture' },
  { slug: 'design', tag: 'Tabletop game design', name: 'Designing a board game', blurb: 'From an idea to a prototype, a playtest, and a pitch.', category: 'Game Design' },
  { slug: 'magic-and-cube-basics', tag: 'Magic: The Gathering and Cube', name: 'Magic and Cube, explained', blurb: 'What a cube is, how to draft one, and how to teach Magic with it.', category: 'Magic & Cube' },
  { slug: 'cube-design-philosophy', tag: 'cube design philosophy', name: 'Cube design philosophy', blurb: 'The questions behind every card in a cube.', category: 'Magic & Cube' },
];

const SHELF_SERIES: Series[] = GAME_SHELF_SERIES.map((s) => ({
  slug: s.slug,
  name: s.name,
  blurb: s.summary,
  category: 'Game Shelf',
  order: s.articles.map((a) => a.slug),
}));

export const SERIES: Series[] = [...TAG_SERIES, ...SHELF_SERIES];

const slugOf = (a: Article) => a.id.replace(/\.(md|mdx)$/, '');

/** The articles in a series, in reading order. */
export function seriesArticles(series: Series, all: Article[]): Article[] {
  if (series.order) {
    const bySlug = new Map(all.map((a) => [slugOf(a), a]));
    return series.order.map((s) => bySlug.get(s)).filter((a): a is Article => Boolean(a));
  }
  const tag = series.tag!.toLowerCase();
  return all
    .filter((a) => a.data.tags.some((t) => t.toLowerCase() === tag))
    .sort((a, b) => a.data.pubDate.valueOf() - b.data.pubDate.valueOf());
}

/** Every series an article belongs to. */
export function seriesOf(article: Article, all: Article[]): Series[] {
  const slug = slugOf(article);
  const tags = new Set(article.data.tags.map((t) => t.toLowerCase()));
  return SERIES.filter((s) => (s.order ? s.order.includes(slug) : tags.has(s.tag!.toLowerCase()))).filter(
    (s) => seriesArticles(s, all).length > 1,
  );
}

/** The article after this one in its first series, with that series. */
export function nextInSeries(article: Article, all: Article[]): { series: Series; next: Article; position: number; total: number } | undefined {
  for (const series of seriesOf(article, all)) {
    const list = seriesArticles(series, all);
    const i = list.findIndex((a) => a.id === article.id);
    if (i >= 0 && i < list.length - 1) return { series, next: list[i + 1], position: i + 1, total: list.length };
  }
  return undefined;
}

/** Hand-picked first reads for each category page, keyed by category slug. */
export const START_HERE: Record<string, string[]> = {
  'what-to-play': ['gateway-board-games', 'best-cooperative-board-games', 'easiest-board-games-to-learn', 'two-player-board-games-date-night', 'party-games-for-large-groups', 'holiday-board-game-gift-guide-2026'],
  'how-to-play': ['how-to-learn-a-board-game', 'how-to-teach-a-board-game', 'how-to-win-at-catan', 'what-is-a-tabletop-rpg', 'board-game-weight-explained', 'wingspan-strategy'],
  'game-night': ['how-to-host-a-game-night', 'game-night-lineup', 'match-games-to-your-group', 'how-to-start-a-play-group', 'family-game-night-ideas', 'games-to-play-with-friends'],
  togethering: ['togethering', 'loneliness-epidemic', 'how-to-make-friends-as-an-adult', 'benefits-of-play-for-adults', 'third-place-problem', 'team-building-board-games'],
  'game-shelf': ['one-copy-rule', 'play-before-you-pay', 'cost-per-play-explained', 'organize-by-role-not-box-size', 'games-like-catan', 'expansions-worth-it'],
  'game-culture': ['why-we-are-building-a-game-lounge', 'togethering-meaning', 'gen-con-first-timer-guide', 'spiel-des-jahres-winners', 'reiner-knizia-games', 'indianapolis-game-nights'],
  'game-design': ['how-to-make-your-own-board-game', 'board-game-mechanics-explained', 'how-to-playtest-a-board-game', 'how-to-prototype-a-board-game', 'theme-vs-mechanics', 'luck-vs-skill-board-games'],
  'magic-and-cube': ['what-is-a-magic-cube', 'how-to-build-a-cube-mtg', 'how-to-run-a-cube-draft', 'cube-draft-guide-new-players', 'how-to-teach-magic-the-gathering', 'cube-archetypes-explained'],
};

/** Reader paths on /articles/: what someone came to do, three first reads, and where to go next. */
export const READER_PATHS = [
  { title: 'New to board games', line: 'Easy games, and how to learn any of them.', slugs: ['gateway-board-games', 'easiest-board-games-to-learn', 'how-to-learn-a-board-game'], more: { label: 'More to play', href: '/articles/category/what-to-play/' } },
  { title: 'Hosting a game night', line: 'Plan it, run it, and get people to come back.', slugs: ['how-to-host-a-game-night', 'game-night-lineup', 'match-games-to-your-group'], more: { label: 'All game night articles', href: '/articles/category/game-night/' } },
  { title: 'Finding a game to buy or give', line: 'Picks for every table, budget, and person.', slugs: ['holiday-board-game-gift-guide-2026', 'games-like-catan', 'best-cooperative-board-games'], more: { label: 'Every gift guide', href: '/articles/category/what-to-play/#series-gift-guides' } },
  { title: 'Getting better at a game', line: 'Strategy for the games you already own.', slugs: ['how-to-win-at-catan', 'wingspan-strategy', 'how-to-teach-a-board-game'], more: { label: 'All strategy guides', href: '/articles/category/how-to-play/#series-strategy-guides' } },
  { title: 'Trying a tabletop RPG', line: 'What they are, and an easy first night.', slugs: ['what-is-a-tabletop-rpg', 'how-to-play-dnd-for-beginners', 'one-page-rpgs'], more: { label: 'RPGs for beginners', href: '/articles/category/how-to-play/#series-rpgs-for-beginners' } },
  { title: 'Why play together', line: 'What a shared table does for us.', slugs: ['togethering', 'loneliness-epidemic', 'how-to-make-friends-as-an-adult'], more: { label: 'All Togethering articles', href: '/articles/category/togethering/' } },
];

/** Look up articles by slug, skipping any that are missing or unpublished. */
export function bySlugs(slugs: string[], all: Article[]): Article[] {
  const map = new Map(all.map((a) => [slugOf(a), a]));
  return slugs.map((s) => map.get(s)).filter((a): a is Article => Boolean(a));
}
