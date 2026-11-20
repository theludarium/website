// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeUnpublishedLinks from './src/plugins/rehype-unpublished-links.mjs';
import rehypeTableScroll from './src/plugins/rehype-table-scroll.mjs';
import rehypeAmazonLinks from './src/plugins/rehype-amazon-links.mjs';

// Same rule as src/lib/env.ts: local dev and preview branches show drafts;
// main (production) and plain local builds do not.
const branch = process.env.CF_PAGES_BRANCH;
const isBuild = process.argv.includes('build');
const showDrafts = branch ? branch !== 'main' : !isBuild;

// Pages that should never be in search results (also marked noindex on the page).
const NOT_IN_SITEMAP = ['/search/', '/newsletter/thanks/', '/newsletter/confirmed/', '/corporate-events/thanks/', '/lounges/thanks/', '/malaphors/thanks/', '/malaphors/confirmed/', '/academy/thanks/', '/academy/confirmed/',
  // Guild of Game Guides pages kept out of search: the email kit, the email-only toolkit printables, the capstone thanks page and Levi's certificate maker (see src/lib/guild-tools.ts).
  '/academy/guild/kit/', '/academy/guild/certificate/', '/academy/guild/capstone/thanks/',
  '/academy/guild/toolkit/teach-script/', '/academy/guild/toolkit/game-ladder/', '/academy/guild/toolkit/pre-flight-checklist/',
  '/academy/guild/toolkit/feedback-card/', '/academy/guild/toolkit/self-assessment/',
  '/cube-commonwealth/where-we-play/thanks/', '/cube-commonwealth/where-we-play/edit/', '/cube-commonwealth/where-we-play/admin/'];

// The Guild register stays out of search until it lists someone (see src/pages/academy/guild/register.astro).
if (JSON.parse(fs.readFileSync('src/data/guild-register.json', 'utf8')).length === 0) NOT_IN_SITEMAP.push('/academy/guild/register/');

// RPG Demo Library demos are copied in after the build (scripts/rpg-demo-library.mjs),
// so list them for the sitemap here.
const RDL_GAMES = 'vendor/rpg-demo-library/games';
const rdlPages = fs.existsSync(RDL_GAMES)
  ? fs.readdirSync(RDL_GAMES).map((game) => `https://theludarium.com/rpg-demo-library/games/${game}/`)
  : [];
// Game Night Madness is copied in the same way (scripts/game-night-madness.mjs).
const gnmPages = fs.existsSync('vendor/game-night-madness/index.html') ? ['https://theludarium.com/game-night-madness/'] : [];

// lastmod for the sitemap: an article's or lesson's updatedDate, else its pubDate, so crawlers
// and AI assistants can see what is fresh. Read straight from the frontmatter.
const LASTMOD = new Map();
/** @param {string} file */
const dateOf = (file) => {
  const fm = fs.readFileSync(file, 'utf8').split('---')[1] ?? '';
  const pick = (/** @type {string} */ key) => fm.match(new RegExp(`^${key}:\\s*["']?(\\d{4}-\\d{2}-\\d{2})`, 'm'))?.[1];
  return pick('updatedDate') ?? pick('pubDate');
};
for (const f of fs.readdirSync('src/content/articles')) {
  const d = dateOf(`src/content/articles/${f}`);
  if (d) LASTMOD.set(`/articles/${f.replace(/\.mdx?$/, '')}/`, d);
}
for (const course of fs.readdirSync('src/content/course-lessons')) {
  const dir = `src/content/course-lessons/${course}`;
  if (!fs.statSync(dir).isDirectory()) continue;
  for (const f of fs.readdirSync(dir)) {
    const d = dateOf(`${dir}/${f}`);
    if (d) LASTMOD.set(`/academy/${course}/${f.replace(/\.mdx?$/, '')}/`, d);
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
      serialize: (item) => {
        const d = LASTMOD.get(new URL(item.url).pathname);
        if (d) item.lastmod = d;
        return item;
      },
      filter: (page) => {
        const path = new URL(page).pathname;
        // Every game course's signup pages (/academy/<course>/thanks/ and /confirmed/) stay out too.
        return !NOT_IN_SITEMAP.includes(path) && !/^\/academy\/[^/]+\/(thanks|confirmed)\/$/.test(path);
      },
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
    rehypePlugins: [[rehypeUnpublishedLinks, { showDrafts }], rehypeTableScroll, rehypeAmazonLinks],
  },
});
