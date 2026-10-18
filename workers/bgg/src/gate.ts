// One Durable Object instance fronts every BGG request. It:
//  - spaces upstream calls at least MIN_GAP_MS apart (BGG asks for gentle use),
//  - retries 202 (collection queued) and 429/5xx with backoff,
//  - caches normalized JSON in its own SQLite storage with a TTL per kind.
import { DurableObject } from 'cloudflare:workers';

export interface Env {
  BGG_GATE: DurableObjectNamespace<BggGate>;
  BGG_TOKEN: string;
  ALLOWED_ORIGINS?: string;
  USER_AGENT?: string;
  RATE_LIMITER?: { limit(opts: { key: string }): Promise<{ success: boolean }> };
}

export const MIN_GAP_MS = 2000;

export type FetchOutcome =
  | { ok: true; xml: string }
  | { ok: false; status: 'queued'; retryAfter: number }
  | { ok: false; status: 'error'; code: number; message: string };

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const jitter = (ms: number) => ms + Math.floor(Math.random() * 500);

export class BggGate extends DurableObject<Env> {
  private nextSlot = 0;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    ctx.storage.sql.exec(`CREATE TABLE IF NOT EXISTS cache (
      key TEXT PRIMARY KEY, body TEXT NOT NULL, fetched_at INTEGER NOT NULL, expires_at INTEGER NOT NULL)`);
  }

  /** Read a cached JSON body if it has not expired. */
  async cacheGet(key: string): Promise<{ body: string; fetchedAt: number } | null> {
    const row = this.ctx.storage.sql.exec<{ body: string; fetched_at: number; expires_at: number }>(
      'SELECT body, fetched_at, expires_at FROM cache WHERE key = ?', key).toArray()[0];
    if (!row || row.expires_at < Date.now()) return null;
    return { body: row.body, fetchedAt: row.fetched_at };
  }

  async cachePut(key: string, body: string, ttlMs: number): Promise<void> {
    const now = Date.now();
    this.ctx.storage.sql.exec('INSERT OR REPLACE INTO cache (key, body, fetched_at, expires_at) VALUES (?, ?, ?, ?)',
      key, body, now, now + ttlMs);
  }

  /** Remove expired rows; called opportunistically. */
  async prune(): Promise<void> {
    this.ctx.storage.sql.exec('DELETE FROM cache WHERE expires_at < ?', Date.now() - 86_400_000);
  }

  /** Wait for this request's turn. Slots are claimed synchronously, so overlapping calls queue in order. */
  private async waitTurn(): Promise<void> {
    const now = Date.now();
    const slot = Math.max(now, this.nextSlot);
    this.nextSlot = slot + MIN_GAP_MS;
    if (slot > now) await sleep(slot - now);
  }

  /** Fetch one BGG URL politely. `queuedRetries` covers BGG's 202 "try again later". */
  async fetchXml(url: string, queuedRetries = 3): Promise<FetchOutcome> {
    if (!this.env.BGG_TOKEN) return { ok: false, status: 'error', code: 500, message: 'BGG token is not configured' };
    const backoff = [2000, 5000, 10000];
    let transient = 0;
    for (let attempt = 0; ; attempt++) {
      await this.waitTurn();
      let res: Response;
      try {
        res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${this.env.BGG_TOKEN}`,
            'User-Agent': this.env.USER_AGENT || 'TheLudarium/1.0 (+https://theludarium.com)',
            Accept: 'application/xml',
          },
        });
      } catch (e) {
        if (transient++ < 2) { await sleep(jitter(backoff[transient - 1])); continue; }
        return { ok: false, status: 'error', code: 502, message: 'Could not reach BoardGameGeek' };
      }
      if (res.status === 200) return { ok: true, xml: await res.text() };
      if (res.status === 202) {
        if (attempt < queuedRetries) { await sleep(jitter(backoff[Math.min(attempt, backoff.length - 1)])); continue; }
        return { ok: false, status: 'queued', retryAfter: 15 };
      }
      if ((res.status === 429 || res.status >= 500) && transient < 2) {
        const ra = Number(res.headers.get('Retry-After'));
        this.nextSlot = Date.now() + (Number.isFinite(ra) && ra > 0 ? ra * 1000 : jitter(backoff[transient] * 2));
        transient++;
        continue;
      }
      if (res.status === 401 || res.status === 403) return { ok: false, status: 'error', code: 502, message: 'BoardGameGeek refused the token. Check the application and token.' };
      return { ok: false, status: 'error', code: res.status === 404 ? 404 : 502, message: `BoardGameGeek answered ${res.status}` };
    }
  }
}
