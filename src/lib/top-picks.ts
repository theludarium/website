import { z } from 'astro/zod';

// One pick in the top picks box (src/components/TopPicks.astro).
export const topPickSchema = z.object({
  name: z.string().min(1),
  /** Who it suits, in a short sentence. No prices. */
  who: z.string().min(1).max(110),
  /** Amazon listing with the site's tag. */
  href: z.string().regex(/^https:\/\/(www\.amazon\.com\/dp\/[^?]+\?tag=cubecommonw0a-20|link\.amazon\/\w+)$/, 'Use an Amazon link the site already uses.'),
  /** On the Table slug, if the game has one. */
  game: z.string().optional(),
});

export type TopPick = z.infer<typeof topPickSchema>;
