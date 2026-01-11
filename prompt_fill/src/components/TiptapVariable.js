
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { VariableNode } from './VariableNode';

export const TiptapVariable = Node.create({
  name: 'variable',
  group: 'inline',
  inline: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      'data-variable-key': {
        default: null,
        parseHTML: element => element.getAttribute('data-variable-key'),
        renderHTML: attributes => ({
          'data-variable-key': attributes['data-variable-key'],
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-variable-key]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(VariableNode);
  },

  addInputRules() {
    return [
      {
        find: /\{\{([^{}]+)\}\}/g,
        type: this.type,
        getAttributes: match => {
          return { 'data-variable-key': match[1] };
        },
      },
    ];
  },
});
