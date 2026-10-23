// On the live site, a link to an article or Academy lesson that is not published
// yet (a draft, or a slug that does not exist) renders as plain text instead of
// a dead link.
// When the target article publishes, the next build turns it back into a link.
// Preview builds and local dev show drafts, so links stay links there.
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit, SKIP } from 'unist-util-visit';

const ARTICLES_DIR = 'src/content/articles';
const LESSONS_DIR = 'src/content/lessons';
const ARTICLE_LINK = /^\/articles\/([a-z0-9-]+)\/?(?:[?#].*)?$/;
const LESSON_LINK = /^\/academy\/([a-z0-9-]+)\/([a-z0-9-]+)\/?(?:[?#].*)?$/;
// Academy pages that are not lessons.
const ACADEMY_PAGES = new Set(['thanks', 'confirmed']);

function publishedIn(dir, prefix = '') {
  const slugs = new Set();
  if (!existsSync(dir)) return slugs;
  for (const file of readdirSync(dir)) {
    if (!/\.mdx?$/.test(file)) continue;
    const text = readFileSync(join(dir, file), 'utf8');
    const frontmatter = text.split('---')[1] ?? '';
    if (!/^draft:\s*true\s*$/m.test(frontmatter)) slugs.add(prefix + file.replace(/\.mdx?$/, ''));
  }
  return slugs;
}

function publishedSlugs() {
  return publishedIn(ARTICLES_DIR);
}

/** Published lessons as "course/slug". */
function publishedLessons() {
  const lessons = new Set();
  if (!existsSync(LESSONS_DIR)) return lessons;
  for (const course of readdirSync(LESSONS_DIR, { withFileTypes: true })) {
    if (!course.isDirectory()) continue;
    for (const slug of publishedIn(join(LESSONS_DIR, course.name), `${course.name}/`)) lessons.add(slug);
  }
  return lessons;
}

/** @param {{ showDrafts: boolean }} options */
export default function rehypeUnpublishedLinks({ showDrafts }) {
  if (showDrafts) return () => {};
  const published = publishedSlugs();
  const lessons = publishedLessons();
  const isDead = (href) => {
    const article = href.match(ARTICLE_LINK);
    if (article) return article[1] !== 'category' && !published.has(article[1]);
    const lesson = href.match(LESSON_LINK);
    if (lesson) return !ACADEMY_PAGES.has(lesson[1]) && !lessons.has(`${lesson[1]}/${lesson[2]}`);
    return false;
  };
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'a' || !parent || index === undefined) return;
      if (!isDead(String(node.properties?.href ?? ''))) return;
      parent.children.splice(index, 1, ...node.children);
      return [SKIP, index];
    });
  };
}
