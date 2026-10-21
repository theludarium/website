// Decides which requests are worth logging at all. Everything here runs
// before any lookup, so a skipped request costs nothing.

import { TRACKED_PATHS } from './config.ts';

// Crawlers, link previewers, uptime monitors, scripts, and AI fetchers.
const BOT_PATTERN =
  /bot|crawl|spider|slurp|fetch|preview|headless|lighthouse|pingdom|monitor|uptime|curl|wget|python|java\/|go-http|okhttp|axios|facebookexternalhit|whatsapp|telegram|discord|skype|slack|twitter|linkedin|embedly|yandex|baidu|duckduck|semrush|ahrefs|mj12|dotbot|petalbot|bytespider|gptbot|claude|anthropic|openai|perplexity|ccbot|applebot|google-inspectiontool|phantomjs|puppeteer|playwright|selenium/i;

export function isBot(userAgent: string | null): boolean {
  // Real browsers send long user agents. Short or missing ones are scripts.
  if (!userAgent || userAgent.length < 20) return true;
  return BOT_PATTERN.test(userAgent);
}

/** Browsers mark speculative loads so sites can tell them from real visits. */
export function isPrefetch(headers: Headers): boolean {
  const purpose = headers.get('Sec-Purpose') ?? headers.get('Purpose') ?? headers.get('X-Moz') ?? '';
  return /prefetch|prerender|preview/i.test(purpose);
}

/** VISITOR_IGNORE_IPS is a list separated by commas, spaces, or newlines. */
export function parseIgnoredIps(value: string | undefined): Set<string> {
  return new Set((value ?? '').split(/[\s,]+/).map((ip) => ip.trim()).filter(Boolean));
}

export type SkipReason = 'path' | 'method' | 'no-ip' | 'own-ip' | 'bot' | 'prefetch';

export interface RequestFacts {
  method: string;
  pathname: string;
  ip: string | null;
  userAgent: string | null;
  headers: Headers;
  ignoredIps: Set<string>;
  trackedPaths?: string[];
}

/** Why a request is skipped, or null when it should be logged. */
export function skipReason(facts: RequestFacts): SkipReason | null {
  const tracked = facts.trackedPaths ?? TRACKED_PATHS;
  if (!tracked.includes(facts.pathname)) return 'path';
  if (facts.method !== 'GET') return 'method';
  if (!facts.ip) return 'no-ip';
  if (facts.ignoredIps.has(facts.ip)) return 'own-ip';
  if (isBot(facts.userAgent)) return 'bot';
  if (isPrefetch(facts.headers)) return 'prefetch';
  return null;
}
