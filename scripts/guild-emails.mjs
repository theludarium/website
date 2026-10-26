// Builds the Kit sequence emails for The Ludarium Guild of Game Teachers, one
// email per lesson, following docs/academy/LESSON-EMAIL.md with the Guild's
// own lines (the drill, the toolkit, new modules and ranks, the capstone).
// Writes guild.json (for loading into Kit) and guild.html (a preview to read
// through first) to the folder given.
//   node scripts/guild-emails.mjs <out-dir>
// Setup in Kit: docs/academy/guild/KIT-SETUP.md.
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const out = process.argv[2];
if (!out) {
  console.error('Usage: node scripts/guild-emails.mjs <out-dir>');
  process.exit(1);
}
const SITE = 'https://theludarium.com';
const PAUSE = `${SITE}/academy/?utm_source=kit&amp;utm_medium=email&amp;utm_campaign=academy&amp;utm_content=pause`;
const utm = (content) => `utm_source=kit&amp;utm_medium=email&amp;utm_campaign=guild&amp;utm_content=${content}`;

// Module names and ranks, kept in step with src/lib/guild.ts.
const lib = fs.readFileSync('src/lib/guild.ts', 'utf8');
const MODULES = [...lib.matchAll(/\{ module: (\d), name: '([^']+)', label: '([^']+)', outcome: '([^']+)' \}/g)].map((m) => ({
  module: Number(m[1]),
  name: m[2],
  label: m[3],
  outcome: m[4].replace(/’/g, "'"),
}));
const RANK_AT = { 3: 'Apprentice', 6: 'Journeyman' };

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (md) =>
  md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const sentences = (text, n) => (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]).slice(0, n).join('').trim();

const dir = 'src/content/guild-lessons';
const lessons = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.md'))
  .map((f) => {
    const raw = fs.readFileSync(path.join(dir, f), 'utf8');
    const [, fm, body] = raw.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    return { file: f.replace(/\.md$/, ''), ...parse(fm), body };
  })
  .filter((l) => !l.draft)
  .sort((a, b) => a.order - b.order);
const total = lessons.length;

const emails = lessons.map((l, i) => {
  const n = l.order;
  const mod = MODULES.find((m) => m.module === l.module);
  const newModule = i === 0 || lessons[i - 1].module !== l.module;
  const firstPara = l.body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('#') && !p.startsWith('<!--'));
  const hook = sentences(plain(firstPara || ''), 2);
  const url = `${SITE}/academy/guild/${l.file}/?${utm(`lesson-${n}`)}`;
  let ps = '';
  if (n === 1) ps = `Your toolkit is ready: <a href="${SITE}/academy/guild/kit/?${utm('kit')}">every printable from the training</a>, in one place. Bookmark it; each lesson tells you which one its drill uses.`;
  else if (n === 2) ps = 'Hit reply and tell me who you most want to play games with. I read every reply.';
  else if (n === total) ps = `This is the last lesson. Your final step is the <a href="${SITE}/academy/guild/capstone/?${utm('capstone')}">capstone</a>: teach one newcomer and tell us how it went. If they said yes to another game, you earn the title Expert Game Teacher.`;
  const rank = newModule && RANK_AT[l.module];
  const parts = [
    `<p>Hi {{ subscriber.first_name | default: "there" }},</p>`,
    rank ? `<p><em>You have finished Modules 0 to ${l.module - 1}. That makes you a Guild ${rank}.</em></p>` : '',
    newModule && l.module > 0
      ? `<p><em>Module ${mod.module}: ${esc(mod.name)} starts today.</em> By the end of it you will be able to ${esc(mod.outcome.charAt(0).toLowerCase() + mod.outcome.slice(1))}</p>`
      : '',
    `<p><strong>Lesson ${n} of ${total} &middot; Module ${mod.module}, ${esc(mod.name)}: ${esc(l.title)}</strong></p>`,
    `<p>${esc(hook)}</p>`,
    `<p><strong>The one idea:</strong> ${esc(l.oneIdea)}</p>`,
    `<p><a href="${url}"><strong>Read lesson ${n} &rarr;</strong></a></p>`,
    `<p><strong>Your drill:</strong> ${esc(l.drill)}</p>`,
    `<p>Levi</p>`,
    `<p>The Ludarium</p>`,
    ps ? `<p>P.S. ${ps}</p>` : '',
    `<p style="font-size:13px;color:#6b5f52">Busy stretch? <a href="${PAUSE}">Pause your Academy lessons for two weeks</a>. They pick up where you left off.</p>`,
  ].filter(Boolean);
  const preview = l.oneIdea.length > 90 ? l.oneIdea.slice(0, l.oneIdea.lastIndexOf(' ', 88)) + '...' : l.oneIdea;
  return { n, subject: l.emailSubject, preview, html: parts.join('\n') };
});

fs.mkdirSync(out, { recursive: true });
fs.writeFileSync(path.join(out, 'guild.json'), JSON.stringify({ slug: 'guild', title: 'The Ludarium Guild of Game Teachers', emails }, null, 1));
fs.writeFileSync(
  path.join(out, 'guild.html'),
  `<meta charset="utf-8"><body style="max-width:640px;margin:auto;font-family:system-ui">` +
    emails.map((e) => `<hr><h3>${e.n}. ${esc(e.subject)}</h3><p style="color:#888">${esc(e.preview)}</p>${e.html}`).join('\n'),
);
const dash = emails.filter((e) => /[–—]/.test(e.subject + e.preview + e.html)).length;
console.log(`guild: ${emails.length} emails${dash ? `, ${dash} with dashes` : ''}`);
