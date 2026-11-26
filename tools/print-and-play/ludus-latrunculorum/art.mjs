// Draws the Ludus Latrunculorum course art into public/academy/ludus-latrunculorum/:
//   setup.svg (480x320, the teach-sheet and course diagram)
//   card.svg (640x360, the catalog card)
//   print-and-play.svg (640x480, the preview beside the free download form)
//   node tools/print-and-play/ludus-latrunculorum/art.mjs
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(HERE, '../../../public/academy/ludus-latrunculorum');
fs.mkdirSync(OUT, { recursive: true });

const C = { walnut: '#2B1E16', parchment: '#F6EFE3', felt: '#2F5D50', lamp: '#E0A23B', stone: '#B9AD9C', white: '#FFFFFF' };
const n = (v) => Math.round(v * 100) / 100;

function grid(x, y, cols, rows, cell, { fill = C.parchment, line = C.walnut, lw = 1, frame = 2 } = {}) {
  let s = `<rect x="${x}" y="${y}" width="${cols * cell}" height="${rows * cell}" fill="${fill}"/>`;
  for (let c = 1; c < cols; c++) s += `<line x1="${n(x + c * cell)}" y1="${y}" x2="${n(x + c * cell)}" y2="${y + rows * cell}" stroke="${line}" stroke-width="${lw}"/>`;
  for (let r = 1; r < rows; r++) s += `<line x1="${x}" y1="${n(y + r * cell)}" x2="${x + cols * cell}" y2="${n(y + r * cell)}" stroke="${line}" stroke-width="${lw}"/>`;
  s += `<rect x="${x}" y="${y}" width="${cols * cell}" height="${rows * cell}" fill="none" stroke="${line}" stroke-width="${frame}"/>`;
  return s;
}

function piece(cx, cy, r, dark, { mark = '' } = {}) {
  let s = `<circle cx="${n(cx)}" cy="${n(cy)}" r="${r}" fill="${dark ? C.walnut : C.white}" stroke="${C.walnut}" stroke-width="${Math.max(1, r * 0.16)}"/>`;
  if (mark === 'x') s += `<path d="M${n(cx - r * 0.5)} ${n(cy - r * 0.5)} L${n(cx + r * 0.5)} ${n(cy + r * 0.5)} M${n(cx + r * 0.5)} ${n(cy - r * 0.5)} L${n(cx - r * 0.5)} ${n(cy + r * 0.5)}" stroke="${C.lamp}" stroke-width="${r * 0.3}" stroke-linecap="round"/>`;
  if (mark === 'dot') s += `<circle cx="${n(cx)}" cy="${n(cy)}" r="${n(r * 0.35)}" fill="${C.lamp}"/>`;
  return s;
}

function arrow(x1, y1, x2, y2, color = C.felt, w = 1.8) {
  const dx = Math.sign(x2 - x1), dy = Math.sign(y2 - y1);
  const h = 5;
  return `<line x1="${x1}" y1="${y1}" x2="${x2 - dx * h}" y2="${y2 - dy * h}" stroke="${color}" stroke-width="${w}" stroke-linecap="round"/><path d="M${x2} ${y2} L${x2 - dx * h - dy * 3.5} ${y2 - dy * h - dx * 3.5} L${x2 - dx * h + dy * 3.5} ${y2 - dy * h + dx * 3.5} Z" fill="${color}"/>`;
}

// a little rule diagram: rows of L, D, X (dark captured), S (dark safe), . empty
function mini(x, y, rows, cell, { from, to, corner = false } = {}) {
  let s = grid(x, y, rows[0].length, rows.length, cell, { lw: 0.8, frame: 1 });
  if (corner) s += `<path d="M${x} ${y + rows.length * cell} V${y} H${x + rows[0].length * cell}" fill="none" stroke="${C.walnut}" stroke-width="3.5"/>`;
  rows.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      s += piece(x + c * cell + cell / 2, y + r * cell + cell / 2, cell * 0.36, ch !== 'L', { mark: ch === 'X' ? 'x' : ch === 'S' ? 'dot' : '' });
    }),
  );
  if (from && to) {
    const fx = x + from[0] * cell + cell / 2, fy = y + from[1] * cell + cell / 2;
    const tx = x + to[0] * cell + cell / 2, ty = y + to[1] * cell + cell / 2;
    s += `<circle cx="${fx}" cy="${fy}" r="${n(cell * 0.3)}" fill="none" stroke="${C.felt}" stroke-width="1" stroke-dasharray="2 1.6"/>`;
    const dx = Math.sign(tx - fx), dy = Math.sign(ty - fy);
    s += arrow(n(fx + dx * cell * 0.12), n(fy + dy * cell * 0.12), n(tx - dx * cell * 0.4), n(ty - dy * cell * 0.4), C.felt, 1.4);
  }
  return s;
}

// ---------- setup.svg ----------
{
  const cell = 32;
  const bx = 24, by = 40;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 480 320" role="img" aria-labelledby="t d">
  <title id="t">Ludus Latrunculorum setup: an empty 8 by 8 board and the three capture rules</title>
  <desc id="d">An empty eight by eight board, labelled A to H across and I to VIII up the side in Roman numerals. A side panel explains placement, then shows a sandwich capture in a row, a corner capture by two pieces, and safe entry between two enemies.</desc>
  <rect width="480" height="320" fill="${C.parchment}"/>
  <g font-family="system-ui, sans-serif" fill="${C.walnut}">
  <text x="${bx}" y="26" font-size="13" font-weight="700">The board starts empty</text>
  <rect x="${bx - 6}" y="${by - 6}" width="${cell * 8 + 12}" height="${cell * 8 + 12}" rx="8" fill="${C.stone}" opacity="0.5"/>
  ${grid(bx, by, 8, 8, cell, { fill: '#FBF7EF', lw: 0.9, frame: 2 })}`;
  const letters = 'ABCDEFGH';
  const roman = ['VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I'];
  for (let c = 0; c < 8; c++) s += `<text x="${bx + c * cell + cell / 2}" y="${by + 8 * cell + 18}" font-size="10" text-anchor="middle">${letters[c]}</text>`;
  for (let r = 0; r < 8; r++) s += `<text x="${bx + 8 * cell + 9}" y="${by + r * cell + cell / 2 + 3.5}" font-size="9">${roman[r]}</text>`;
  const px = 318;
  s += `<text x="${px}" y="26" font-size="13" font-weight="700">1. Place</text>
  <text x="${px}" y="44" font-size="11">Light first, then take turns</text>
  <text x="${px}" y="58" font-size="11">placing one piece anywhere,</text>
  <text x="${px}" y="72" font-size="11">16 each. No captures yet.</text>
  ${piece(px + 8, 88, 7, false)}${piece(px + 26, 88, 7, true)}${piece(px + 44, 88, 7, false)}${piece(px + 62, 88, 7, true)}
  <text x="${px + 76}" y="92" font-size="11">and so on</text>
  <text x="${px}" y="122" font-size="13" font-weight="700">2. Move and capture</text>`;
  const mc = 20;
  s += mini(px, 132, ['LXL.'], mc, { from: [3, 0], to: [2, 0] });
  s += `<text x="${px + 4 * mc + 10}" y="146" font-size="11">Sandwich</text>`;
  s += mini(px, 166, ['XL', 'L.'], mc, { corner: true, from: [1, 1], to: [1, 0] });
  s += `<text x="${px + 2 * mc + 10}" y="190" font-size="11">Corner: two</text><text x="${px + 2 * mc + 10}" y="203" font-size="11">enemies take it</text>`;
  s += mini(px, 222, ['LSL', '...'], mc, { from: [1, 1], to: [1, 0] });
  s += `<text x="${px + 3 * mc + 10}" y="236" font-size="11">Safe entry:</text><text x="${px + 3 * mc + 10}" y="249" font-size="11">no capture</text>`;
  s += `<text x="${px}" y="282" font-size="11">One square, never diagonal.</text><text x="${px}" y="296" font-size="11">Most captures wins.</text>
  </g>
</svg>
`;
  fs.writeFileSync(path.join(OUT, 'setup.svg'), s);
}

// ---------- card.svg ----------
{
  const cell = 34;
  const bx = 184, by = 44;
  // a mid-game position, rows top to bottom
  const pos = ['..D.L...', '.DLD..L.', 'D.L.DL..', '.L..D.D.', 'L.DL..L.', '..L.D.LD', '.D..L...', '...D..L.'];
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 360" role="img" aria-labelledby="t">
<title id="t">An original illustration of a Roman stone game board under a warm lamp, with round glass counters in two colours mid game and two captured pieces set aside</title>
<defs><radialGradient id="felt" cx="50%" cy="40%" r="75%"><stop offset="0" stop-color="#3a6e60"/><stop offset="1" stop-color="#2a5246"/></radialGradient><radialGradient id="lamp" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="#e0a23b" stop-opacity=".3"/><stop offset="1" stop-color="#e0a23b" stop-opacity="0"/></radialGradient>
<radialGradient id="glassL" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#d9d2c4"/></radialGradient>
<radialGradient id="glassD" cx="35%" cy="30%" r="70%"><stop offset="0" stop-color="#5a4434"/><stop offset="1" stop-color="#1c130d"/></radialGradient></defs>
<rect width="640" height="360" fill="url(#felt)"/>
<rect x="${bx - 22}" y="${by - 22}" width="${cell * 8 + 44}" height="${cell * 8 + 44}" rx="16" fill="#b9ad9c" stroke="#8f826f" stroke-width="2"/>
<rect x="${bx - 22}" y="${by - 22}" width="${cell * 8 + 44}" height="${cell * 8 + 44}" rx="16" fill="url(#lamp)"/>
${grid(bx, by, 8, 8, cell, { fill: '#cfc4b2', line: '#6e6152', lw: 1.6, frame: 2.4 })}`;
  pos.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      const cx = bx + c * cell + cell / 2, cy = by + r * cell + cell / 2;
      s += `<ellipse cx="${cx + 1.5}" cy="${cy + 2.5}" rx="12" ry="11" fill="#000" opacity=".18"/><circle cx="${cx}" cy="${cy}" r="12" fill="url(#glass${ch})" stroke="${ch === 'L' ? '#9c917f' : '#0f0a07'}" stroke-width="1"/><ellipse cx="${cx - 4}" cy="${cy - 5}" rx="4" ry="2.4" fill="#fff" opacity="${ch === 'L' ? 0.9 : 0.35}"/>`;
    }),
  );
  // captured pieces beside the board
  [
    [520, 250, 'D'],
    [546, 262, 'D'],
    [110, 96, 'L'],
  ].forEach(([cx, cy, ch]) => {
    s += `<ellipse cx="${cx + 1.5}" cy="${cy + 2.5}" rx="12" ry="11" fill="#000" opacity=".2"/><circle cx="${cx}" cy="${cy}" r="12" fill="url(#glass${ch})" stroke="${ch === 'L' ? '#9c917f' : '#0f0a07'}"/><ellipse cx="${cx - 4}" cy="${cy - 5}" rx="4" ry="2.4" fill="#fff" opacity="${ch === 'L' ? 0.9 : 0.35}"/>`;
  });
  s += `<rect width="640" height="360" fill="url(#lamp)"/>
</svg>
`;
  fs.writeFileSync(path.join(OUT, 'card.svg'), s);
}

// ---------- print-and-play.svg ----------
{
  let s = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 480" role="img" aria-labelledby="t">
<title id="t">The free print-and-play kit: a printed board with light and dark square pieces on it, and a strip of cut-out pieces beside it</title>
<rect width="640" height="480" fill="${C.felt}"/>`;
  // rules sheet, tilted behind
  s += `<g transform="rotate(-7 170 250)"><rect x="40" y="70" width="230" height="300" rx="6" fill="${C.white}"/>
  <rect x="62" y="96" width="140" height="14" rx="3" fill="${C.walnut}"/>
  ${[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((i) => `<rect x="62" y="${124 + i * 16}" width="${i % 3 === 2 ? 120 : 180}" height="6" rx="3" fill="${C.stone}"/>`).join('')}
  </g>`;
  // board sheet
  const cell = 30, bx = 220, by = 72;
  s += `<rect x="${bx - 30}" y="${by - 30}" width="${cell * 8 + 60}" height="${cell * 8 + 60}" rx="6" fill="${C.white}"/>
  <rect x="${bx - 12}" y="${by - 12}" width="${cell * 8 + 24}" height="${cell * 8 + 24}" rx="8" fill="${C.parchment}" stroke="${C.walnut}" stroke-width="1.5"/>
  ${grid(bx, by, 8, 8, cell, { lw: 0.8, frame: 2 })}`;
  const tok = (x, y, size, dark) =>
    `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="${dark ? C.walnut : C.white}" stroke="#8a7d6c" stroke-width="0.6"/><circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size * 0.4}" fill="${dark ? '#3A2A1F' : C.parchment}" stroke="${dark ? C.parchment : C.walnut}" stroke-width="${size * 0.04}"/><circle cx="${x + size / 2}" cy="${y + size / 2}" r="${size * 0.07}" fill="${dark ? C.parchment : C.walnut}"/>`;
  const pos = ['...D....', '..LD.L..', '.D.L..D.', '..L.DL..', '.L.D..L.', '...LD...', '..D..L..', '........'];
  pos.forEach((row, r) =>
    [...row].forEach((ch, c) => {
      if (ch === '.') return;
      s += `<g transform="rotate(${((r * 7 + c * 3) % 9) - 4} ${bx + c * cell + cell / 2} ${by + r * cell + cell / 2})">${tok(bx + c * cell + 3, by + r * cell + 3, cell - 6, ch === 'D')}</g>`;
    }),
  );
  // a strip of uncut pieces and a few loose ones
  s += `<g transform="rotate(4 420 420)">${[0, 1, 2, 3, 4, 5].map((i) => tok(300 + i * 26, 392, 26, false)).join('')}</g>`;
  s += `<g transform="rotate(-3 200 420)">${[0, 1, 2, 3, 4].map((i) => tok(90 + i * 26, 404, 26, true)).join('')}</g>`;
  s += `<g transform="rotate(12 560 330)">${tok(548, 318, 24, true)}</g><g transform="rotate(-9 590 380)">${tok(578, 368, 24, false)}</g>`;
  s += `</svg>
`;
  fs.writeFileSync(path.join(OUT, 'print-and-play.svg'), s);
}
console.log('wrote setup.svg, card.svg, print-and-play.svg');
