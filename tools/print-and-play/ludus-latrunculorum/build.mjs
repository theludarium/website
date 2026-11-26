// Builds the free Ludus Latrunculorum print-and-play PDF (board, pieces, rules).
//   node tools/print-and-play/ludus-latrunculorum/build.mjs
// Writes ludus-latrunculorum-print-and-play.pdf (and the HTML it printed) next to this file.
// The PDF is delivered by the Kit form "Offer: Ludus Latrunculorum print and play"
// (KIT_OFFER_FORMS['ludus-latrunculorum'] in src/lib/config.ts), so it never goes in public/.
// Upload the new PDF to that form's incentive after a rebuild.
//
// Every page fits inside both US Letter and A4 (content kept within 7.2 x 9.9 inches),
// so the PDF prints at 100% on either paper. Pages are US Letter.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { RULES } from './rules.mjs';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '../../..');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const OUT_PDF = path.join(HERE, 'ludus-latrunculorum-print-and-play.pdf');
const OUT_HTML = path.join(HERE, 'print.html');

const C = { walnut: '#2B1E16', parchment: '#F6EFE3', felt: '#2F5D50', lamp: '#E0A23B', stone: '#B9AD9C', paper: '#FFFFFF' };
const font = fs.readFileSync(path.join(ROOT, 'node_modules/@fontsource-variable/fraunces/files/fraunces-latin-wght-normal.woff2')).toString('base64');

const { perSide, dux } = RULES.board;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---------- The board ----------
// Squares are scored like a Roman board cut into stone: plain cells, a heavy frame,
// and Roman numerals so players can record moves. Size in inches.
function boardSvg({ cols, rows, cell, label = true }) {
  const pad = label ? 0.42 : 0.12;
  const w = cols * cell + pad * 2;
  const h = rows * cell + pad * 2;
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'];
  const letters = 'ABCDEFGHIJKL';
  let cells = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cell;
      const y = pad + r * cell;
      cells += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${C.parchment}" stroke="${C.walnut}" stroke-width="0.012"/>`;
    }
  }
  let labels = '';
  if (label) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cell + cell / 2;
      labels += `<text x="${x}" y="${pad - 0.1}" class="bl">${letters[c]}</text><text x="${x}" y="${h - pad + 0.21}" class="bl">${letters[c]}</text>`;
    }
    for (let r = 0; r < rows; r++) {
      const y = pad + r * cell + cell / 2 + 0.05;
      const n = roman[rows - 1 - r];
      labels += `<text x="${pad / 2}" y="${y}" class="bl">${n}</text><text x="${w - pad / 2}" y="${y}" class="bl">${n}</text>`;
    }
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}in" height="${h}in" viewBox="0 0 ${w} ${h}">
  <style>.bl{font: 600 0.14px 'Fraunces', Georgia, serif; fill:${C.walnut}; text-anchor:middle;}</style>
  <rect x="0.02" y="0.02" width="${w - 0.04}" height="${h - 0.04}" rx="0.12" fill="${C.parchment}" stroke="${C.walnut}" stroke-width="0.03"/>
  ${cells}
  <rect x="${pad}" y="${pad}" width="${cols * cell}" height="${rows * cell}" fill="none" stroke="${C.walnut}" stroke-width="0.04"/>
  ${labels}
</svg>`;
}

// ---------- The pieces ----------
// Square tokens in a gutterless grid: every cut line is shared, so a full sheet is a
// few long straight cuts. Each token carries a round "glass counter" disc.
function token(kind, size) {
  const dark = kind.startsWith('dark');
  const isDux = kind.endsWith('dux');
  const fill = dark ? C.walnut : C.paper;
  const ink = dark ? C.parchment : C.walnut;
  const r = size * 0.4;
  const m = size / 2;
  const disc = `<circle cx="${m}" cy="${m}" r="${r}" fill="${dark ? '#3A2A1F' : C.parchment}" stroke="${ink}" stroke-width="${size * 0.035}"/>
    <circle cx="${m}" cy="${m}" r="${r * 0.72}" fill="none" stroke="${ink}" stroke-width="${size * 0.015}" opacity="0.6"/>`;
  const mark = isDux
    ? `<text x="${m}" y="${m + size * 0.075}" text-anchor="middle" style="font: 700 ${size * 0.22}px 'Fraunces', Georgia, serif; fill:${ink}; letter-spacing:${size * 0.01}px">DVX</text>`
    : `<circle cx="${m}" cy="${m}" r="${r * 0.18}" fill="${ink}"/>`;
  return `<g>${`<rect width="${size}" height="${size}" fill="${fill}"/>`}${disc}${mark}</g>`;
}

function sheetSvg(list, { size, perRow }) {
  const rowsN = Math.ceil(list.length / perRow);
  const w = perRow * size;
  const h = rowsN * size;
  let g = '';
  list.forEach((kind, i) => {
    const x = (i % perRow) * size;
    const y = Math.floor(i / perRow) * size;
    g += `<g transform="translate(${x} ${y})">${token(kind, size)}</g>`;
  });
  // cut lines on top, grey so they disappear once cut
  let lines = '';
  for (let i = 0; i <= perRow; i++) lines += `<line x1="${i * size}" y1="0" x2="${i * size}" y2="${h}"/>`;
  for (let j = 0; j <= rowsN; j++) lines += `<line x1="0" y1="${j * size}" x2="${w}" y2="${j * size}"/>`;
  // crop ticks outside the grid, so the first cuts are easy to line up
  let ticks = '';
  const t = 0.12;
  for (let i = 0; i <= perRow; i++) ticks += `<line x1="${i * size}" y1="${-t - 0.03}" x2="${i * size}" y2="-0.03"/><line x1="${i * size}" y1="${h + 0.03}" x2="${i * size}" y2="${h + t + 0.03}"/>`;
  for (let j = 0; j <= rowsN; j++) ticks += `<line x1="${-t - 0.03}" y1="${j * size}" x2="-0.03" y2="${j * size}"/><line x1="${w + 0.03}" y1="${j * size}" x2="${w + t + 0.03}" y2="${j * size}"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w + 0.4}in" height="${h + 0.4}in" viewBox="-0.2 -0.2 ${w + 0.4} ${h + 0.4}">
  ${g}
  <g stroke="#8a7d6c" stroke-width="0.008" fill="none">${lines}</g>
  <g stroke="${C.walnut}" stroke-width="0.01">${ticks}</g>
</svg>`;
}

const pieceSize = 0.9 * RULES.print.cell; // a little smaller than a square
const perRow = RULES.print.piecesPerRow;
const pieces = (color) => [
  ...Array(perSide).fill(color),
  ...(dux ? [`${color}-dux`] : []),
  ...Array(RULES.print.spares).fill(color),
];


// ---------- Small rule diagrams ----------
// grid: array of strings, one per row. L = light, D = dark, X = dark piece that is captured,
// S = dark piece that moved in safely, . = empty. arrow: [fromCol, fromRow, toCol, toRow].
function miniSvg({ grid, arrow, corner = false }) {
  const cell = 0.32;
  const rowsN = grid.length;
  const colsN = grid[0].length;
  const w = colsN * cell;
  const h = rowsN * cell;
  let g = '';
  grid.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      const x = c * cell;
      const y = r * cell;
      g += `<rect x="${x}" y="${y}" width="${cell}" height="${cell}" fill="${C.parchment}" stroke="${C.walnut}" stroke-width="0.008"/>`;
      if (ch === '.') return;
      const cx = x + cell / 2;
      const cy = y + cell / 2;
      const dark = ch !== 'L';
      g += `<circle cx="${cx}" cy="${cy}" r="${cell * 0.36}" fill="${dark ? C.walnut : C.paper}" stroke="${C.walnut}" stroke-width="0.02"/>`;
      if (ch === 'X') g += `<path d="M${cx - 0.09} ${cy - 0.09} L${cx + 0.09} ${cy + 0.09} M${cx + 0.09} ${cy - 0.09} L${cx - 0.09} ${cy + 0.09}" stroke="${C.lamp}" stroke-width="0.035" stroke-linecap="round"/>`;
      if (ch === 'S') g += `<circle cx="${cx}" cy="${cy}" r="${cell * 0.12}" fill="${C.lamp}"/>`;
    }),
  );
  if (corner) g += `<path d="M0 ${h} V0 H${w}" fill="none" stroke="${C.walnut}" stroke-width="0.07"/>`;
  if (arrow) {
    // a dashed ghost where the piece started, and an arrow into its new square
    const [fc, fr, tc, tr] = arrow;
    const x1 = fc * cell + cell / 2, y1 = fr * cell + cell / 2, x2 = tc * cell + cell / 2, y2 = tr * cell + cell / 2;
    const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
    g += `<circle cx="${x1}" cy="${y1}" r="${cell * 0.3}" fill="none" stroke="${C.felt}" stroke-width="0.014" stroke-dasharray="0.03 0.025"/>`;
    const tipX = x2 - dx * cell * 0.38, tipY = y2 - dy * cell * 0.38;
    const baseX = x1 + dx * cell * 0.1, baseY = y1 + dy * cell * 0.1;
    g += `<line x1="${baseX}" y1="${baseY}" x2="${tipX - dx * 0.05}" y2="${tipY - dy * 0.05}" stroke="${C.felt}" stroke-width="0.028" stroke-linecap="round"/>`;
    g += `<path d="M${tipX} ${tipY} L${tipX - dx * 0.08 - dy * 0.055} ${tipY - dy * 0.08 - dx * 0.055} L${tipX - dx * 0.08 + dy * 0.055} ${tipY - dy * 0.08 + dx * 0.055} Z" fill="${C.felt}"/>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}in" height="${h}in" viewBox="-0.02 -0.02 ${w + 0.04} ${h + 0.04}">${g}</svg>`;
}

// ---------- Pages ----------
const page = (body, cls = '') => `<section class="page ${cls}">${body}<footer>theludarium.com/academy/ludus-latrunculorum</footer></section>`;

const rulesList = (items) => `<ol>${items.map((i) => `<li>${i}</li>`).join('')}</ol>`;

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Ludus Latrunculorum: print and play</title>
<style>
@font-face { font-family: 'Fraunces'; src: url(data:font/woff2;base64,${font}) format('woff2'); font-weight: 100 900; }
@page { size: 8.5in 11in; margin: 0; }
* { box-sizing: border-box; }
html, body { margin: 0; padding: 0; background: ${C.paper}; color: ${C.walnut}; font: 10pt/1.4 system-ui, -apple-system, 'Helvetica Neue', Arial, sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
.page { width: 8.5in; height: 11in; padding: 0.55in 0.65in 0.68in; position: relative; overflow: hidden; page-break-after: always; display: flex; flex-direction: column; }
.page:last-child { page-break-after: auto; }
h1, h2, h3 { font-family: 'Fraunces', Georgia, serif; font-weight: 650; margin: 0; line-height: 1.1; }
h1 { font-size: 30pt; letter-spacing: -0.01em; }
h2 { font-size: 17pt; margin-bottom: 0.08in; }
h3 { font-size: 12pt; margin: 0.12in 0 0.04in; }
p { margin: 0 0 0.07in; }
ol, ul { margin: 0 0 0.06in; padding-left: 1.15em; }
li { margin: 0 0 0.035in; }
.eyebrow { font-size: 8.5pt; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.felt}; font-weight: 700; margin-bottom: 0.06in; }
.lede { font-family: 'Fraunces', Georgia, serif; font-size: 12pt; line-height: 1.32; margin: 0.06in 0 0.12in; }
.cols { display: grid; grid-template-columns: 1fr 1fr; gap: 0.3in; }
.box { border: 1.2pt solid ${C.walnut}; border-radius: 0.14in; padding: 0.12in 0.16in; }
.note { font-size: 8.5pt; color: #5b4c3e; }
.center { flex: 1; display: flex; align-items: center; justify-content: center; flex-direction: column; gap: 0.12in; }
footer { position: absolute; left: 0.65in; right: 0.65in; bottom: 0.32in; font-size: 7.5pt; color: #6b5d4f; display: flex; justify-content: space-between; gap: 0.3in; white-space: nowrap; }
footer::after { content: '${esc(RULES.credit)}'; }
.diagram { display: flex; gap: 0.18in; align-items: flex-start; margin: 0.04in 0 0.06in; }
.diagram figcaption { font-size: 8.5pt; }
.diagrams { display: grid; gap: 0.14in; margin: 0.04in 0 0; }
.diagrams figure { margin: 0; display: flex; gap: 0.14in; align-items: center; }
.diagrams svg { flex: none; }
.diagrams figcaption { font-size: 9pt; line-height: 1.35; }
.scissors { font-size: 8.5pt; color: #5b4c3e; text-align: center; }
</style></head><body>
${page(`
  <p class="eyebrow">Free print and play &middot; The Ludarium Academy</p>
  <h1>Ludus Latrunculorum</h1>
  <p class="lede">${RULES.lede}</p>
  <div class="cols">
    <div>
      <h2>Make it in ten minutes</h2>
      <p>${RULES.contents}</p>
      ${rulesList(RULES.make)}
      <p class="note">${RULES.paperNote}</p>
      <h2 style="margin-top:0.16in">Three captures to know</h2>
      <div class="diagrams">${RULES.diagrams.map((d) => `<figure>${miniSvg(d)}<figcaption>${d.caption}</figcaption></figure>`).join('')}</div>
    </div>
    <div>
      <h2>The rules on one page</h2>
      ${RULES.quick.map((s) => `<h3>${s.h}</h3>${s.list ? rulesList(s.list) : `<p>${s.p}</p>`}`).join('')}
    </div>
  </div>
  <div class="box" style="margin-top:auto"><p style="margin:0"><strong>A note on the rules.</strong> ${RULES.honesty}</p></div>
`)}
${RULES.boards
  .map((b) =>
    page(`
  <p class="eyebrow">${b.eyebrow}</p>
  <h2>${b.title}</h2>
  <p class="note">${b.note}</p>
  <div class="center">${boardSvg({ cols: b.cols, rows: b.rows, cell: RULES.print.cell })}</div>
`),
  )
  .slice(0, 1)
  .join('')}
${page(`
  <p class="eyebrow">The pieces</p>
  <h2>Two armies of ${perSide}${dux ? ' plus a leader' : ''}, and spares</h2>
  <p class="note">${RULES.print.piecesNote}</p>
  <div class="center">
    ${sheetSvg(pieces('light'), { size: pieceSize, perRow })}
    <p class="scissors">Cut along the grey lines. The short black ticks outside the grid show where each long cut starts.</p>
    ${sheetSvg(pieces('dark'), { size: pieceSize, perRow })}
  </div>
`)}
${RULES.boards
  .slice(1)
  .map((b) =>
    page(`
  <p class="eyebrow">${b.eyebrow}</p>
  <h2>${b.title}</h2>
  <p class="note">${b.note}</p>
  <div class="center">${boardSvg({ cols: b.cols, rows: b.rows, cell: RULES.print.cell })}</div>
`),
  )
  .join('')}
</body></html>`;

fs.writeFileSync(OUT_HTML, html);

// ---------- Print with headless Chrome ----------
const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'pnp-chrome-'));
const chrome = spawn(CHROME, ['--headless=new', '--disable-gpu', `--user-data-dir=${profile}`, '--remote-debugging-port=0', 'about:blank'], { stdio: ['ignore', 'ignore', 'pipe'] });
const port = await new Promise((resolve, reject) => {
  let buf = '';
  chrome.stderr.on('data', (d) => {
    buf += d;
    const m = buf.match(/DevTools listening on ws:\/\/127\.0\.0\.1:(\d+)/);
    if (m) resolve(m[1]);
  });
  setTimeout(() => reject(new Error('Chrome did not start')), 20000);
});
const targets = await (await fetch(`http://127.0.0.1:${port}/json/list`)).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => (ws.onopen = r));
let id = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const msg = JSON.parse(e.data);
  if (msg.id && pending.has(msg.id)) {
    pending.get(msg.id)(msg);
    pending.delete(msg.id);
  }
};
const send = (method, params = {}) =>
  new Promise((resolve, reject) => {
    const n = ++id;
    pending.set(n, (m) => (m.error ? reject(new Error(m.error.message)) : resolve(m.result)));
    ws.send(JSON.stringify({ id: n, method, params }));
  });
await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `file://${OUT_HTML}` });
for (let i = 0; i < 100; i++) {
  const r = await send('Runtime.evaluate', { expression: 'document.readyState === "complete" && document.fonts.status === "loaded" ? 1 : 0', returnByValue: true });
  if (r.result.value) break;
  await new Promise((r) => setTimeout(r, 200));
}
await new Promise((r) => setTimeout(r, 400));
const pdf = await send('Page.printToPDF', { printBackground: true, displayHeaderFooter: false, preferCSSPageSize: true });
const data = Buffer.from(pdf.data, 'base64');
fs.writeFileSync(OUT_PDF, data);
const pages = (data.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
console.log(`${path.relative(ROOT, OUT_PDF)}: ${pages} pages, ${Math.round(data.length / 1024)} KB`);
ws.close();
chrome.kill();
try {
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
} catch {
  // a stale temp profile is harmless
}
