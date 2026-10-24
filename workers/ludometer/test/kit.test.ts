import { describe, it, expect } from 'vitest';
import { createHmac } from 'node:crypto';
import { mapKitTag, parseKitDelivery, verifyKitSignature } from '../src/kit';

describe('mapKitTag', () => {
  it('maps the four tag families', () => {
    expect(mapKitTag('course-catan')).toEqual({ type: 'course_signup', slug: 'catan' });
    expect(mapKitTag('tcg-lorcana')).toEqual({ type: 'course_signup', slug: 'lorcana' });
    expect(mapKitTag('watch-lantern-harbor')).toEqual({ type: 'watch_signup', slug: 'lantern-harbor' });
    expect(mapKitTag('Sheet-Catan')).toEqual({ type: 'sheet_download', slug: 'catan' });
  });
  it('ignores tags we do not track or cannot slug', () => {
    expect(mapKitTag('academy')).toBeNull();
    expect(mapKitTag('lounge-indianapolis')).toBeNull();
    expect(mapKitTag('course-')).toBeNull();
    expect(mapKitTag('course-Bad Slug!')).toBeNull();
  });
});

describe('parseKitDelivery', () => {
  it('reads the current Kit delivery shape', () => {
    const body = {
      delivery_id: 123456,
      events: [
        { id: 'evt-1', type: 'subscriber.tag_added', created: '2026-10-20T14:32:10Z',
          data: { subscriber: { id: 987654, first_name: 'Ada', email_address: 'ada@example.com', state: 'active' }, tag: { id: 42, name: 'course-catan' } } },
        { id: 'evt-2', type: 'subscriber.tag_added', created: '2026-10-20T14:33:00Z',
          data: { subscriber: { id: 5 }, tag: { id: 43, name: 'customer' } } },
        { id: 'evt-3', type: 'subscriber.created', created: '2026-10-20T14:34:00Z', data: { subscriber: { id: 6 } } },
      ],
    };
    const { hits, ignored } = parseKitDelivery(body, null);
    expect(hits).toEqual([{ type: 'course_signup', slug: 'catan', tag: 'course-catan', kitEventId: 'evt-1', kitSubscriberId: 987654, at: '2026-10-20T14:32:10.000Z' }]);
    expect(ignored).toBe(2);
    expect(JSON.stringify(hits)).not.toContain('ada@example.com');
  });

  it('reads a legacy body with the tag from the URL', () => {
    const { hits } = parseKitDelivery({ subscriber: { id: 77, email_address: 'x@example.com' } }, 'watch-lantern-harbor');
    expect(hits).toMatchObject([{ type: 'watch_signup', slug: 'lantern-harbor', kitSubscriberId: 77, kitEventId: null }]);
  });

  it('prefers a tag in the body over the URL tag', () => {
    const { hits } = parseKitDelivery({ subscriber: { id: 1 }, tag: { name: 'sheet-catan' } }, 'course-catan');
    expect(hits[0].type).toBe('sheet_download');
  });

  it('survives junk', () => {
    expect(parseKitDelivery(null, null).hits).toEqual([]);
    expect(parseKitDelivery({ events: [null, 3, {}] }, null).hits).toEqual([]);
    expect(parseKitDelivery({ subscriber: { id: 1 } }, null).hits).toEqual([]);
  });
});

describe('verifyKitSignature', () => {
  const secret = 'whsec_test';
  const raw = '{"delivery_id":1,"events":[]}';
  const t = 1_790_000_000;
  const sig = createHmac('sha256', secret).update(`${t}.${raw}`).digest('hex');

  it('accepts a good signature, including during rotation', async () => {
    expect(await verifyKitSignature(`t=${t},v1=${sig}`, raw, secret, t + 10)).toBe(true);
    expect(await verifyKitSignature(`t=${t},v1=deadbeef,v1=${sig}`, raw, secret, t)).toBe(true);
  });
  it('rejects a changed body, a stale time, or no header', async () => {
    expect(await verifyKitSignature(`t=${t},v1=${sig}`, raw + ' ', secret, t)).toBe(false);
    expect(await verifyKitSignature(`t=${t},v1=${sig}`, raw, secret, t + 301)).toBe(false);
    expect(await verifyKitSignature(null, raw, secret, t)).toBe(false);
  });
});
