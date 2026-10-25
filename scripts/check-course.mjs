// Checks one game course's files before a build:
//   node scripts/check-course.mjs <slug>
// Lesson count for the format, frontmatter fields, description lengths, no em
// or en dashes, no banned words, the setup diagram, and the markers left for
// Levi. Prints problems and exits 1 if any are errors.
import fs from 'node:fs';
import path from 'node:path';

const slug = process.argv[2];
if (!slug) {
  console.error('Usage: node scripts/check-course.mjs <slug>');
  process.exit(1);
}
const COUNT = { full: 8, masterclass: 7, 'teach-tonight': 2, tcg: 8 };
const BANNED = /\b(genuinely|honestly|straightforward|delve|elevate|game-changer|unlock|journey|ultimate|must-have|dive in)\b/i;
const CLAIMS = /Ludarium (game nights?|learn-to-play nights?|sessions?|league|events?) (are|is|run|meets?|happen)|join us (at|for) (a|our) Ludarium|at the Ludarium lounge/i;
const errors = [];
const notes = [];
const err = (m) => errors.push(m);
const note = (m) => notes.push(m);

const yamlPath = `src/content/courses/${slug}.yaml`;
if (!fs.existsSync(yamlPath)) err(`missing ${yamlPath}`);
const yaml = fs.existsSync(yamlPath) ? fs.readFileSync(yamlPath, 'utf8') : '';
const format = yaml.match(/^format:\s*['"]?([\w-]+)/m)?.[1];
if (yaml && !COUNT[format]) err(`format must be one of ${Object.keys(COUNT).join(', ')}`);
const yamlDesc = yaml.match(/^description:\s*["']?(.*?)["']?\s*$/m)?.[1] ?? '';
if (yaml && (yamlDesc.length < 150 || yamlDesc.length > 160)) err(`course description is ${yamlDesc.length} characters; needs 150 to 160`);
for (const field of ['title', 'game', 'format', 'order', 'wave', 'publisher', 'notice', 'rulesEdition', 'rulesSource', 'players', 'playTime', 'promise', 'description', 'audience', 'afterLesson3', 'afterLesson8', 'faq', 'teachSheet', 'diagramAlt']) {
  if (yaml && !new RegExp(`^${field}:`, 'm').test(yaml)) err(`course YAML is missing ${field}`);
}
if (format === 'tcg' && !/^tcg:/m.test(yaml)) err('TCG course YAML needs the tcg block (starter, firstEvent, rulesAsOf)');
if (format === 'tcg' && !fs.existsSync(`public/academy/${slug}/mock-card.svg`)) err(`missing public/academy/${slug}/mock-card.svg (the original mock card for the reading-a-card lesson)`);

const svg = `public/academy/${slug}/setup.svg`;
if (!fs.existsSync(svg)) err(`missing ${svg}`);
else {
  const s = fs.readFileSync(svg, 'utf8');
  if (!/viewBox="0 0 480 320"/.test(s)) note('setup.svg should use viewBox="0 0 480 320"');
  if (/<image\b|href="http/.test(s)) err('setup.svg must be original vector art: no embedded or linked images');
}

const dir = `src/content/course-lessons/${slug}`;
const files = fs.existsSync(dir) ? fs.readdirSync(dir).filter((f) => f.endsWith('.md')) : [];
// A course with a level ladder (`levels:` in the YAML) has 10 to 30 lessons, every one tagged with a level.
const levelNums = [...yaml.matchAll(/^\s*-\s*level:\s*(\d)/gm)].map((m) => Number(m[1]));
const leveled = /^levels:/m.test(yaml);
if (leveled) {
  if (files.length < 10 || files.length > 30) err(`${files.length} lessons; a course with levels has 10 to 30`);
  levelNums.forEach((n, i) => { if (n !== i) err(`levels must run 0, 1, 2 ... in order (found ${levelNums.join(', ')})`); });
  if (levelNums.length < 3 || levelNums.length > 6) err(`${levelNums.length} levels; a course has 3 to 6`);
} else if (format && files.length !== COUNT[format]) err(`${files.length} lessons; a ${format} course has ${COUNT[format]}`);
const orders = new Set();
const byOrder = [];
for (const file of files) {
  const text = fs.readFileSync(path.join(dir, file), 'utf8');
  const fm = text.split('---')[1] ?? '';
  const body = text.split('---').slice(2).join('---');
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*["']?(.*?)["']?\\s*$`, 'm'))?.[1];
  for (const k of ['title', 'description', 'course', 'order', 'emailSubject', 'pubDate', 'oneIdea', 'tryThis']) if (!get(k)) err(`${file}: missing ${k}`);
  if (get('course') && get('course') !== slug) err(`${file}: course is "${get('course')}", expected "${slug}"`);
  const d = get('description') ?? '';
  if (d.length < 150 || d.length > 160) err(`${file}: description is ${d.length} characters; needs 150 to 160`);
  const order = Number(get('order'));
  if (orders.has(order)) err(`${file}: duplicate order ${order}`);
  orders.add(order);
  if (leveled) {
    const lv = get('level');
    if (lv === undefined) err(`${file}: missing level (this course has levels)`);
    else if (!levelNums.includes(Number(lv))) err(`${file}: level ${lv} is not one of the course's levels`);
    byOrder.push([order, Number(lv), file]);
  }
  const words = body.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (format !== 'teach-tonight' && (words < 500 || words > 1200)) note(`${file}: ${words} words (aim for 600 to 900)`);
  if (/<!--\s*AT OUR TABLE/.test(body)) note(`${file}: has an AT OUR TABLE placeholder for Levi`);
  if (/<!--\s*VERIFY/.test(body)) note(`${file}: has a VERIFY marker`);
  if (/<!--\s*AFFILIATE/.test(body)) note(`${file}: has an AFFILIATE marker`);
}
if (leveled) {
  byOrder.sort((a, b) => a[0] - b[0]);
  byOrder.forEach(([o], i) => { if (o !== i + 1) err(`lesson orders must run 1 to ${byOrder.length} with no gaps (found ${o} at position ${i + 1})`); });
  for (let i = 1; i < byOrder.length; i++) if (byOrder[i][1] < byOrder[i - 1][1]) err(`${byOrder[i][2]}: level goes down from the lesson before it`);
  for (const n of levelNums) { const c = byOrder.filter((b) => b[1] === n).length; if (c < 2) err(`level ${n} has ${c} lessons; each level needs at least 2`); }
}
for (const file of [yamlPath, ...files.map((f) => path.join(dir, f))].filter((f) => fs.existsSync(f))) {
  const text = fs.readFileSync(file, 'utf8').replace(/<!--[\s\S]*?-->/g, '');
  if (/[—–]/.test(text)) err(`${file}: has an em or en dash`);
  const b = text.match(BANNED);
  if (b) err(`${file}: uses the word "${b[0]}"`);
  const c = text.match(CLAIMS);
  if (c) err(`${file}: claims a Ludarium event exists ("${c[0]}")`);
}
for (const m of notes) console.log(`note  ${m}`);
for (const m of errors) console.log(`ERROR ${m}`);
console.log(`${slug}: ${errors.length} errors, ${notes.length} notes`);
process.exit(errors.length ? 1 : 0);
