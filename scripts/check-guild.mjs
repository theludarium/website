// Checks the Guild of Game Guides lessons before a build:
//   node scripts/check-guild.mjs            all lessons
//   node scripts/check-guild.mjs <slug> ...  only these lessons (plus the program-wide checks)
// Frontmatter fields, description lengths, word counts, no em or en dashes, no
// banned words, orders and modules, links to Guild lessons, tools and courses
// that exist, and the markers left for Levi. Exits 1 on any error.
// Writer's guide: docs/academy/GUILD.md.
import fs from 'node:fs';
import path from 'node:path';

const DIR = 'src/content/guild-lessons';
const only = new Set(process.argv.slice(2).map((s) => s.replace(/\.md$/, '')));
const BANNED = /\b(genuinely|honestly|straightforward|delve|elevate|game-changer|unlock|journey|ultimate|must-have|dive in)\b/i;
const FIRST_PERSON_PLAY = /\b(at our table|when (I|we) (taught|played|teach)|I once|my (wife|husband|partner|friends?) and I)\b/i;
const CLAIMS = /Ludarium (game nights?|learn-to-play nights?|sessions?|league|events?) (are|is|run|meets?|happen)|join us (at|for) (a|our) Ludarium|at the Ludarium lounge/i;
const TOOLS = fs
  .readFileSync('src/lib/guild-tools.ts', 'utf8')
  .match(/GUILD_TOOL_SLUGS = \[([\s\S]*?)\]/)[1]
  .match(/'([\w-]+)'/g)
  .map((s) => s.slice(1, -1));
const COURSES = new Set([...fs.readdirSync('src/content/courses').map((f) => f.replace(/\.yaml$/, '')), 'catan', 'game-shelf']);

const errors = [];
const notes = [];
const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith('.md')).sort() : [];
const slugs = new Set(files.map((f) => f.replace(/\.md$/, '')));
const rows = [];

for (const file of files) {
  const slug = file.replace(/\.md$/, '');
  const text = fs.readFileSync(path.join(DIR, file), 'utf8');
  const parts = text.split(/^---\s*$/m);
  const fm = parts[1] ?? '';
  const body = parts.slice(2).join('---');
  const get = (k) => fm.match(new RegExp(`^${k}:\\s*["']?(.*?)["']?\\s*$`, 'm'))?.[1];
  const order = Number(get('order'));
  const mod = Number(get('module'));
  rows.push({ slug, order, mod });
  if (only.size && !only.has(slug)) continue;
  const err = (m) => errors.push(`${file}: ${m}`);
  const note = (m) => notes.push(`${file}: ${m}`);

  for (const k of ['title', 'description', 'module', 'order', 'emailSubject', 'pubDate', 'oneIdea', 'drill']) if (!get(k)) err(`missing ${k}`);
  if (mod < 7 && !get('nextTeaser')) err('missing nextTeaser');
  if (!/^check:/m.test(fm)) err('missing check (two or three questions)');
  const checks = (fm.match(/^\s+- question:/gm) ?? []).length;
  if (checks < 2 || checks > 3) err(`check has ${checks} questions; needs 2 or 3`);
  const d = get('description') ?? '';
  if (d.length < 150 || d.length > 160) err(`description is ${d.length} characters; needs 150 to 160`);
  const tool = get('tool');
  if (tool && !TOOLS.includes(tool)) err(`tool "${tool}" is not one of ${TOOLS.join(', ')}`);

  const words = body.replace(/<!--[\s\S]*?-->/g, ' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  if (words < 550 || words > 1100) err(`${words} words; needs 600 to 900`);
  else if (words < 600 || words > 900) note(`${words} words (aim for 600 to 900)`);
  const sections = (body.match(/^## /gm) ?? []).length;
  if (sections < 3 || sections > 6) err(`${sections} sections; use 3 to 5`);
  if (/^# /m.test(body)) err('no # headings in the body; the page shows the title');

  if (/[—–]/.test(text)) err('has an em or en dash');
  const b = text.match(BANNED);
  if (b) err(`banned word "${b[0]}"`);
  const fp = body.replace(/<!--[\s\S]*?-->/g, ' ').match(FIRST_PERSON_PLAY);
  if (fp) err(`first-person play story ("${fp[0]}"); use an AT OUR TABLE placeholder instead`);
  if (CLAIMS.test(body)) err('claims a Ludarium event that does not exist yet');

  for (const m of body.matchAll(/\]\((\/academy\/[^)#\s]*)\)/g)) {
    const href = m[1];
    const g = href.match(/^\/academy\/guild\/(?:toolkit\/)?([\w-]+)\/$/);
    if (href === '/academy/guild/') continue;
    if (href.startsWith('/academy/guild/toolkit/')) {
      if (!g || !TOOLS.includes(g[1])) err(`link to unknown tool ${href}`);
    } else if (href.startsWith('/academy/guild/')) {
      if (!g || !(slugs.has(g[1]) || g[1] === 'capstone')) err(`link to unknown Guild page ${href}`);
    } else {
      const c = href.match(/^\/academy\/([\w-]+)\//);
      if (!c || !COURSES.has(c[1])) err(`link to unknown Academy course ${href}`);
      else if (!/^\/academy\/[\w-]+\/(teach-sheet\/|[\w-]+\/)?$/.test(href)) err(`check the link ${href}`);
      else if (/\/academy\/[\w-]+\/[\w-]+\/$/.test(href) && !href.endsWith('/teach-sheet/')) {
        const [, course, lesson] = href.match(/^\/academy\/([\w-]+)\/([\w-]+)\/$/);
        const lessonFile = course === 'catan' ? `src/content/lessons/catan/${lesson}.md` : `src/content/course-lessons/${course}/${lesson}.md`;
        if (!fs.existsSync(lessonFile)) err(`link to a lesson that does not exist: ${href}`);
      }
    }
  }
  if (/<!--\s*AT OUR TABLE/.test(body)) note('has an AT OUR TABLE placeholder for Levi');
  if (/<!--\s*VERIFY/.test(body)) note('has a VERIFY marker');
}

// Program-wide: orders 1 to N with no gaps, modules never step back, two or more lessons a module.
rows.sort((a, b) => a.order - b.order);
rows.forEach((r, i) => {
  if (r.order !== i + 1) errors.push(`${r.slug}: order ${r.order}, expected ${i + 1} (orders run 1 to ${rows.length} with no gaps)`);
  if (i > 0 && r.mod < rows[i - 1].mod) errors.push(`${r.slug}: module ${r.mod} comes after module ${rows[i - 1].mod}`);
});
for (let m = 0; m <= 7; m++) {
  const n = rows.filter((r) => r.mod === m).length;
  if (rows.length >= 35 && n < 2) errors.push(`module ${m} has ${n} lessons; each module needs at least 2`);
}

for (const n of notes) console.log(`note   ${n}`);
for (const e of errors) console.log(`ERROR  ${e}`);
console.log(`\n${files.length} lessons checked: ${errors.length} errors, ${notes.length} notes.`);
process.exit(errors.length ? 1 : 0);
