// Ranks companies for the digest. Higher is more worth a call.

import { TARGET_REGION } from './config.ts';

export interface Scorable {
  visits: number;
  /** Distinct tracked pages viewed. */
  pages: number;
  /** ISO timestamp of the most recent visit. */
  lastSeen: string;
  country: string | null;
  regionCode: string | null;
}

export interface ScoreParts {
  visits: number;
  pages: number;
  recency: number;
  region: number;
  total: number;
}

const DAY = 24 * 60 * 60 * 1000;

export function scoreCompany(c: Scorable, now = new Date(), target = TARGET_REGION): ScoreParts {
  // Each extra visit counts a little less than the one before it.
  const visits = Math.round(10 * Math.log2(1 + Math.max(0, c.visits)));
  // Reading more than one page is a strong signal, so each page counts a lot.
  const pages = 15 * Math.max(0, c.pages);
  // 30 points today, fading to 0 after 30 days.
  const daysAgo = (now.getTime() - new Date(c.lastSeen).getTime()) / DAY;
  const recency = Math.round(Math.max(0, 30 - Math.max(0, daysAgo)));
  // Home turf first, then the rest of the country, then everyone else.
  let region = 0;
  if (c.country === target.country) region = c.regionCode === target.regionCode ? 40 : 10;

  return { visits, pages, recency, region, total: visits + pages + recency + region };
}

export function inTargetRegion(c: Pick<Scorable, 'country' | 'regionCode'>, target = TARGET_REGION): boolean {
  return c.country === target.country && c.regionCode === target.regionCode;
}
