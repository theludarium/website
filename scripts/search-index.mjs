// Builds the site search index (Pagefind) at the end of `npm run build`.
//   node scripts/search-index.mjs
// Indexes every page in dist/ that carries data-pagefind-body (the Astro
// pages; see src/layouts/BaseLayout.astro and src/lib/search.ts), then adds one
// record per RPG demo and one for Game Night Madness. Those are vendor apps whose
// pages render by script, so instead of their HTML we index a short description
// built from the library's own data: adventure title, game system, blurb, tags.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import * as pagefind from 'pagefind';

const DIST = 'dist';
const RDL = 'vendor/rpg-demo-library';
const RDL_BASE = '/rpg-demo-library/';

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const pick = (html, re) => decode(html.match(re)?.[1] ?? '');

/** Store products keyed by demo folder, for the game system name. */
function readProducts() {
  const file = path.join(RDL, 'store.js');
  if (!fs.existsSync(file)) return {};
  const sandbox = { window: {} };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  const byDemo = {};
  for (const product of Object.values(sandbox.window.RDL_STORE?.products ?? {})) byDemo[product.demo] = product;
  return byDemo;
}

/** One search record per demo, from the library's front-page cards plus each demo's own title and description. */
function demoRecords() {
  const index = path.join(RDL, 'index.html');
  if (!fs.existsSync(index)) return [];
  const html = fs.readFileSync(index, 'utf8');
  const products = readProducts();
  const records = [];
  for (const m of html.matchAll(/<a class="game[^"]*" href="games\/([^/"]+)\/"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, slug, card] = m;
    const pageFile = path.join(RDL, 'games', slug, 'index.html');
    const page = fs.existsSync(pageFile) ? fs.readFileSync(pageFile, 'utf8') : '';
    const title = pick(card, /<div class="t[^"]*">([\s\S]*?)<\/div>/) || pick(page, /<h1[^>]*>([\s\S]*?)<\/h1>/);
    const subtitle = pick(card, /<div class="s">([\s\S]*?)<\/div>/);
    const blurb = pick(card, /<div class="info">\s*<p>([\s\S]*?)<\/p>/);
    const tags = [...card.matchAll(/<span(?: class="[^"]*")?>([^<]*)<\/span>/g)]
      .map((t) => decode(t[1]))
      .filter((t) => t && t !== 'Full adventure PDF' && !t.startsWith('Play'));
    const description = pick(page, /<meta name="description" content="([^"]*)"/);
    const pageTitle = pick(page, /<title>([^<]*)<\/title>/);
    const game =
      products[`games/${slug}/`]?.game ??
      subtitle.match(/(?:for|compatible with(?: the)?) (.+?)\.?$/)?.[1] ??
      pageTitle.split(':')[0];
    // A card titled after the game alone (Skellies) takes the page title, which names the adventure too.
    const fullTitle = title === game && pageTitle.includes(':') ? pageTitle : title;
    records.push({
      url: `${RDL_BASE}games/${slug}/`,
      content: [
        `${fullTitle}: a free tabletop RPG demo for ${game}.`,
        subtitle && `${subtitle}.`,
        blurb,
        tags.length > 0 && `${tags.join(', ')}.`,
        description,
        'Play Act One free in your browser, from the RPG Demo Library.',
      ]
        .filter(Boolean)
        .join(' '),
      language: 'en',
      meta: { title: fullTitle, description: description || blurb, section: 'Play', category: game },
      filters: { section: ['Play'], category: [game] },
    });
  }
  return records;
}

/** Game Night Madness is a vendor app served whole; one record from its own title and description. */
function gameNightMadnessRecord() {
  const file = path.join(DIST, 'game-night-madness', 'index.html');
  if (!fs.existsSync(file)) return null;
  const html = fs.readFileSync(file, 'utf8');
  if (html.includes('data-pagefind-body')) return null; // already an indexed site page
  const description = pick(html, /<meta name="description" content="([^"]*)"/);
  return {
    url: '/game-night-madness/',
    content: [
      'Game Night Madness: a tabletop game bracket for your group.',
      description,
      'Everyone votes from their phones, round by round, until one game from the organizer’s BoardGameGeek shelf is left. Free to use.',
    ]
      .filter(Boolean)
      .join(' '),
    language: 'en',
    meta: { title: 'Game Night Madness', description, section: 'Play', category: 'Game tool' },
    filters: { section: ['Play'], category: ['Game tool'] },
  };
}

const { index, errors } = await pagefind.createIndex();
if (!index) throw new Error(`Pagefind could not start: ${errors?.join('; ')}`);
const { page_count: pages } = await index.addDirectory({ path: DIST });
const extra = [...demoRecords(), gameNightMadnessRecord()].filter(Boolean);
for (const record of extra) {
  const { errors: recordErrors } = await index.addCustomRecord(record);
  if (recordErrors?.length) throw new Error(`Search record for ${record.url}: ${recordErrors.join('; ')}`);
}
const out = await index.writeFiles({ outputPath: path.join(DIST, 'pagefind') });
if (out.errors?.length) throw new Error(`Writing the search index: ${out.errors.join('; ')}`);
await pagefind.close();
console.log(`Search index: ${pages} pages plus ${extra.length} records for the game tools, written to ${DIST}/pagefind/`);
