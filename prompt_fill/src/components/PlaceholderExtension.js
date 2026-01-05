// PlaceholderExtension.js
import { Node, mergeAttributes } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import { PlaceholderView } from './PlaceholderView';

export const PlaceholderExtension = Node.create({
  name: 'placeholder',
  group: 'inline',
  inline: true,
  selectable: false,
  atom: true,

  addAttributes() {
    return {
      key: {
        default: null,
        parseHTML: element => element.getAttribute('data-key'),
        renderHTML: attributes => ({
          'data-key': attributes.key,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-placeholder]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes({ 'data-placeholder': '' }, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(PlaceholderView);
  },
  
  addInputRules() {
    return [
        {
            find: /\{\{([^{}]+)\}\}/g,
            type: this.type,
            getAttributes: match => {
                return {key: match[1]}
            },
        },
    ]
  }
});