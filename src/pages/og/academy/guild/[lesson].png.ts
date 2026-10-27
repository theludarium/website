import type { APIRoute, GetStaticPaths } from 'astro';
import { getGuildLessons, guildHasPage, guildLessonCode, guildLessonSlug } from '@/lib/guild';
import { pngResponse, shareCard } from '@/lib/og';

// One share image per Guild of Game Guides lesson.
export const getStaticPaths = (async () => {
  const all = await getGuildLessons();
  return all.filter(guildHasPage).map((lesson) => ({
    params: { lesson: guildLessonSlug(lesson) },
    props: { eyebrow: `Guild of Game Guides · Lesson ${guildLessonCode(lesson, all)}`, title: lesson.data.title },
  }));
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { eyebrow, title } = props as { eyebrow: string; title: string };
  return pngResponse(await shareCard({ eyebrow, title }));
};
