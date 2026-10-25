// Tests for /ott.js, the game interest beacon. Runs the real file in a sandbox
// with a fake page, a fake clock and a fake sendBeacon. Run: npm test
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';
import vm from 'node:vm';

const FILE = new URL('../../public/ott.js', import.meta.url);
const SRC = readFileSync(FILE, 'utf8');
const CODE = SRC.slice(SRC.indexOf('*/') + 2); // without the header comment

/** A fake page that runs ott.js. Options set the meta tags, privacy signals and layout. */
function page(opts = {}) {
  const { games, signup, gpc, dnt, winDnt, search = '', path = '/articles/azul-strategy/', visibility = 'visible', beacon = true } = opts;
  const sent = [];
  const on = { doc: {}, win: {} };
  const timers = [];
  let now = 1_000_000;
  const meta = { games, signup };
  const document = {
    visibilityState: visibility,
    documentElement: { scrollHeight: opts.scrollHeight ?? 4000 },
    querySelector(sel) {
      const key = /meta\[name="ott:(\w+)"\]/.exec(sel)?.[1];
      return key && meta[key] != null ? { content: meta[key] } : null;
    },
    addEventListener: (type, fn) => (on.doc[type] ||= []).push(fn),
  };
  const window = { doNotTrack: winDnt, innerHeight: opts.innerHeight ?? 800, scrollY: 0, addEventListener: (type, fn) => (on.win[type] ||= []).push(fn) };
  const navigator = {
    globalPrivacyControl: gpc,
    doNotTrack: dnt,
    sendBeacon: beacon ? (url, body) => (sent.push({ url, ...JSON.parse(body) }), true) : undefined,
  };
  const context = {
    window,
    document,
    navigator,
    location: { pathname: path, search },
    URLSearchParams,
    Date: { now: () => now },
    setTimeout: (fn, ms) => timers.push({ fn, at: now + ms }),
    clearTimeout: (id) => id && (timers[id - 1].off = true),
  };
  vm.runInNewContext(SRC, context);
  const fire = (list, ev) => (list || []).forEach((fn) => fn(ev));
  return {
    sent,
    listeners: () => Object.values(on.doc).flat().length + Object.values(on.win).flat().length,
    advance(ms) {
      const end = now + ms;
      for (;;) {
        const due = timers.filter((t) => !t.off && !t.ran && t.at <= end).sort((a, b) => a.at - b.at)[0];
        if (!due) break;
        now = due.at;
        due.ran = true;
        due.fn();
      }
      now = end;
    },
    scrollTo(y) {
      window.scrollY = y;
      fire(on.win.scroll);
    },
    hide() {
      document.visibilityState = 'hidden';
      fire(on.doc.visibilitychange);
    },
    show() {
      document.visibilityState = 'visible';
      fire(on.doc.visibilitychange);
    },
    click(target, type = 'click', button = 0) {
      fire(on.doc[type], { target, button });
    },
  };
}

/** A fake element; `closest` walks up to the parent like the DOM does. */
function el(attrs = {}, parent = null) {
  return {
    getAttribute: (k) => attrs[k] ?? null,
    closest(sel) {
      return sel === '[data-ott-event]' && 'data-ott-event' in attrs ? this : parent?.closest(sel) ?? null;
    },
  };
}

const VIEW = { url: '/api/ott/e', e: 'view', g: ['azul'], p: '/articles/azul-strategy/' };

test('stays under 2 KB and never touches cookies or storage', () => {
  assert.ok(statSync(FILE).size < 2048, `ott.js is ${statSync(FILE).size} bytes`);
  for (const word of ['cookie', 'Storage', 'indexedDB', 'caches']) assert.ok(!CODE.includes(word), word);
});

test('sends one engaged view after 15 seconds visible', () => {
  const p = page({ games: 'azul' });
  p.advance(14_999);
  assert.deepEqual(p.sent, []);
  p.advance(1);
  assert.deepEqual(p.sent, [VIEW]);
  p.advance(60_000);
  p.scrollTo(3200);
  assert.equal(p.sent.length, 1, 'once per page view');
});

test('sends the engaged view at half the page scrolled, whichever comes first', () => {
  const p = page({ games: 'azul', scrollHeight: 4000, innerHeight: 800 });
  p.scrollTo(1000);
  assert.deepEqual(p.sent, []);
  p.scrollTo(1600); // half of the 3200 px that can scroll
  assert.deepEqual(p.sent, [VIEW]);
  p.advance(20_000);
  assert.equal(p.sent.length, 1);
});

test('counts only visible time toward the 15 seconds', () => {
  const p = page({ games: 'azul' });
  p.advance(10_000);
  p.hide();
  p.advance(120_000);
  assert.deepEqual(p.sent, []);
  p.show();
  p.advance(4_999);
  assert.deepEqual(p.sent, []);
  p.advance(1);
  assert.deepEqual(p.sent, [VIEW]);
});

test('waits for a tab opened in the background to be seen', () => {
  const p = page({ games: 'azul', visibility: 'hidden' });
  p.advance(60_000);
  assert.deepEqual(p.sent, []);
  p.show();
  p.advance(15_000);
  assert.deepEqual(p.sent, [VIEW]);
});

test('lists every game on the page and passes utm_source along', () => {
  const p = page({ games: 'wingspan, everdell,cascadia', search: '?utm_source=ludarium-letters&utm_medium=email', path: '/articles/wingspan-vs-everdell-vs-cascadia/' });
  p.advance(15_000);
  assert.deepEqual(p.sent, [{ url: '/api/ott/e', e: 'view', g: ['wingspan', 'everdell', 'cascadia'], p: '/articles/wingspan-vs-everdell-vs-cascadia/', u: 'ludarium-letters' }]);
});

test('sends no view on a page without games', () => {
  const p = page({});
  p.advance(60_000);
  p.scrollTo(4000);
  assert.deepEqual(p.sent, []);
});

for (const [name, opts] of [
  ['Global Privacy Control', { gpc: true }],
  ['Do Not Track', { dnt: '1' }],
  ['Do Not Track (older browsers)', { winDnt: '1' }],
]) {
  test(`sends nothing at all with ${name} on`, () => {
    const p = page({ games: 'azul', signup: 'catan', ...opts });
    p.advance(60_000);
    p.scrollTo(4000);
    p.click(el({ 'data-ott-event': 'affiliate_click', 'data-ott-game': 'wingspan' }));
    p.click(el({ 'data-ott-event': 'download', 'data-ott-game': 'catan' }));
    assert.deepEqual(p.sent, []);
    assert.equal(p.listeners(), 0, 'adds no listeners either');
  });
}

test('sends download and affiliate clicks for the game they name', () => {
  const p = page({ games: 'azul' });
  p.click(el({ 'data-ott-event': 'download', 'data-ott-game': 'catan' }));
  p.click(el({}, el({ 'data-ott-event': 'affiliate_click', 'data-ott-game': 'wingspan' }))); // a click on the link's child
  assert.deepEqual(p.sent, [
    { url: '/api/ott/e', e: 'download', g: ['catan'], p: '/articles/azul-strategy/' },
    { url: '/api/ott/e', e: 'affiliate_click', g: ['wingspan'], p: '/articles/azul-strategy/' },
  ]);
});

test("falls back to the page's games when a click names none", () => {
  const p = page({ games: 'azul,sagrada' });
  p.click(el({ 'data-ott-event': 'affiliate_click' }));
  assert.deepEqual(p.sent, [{ url: '/api/ott/e', e: 'affiliate_click', g: ['azul', 'sagrada'], p: '/articles/azul-strategy/' }]);
});

test('ignores unmarked clicks, unknown events, signups on click, and right clicks', () => {
  const p = page({ games: 'azul' });
  p.click(el({}));
  p.click(el({ 'data-ott-event': 'share', 'data-ott-game': 'azul' }));
  p.click(el({ 'data-ott-event': 'signup', 'data-ott-game': 'catan' }));
  p.click(el({ 'data-ott-event': 'affiliate_click' }), 'auxclick', 2);
  assert.deepEqual(p.sent, []);
  p.click(el({ 'data-ott-event': 'affiliate_click' }), 'auxclick', 1);
  assert.deepEqual(p.sent, [{ url: '/api/ott/e', e: 'affiliate_click', g: ['azul'], p: '/articles/azul-strategy/' }]);
});

test("sends one signup on a Kit form's thanks page", () => {
  const p = page({ signup: 'catan', path: '/academy/thanks/' });
  p.advance(60_000);
  assert.deepEqual(p.sent, [{ url: '/api/ott/e', e: 'signup', g: ['catan'], p: '/academy/thanks/' }]);
});

test('does nothing in a browser without sendBeacon', () => {
  const p = page({ games: 'azul', beacon: false });
  p.advance(60_000);
  assert.equal(p.listeners(), 0);
});
