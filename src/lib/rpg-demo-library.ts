// The RPG Demo Library lives in its own repo (theludarium/rpg-demo-library),
// included here as a git submodule at vendor/rpg-demo-library. This module reads
// its game list and store config at build time, so the repo stays the one source
// of truth: add a demo there and it shows up on /rpg-demo-library/ here.
// The demo pages themselves are copied in after the build by
// scripts/rpg-demo-library.mjs.
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';

export const RDL_DIR = path.resolve('vendor/rpg-demo-library');
export const RDL_BASE = '/rpg-demo-library/';

export type RdlProduct = { name: string; game: string; price?: string; pages?: number; demo?: string; checkout?: string };

export type RdlDemo = {
  slug: string;
  href: string;
  title: string;
  subtitle: string;
  blurb: string;
  tags: string[];
  playLabel: string;
  product?: RdlProduct;
};

const decode = (s: string) =>
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

function readStore(): Record<string, RdlProduct> {
  const file = path.join(RDL_DIR, 'store.js');
  if (!fs.existsSync(file)) return {};
  const sandbox = { window: {} as { RDL_STORE?: { products?: Record<string, RdlProduct> } } };
  vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox);
  return sandbox.window.RDL_STORE?.products ?? {};
}

/** Every playable demo, in the order the library's own front page lists them. */
export function getDemos(): RdlDemo[] {
  const file = path.join(RDL_DIR, 'index.html');
  if (!fs.existsSync(file)) {
    throw new Error(
      'The RPG Demo Library submodule is missing. Run: git submodule update --init vendor/rpg-demo-library',
    );
  }
  const html = fs.readFileSync(file, 'utf8');
  const products = Object.values(readStore());
  const demos: RdlDemo[] = [];
  for (const m of html.matchAll(/<a class="game[^"]*" href="games\/([^/"]+)\/"[^>]*>([\s\S]*?)<\/a>/g)) {
    const [, slug, card] = m;
    const pick = (re: RegExp) => decode(card.match(re)?.[1] ?? '');
    demos.push({
      slug,
      href: `${RDL_BASE}games/${slug}/`,
      title: pick(/<div class="t[^"]*">([\s\S]*?)<\/div>/),
      subtitle: pick(/<div class="s">([\s\S]*?)<\/div>/),
      blurb: pick(/<div class="info">\s*<p>([\s\S]*?)<\/p>/),
      tags: [...card.matchAll(/<span(?: class="[^"]*")?>([^<]*)<\/span>/g)]
        .map((t) => decode(t[1]))
        .filter((t) => t && t !== 'Full adventure PDF' && !t.startsWith('Play')),
      playLabel: pick(/<span class="play">([\s\S]*?)<\/span>/).replace(/\s*→$/, ''),
      product: products.find((p) => p.demo === `games/${slug}/`),
    });
  }
  return demos;
}
