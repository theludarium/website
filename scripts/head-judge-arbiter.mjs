// Brings Head Judge Arbiter (theludarium/head-judge-arbiter, a git submodule at
// vendor/head-judge-arbiter) into the site at /head-judge-arbiter/.
//   node scripts/head-judge-arbiter.mjs fetch   before the build: make sure the submodule is there
//   node scripts/head-judge-arbiter.mjs copy    after the build: copy the app into dist/
// The app is static files (index.html, styles, scripts, rules data). Its AI calls go
// to its own Cloudflare Worker, whose ALLOWED_ORIGINS must include theludarium.com.
// On the way in index.html gets a canonical URL, share tags on this domain, the
// site's analytics snippet, and the slim Ludarium bar (hidden when installed).
// The repo refreshes data/rules.json every Monday; the copy step pulls the newest
// one so new rules go live with the next site build, without a submodule bump.
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { SITE, analyticsSnippet, bar, barCss } from './tool-chrome.mjs';

const SRC = 'vendor/head-judge-arbiter';
const REPO = 'https://github.com/theludarium/head-judge-arbiter.git';
const RULES_URL = 'https://raw.githubusercontent.com/theludarium/head-judge-arbiter/main/data/rules.json';
const OUT = 'dist/head-judge-arbiter';
const FILES = ['index.html', 'styles.css', 'config.js', 'manifest.webmanifest'];
const DIRS = ['assets', 'js', 'data'];
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

/** Newest rules from the repo, if they parse and are not older than the pinned copy. */
async function latestRules(pinned) {
  try {
    const res = await fetch(RULES_URL, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const text = await res.text();
    const fresh = JSON.parse(text);
    const old = JSON.parse(pinned);
    if (!Array.isArray(fresh.rules) || fresh.rules.length < 1000) return null;
    if (Date.parse(fresh.effective) < Date.parse(old.effective)) return null; // "November 6, 2026"
    return text;
  } catch {
    return null;
  }
}

async function copyApp() {
  fetchApp();
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(OUT, { recursive: true });
  for (const file of FILES) fs.copyFileSync(path.join(SRC, file), path.join(OUT, file));
  for (const dir of DIRS) fs.cpSync(path.join(SRC, dir), path.join(OUT, dir), { recursive: true });

  const rulesFile = path.join(OUT, 'data', 'rules.json');
  const fresh = await latestRules(fs.readFileSync(rulesFile, 'utf8'));
  if (fresh) fs.writeFileSync(rulesFile, fresh);

  const url = `${SITE}/head-judge-arbiter/`;
  const file = path.join(OUT, 'index.html');
  let html = fs.readFileSync(file, 'utf8');
  html = html
    .replace(/<meta property="og:url"[^>]*>\s*/, '')
    .replace(/<meta property="og:image"[^>]*>\s*/, '')
    .replace(/<meta property="og:type"[^>]*>\s*/, '')
    .replace(/<meta name="twitter:card"[^>]*>\s*/, '');
  // The app fills the screen (body overflow hidden, .app 100dvh). With the bar on
  // top, make the body a column so the app takes the rest and nothing scrolls.
  const fit = `@media not all and (display-mode:standalone){
body{display:flex;flex-direction:column;height:100vh;height:100dvh;min-height:0}
.ldr-bar{flex:none}
.app{flex:1 1 auto;min-height:0;height:auto;width:100%;box-sizing:border-box}
}
@media (display-mode:standalone){.ldr-bar{display:none}}
`;
  const head = [
    `<link rel="canonical" href="${url}">`,
    '<meta property="og:type" content="website">',
    '<meta property="og:site_name" content="The Ludarium">',
    `<meta property="og:url" content="${url}">`,
    `<meta property="og:image" content="${url}assets/og.png">`,
    '<meta name="twitter:card" content="summary_large_image">',
    analyticsSnippet(),
    barCss(fit),
  ].join('\n');
  html = html.replace('</head>', `${head}\n</head>`).replace(/<body([^>]*)>/, `<body$1>\n${bar('Head Judge Arbiter', '/head-judge-arbiter/')}`);
  fs.writeFileSync(file, html);
  console.log(`Head Judge Arbiter: copied the app into ${OUT}/${fresh ? ' (newest rules)' : ''}`);
}

if (mode === 'fetch') fetchApp();
else if (mode === 'copy') await copyApp();
else {
  console.error('Usage: node scripts/head-judge-arbiter.mjs fetch|copy');
  process.exit(1);
}
