// Prints every game course's teach sheet to a one-page PDF, run on a Mac after a build:
//   npm run build && node scripts/teach-sheets.mjs [slug ...]
// Serves dist/ on a local port, opens /academy/<slug>/teach-sheet/ in headless
// Chrome (print styles hide the site chrome), and writes
// public/academy/<slug>/<slug>-teach-sheet.pdf. Commit the PDFs; the next build
// ships them. Warns when a sheet runs past one page.
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import http from 'node:http';
import os from 'node:os';
import path from 'node:path';

const DIST = path.resolve('dist');
const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.json': 'application/json' };

const wanted = process.argv.slice(2);
const slugs = fs
  .readdirSync('src/content/courses')
  .filter((f) => f.endsWith('.yaml'))
  .map((f) => f.replace(/\.yaml$/, ''))
  .filter((s) => wanted.length === 0 || wanted.includes(s))
  .filter((s) => fs.existsSync(path.join(DIST, 'academy', s, 'teach-sheet', 'index.html')));
if (slugs.length === 0) {
  console.error('No built teach sheets found. Run npm run build first (drafts need CF_PAGES_BRANCH set to a preview branch).');
  process.exit(1);
}

const server = http.createServer((req, res) => {
  let file = path.join(DIST, decodeURIComponent(new URL(req.url, 'http://x').pathname));
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!file.startsWith(DIST) || !fs.existsSync(file)) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'content-type': TYPES[path.extname(file)] ?? 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});
await new Promise((r) => server.listen(0, '127.0.0.1', r));
const base = `http://127.0.0.1:${server.address().port}`;

const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'sheet-chrome-'));
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

for (const slug of slugs) {
  await send('Page.navigate', { url: `${base}/academy/${slug}/teach-sheet/` });
  const started = Date.now();
  for (;;) {
    const r = await send('Runtime.evaluate', {
      expression: 'document.readyState === "complete" && document.fonts.status === "loaded" && [...document.images].every((i) => i.complete) ? 1 : 0',
      returnByValue: true,
    });
    if (r.result.value) break;
    if (Date.now() - started > 30000) throw new Error(`${slug}: the teach sheet did not finish loading`);
    await new Promise((r) => setTimeout(r, 300));
  }
  await new Promise((r) => setTimeout(r, 500));
  const pdf = await send('Page.printToPDF', { printBackground: true, displayHeaderFooter: false, preferCSSPageSize: true });
  const out = path.join('public', 'academy', slug, `${slug}-teach-sheet.pdf`);
  fs.mkdirSync(path.dirname(out), { recursive: true });
  const data = Buffer.from(pdf.data, 'base64');
  fs.writeFileSync(out, data);
  const pages = (data.toString('latin1').match(/\/Type\s*\/Page[^s]/g) ?? []).length;
  console.log(`${out}: ${pages} page${pages === 1 ? '' : 's'}, ${Math.round(data.length / 1024)} KB${pages > 1 ? '  <- runs past one page; trim the sheet' : ''}`);
}

ws.close();
chrome.kill();
server.close();
try {
  fs.rmSync(profile, { recursive: true, force: true, maxRetries: 3 });
} catch {
  // a stale temp profile is harmless
}
