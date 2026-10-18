// Example: turn a subscriber's BGG collection and plays into Ludarium Card Catalog records.
// Runs in the browser on theludarium.com, calling the Worker (never BGG directly).
//
//   const result = await importFromBgg('their-bgg-name', catalog);
//   // result.mine  -> per-game records: { slug, own, rating, learn, bggRating }
//   // result.plays -> play records in the catalog's play shape
//   // result.unmatched -> BGG games not in the catalog yet (offer "File a card")
//
// `catalog` is the Ludarium catalog: { [slug]: { name, year?, bggId?, ... } }.

const API = '/api'; // same-origin when the Worker is routed at theludarium.com/api/*

async function getJson(path, { retries = 4 } = {}) {
  for (let i = 0; ; i++) {
    const res = await fetch(API + path);
    if (res.status === 202 && i < retries) {
      // BGG is still preparing a large collection. Wait as asked, then try again.
      const wait = Number(res.headers.get('Retry-After') || 15);
      await new Promise(r => setTimeout(r, wait * 1000));
      continue;
    }
    const body = await res.json();
    if (!res.ok) throw new Error(body.error || `Request failed (${res.status})`);
    return body;
  }
}

/** BGG rating 1-10 to the Ludarium star scale used by the profile (1-5). */
function bggRatingToStars(r) {
  if (r == null) return 0;
  if (r >= 9) return 5;
  if (r >= 8) return 4;
  if (r >= 6) return 3;
  if (r >= 4) return 2;
  return 1;
}

const norm = s => String(s || '').toLowerCase().replace(/^(the|a|an)\s+/, '').replace(/[^a-z0-9]+/g, ' ').trim();

export async function importFromBgg(username, catalog, { maxPlayPages = 5, onProgress = () => {} } = {}) {
  onProgress('Fetching your collection from BoardGameGeek…');
  const coll = await getJson(`/bgg/collection?username=${encodeURIComponent(username)}`);

  // Match by BGG id first, then by name + year, then by name alone.
  const byId = new Map(), byNameYear = new Map(), byName = new Map();
  for (const [slug, g] of Object.entries(catalog)) {
    if (g.bggId) byId.set(Number(g.bggId), slug);
    byNameYear.set(`${norm(g.name)}|${g.year || ''}`, slug);
    if (!byName.has(norm(g.name))) byName.set(norm(g.name), slug);
  }
  const match = (bggId, name, year) => byId.get(bggId) || byNameYear.get(`${norm(name)}|${year || ''}`) || byName.get(norm(name)) || null;

  const mine = {}, unmatched = [];
  for (const it of coll.data) {
    const slug = match(it.bggId, it.name, it.year);
    if (!slug) { if (it.status.own || it.rating != null || it.numPlays) unmatched.push(it); continue; }
    mine[slug] = {
      type: 'game', slug,
      own: it.status.own || undefined,
      learn: it.status.wantToPlay || undefined,
      rating: bggRatingToStars(it.rating) || undefined,
      bggRating: it.rating, // kept as BGG's own value, unchanged
      bggId: it.bggId,
      importedFrom: 'bgg',
    };
  }

  const plays = [];
  for (let page = 1; page <= maxPlayPages; page++) {
    onProgress(`Fetching your plays (page ${page})…`);
    const res = await getJson(`/bgg/plays?username=${encodeURIComponent(username)}&page=${page}`);
    for (const p of res.data.plays) {
      const slug = match(p.bggId, p.gameName, null);
      if (!slug || !p.date) continue;
      const me = p.players.find(x => x.username && x.username.toLowerCase() === username.toLowerCase());
      const others = p.players.filter(x => x !== me).map(x => 't:' + (x.name || x.username || 'Player'));
      for (let q = 0; q < Math.max(1, p.quantity); q++) {
        plays.push({
          type: 'play', slug, date: p.date,
          players: p.players.length || null,
          minutes: p.length ? Math.round(p.length / Math.max(1, p.quantity)) : 0,
          result: me ? (me.win ? 'won' : 'lost') : '',
          with: others,
          note: '',
          bggPlayId: p.playId, // lets a re-import skip plays it already has
          importedFrom: 'bgg',
        });
      }
    }
    if (!res.data.hasMore) break;
  }

  onProgress('Done');
  return { mine, plays, unmatched, attribution: coll.attribution };
}
