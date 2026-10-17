// @ts-check
import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

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
  },
});
