import { getCollection, type CollectionEntry } from 'astro:content';
import { CATEGORIES } from '@/lib/site';
import { IS_PREVIEW } from '@/lib/env';

export type Article = CollectionEntry<'articles'>;
export type Category = (typeof CATEGORIES)[number];

/**
 * Drafts never reach the live site. They do show in local dev and on
 * Cloudflare preview builds (any branch other than main), with a Draft
 * badge, so Levi can review them at a preview URL before publishing.
 */
export const SHOW_DRAFTS = IS_PREVIEW;

export async function getArticles(): Promise<Article[]> {
  const all = await getCollection('articles', ({ data }) => SHOW_DRAFTS || !data.draft);
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export function categoryByName(name: string): Category {
  const found = CATEGORIES.find((c) => c.name === name);
  if (!found) throw new Error(`Unknown article category: ${name}`);
  return found;
}

export function categoryUrl(name: string): string {
  return `/articles/category/${categoryByName(name).slug}/`;
}

export function articleUrl(article: Article): string {
  return `/articles/${article.id}/`;
}

const WORDS_PER_MINUTE = 230;

export function wordCount(article: Article): number {
  const text = (article.body ?? '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`\[\]()!-]/g, ' ');
  return text.split(/\s+/).filter(Boolean).length;
}

export function readingMinutes(article: Article): number {
  return Math.max(1, Math.round(wordCount(article) / WORDS_PER_MINUTE));
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

/** Up to `limit` related articles: same category scores highest, then shared tags. */
export function relatedArticles(article: Article, all: Article[], limit = 3): Article[] {
  const tags = new Set(article.data.tags.map((t) => t.toLowerCase()));
  return all
    .filter((other) => other.id !== article.id)
    .map((other) => {
      const sameCategory = other.data.category === article.data.category ? 3 : 0;
      const sharedTags = other.data.tags.filter((t) => tags.has(t.toLowerCase())).length;
      return { other, score: sameCategory + sharedTags };
    })
    .sort((a, b) => b.score - a.score || b.other.data.pubDate.valueOf() - a.other.data.pubDate.valueOf())
    .slice(0, limit)
    .map(({ other }) => other);
}
