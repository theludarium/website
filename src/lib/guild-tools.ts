// The Guild toolkit: the printables and tools the lesson drills run on.
// Kept in a plain module (no astro:content import) so src/content.config.ts can
// use the slugs. Public tools are indexed pages that earn search traffic on
// their own. Kit tools are printables sent with the course emails: their pages
// exist (the emails link to them) but are kept out of search and the sitemap.
export const GUILD_TOOL_SLUGS = [
  'teach-script',
  'teachability-scorecard',
  'game-ladder',
  'pre-flight-checklist',
  'jargon-translator',
  'gotcha-index',
  'feedback-card',
  'self-assessment',
  'teach-library',
  'capstone',
] as const;

export type GuildToolSlug = (typeof GUILD_TOOL_SLUGS)[number];

export interface GuildTool {
  slug: GuildToolSlug;
  name: string;
  /** One line: what it is and what it is for. */
  blurb: string;
  /** public: an indexed page. kit: sent with the course emails, noindex. */
  access: 'public' | 'kit';
}

export const GUILD_TOOLS: GuildTool[] = [
  { slug: 'teach-script', name: 'The Five-Minute Teach Script', blurb: 'One page that holds your whole teach: the hook, the win, the turn, the gotcha, and what to leave out.', access: 'kit' },
  { slug: 'teachability-scorecard', name: 'The Teachability Scorecard', blurb: 'Seven yes-or-no questions that tell you whether a game is ready for a newcomer tonight.', access: 'public' },
  { slug: 'game-ladder', name: 'The Game Ladder Worksheet', blurb: 'Plan four games for one person, each adding one new idea.', access: 'kit' },
  { slug: 'pre-flight-checklist', name: 'The Pre-Flight Checklist', blurb: 'Twelve things to have ready before the first guest sits down.', access: 'kit' },
  { slug: 'jargon-translator', name: 'The Jargon Translator', blurb: 'Hobby words, and the plain words to say instead when you teach a newcomer.', access: 'public' },
  { slug: 'gotcha-index', name: 'The Gotcha Index', blurb: 'The one rule that surprises new players in popular games, so you can say it up front.', access: 'public' },
  { slug: 'feedback-card', name: 'The Newcomer Feedback Card', blurb: 'Five questions a new player answers in a minute after your teach.', access: 'kit' },
  { slug: 'self-assessment', name: 'The Self-Assessment', blurb: 'Score your own teach on ten lines, with what a five looks like on each.', access: 'kit' },
  { slug: 'teach-library', name: 'The Teach Library', blurb: 'Finished one-page teach sheets for popular gateway games, ready to print.', access: 'public' },
  { slug: 'capstone', name: 'The Capstone', blurb: 'Teach one new player, then send in your teach for review to earn the Expert Game Guide title.', access: 'public' },
];

export function guildTool(slug: GuildToolSlug): GuildTool {
  const found = GUILD_TOOLS.find((t) => t.slug === slug);
  if (!found) throw new Error(`Unknown Guild tool: ${slug}`);
  return found;
}

export function guildToolUrl(slug: GuildToolSlug): string {
  return slug === 'capstone' ? '/academy/guild/capstone/' : `/academy/guild/toolkit/${slug}/`;
}
