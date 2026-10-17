// Branded share images (Open Graph and Twitter cards), rendered at build time.
// satori lays out the card and turns text into shapes; resvg turns that into a PNG.
// Fonts come from @fontsource/fraunces (WOFF files satori can read).
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import satori from 'satori';
import { Resvg } from '@resvg/resvg-js';
import { MARK_PATH, MARK_VIEWBOX } from '@/lib/brand';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const COLORS = {
  walnut: '#2B1E16',
  parchment: '#F6EFE3',
  felt: '#2F5D50',
  feltLight: '#8CC2B0',
  lamplight: '#E0A23B',
  stone: '#B9AD9C',
};

const fontFile = (name: string) =>
  readFileSync(join(process.cwd(), 'node_modules/@fontsource/fraunces/files', name));

let fonts: Parameters<typeof satori>[1]['fonts'] | undefined;
const loadFonts = () =>
  (fonts ??= [
    { name: 'Fraunces', data: fontFile('fraunces-latin-400-normal.woff'), weight: 400, style: 'normal' },
    { name: 'Fraunces', data: fontFile('fraunces-latin-400-italic.woff'), weight: 400, style: 'italic' },
    { name: 'Fraunces', data: fontFile('fraunces-latin-600-normal.woff'), weight: 600, style: 'normal' },
  ]);

const markDataUri = (color: string) =>
  `data:image/svg+xml;base64,${Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${MARK_VIEWBOX}"><path fill="${color}" fill-rule="evenodd" d="${MARK_PATH}"/></svg>`,
  ).toString('base64')}`;

// satori takes React-style element objects; this keeps the layout readable without React.
type El = { type: string; props: Record<string, unknown> };
const h = (type: string, style: Record<string, unknown>, ...children: (El | string)[]): El => ({
  type,
  props: { style, children: children.length === 1 ? children[0] : children },
});
const img = (src: string, size: number, style: Record<string, unknown> = {}): El => ({
  type: 'img',
  props: { src, width: size, height: size, style },
});

function toPng(svg: string, width: number): Uint8Array {
  return new Resvg(svg, { fitTo: { mode: 'width', value: width } }).render().asPng();
}

/** A 1200 x 630 share card: eyebrow, big title, brand footer, oversized mark on the right. */
export async function shareCard({ eyebrow, title }: { eyebrow: string; title: string }): Promise<Uint8Array> {
  const titleSize = title.length > 70 ? 52 : title.length > 40 ? 62 : 74;
  const card = h(
    'div',
    {
      width: '100%',
      height: '100%',
      display: 'flex',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: COLORS.walnut,
      fontFamily: 'Fraunces',
    },
    img(markDataUri(COLORS.felt), 500, { position: 'absolute', right: -170, top: 65 }),
    h(
      'div',
      { display: 'flex', flexDirection: 'column', position: 'absolute', left: 80, top: 80, width: 720 },
      h('div', { fontSize: 26, fontWeight: 600, letterSpacing: 3, color: COLORS.lamplight, marginBottom: 28 }, eyebrow.toUpperCase()),
      h('div', { fontSize: titleSize, fontWeight: 600, lineHeight: 1.1, color: COLORS.parchment }, title),
    ),
    h(
      'div',
      { display: 'flex', alignItems: 'center', position: 'absolute', left: 80, bottom: 64 },
      img(markDataUri(COLORS.feltLight), 56, { marginRight: 20 }),
      h('div', { fontSize: 38, color: COLORS.parchment, fontStyle: 'italic', marginRight: 10 }, 'The'),
      h('div', { fontSize: 38, fontWeight: 600, color: COLORS.parchment, marginRight: 28 }, 'Ludarium'),
      h('div', { fontSize: 26, color: COLORS.stone }, 'theludarium.com'),
    ),
  );

  const svg = await satori(card as never, { width: OG_WIDTH, height: OG_HEIGHT, fonts: loadFonts() });
  return toPng(svg, OG_WIDTH);
}

/** Square logo for structured data and anywhere a raster logo is required. */
export function logoPng(size = 512): Uint8Array {
  const pad = size * 0.14;
  const inner = size - pad * 2;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    <rect width="${size}" height="${size}" fill="${COLORS.parchment}"/>
    <svg x="${pad}" y="${pad}" width="${inner}" height="${inner}" viewBox="${MARK_VIEWBOX}">
      <path fill="${COLORS.felt}" fill-rule="evenodd" d="${MARK_PATH}"/>
    </svg>
  </svg>`;
  return toPng(svg, size);
}

export const pngResponse = (png: Uint8Array) =>
  new Response(png as unknown as BodyInit, { headers: { 'Content-Type': 'image/png' } });
