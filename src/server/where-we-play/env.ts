// Bindings and settings the Where We Play functions read from the Pages
// project. The D1 interface is the small slice of Cloudflare's D1 API we
// call, typed here so this code type-checks without the Workers type package.

export interface D1Statement {
  bind(...values: unknown[]): D1Statement;
  first<T = Record<string, unknown>>(): Promise<T | null>;
  all<T = Record<string, unknown>>(): Promise<{ results: T[] }>;
  run(): Promise<{ meta?: { last_row_id?: number; changes?: number } }>;
}

export interface D1 {
  prepare(sql: string): D1Statement;
  batch(statements: D1Statement[]): Promise<unknown[]>;
}

export interface WwpEnv {
  /** D1 binding, Settings > Bindings on the Pages project. */
  DB?: D1;
  /** Turnstile widget secret, shared with the inquiry form. */
  TURNSTILE_SECRET_KEY?: string;
  /** Cloudflare Access team domain, for example "theludarium" (for theludarium.cloudflareaccess.com). */
  ACCESS_TEAM_DOMAIN?: string;
  /** Application Audience (AUD) tag of the Access application that guards the admin paths. */
  ACCESS_AUD?: string;
  /** Preview and local only: lets the admin page in with an X-Admin-Token header instead of Access. */
  WWP_ADMIN_PREVIEW_TOKEN?: string;
  /** Optional salt for the rate limiter's hashed IPs. */
  WWP_HASH_SALT?: string;
}

export interface Context<Params = Record<string, string>> {
  request: Request;
  env: WwpEnv;
  params: Params;
  waitUntil(promise: Promise<unknown>): void;
  next(): Promise<Response>;
}
