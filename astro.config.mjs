// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeUnpublishedLinks from './src/plugins/rehype-unpublished-links.mjs';
import rehypeTableScroll from './src/plugins/rehype-table-scroll.mjs';

// Same rule as src/lib/env.ts: local dev and preview branches show drafts;
// main (production) and plain local builds do not.
const branch = process.env.CF_PAGES_BRANCH;
const isBuild = process.argv.includes('build');
const showDrafts = branch ? branch !== 'main' : !isBuild;

// Pages that should never be in search results (also marked noindex on the page).
const NOT_IN_SITEMAP = ['/search/', '/newsletter/thanks/', '/newsletter/confirmed/', '/corporate-events/thanks/', '/lounges/thanks/', '/malaphors/thanks/', '/malaphors/confirmed/', '/academy/thanks/', '/academy/confirmed/'];

// RPG Demo Library demos are copied in after the build (scripts/rpg-demo-library.mjs),
// so list them for the sitemap here.
const RDL_GAMES = 'vendor/rpg-demo-library/games';
const rdlPages = fs.existsSync(RDL_GAMES)
  ? fs.readdirSync(RDL_GAMES).map((game) => `https://theludarium.com/rpg-demo-library/games/${game}/`)
  : [];
// Game Night Madness is copied in the same way (scripts/game-night-madness.mjs).
const gnmPages = fs.existsSync('vendor/game-night-madness/index.html') ? ['https://theludarium.com/game-night-madness/'] : [];

// Game course lessons past the course's public ones are reached from the emails
// and stay out of the sitemap. Same rule as PUBLIC_LESSONS in src/lib/courses.ts.
/** @type {Record<string, number>} */
const PUBLIC_LESSONS = { full: 2, masterclass: 1, 'teach-tonight': 2, tcg: 8 };
const COURSE_DIR = 'src/content/courses';
const LESSON_DIR = 'src/content/course-lessons';
const emailOnlyLessons = new Set();
if (fs.existsSync(LESSON_DIR)) {
  for (const course of fs.readdirSync(LESSON_DIR)) {
    const yaml = `${COURSE_DIR}/${course}.yaml`;
    const format = fs.existsSync(yaml) ? (fs.readFileSync(yaml, 'utf8').match(/^format:\s*['"]?([\w-]+)/m)?.[1] ?? 'full') : 'full';
    for (const file of fs.readdirSync(`${LESSON_DIR}/${course}`).filter((f) => f.endsWith('.md'))) {
      const order = Number(fs.readFileSync(`${LESSON_DIR}/${course}/${file}`, 'utf8').match(/^order:\s*(\d+)/m)?.[1] ?? 0);
      if (order > (PUBLIC_LESSONS[format] ?? 2)) emailOnlyLessons.add(`/academy/${course}/${file.replace(/\.md$/, '')}/`);
    }
  }
}

export default defineConfig({
  site: 'https://theludarium.com',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  integrations: [
    mdx(),
    sitemap({
      customPages: [...rdlPages, ...gnmPages],
      filter: (page) => {
        const path = new URL(page).pathname;
        return !NOT_IN_SITEMAP.includes(path) && !emailOnlyLessons.has(path);
      },
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
    rehypePlugins: [[rehypeUnpublishedLinks, { showDrafts }], rehypeTableScroll],
  },
});
