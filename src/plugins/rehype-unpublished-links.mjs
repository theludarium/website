// On the live site, a link to an article that is not published yet (a draft,
// or a slug that does not exist) renders as plain text instead of a dead link.
// When the target article publishes, the next build turns it back into a link.
// Preview builds and local dev show drafts, so links stay links there.
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { visit, SKIP } from 'unist-util-visit';

const ARTICLES_DIR = 'src/content/articles';
const ARTICLE_LINK = /^\/articles\/([a-z0-9-]+)\/?(?:[?#].*)?$/;

function publishedSlugs() {
  const slugs = new Set();
  for (const file of readdirSync(ARTICLES_DIR)) {
    if (!/\.mdx?$/.test(file)) continue;
    const text = readFileSync(join(ARTICLES_DIR, file), 'utf8');
    const frontmatter = text.split('---')[1] ?? '';
    if (!/^draft:\s*true\s*$/m.test(frontmatter)) slugs.add(file.replace(/\.mdx?$/, ''));
  }
  return slugs;
}

/** @param {{ showDrafts: boolean }} options */
export default function rehypeUnpublishedLinks({ showDrafts }) {
  if (showDrafts) return () => {};
  const published = publishedSlugs();
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'a' || !parent || index === undefined) return;
      const match = String(node.properties?.href ?? '').match(ARTICLE_LINK);
      if (!match || match[1] === 'category' || published.has(match[1])) return;
      parent.children.splice(index, 1, ...node.children);
      return [SKIP, index];
    });
  };
}
