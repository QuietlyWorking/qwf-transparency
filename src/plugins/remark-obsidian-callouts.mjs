/**
 * Remark plugin to transform Obsidian callout syntax into HTML.
 *
 * Converts:
 *   > [!WARNING] Title text
 *   > Body content
 *
 * Into:
 *   <div class="callout callout-warning">
 *     <div class="callout-title">Title text</div>
 *     <div class="callout-body"><p>Body content</p></div>
 *   </div>
 *
 * Collapsible callouts ([!type]-) use <details>/<summary>.
 */
import { visit } from 'unist-util-visit';

const CALLOUT_RE = /^\[!(\w+)\]([+-]?)(?:\s+(.*))?$/;

const CALLOUT_ICONS = {
  note: '\u{1F4DD}',
  info: '\u{2139}\u{FE0F}',
  tip: '\u{1F4A1}',
  warning: '\u{26A0}\u{FE0F}',
  danger: '\u{1F6A8}',
  bug: '\u{1F41B}',
  example: '\u{1F4CB}',
  quote: '\u{1F4AC}',
  faq: '\u{2753}',
  abstract: '\u{1F4C4}',
  success: '\u{2705}',
  failure: '\u{274C}',
  question: '\u{2753}',
};

export default function remarkObsidianCallouts() {
  return (tree) => {
    visit(tree, 'blockquote', (node, index, parent) => {
      if (!node.children?.length) return;

      const firstChild = node.children[0];
      if (firstChild.type !== 'paragraph' || !firstChild.children?.length) return;

      const firstText = firstChild.children[0];
      if (firstText.type !== 'text') return;

      const lines = firstText.value.split('\n');
      const match = lines[0].match(CALLOUT_RE);
      if (!match) return;

      const [, type, collapseFlag, titleText] = match;
      const typeLower = type.toLowerCase();
      const isCollapsible = collapseFlag === '-' || collapseFlag === '+';
      const defaultOpen = collapseFlag === '+';
      const icon = CALLOUT_ICONS[typeLower] || '';
      const title = titleText || type.charAt(0).toUpperCase() + type.slice(1);

      // Remove the callout marker line from the first text node
      const remainingLines = lines.slice(1);
      if (remainingLines.length > 0) {
        firstText.value = remainingLines.join('\n');
      } else {
        // Remove the first text node entirely
        firstChild.children.shift();
      }

      // Build body children (remaining blockquote content)
      const bodyChildren = [];
      if (firstChild.children.length > 0) {
        bodyChildren.push(firstChild);
      }
      bodyChildren.push(...node.children.slice(1));

      if (isCollapsible) {
        // <details><summary>Title</summary>Body</details>
        const replacement = {
          type: 'html',
          value: '',
        };
        // We need to serialize body to HTML-ish markdown
        // Instead, use mdast structure with wrapper HTML
        parent.children[index] = {
          type: 'html',
          value: `<details class="callout callout-${typeLower}"${defaultOpen ? ' open' : ''}>
<summary class="callout-title">${icon} ${title}</summary>
<div class="callout-body">`,
        };
        // Insert body nodes after the opening tag
        const closingNode = { type: 'html', value: '</div>\n</details>' };
        parent.children.splice(index + 1, 0, ...bodyChildren, closingNode);
      } else {
        // Static callout div
        parent.children[index] = {
          type: 'html',
          value: `<div class="callout callout-${typeLower}">
<div class="callout-title">${icon} ${title}</div>
<div class="callout-body">`,
        };
        const closingNode = { type: 'html', value: '</div>\n</div>' };
        parent.children.splice(index + 1, 0, ...bodyChildren, closingNode);
      }
    });
  };
}
