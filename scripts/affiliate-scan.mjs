#!/usr/bin/env node
// Affiliate link scan: finds games a page mentions but does not link to Amazon.
//
//   node scripts/affiliate-scan.mjs                 summary to stdout
//   node scripts/affiliate-scan.mjs --csv out.csv   plus one row per missed mention
//   node scripts/affiliate-scan.mjs --md out.md     plus a Markdown report
//
// How it works:
// 1. Builds a game dictionary. Names and Amazon URLs come from links the site
//    already has ([Name](amazon url), <AffiliateLink>, BuyBlock items). Names
//    with no URL yet come from course files (game:) and the Card Catalogue.
// 2. Reads every published article, course lesson and Guild lesson, masks out
//    frontmatter, code, headings, imports, HTML/MDX tags and existing links,
//    then finds the first plain-text mention of each game.
// 3. Reports a mention only when the page has no Amazon link for that game yet.
//
// It changes no files. Names that are also ordinary English words (Root, Hive,
// Skull) are marked "check" because a match may not mean the game.
import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const CONTENT = path.join(ROOT, 'src/content');
const AMAZON = /https:\/\/(?:www\.amazon\.com|link\.amazon|amzn\.to)\/[^\s)"'`<>]+/;
const AMAZON_G = new RegExp(AMAZON.source, 'g');

const args = process.argv.slice(2);
const argVal = (flag) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : undefined;
};

// ---------- files ----------
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : /\.mdx?$/.test(d.name) ? [p] : [];
  });
}

function pageUrl(file) {
  const rel = path.relative(CONTENT, file).replace(/\.mdx?$/, '');
  const [col, ...rest] = rel.split(path.sep);
  const slug = rest.join('/');
  if (col === 'articles') return `/articles/${slug}/`;
  if (col === 'guild-lessons') return `/academy/guild/${slug}/`;
  if (col === 'course-lessons') return `/academy/${slug}/`;
  if (col === 'lessons') return `/academy/catan/${slug}/`;
  return `/${rel}/`;
}

function splitFrontmatter(src) {
  const m = src.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  return m ? { fm: m[1], body: src.slice(m[0].length), offset: m[0].length } : { fm: '', body: src, offset: 0 };
}

const pages = ['articles', 'course-lessons', 'guild-lessons', 'lessons']
  .flatMap((c) => walk(path.join(CONTENT, c)))
  .map((file) => {
    const src = fs.readFileSync(file, 'utf8');
    const { fm, body } = splitFrontmatter(src);
    return { file, url: pageUrl(file), collection: path.relative(CONTENT, file).split(path.sep)[0], src, fm, body };
  })
  .filter((p) => !/^draft:\s*true\b/m.test(p.fm));

// ---------- dictionary ----------
const GENERIC = new Set(['here', 'amazon', 'this one', 'the base game', 'base game', 'buy it', 'on amazon', 'link', 'this', 'it']);
const cleanName = (s) =>
  s
    .replace(/\*|_|`/g, '')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();

function* linkPairs(text) {
  // Markdown links: [Name](amazon)
  for (const m of text.matchAll(/\[([^\]\n]{1,80})\]\((https:\/\/(?:www\.amazon\.com|link\.amazon|amzn\.to)\/[^)\s]+)\)/g)) yield [m[1], m[2]];
  // <AffiliateLink href="amazon">Name</AffiliateLink>
  for (const m of text.matchAll(/<AffiliateLink[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/AffiliateLink>/g))
    if (AMAZON.test(m[1])) yield [m[2], m[1]];
  // BuyBlock items: { name: 'Azul', ... href: 'amazon' }
  for (const m of text.matchAll(/name:\s*(['"])(.+?)\1[^{}]*?href:\s*(['"])(.+?)\3/g)) if (AMAZON.test(m[4])) yield [m[2], m[4]];
}

const urlVotes = new Map(); // name -> Map(url -> count)
for (const p of pages) {
  for (const [rawName, url] of linkPairs(p.body)) {
    const name = cleanName(rawName);
    if (!name || name.length < 3 || name.split(' ').length > 7) continue;
    if (GENERIC.has(name.toLowerCase())) continue;
    if (!/^[A-Z0-9]/.test(name)) continue; // anchors like "a copy" are not names
    const votes = urlVotes.get(name) ?? new Map();
    votes.set(url, (votes.get(url) ?? 0) + 1);
    urlVotes.set(name, votes);
  }
}

const games = new Map(); // name -> { url, urls, linkedOn, source }
for (const [name, votes] of urlVotes) {
  const sorted = [...votes].sort((a, b) => b[1] - a[1]);
  games.set(name, { url: sorted[0][0], urls: sorted.map((s) => s[0]), source: 'existing link' });
}

const KNOWN_GAMES = new Set(); // course games and Card Catalogue names
const addName = (name, source) => {
  name = cleanName(name ?? '');
  if (name.length >= 3 && !games.has(name)) games.set(name, { url: '', urls: [], source });
};
for (const f of fs.readdirSync(path.join(CONTENT, 'courses')).filter((f) => /\.ya?ml$/.test(f))) {
  const m = fs.readFileSync(path.join(CONTENT, 'courses', f), 'utf8').match(/^game:\s*["']?(.+?)["']?\s*$/m);
  if (m) {
    addName(m[1], 'course');
    KNOWN_GAMES.add(cleanName(m[1]).toLowerCase());
  }
}
try {
  const cat = JSON.parse(fs.readFileSync(path.join(ROOT, 'src/data/card-catalogue.json'), 'utf8'));
  for (const g of Object.values(cat)) {
    addName(g.name, 'card catalogue');
    KNOWN_GAMES.add(cleanName(g.name).toLowerCase());
  }
} catch {}

// Names that are ordinary words get a "check" flag.
let dict = new Set();
try {
  // Keep only lowercase entries: those are ordinary words, not names.
  dict = new Set(fs.readFileSync('/usr/share/dict/words', 'utf8').split('\n').filter((w) => /^[a-z]+$/.test(w)));
} catch {}
// A Title Case match of a multi-word name is almost always the game, so only
// single ordinary words and a few short phrases get the flag.
const COMMON_PHRASES = new Set(['the crew', 'the mind', 'the game', 'just one', 'card sleeves']);
const NOT_THE_GAME = /(?:Black|Good|Cyber|Next|This|Last|on) Friday|Planet Earth|on Earth/;
const ALWAYS_CHECK = new Set(['Friday', 'Earth', 'Risk', 'Hearts', 'Spades', 'Chess', 'Clue', 'Sorry!', 'Cities', 'Leaders', 'Colonies', 'Seafarers']);
const isCommon = (name) =>
  ALWAYS_CHECK.has(name) ||
  COMMON_PHRASES.has(name.toLowerCase()) ||
  (!name.includes(' ') && !KNOWN_GAMES.has(name.toLowerCase()) && dict.has(name.toLowerCase()));
// Sentence starts capitalize ordinary words, so for those names skip a match
// that opens a sentence and look for one in mid-sentence.
const sentenceStart = (text, idx) => /(^|[.!?:]\s+|\n\s*(?:[-*+]|\d+\.)?\s*)$/.test(text.slice(Math.max(0, idx - 6), idx));

// ---------- masking ----------
// Replace a span with spaces so offsets (and line numbers) stay true.
const blank = (s) => s.replace(/[^\n]/g, ' ');
function maskBody(body) {
  let t = body;
  t = t.replace(/```[\s\S]*?```/g, blank);
  t = t.replace(/`[^`\n]*`/g, blank);
  t = t.replace(/^(import|export)\s.*$/gm, blank);
  t = t.replace(/^#{1,6}\s.*$/gm, blank); // headings
  t = t.replace(/^\s*>.*$/gm, blank); // quotes
  t = t.replace(/<!--[\s\S]*?-->/g, blank);
  t = t.replace(/<AffiliateLink[\s\S]*?<\/AffiliateLink>/g, blank);
  t = t.replace(/<BuyBlock[\s\S]*?\/>/g, blank);
  t = t.replace(/!\[[^\]]*\]\([^)]*\)/g, blank); // images
  t = t.replace(/\[[^\]\n]*\]\([^)\n]*\)/g, blank); // any existing link
  t = t.replace(/<a\b[\s\S]*?<\/a>/g, blank);
  t = t.replace(/<[^>\n]+>/g, blank); // remaining tags (text between stays)
  t = t.replace(/https?:\/\/\S+/g, blank);
  return t;
}

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const ordered = [...games.keys()].sort((a, b) => b.length - a.length); // longest first
const patterns = ordered.map((name) => [name, new RegExp(`(?<![\\w'’-])${esc(name)}(?![\\w-])`, 'g')]);

// ---------- scan ----------
const rows = [];
const pageStats = [];
for (const p of pages) {
  const pairs = [...linkPairs(p.body)];
  const linkedUrls = new Set(pairs.map(([, u]) => u));
  const linkedNames = new Set(pairs.map(([n]) => cleanName(n)));
  const amazonCount = (p.body.match(AMAZON_G) ?? []).length;
  let masked = maskBody(p.body);
  const lineStarts = [0];
  for (let i = 0; i < p.body.length; i++) if (p.body[i] === '\n') lineStarts.push(i + 1);
  const bodyStartLine = p.src.slice(0, p.src.length - p.body.length).split('\n').length;
  const lineOf = (idx) => {
    let lo = 0, hi = lineStarts.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (lineStarts[mid] <= idx) lo = mid; else hi = mid - 1;
    }
    return lo;
  };

  let missed = 0;
  for (const [name, re] of patterns) {
    re.lastIndex = 0;
    const common = isCommon(name);
    let m;
    while ((m = re.exec(masked))) {
      if (!common) break;
      const around = p.body.slice(Math.max(0, m.index - 8), m.index + name.length + 2);
      if (!sentenceStart(masked, m.index) && !NOT_THE_GAME.test(around)) break;
    }
    if (!m) continue;
    // Mask every hit so a shorter name inside this one ("Ticket to Ride" in
    // "Ticket to Ride: First Journey") is not counted again.
    masked = masked.replace(re, (s) => ' '.repeat(s.length));
    const g = games.get(name);
    if (linkedNames.has(name) || g.urls.some((u) => linkedUrls.has(u))) continue;
    const li = lineOf(m.index);
    const line = p.body.slice(lineStarts[li], lineStarts[li + 1] ?? p.body.length).replace(/\s+/g, ' ').trim();
    rows.push({
      url: p.url,
      file: path.relative(ROOT, p.file),
      line: bodyStartLine + li,
      collection: p.collection,
      game: name,
      have_link: g.url ? 'yes' : 'no',
      amazon_url: g.url,
      check: common ? 'check' : '',
      page_amazon_links: amazonCount,
      snippet: line.length > 160 ? line.slice(Math.max(0, m.index - lineStarts[li] - 60), m.index - lineStarts[li] + 100) : line,
    });
    missed++;
  }
  pageStats.push({ url: p.url, collection: p.collection, amazonCount, missed });
}

// ---------- output ----------
const by = (arr, key) => arr.reduce((m, r) => m.set(r[key], (m.get(r[key]) ?? 0) + 1), new Map());
const sure = rows.filter((r) => !r.check);
const ready = sure.filter((r) => r.have_link === 'yes');
const needAsin = sure.filter((r) => r.have_link === 'no');

const lines = [];
lines.push(`Pages scanned: ${pages.length}`);
for (const [c, n] of by(pageStats, 'collection')) {
  const linked = pageStats.filter((s) => s.collection === c && s.amazonCount > 0).length;
  lines.push(`  ${c}: ${n} pages, ${linked} with an Amazon link`);
}
lines.push(`Games in dictionary: ${games.size} (${[...games.values()].filter((g) => g.url).length} with an Amazon URL)`);
lines.push(`Unlinked game mentions: ${rows.length}`);
lines.push(`  ready to link (URL known): ${ready.length} on ${new Set(ready.map((r) => r.url)).size} pages`);
lines.push(`  need an ASIN first: ${needAsin.length} (${new Set(needAsin.map((r) => r.game)).size} games)`);
lines.push(`  check by hand (name is also a common word): ${rows.length - sure.length}`);
const zeroPages = new Set(ready.filter((r) => r.page_amazon_links === 0).map((r) => r.url));
lines.push(`Pages with no Amazon link that could get one now: ${zeroPages.size}`);
console.log(lines.join('\n'));

const csvPath = argVal('--csv');
if (csvPath) {
  const cols = Object.keys(rows[0] ?? { url: '' });
  const q = (v) => `"${String(v).replace(/"/g, '""')}"`;
  fs.writeFileSync(csvPath, [cols.join(','), ...rows.map((r) => cols.map((c) => q(r[c])).join(','))].join('\n') + '\n');
  console.log(`CSV: ${csvPath}`);
}

const mdPath = argVal('--md');
if (mdPath) {
  const top = (arr, key, n) => [...by(arr, key)].sort((a, b) => b[1] - a[1]).slice(0, n);
  const out = [];
  out.push('# Amazon affiliate link scan', '', '```', ...lines, '```', '');
  out.push('## Games most often mentioned without a link (URL known)', '', '| Game | Pages |', '| --- | --- |');
  for (const [g, n] of top(ready, 'game', 30)) out.push(`| ${g} | ${n} |`);
  out.push('', '## Games that need an ASIN first', '', '| Game | Pages | Source |', '| --- | --- | --- |');
  for (const [g, n] of top(needAsin, 'game', 60)) out.push(`| ${g} | ${n} | ${games.get(g).source} |`);
  out.push('', '## Pages with the most unlinked games (URL known)', '', '| Page | Games | Amazon links now |', '| --- | --- | --- |');
  const perPage = new Map();
  for (const r of ready) perPage.set(r.url, [...(perPage.get(r.url) ?? []), r]);
  for (const [u, rs] of [...perPage].sort((a, b) => b[1].length - a[1].length).slice(0, 40))
    out.push(`| ${u} | ${rs.map((r) => r.game).join(', ')} | ${rs[0].page_amazon_links} |`);
  out.push('', '## Same game, different Amazon URLs', '', 'These games are linked to more than one URL across the site. Worth checking each still points at the right product.', '');
  for (const [name, g] of games) if (g.urls.length > 1) out.push(`- ${name}: ${g.urls.join(', ')}`);
  fs.writeFileSync(mdPath, out.join('\n') + '\n');
  console.log(`Report: ${mdPath}`);
}
