// The Ludarium Academy: free courses whose lessons live in the `lessons`
// content collection (src/content/lessons/<course>/<slug>.md). Paid lessons
// never live in this repo; they will run on a hosted course platform.
import { getCollection, type CollectionEntry } from 'astro:content';
import { SHOW_DRAFTS } from '@/lib/articles';

export type Lesson = CollectionEntry<'lessons'>;

export { LEVEL_NAMES, type LevelName } from '@/lib/academy-levels';
import type { LevelName } from '@/lib/academy-levels';

/**
 * Answers to "How well do you know Catan?" on the signup form. Kit stores the
 * exact text in the catan_experience field, and the Kit automation maps each
 * one to a starting level (docs/academy/catan/KIT-SEQUENCE.md). Change them only together.
 */
export const EXPERIENCE_OPTIONS = ['Never played', 'Played a few times', 'I play regularly', 'I want to compete'];

export interface Level {
  level: number;
  name: LevelName;
  /** Short plain label for the level, such as "Learn to play". */
  label: string;
  /** What a reader can do after finishing the level. */
  outcome: string;
}

export interface Course {
  slug: string;
  title: string;
  shortTitle: string;
  promise: string;
  description: string;
  /** Who the course is for, one line each. */
  audience: string[];
  levels: Level[];
  /** The article the course grew out of. */
  companionArticle: { href: string; title: string };
  /** Unofficial-content notice shown on the course page and every lesson. */
  notice: string;
}

export const COURSES: Course[] = [
  {
    slug: 'catan',
    title: 'Road to the Catan Championship',
    shortTitle: 'Catan',
    promise: 'From kitchen table to tournament table, one lesson at a time.',
    description:
      'A free Catan strategy course in 40 short lessons, from opening the box to what it takes to win a National Championship. One lesson at a time, by email and on the site.',
    audience: [
      'You played Catan at a friend’s house, loved it, and want to stop losing.',
      'You play regularly and want to know why the same people keep winning.',
      'You have seen a CATAN qualifier on a store calendar and wonder if you could hold your own.',
    ],
    levels: [
      { level: 0, name: 'Settler', label: 'Learn to play', outcome: 'Set up and finish a game without opening the rulebook.' },
      { level: 1, name: 'Homesteader', label: 'Beginner', outcome: 'Stop making setup mistakes, and explain why your opening is good.' },
      { level: 2, name: 'Trader', label: 'Intermediate', outcome: 'Read any board, commit to a plan, and win trades on purpose.' },
      { level: 3, name: 'Strategist', label: 'Advanced', outcome: 'Play the people at the table, not just the board, and close out games.' },
      { level: 4, name: 'Contender', label: 'Tournament ready', outcome: 'Walk into an official qualifier knowing the format, the rules, and the clock.' },
      { level: 5, name: 'Champion', label: 'The championship path', outcome: 'Plan a real run at a Regional Preliminary and the National Championship.' },
    ],
    companionArticle: {
      href: '/articles/catan-tournament-qualifier/',
      title: 'I Came to Cube. I’m Staying for Catan.',
    },
    notice: 'Unofficial. Not affiliated with CATAN GmbH or Catan Studio. CATAN is a trademark of CATAN GmbH.',
  },
];

export function courseBySlug(slug: string): Course {
  const found = COURSES.find((c) => c.slug === slug);
  if (!found) throw new Error(`Unknown Academy course: ${slug}`);
  return found;
}

/** The lesson's URL slug: the file name without its course folder. */
export function lessonSlug(lesson: Lesson): string {
  return lesson.id.split('/').pop() ?? lesson.id;
}

export function lessonUrl(lesson: Lesson): string {
  return `/academy/${lesson.data.course}/${lessonSlug(lesson)}/`;
}

/** Every lesson in a course, drafts included, in course order. */
export async function getAllLessons(course: string): Promise<Lesson[]> {
  const all = await getCollection('lessons', ({ data }) => data.course === course);
  return all.sort((a, b) => a.data.order - b.data.order);
}

/** Lessons that get a page: published ones, plus drafts on previews and in local dev. */
export async function getLessonPages(course: string): Promise<Lesson[]> {
  return (await getAllLessons(course)).filter((lesson) => SHOW_DRAFTS || !lesson.data.draft);
}

/** True when a lesson has a page on this build (so it can be linked). */
export function hasPage(lesson: Lesson): boolean {
  return SHOW_DRAFTS || !lesson.data.draft;
}

export function lessonNumber(lesson: Lesson): string {
  return String(lesson.data.order).padStart(2, '0');
}

const WORDS_PER_MINUTE = 230;

/** Reading time for a lesson body, same rule as articles. */
export function lessonMinutes(lesson: Lesson): number {
  const words = (lesson.body ?? '')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/[#*_>`\[\]()!-]/g, ' ')
    .split(/\s+/)
    .filter(Boolean).length;
  return Math.max(1, Math.round(words / WORDS_PER_MINUTE));
}

/** The outline comment in a scaffolded lesson, shown on previews only. */
export function lessonOutline(lesson: Lesson): string | undefined {
  const match = (lesson.body ?? '').match(/<!--\s*OUTLINE([\s\S]*?)-->/);
  return match ? match[1].trim() : undefined;
}

export function levelOf(course: Course, level: number): Level {
  const found = course.levels.find((l) => l.level === level);
  if (!found) throw new Error(`Unknown level ${level} in course ${course.slug}`);
  return found;
}
