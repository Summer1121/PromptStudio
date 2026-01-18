import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TiptapVariable } from './TiptapVariable';
import { EditorContext } from './VariableNode';

// A custom extension that extends TiptapVariable to add input rules.
// This rule finds text that matches the pattern `{{key}}` and automatically
// converts it into our `tiptapVariable` node on the fly.
const VariableConversion = TiptapVariable.extend({
  addInputRules() {
    return [
      {
        find: /\{\{([a-zA-Z0-9_]+)\}\}/g,
        type: this.type,
        getAttributes: match => ({ 'data-variable-key': match[1] }),
      },
    ];
  },
});

const VisualEditor = React.forwardRef((
  { value, onUpdate, banks, categories, onVariableClick, activeTemplate, defaults, language }, 
  ref
) => {
  const isUpdatingFromOutside = useRef(false);

  // 序列化编辑器内容为 Markdown 格式
  const serializeToMarkdown = (editor) => {
    if (!editor) return '';
    
    try {
      // 优先使用 Markdown 扩展的自动序列化
      // TiptapVariable 已经实现了 renderMarkdown，应该能正确处理变量
      if (typeof editor.getMarkdown === 'function') {
        return editor.getMarkdown();
      }
    } catch (error) {
      console.error('Error using getMarkdown:', error);
    }
    
    // 降级到手动序列化方法
    return serializeStateToString(editor.state);
  };

  // 降级方法：手动序列化（当 Markdown 扩展不可用时）
  // 递归处理节点，支持所有 Markdown 节点类型
  const serializeStateToString = (state) => {
    const processNode = (node, index = 0, parent = null) => {
      let result = '';
      const nodeType = node.type.name;
      
      // 处理文本节点
      if (nodeType === 'text') {
        return node.text;
      }
      
      // 处理变量节点
      if (nodeType === 'variable') {
        const key = node.attrs?.['data-variable-key'] || '';
        return `{{${key}}}`;
      }
      
      // 处理硬换行
      if (nodeType === 'hardBreak') {
        return '\n';
      }
      
      // 处理段落
      if (nodeType === 'paragraph') {
        const content = processChildren(node);
        // 如果段落为空，返回空字符串
        if (!content.trim()) {
          return '';
        }
        return content;
      }
      
      // 处理标题
      if (nodeType.startsWith('heading')) {
        const level = node.attrs?.level || 1;
        const hashes = '#'.repeat(level);
        const content = processChildren(node);
        return `${hashes} ${content}\n\n`;
      }
      
      // 处理粗体
      if (nodeType === 'bold') {
        const content = processChildren(node);
        return `**${content}**`;
      }
      
      // 处理斜体
      if (nodeType === 'italic') {
        const content = processChildren(node);
        return `*${content}*`;
      }
      
      // 处理代码
      if (nodeType === 'code') {
        const content = processChildren(node);
        return `\`${content}\``;
      }
      
      // 处理代码块
      if (nodeType === 'codeBlock') {
        const language = node.attrs?.language || '';
        const content = node.textContent || '';
        return `\`\`\`${language}\n${content}\n\`\`\`\n\n`;
      }
      
      // 处理列表项
      if (nodeType === 'listItem') {
        const content = processChildren(node);
        // 检查父节点类型
        if (parent && parent.type.name === 'orderedList') {
          const start = parent.attrs?.start || 1;
          const itemIndex = parent.content.findIndex(n => n === node);
          return `${start + itemIndex}. ${content}\n`;
        }
        return `- ${content}\n`;
      }
      
      // 处理无序列表
      if (nodeType === 'bulletList') {
        return processChildren(node);
      }
      
      // 处理有序列表
      if (nodeType === 'orderedList') {
        return processChildren(node);
      }
      
      // 处理引用
      if (nodeType === 'blockquote') {
        const content = processChildren(node);
        return content.split('\n').map(line => line ? `> ${line}` : '').join('\n') + '\n\n';
      }
      
      // 处理水平线
      if (nodeType === 'horizontalRule') {
        return '---\n\n';
      }
      
      // 默认：处理子节点
      return processChildren(node);
    };
    
    const processChildren = (node) => {
      if (!node.content || node.content.size === 0) return '';
      
      let result = '';
      node.content.forEach((child, index) => {
        result += processNode(child, index, node);
      });
      return result;
    };
    
    // 处理文档根节点
    let text = '';
    state.doc.forEach((node, index) => {
      const content = processNode(node, index);
      if (content) {
        text += content;
        // 段落之间添加双换行符（Markdown 段落分隔），最后一个段落不添加
        if (node.isBlock && index < state.doc.content.size - 1) {
          text += '\n\n';
        }
      }
    });
    
    // 清理多余的换行
    text = text.replace(/\n{3,}/g, '\n\n').trim();
    
    return text;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      Markdown.configure({
        // 配置 Markdown 扩展
        html: false, // 不解析 HTML，只解析 Markdown
        transformPastedText: true, // 转换粘贴的文本
        transformCopiedText: true, // 转换复制的文本
        // 允许用户直接编辑 Markdown 文本
        // 编辑器会自动将 Markdown 转换为富文本，但用户输入时仍可以输入 Markdown 语法
      }),
      TiptapVariable, // 自定义变量节点
    ],
    content: value || '', // 初始内容，将在 useEffect 中处理
    editorProps: {
      attributes: {
        class: 'p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words focus:outline-none w-full h-full',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingFromOutside.current) return;
      const newTextValue = serializeToMarkdown(editor);
      if (onUpdate) {
        onUpdate(newTextValue);
      }
    },
  });

  // 在设置内容后，确保所有变量都被正确识别
  // 改进版本：更精确地识别变量，避免影响周围文本
  const ensureVariablesAreRecognized = (editor) => {
    if (!editor) return false;
    
    try {
      const { state } = editor;
      const { tr } = state;
      const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
      const changes = [];
      
      // 收集所有需要转换的变量位置
      // 使用更精确的方法：只在文本节点内部查找，并确保位置计算准确
      state.doc.descendants((node, pos, parent) => {
        // 只处理文本节点
        if (node.type.name === 'text' && node.text) {
          const text = node.text;
          const matches = [];
          
          // 使用 matchAll 获取所有匹配，避免正则状态问题
          const allMatches = Array.from(text.matchAll(variableRegex));
          
          allMatches.forEach((match) => {
            if (match.index !== undefined) {
              const absoluteStart = pos + match.index;
              const absoluteEnd = absoluteStart + match[0].length;
              const key = match[1];
              
              // 验证位置是否在节点范围内
              if (absoluteStart >= pos && absoluteEnd <= pos + node.nodeSize) {
                // 检查这个位置是否已经是变量节点
                try {
                  const $pos = state.doc.resolve(absoluteStart);
                  const nodeAtPos = $pos.nodeAfter;
                  
                  // 如果当前位置不是变量节点，且位置在文本节点内，记录需要转换
                  if (!nodeAtPos || nodeAtPos.type.name !== 'variable') {
                    // 再次验证：确保我们要替换的内容确实是 {{variable}} 格式
                    const textAtPos = state.doc.textBetween(absoluteStart, absoluteEnd);
                    if (textAtPos === match[0]) {
                      changes.push({
                        from: absoluteStart,
                        to: absoluteEnd,
                        key: key,
                        text: match[0],
                      });
                    }
                  }
                } catch (e) {
                  // 位置解析失败，跳过这个匹配
                  console.warn('Failed to resolve position for variable:', e);
                }
              }
            }
          });
        }
      });
      
      // 从后往前应用更改，避免位置偏移问题
      if (changes.length > 0) {
        // 按位置从大到小排序
        changes.sort((a, b) => b.from - a.from);
        
        changes.forEach(({ from, to, key, text }) => {
          try {
            // 再次验证位置和内容
            const actualText = state.doc.textBetween(from, to);
            if (actualText === text) {
              const variableNode = state.schema.nodes.variable.create({
                'data-variable-key': key,
              });
              tr.replaceWith(from, to, variableNode);
            }
          } catch (e) {
            console.warn('Failed to replace variable:', e);
          }
        });
        
        if (tr.docChanged) {
          editor.view.dispatch(tr);
          return true; // 表示有更改
        }
      }
      
      return false; // 没有更改
    } catch (error) {
      console.error('Error ensuring variables are recognized:', error);
      return false;
    }
  };

  // Effect to sync editor content when the `value` prop changes from the outside.
  useEffect(() => {
    if (editor && value !== undefined) {
      try {
        // 使用 Markdown 格式设置内容
        // markdownTokenizer 应该能在解析时识别变量
        const currentEditorValue = serializeToMarkdown(editor);
        
        // 使用更精确的比较，避免不必要的更新
        const normalizedCurrent = currentEditorValue?.trim() || '';
        const normalizedValue = (value || '').trim();
        
        if (normalizedValue !== normalizedCurrent) {
          isUpdatingFromOutside.current = true;
          
          // 使用 Markdown 格式设置内容
          // 这样用户可以继续以 Markdown 格式编辑
          editor.commands.setContent(value || '', { contentType: 'markdown' });
          
          // 确保所有变量都被正确识别（备选方案）
          // 只执行一次，避免递归导致的性能问题
          setTimeout(() => {
            const hasChanges = ensureVariablesAreRecognized(editor);
            // 如果还有未识别的变量，再尝试一次（但只尝试一次，避免无限循环）
            if (hasChanges) {
              setTimeout(() => {
                ensureVariablesAreRecognized(editor);
                isUpdatingFromOutside.current = false;
              }, 50);
            } else {
              isUpdatingFromOutside.current = false;
            }
          }, 10);
        } else {
          isUpdatingFromOutside.current = false;
        }
      } catch (error) {
        console.error('Error setting content:', error);
        // 降级处理：使用纯文本模式
        isUpdatingFromOutside.current = true;
        editor.commands.setContent(value || '', false);
        setTimeout(() => {
          ensureVariablesAreRecognized(editor);
          isUpdatingFromOutside.current = false;
        }, 10);
      }
    }
  }, [value, editor]);

  useImperativeHandle(ref, () => ({
    insertVariable: (key) => {
      if (editor) {
        // 直接插入变量文本，输入规则会自动将其转换为变量节点
        editor.chain().focus().insertContent(`{{${key}}}`).run();
      }
    },
  }), [editor]);
  
  const editorContextValue = {
    banks, categories, activeTemplate, language, onVariableClick, defaults,
  };

  return (
    <EditorContext.Provider value={editorContextValue}>
      <div className="relative w-full h-full overflow-y-auto custom-scrollbar pb-48">
        <EditorContent editor={editor} />
      </div>
    </EditorContext.Provider>
  );
});

VisualEditor.displayName = 'VisualEditor';

export { VisualEditor };
