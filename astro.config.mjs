// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import rehypeUnpublishedLinks from './src/plugins/rehype-unpublished-links.mjs';

// Same rule as src/lib/env.ts: local dev and preview branches show drafts;
// main (production) and plain local builds do not.
const branch = process.env.CF_PAGES_BRANCH;
const isBuild = process.argv.includes('build');
const showDrafts = branch ? branch !== 'main' : !isBuild;

// Pages that should never be in search results (also marked noindex on the page).
const NOT_IN_SITEMAP = ['/search/', '/newsletter/thanks/', '/corporate-events/thanks/', '/lounges/thanks/'];

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
      filter: (page) => !NOT_IN_SITEMAP.some((path) => new URL(page).pathname === path),
    }),
  ],
  markdown: {
    shikiConfig: { theme: 'github-light' },
    rehypePlugins: [[rehypeUnpublishedLinks, { showDrafts }]],
  },
});
