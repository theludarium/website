import type { APIRoute, GetStaticPaths } from 'astro';
import { getArticles, type Article } from '@/lib/articles';
import { pngResponse, shareCard } from '@/lib/og';

// One share image per article, with its category and title.
export const getStaticPaths = (async () => {
  const articles = await getArticles();
  return articles.map((article) => ({ params: { slug: article.id }, props: { article } }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { article } = props as { article: Article };
  return pngResponse(await shareCard({ eyebrow: article.data.category, title: article.data.title }));
};
