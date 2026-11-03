/* The Ludarium's game interest counter, explained at /privacy/. No cookies or
   storage, and nothing sent with Global Privacy Control or Do Not Track on. */
(function (w, d, n) {
  // Google Analytics also gets affiliate, download and store clicks as events.
  // gtag only exists on the live site and follows the visitor's cookie choice
  // (src/components/ConsentBanner.astro), so this sits apart from the counter below.
  var ga = function (ev) {
    var a = typeof w.gtag == 'function' && ev.target.closest && ev.target.closest('a[href]');
    if (!a) return;
    var e = a.getAttribute('data-ott-event');
    if (e != 'affiliate_click' && e != 'download') e = a.hostname == 'theludarium.lemonsqueezy.com' ? 'store_click' : '';
    if (!e) return;
    var p = { link_url: a.href };
    if (a.getAttribute('data-ott-game')) p.game = a.getAttribute('data-ott-game');
    w.gtag('event', e, p);
  };
  d.addEventListener('click', ga, true);
  d.addEventListener('auxclick', function (ev) { if (ev.button == 1) ga(ev); }, true);

  if (n.globalPrivacyControl || n.doNotTrack == '1' || w.doNotTrack == '1' || !n.sendBeacon) return;
  var list = function (s) { return (s || '').split(',').map(function (x) { return x.trim(); }).filter(Boolean); };
  var meta = function (k) { var m = d.querySelector('meta[name="ott:' + k + '"]'); return list(m && m.content); };
  var utm = new URLSearchParams(location.search).get('utm_source');
  var send = function (e, g) {
    if (!g.length) return;
    var b = { e: e, g: g, p: location.pathname };
    if (utm) b.u = utm;
    n.sendBeacon('/api/ott/e', JSON.stringify(b));
  };
  var games = meta('games');
  var click = function (ev) {
    var el = ev.target.closest && ev.target.closest('[data-ott-event]');
    var e = el && el.getAttribute('data-ott-event');
    if (e == 'download' || e == 'affiliate_click') {
      var g = list(el.getAttribute('data-ott-game'));
      send(e, g.length ? g : games);
    }
  };
  d.addEventListener('click', click, true);
  d.addEventListener('auxclick', function (ev) { if (ev.button == 1) click(ev); }, true);
  send('signup', meta('signup'));
  if (!games.length) return;
  var done, seen = 0, since = 0, timer;
  var engaged = function () { if (!done) { done = 1; clearTimeout(timer); send('view', games); } };
  var vis = function () {
    clearTimeout(timer);
    if (d.visibilityState == 'visible') { since = Date.now(); timer = setTimeout(engaged, 15e3 - seen); }
    else if (since) { seen += Date.now() - since; since = 0; }
  };
  w.addEventListener('scroll', function () {
    var r = d.documentElement.scrollHeight - w.innerHeight;
    if (r > 0 && w.scrollY / r >= 0.5) engaged();
  }, { passive: true });
  d.addEventListener('visibilitychange', vis);
  vis();
})(window, document, navigator);
