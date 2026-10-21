// Builds the weekly email from the companies seen in the last few days.
// Pure: no database, no network. The Worker in workers/visitors-digest calls it.

import { TARGET_REGION } from './config.ts';
import type { CompanyActivity } from './db.ts';
import { inTargetRegion, scoreCompany, type ScoreParts } from './score.ts';

export interface RankedCompany extends CompanyActivity {
  score: ScoreParts;
  local: boolean;
  linkedIn: string;
}

export function linkedInSearch(company: string): string {
  const keywords = `"${company}" HR OR people OR learning`;
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(keywords)}`;
}

export function rankCompanies(rows: CompanyActivity[], now = new Date()): RankedCompany[] {
  return rows
    .map((row) => ({
      ...row,
      score: scoreCompany(
        { visits: row.visits, pages: row.distinct_pages, lastSeen: row.last_seen, country: row.country, regionCode: row.region_code },
        now,
      ),
      local: inTargetRegion({ country: row.country, regionCode: row.region_code }),
      linkedIn: linkedInSearch(row.name),
    }))
    .sort((a, b) => b.score.total - a.score.total);
}

const shortDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Indiana/Indianapolis' });

function where(c: CompanyActivity): string {
  return [c.city, c.region, c.country].filter(Boolean).join(', ') || 'location unknown';
}

export interface Digest {
  subject: string;
  text: string;
}

export function formatDigest(companies: RankedCompany[], days: number, now = new Date()): Digest {
  const from = shortDate(new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString());
  const to = shortDate(now.toISOString());
  const range = `${from} to ${to}`;

  if (companies.length === 0) {
    return {
      subject: `Visiting companies: none this week (${range})`,
      text: `No new companies viewed the corporate events pages between ${from} and ${to}.\n`,
    };
  }

  const local = companies.filter((c) => c.local).length;
  const lines = [
    `Visiting companies, ${range}`,
    '',
    `${companies.length} ${companies.length === 1 ? 'company' : 'companies'} viewed the corporate events pages` +
      (local ? `, ${local} in ${TARGET_REGION.label}.` : '.'),
    'Ranked by visits, pages, recency, and location.',
    '',
  ];

  companies.forEach((c, i) => {
    const pages = c.paths.split(',').filter(Boolean);
    lines.push(
      `${i + 1}. ${c.name}${c.domain ? `  (${c.domain})` : ''}  score ${c.score.total}${c.local ? `  ${TARGET_REGION.label.toUpperCase()}` : ''}`,
      `   ${where(c)}${c.kind !== 'business' ? `  [${c.kind}]` : ''}`,
      `   ${c.visits} ${c.visits === 1 ? 'visit' : 'visits'}, ${c.distinct_pages} ${c.distinct_pages === 1 ? 'page' : 'pages'}: ${pages.join(', ')}`,
      `   First seen ${shortDate(c.first_seen)}, last seen ${shortDate(c.last_seen)}.${c.source ? ` Source: ${c.source}` : ''}`,
      `   LinkedIn: ${c.linkedIn}`,
      '',
    );
  });

  lines.push('Scores: 10 x log2(1 + visits), 15 per page, up to 30 for recency, 40 for Indiana or 10 for the rest of the US.');
  return { subject: `Visiting companies: ${companies.length} this week (${range})`, text: lines.join('\n') };
}
