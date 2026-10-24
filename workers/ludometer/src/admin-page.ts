// The private admin page, served at /admin/. Plain HTML and script, no framework.
// It calls the admin API with a token typed into the page and kept in sessionStorage.
// Put /admin/* behind Cloudflare Access so only Levi can reach it.
export const ADMIN_HTML = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Ludometer Admin</title>
<style>
  :root { --ink:#2B1E16; --paper:#F6EFE3; --green:#2F5D50; --lamp:#E0A23B; --stone:#B9AD9C; --card:#fffaf2; }
  @media (prefers-color-scheme: dark) { :root { --ink:#F6EFE3; --paper:#1d1510; --card:#2B1E16; --stone:#6f6456; --green:#7fb3a3; } }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--paper); color:var(--ink); font:15px/1.5 system-ui, sans-serif; }
  header { padding:16px; display:flex; flex-wrap:wrap; gap:12px; align-items:center; border-bottom:1px solid var(--stone); }
  h1 { font:600 20px Georgia, serif; margin:0 12px 0 0; }
  nav button { margin-right:4px; }
  main { padding:16px; max-width:1100px; margin:0 auto; }
  section { display:none; } section.on { display:block; }
  .card { background:var(--card); border:1px solid var(--stone); border-radius:12px; padding:16px; margin-bottom:16px; }
  button { font:inherit; border:1px solid var(--green); background:transparent; color:var(--green); border-radius:8px; padding:6px 12px; cursor:pointer; }
  button.primary { background:var(--green); color:#fff; }
  input, select, textarea { font:inherit; padding:6px 8px; border:1px solid var(--stone); border-radius:8px; background:var(--paper); color:var(--ink); max-width:100%; }
  textarea { width:100%; min-height:80px; }
  table { width:100%; border-collapse:collapse; }
  th, td { text-align:left; padding:6px; border-bottom:1px solid var(--stone); vertical-align:top; }
  .row { display:flex; flex-wrap:wrap; gap:8px; align-items:center; margin-bottom:8px; }
  .muted { opacity:.7; font-size:13px; }
  .warn { background:#fbe7c2; color:#2B1E16; padding:8px 12px; border-radius:8px; margin-bottom:8px; }
  #msg { min-height:1.5em; }
  iframe { width:100%; height:520px; border:1px solid var(--stone); border-radius:8px; background:#fff; }
  .scroll { overflow-x:auto; }
</style>
</head>
<body>
<header>
  <h1>Ludometer Admin</h1>
  <label>Token <input id="token" type="password" autocomplete="off" size="24"></label>
  <button id="save-token">Use token</button>
  <nav>
    <button data-tab="movers">Movers</button>
    <button data-tab="watch">Watchlist</button>
    <button data-tab="broadcast">Broadcast</button>
    <button data-tab="settings">Settings</button>
  </nav>
  <span id="msg" class="muted"></span>
</header>
<main>
  <section id="movers">
    <div class="card">
      <div class="row"><label>Week <input id="m-week" type="date"></label><button id="m-load" class="primary">Load week</button><span class="muted">Blank loads the latest scored week.</span></div>
      <div class="scroll"><table id="m-table"></table></div>
    </div>
  </section>

  <section id="watch">
    <div class="card">
      <h2>Add to the watchlist</h2>
      <div class="row">
        <input id="w-name" placeholder="Name">
        <select id="w-kind"><option>boardgame</option><option>crowdfunding</option><option>tcg</option></select>
        <input id="w-bgg" placeholder="BGG id" size="8">
        <input id="w-window" placeholder="Release window">
        <button id="w-add" class="primary">Add</button>
      </div>
    </div>
    <div class="card">
      <div class="row"><label>Status <select id="w-filter"><option value="">all</option><option>watching</option><option>rising</option><option>covered</option><option>passed</option><option>archived</option></select></label><button id="w-load">Refresh</button></div>
      <div class="scroll"><table id="w-table"></table></div>
    </div>
  </section>

  <section id="broadcast">
    <div class="card">
      <div class="row"><label>Week <input id="b-week" type="date"></label><button id="b-load" class="primary">Build draft</button></div>
      <div id="b-warn"></div>
      <p><strong>Subject:</strong> <span id="b-subject"></span><br><strong>Preview:</strong> <span id="b-preview"></span></p>
      <div class="row"><button id="b-copy-html">Copy HTML</button><button id="b-copy-text">Copy plain text</button></div>
      <iframe id="b-frame" sandbox title="Broadcast preview"></iframe>
      <h3>Plain text</h3>
      <textarea id="b-text" rows="16" readonly></textarea>
    </div>
  </section>

  <section id="settings">
    <div class="card">
      <h2>Score weights</h2>
      <p class="muted">Private. Never shown publicly. Weights are scaled to add up to 1. When logged plays in a week pass the threshold, the high-play weights are used.</p>
      <textarea id="s-json" rows="10"></textarea>
      <div class="row"><button id="s-load">Reload</button><button id="s-save" class="primary">Save</button></div>
    </div>
    <div class="card">
      <h2>Run a job by hand</h2>
      <div class="row"><button id="j-snap">Run snapshot now</button><label>Week <input id="j-week" type="date"></label><button id="j-score">Run score</button></div>
      <pre id="j-out" class="muted"></pre>
    </div>
  </section>
</main>
<script>
(() => {
  const $ = id => document.getElementById(id);
  const API = '/api/ludometer';
  let token = '';
  try { token = sessionStorage.getItem('ludometer-token') || ''; } catch (e) {}
  $('token').value = token;
  const say = t => { $('msg').textContent = t; };

  async function api(path, opts = {}) {
    if (!token) { say('Enter the admin token first.'); throw new Error('no token'); }
    const res = await fetch(API + path, { ...opts, headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) { say(body.error || ('Error ' + res.status)); throw new Error(body.error || res.status); }
    return body;
  }
  const el = (tag, props = {}, kids = []) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(props)) { if (k === 'text') n.textContent = v; else if (k.startsWith('on')) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v); }
    for (const c of [].concat(kids)) if (c != null) n.append(c);
    return n;
  };

  $('save-token').onclick = () => {
    token = $('token').value.trim();
    try { sessionStorage.setItem('ludometer-token', token); } catch (e) {}
    say(token ? 'Token set for this tab.' : 'Token cleared.');
  };
  document.querySelectorAll('nav button').forEach(b => b.onclick = () => show(b.dataset.tab));
  function show(tab) {
    document.querySelectorAll('section').forEach(s => s.classList.toggle('on', s.id === tab));
    try { sessionStorage.setItem('ludometer-tab', tab); } catch (e) {}
  }
  let start = 'movers';
  try { start = sessionStorage.getItem('ludometer-tab') || 'movers'; } catch (e) {}
  show(start);

  // Watchlist rows keyed by BGG id, so movers can find their notes.
  let watch = [];
  async function loadWatch() {
    const f = $('w-filter').value;
    watch = (await api('/admin/watchlist' + (f ? '?status=' + encodeURIComponent(f) : ''))).items;
    renderWatch();
  }
  async function patchWatch(id, fields) {
    await api('/admin/watchlist', { method: 'PATCH', body: JSON.stringify({ id, ...fields }) });
    say('Saved.');
  }
  function renderWatch() {
    const t = $('w-table'); t.replaceChildren();
    t.append(el('tr', {}, ['Name', 'Kind', 'BGG', 'Window', 'Status', 'Trigger', 'Verdict', 'Notes', ''].map(h => el('th', { text: h }))));
    for (const w of watch) {
      const f = {};
      const input = (k, size) => (f[k] = el('input', { value: w[k] ?? '', size: String(size) }));
      const area = k => (f[k] = el('textarea', { rows: '2' }, [w[k] ?? '']));
      const status = f.status = el('select', {}, ['watching', 'rising', 'covered', 'passed', 'archived'].map(s => el('option', { text: s })));
      status.value = w.status || 'watching';
      t.append(el('tr', {}, [
        el('td', {}, input('name', 18)), el('td', { text: w.kind }), el('td', {}, input('bgg_id', 7)),
        el('td', {}, input('release_window', 10)), el('td', {}, status),
        el('td', {}, area('trigger')), el('td', {}, area('verdict')), el('td', {}, area('notes')),
        el('td', {}, el('button', { text: 'Save', onclick: () => {
          const out = {}; for (const [k, n] of Object.entries(f)) out[k] = n.value;
          patchWatch(w.id, out).then(loadWatch);
        } })),
      ]));
    }
  }
  $('w-load').onclick = loadWatch;
  $('w-filter').onchange = loadWatch;
  $('w-add').onclick = async () => {
    await api('/admin/watchlist', { method: 'POST', body: JSON.stringify({
      name: $('w-name').value, kind: $('w-kind').value, bgg_id: $('w-bgg').value || null, release_window: $('w-window').value || null,
    }) });
    $('w-name').value = ''; $('w-bgg').value = ''; $('w-window').value = '';
    say('Added.'); loadWatch();
  };

  const moveText = g => g.isNew ? 'new' : g.movement === 0 ? 'same' : g.movement > 0 ? 'up ' + g.movement : 'down ' + (-g.movement);
  $('m-load').onclick = async () => {
    const w = $('m-week').value;
    const [week] = await Promise.all([api('/week' + (w ? '?week=' + w : '')), loadWatch()]);
    $('m-week').value = week.week; $('b-week').value = week.week;
    const t = $('m-table'); t.replaceChildren();
    t.append(el('tr', {}, ['#', 'Move', 'Game', 'Score', 'Att', 'Int', 'Play', 'BGG Hot', 'Days', 'Trigger', 'Verdict', ''].map(h => el('th', { text: h }))));
    for (const g of week.games) {
      const note = watch.find(x => x.bgg_id === g.game_id);
      const trig = el('textarea', { rows: '2' }, [note?.trigger ?? '']);
      const verd = el('textarea', { rows: '2' }, [note?.verdict ?? '']);
      t.append(el('tr', {}, [
        el('td', { text: String(g.rank) }), el('td', { text: moveText(g) }), el('td', { text: g.name }),
        el('td', { text: String(g.score) }), el('td', { text: String(g.attention) }), el('td', { text: String(g.interest) }), el('td', { text: String(g.play) }),
        el('td', { text: g.bgg_hot_rank ? '#' + g.bgg_hot_rank : '' }), el('td', { text: String(g.days_on_list) }),
        el('td', {}, trig), el('td', {}, verd),
        el('td', {}, el('button', { text: 'Save', onclick: async () => {
          const fields = { trigger: trig.value, verdict: verd.value };
          if (note) await patchWatch(note.id, fields);
          else await api('/admin/watchlist', { method: 'POST', body: JSON.stringify({ name: g.name, kind: 'boardgame', bgg_id: g.game_id, status: 'rising', ...fields }) });
          say('Saved note for ' + g.name + '.'); loadWatch();
        } })),
      ]));
    }
    say('Loaded week of ' + week.week + '.');
  };

  let draft = null;
  $('b-load').onclick = async () => {
    const w = $('b-week').value;
    draft = await api('/admin/broadcast' + (w ? '?week=' + w : ''));
    $('b-week').value = draft.week;
    $('b-warn').replaceChildren(...draft.warnings.map(x => el('div', { class: 'warn', text: x })));
    $('b-subject').textContent = draft.subject; $('b-preview').textContent = draft.preview_text;
    $('b-frame').srcdoc = draft.html; $('b-text').value = draft.text;
    say('Draft built.');
  };
  const copy = async text => { try { await navigator.clipboard.writeText(text); say('Copied.'); } catch (e) { say('Copy failed. Select and copy by hand.'); } };
  $('b-copy-html').onclick = () => draft && copy(draft.html);
  $('b-copy-text').onclick = () => draft && copy(draft.text);

  $('s-load').onclick = async () => { $('s-json').value = JSON.stringify((await api('/admin/settings')).settings, null, 2); };
  $('s-save').onclick = async () => {
    let body; try { body = JSON.parse($('s-json').value); } catch (e) { say('Settings must be valid JSON.'); return; }
    $('s-json').value = JSON.stringify((await api('/admin/settings', { method: 'PUT', body: JSON.stringify(body) })).settings, null, 2);
    say('Settings saved.');
  };
  const run = async q => { $('j-out').textContent = 'Running...'; $('j-out').textContent = JSON.stringify(await api('/admin/run?' + q, { method: 'POST' }), null, 2); };
  $('j-snap').onclick = () => run('job=snapshot');
  $('j-score').onclick = () => run('job=score' + ($('j-week').value ? '&week=' + $('j-week').value : ''));
})();
</script>
</body>
</html>
`;
