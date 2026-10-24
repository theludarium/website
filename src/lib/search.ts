// Site search runs on Pagefind, which indexes the finished site at the end of
// `npm run build` (see package.json) into dist/pagefind/. Every indexed page
// carries a section, derived here from its URL, which becomes the filter pills
// and the eyebrow on results. Keep the order the way the pills should read.
export const SEARCH_SECTIONS = ['Articles', 'Academy', 'Play', 'Lounges', 'For teams', 'Store', 'About'] as const;

export type SearchSection = (typeof SEARCH_SECTIONS)[number];

export function searchSection(pathname: string): SearchSection {
  if (pathname.startsWith('/articles/')) return 'Articles';
  if (pathname.startsWith('/academy/')) return 'Academy';
  if (/^\/(play|card-catalogue|rpg-demo-library|game-night-madness)\//.test(pathname)) return 'Play';
  if (pathname.startsWith('/lounges/')) return 'Lounges';
  if (pathname.startsWith('/corporate-events/')) return 'For teams';
  if (pathname.startsWith('/store/')) return 'Store';
  return 'About';
}
