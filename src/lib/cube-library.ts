// The Cube Library: shared, pure code for the public page, the submit form,
// the API, and the admin queue. Rendering lives here so the static build and
// the browser produce the same cards.

export const CUBES_BASE = '/cube-commonwealth/cubes/';
export const CUBES_API = '/api/cubes';
export const CUBES_ADMIN = '/cube-commonwealth/where-we-play/admin/cubes/';

export const STYLES = ['Vintage', 'Legacy', 'Modern', 'Pioneer', 'Peasant', 'Pauper', 'Commander', 'Set or block', 'Themed', 'Other'] as const;
export const LENDING = { yes: 'Can be borrowed', 'with-owner': 'Plays when the owner is there', no: 'Not for loan' } as const;
export const FORMATS = { paper: 'Paper', proxies: 'Paper with proxies', digital: 'Digital only' } as const;
export const LIMITS = { name: 100, listUrl: 300, owner: 60, location: 60, description: 400, note: 300, discord: 40, email: 200 };

export type PublicCube = {
  id?: number;
  name: string;
  listUrl: string;
  owner: string;
  location: string;
  description: string | null;
  note: string | null;
  style: string;
  cardCount: number | null;
  updatedAt: string | null;
  lending: string | null;
  format: string | null;
  discord: string | null;
};

export type CubeSubmission = {
  name: string;
  listUrl: string;
  cobraId: string | null;
  owner: string;
  location: string;
  description: string | null;
  note: string | null;
  style: string;
  lending: string | null;
  format: string | null;
  discord: string | null;
  email: string | null;
};

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const oneLine = (v: string) => v.replace(/\s+/g, ' ').trim();
const noDashes = (v: string) => v.replace(/\s*[—–]\s*/g, ', ');

/** The Cube Cobra id in a list link, or null for any other site. */
export function cobraId(url: string): string | null {
  try {
    const u = new URL(url);
    if (!/^(www\.)?cubecobra\.com$/i.test(u.hostname)) return null;
    const m = u.pathname.match(/^\/(?:cube\/(?:overview|list|playtest|analysis|about)|c)\/([A-Za-z0-9_-]{1,80})\/?$/);
    return m ? m[1] : null;
  } catch {
    return null;
  }
}

/** A clean https link, with Cube Cobra links in one standard form. Null when unusable. */
export function cleanListUrl(raw: string): string | null {
  const value = raw.trim();
  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
  } catch {
    return null;
  }
  if (url.protocol !== 'https:' && url.protocol !== 'http:') return null;
  if (!url.hostname.includes('.') || url.username || url.password) return null;
  url.protocol = 'https:';
  const id = cobraId(url.toString());
  if (/cubecobra\.com$/i.test(url.hostname) && !id) return null;
  return id ? `https://cubecobra.com/cube/overview/${id}` : url.toString();
}

/** Tidies a typed city: "kansas  city" becomes "Kansas City"; mixed case is left alone. */
export function cleanLocation(raw: string): string {
  const value = oneLine(raw);
  if (value !== value.toLowerCase() && value !== value.toUpperCase()) return value;
  return value.toLowerCase().replace(/(^|[\s-])(\p{L})/gu, (_, a, b) => a + b.toUpperCase());
}

/** Turns a Cube Cobra primer into a short plain-text description. */
export function primerExcerpt(primer: string | null | undefined, max = 240): string | null {
  if (!primer) return null;
  const text = primer
    .replace(/\[\[([^\]|]+)(?:\|[^\]]*)?\]\]/g, '$1')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/\{[^}]{1,6}\}/g, '')
    .replace(/<[^>]*>/g, '')
    .replace(/^\s*(#+|>+|[-*_]{3,})\s*/gm, '')
    .replace(/[*_`]|>>>|<<</g, '');
  const para = text.split(/\n\s*\n/).map(oneLine).find((p) => p.length >= 25 && !/^this is a brand new cube/i.test(p));
  if (!para) return null;
  const clean = noDashes(para);
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const stop = cut.lastIndexOf('. ');
  return stop > 60 ? cut.slice(0, stop + 1) : `${cut.slice(0, cut.lastIndexOf(' '))}...`;
}

/** Best guess at a style from Cube Cobra's category fields. */
export function guessStyle(category?: string | null, prefixes: string[] = []): string {
  const all = [...prefixes, category ?? ''].join(' ').toLowerCase();
  if (all.includes('commander')) return 'Commander';
  if (all.includes('pauper')) return 'Pauper';
  if (all.includes('peasant')) return 'Peasant';
  if (all.includes('vintage')) return 'Vintage';
  if (all.includes('legacy')) return 'Legacy';
  if (all.includes('modern')) return 'Modern';
  if (all.includes('pioneer')) return 'Pioneer';
  if (/\b(set|block)\b/.test(all)) return 'Set or block';
  return 'Other';
}

/** Returns the cleaned submission, or the code of the first problem. */
export function parseSubmission(form: FormData): CubeSubmission | { error: string } {
  const get = (key: string) => String(form.get(key) ?? '').trim();
  const rawUrl = get('list_url');
  const name = oneLine(get('name'));
  const owner = oneLine(get('owner'));
  const location = cleanLocation(get('location'));
  const description = noDashes(get('description'));
  const note = noDashes(get('note'));
  const discord = oneLine(get('discord')).replace(/^@/, '');
  const email = oneLine(get('email'));
  const style = get('style');
  const lending = get('lending');
  const format = get('format');

  if (!rawUrl || !owner || !location) return { error: 'missing' };
  if (rawUrl.length > LIMITS.listUrl) return { error: 'long' };
  const listUrl = cleanListUrl(rawUrl);
  if (!listUrl) return { error: 'link' };
  const id = cobraId(listUrl);
  if (!id && !name) return { error: 'name' };
  if (email && !EMAIL_PATTERN.test(email)) return { error: 'email' };
  if (
    name.length > LIMITS.name ||
    owner.length > LIMITS.owner ||
    location.length > LIMITS.location ||
    description.length > LIMITS.description ||
    note.length > LIMITS.note ||
    discord.length > LIMITS.discord ||
    email.length > LIMITS.email
  ) {
    return { error: 'long' };
  }
  return {
    name,
    listUrl,
    cobraId: id,
    owner,
    location,
    description: description || null,
    note: note || null,
    style: (STYLES as readonly string[]).includes(style) ? style : '',
    lending: lending in LENDING ? lending : null,
    format: format in FORMATS ? format : null,
    discord: discord || null,
    email: email || null,
  };
}

export const escapeHtml = (v: string) =>
  v.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const safeHref = (url: string) => (/^https:\/\//i.test(url) ? escapeHtml(url) : '#');

/** Where the list lives, for the link label. */
export function listLabel(url: string): string {
  if (/cubecobra\.com/i.test(url)) return 'See the list on Cube Cobra';
  if (/moxfield\.com/i.test(url)) return 'See the list on Moxfield';
  return 'See the list';
}

export function formatMonth(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(`${iso.slice(0, 10)}T12:00:00Z`);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/** All locations, biggest first, ties by name. */
export function locationsOf(cubes: Pick<PublicCube, 'location'>[]): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const c of cubes) counts.set(c.location, (counts.get(c.location) ?? 0) + 1);
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function matches(c: PublicCube, location: string, style: string, query: string): boolean {
  if (location && c.location !== location) return false;
  if (style && c.style !== style) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [c.name, c.owner, c.description, c.note, c.style, c.location].some((v) => v?.toLowerCase().includes(q));
}

export function cubeCard(c: PublicCube): string {
  const facts = [c.style, c.cardCount ? `${c.cardCount} cards` : null, c.format ? FORMATS[c.format as keyof typeof FORMATS] : null]
    .filter(Boolean)
    .map((f) => `<li>${escapeHtml(String(f))}</li>`)
    .join('');
  const text = c.description ?? c.note;
  const extra = c.description && c.note ? `<p class="cube__note">Owner's note: ${escapeHtml(c.note)}</p>` : '';
  const lending = c.lending ? LENDING[c.lending as keyof typeof LENDING] : null;
  const updated = formatMonth(c.updatedAt);
  return `<li class="card cube">
  <p class="cube__place">${escapeHtml(c.location)}</p>
  <h3 class="cube__name">${escapeHtml(c.name)}</h3>
  <p class="cube__owner">Owned by ${escapeHtml(c.owner)}${c.discord ? ` <span>(@${escapeHtml(c.discord)} on Discord)</span>` : ''}</p>
  <ul class="cube__facts">${facts}</ul>
  ${text ? `<p class="cube__text">${escapeHtml(text)}</p>` : ''}
  ${extra}
  ${lending ? `<p class="cube__lend">${escapeHtml(lending)}</p>` : ''}
  <p class="cube__foot"><a class="text-link" href="${safeHref(c.listUrl)}" target="_blank" rel="noopener">${listLabel(c.listUrl)}<span class="visually-hidden">: ${escapeHtml(c.name)}</span></a>${updated ? `<span class="cube__date">Updated ${updated}</span>` : ''}</p>
</li>`;
}
