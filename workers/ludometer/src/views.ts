// Shapes stored rows for responses and for the newsletter. Never includes weights.
import { ATTRIBUTION } from './env';
import { addDays } from './dates';
import { movement, type WeeklyRow } from './score';

export const SITE_URL = 'https://theludarium.com/ludometer/';

/** 0..1 to a whole number 0..100. */
export const pct = (v: number | null | undefined) => Math.round(Math.max(0, Math.min(1, Number(v) || 0)) * 100);

export interface PublicRow {
  rank: number;
  movement: number | null;
  isNew: boolean;
  name: string;
  game_id: number;
  score: number;
  attention: number;
  interest: number;
  play: number;
  bgg_hot_rank: number | null;
  days_on_list: number;
}

export function publicRow(r: WeeklyRow): PublicRow {
  return {
    rank: r.rank,
    movement: movement(r.rank, r.prev_rank),
    isNew: r.prev_rank == null,
    name: r.name,
    game_id: r.game_id,
    score: pct(r.score),
    attention: pct(r.attention),
    interest: pct(r.interest),
    play: pct(r.play),
    bgg_hot_rank: r.bgg_hot_rank,
    days_on_list: r.days_on_list,
  };
}

export function weekPayload(week: string, rows: WeeklyRow[]) {
  return {
    week,
    weekEnds: addDays(week, 6),
    scale: 'Scores and parts run 0 to 100. movement is places climbed since last week; null means new this week.',
    games: rows.map(publicRow),
    attribution: ATTRIBUTION,
  };
}

export function movers(rows: WeeklyRow[], n = 5) {
  const withMove = rows.map(publicRow).filter(r => r.movement != null);
  return {
    risers: withMove.filter(r => (r.movement as number) > 0).sort((a, b) => (b.movement as number) - (a.movement as number) || a.rank - b.rank).slice(0, n),
    fallers: withMove.filter(r => (r.movement as number) < 0).sort((a, b) => (a.movement as number) - (b.movement as number) || a.rank - b.rank).slice(0, n),
    newEntries: rows.map(publicRow).filter(r => r.isNew).slice(0, n),
  };
}

export function feedPayload(week: string, rows: WeeklyRow[]) {
  return {
    week,
    weekEnds: addDays(week, 6),
    url: SITE_URL,
    top10: rows.slice(0, 10).map(publicRow),
    ...movers(rows),
    attribution: ATTRIBUTION,
  };
}

export interface WatchRow {
  id: number;
  name: string;
  kind: string;
  bgg_id: number | null;
  release_window: string | null;
  status: string | null;
  signals: string | null;
  notes: string | null;
  trigger: string | null;
  verdict: string | null;
  updated_at: string | null;
}

const esc = (s: unknown) => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));

const moveText = (r: PublicRow) => r.isNew ? 'new' : r.movement === 0 ? 'same' : (r.movement as number) > 0 ? `up ${r.movement}` : `down ${-(r.movement as number)}`;

const longDate = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString('en-US', { month: 'long', day: 'numeric', timeZone: 'UTC' });

/**
 * The week's Ludometer Reading as a Kit broadcast draft.
 * `notes` are watchlist rows with a trigger and verdict for this week.
 */
export function buildBroadcast(week: string, rows: WeeklyRow[], notes: WatchRow[], publicApi: boolean) {
  const top = rows.slice(0, 10).map(publicRow);
  const { risers, fallers, newEntries } = movers(rows, 3);
  const byId = new Map(rows.map(r => [r.game_id, publicRow(r)]));
  const title = `The Ludometer Reading: week of ${longDate(week)}`;
  const leader = top[0];
  const preview = leader ? `${leader.name} leads the table this week.` : 'This week at the table.';
  const warnings: string[] = [];
  if (!publicApi) warnings.push('Do not send yet. The BGG commercial license is pending, and this draft is built from BGG-derived data.');
  if (!rows.length) warnings.push('No scores for this week. Run the score job first.');

  const noteLine = (w: WatchRow) => {
    const pr = w.bgg_id != null ? byId.get(w.bgg_id) : undefined;
    return { name: w.name, where: pr ? `#${pr.rank}, ${moveText(pr)}` : w.kind, trigger: w.trigger || '', verdict: w.verdict || '' };
  };
  const noteLines = notes.map(noteLine);

  const text = [
    title,
    '',
    'What people are actually learning and playing this week.',
    '',
    'THE TOP 10',
    ...top.map(r => `${r.rank}. ${r.name} (${moveText(r)})${r.bgg_hot_rank ? `, BGG Hotness #${r.bgg_hot_rank}` : ''}`),
    '',
    ...(risers.length ? ['RISING', ...risers.map(r => `${r.name}: up ${r.movement} to #${r.rank}`), ''] : []),
    ...(fallers.length ? ['COOLING', ...fallers.map(r => `${r.name}: down ${-(r.movement as number)} to #${r.rank}`), ''] : []),
    ...(newEntries.length ? ['NEW THIS WEEK', ...newEntries.map(r => `${r.name} at #${r.rank}`), ''] : []),
    ...(noteLines.length ? ['WHY THEY MOVED', ...noteLines.flatMap(n => [`${n.name} (${n.where})`, `Why it moved: ${n.trigger}`, `Our read: ${n.verdict}`, '']) ] : []),
    `See the full index: ${SITE_URL}`,
    '',
    `BGG Hotness ranks come from BoardGameGeek. ${ATTRIBUTION.text}: ${ATTRIBUTION.url}`,
  ].join('\n');

  const p = 'margin:0 0 12px;font-family:Georgia,serif;font-size:16px;line-height:1.5;color:#2B1E16';
  const h2 = 'margin:24px 0 8px;font-family:Helvetica,Arial,sans-serif;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#2F5D50';
  const td = 'padding:6px 8px;border-bottom:1px solid #E6DDCD;font-family:Helvetica,Arial,sans-serif;font-size:14px;color:#2B1E16';
  const list = (items: string[]) => `<ul style="margin:0 0 12px;padding-left:20px">${items.map(i => `<li style="${p};margin-bottom:4px">${i}</li>`).join('')}</ul>`;

  const html = [
    `<h1 style="margin:0 0 8px;font-family:Georgia,serif;font-size:26px;color:#2B1E16">${esc(title)}</h1>`,
    `<p style="${p}">What people are actually learning and playing this week.</p>`,
    `<h2 style="${h2}">The top 10</h2>`,
    `<table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse">`,
    `<tr><th align="left" style="${td}">#</th><th align="left" style="${td}">Game</th><th align="left" style="${td}">Move</th><th align="left" style="${td}">BGG Hotness</th></tr>`,
    ...top.map(r => `<tr><td style="${td}">${r.rank}</td><td style="${td}">${esc(r.name)}</td><td style="${td}">${esc(moveText(r))}</td><td style="${td}">${r.bgg_hot_rank ? `#${r.bgg_hot_rank}` : ''}</td></tr>`),
    `</table>`,
    ...(risers.length ? [`<h2 style="${h2}">Rising</h2>`, list(risers.map(r => `${esc(r.name)}: up ${r.movement} to #${r.rank}`))] : []),
    ...(fallers.length ? [`<h2 style="${h2}">Cooling</h2>`, list(fallers.map(r => `${esc(r.name)}: down ${-(r.movement as number)} to #${r.rank}`))] : []),
    ...(newEntries.length ? [`<h2 style="${h2}">New this week</h2>`, list(newEntries.map(r => `${esc(r.name)} at #${r.rank}`))] : []),
    ...(noteLines.length ? [`<h2 style="${h2}">Why they moved</h2>`, ...noteLines.map(n =>
      `<p style="${p}"><strong>${esc(n.name)}</strong> (${esc(n.where)})<br>Why it moved: ${esc(n.trigger)}<br>Our read: ${esc(n.verdict)}</p>`)] : []),
    `<p style="${p}"><a href="${SITE_URL}" style="color:#2F5D50">See the full index</a></p>`,
    `<p style="margin:24px 0 0;font-family:Helvetica,Arial,sans-serif;font-size:12px;color:#6B5E4E">BGG Hotness ranks come from BoardGameGeek. <a href="${ATTRIBUTION.url}" style="color:#2F5D50">${ATTRIBUTION.text}</a>.</p>`,
  ].join('\n');

  return { week, subject: title, preview_text: preview, html, text, warnings, attribution: ATTRIBUTION };
}
