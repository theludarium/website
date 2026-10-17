import rss from '@astrojs/rss';
import type { APIRoute } from 'astro';
import { articleUrl, getArticles } from '@/lib/articles';
import { SITE } from '@/lib/site';

// Articles feed at /rss.xml. Drafts are left out on the live site, like everywhere else.
export const GET: APIRoute = async ({ site }) => {
  const articles = await getArticles();
  return rss({
    title: SITE.name,
    description: SITE.description,
    site: site ?? SITE.url,
    trailingSlash: true,
    items: articles.map((article) => ({
      title: article.data.title,
      description: article.data.description,
      pubDate: article.data.pubDate,
      link: articleUrl(article),
      categories: [article.data.category, ...article.data.tags],
    })),
    customData: '<language>en-us</language>',
  });
};
