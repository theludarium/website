// POST / with JSON { subject, text, replyTo? } -> one email to NOTIFY_TO.
// Reachable only through service bindings (no workers.dev URL, no routes),
// so the only callers are this account's own Pages Functions.
import { EmailMessage } from 'cloudflare:email';
import { buildMime } from './mime.ts';

interface Env {
  MAILER: { send(message: EmailMessage): Promise<void> };
  NOTIFY_FROM: string;
  NOTIFY_TO?: string;
}

const LIMITS = { subject: 300, text: 50_000 };

const reply = (status: number, body: Record<string, unknown>) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    if (request.method !== 'POST') return reply(405, { error: 'POST only' });
    if (!env.NOTIFY_TO) return reply(500, { error: 'NOTIFY_TO is not set' });

    let input: { subject?: unknown; text?: unknown; replyTo?: unknown };
    try {
      input = await request.json();
    } catch {
      return reply(400, { error: 'Send JSON' });
    }
    const { subject, text, replyTo } = input;
    if (typeof subject !== 'string' || !subject || subject.length > LIMITS.subject) return reply(400, { error: 'Bad subject' });
    if (typeof text !== 'string' || !text || text.length > LIMITS.text) return reply(400, { error: 'Bad text' });

    const raw = buildMime({
      from: env.NOTIFY_FROM,
      fromName: 'The Ludarium',
      to: env.NOTIFY_TO,
      subject,
      text,
      replyTo: typeof replyTo === 'string' ? replyTo : null,
      messageDomain: 'theludarium.com',
    });
    try {
      await env.MAILER.send(new EmailMessage(env.NOTIFY_FROM, env.NOTIFY_TO, raw));
      return reply(200, { sent: true });
    } catch (err) {
      console.error('send_email failed', err);
      return reply(502, { error: 'Send failed' });
    }
  },
};
