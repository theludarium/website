// @ts-check
import { defineConfig } from 'astro/config';
import fs from 'node:fs';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeUnpublishedLinks from './src/plugins/rehype-unpublished-links.mjs';

// Same rule as src/lib/env.ts: local dev and preview branches show drafts;
// main (production) and plain local builds do not.
const branch = process.env.CF_PAGES_BRANCH;
const isBuild = process.argv.includes('build');
const showDrafts = branch ? branch !== 'main' : !isBuild;

// Pages that should never be in search results (also marked noindex on the page).
const NOT_IN_SITEMAP = ['/search/', '/newsletter/thanks/', '/newsletter/confirmed/', '/corporate-events/thanks/', '/lounges/thanks/'];

// RPG Demo Library demos are copied in after the build (scripts/rpg-demo-library.mjs),
// so list them for the sitemap here.
const RDL_GAMES = 'vendor/rpg-demo-library/games';
const rdlPages = fs.existsSync(RDL_GAMES)
  ? fs.readdirSync(RDL_GAMES).map((game) => `https://theludarium.com/rpg-demo-library/games/${game}/`)
  : [];
// Game Night Madness is copied in the same way (scripts/game-night-madness.mjs).
const gnmPages = fs.existsSync('vendor/game-night-madness/index.html') ? ['https://theludarium.com/game-night-madness/'] : [];

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
      filter: (page) => !NOT_IN_SITEMAP.some((path) => new URL(page).pathname === path),
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
    rehypePlugins: [[rehypeUnpublishedLinks, { showDrafts }]],
  },
});
