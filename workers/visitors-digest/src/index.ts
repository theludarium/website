// Monday morning: who visited the corporate events pages last week?
//
// Runs on the cron trigger in wrangler.toml. Reads the companies seen in the
// last DIGEST_DAYS days, ranks them, emails the list to the site owner through
// the ludarium-notify Worker, and purges lookup cache rows older than
// CACHE_DAYS. The visit log itself is kept; it is anonymous (hashed) and small.

import { notify, type NotifyBinding } from '../../../src/server/notify.ts';
import { CACHE_DAYS, DIGEST_DAYS } from '../../../src/server/visitors/config.ts';
import { purgeCache, recentCompanies, type D1 } from '../../../src/server/visitors/db.ts';
import { formatDigest, rankCompanies, type Digest } from '../../../src/server/visitors/digest.ts';

export interface Env {
  DB: D1;
  NOTIFY?: NotifyBinding;
}

export async function buildDigest(db: D1, now = new Date()): Promise<Digest> {
  const rows = await recentCompanies(db, DIGEST_DAYS, now);
  return formatDigest(rankCompanies(rows, now), DIGEST_DAYS, now);
}

export default {
  async scheduled(controller: { scheduledTime: number }, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const now = new Date(controller.scheduledTime);
    const digest = await buildDigest(env.DB, now);
    const sent = await notify(env.NOTIFY, { subject: digest.subject, text: digest.text });
    if (!sent) throw new Error('The digest could not be sent through ludarium-notify');
    console.log(`Sent: ${digest.subject}`);
    ctx.waitUntil(purgeCache(env.DB, CACHE_DAYS, now));
  },

  // Local preview: `npm run dev` here, then open http://localhost:8787/ to read
  // the digest that would be sent, without sending it.
  async fetch(request: Request, env: Env): Promise<Response> {
    if (new URL(request.url).hostname !== 'localhost') return new Response('Not found', { status: 404 });
    const digest = await buildDigest(env.DB);
    return new Response(`Subject: ${digest.subject}\n\n${digest.text}`, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
  },
};
