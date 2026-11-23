// The public Cube Library: location tabs, search, and style filter, plus a refresh from the API.
import { DEFAULT_SORT, cubeCard, cubeTable, firstSortDir, locationsOf, matches, sortCubes, type PublicCube, type SortKey } from '@/lib/cube-library';
import seed from '@/data/cube-library.json';
import images from '@/data/cube-images.json';

const root = document.querySelector<HTMLElement>('[data-cube-library]');
if (root) {
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const tabs = root.querySelector<HTMLElement>('[data-tabs]')!;
  const search = root.querySelector<HTMLInputElement>('[data-search]')!;
  const style = root.querySelector<HTMLSelectElement>('[data-style]')!;
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;
  const table = root.querySelector<HTMLElement>('[data-table]')!;
  const views = root.querySelector<HTMLElement>('[data-views]')!;

  let cubes = seed as PublicCube[];
  const params = new URLSearchParams(window.location.search);
  let location = params.get('location') ?? '';
  let view: 'cards' | 'table' = params.get('view') === 'table' ? 'table' : 'cards';
  let sortKey: SortKey = DEFAULT_SORT.key;
  let sortDir: 1 | -1 = DEFAULT_SORT.dir;

  const syncUrl = () => {
    const url = new URL(window.location.href);
    if (location) url.searchParams.set('location', location);
    else url.searchParams.delete('location');
    if (view === 'table') url.searchParams.set('view', 'table');
    else url.searchParams.delete('view');
    history.replaceState(null, '', url);
  };

  const drawTabs = () => {
    const places = locationsOf(cubes);
    if (location && !places.some((p) => p.name === location)) location = '';
    tabs.replaceChildren(
      ...[{ name: '', count: cubes.length }, ...places].map((p) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.dataset.location = p.name;
        b.setAttribute('aria-pressed', String(p.name === location));
        b.append(`${p.name || 'All'} `);
        const n = document.createElement('span');
        n.textContent = String(p.count);
        b.append(n);
        return b;
      }),
    );
  };

  const drawList = () => {
    const shown = sortCubes(cubes.filter((c) => matches(c, location, style.value, search.value)), sortKey, sortDir);
    const asTable = view === 'table';
    grid.hidden = asTable || shown.length === 0;
    table.hidden = !asTable || shown.length === 0;
    if (asTable) table.innerHTML = cubeTable(shown, sortKey, sortDir);
    else grid.innerHTML = shown.map((c) => cubeCard(c, images)).join('');
    views.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.view === view)));
    count.textContent = `${shown.length} ${shown.length === 1 ? 'Cube' : 'Cubes'}${location ? ` in ${location}` : ''}`;
    empty.hidden = shown.length > 0;
  };

  tabs.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b) return;
    location = b.dataset.location ?? '';
    syncUrl();
    drawTabs();
    drawList();
  });
  // A missing image falls back to the plain tile. Error events do not bubble, so listen in capture.
  grid.addEventListener(
    'error',
    (e) => {
      const figure = (e.target as HTMLElement).closest('.cube__figure');
      if (!figure) return;
      const blank = document.createElement('div');
      blank.className = 'cube__art cube__art--blank';
      blank.setAttribute('aria-hidden', 'true');
      figure.replaceWith(blank);
    },
    true,
  );
  search.addEventListener('input', drawList);
  style.addEventListener('change', drawList);
  views.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-view]');
    if (!b) return;
    view = b.dataset.view === 'table' ? 'table' : 'cards';
    syncUrl();
    drawList();
  });
  table.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('[data-sort]');
    if (!b) return;
    const key = b.dataset.sort as SortKey;
    sortDir = key === sortKey ? (sortDir === 1 ? -1 : 1) : firstSortDir(key);
    sortKey = key;
    drawList();
    table.querySelector<HTMLButtonElement>(`[data-sort="${key}"]`)?.focus();
  });
  views.hidden = false;

  drawTabs();
  drawList();

  // The list above is from the last build. The API has anything approved since.
  fetch(root.dataset.api!)
    .then((r) => (r.ok ? r.json() : null))
    .then((data: { cubes?: PublicCube[] } | null) => {
      if (!data?.cubes?.length) return;
      cubes = data.cubes;
      drawTabs();
      drawList();
    })
    .catch(() => {});
}
