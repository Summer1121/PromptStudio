import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VariableNode } from './VariableNode';

/**
 * TiptapVariable Extension
 * 
 * This extension defines a custom node for representing variables like `{{variable}}`.
 * It's configured to be an inline, atomic node, meaning it's treated as a single,
 * indivisible character within the text flow.
 * 
 * Key properties:
 * - `atom: true`: Ensures the node is treated as a single unit. Deleting it removes the whole node.
 * - `addNodeView`: Uses a React component (`VariableNode`) for rendering the node in the editor.
 *   This allows for complex, interactive rendering (like a clickable button) instead of static HTML.
 * - `renderText`: Defines the plain text representation of the node, used for copy-paste
 *   and converting the editor content back to a string.
 */
export const TiptapVariable = Node.create({
  name: 'tiptapVariable',

  group: 'inline',

  inline: true,
  
  // Ensures the node is treated as a single, indivisible unit.
  atom: true,

  // Defines the attributes for this node, in this case, the variable's key.
  addAttributes() {
    return {
      'data-variable-key': {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-key'),
        renderHTML: attributes => {
          if (!attributes['data-variable-key']) {
            return {};
          }
          return { 'data-variable-key': attributes['data-variable-key'] };
        },
      },
    };
  },

  // Defines how to parse this node from HTML content.
  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  // Defines how to render this node back to HTML.
  renderHTML({ HTMLAttributes }) {
    // A simple span with attributes. The actual complex view is handled by ReactNodeViewRenderer.
    return ['span', mergeAttributes(HTMLAttributes)];
  },

  // Defines the plain text representation for copy-pasting or serialization.
  renderText({ node }) {
    return `{{${node.attrs['data-variable-key']}}}`;
  },

  // Hooks up our custom React component to render the node in the editor.
  addNodeView() {
    return ReactNodeViewRenderer(VariableNode);
  },
});