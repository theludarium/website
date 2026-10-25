// /ott-manifest.json: every page about a game, for the On the Table tracker
// (theludarium/on-the-table). The tracker loads it into its content_items table,
// logs new pages as our own promotion (so they don't read as outside buzz), and
// links each listed game to its Ludarium pages. Built with the site, so it only
// lists what this build publishes. Only public facts: path, kind, title, date, games.
//
// kind is one of article | course | teach_sheet | hub | product. A course's own
// page and its lessons are all `course`; the course page is /academy/<course>/.
// Game courses (src/content/courses/) add their printable teach sheet as `teach_sheet`.
import type { APIRoute } from 'astro';
import { articleUrl, getArticles } from '@/lib/articles';
import { COURSES, getLessonPages, lessonGames, lessonUrl } from '@/lib/academy';
import { courseLessonGames, courseLessonUrl, courseUrl, getCourseLessons, getGameCourses, lessonHasPage, teachSheetUrl } from '@/lib/courses';

interface ManifestItem {
  path: string;
  kind: 'article' | 'course' | 'teach_sheet' | 'hub' | 'product';
  title: string;
  published_on: string;
  games: string[];
}

const day = (date: Date) => date.toISOString().slice(0, 10);

export const GET: APIRoute = async () => {
  const items: ManifestItem[] = [];

  for (const article of await getArticles()) {
    const { title, pubDate, games } = article.data;
    if (games.length) items.push({ path: articleUrl(article), kind: 'article', title, published_on: day(pubDate), games });
  }

  for (const course of COURSES) {
    const lessons = await getLessonPages(course.slug);
    const first = lessons.map((l) => l.data.pubDate).sort((a, b) => a.getTime() - b.getTime())[0];
    if (course.games.length && first) {
      items.push({ path: `/academy/${course.slug}/`, kind: 'course', title: course.title, published_on: day(first), games: course.games });
    }
    for (const lesson of lessons) {
      const games = lessonGames(course, lesson);
      if (games.length) items.push({ path: lessonUrl(lesson), kind: 'course', title: lesson.data.title, published_on: day(lesson.data.pubDate), games });
    }
  }

  for (const course of await getGameCourses()) {
    const { title, games } = course.data;
    const lessons = (await getCourseLessons(course.id)).filter(lessonHasPage);
    const first = lessons.map((l) => l.data.pubDate).sort((a, b) => a.getTime() - b.getTime())[0];
    if (games.length && first) {
      items.push({ path: courseUrl(course), kind: 'course', title, published_on: day(first), games });
      items.push({ path: teachSheetUrl(course), kind: 'teach_sheet', title: `${course.data.game} teach sheet`, published_on: day(first), games });
    }
    for (const lesson of lessons) {
      const lessonGames = courseLessonGames(course, lesson);
      if (lessonGames.length) {
        items.push({ path: courseLessonUrl(lesson), kind: 'course', title: lesson.data.title, published_on: day(lesson.data.pubDate), games: lessonGames });
      }
    }
  }

  items.sort((a, b) => a.path.localeCompare(b.path));
  return new Response(JSON.stringify({ version: 1, items }), { headers: { 'Content-Type': 'application/json; charset=utf-8' } });
};
