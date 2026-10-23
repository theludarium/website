import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { CATEGORIES } from '@/lib/site';
import { LEVEL_NAMES } from '@/lib/academy-levels';
import { KIT_OFFER_KEYS } from '@/lib/config';

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
        // Optional newsletter offer (a key of KIT_OFFER_FORMS in src/lib/config.ts):
        // swaps the end-of-article signup for that offer's copy and Kit form.
        offer: z.enum(KIT_OFFER_KEYS).optional(),
        // Optional shorter title for the browser tab and search results (the site
        // name is appended, so aim for 55 characters or fewer). The H1 stays `title`.
        seoTitle: z.string().max(60).optional(),
      })
      .refine((data) => !data.heroImage || (data.heroAlt && data.heroAlt.length > 0), {
        message: 'heroAlt is required when heroImage is set.',
        path: ['heroAlt'],
      }),
});

// Free Academy lessons (see DECISIONS.md, 2026-10-22). Files live in
// src/content/lessons/<course>/<slug>.md and publish at /academy/<course>/<slug>/.
// Paid lessons never live in this repo. Drafts can be bare scaffolds; a
// published lesson must have its one idea, a Level check, and (except the
// last lesson) a teaser for the next one.
const levelCheckQuestion = z
  .object({
    question: z.string().min(1),
    options: z.array(z.string().min(1)).min(2).max(5),
    answer: z.enum(['A', 'B', 'C', 'D', 'E']),
    explain: z.string().min(1),
  })
  .refine((q) => q.answer.charCodeAt(0) - 65 < q.options.length, {
    message: 'answer must be the letter of one of the options (A is the first).',
    path: ['answer'],
  });

const lessons = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/lessons' }),
  schema: z
    .object({
      title: z.string().min(1),
      description: z
        .string()
        .min(150, 'Description should be 150 to 160 characters (it becomes the search snippet).')
        .max(160, 'Description should be 150 to 160 characters (it becomes the search snippet).'),
      course: z.enum(['catan']),
      level: z.number().int().min(0).max(5),
      levelName: z.enum(LEVEL_NAMES),
      order: z.number().int().min(1).max(40),
      emailSubject: z.string().min(1),
      pubDate: z.coerce.date(),
      updatedDate: z.coerce.date().optional(),
      draft: z.boolean().default(false),
      oneIdea: z.string().optional(),
      levelCheck: z.array(levelCheckQuestion).max(3).optional(),
      nextTeaser: z.string().optional(),
    })
    .refine((d) => LEVEL_NAMES[d.level] === d.levelName, {
      message: 'levelName must match level (0 Settler, 1 Homesteader, 2 Trader, 3 Strategist, 4 Contender, 5 Champion).',
      path: ['levelName'],
    })
    .refine((d) => d.draft || (d.oneIdea && d.oneIdea.length > 0), {
      message: 'A published lesson needs its one idea (oneIdea).',
      path: ['oneIdea'],
    })
    .refine((d) => d.draft || (d.levelCheck && d.levelCheck.length >= 2), {
      message: 'A published lesson needs a Level check with 2 or 3 questions.',
      path: ['levelCheck'],
    }),
});

export const collections = { articles, lessons };
