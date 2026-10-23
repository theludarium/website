// Level names for Academy courses. Kept in a plain module (no astro:content
// import) so src/content.config.ts can use it too.
export const LEVEL_NAMES = ['Settler', 'Homesteader', 'Trader', 'Strategist', 'Contender', 'Champion'] as const;
export type LevelName = (typeof LEVEL_NAMES)[number];
