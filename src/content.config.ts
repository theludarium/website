import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from '@/lib/site';

const categoryNames = CATEGORIES.map((c) => c.name) as [string, ...string[]];

// Frontmatter contract for every article (see CLAUDE.md, "Article content model").
// Files live in src/content/articles/; the file name becomes the URL slug.
const articles = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/articles' }),
  schema: ({ image }) =>
    z
      .object({
        title: z.string().min(1),
        description: z
          .string()
          .min(150, 'Description should be 150 to 160 characters (it becomes the search snippet).')
          .max(160, 'Description should be 150 to 160 characters (it becomes the search snippet).'),
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        category: z.enum(categoryNames),
        tags: z.array(z.string()).default([]),
        heroImage: image().optional(),
        heroAlt: z.string().optional(),
        draft: z.boolean().default(false),
      })
      .refine((data) => !data.heroImage || (data.heroAlt && data.heroAlt.length > 0), {
        message: 'heroAlt is required when heroImage is set.',
        path: ['heroAlt'],
      }),
});

export const collections = { articles };
