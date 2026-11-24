// Posts to the Cube Commonwealth Discord about calendar events: what is due, and
// the words of each message. Pure functions, so the rules are tested apart from
// the Worker that sends them (workers/calendar-discord/).
//
// Three kinds of post, each sent once:
// - announce: an approved event, a week before it starts (or at once when it is
//   added or approved inside that week)
// - result: when voting closes, the Cube to draft
// - cancel: an announced event that was cancelled before it started
import { formatDate, formatTimeRange, voteCloseInstant } from './dates.ts';
import { CAL_BASE, kindLabel, type Tally } from './shared.ts';

/** An event announces this many days before it starts. */
export const ANNOUNCE_DAYS = 7;
const DAY_MS = 86_400_000;

/** The columns of cal_events the posts need, plus the name of its Cube when it has one. */
export type DiscordEvent = {
  id: number;
  title: string;
  kind: string;
  date: string;
  start_time: string;
  end_time: string;
  starts_at: string;
  description: string | null;
  location_name: string | null;
  location_address: string | null;
  cube_mode: string;
  cube_id: number | null;
  cube_name: string | null;
  vote_close_hours: number;
  status: string;
  announce: number;
  announced_at: string | null;
  result_posted_at: string | null;
  cancel_posted_at: string | null;
};

export type PostKind = 'announce' | 'result' | 'cancel';
export type DuePost<T extends DiscordEvent = DiscordEvent> = { kind: PostKind; event: T };

/** What should be posted now, in the order to post it. */
export function duePosts<T extends DiscordEvent>(events: readonly T[], now: Date): DuePost<T>[] {
  const t = now.getTime();
  const due: DuePost<T>[] = [];
  for (const e of [...events].sort((a, b) => a.starts_at.localeCompare(b.starts_at) || a.id - b.id)) {
    const starts = Date.parse(e.starts_at);
    if (!(starts > t)) continue; // nothing is posted about an event that has started
    if (e.status === 'approved' && e.announce === 1 && !e.announced_at && starts - t <= ANNOUNCE_DAYS * DAY_MS) due.push({ kind: 'announce', event: e });
    if (
      e.status === 'approved' &&
      e.cube_mode === 'vote' &&
      e.announced_at &&
      !e.result_posted_at &&
      Date.parse(voteCloseInstant(e.starts_at, e.vote_close_hours)) <= t
    ) {
      due.push({ kind: 'result', event: e });
    }
    if (e.status === 'cancelled' && e.announced_at && !e.cancel_posted_at) due.push({ kind: 'cancel', event: e });
  }
  return due;
}

// ---------- The messages ----------

/** A Discord webhook body. */
export type DiscordMessage = {
  content: string;
  embeds?: { title: string; url: string; description: string; color: number }[];
  allowed_mentions: { parse: never[] };
};

/** One color per kind, matching the calendar's mini-Cubes. */
const COLORS: Record<string, number> = { draft: 0x2f5d50, class: 0x7b5ea7, meetup: 0xb9ad9c, celebration: 0xe0a23b, other: 0x2b1e16 };

/** Text a visitor or the organizer typed, made safe to show: no Discord formatting, no links that pretend to be something else. */
export const plain = (text: string) => text.replace(/([\\*_~`|>[\]()#-])/g, '\\$1').replace(/@/g, '@\u200b');

/** Cuts long text at a word, with an ellipsis. */
function clip(text: string, max: number): string {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), max - 40)).trimEnd()}…`;
}

export const eventUrl = (site: string, id: number) => `${site}${CAL_BASE}?event=${id}`;
const when = (e: DiscordEvent) => `${formatDate(e.date, 'medium')}, ${formatTimeRange(e.start_time, e.end_time)}`;
const place = (e: DiscordEvent) => [e.location_name, e.location_address].filter(Boolean).join(', ');

function cubeLine(e: DiscordEvent): string {
  if (e.cube_mode === 'set' && e.cube_name) return `Cube: ${plain(e.cube_name)}`;
  if (e.cube_mode === 'vote') return 'Say you are going, then suggest and rank the Cube we draft.';
  return 'Say you are going so we know who to expect.';
}

/** A new event on the calendar. */
export function announceMessage(e: DiscordEvent, site: string): DiscordMessage {
  const lines = [
    `**${when(e)}**`,
    place(e) ? plain(place(e)) : '',
    e.description ? `\n${plain(clip(e.description, 400))}` : '',
    `\n${cubeLine(e)}`,
  ].filter(Boolean);
  return {
    content: `New on the Cube Commonwealth calendar: **${plain(e.title)}**`,
    embeds: [{ title: clip(`${kindLabel(e.kind)}: ${e.title}`, 250), url: eventUrl(site, e.id), description: clip(lines.join('\n'), 4000), color: COLORS[e.kind] ?? COLORS.other }],
    allowed_mentions: { parse: [] },
  };
}

/** Voting has closed: the Cube to draft, or that the organizer will pick one. */
export function resultMessage(e: DiscordEvent, site: string, tally: Tally, winnerName: string | null): DiscordMessage {
  const title = `**${plain(e.title)}** (${formatDate(e.date, 'short')})`;
  const ballots = tally.ballots === 1 ? '1 ballot' : `${tally.ballots} ballots`;
  const text = e.cube_name
    ? `Voting is closed for ${title}. The Cube to draft is **${plain(e.cube_name)}**.`
    : winnerName
      ? `Voting is closed for ${title}. The vote picked **${plain(winnerName)}** (${ballots}).`
      : `Voting is closed for ${title}. No votes came in, so the organizer will pick the Cube.`;
  return { content: `${text}\n${eventUrl(site, e.id)}`, allowed_mentions: { parse: [] } };
}

/** An announced event was cancelled. */
export function cancelMessage(e: DiscordEvent, site: string): DiscordMessage {
  return { content: `Cancelled: **${plain(e.title)}** on ${when(e)}.\n${eventUrl(site, e.id)}`, allowed_mentions: { parse: [] } };
}

/** Only a real Discord webhook address is ever called. */
export const isWebhookUrl = (url: string | undefined): url is string =>
  typeof url === 'string' && /^https:\/\/(?:discord\.com|discordapp\.com|canary\.discord\.com|ptb\.discord\.com)\/api\/webhooks\/\d+\/[\w-]+$/.test(url);
