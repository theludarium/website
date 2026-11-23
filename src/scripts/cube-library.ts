// The public Cube Library: location tabs, search, and style filter, plus a refresh from the API.
import { cubeCard, locationsOf, matches, type PublicCube } from '@/lib/cube-library';
import seed from '@/data/cube-library.json';

const root = document.querySelector<HTMLElement>('[data-cube-library]');
if (root) {
  const grid = root.querySelector<HTMLElement>('[data-grid]')!;
  const tabs = root.querySelector<HTMLElement>('[data-tabs]')!;
  const search = root.querySelector<HTMLInputElement>('[data-search]')!;
  const style = root.querySelector<HTMLSelectElement>('[data-style]')!;
  const count = root.querySelector<HTMLElement>('[data-count]')!;
  const empty = root.querySelector<HTMLElement>('[data-empty]')!;

  let cubes = seed as PublicCube[];
  let location = new URLSearchParams(window.location.search).get('location') ?? '';

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
    const shown = cubes.filter((c) => matches(c, location, style.value, search.value));
    grid.innerHTML = shown.map(cubeCard).join('');
    count.textContent = `${shown.length} ${shown.length === 1 ? 'Cube' : 'Cubes'}${location ? ` in ${location}` : ''}`;
    empty.hidden = shown.length > 0;
  };

  tabs.addEventListener('click', (e) => {
    const b = (e.target as HTMLElement).closest<HTMLButtonElement>('button');
    if (!b) return;
    location = b.dataset.location ?? '';
    const url = new URL(window.location.href);
    if (location) url.searchParams.set('location', location);
    else url.searchParams.delete('location');
    history.replaceState(null, '', url);
    drawTabs();
    drawList();
  });
  search.addEventListener('input', drawList);
  style.addEventListener('change', drawList);

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
