// The Cube Library approval queue: approve, edit, or reject submitted Cubes.
import { CUBES_BASE, escapeHtml as e, type PublicCube } from '@/lib/cube-library';

type AdminCube = PublicCube & { id: number; email: string | null; status: string; createdAt: string };
const API = '/api/where-we-play/admin/cubes';
const TOKEN_KEY = 'wwp-admin-token';

const root = document.querySelector<HTMLElement>('[data-cube-admin]');
if (root) {
  const STYLES = JSON.parse(root.dataset.styles!) as string[];
  const LENDING = JSON.parse(root.dataset.lending!) as Record<string, string>;
  const FORMATS = JSON.parse(root.dataset.formats!) as Record<string, string>;
  const list = root.querySelector<HTMLElement>('[data-list]')!;
  const tabs = root.querySelector<HTMLElement>('[data-tabs]')!;
  const msg = root.querySelector<HTMLElement>('[data-msg]')!;
  const auth = root.querySelector<HTMLFormElement>('[data-auth]')!;
  let token = sessionStorage.getItem(TOKEN_KEY) ?? '';
  let cubes: AdminCube[] = [];
  let view = 'pending';

  const say = (text: string) => {
    msg.textContent = text;
    msg.hidden = !text;
  };
  const call = (path: string, init: RequestInit = {}) => {
    const headers = new Headers(init.headers);
    if (token) headers.set('X-Admin-Token', token);
    if (init.body) headers.set('Content-Type', 'application/json');
    return fetch(`${API}${path}`, { ...init, headers });
  };
  const options = (pairs: [string, string][], chosen: string | null) =>
    pairs.map(([v, l]) => `<option value="${e(v)}"${v === (chosen ?? '') ? ' selected' : ''}>${e(l)}</option>`).join('');
  const input = (name: string, label: string, value: string | null) =>
    `<label>${label}<input name="${name}" value="${e(value ?? '')}" /></label>`;

  const item = (c: AdminCube) => `<form class="card q-item" data-id="${c.id}">
    <h2>${e(c.name)}</h2>
    <p class="q-item__meta">${c.cardCount ? `${c.cardCount} cards. ` : ''}Sent ${e(c.createdAt.slice(0, 10))}.${c.email ? ` Private email: ${e(c.email)}` : ''}
      <a href="${/^https:\/\//.test(c.listUrl) ? e(c.listUrl) : '#'}" target="_blank" rel="noopener">Open the list</a></p>
    <div class="q-item__grid">
      ${input('name', 'Name', c.name)}${input('listUrl', 'List link', c.listUrl)}${input('owner', 'Owner (public)', c.owner)}
      ${input('location', 'City', c.location)}${input('discord', 'Discord (public)', c.discord)}
      <label>Style<select name="style">${options(STYLES.map((s) => [s, s]), c.style)}</select></label>
      <label>Borrow<select name="lending">${options([['', 'Not given'], ...Object.entries(LENDING)], c.lending)}</select></label>
      <label>Format<select name="format">${options([['', 'Not given'], ...Object.entries(FORMATS)], c.format)}</select></label>
    </div>
    <label>Description<textarea name="description" rows="3">${e(c.description ?? '')}</textarea></label>
    <label>Owner's note<textarea name="note" rows="2">${e(c.note ?? '')}</textarea></label>
    <div class="q-item__actions">
      ${c.status !== 'approved' ? '<button class="button" value="approved">Approve</button>' : ''}
      <button class="button button--ghost" value="">Save edits</button>
      ${c.status !== 'rejected' ? `<button class="button button--ghost" value="rejected">${c.status === 'approved' ? 'Remove from library' : 'Reject'}</button>` : ''}
    </div>
  </form>`;

  const draw = () => {
    const names: [string, string][] = [['pending', 'Waiting'], ['approved', 'Approved'], ['rejected', 'Rejected']];
    tabs.innerHTML = names
      .map(([k, l]) => `<button type="button" data-view="${k}" aria-pressed="${k === view}">${l} ${cubes.filter((c) => c.status === k).length}</button>`)
      .join('');
    const shown = cubes.filter((c) => c.status === view);
    list.innerHTML = shown.length ? shown.map(item).join('') : '<p>Nothing here.</p>';
  };

  const load = async () => {
    const res = await call('');
    if (res.status === 401 || res.status === 403) {
      auth.hidden = false;
      return;
    }
    if (!res.ok) return say('Could not load the queue.');
    auth.hidden = true;
    cubes = ((await res.json()) as { cubes: AdminCube[] }).cubes;
    draw();
  };

  auth.addEventListener('submit', (ev) => {
    ev.preventDefault();
    token = String(new FormData(auth).get('token') ?? '');
    sessionStorage.setItem(TOKEN_KEY, token);
    load();
  });
  tabs.addEventListener('click', (ev) => {
    const b = (ev.target as HTMLElement).closest<HTMLButtonElement>('[data-view]');
    if (!b) return;
    view = b.dataset.view!;
    say('');
    draw();
  });
  list.addEventListener('submit', async (ev) => {
    ev.preventDefault();
    const form = ev.target as HTMLFormElement;
    const status = (ev as SubmitEvent).submitter instanceof HTMLButtonElement ? ((ev as SubmitEvent).submitter as HTMLButtonElement).value : '';
    const body: Record<string, string> = Object.fromEntries(new FormData(form)) as Record<string, string>;
    if (status) body.status = status;
    const res = await call(`/${form.dataset.id}`, { method: 'PATCH', body: JSON.stringify(body) });
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (!res.ok) return say(data.error ?? 'That did not save.');
    say(status === 'approved' ? `Approved. It is live in the library at ${CUBES_BASE}` : status === 'rejected' ? 'Removed from the list.' : 'Saved.');
    await load();
  });
  load();
}
