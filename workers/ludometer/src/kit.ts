// Kit (formerly ConvertKit) webhooks: tag added to a subscriber.
//
// Kit has two webhook styles, and this handles both defensively:
// - Current webhooks: { delivery_id, events: [{ id, type: "subscriber.tag_added",
//   created, data: { subscriber: {...}, tag: { id, name } } }] }, signed with
//   X-Kit-Signature: t=<unix seconds>,v1=<hex HMAC-SHA256 of "t.rawBody">.
// - Legacy v4 webhooks (event "subscriber.tag_add" registered with a tag_id):
//   the body carries the subscriber and may not name the tag. For those,
//   register one webhook per tag and put the tag name in the URL: &tag=course-catan
//
// Only the tag, Kit's ids and the time are kept. Email addresses and names are never stored.
import type { EventType } from './score';
import { SLUG } from './events';

export interface KitTagHit {
  type: EventType;
  slug: string;
  tag: string;
  kitEventId: string | null;
  kitSubscriberId: number | null;
  at: string | null;
}

const PREFIXES: [string, EventType][] = [
  ['course-', 'course_signup'],
  ['tcg-', 'course_signup'],
  ['watch-', 'watch_signup'],
  ['sheet-', 'sheet_download'],
];

/** Maps a Kit tag name to a Ludometer event. Returns null for tags we do not track. */
export function mapKitTag(tagName: string): { type: EventType; slug: string } | null {
  const t = tagName.trim().toLowerCase();
  for (const [prefix, type] of PREFIXES) {
    if (t.startsWith(prefix)) {
      const slug = t.slice(prefix.length);
      return SLUG.test(slug) ? { type, slug } : null;
    }
  }
  return null;
}

const TAG_EVENT_TYPES = new Set(['subscriber.tag_added', 'subscriber.tag_add']);

function tagName(tag: unknown): string | null {
  if (typeof tag === 'string') return tag;
  if (tag && typeof tag === 'object' && typeof (tag as any).name === 'string') return (tag as any).name;
  return null;
}

function subscriberId(sub: unknown): number | null {
  const id = Number((sub as any)?.id);
  return Number.isInteger(id) && id > 0 ? id : null;
}

function isoOrNull(v: unknown): string | null {
  if (typeof v !== 'string') return null;
  const t = Date.parse(v);
  return Number.isFinite(t) ? new Date(t).toISOString() : null;
}

/**
 * Pulls every tracked tag-added hit out of a Kit delivery.
 * `fallbackTag` is the ?tag= value on the webhook URL, used when the body does not name the tag.
 */
export function parseKitDelivery(body: unknown, fallbackTag: string | null): { hits: KitTagHit[]; ignored: number } {
  const hits: KitTagHit[] = [];
  let ignored = 0;
  const consider = (eventType: string | null, data: any, eventId: string | null, at: string | null) => {
    if (eventType && !TAG_EVENT_TYPES.has(eventType)) { ignored++; return; }
    const name = tagName(data?.tag) ?? tagName(data?.subscriber?.tag) ?? fallbackTag;
    const mapped = name ? mapKitTag(name) : null;
    if (!mapped || !name) { ignored++; return; }
    hits.push({ ...mapped, tag: name.trim().toLowerCase(), kitEventId: eventId, kitSubscriberId: subscriberId(data?.subscriber), at });
  };

  if (!body || typeof body !== 'object') return { hits, ignored: 1 };
  const b = body as any;
  if (Array.isArray(b.events)) {
    for (const ev of b.events) {
      if (!ev || typeof ev !== 'object') { ignored++; continue; }
      const type = typeof ev.type === 'string' ? ev.type : typeof ev.name === 'string' ? ev.name : null;
      consider(type, ev.data ?? ev, ev.id != null ? String(ev.id) : null, isoOrNull(ev.created ?? ev.created_at));
    }
  } else {
    // Legacy or flat body: { subscriber, tag? }, sometimes with an event name.
    const type = typeof b.type === 'string' ? b.type : typeof b.event === 'string' ? b.event : typeof b.event?.name === 'string' ? b.event.name : null;
    consider(type, b.data ?? b, b.id != null ? String(b.id) : null, isoOrNull(b.created ?? b.created_at));
  }
  return { hits, ignored };
}

const enc = new TextEncoder();

function hex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf), b => b.toString(16).padStart(2, '0')).join('');
}

export function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Checks Kit's X-Kit-Signature header against the raw body. Tolerance is 5 minutes. */
export async function verifyKitSignature(header: string | null, rawBody: string, secret: string, nowSeconds: number, toleranceSeconds = 300): Promise<boolean> {
  if (!header) return false;
  let t: number | null = null;
  const sigs: string[] = [];
  for (const part of header.split(',')) {
    const [k, v] = part.trim().split('=', 2);
    if (k === 't') t = Number(v);
    else if (k === 'v1' && v) sigs.push(v.toLowerCase());
  }
  if (t == null || !Number.isFinite(t) || Math.abs(nowSeconds - t) > toleranceSeconds || !sigs.length) return false;
  const key = await crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const expected = hex(await crypto.subtle.sign('HMAC', key, enc.encode(`${t}.${rawBody}`)));
  return sigs.some(s => safeEqual(s, expected));
}
