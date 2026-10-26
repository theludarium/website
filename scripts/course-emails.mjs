// Builds the Kit sequence emails for a game course from its lessons, one email
// per lesson, following docs/academy/LESSON-EMAIL.md. Writes JSON (for loading
// into Kit) and an HTML preview to the folder given as the last argument.
//   node scripts/course-emails.mjs <slug> [<slug> ...] <out-dir>
import fs from 'node:fs';
import path from 'node:path';
import { parse } from 'yaml';

const args = process.argv.slice(2);
const out = args.pop();
const SITE = 'https://theludarium.com';
const PAUSE = `${SITE}/academy/?utm_source=kit&amp;utm_medium=email&amp;utm_campaign=academy&amp;utm_content=pause`;

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const plain = (md) =>
  md
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
const sentences = (text, n) => (text.match(/[^.!?]+[.!?]+(\s|$)/g) || [text]).slice(0, n).join('').trim();
const words = ['zero', 'one', 'two', 'three', 'four', 'five', 'six'];

fs.mkdirSync(out, { recursive: true });
for (const slug of args) {
  const course = parse(fs.readFileSync(`src/content/courses/${slug}.yaml`, 'utf8'));
  const dir = `src/content/course-lessons/${slug}`;
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
  const levels = course.levels || [];
  const emails = lessons.map((l, i) => {
    const n = l.order;
    const lv = levels.find((x) => x.level === l.level);
    const newLevel = lv && (i === 0 || lessons[i - 1].level !== l.level);
    const firstPara = l.body.split(/\n\s*\n/).map((p) => p.trim()).find((p) => p && !p.startsWith('#') && !p.startsWith('<!--') && !p.startsWith('!['));
    const hook = sentences(plain(firstPara || ''), 2);
    const utm = `utm_source=kit&amp;utm_medium=email&amp;utm_campaign=course-${slug}&amp;utm_content=lesson-${n}`;
    const url = `${SITE}/academy/${slug}/${l.file}/?${utm}`;
    const sheet = `${SITE}/academy/${slug}/teach-sheet/?utm_source=kit&amp;utm_medium=email&amp;utm_campaign=course-${slug}&amp;utm_content=teach-sheet`;
    let ps = '';
    if (n === 1) ps = 'Hit reply and tell me the one rule that confused your table. It helps shape the lessons.';
    else if (n === 2) ps = `Forward this to your game group, and print the <a href="${sheet}">one-page teach sheet</a> for the table.`;
    else if (n === total) ps = `That is the whole course. If you are near Indianapolis, <a href="${SITE}/lounges/indianapolis/?utm_source=kit&amp;utm_medium=email&amp;utm_campaign=course-${slug}&amp;utm_content=finish">join the Indianapolis list</a> for first word on local learn-to-play nights as The Ludarium grows.`;
    const parts = [
      `<p>Hi {{ subscriber.first_name | default: "there" }},</p>`,
      newLevel && l.level > 0
        ? `<p><em>You just reached Level ${lv.level}: ${esc(lv.name)} (${esc(lv.label)}).</em> By the end of it you will be able to ${esc(lv.outcome.charAt(0).toLowerCase() + lv.outcome.slice(1))}</p>`
        : '',
      `<p><strong>Lesson ${n} of ${total}${lv ? ` &middot; Level ${lv.level}, ${esc(lv.name)}` : ''}: ${esc(l.title)}</strong></p>`,
      `<p>${esc(hook)}</p>`,
      `<p><strong>The one idea:</strong> ${esc(l.oneIdea)}</p>`,
      `<p><a href="${url}"><strong>Read lesson ${n} &rarr;</strong></a></p>`,
      `<p><strong>At your next game:</strong> ${esc(l.tryThis)}</p>`,
      `<p>Levi</p>`,
      `<p>The Ludarium</p>`,
      ps ? `<p>P.S. ${ps}</p>` : '',
      `<p style="font-size:13px;color:#6b5f52">Busy stretch? <a href="${PAUSE}">Pause your Academy lessons for two weeks</a>. They pick up where you left off.</p>`,
    ].filter(Boolean);
    const preview = l.oneIdea.length > 90 ? l.oneIdea.slice(0, l.oneIdea.lastIndexOf(' ', 88)) + '...' : l.oneIdea;
    return { n, subject: l.emailSubject, preview, html: parts.join('\n') };
  });
  fs.writeFileSync(path.join(out, `${slug}.json`), JSON.stringify({ slug, game: course.game, title: course.title, emails }, null, 1));
  fs.writeFileSync(
    path.join(out, `${slug}.html`),
    `<meta charset="utf-8"><body style="max-width:640px;margin:auto;font-family:system-ui">` +
      emails.map((e) => `<hr><h3>${e.n}. ${esc(e.subject)}</h3><p style="color:#888">${esc(e.preview)}</p>${e.html}`).join('\n'),
  );
  const dash = emails.filter((e) => /[\u2013\u2014]/.test(e.subject + e.preview + e.html)).length;
  console.log(`${slug}: ${emails.length} emails${dash ? `, ${dash} with dashes` : ''}`);
}
