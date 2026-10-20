// Brings Game Night Madness (theludarium/game-night-madness, a git submodule at
// vendor/game-night-madness) into the site at /game-night-madness/.
//   node scripts/game-night-madness.mjs fetch   before the build: make sure the submodule is there
//   node scripts/game-night-madness.mjs copy    after the build: copy the app into dist/
// The app is one built page (index.html) plus its install files. On the way in it
// gets a canonical URL, share tags, the site's analytics snippet, and the slim
// Ludarium bar (hidden when the app runs installed on a phone).
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { SITE, analyticsSnippet, bar, barCss } from './tool-chrome.mjs';

const SRC = 'vendor/game-night-madness';
const REPO = 'https://github.com/theludarium/game-night-madness.git';
const OUT = 'dist/game-night-madness';
const FILES = ['index.html', 'manifest.webmanifest', 'sw.js', 'powered-by-bgg.png'];
const DIRS = ['icons', 'fonts'];
const mode = process.argv[2];

function fetchApp() {
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

function copyApp() {
  fetchApp();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const file of FILES) fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  for (const dir of DIRS) fs.cpSync(path.join(SRC, dir), path.join(OUT, dir), { recursive: true });

  const url = `${SITE}/game-night-madness/`;
  const file = path.join(OUT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  const head = [
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="The Ludarium">',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${SITE}/og/default.png">`,
    '<meta name="twitter:card" content="summary_large_image">',
    analyticsSnippet(),
    barCss('@media (display-mode:standalone){.ldr-bar{display:none}}\n'),
  ].join('\n');
  html = html.replace('</head>', `${head}\n</head>`).replace(/<body([^>]*)>/, `<body$1>\n${bar('Game Night Madness', '/game-night-madness/')}`);
  fs.writeFileSync(file, html);
  console.log(`Game Night Madness: copied the app into ${OUT}/`);
}

if (mode === 'fetch') fetchApp();
else if (mode === 'copy') copyApp();
else {
  console.error('Usage: node scripts/game-night-madness.mjs fetch|copy');
  process.exit(1);
}
