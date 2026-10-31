// Turns plain Markdown links to Amazon into affiliate links, the same as the
// <AffiliateLink> component: marked sponsored, opened in a new tab, counted by
// /ott.js. So a .md article can link a game with [Wingspan](https://www.amazon.com/dp/...)
// and stay plain Markdown. The article page adds the disclosure notice on its own.
import { visit } from 'unist-util-visit';

export const AMAZON_LINK = /^https:\/\/(www\.amazon\.com|link\.amazon|amzn\.to)\//;

export default function rehypeAmazonLinks() {
  return (tree) => {
    visit(tree, 'element', (node) => {
      if (node.tagName !== 'a' || typeof node.properties?.href !== 'string') return;
      if (!AMAZON_LINK.test(node.properties.href)) return;
      node.properties.className = ['game-link'];
      node.properties.rel = ['sponsored', 'noopener'];
      node.properties.target = '_blank';
      node.properties.dataOttEvent = 'affiliate_click';
    });
  };
}
