// Shared pieces for tools that live in their own repos and are copied into the
// site after the build (RPG Demo Library, Game Night Madness): a slim Ludarium
// bar that links home, and the site's own analytics snippet.
import fs from 'node:fs';

export const SITE = 'https://theludarium.com';

export const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

/** The bar: the Ludarium mark and name, a slash, then a link to the tool. */
export function bar(label, href) {
  const brand = fs.readFileSync('src/lib/brand.ts', 'utf8');
  const mark = brand.match(/MARK_PATH =\s*'([^']+)'/)[1];
  return `<nav class="ldr-bar" aria-label="The Ludarium"><a class="ldr-bar__home" href="/"><svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${mark}"/></svg><span>The Ludarium</span></a><span aria-hidden="true">/</span><a href="${href}">${label}</a></nav>`;
}

/** Styles for the bar. `extra` adds tool-specific rules. */
export const barCss = (extra = '') => `<style>
.ldr-bar{position:relative;z-index:50;display:flex;align-items:center;gap:10px;padding:10px 16px;background:#2B1E16;color:#F6EFE3;font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.ldr-bar a{color:inherit;text-decoration:none}
.ldr-bar a:hover{text-decoration:underline}
.ldr-bar a:focus-visible{outline:2px solid #E0A23B;outline-offset:3px;border-radius:4px}
.ldr-bar__home{display:inline-flex;align-items:center;gap:8px;font-family:Georgia,"Times New Roman",serif;font-size:15px}
.ldr-bar svg{width:22px;height:22px;flex:none}
.ldr-bar>span{opacity:.5}
${extra}</style>`;

// The site's own analytics snippet (consent defaults plus gtag), lifted from the
// built home page so the tools follow exactly the same privacy rules.
export function analyticsSnippet() {
  const home = fs.readFileSync('dist/index.html', 'utf8');
  return home.match(/<script[^>]*>(?:(?!<\/script>)[\s\S])*ludarium-consent(?:(?!<\/script>)[\s\S])*<\/script>/)?.[0] ?? '';
}
