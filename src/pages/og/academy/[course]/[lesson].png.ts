import type { APIRoute, GetStaticPaths } from 'astro';
import { COURSES, getLessonPages, lessonNumber, lessonSlug } from '@/lib/academy';
import { courseLessonSlug, getCourseLessons, getGameCourses, lessonHasPage } from '@/lib/courses';
import { pngResponse, shareCard } from '@/lib/og';

// One share image per Academy lesson: the Catan course and every game course.
export const getStaticPaths = (async () => {
  const paths = [];
  for (const course of COURSES) {
    for (const lesson of await getLessonPages(course.slug)) {
      paths.push({
        params: { course: course.slug, lesson: lessonSlug(lesson) },
        props: { eyebrow: `${course.title} · Lesson ${lessonNumber(lesson)}`, title: lesson.data.title },
      });
    }
  }
  for (const course of await getGameCourses()) {
    const lessons = await getCourseLessons(course.id);
    for (const lesson of lessons.filter(lessonHasPage)) {
      paths.push({
        params: { course: course.id, lesson: courseLessonSlug(lesson) },
        props: { eyebrow: `${course.data.game} · Lesson ${lesson.data.order} of ${lessons.length}`, title: lesson.data.title },
      });
    }
  }
  return paths;
}) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ props }) => {
  const { eyebrow, title } = props as { eyebrow: string; title: string };
  return pngResponse(await shareCard({ eyebrow, title }));
};
