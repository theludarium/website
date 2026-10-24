// Game courses: every Academy course except Catan (src/lib/academy.ts), read
// from the courses and courseLessons collections. Pages live in
// src/pages/academy/[course]/. Plan and conventions: docs/academy/COURSES.md.
import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from '@/lib/articles';

export type GameCourse = CollectionEntry<'courses'>;
export type CourseLesson = CollectionEntry<'courseLessons'>;
export type CourseFormat = GameCourse['data']['format'];

/** How many lessons each format has. */
export const LESSON_COUNT: Record<CourseFormat, number> = { full: 8, masterclass: 7, 'teach-tonight': 2, tcg: 8 };

/** Lessons up to this number are public pages that can rank; later ones are unlisted and reached from the emails. */
export const PUBLIC_LESSONS: Record<CourseFormat, number> = { full: 2, masterclass: 1, 'teach-tonight': 2, tcg: 8 };

export const FORMAT_LABEL: Record<CourseFormat, string> = {
  full: 'Full course',
  masterclass: 'Masterclass',
  'teach-tonight': 'Teach It Tonight',
  tcg: 'Trading card game course',
};

export function courseTrack(course: GameCourse): 'Board games' | 'Trading card games' {
  return course.data.format === 'tcg' ? 'Trading card games' : 'Board games';
}

/** Courses that get pages on this build, in catalog order. */
export async function getGameCourses(): Promise<GameCourse[]> {
  const all = await getCollection('courses', ({ data }) => SHOW_DRAFTS || !data.draft);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** The lesson's URL slug: its file name without the course folder. */
export function courseLessonSlug(lesson: CourseLesson): string {
  return lesson.id.split('/').pop() ?? lesson.id;
}

export function courseUrl(course: GameCourse | string): string {
  return `/academy/${typeof course === 'string' ? course : course.id}/`;
}

export function courseLessonUrl(lesson: CourseLesson): string {
  return `/academy/${lesson.data.course}/${courseLessonSlug(lesson)}/`;
}

export function teachSheetUrl(course: GameCourse): string {
  return `/academy/${course.id}/teach-sheet/`;
}

/** Every lesson in a course, drafts included, in order. */
export async function getCourseLessons(course: string): Promise<CourseLesson[]> {
  const all = await getCollection('courseLessons', ({ data }) => data.course === course);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** True when the lesson has a page on this build. */
export function lessonHasPage(lesson: CourseLesson): boolean {
  return SHOW_DRAFTS || !lesson.data.draft;
}

/** True when the lesson is a public page (linked from the course page, indexed); false for email-only lessons. */
export function lessonIsPublic(course: GameCourse, lesson: CourseLesson): boolean {
  return lesson.data.order <= PUBLIC_LESSONS[course.data.format];
}

const WORDS_PER_MINUTE = 230;

export function courseLessonMinutes(lesson: CourseLesson): number {
  const words = (lesson.body ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** Diagram files live in public/academy/<slug>/. */
export function setupDiagramUrl(course: GameCourse): string {
  return `/academy/${course.id}/setup.svg`;
}

export function teachSheetPdfUrl(course: GameCourse): string {
  return `/academy/${course.id}/${course.id}-teach-sheet.pdf`;
}
