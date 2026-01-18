
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
        find: /\{\{([a-zA-Z0-9_]+)\}\}/g,
        type: this.type,
        getAttributes: match => {
          return { 'data-variable-key': match[1] };
        },
      },
    ];
  },

  // Markdown 序列化：将变量节点转换为 Markdown 格式
  renderMarkdown: (node, helpers) => {
    const key = node.attrs?.['data-variable-key'] || '';
    return `{{${key}}}`;
  },

  // Markdown 解析：从 Markdown 文本中识别变量并创建节点
  // 实现自定义 tokenizer 来识别 {{variable}} 格式
  markdownTokenizer: {
    name: 'variable',
    level: 'inline',
    start: (src) => {
      // 查找第一个 {{ 的位置
      const index = src.indexOf('{{');
      return index >= 0 ? index : undefined;
    },
    tokenize: (src, tokens, lexer) => {
      // 匹配 {{variable}} 格式
      const match = /^\{\{([a-zA-Z0-9_]+)\}\}/.exec(src);
      if (!match) return undefined;

      return {
        type: 'variable',
        raw: match[0],
        key: match[1],
      };
    },
  },

  // 解析 Markdown token 为 Tiptap 节点
  parseMarkdown: (token, helpers) => {
    return {
      type: 'variable',
      attrs: {
        'data-variable-key': token.key,
      },
    };
  },
});
