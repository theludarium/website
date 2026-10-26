// The Where We Play admin page. Reads everything from /api/where-we-play/admin
// and builds the sections in place. See src/pages/cube-commonwealth/where-we-play/admin.astro.
import { SLOTS, VENUE_STATUSES } from '@/lib/where-we-play/shared';

declare global {
  interface Window {
    L?: any;
  }
}

interface Summary {
  members: { total: number; located: number; withAddress: number };
  driveTimes: { total: number; estimated: number };
  center: { lat: number; lng: number } | null;
  memberPoints: { id: number; lat: number; lng: number; publicLat: number | null; publicLng: number | null; source: string }[];
  venuePoints: { id: number; name: string; lat: number; lng: number; status: string; approved: boolean }[];
}

interface RankedVenue {
  id: number;
  name: string;
  status: string;
  approved: boolean;
  neighborhood: string | null;
  located: boolean;
  medianMinutes: number | null;
  p75Minutes: number | null;
  underNear: number;
  underNearPct: number;
  routed: number;
  estimated: number;
}

interface Venue {
  id: number;
  name: string;
  address: string;
  lat: number | null;
  lng: number | null;
  neighborhood: string | null;
  table_count: number | null;
  hours: string | null;
  website: string | null;
  call_ahead: number;
  notes: string | null;
  status: string;
  address_public: number;
  suggestion_note: string | null;
  approved: number;
  created_at: string;
}

interface Member {
  id: number;
  email: string;
  discord_handle: string | null;
  first_name: string | null;
  zip: string;
  street_address: string | null;
  cross_street: string | null;
  lat: number | null;
  geocode_source: string;
  availability: string[];
  created_at: string;
}

interface Event {
  id: number;
  venue_id: number | null;
  date: string;
  headcount: number;
  notes: string | null;
}

interface Detail {
  venue: Venue;
  slot: string | null;
  stats: { routed: number; medianMinutes: number | null; p75Minutes: number | null; underNear: number; underNearPct: number; estimated: number };
  histogram: { from: number; to: number | null; label: string; count: number }[];
  members: { id: number; label: string; zip: string | null; minutes: number | null; source: string; availability: string[] }[];
}

const root = document.querySelector<HTMLElement>('[data-wwp-admin]');

if (root) {
  const API = root.dataset.api!;
  const TOKEN_KEY = 'wwp-admin-token';
  const slotLabel = (key: string) => SLOTS.find((s) => s.key === key)?.label ?? key;
  const $ = <T extends HTMLElement = HTMLElement>(selector: string) => root.querySelector<T>(selector)!;

  const msg = $('[data-msg]');
  const say = (text: string, error = false) => {
    msg.textContent = text;
    msg.hidden = !text;
    msg.classList.toggle('is-error', error);
  };

  const el = <K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Record<string, string | boolean | number> = {}, ...children: (Node | string | null | undefined)[]) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === 'class') node.className = String(value);
      else if (key === 'text') node.textContent = String(value);
      else if (typeof value === 'boolean') {
        if (value) node.setAttribute(key, '');
      } else node.setAttribute(key, String(value));
    }
    node.append(...children.filter((c): c is Node | string => c !== null && c !== undefined));
    return node;
  };

  const btn = (label: string, className: string, onClick: () => void) => {
    const b = el('button', { type: 'button', class: `wwp-btn ${className}`.trim(), text: label });
    b.addEventListener('click', onClick);
    return b;
  };

  const fmtMin = (m: number | null) => (m === null ? '–' : `${m} min`);
  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });

  // Requests. A 401 on a preview or local host asks for the preview token.
  let token = sessionStorage.getItem(TOKEN_KEY) ?? '';
  const auth = $('[data-auth]');
  const authForm = $<HTMLFormElement>('[data-auth-form]');
  authForm.addEventListener('submit', (event) => {
    event.preventDefault();
    token = String(new FormData(authForm).get('token') ?? '').trim();
    sessionStorage.setItem(TOKEN_KEY, token);
    auth.hidden = true;
    say('');
    loadAll();
  });

  async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
    const headers = new Headers(init.headers);
    if (token) headers.set('X-Admin-Token', token);
    if (init.body) headers.set('Content-Type', 'application/json');
    const res = await fetch(`${API}${path}`, { ...init, headers });
    if (res.status === 401) {
      auth.hidden = false;
      throw new Error(location.hostname === 'theludarium.com' ? 'Sign in through Cloudflare Access to use this page.' : 'Enter the preview token to continue.');
    }
    if (!res.ok) {
      const body = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? `The server answered ${res.status}.`);
    }
    return res.json() as Promise<T>;
  }

  const guard = async (work: () => Promise<void>) => {
    try {
      await work();
    } catch (err) {
      say(err instanceof Error ? err.message : String(err), true);
    }
  };

  // State
  let summary: Summary | null = null;
  let venues: Venue[] = [];
  let members: Member[] = [];
  let events: Event[] = [];
  let selectedVenue: number | null = null;
  const slotSelect = $<HTMLSelectElement>('[data-slot]');

  // Summary

  function renderSummary() {
    const box = $('[data-summary]');
    if (!summary) return;
    const stat = (value: string, label: string) => el('div', { class: 'wwp-stat' }, el('strong', { text: value }), el('span', { text: label }));
    const actions = el('div', { class: 'wwp-stat wwp-stat--actions' });
    actions.append(
      btn('Fill missing drive times', '', () => recompute(false)),
      btn(`Retry OSRM for ${summary.driveTimes.estimated} estimates`, '', () => recompute(true)),
    );
    box.replaceChildren(
      stat(String(summary.members.located), `members located (of ${summary.members.total} total, ${summary.members.withAddress} with a street address)`),
      stat(String(venues.filter((v) => v.approved).length), `venues (${venues.filter((v) => !v.approved).length} waiting in the queue)`),
      stat(String(summary.driveTimes.total), `drive times cached (${summary.driveTimes.estimated} straight-line estimates)`),
      stat(summary.center ? `${summary.center.lat.toFixed(3)}, ${summary.center.lng.toFixed(3)}` : '–', 'group center (average of member points)'),
      actions,
    );
  }

  async function recompute(retry: boolean) {
    await guard(async () => {
      say(retry ? 'Asking OSRM again for the estimated pairs…' : 'Routing missing pairs…');
      const result = await api<{ routed: number; estimated: number }>(`/recompute${retry ? '?retry=1' : ''}`, { method: 'POST' });
      say(`Done: ${result.routed} routed by OSRM, ${result.estimated} estimated.`);
      await loadAll();
    });
  }

  // Rankings

  async function renderRankings() {
    const box = $('[data-rankings]');
    const slot = slotSelect.value;
    const data = await api<{ membersConsidered: number; nearMinutes: number; venues: RankedVenue[] }>(`/rankings${slot ? `?slot=${slot}` : ''}`);
    if (!data.venues.length) {
      box.replaceChildren(el('p', { class: 'wwp-empty', text: 'No venues yet. Add one below or approve a suggestion.' }));
      return;
    }
    const head = el(
      'tr',
      {},
      el('th', { text: 'Venue' }),
      el('th', { text: 'Status' }),
      el('th', { class: 'num', text: 'Median' }),
      el('th', { class: 'num', text: '75th pct' }),
      el('th', { class: 'num', text: `Under ${data.nearMinutes} min` }),
      el('th', { class: 'num', text: 'Routed' }),
    );
    const rows = data.venues.map((v) => {
      const row = el(
        'tr',
        { 'data-venue': v.id, class: selectedVenue === v.id ? 'is-selected' : '' },
        el('td', {}, el('strong', { text: v.name }), v.neighborhood ? el('span', { text: ` · ${v.neighborhood}` }) : null, v.located ? null : el('span', { text: ' (no map point)' })),
        el('td', {}, el('span', { class: 'wwp-status', 'data-status': v.status, text: v.status }), v.approved ? null : el('span', { text: ' queue' })),
        el('td', { class: 'num', text: fmtMin(v.medianMinutes) }),
        el('td', { class: 'num', text: fmtMin(v.p75Minutes) }),
        el('td', { class: 'num', text: v.routed ? `${v.underNear} (${v.underNearPct}%)` : '–' }),
        el('td', { class: 'num', text: v.estimated ? `${v.routed} (${v.estimated} est.)` : String(v.routed) }),
      );
      row.addEventListener('click', () => {
        selectedVenue = v.id;
        for (const r of box.querySelectorAll('tr[data-venue]')) r.classList.toggle('is-selected', r === row);
        renderDetail(v.id);
      });
      return row;
    });
    box.replaceChildren(
      el('p', { class: 'wwp-admin__legend', text: `${data.membersConsidered} members considered${slot ? `, available ${slotLabel(slot)}` : ''}. Click a venue for its drive-time spread.` }),
      el('div', { class: 'wwp-table-wrap' }, el('table', { class: 'wwp-table' }, el('thead', {}, head), el('tbody', {}, ...rows))),
    );
  }

  async function renderDetail(venueId: number) {
    const box = $('[data-detail]');
    await guard(async () => {
      const slot = slotSelect.value;
      const d = await api<Detail>(`/venues/${venueId}/detail${slot ? `?slot=${slot}` : ''}`);
      const max = Math.max(1, ...d.histogram.map((b) => b.count));
      const hist = el(
        'ul',
        { class: 'wwp-hist' },
        ...d.histogram.map((b) =>
          el(
            'li',
            {},
            el('span', { text: b.label }),
            el('div', { class: `bar${b.to !== null && b.to <= 20 ? ' near' : ''}`, style: `width: ${Math.round((100 * b.count) / max)}%` }),
            el('span', { text: String(b.count) }),
          ),
        ),
      );
      const memberRows = d.members.map((m) =>
        el(
          'tr',
          {},
          el('td', { text: m.label }),
          el('td', { text: m.zip ?? '' }),
          el('td', { class: 'num', text: fmtMin(m.minutes) + (m.source === 'straight_line' ? ' est.' : '') }),
          el('td', { text: m.availability.map(slotLabel).join(', ') }),
        ),
      );
      box.hidden = false;
      box.replaceChildren(
        el('h3', { text: d.venue.name }),
        el('p', { class: 'wwp-admin__legend', text: `${d.stats.routed} members routed${d.slot ? ` and available ${slotLabel(d.slot)}` : ''}: median ${fmtMin(d.stats.medianMinutes)}, 75th percentile ${fmtMin(d.stats.p75Minutes)}, ${d.stats.underNear} under 20 minutes (${d.stats.underNearPct}%). ${d.stats.estimated} are straight-line estimates.` }),
        el(
          'div',
          { class: 'wwp-admin__detail-grid' },
          el('div', {}, el('h4', { text: 'Drive times, 5 minute buckets' }), hist),
          el(
            'div',
            {},
            el('h4', { text: 'Members by drive time' }),
            el(
              'div',
              { class: 'wwp-table-wrap' },
              el(
                'table',
                { class: 'wwp-table' },
                el('thead', {}, el('tr', {}, el('th', { text: 'Member' }), el('th', { text: 'Zip' }), el('th', { class: 'num', text: 'Drive' }), el('th', { text: 'Available' }))),
                el('tbody', {}, ...(memberRows.length ? memberRows : [el('tr', {}, el('td', { colspan: 4, class: 'wwp-empty', text: 'No one routed yet.' }))])),
              ),
            ),
          ),
        ),
      );
      box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }

  slotSelect.addEventListener('change', () =>
    guard(async () => {
      await renderRankings();
      if (selectedVenue) await renderDetail(selectedVenue);
    }),
  );

  // Map

  let map: any = null;
  let layers: { venues: any; members: any; center: any } | null = null;
  const publicView = $<HTMLInputElement>('[data-public-view]');
  const STATUS_COLORS: Record<string, string> = { idea: '#b9ad9c', contacted: '#e0a23b', confirmed: '#2f5d50', 'played here': '#2b1e16', 'not a fit': '#b5543a' };

  function renderMap() {
    const L = window.L;
    const box = $('[data-map]');
    if (!L) {
      box.replaceChildren(el('p', { class: 'wwp-empty', text: 'The map library did not load.' }));
      return;
    }
    if (!summary) return;
    if (!map) {
      map = L.map(box, { scrollWheelZoom: false }).setView([39.9, -86.1], 10);
      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 18,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
      layers = { venues: L.layerGroup().addTo(map), members: L.layerGroup().addTo(map), center: L.layerGroup().addTo(map) };
    }
    layers!.venues.clearLayers();
    layers!.members.clearLayers();
    layers!.center.clearLayers();

    const points: [number, number][] = [];
    for (const m of summary.memberPoints) {
      const usePublic = publicView.checked;
      const lat = usePublic ? m.publicLat : m.lat;
      const lng = usePublic ? m.publicLng : m.lng;
      if (lat === null || lng === null) continue;
      points.push([lat, lng]);
      L.circleMarker([lat, lng], { radius: 5, color: '#2f5d50', weight: 1, fillColor: '#2f5d50', fillOpacity: 0.45 })
        .bindTooltip(usePublic ? 'Member (snapped)' : `Member ${m.id} (${m.source.replace('_', ' ')})`)
        .addTo(layers!.members);
    }
    for (const v of summary.venuePoints) {
      points.push([v.lat, v.lng]);
      L.circleMarker([v.lat, v.lng], { radius: 9, color: '#f6efe3', weight: 2, fillColor: STATUS_COLORS[v.status] ?? '#b9ad9c', fillOpacity: 0.95 })
        .bindTooltip(`${v.name} (${v.status}${v.approved ? '' : ', in queue'})`)
        .addTo(layers!.venues);
    }
    if (summary.center) {
      points.push([summary.center.lat, summary.center.lng]);
      L.marker([summary.center.lat, summary.center.lng], {
        icon: L.divIcon({ className: '', html: '<div style="width:18px;height:18px;border-radius:50%;background:#e0a23b;border:3px solid #2b1e16;box-shadow:0 0 0 4px rgba(224,162,59,.35)"></div>', iconSize: [18, 18], iconAnchor: [9, 9] }),
      })
        .bindTooltip('Group center')
        .addTo(layers!.center);
    }
    if (points.length) map.fitBounds(points, { padding: [30, 30], maxZoom: 13 });
    $('[data-legend]').textContent = 'Venue pins are colored by status: stone for idea, Lamplight for contacted, Felt Green for confirmed, Walnut for played here, rust for not a fit. Small green dots are members; the ringed Lamplight dot is the group center.';
  }

  publicView.addEventListener('change', renderMap);

  // Venues

  const venueOptions = (selected: number | null) => [
    el('option', { value: '', text: 'Somewhere else' }),
    ...venues.filter((v) => v.approved).map((v) => el('option', { value: v.id, text: v.name, ...(selected === v.id ? { selected: true } : {}) })),
  ];

  async function patchVenue(id: number, patch: Record<string, unknown>) {
    await api(`/venues/${id}`, { method: 'PATCH', body: JSON.stringify(patch) });
  }

  function renderVenues() {
    const queue = $('[data-queue]');
    const box = $('[data-venues]');
    const pending = venues.filter((v) => !v.approved);
    queue.replaceChildren(
      ...(pending.length ? [el('h3', { text: `Suggested by members (${pending.length})` })] : []),
      ...pending.map((v) =>
        el(
          'div',
          { class: 'wwp-queue__item' },
          el('div', {}, el('p', {}, el('strong', { text: v.name }), ` · ${v.address}`), v.suggestion_note ? el('p', { text: v.suggestion_note }) : null, el('p', { text: `Suggested ${fmtDate(v.created_at)}` })),
          el(
            'div',
            { class: 'actions' },
            btn('Approve', 'wwp-btn--primary', () =>
              guard(async () => {
                await patchVenue(v.id, { approved: true });
                say(`${v.name} approved; routing members to it now.`);
                await loadAll();
              }),
            ),
            btn('Discard', 'wwp-btn--danger', () =>
              guard(async () => {
                if (!confirm(`Discard the suggestion "${v.name}"?`)) return;
                await api(`/venues/${v.id}`, { method: 'DELETE' });
                await loadAll();
              }),
            ),
          ),
        ),
      ),
    );
    if (pending.length) queue.classList.add('wwp-queue');

    const approved = venues.filter((v) => v.approved);
    if (!approved.length) {
      box.replaceChildren(el('p', { class: 'wwp-empty', text: 'No venues yet.' }));
      return;
    }
    const head = el('tr', {}, ...['Name', 'Address', 'Area', 'Tables', 'Hours', 'Website', 'Call ahead', 'Status', 'Public address', 'Notes', ''].map((t) => el('th', { text: t })));
    const rows = approved.map((v) => {
      const inputs = {
        name: el('input', { value: v.name, maxlength: 120 }),
        address: el('input', { value: v.address, maxlength: 200 }),
        neighborhood: el('input', { value: v.neighborhood ?? '', maxlength: 80 }),
        table_count: el('input', { type: 'number', min: 0, max: 500, value: v.table_count ?? '' }),
        hours: el('input', { value: v.hours ?? '', maxlength: 200 }),
        website: el('input', { value: v.website ?? '', maxlength: 300 }),
        call_ahead: el('input', { type: 'checkbox', ...(v.call_ahead ? { checked: true } : {}) }),
        status: el('select', {}, ...VENUE_STATUSES.map((s) => el('option', { value: s, text: s, ...(v.status === s ? { selected: true } : {}) }))),
        address_public: el('input', { type: 'checkbox', ...(v.address_public ? { checked: true } : {}) }),
        notes: el('textarea', { rows: 2, maxlength: 3000, text: v.notes ?? '' }),
      };
      const save = () =>
        guard(async () => {
          const patch: Record<string, unknown> = {
            name: inputs.name.value,
            address: inputs.address.value,
            neighborhood: inputs.neighborhood.value || null,
            table_count: inputs.table_count.value === '' ? null : Number(inputs.table_count.value),
            hours: inputs.hours.value || null,
            website: inputs.website.value || null,
            call_ahead: inputs.call_ahead.checked,
            status: inputs.status.value,
            address_public: inputs.address_public.checked,
            notes: inputs.notes.value || null,
          };
          await patchVenue(v.id, patch);
          say(`${inputs.name.value} saved.`);
          await loadAll();
        });
      return el(
        'tr',
        {},
        el('td', {}, inputs.name),
        el('td', {}, inputs.address, v.lat === null ? el('div', { class: 'wwp-empty', text: 'Not on the map. Check the address and regeocode.' }) : null),
        el('td', {}, inputs.neighborhood),
        el('td', { class: 'narrow' }, inputs.table_count),
        el('td', {}, inputs.hours),
        el('td', {}, inputs.website),
        el('td', {}, inputs.call_ahead),
        el('td', {}, inputs.status),
        el('td', {}, inputs.address_public),
        el('td', {}, inputs.notes),
        el(
          'td',
          {},
          el(
            'div',
            { class: 'actions' },
            btn('Save', 'wwp-btn--primary', save),
            btn('Regeocode', '', () =>
              guard(async () => {
                await patchVenue(v.id, { regeocode: true });
                say(`${v.name} looked up again.`);
                await loadAll();
              }),
            ),
            btn('Delete', 'wwp-btn--danger', () =>
              guard(async () => {
                if (!confirm(`Delete ${v.name} and its drive times?`)) return;
                await api(`/venues/${v.id}`, { method: 'DELETE' });
                await loadAll();
              }),
            ),
          ),
        ),
      );
    });
    box.replaceChildren(el('div', { class: 'wwp-table-wrap' }, el('table', { class: 'wwp-table' }, el('thead', {}, head), el('tbody', {}, ...rows))));
  }

  const addVenue = $<HTMLFormElement>('[data-add-venue]');
  addVenue.addEventListener('submit', (event) => {
    event.preventDefault();
    guard(async () => {
      const f = new FormData(addVenue);
      const body = {
        name: f.get('name'),
        address: f.get('address'),
        neighborhood: f.get('neighborhood') || null,
        table_count: f.get('table_count') ? Number(f.get('table_count')) : null,
        hours: f.get('hours') || null,
        website: f.get('website') || null,
        status: f.get('status'),
        call_ahead: f.get('call_ahead') === 'on',
        address_public: f.get('address_public') === 'on',
        notes: f.get('notes') || null,
      };
      const result = await api<{ geocoded: boolean; venue: Venue }>('/venues', { method: 'POST', body: JSON.stringify(body) });
      say(result.geocoded ? `${result.venue.name} added; routing members to it now.` : `${result.venue.name} added, but the address could not be placed on the map. Fix it in the table and regeocode.`);
      addVenue.reset();
      await loadAll();
    });
  });

  // Members

  const showAddresses = $<HTMLInputElement>('[data-show-addresses]');

  function renderMembers() {
    const box = $('[data-members]');
    if (!showAddresses.checked) {
      box.replaceChildren(el('p', { class: 'wwp-empty', text: `${members.length} members. Turn on "Show addresses" to see the table.` }));
      return;
    }
    if (!members.length) {
      box.replaceChildren(el('p', { class: 'wwp-empty', text: 'No members yet.' }));
      return;
    }
    const head = el('tr', {}, ...['Name', 'Discord', 'Email', 'Zip', 'Address', 'Cross street', 'Available', 'Submitted', 'Located by', ''].map((t) => el('th', { text: t })));
    const rows = members.map((m) =>
      el(
        'tr',
        {},
        el('td', { text: m.first_name ?? '' }),
        el('td', { text: m.discord_handle ? `@${m.discord_handle}` : '' }),
        el('td', { text: m.email }),
        el('td', { text: m.zip }),
        el('td', { text: m.street_address ?? '' }),
        el('td', { text: m.cross_street ?? '' }),
        el('td', { text: m.availability.map(slotLabel).join(', ') }),
        el('td', { text: fmtDate(m.created_at) }),
        el('td', {}, m.geocode_source === 'failed' ? el('strong', { text: 'failed' }) : el('span', { text: m.geocode_source.replace('_', ' ') })),
        el(
          'td',
          {},
          el(
            'div',
            { class: 'actions' },
            btn('Resend link', '', () =>
              guard(async () => {
                await api(`/members/${m.id}/resend`, { method: 'POST' });
                say(`A fresh edit link is on its way to ${m.email}.`);
              }),
            ),
            btn('Delete', 'wwp-btn--danger', () =>
              guard(async () => {
                if (!confirm(`Delete ${m.email} and their drive times?`)) return;
                await api(`/members/${m.id}`, { method: 'DELETE' });
                await loadAll();
              }),
            ),
          ),
        ),
      ),
    );
    box.replaceChildren(el('div', { class: 'wwp-table-wrap' }, el('table', { class: 'wwp-table' }, el('thead', {}, head), el('tbody', {}, ...rows))));
  }

  showAddresses.addEventListener('change', renderMembers);

  // Events

  function renderEvents() {
    const box = $('[data-events]');
    $('[data-event-venues]').replaceChildren(...venueOptions(null));
    if (!events.length) {
      box.replaceChildren(el('p', { class: 'wwp-empty', text: 'No events recorded yet.' }));
      return;
    }
    const venueName = (id: number | null) => venues.find((v) => v.id === id)?.name ?? 'Somewhere else';
    const head = el('tr', {}, ...['Date', 'Venue', 'Headcount', 'Notes', ''].map((t) => el('th', { text: t })));
    const rows = events.map((e) => {
      const inputs = {
        date: el('input', { type: 'date', value: e.date }),
        venue: el('select', {}, ...venueOptions(e.venue_id)),
        headcount: el('input', { type: 'number', min: 0, max: 10000, value: e.headcount }),
        notes: el('input', { value: e.notes ?? '', maxlength: 3000 }),
      };
      return el(
        'tr',
        {},
        el('td', {}, inputs.date),
        el('td', {}, inputs.venue),
        el('td', { class: 'narrow' }, inputs.headcount),
        el('td', {}, inputs.notes),
        el(
          'td',
          {},
          el(
            'div',
            { class: 'actions' },
            btn('Save', 'wwp-btn--primary', () =>
              guard(async () => {
                await api(`/events/${e.id}`, {
                  method: 'PATCH',
                  body: JSON.stringify({ date: inputs.date.value, venue_id: inputs.venue.value ? Number(inputs.venue.value) : null, headcount: Number(inputs.headcount.value), notes: inputs.notes.value || null }),
                });
                say(`Event on ${inputs.date.value} saved.`);
                await loadEvents();
              }),
            ),
            btn('Delete', 'wwp-btn--danger', () =>
              guard(async () => {
                if (!confirm(`Delete the event on ${e.date} at ${venueName(e.venue_id)}?`)) return;
                await api(`/events/${e.id}`, { method: 'DELETE' });
                await loadEvents();
              }),
            ),
          ),
        ),
      );
    });
    box.replaceChildren(el('div', { class: 'wwp-table-wrap' }, el('table', { class: 'wwp-table' }, el('thead', {}, head), el('tbody', {}, ...rows))));
  }

  const addEvent = $<HTMLFormElement>('[data-add-event]');
  addEvent.addEventListener('submit', (event) => {
    event.preventDefault();
    guard(async () => {
      const f = new FormData(addEvent);
      await api('/events', {
        method: 'POST',
        body: JSON.stringify({ date: f.get('date'), venue_id: f.get('venue_id') ? Number(f.get('venue_id')) : null, headcount: Number(f.get('headcount') ?? 0), notes: f.get('notes') || null }),
      });
      addEvent.reset();
      await loadEvents();
    });
  });

  async function loadEvents() {
    events = (await api<{ events: Event[] }>('/events')).events;
    renderEvents();
  }

  // Load everything

  async function loadAll() {
    await guard(async () => {
      const [s, v, m, e] = await Promise.all([
        api<Summary>('/summary'),
        api<{ venues: Venue[] }>('/venues'),
        api<{ members: Member[] }>('/members'),
        api<{ events: Event[] }>('/events'),
      ]);
      summary = s;
      venues = v.venues;
      members = m.members;
      events = e.events;
      renderSummary();
      await renderRankings();
      renderMap();
      renderVenues();
      renderMembers();
      renderEvents();
      if (selectedVenue && venues.some((x) => x.id === selectedVenue)) await renderDetail(selectedVenue);
      else {
        selectedVenue = null;
        $('[data-detail]').hidden = true;
      }
    });
  }

  // Leaflet is deferred in <head>; it is ready by the time this module runs.
  loadAll();
}
