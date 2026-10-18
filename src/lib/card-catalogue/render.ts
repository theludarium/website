// HTML for catalogue index cards, shared by the static page (so the catalogue is
// readable without JavaScript and by search engines) and the interactive app.
import { DIMS, SHELVES, playersText, type Game, type Mine } from './engine';

export const esc = (s: unknown) =>
  String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** Six rows of punched holes: one row per feel dimension, left lightest, right strongest. */
export function holesHTML(g: Game): string {
  return `<div class="cc-holes">${DIMS.map((d) => {
    const lv = g.dims?.[d.k] ?? 0;
    const label = `${d.name}: ${d.lv[lv - 1] ?? 'unrated'}`;
    return `<div class="cc-hrow" title="${esc(label)}"><span>${esc(d.abbr)}</span><span class="cc-hset" role="img" aria-label="${esc(label)}">${[1, 2, 3]
      .map((i) => `<i class="cc-hole${d.k === 'talk' ? ' is-talk' : ''}${i === lv ? ' is-on' : ''}"></i>`)
      .join('')}</span></div>`;
  }).join('')}</div>`;
}

export function badgesHTML(m: Mine | undefined, plays: number): string {
  const b: string[] = [];
  if (m?.rating) b.push(`<span class="cc-badge is-star" aria-label="${m.rating} stars">${'&#9733;'.repeat(m.rating)}</span>`);
  if (plays) b.push(`<span class="cc-badge">${plays} play${plays > 1 ? 's' : ''}</span>`);
  if (m?.own) b.push('<span class="cc-badge">Owned</span>');
  if (m?.teach) b.push('<span class="cc-badge">Can teach</span>');
  if (m?.learn) b.push('<span class="cc-badge">Want to learn</span>');
  if (m?.veto) b.push('<span class="cc-badge is-veto">Not for me</span>');
  return b.length ? `<div class="cc-badges">${b.join('')}</div>` : '';
}

export function cardHTML(slug: string, g: Game, opts: { fit?: number | null; mine?: Mine; plays?: number } = {}): string {
  const { range, best } = playersText(g);
  const fit = opts.fit != null ? `<span class="cc-fit" title="How well this matches your feel profile">${Math.round(opts.fit * 100)}% your fit</span>` : '';
  return `<button type="button" class="cc-card" data-open="${esc(slug)}" aria-label="${esc(g.name)}, ${esc(SHELVES[g.shelf]?.n ?? '')}">
    <span class="cc-card__top"><span class="cc-card__name">${esc(g.name)}</span><span class="cc-call">${esc(g.call)}</span></span>
    <span class="cc-card__meta"><span><b>${esc(range)}</b> players${best ? ` &middot; best <b>${esc(best)}</b>` : ''}</span><span><b>${esc(g.minutes || '?')}</b> min</span>${fit}</span>
    ${holesHTML(g)}
    ${badgesHTML(opts.mine, opts.plays ?? 0)}
  </button>`;
}
