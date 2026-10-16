const buildEnv = (globalThis as { process?: { env: Record<string, string | undefined> } }).process?.env ?? {};
const pagesBranch = buildEnv.CF_PAGES_BRANCH; // set by Cloudflare Pages during builds

/**
 * True in local dev and on Cloudflare preview builds (any branch except main).
 * Use it for drafts and for reminders that must never reach the live site.
 */
export const IS_PREVIEW = import.meta.env.DEV || (Boolean(pagesBranch) && pagesBranch !== 'main');
