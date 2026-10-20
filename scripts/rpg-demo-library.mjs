// Brings the RPG Demo Library (theludarium/rpg-demo-library, a git submodule at
// vendor/rpg-demo-library) into the site.
//   node scripts/rpg-demo-library.mjs fetch   before the build: make sure the submodule is there
//   node scripts/rpg-demo-library.mjs copy    after the build: copy the demos into dist/
// The front page (/rpg-demo-library/) is an Astro page; the demos are the repo's
// own pages, served at /rpg-demo-library/games/<game>/. On the way in, each demo
// gets a canonical URL, share tags, the site's analytics snippet, and a slim
// Ludarium bar, so it ranks, is counted, and links home.
import { execSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';

const SITE = 'https://theludarium.com';
const SRC = 'vendor/rpg-demo-library';
const REPO = 'https://github.com/theludarium/rpg-demo-library.git';
const OUT = 'dist/rpg-demo-library';
const mode = process.argv[2];

function fetchLibrary() {
  if (fs.existsSync(path.join(SRC, 'index.html'))) return;
  try {
    execSync(`git submodule update --init --depth 1 ${SRC}`, { stdio: 'inherit' });
  } catch {
    // Not a git checkout with submodules (some build hosts): clone it directly.
  }
  if (!fs.existsSync(path.join(SRC, 'index.html'))) {
    fs.rmSync(SRC, { recursive: true, force: true });
    execSync(`git clone --depth 1 ${REPO} ${SRC}`, { stdio: 'inherit' });
  }
}

const attr = (s) => s.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function bar() {
  const brand = fs.readFileSync('src/lib/brand.ts', 'utf8');
  const mark = brand.match(/MARK_PATH =\s*'([^']+)'/)[1];
  return `<nav class="ldr-bar" aria-label="The Ludarium"><a class="ldr-bar__home" href="/"><svg viewBox="0 0 64 64" aria-hidden="true"><path fill="currentColor" fill-rule="evenodd" d="${mark}"/></svg><span>The Ludarium</span></a><span aria-hidden="true">/</span><a href="/rpg-demo-library/">RPG Demo Library</a></nav>`;
}

const BAR_CSS = `<style>
.ldr-bar{position:relative;z-index:50;display:flex;align-items:center;gap:10px;padding:10px 16px;background:#2B1E16;color:#F6EFE3;font:600 14px/1.2 system-ui,-apple-system,"Segoe UI",Roboto,Arial,sans-serif}
.ldr-bar a{color:inherit;text-decoration:none}
.ldr-bar a:hover{text-decoration:underline}
.ldr-bar a:focus-visible{outline:2px solid #E0A23B;outline-offset:3px;border-radius:4px}
.ldr-bar__home{display:inline-flex;align-items:center;gap:8px;font-family:Georgia,"Times New Roman",serif;font-size:15px}
.ldr-bar svg{width:22px;height:22px;flex:none}
.ldr-bar>span{opacity:.5}
/* Phones: the demo's PDF button sits top right, and the demo has its own "All demos" link. */
@media (max-width:880px){.ldr-bar>span,.ldr-bar>a+span+a{display:none}}
</style>`;

// The site's own analytics snippet (consent defaults plus gtag), lifted from the
// built home page so the demos follow exactly the same privacy rules.
function analyticsSnippet() {
  const home = fs.readFileSync('dist/index.html', 'utf8');
  return home.match(/<script[^>]*>(?:(?!<\/script>)[\s\S])*ludarium-consent(?:(?!<\/script>)[\s\S])*<\/script>/)?.[0] ?? '';
}

function copyLibrary() {
  fetchLibrary();
  fs.mkdirSync(OUT, { recursive: true });
  for (const file of ['store.js', 'buy.js']) fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  const versions = Object.fromEntries(
    ['store', 'buy'].map((name) => [name, createHash('sha256').update(fs.readFileSync(path.join(SRC, `${name}.js`))).digest('hex').slice(0, 10)]),
  );
  fs.cpSync(path.join(SRC, 'games'), path.join(OUT, 'games'), { recursive: true });

  const nav = bar();
  const analytics = analyticsSnippet();
  const games = fs.readdirSync(path.join(OUT, 'games')).filter((g) => fs.existsSync(path.join(OUT, 'games', g, 'index.html')));
  for (const game of games) {
    const file = path.join(OUT, 'games', game, 'index.html');
    let html = fs.readFileSync(file, 'utf8');
    const url = `${SITE}/rpg-demo-library/games/${game}/`;
    const title = html.match(/<title>([^<]*)<\/title>/)?.[1] ?? 'RPG Demo Library';
    const description = html.match(/<meta name="description" content="([^"]*)"/)?.[1] ?? '';
    const head = [
      `<link rel="canonical" href="${url}">`,
      '<link rel="icon" href="/favicon.svg" type="image/svg+xml">',
      '<meta property="og:type" content="website">',
      '<meta property="og:site_name" content="The Ludarium">',
      `<meta property="og:url" content="${url}">`,
      `<meta property="og:title" content="${attr(title)}">`,
      `<meta property="og:description" content="${description}">`,
      `<meta property="og:image" content="${SITE}/og/default.png">`,
      '<meta name="twitter:card" content="summary_large_image">',
      analytics,
      BAR_CSS,
    ].join('\n');
    html = html.replace('</head>', `${head}\n</head>`).replace(/<body([^>]*)>/, `<body$1>\n${nav}`);
    // Load store.js and buy.js with a version tag from their content, so a
    // price or checkout change reaches every visitor at once instead of
    // waiting for a browser's cached copy to expire.
    html = html.replace(/(src="\.\.\/\.\.\/(store|buy)\.js)"/g, (_, src, name) => `${src}?v=${versions[name]}"`);
    fs.writeFileSync(file, html);
  }
  console.log(`RPG Demo Library: copied ${games.length} demos into ${OUT}/games/`);
}

if (mode === 'fetch') fetchLibrary();
else if (mode === 'copy') copyLibrary();
else {
  console.error('Usage: node scripts/rpg-demo-library.mjs fetch|copy');
  process.exit(1);
}
