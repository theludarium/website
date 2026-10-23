import type { APIRoute, GetStaticPaths } from 'astro';
import { COURSES, getLessonPages, lessonNumber, lessonSlug, type Lesson } from '@/lib/academy';
import { pngResponse, shareCard } from '@/lib/og';

// One share image per Academy lesson, with its course, level, and title.
export const getStaticPaths = (async () => {
  const paths = [];
  for (const course of COURSES) {
    for (const lesson of await getLessonPages(course.slug)) {
      paths.push({ params: { course: course.slug, lesson: lessonSlug(lesson) }, props: { lesson, courseTitle: course.title } });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { lesson, courseTitle } = props as { lesson: Lesson; courseTitle: string };
  const eyebrow = `${courseTitle} · Lesson ${lessonNumber(lesson)}`;
  return pngResponse(await shareCard({ eyebrow, title: lesson.data.title }));
};
