import type { APIRoute } from 'astro';
import { SITE, CATEGORIES } from '@/lib/site';
import { getArticles, articleUrl } from '@/lib/articles';
import { START_HERE, SERIES, bySlugs, seriesArticles } from '@/lib/series';
import { getGameCourses } from '@/lib/courses';

// /llms.txt: a plain map of the site for AI assistants and tools (llmstxt.org format).
// Built from the same data as the site, so it stays current: categories with their
// Start here reads, series, Academy courses, tools, and the store.
export const GET: APIRoute = async ({ site }) => {
  const url = (path: string) => new URL(path, site).href;
  const articles = await getArticles();
  const courses = await getGameCourses();
  const lines: string[] = [];
  lines.push(`# ${SITE.name}`, '');
  lines.push(`> ${SITE.description} ${SITE.tagline}`, '');
  lines.push(
    `${articles.length} articles and free Academy courses for ${courses.length} games. Most articles answer one question, with a quick answer near the top, an at-a-glance table, and an FAQ. Prices and availability in buying guides change; each article shows its updated date.`,
    '',
  );

  lines.push('## Start here', '');
  lines.push(`- [All articles](${url('/articles/')}): reading paths, topics, and the newest articles`);
  lines.push(`- [The Academy](${url('/academy/')}): free courses that teach a board game, then how to play it well`);
  lines.push(`- [Free tools](${url('/play/')}): the Card Catalogue, the RPG Demo Library, Game Night Madness, Head Judge Arbiter`);
  lines.push(`- [Store](${url('/store/')}): print-and-play games, one-page RPGs, teach cards, a 2027 calendar, tees and hoodies`);
  lines.push(`- [About](${url('/about/')}): togethering, and the game lounge planned for Indianapolis`, '');

  for (const c of CATEGORIES) {
    const picks = bySlugs(START_HERE[c.slug] ?? [], articles);
    if (picks.length === 0) continue;
    lines.push(`## ${c.name}`, '', `${c.description} [All ${c.name} articles](${url(`/articles/category/${c.slug}/`)})`, '');
    for (const a of picks) lines.push(`- [${a.data.title}](${url(articleUrl(a))}): ${a.data.description}`);
    const series = SERIES.filter((s) => s.category === c.name).filter((s) => seriesArticles(s, articles).length > 1);
    if (series.length) {
      lines.push('', `Series in ${c.name}:`);
      for (const s of series) lines.push(`- [${s.name}](${url(`/articles/category/${c.slug}/#series-${s.slug}`)}): ${s.blurb}`);
    }
    lines.push('');
  }

  lines.push('## Academy courses', '');
  for (const c of courses) lines.push(`- [${c.data.game}](${url(`/academy/${c.id}/`)}): ${c.data.description}`);
  lines.push('');

  lines.push('## Optional', '');
  lines.push(`- [Sitemap](${url('/sitemap-index.xml')})`);
  lines.push(`- [RSS feed of articles](${url('/rss.xml')})`, '');

  return new Response(lines.join('\n'), { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
};
