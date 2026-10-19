// Metadata check that runs after every build (npm run build).
// Errors fail the build, so a page cannot ship without the SEO basics.
// Warnings are printed but do not fail it.
//
// Every built page needs: no broken internal links, a title, a meta description, a canonical URL on
// theludarium.com, exactly one h1, a share image, and alt text on images.
// Titles and descriptions must be unique across indexable pages, and no
// title, description, or alt text may contain an em dash (house style).
// Published pages may not carry unfilled <!-- EDITOR: ... --> notes from the content library.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const DIST = 'dist';
const SITE = 'https://theludarium.com';
const errors = [];
const warnings = [];

const htmlFiles = (dir) =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith('.html') ? [path] : [];
  });

const decode = (text) =>
  text
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
const meta = (html, attr, name) =>
  html.match(new RegExp(`<meta[^>]*${attr}="${name}"[^>]*content="([^"]*)"`, 'i'))?.[1] ??
  html.match(new RegExp(`<meta[^>]*content="([^"]*)"[^>]*${attr}="${name}"`, 'i'))?.[1];

const seenTitles = new Map();
const seenDescriptions = new Map();

for (const file of htmlFiles(DIST)) {
  const page = '/' + relative(DIST, file).replace(/index\.html$/, '');
  const html = readFileSync(file, 'utf8');
  const problem = (message) => errors.push(`${page}: ${message}`);
  const note = (message) => warnings.push(`${page}: ${message}`);

  // Broken internal links: every same-site href must point at a built file.
  // Routes served by Cloudflare Functions (/api/) are not in dist, so skip them.
  const linkTargets = new Set(
    [...html.matchAll(/<a\b[^>]*\bhref="(\/(?!\/)[^"#?]*)/gi)].map((m) => decodeURI(m[1])),
  );
  for (const href of linkTargets) {
    if (href.startsWith('/api/') || href.startsWith('/cdn-cgi/')) continue;
    const target = href.endsWith('/') ? join(DIST, href, 'index.html') : join(DIST, href);
    if (!existsSync(target) && !existsSync(join(DIST, href, 'index.html'))) problem(`broken internal link to ${href}`);
  }

  const noindex = /<meta[^>]*name="robots"[^>]*noindex/i.test(html);
  const is404 = page === '/404.html';
  const title = decode(html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? '').trim();
  const description = decode(meta(html, 'name', 'description') ?? '').trim();
  const canonical = html.match(/<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i)?.[1];
  const h1s = (html.match(/<h1[\s>]/gi) ?? []).length;

  if (!title) problem('missing <title>');
  if (!description) problem('missing meta description');
  if (!canonical) problem('missing canonical link');
  else if (!canonical.startsWith(SITE)) problem(`canonical should be on ${SITE}, found ${canonical}`);
  if (h1s !== 1) problem(`expected exactly one <h1>, found ${h1s}`);
  if (!meta(html, 'property', 'og:image')) problem('missing og:image');

  for (const tag of html.match(/<img\b[^>]*>/gi) ?? []) {
    if (!/\balt="/i.test(tag)) problem(`image without alt text: ${tag.slice(0, 80)}...`);
  }

  const alts = [...html.matchAll(/\balt="([^"]*)"/gi)].map((m) => decode(m[1]));
  for (const [label, text] of [['title', title], ['description', description], ...alts.map((a) => ['alt text', a])]) {
    if (text.includes('—')) problem(`em dash in ${label}: "${text}"`);
  }

  if (title.length > 70) note(`title is ${title.length} characters; search results cut off around 60 to 70`);
  if (description && (description.length < 70 || description.length > 165)) {
    note(`description is ${description.length} characters; aim for about 120 to 160`);
  }

  if (!noindex && !is404) {
    // Editor notes from the content library must be filled in before an article is published.
    const editorNotes = html.match(/<!--\s*EDITOR:[^>]*-->/g) ?? [];
    if (editorNotes.length) problem(`${editorNotes.length} unfilled EDITOR note(s), first: ${editorNotes[0].slice(0, 90)}`);
    if (/<!--\s*(AFFILIATE|VERIFY)\s*-->/.test(html)) note('has AFFILIATE or VERIFY placeholder comments; add the links or remove the markers');
    if (seenTitles.has(title)) problem(`duplicate title, also on ${seenTitles.get(title)}`);
    else seenTitles.set(title, page);
    if (seenDescriptions.has(description)) problem(`duplicate description, also on ${seenDescriptions.get(description)}`);
    else seenDescriptions.set(description, page);
  }
}

for (const w of warnings) console.warn(`  warn  ${w}`);
for (const e of errors) console.error(`  error ${e}`);
console.log(`SEO check: ${seenTitles.size} indexable pages, ${errors.length} errors, ${warnings.length} warnings.`);
if (errors.length) process.exit(1);
