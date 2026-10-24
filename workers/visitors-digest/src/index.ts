// Monday morning: who visited the corporate events pages last week?
//
// Runs on the cron trigger in wrangler.toml. Reads the companies seen in the
// last DIGEST_DAYS days, ranks them, emails the list through Resend, and
// purges lookup cache rows older than CACHE_DAYS. The visit log itself is
// kept; it is anonymous (hashed) and small.

import { CACHE_DAYS, DIGEST_DAYS } from '../../../src/server/visitors/config.ts';
import { purgeCache, recentCompanies, type D1 } from '../../../src/server/visitors/db.ts';
import { formatDigest, rankCompanies, type Digest } from '../../../src/server/visitors/digest.ts';

export interface Env {
  DB: D1;
  RESEND_API_KEY?: string;
  DIGEST_TO?: string;
  DIGEST_FROM?: string;
}

export async function buildDigest(db: D1, now = new Date()): Promise<Digest> {
  const rows = await recentCompanies(db, DIGEST_DAYS, now);
  return formatDigest(rankCompanies(rows, now), DIGEST_DAYS, now);
}

export async function sendDigest(digest: Digest, env: Env): Promise<void> {
  if (!env.RESEND_API_KEY || !env.DIGEST_TO) {
    throw new Error('The digest Worker needs the RESEND_API_KEY and DIGEST_TO secrets');
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: env.DIGEST_FROM || 'The Ludarium <onboarding@resend.dev>',
      to: [env.DIGEST_TO],
      subject: digest.subject,
      text: digest.text,
    }),
  });
  if (!res.ok) throw new Error(`Resend rejected the digest: ${res.status} ${await res.text()}`);
}

export default {
  async scheduled(controller: { scheduledTime: number }, env: Env, ctx: { waitUntil(p: Promise<unknown>): void }) {
    const now = new Date(controller.scheduledTime);
    const digest = await buildDigest(env.DB, now);
    await sendDigest(digest, env);
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
