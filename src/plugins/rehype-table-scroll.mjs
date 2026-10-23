// Wraps every Markdown table in <div class="table-scroll"> so wide tables
// scroll sideways on phones instead of squeezing their columns.
// Styles live in src/styles/prose.css.
import { visit, SKIP } from 'unist-util-visit';

export default function rehypeTableScroll() {
  return (tree) => {
    visit(tree, 'element', (node, index, parent) => {
      if (node.tagName !== 'table' || !parent || index === undefined) return;
      if (parent.type === 'element' && parent.properties?.className?.includes?.('table-scroll')) return;
      parent.children[index] = {
        type: 'element',
        tagName: 'div',
        properties: { className: ['table-scroll'], tabIndex: 0, role: 'region', ariaLabel: 'Table' },
        children: [node],
      };
      return [SKIP, index + 1];
    });
  };
}
