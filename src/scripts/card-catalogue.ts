// The Card Catalogue app (client side). Local-first: everything a visitor
// records lives in their browser's localStorage. No accounts, nothing sent to
// a server. Friends join a game night by trading table codes.
import catalogData from '@/data/card-catalogue.json';
import * as E from '@/lib/card-catalogue/engine';
import { cardHTML, esc } from '@/lib/card-catalogue/render';

const STORE_KEY = 'ludarium-card-catalogue-v1';
const CATALOG = catalogData as unknown as E.Catalog;

type Tab = 'catalogue' | 'night' | 'log' | 'shelf' | 'profile';
type ShelfTab = 'played' | 'own' | 'teach' | 'learn' | 'veto';
type Sheet = { kind: 'game'; slug: string } | { kind: 'guest'; id: string } | { kind: 'add' } | { kind: 'friend' } | { kind: 'code' };

type Draft = {
  slug: string;
  date: string;
  players: number;
  minutes: string;
  taught: boolean;
  rating: number;
  result: E.Result;
  again: E.Play['again'];
  energy: E.Play['energy'];
  with: Record<string, boolean>;
  withText: string;
  note: string;
};

const TAB_HASH: Record<Tab, string> = { catalogue: '#catalogue', night: '#game-night', log: '#log', shelf: '#shelf', profile: '#profile' };

const blankDraft = (slug = ''): Draft => ({
  slug,
  date: E.isoToday(),
  players: 4,
  minutes: '',
  taught: false,
  rating: 0,
  result: '',
  again: '',
  energy: 0,
  with: {},
  withText: '',
  note: '',
});

// ---------- storage ----------

function load(): E.State {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return E.emptyState();
    const d = JSON.parse(raw);
    return { ...E.emptyState(), mine: d.mine ?? {}, plays: d.plays ?? [], guests: d.guests ?? {}, friends: d.friends ?? {} };
  } catch {
    return E.emptyState();
  }
}

let data = load();
let storageOk = true;

function save() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(data));
    storageOk = true;
  } catch {
    if (storageOk) toast('This browser is not saving data. Export a backup from Profile so you do not lose it.');
    storageOk = false;
  }
}

// ---------- ui state ----------

const ui = {
  tab: 'catalogue' as Tab,
  q: '',
  shelf: 'all',
  occ: '',
  players: '',
  sort: 'call',
  shelfTab: 'played' as ShelfTab,
  night: { me: true, selected: {}, players: '', minutes: '', occasion: '', ownedOnly: false } as E.Night,
  draft: blankDraft(),
  guestDraft: { id: '', name: '', prefs: {} } as E.Guest,
  customDraft: { name: '', shelf: '500', min: 2, max: 4, minutes: 45, dims: { theme: 2, luck: 2, inter: 2, learn: 2, tempo: 2, talk: 2 } as Record<E.DimKey, E.Level> },
  sheet: null as Sheet | null,
  confirm: '',
};

const $ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) => root.querySelector<T>(sel);
const view = $('#cc-view')!;
const dialog = $<HTMLDialogElement>('#cc-sheet')!;
const sheetBody = $('#cc-sheet-body')!;
const toastEl = $('#cc-toast')!;

const games = () => E.allGames(CATALOG, data);
const game = (slug: string) => games()[slug];
const playsOf = (slug: string) => data.plays.filter((p) => p.slug === slug);
const prof = () => E.profile(games(), data);
const uid = () => Math.random().toString(36).slice(2, 10);

function withLabel(k: string): string {
  if (k.startsWith('f:')) return data.friends[k.slice(2)]?.name ?? 'A friend';
  if (k.startsWith('g:')) return data.guests[k.slice(2)]?.name ?? 'A guest';
  if (k.startsWith('t:')) return k.slice(2);
  return k;
}

let toastTimer = 0;
function toast(message: string) {
  toastEl.textContent = message;
  toastEl.hidden = false;
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => (toastEl.hidden = true), 2800);
}

function setMine(slug: string, patch: Partial<E.Mine>) {
  const next = { ...(data.mine[slug] ?? {}), ...patch };
  if (!next.rating) delete next.rating;
  for (const f of ['own', 'teach', 'learn', 'veto'] as const) if (!next[f]) delete next[f];
  if (Object.keys(next).length) data.mine[slug] = next;
  else delete data.mine[slug];
  save();
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .map((w) => w[0] ?? '')
    .join('')
    .slice(0, 2)
    .toUpperCase();

const choices = (attr: string, options: [string | number, string][], current: unknown) =>
  `<div class="cc-choices">${options
    .map(([v, t]) => `<button type="button" class="cc-choice" data-${attr}="${esc(v)}" aria-pressed="${String(current) === String(v)}">${esc(t)}</button>`)
    .join('')}</div>`;

// ---------- catalogue ----------

function catalogueResults(): string {
  const all = games();
  const q = ui.q.trim().toLowerCase();
  let list = Object.entries(all);
  if (ui.shelf !== 'all') list = list.filter(([, g]) => g.shelf === ui.shelf);
  if (ui.occ) list = list.filter(([, g]) => (g.occasions ?? []).includes(ui.occ));
  if (q) list = list.filter(([, g]) => g.name.toLowerCase().includes(q) || (g.call ?? '').toLowerCase().includes(q));
  const pn = +ui.players;
  if (pn) {
    list = list.filter(([, g]) =>
      (g.best ?? []).length ? g.best.includes(pn) || (pn >= 8 && Math.max(...g.best) >= 8) : pn >= g.players[0] && pn <= g.players[1],
    );
  }
  const P = prof();
  if (ui.sort === 'fit' && P.n >= 3) list.sort((a, b) => E.fitScore(b[1], P) - E.fitScore(a[1], P));
  else if (ui.sort === 'short') list.sort((a, b) => (+a[1].minutes || 999) - (+b[1].minutes || 999));
  else list.sort((a, b) => (a[1].call ?? '').localeCompare(b[1].call ?? '') || a[1].name.localeCompare(b[1].name));

  if (!list.length) return '<div class="cc-empty"><b>No cards match</b>Try another shelf, occasion, or search.</div>';
  return `<p class="cc-count">${list.length} game${list.length === 1 ? '' : 's'}</p><div class="cc-cards">${list
    .map(([slug, g]) => {
      const m = data.mine[slug];
      const fit = !m?.veto && !m?.rating ? E.myFit(g, P) : null;
      return cardHTML(slug, g, { fit, mine: m, plays: playsOf(slug).length });
    })
    .join('')}</div>`;
}

function viewCatalogue(): string {
  const P = prof();
  const shelfInfo =
    ui.shelf !== 'all'
      ? `<p class="cc-subs">${Object.entries(E.SHELVES[ui.shelf].subs)
          .map(([k, v]) => `<span class="cc-mono">${k}</span> ${esc(v)}`)
          .join(' &middot; ')}</p>`
      : '';
  return `<div class="cc-drawers" role="group" aria-label="Shelves">
      <button type="button" class="cc-drawer" data-shelf="all" aria-pressed="${ui.shelf === 'all'}">All shelves</button>
      ${Object.entries(E.SHELVES)
        .map(([k, v]) => `<button type="button" class="cc-drawer" data-shelf="${k}" aria-pressed="${ui.shelf === k}"><b>${k}</b>${esc(v.n)}</button>`)
        .join('')}
    </div>
    ${shelfInfo}
    <div class="cc-toolbar">
      <input id="cc-q" type="search" placeholder="Search by title or call number" value="${esc(ui.q)}" aria-label="Search games" />
      <select id="cc-players" aria-label="Best player count"><option value="">Any player count</option>${[1, 2, 3, 4, 5, 6, 7, 8]
        .map((n) => `<option value="${n}" ${+ui.players === n ? 'selected' : ''}>Best at ${n}${n === 8 ? '+' : ''}</option>`)
        .join('')}</select>
      <select id="cc-sort" aria-label="Sort"><option value="call" ${ui.sort === 'call' ? 'selected' : ''}>Sort by call number</option><option value="fit" ${ui.sort === 'fit' ? 'selected' : ''} ${P.n < 3 ? 'disabled' : ''}>Sort by your fit${P.n < 3 ? ' (rate 3 games)' : ''}</option><option value="short" ${ui.sort === 'short' ? 'selected' : ''}>Shortest first</option></select>
      <button type="button" class="button button--ghost cc-small" data-act="add">Add a game</button>
    </div>
    <div class="cc-choices" role="group" aria-label="Occasion">${E.OCCASIONS.map(
      (o) => `<button type="button" class="cc-choice" data-occ="${esc(o)}" aria-pressed="${ui.occ === o}">${esc(o)}</button>`,
    ).join('')}</div>
    <div id="cc-results">${catalogueResults()}</div>
    <p class="cc-note">Each card shows six feel dimensions as punched holes: left is the lightest level, right the strongest. Lamplight holes are Table Talk, how much talking and laughing a game creates.</p>`;
}

// ---------- game night ----------

function pickHTML(r: E.GroupPick, isDisc: boolean): string {
  const confident = r.fits.filter((x): x is { m: E.Member; f: number } => x.f != null);
  const low = confident.length > 1 ? confident.reduce((a, b) => (b.f < a.f ? b : a)) : null;
  let why = r.notes[0] ?? '';
  if (!why) {
    if (low && low.f < 0.45) why = `Weakest fit for ${low.m.label}. Check they are up for it.`;
    else if (confident.length) why = 'A solid fit for everyone at the table.';
    else why = 'Rate a few games or add guest preferences to personalize this.';
  }
  if (isDisc) why = `From ${E.SHELVES[r.g.shelf].n}, a shelf you have not picked from tonight. ${why}`;
  const time = r.est.m ? `${r.est.real ? 'about ' : ''}${r.est.m} min${r.est.real ? ' at your table' : ''}` : '';
  return `<div class="cc-pick">
    <button type="button" class="cc-pick__head" data-open="${esc(r.slug)}">
      <span><span class="cc-call">${esc(r.g.call)}</span><span class="cc-pick__name">${esc(r.g.name)}${isDisc ? '<span class="cc-disc">Discovery</span>' : ''}</span></span>
      <span class="cc-gfit">${Math.round(r.score * 100)}% fit</span>
    </button>
    <p class="cc-why">${esc(why)}${time ? ` &middot; ${esc(time)}` : ''}</p>
    ${
      confident.length
        ? `<div class="cc-fits">${r.fits
            .map((x) =>
              x.f == null
                ? `<span class="cc-fitbar">${esc(x.m.label)} &middot; new</span>`
                : `<span class="cc-fitbar${x === low && x.f < 0.45 ? ' is-low' : ''}">${esc(x.m.label)} <span class="cc-bar"><i style="width:${Math.round(x.f * 100)}%"></i></span></span>`,
            )
            .join('')}</div>`
        : ''
    }
  </div>`;
}

function viewNight(): string {
  const R = E.groupPicks(games(), data, ui.night);
  const person = (key: string, label: string, pressed: boolean, kind: string, edit = '') =>
    `<button type="button" class="cc-person is-${kind}" data-member="${esc(key)}" aria-pressed="${pressed}"><span class="cc-dot">${esc(initials(label))}</span>${esc(label)}${edit}</button>`;
  const people = [
    person('me', 'You', ui.night.me, 'me'),
    ...Object.values(data.friends).map((f) => person(`f:${f.id}`, f.name, !!ui.night.selected[`f:${f.id}`], 'friend')),
    ...Object.values(data.guests).map((g) =>
      person(`g:${g.id}`, g.name, !!ui.night.selected[`g:${g.id}`], 'guest', `<span class="cc-edit" data-guestedit="${esc(g.id)}" role="button" tabindex="0" aria-label="Edit ${esc(g.name)}">Edit</span>`),
    ),
  ].join('');

  let body: string;
  if (!R.members.length) body = '<div class="cc-empty"><b>Who is playing?</b>Tap names above to set the table.</div>';
  else if (!R.picks.length) {
    const d = R.dropped;
    body = `<div class="cc-empty"><b>No game fits every rule</b>${[
      d.own && `${d.own} not owned by anyone here.`,
      d.veto && `${d.veto} marked Not for me by someone at the table.`,
      d.time && `${d.time} run too long.`,
      d.teach && `${d.teach} heavy games need someone who can teach them.`,
    ]
      .filter(Boolean)
      .join(' ')} Try a longer time or fewer filters.</div>`;
  } else body = R.picks.map((p) => pickHTML(p, false)).join('') + (R.disc ? pickHTML(R.disc, true) : '');

  const removed = [
    R.dropped.own && `${R.dropped.own} not owned here`,
    R.dropped.veto && `${R.dropped.veto} marked Not for me`,
    R.dropped.time && `${R.dropped.time} too long`,
    R.dropped.teach && `${R.dropped.teach} need a teacher`,
  ]
    .filter(Boolean)
    .join(' &middot; ');

  return `<div class="cc-panel">
      <h2>Who is at the table?</h2>
      <div class="cc-who" role="group" aria-label="Players">${people}</div>
      <div class="cc-actions">
        <button type="button" class="button button--ghost cc-small" data-act="add-guest">Add a guest</button>
        <button type="button" class="button button--ghost cc-small" data-act="add-friend">Add a friend's table code</button>
        <button type="button" class="button button--ghost cc-small" data-act="my-code">Share my table code</button>
      </div>
      <p class="cc-note">Guests are people without the app: pick what they enjoy. Friends who use the Card Catalogue can send you their table code so their tastes count too.</p>
    </div>
    <div class="cc-panel">
      <div class="cc-row3">
        <label class="cc-field">Players<input id="nt-players" type="number" min="1" max="30" placeholder="${R.members.length || ''}" value="${esc(ui.night.players)}" /></label>
        <label class="cc-field">Time limit (minutes)<input id="nt-minutes" type="number" min="10" step="5" placeholder="Any" value="${esc(ui.night.minutes)}" /></label>
        <label class="cc-field">Occasion<select id="nt-occ"><option value="">Any</option>${E.OCCASIONS.map(
          (o) => `<option ${ui.night.occasion === o ? 'selected' : ''}>${esc(o)}</option>`,
        ).join('')}</select></label>
      </div>
      <label class="cc-check"><input id="nt-own" type="checkbox" ${ui.night.ownedOnly ? 'checked' : ''} /> Only games someone at the table owns${R.ownedAny.size ? ` <span class="cc-muted">(${R.ownedAny.size} owned)</span>` : ''}</label>
    </div>
    <div class="cc-panel">
      <h2>Tonight's picks${R.members.length ? ` <span class="cc-muted cc-mono">for ${R.N}</span>` : ''}</h2>
      ${body}
      ${removed && R.picks.length ? `<p class="cc-note">Removed: ${removed}.</p>` : ''}
      <p class="cc-note">Group fit is a geometric mean, so one unhappy player pulls a game down hard. Any Not for me removes a game, and Heavy games need someone who has played them or can teach them.</p>
    </div>`;
}

// ---------- log ----------

function gameOptions(selected: string): string {
  return (
    '<option value="">Choose a game</option>' +
    Object.entries(games())
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .map(([s, g]) => `<option value="${esc(s)}" ${s === selected ? 'selected' : ''}>${esc(g.name)}</option>`)
      .join('')
  );
}

function viewLog(): string {
  const d = ui.draft;
  const people = [
    ...Object.values(data.friends).map((f) => [`f:${f.id}`, f.name] as const),
    ...Object.values(data.guests).map((g) => [`g:${g.id}`, g.name] as const),
  ];
  return `<div class="cc-panel">
    <h2>Log a play</h2>
    <p class="cc-muted">Every play sharpens your profile and records how long the game really runs at your table.</p>
    <form class="cc-form" id="cc-logform" novalidate>
      <label class="cc-field">Game<select id="lg-game" required>${gameOptions(d.slug)}</select></label>
      <div class="cc-row3">
        <label class="cc-field">Date<input id="lg-date" type="date" value="${esc(d.date)}" /></label>
        <label class="cc-field">Players<input id="lg-players" type="number" min="1" max="30" value="${esc(d.players)}" /></label>
        <label class="cc-field">Minutes<input id="lg-minutes" type="number" min="1" max="900" placeholder="60" value="${esc(d.minutes)}" /></label>
      </div>
      <label class="cc-check"><input id="lg-taught" type="checkbox" ${d.taught ? 'checked' : ''} /> Someone was learning it this time</label>
      <div class="cc-field"><span class="cc-legend">Your rating</span>${starsHTML('draft-star', d.rating)}</div>
      <div class="cc-field"><span class="cc-legend">Result</span>${choices('result', E.RESULTS, d.result)}</div>
      <div class="cc-field"><span class="cc-legend">Played with</span>
        ${people.length ? `<div class="cc-who">${people.map(([k, n]) => `<button type="button" class="cc-person" data-with="${esc(k)}" aria-pressed="${!!d.with[k]}"><span class="cc-dot">${esc(initials(n))}</span>${esc(n)}</button>`).join('')}</div>` : ''}
        <input id="lg-with" type="text" placeholder="Other names, separated by commas" value="${esc(d.withText)}" aria-label="Other players" />
      </div>
      <div class="cc-field"><span class="cc-legend">Play again with this group?</span>${choices('again', [['yes', 'Yes, soon'], ['maybe', 'Maybe'], ['no', 'Probably not']], d.again)}</div>
      <div class="cc-field"><span class="cc-legend">How loud was the table?</span>${choices('energy', [[1, 'Quiet'], [2, 'Chatty'], [3, 'Raucous']], d.energy)}</div>
      <label class="cc-field">Note<textarea id="lg-note" rows="2" placeholder="A great moment, a house rule">${esc(d.note)}</textarea></label>
      <button class="button" type="submit">Save play</button>
    </form>
  </div>`;
}

function starsHTML(attr: string, rating: number): string {
  return `<div class="cc-stars">${[1, 2, 3, 4, 5]
    .map((i) => `<button type="button" data-${attr}="${i}" class="${i <= rating ? 'is-on' : ''}" aria-label="${i} star${i > 1 ? 's' : ''}" aria-pressed="${i === rating}">&#9733;</button>`)
    .join('')}</div>`;
}

// ---------- shelf ----------

function viewShelf(): string {
  const tabs: [ShelfTab, string][] = [
    ['played', 'Played'],
    ['own', 'Collection'],
    ['teach', 'Can teach'],
    ['learn', 'Want to learn'],
    ['veto', 'Not for me'],
  ];
  let slugs: string[];
  if (ui.shelfTab === 'played') {
    const last: Record<string, string> = {};
    for (const p of data.plays) if (!last[p.slug] || p.date > last[p.slug]) last[p.slug] = p.date;
    slugs = Object.keys(last).sort((a, b) => last[b].localeCompare(last[a]));
  } else {
    const flag = ui.shelfTab;
    slugs = Object.keys(data.mine).filter((s) => data.mine[s][flag]);
  }
  const all = games();
  slugs = slugs.filter((s) => all[s]);
  const empty: Record<ShelfTab, string> = {
    played: 'Log your first play and it lands here.',
    own: 'Tap Own it on any catalogue card to build your collection. Game night can then stick to games someone at the table owns.',
    teach: 'Mark games you can teach. They make you the person who gets new players to the table.',
    learn: 'Mark games you want to learn. When you meet someone who can teach one, that is a game night.',
    veto: 'Games marked Not for me never show up in your picks.',
  };
  return `<div class="cc-seg" role="group" aria-label="My lists">${tabs
    .map(([k, t]) => `<button type="button" data-shelftab="${k}" aria-pressed="${ui.shelfTab === k}">${t}</button>`)
    .join('')}</div>
    ${
      slugs.length
        ? `<div class="cc-cards">${slugs.map((s) => cardHTML(s, all[s], { mine: data.mine[s], plays: playsOf(s).length })).join('')}</div>`
        : `<div class="cc-empty"><b>Nothing here yet</b>${empty[ui.shelfTab]}</div>`
    }`;
}

// ---------- profile ----------

function viewProfile(): string {
  const all = games();
  const P = prof();
  const plays = data.plays;
  const minutes = plays.reduce((a, p) => a + (+p.minutes || 0), 0);
  const asked = plays.filter((p) => p.again);
  const yes = asked.filter((p) => p.again === 'yes').length;
  const shelvesVisited = new Set(plays.map((p) => all[p.slug]?.shelf).filter(Boolean)).size;
  const stat = (n: string, l: string) => `<div class="cc-stat"><div class="cc-stat__n">${n}</div><div class="cc-stat__l">${l}</div></div>`;

  const dims = E.DIMS.map((d) => {
    const row = P.pref[d.k];
    const max = Math.max(...row);
    const min = Math.min(...row);
    return `<div class="cc-dimrow"><div class="cc-dimname">${esc(d.name)}</div><div class="cc-lvls">${row
      .map((v, i) => {
        const c = max > 0 && v === max ? ' is-best' : v > 0 ? ' is-liked' : v < 0 && v === min ? ' is-miss' : '';
        return `<div class="cc-lvl${c}">${esc(d.lv[i])}</div>`;
      })
      .join('')}</div></div>`;
  }).join('');

  let recs: string;
  if (P.n < 3) recs = '<div class="cc-empty"><b>Rate three games to unlock picks</b>Rate games, mark ones you can teach, or log plays. Your picks appear here after three.</div>';
  else {
    const { picks, disc } = E.recommendations(all, data, P);
    const item = (x: E.Scored, isDisc: boolean) =>
      `<button type="button" class="cc-rec" data-open="${esc(x.slug)}"><span class="cc-call">${esc(x.g.call)}</span><span><span class="cc-pick__name">${esc(x.g.name)}${isDisc ? '<span class="cc-disc">Discovery</span>' : ''}</span><span class="cc-why">${esc(isDisc ? `From ${E.SHELVES[x.g.shelf].n}, a shelf you rarely visit.` : E.reasonFor(x.g, P))}</span></span></button>`;
    recs = picks.map((p) => item(p, false)).join('') + (disc ? item(disc, true) : '');
  }

  const counts = Object.keys(E.SHELVES).map((k) => [k, plays.filter((p) => all[p.slug]?.shelf === k).length] as const);
  const maxShelf = Math.max(1, ...counts.map(([, c]) => c));
  const shelves = counts
    .map(([k, c]) => `<div class="cc-shelfbar"><span class="cc-mono">${k}</span><span class="cc-track" title="${esc(E.SHELVES[k].n)}"><i style="width:${(c / maxShelf) * 100}%"></i></span><span class="cc-mono">${c}</span></div>`)
    .join('');

  const T = E.tableStats(all, data, withLabel);
  const pct = (a: number, b: number) => (a + b ? `${Math.round((a / (a + b)) * 100)}% (${a} of ${a + b})` : 'None yet');
  const table = plays.length
    ? `<div class="cc-panel"><h2>Your table</h2><div class="cc-two">
        <div><p class="eyebrow">Played with most</p>${T.companions.length ? `<ul class="cc-statlist">${T.companions.map(([n, c]) => `<li><span>${esc(n)}</span><span>${c}</span></li>`).join('')}</ul>` : '<p class="cc-muted">Add who played when you log a game.</p>'}</div>
        <div><p class="eyebrow">Most played</p><ul class="cc-statlist">${T.most.map(([n, c]) => `<li><span>${esc(n)}</span><span>${c}</span></li>`).join('')}</ul></div>
      </div>
      <ul class="cc-statlist">
        <li><span>Weeks in a row with a game</span><span>${T.streak}</span></li>
        <li><span>Competitive win rate</span><span>${pct(T.won, T.lost)}</span></li>
        <li><span>Co-op win rate</span><span>${pct(T.coopWon, T.coopLost)}</span></li>
      </ul></div>`
    : '';

  return `<div class="cc-stats">
      ${stat(String(plays.length), 'Plays')}
      ${stat((minutes / 60).toFixed(minutes >= 600 ? 0 : 1), 'Hours together')}
      ${stat(`${shelvesVisited}<span class="cc-muted">/10</span>`, 'Shelves visited')}
      ${stat(asked.length ? `${Math.round((yes / asked.length) * 100)}%` : 'None', 'Would play again')}
    </div>
    ${table}
    <div class="cc-panel"><h2>Your feel profile</h2><p class="cc-muted">${E.confidenceLabel(P.n)} &middot; built from ${P.n} game${P.n === 1 ? '' : 's'}. Solid is your favorite level, tinted is also liked, struck through tends to miss.</p>${dims}</div>
    <div class="cc-panel"><h2>Next up for you</h2>${recs}</div>
    <div class="cc-panel"><h2>Shelves you play</h2>${shelves}<p class="cc-note">${Object.entries(E.SHELVES).map(([k, v]) => `${k} ${esc(v.n)}`).join(' &middot; ')}</p></div>
    <div class="cc-panel"><h2>Your data</h2>
      <p class="cc-muted">Everything you record stays in this browser on this device. The Ludarium never receives it. Download a backup to keep it safe or move it to another device.</p>
      <div class="cc-actions">
        <button type="button" class="button button--ghost cc-small" data-act="backup">Download a backup</button>
        <label class="button button--ghost cc-small cc-file">Restore a backup<input type="file" accept="application/json,.json" data-act="restore" /></label>
        <button type="button" class="button button--ghost cc-small" data-act="csv" ${plays.length ? '' : 'disabled'}>Download plays (CSV)</button>
        <button type="button" class="button button--ghost cc-small" data-act="wipe">${ui.confirm === 'wipe' ? 'Tap again to erase everything' : 'Erase my data'}</button>
      </div>
    </div>`;
}

// ---------- sheets (dialog) ----------

function sheetGame(slug: string): string {
  const g = game(slug);
  if (!g) return '';
  const m = data.mine[slug] ?? {};
  const { range, best } = E.playersText(g);
  const ps = playsOf(slug).sort((a, b) => b.date.localeCompare(a.date));
  const byN: Record<string, number[]> = {};
  for (const p of ps) if (+p.minutes > 0) (byN[p.players] ??= []).push(+p.minutes);
  const times = Object.entries(byN)
    .map(([n, arr]) => `${n} players: about ${E.median(arr)} min`)
    .join(' &middot; ');
  const sub = E.SHELVES[g.shelf]?.subs[g.sub] ?? '';
  const flag = (f: 'own' | 'teach' | 'learn' | 'veto', label: string) =>
    `<button type="button" class="cc-toggle${f === 'veto' ? ' is-veto' : ''}" data-flag="${f}" data-slug="${esc(slug)}" aria-pressed="${!!m[f]}">${label}</button>`;
  return `<p class="eyebrow">${esc(E.SHELVES[g.shelf]?.n ?? '')}${sub ? ` &middot; ${esc(sub)}` : ''}${g.custom ? ' &middot; your card' : ''}</p>
    <h2 id="cc-sheet-title">${esc(g.name)}</h2>
    <p class="cc-call cc-call--big">${esc(g.call)}</p>
    <dl class="cc-kv">
      <dt>Box says</dt><dd>${esc(range)} players &middot; ${esc(g.minutes || '?')} min</dd>
      ${best ? `<dt>Sweet spot</dt><dd>Best at ${esc(best)} players</dd>` : ''}
      <dt>At your table</dt><dd>${times || '<span class="cc-muted">Log a play with minutes to see the real run time</span>'}</dd>
      ${(g.occasions ?? []).length ? `<dt>Good for</dt><dd>${esc(g.occasions.join(', '))}</dd>` : ''}
    </dl>
    <div class="cc-dimlist">${E.DIMS.map((d) => {
      const lv = g.dims?.[d.k] ?? 0;
      return `<div class="cc-hrow"><span>${esc(d.name)}</span><em>${esc(d.lv[lv - 1] ?? 'Unrated')}</em><span class="cc-hset">${[1, 2, 3]
        .map((i) => `<i class="cc-hole${d.k === 'talk' ? ' is-talk' : ''}${i === lv ? ' is-on' : ''}"></i>`)
        .join('')}</span></div>`;
    }).join('')}</div>
    <div class="cc-field"><span class="cc-legend">Your rating</span>${starsHTML('rate', m.rating ?? 0)}</div>
    <div class="cc-actions">
      ${flag('own', 'Own it')}${flag('teach', 'Can teach')}${flag('learn', 'Want to learn')}${flag('veto', 'Not for me')}
      <button type="button" class="button cc-small" data-act="log-this" data-slug="${esc(slug)}">Log a play</button>
    </div>
    ${
      ps.length
        ? `<h3>Your plays</h3><ul class="cc-plays">${ps
            .map(
              (p) => `<li><span><span class="cc-mono">${esc(p.date)}</span> &middot; ${esc(p.players)} players${p.minutes ? ` &middot; ${esc(p.minutes)} min` : ''}${p.result ? ` &middot; ${esc(E.RESULTS.find((r) => r[0] === p.result)?.[1] ?? '')}` : ''}${p.with.length ? ` &middot; with ${esc(p.with.map(withLabel).join(', '))}` : ''}${p.note ? ` &middot; <span class="cc-muted">${esc(p.note)}</span>` : ''}</span><button type="button" class="cc-linkbtn" data-delplay="${esc(p.id)}">${ui.confirm === p.id ? 'Tap again to remove' : 'Remove'}</button></li>`,
            )
            .join('')}</ul>`
        : ''
    }`;
}

function sheetGuest(): string {
  const g = ui.guestDraft;
  return `<p class="eyebrow">Game night guest</p><h2 id="cc-sheet-title">${g.id ? 'Edit guest' : 'Add a guest'}</h2>
    <p class="cc-muted">For family and friends without the app. Pick what they enjoy, or skip any you do not know.</p>
    <form class="cc-form" id="cc-guestform" novalidate>
      <label class="cc-field">Name<input id="gs-name" required maxlength="40" value="${esc(g.name)}" placeholder="First name" /></label>
      ${E.DIMS.map(
        (d) => `<div class="cc-field"><span class="cc-legend">${esc(d.name)}: ${esc(d.q)}</span>${choices(`gdim-${d.k}`, d.lv.map((t, i) => [i + 1, t] as [number, string]), g.prefs?.[d.k] ?? '')}</div>`,
      ).join('')}
      <div class="cc-actions"><button class="button" type="submit">Save guest</button>${g.id ? `<button type="button" class="button button--ghost" data-act="del-guest">${ui.confirm === `guest:${g.id}` ? 'Tap again to remove' : 'Remove guest'}</button>` : ''}</div>
    </form>`;
}

function sheetAdd(): string {
  const c = ui.customDraft;
  return `<p class="eyebrow">New catalogue card</p><h2 id="cc-sheet-title">Add a game</h2>
    <p class="cc-muted">File a game we have not catalogued yet. It is saved to your own cards on this device.</p>
    <form class="cc-form" id="cc-addform" novalidate>
      <label class="cc-field">Title<input id="cg-name" required maxlength="80" value="${esc(c.name)}" placeholder="Game title" /></label>
      <label class="cc-field">Shelf<select id="cg-shelf">${Object.entries(E.SHELVES)
        .map(([k, v]) => `<option value="${k}" ${c.shelf === k ? 'selected' : ''}>${k} ${esc(v.n)}</option>`)
        .join('')}</select></label>
      <div class="cc-row3">
        <label class="cc-field">Min players<input id="cg-min" type="number" min="1" value="${esc(c.min)}" /></label>
        <label class="cc-field">Max players<input id="cg-max" type="number" min="1" value="${esc(c.max)}" /></label>
        <label class="cc-field">Box minutes<input id="cg-minutes" type="number" min="1" value="${esc(c.minutes)}" /></label>
      </div>
      ${E.DIMS.map(
        (d) => `<div class="cc-field"><span class="cc-legend">${esc(d.name)}: ${esc(d.q)}</span>${choices(`cdim-${d.k}`, d.lv.map((t, i) => [i + 1, t] as [number, string]), c.dims[d.k])}</div>`,
      ).join('')}
      <button class="button" type="submit">File this card</button>
    </form>`;
}

function sheetFriend(): string {
  return `<p class="eyebrow">Game night</p><h2 id="cc-sheet-title">Add a friend's table code</h2>
    <p class="cc-muted">Ask a friend who uses the Card Catalogue to tap "Share my table code" and send it to you. Their feel profile, Not for me list, and the games they own, teach, or want to learn will count at your table.</p>
    <form class="cc-form" id="cc-friendform" novalidate>
      <label class="cc-field">Their table code<textarea id="fr-code" rows="3" required placeholder="LUD1..."></textarea></label>
      <label class="cc-field">Name to show<input id="fr-name" maxlength="40" placeholder="Uses the name in the code if blank" /></label>
      <button class="button" type="submit">Add to my table</button>
    </form>
    ${
      Object.keys(data.friends).length
        ? `<h3>Friends at your table</h3><ul class="cc-plays">${Object.values(data.friends)
            .map((f) => `<li><span>${esc(f.name)}</span><button type="button" class="cc-linkbtn" data-delfriend="${esc(f.id)}">${ui.confirm === `friend:${f.id}` ? 'Tap again to remove' : 'Remove'}</button></li>`)
            .join('')}</ul>`
        : ''
    }`;
}

function sheetCode(): string {
  const digest = E.shareDigest(games(), data);
  return `<p class="eyebrow">Game night</p><h2 id="cc-sheet-title">Share my table code</h2>
    <p class="cc-muted">Send this to a friend who uses the Card Catalogue. It shares your feel profile, your Not for me list, and the games you own, teach, want to learn, or have played. Never your notes or ratings. It is a snapshot, so send a fresh one after you rate more games.</p>
    <form class="cc-form" id="cc-codeform" novalidate>
      <label class="cc-field">Your name, as friends will see it<input id="code-name" maxlength="40" placeholder="First name" /></label>
      <label class="cc-field">Your table code<textarea id="code-out" rows="4" readonly></textarea></label>
      <button class="button" type="submit">Copy my code</button>
    </form>
    ${digest.n < 3 ? '<p class="cc-note">Tip: rate at least three games first, so your code says something about your taste.</p>' : ''}`;
}

function renderSheet() {
  if (!ui.sheet) {
    if (dialog.open) dialog.close();
    return;
  }
  const s = ui.sheet;
  const scroll = sheetBody.scrollTop;
  sheetBody.innerHTML =
    s.kind === 'game' ? sheetGame(s.slug) : s.kind === 'guest' ? sheetGuest() : s.kind === 'add' ? sheetAdd() : s.kind === 'friend' ? sheetFriend() : sheetCode();
  sheetBody.scrollTop = scroll;
  if (s.kind === 'code') updateCode();
  if (!dialog.open) dialog.showModal();
}

function openSheet(sheet: Sheet) {
  ui.sheet = sheet;
  ui.confirm = '';
  sheetBody.scrollTop = 0;
  renderSheet();
}

function closeSheet() {
  ui.sheet = null;
  renderSheet();
}

function updateCode() {
  const out = $<HTMLTextAreaElement>('#code-out', sheetBody);
  const name = $<HTMLInputElement>('#code-name', sheetBody)?.value.trim() || 'A friend';
  if (out) out.value = E.encodeTableCode(name, E.shareDigest(games(), data));
}

// ---------- render ----------

function render(focusId?: string) {
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach((b) => {
    const on = b.dataset.tab === ui.tab;
    b.setAttribute('aria-selected', String(on));
    b.tabIndex = on ? 0 : -1;
  });
  view.innerHTML =
    ui.tab === 'catalogue' ? viewCatalogue() : ui.tab === 'night' ? viewNight() : ui.tab === 'log' ? viewLog() : ui.tab === 'shelf' ? viewShelf() : viewProfile();
  view.setAttribute('aria-labelledby', `cc-tab-${ui.tab}`);
  if (focusId) $<HTMLElement>(`#${focusId}`)?.focus();
  if (ui.sheet) renderSheet();
}

function setTab(tab: Tab, push = true) {
  ui.tab = tab;
  ui.confirm = '';
  if (push) history.replaceState(null, '', TAB_HASH[tab]);
  render();
}

// ---------- events ----------

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = Object.assign(document.createElement('a'), { href: url, download: name });
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function handleClick(e: MouseEvent) {
  const t = e.target as HTMLElement;
  const el = t.closest<HTMLElement>('button, [data-guestedit], [role="button"]');
  if (!el) return;
  const d = el.dataset;

  if (d.guestedit) {
    e.stopPropagation();
    const g = data.guests[d.guestedit];
    if (g) {
      ui.guestDraft = { ...g, prefs: { ...g.prefs } };
      openSheet({ kind: 'guest', id: g.id });
    }
    return;
  }
  if (d.open) return openSheet({ kind: 'game', slug: d.open });
  if (d.shelf) {
    ui.shelf = d.shelf;
    return render();
  }
  if (d.occ !== undefined && el.classList.contains('cc-choice') && el.closest('#cc-view') && ui.tab === 'catalogue') {
    ui.occ = ui.occ === d.occ ? '' : d.occ;
    return render();
  }
  if (d.shelftab) {
    ui.shelfTab = d.shelftab as ShelfTab;
    return render();
  }
  if (d.member) {
    if (d.member === 'me') ui.night.me = !ui.night.me;
    else ui.night.selected[d.member] = !ui.night.selected[d.member];
    return render();
  }

  // Log form: update the draft in place, no re-render, so typing is not interrupted.
  if (d.draftStar) {
    const n = +d.draftStar;
    ui.draft.rating = ui.draft.rating === n ? 0 : n;
    el.parentElement!.querySelectorAll<HTMLButtonElement>('button').forEach((b, i) => {
      b.classList.toggle('is-on', i < ui.draft.rating);
      b.setAttribute('aria-pressed', String(i + 1 === ui.draft.rating));
    });
    return;
  }
  const pressOne = (key: 'result' | 'again' | 'energy', value: string) => {
    const current = String(ui.draft[key]);
    const next = current === value ? '' : value;
    if (key === 'energy') ui.draft.energy = (next ? +next : 0) as E.Play['energy'];
    else (ui.draft[key] as string) = next;
    el.parentElement!.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el && next !== '')));
  };
  if (d.result !== undefined) return pressOne('result', d.result);
  if (d.again !== undefined) return pressOne('again', d.again);
  if (d.energy !== undefined) return pressOne('energy', d.energy);
  if (d.with) {
    ui.draft.with[d.with] = !ui.draft.with[d.with];
    el.setAttribute('aria-pressed', String(ui.draft.with[d.with]));
    return;
  }

  // Guest and custom game forms: one choice per dimension.
  for (const [key, value] of Object.entries(d)) {
    const guest = key.match(/^gdim(\w+)$/);
    const custom = key.match(/^cdim(\w+)$/);
    if (!guest && !custom) continue;
    const dim = (guest ?? custom)![1].replace(/^-?/, '').toLowerCase() as E.DimKey;
    const v = +value! as E.Level;
    if (guest) {
      ui.guestDraft.prefs[dim] = ui.guestDraft.prefs[dim] === v ? undefined : v;
      el.parentElement!.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el && ui.guestDraft.prefs[dim] === v)));
    } else {
      ui.customDraft.dims[dim] = v;
      el.parentElement!.querySelectorAll<HTMLButtonElement>('button').forEach((b) => b.setAttribute('aria-pressed', String(b === el)));
    }
    return;
  }

  if (d.rate && d.rate !== '' && ui.sheet?.kind === 'game') {
    const slug = ui.sheet.slug;
    const n = +d.rate;
    setMine(slug, { rating: data.mine[slug]?.rating === n ? 0 : n });
    toast(data.mine[slug]?.rating ? `Rated ${n} star${n > 1 ? 's' : ''}` : 'Rating cleared');
    return render();
  }
  if (d.flag && d.slug) {
    const f = d.flag as 'own' | 'teach' | 'learn' | 'veto';
    setMine(d.slug, { [f]: !data.mine[d.slug]?.[f] });
    return render();
  }
  if (d.delplay) {
    if (ui.confirm !== d.delplay) {
      ui.confirm = d.delplay;
      return renderSheet();
    }
    data.plays = data.plays.filter((p) => p.id !== d.delplay);
    save();
    toast('Play removed');
    return render();
  }
  if (d.delfriend) {
    if (ui.confirm !== `friend:${d.delfriend}`) {
      ui.confirm = `friend:${d.delfriend}`;
      return renderSheet();
    }
    delete data.friends[d.delfriend];
    delete ui.night.selected[`f:${d.delfriend}`];
    save();
    return render();
  }

  switch (d.act) {
    case 'close':
      return closeSheet();
    case 'add':
      return openSheet({ kind: 'add' });
    case 'add-guest':
      ui.guestDraft = { id: '', name: '', prefs: {} };
      return openSheet({ kind: 'guest', id: '' });
    case 'add-friend':
      return openSheet({ kind: 'friend' });
    case 'my-code':
      return openSheet({ kind: 'code' });
    case 'log-this':
      ui.draft = blankDraft(d.slug);
      closeSheet();
      return setTab('log');
    case 'del-guest': {
      const id = ui.guestDraft.id;
      if (ui.confirm !== `guest:${id}`) {
        ui.confirm = `guest:${id}`;
        return renderSheet();
      }
      delete data.guests[id];
      delete ui.night.selected[`g:${id}`];
      save();
      closeSheet();
      return render();
    }
    case 'backup':
      return download(`ludarium-card-catalogue-${E.isoToday()}.json`, JSON.stringify({ app: 'ludarium-card-catalogue', version: 1, ...data }, null, 2), 'application/json');
    case 'csv':
      return download(`ludarium-plays-${E.isoToday()}.csv`, E.playsCSV(games(), data, withLabel), 'text/csv');
    case 'wipe':
      if (ui.confirm !== 'wipe') {
        ui.confirm = 'wipe';
        return render();
      }
      data = E.emptyState();
      save();
      ui.confirm = '';
      toast('Your data is erased from this device');
      return render();
  }
}

function handleInput(e: Event) {
  const t = e.target as HTMLInputElement;
  switch (t.id) {
    case 'cc-q':
      ui.q = t.value;
      $('#cc-results')!.innerHTML = catalogueResults();
      return;
    case 'lg-date':
      ui.draft.date = t.value;
      return;
    case 'lg-players':
      ui.draft.players = +t.value;
      return;
    case 'lg-minutes':
      ui.draft.minutes = t.value;
      return;
    case 'lg-with':
      ui.draft.withText = t.value;
      return;
    case 'lg-note':
      ui.draft.note = t.value;
      return;
    case 'gs-name':
      ui.guestDraft.name = t.value;
      return;
    case 'cg-name':
      ui.customDraft.name = t.value;
      return;
    case 'code-name':
      return updateCode();
  }
}

function handleChange(e: Event) {
  const t = e.target as HTMLInputElement;
  switch (t.id) {
    case 'cc-players':
      ui.players = t.value;
      return render();
    case 'cc-sort':
      ui.sort = t.value;
      return render();
    case 'nt-players':
      ui.night.players = t.value;
      return render('nt-players');
    case 'nt-minutes':
      ui.night.minutes = t.value;
      return render('nt-minutes');
    case 'nt-occ':
      ui.night.occasion = t.value;
      return render('nt-occ');
    case 'nt-own':
      ui.night.ownedOnly = t.checked;
      return render('nt-own');
    case 'lg-game':
      ui.draft.slug = t.value;
      return;
    case 'lg-taught':
      ui.draft.taught = t.checked;
      return;
    case 'cg-shelf':
      ui.customDraft.shelf = t.value;
      return;
    case 'cg-min':
      ui.customDraft.min = +t.value;
      return;
    case 'cg-max':
      ui.customDraft.max = +t.value;
      return;
    case 'cg-minutes':
      ui.customDraft.minutes = +t.value;
      return;
  }
  if (t.dataset.act === 'restore' && t.files?.[0]) {
    t.files[0]
      .text()
      .then((text) => {
        const d = JSON.parse(text);
        if (d.app !== 'ludarium-card-catalogue') throw new Error('not a backup');
        data = { ...E.emptyState(), mine: d.mine ?? {}, plays: d.plays ?? [], guests: d.guests ?? {}, friends: d.friends ?? {} };
        save();
        toast('Backup restored');
        render();
      })
      .catch(() => toast('That file is not a Card Catalogue backup.'));
  }
}

function handleSubmit(e: SubmitEvent) {
  const form = e.target as HTMLFormElement;
  e.preventDefault();

  if (form.id === 'cc-logform') {
    const d = ui.draft;
    if (!d.slug) return toast('Choose a game first.');
    const typed = d.withText
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .map((n) => `t:${n.slice(0, 40)}`);
    const play: E.Play = {
      id: uid(),
      slug: d.slug,
      date: d.date || E.isoToday(),
      players: Math.max(1, Math.min(30, +d.players || 1)),
      minutes: Math.max(0, Math.min(900, +d.minutes || 0)),
      taught: d.taught,
      result: d.result,
      with: [...Object.keys(d.with).filter((k) => d.with[k]), ...typed],
      again: d.again,
      energy: d.energy,
      note: d.note.slice(0, 500),
    };
    data.plays.push(play);
    if (d.rating) setMine(d.slug, { rating: d.rating });
    save();
    toast(`Logged ${game(d.slug)?.name ?? 'your play'}`);
    ui.draft = blankDraft();
    ui.draft.players = play.players;
    return render();
  }

  if (form.id === 'cc-guestform') {
    const g = ui.guestDraft;
    if (!g.name.trim()) return toast('Give your guest a name.');
    const id = g.id || uid();
    data.guests[id] = { id, name: g.name.trim().slice(0, 40), prefs: Object.fromEntries(Object.entries(g.prefs).filter(([, v]) => v)) };
    ui.night.selected[`g:${id}`] = true;
    save();
    closeSheet();
    toast(`${data.guests[id].name} is at the table`);
    return render();
  }

  if (form.id === 'cc-addform') {
    const c = ui.customDraft;
    const name = c.name.trim();
    if (!name) return toast('Give the game a title.');
    const slug = E.slugify(name);
    if (!slug) return toast('That title needs at least one letter or number.');
    if (games()[slug] && !data.mine[slug]?.custom) return toast('That game is already in the catalogue.');
    const min = Math.max(1, c.min || 1);
    const max = Math.max(min, c.max || min);
    const sub = Object.keys(E.SHELVES[c.shelf].subs)[0];
    const custom: E.Game = {
      name: name.slice(0, 80),
      shelf: c.shelf,
      sub,
      call: `${sub} ${E.cutter(name)}`,
      dims: { ...c.dims },
      players: [min, max],
      best: [],
      minutes: Math.max(1, c.minutes || 30),
      occasions: [],
    };
    setMine(slug, { custom });
    toast(`${custom.name} is filed under ${custom.call}`);
    openSheet({ kind: 'game', slug });
    return render();
  }

  if (form.id === 'cc-friendform') {
    const code = ($<HTMLTextAreaElement>('#fr-code', form)?.value ?? '').trim();
    const decoded = E.decodeTableCode(code);
    if (!decoded) return toast('That does not look like a table code. Ask your friend to copy it again.');
    const id = uid();
    const name = ($<HTMLInputElement>('#fr-name', form)?.value ?? '').trim() || decoded.name;
    data.friends[id] = { id, name: name.slice(0, 40), digest: decoded.digest };
    ui.night.selected[`f:${id}`] = true;
    save();
    closeSheet();
    toast(`${name} is at your table`);
    return render();
  }

  if (form.id === 'cc-codeform') {
    const out = $<HTMLTextAreaElement>('#code-out', form);
    if (!out) return;
    out.select();
    navigator.clipboard?.writeText(out.value).then(
      () => toast('Table code copied'),
      () => toast('Select the code and copy it'),
    );
  }
}

// ---------- start ----------

function start() {
  const root = $('#cc-app')!;
  root.classList.add('is-live');
  // The dialog sits inside the app root, so one set of listeners on the root
  // handles everything. The dialog only listens for clicks on its backdrop.
  root.addEventListener('click', handleClick);
  root.addEventListener('input', handleInput);
  root.addEventListener('change', handleChange);
  root.addEventListener('submit', handleSubmit as EventListener);
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeSheet();
  });
  // Escape closes the dialog without our close button. The event arrives a moment
  // later, so ignore it if another sheet has opened since.
  dialog.addEventListener('close', () => {
    if (ui.sheet && !dialog.open) {
      ui.sheet = null;
      render();
    }
  });

  // Tabs: click and arrow keys
  const tabs = Array.from(document.querySelectorAll<HTMLButtonElement>('[data-tab]'));
  tabs.forEach((b, i) => {
    b.addEventListener('click', () => setTab(b.dataset.tab as Tab));
    b.addEventListener('keydown', (e) => {
      const step = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
      if (!step) return;
      const next = tabs[(i + step + tabs.length) % tabs.length];
      next.focus();
      setTab(next.dataset.tab as Tab);
    });
  });

  const fromHash = (Object.entries(TAB_HASH).find(([, h]) => h === location.hash)?.[0] ?? 'catalogue') as Tab;
  setTab(fromHash, false);
}

start();
