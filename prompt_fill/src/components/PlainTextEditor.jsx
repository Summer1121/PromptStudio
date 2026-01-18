import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TiptapVariable } from './TiptapVariable';
import { EditorContext } from './VariableNode';

/**
 * 纯文本编辑器组件（基于 Tiptap）
 * 显示原始 Markdown 文本，不进行 Markdown 渲染
 * 只将变量 {{variable}} 识别为特殊节点进行高亮和交互
 * 
 * 特性：
 * - 显示原始 Markdown 文本（如 # 标题、**粗体** 等保持原样）
 * - 变量作为特殊节点显示（高亮、可点击）
 * - 输出时保持原始 Markdown 格式
 */
export const PlainTextEditor = React.forwardRef((
  { value, onUpdate, banks, categories, onVariableClick, activeTemplate, defaults, language }, 
  ref
) => {
  const isUpdatingFromOutside = useRef(false);

  // 序列化编辑器内容为原始文本格式（保持 Markdown 原始格式）
  // 只将变量节点转换回 {{variable}} 格式，其他文本保持原样
  const serializeToText = (editor) => {
    if (!editor) return '';
    
    const processNode = (node) => {
      const nodeType = node.type.name;
      
      // 处理文本节点：直接返回文本内容
      if (nodeType === 'text') {
        return node.text;
      }
      
      // 处理变量节点：转换为 {{variable}} 格式
      if (nodeType === 'variable') {
        const key = node.attrs?.['data-variable-key'] || '';
        return `{{${key}}}`;
      }
      
      // 处理硬换行
      if (nodeType === 'hardBreak') {
        return '\n';
      }
      
      // 处理段落：递归处理子节点
      if (nodeType === 'paragraph') {
        if (!node.content || node.content.size === 0) {
          return '';
        }
        let result = '';
        node.content.forEach((child) => {
          result += processNode(child);
        });
        return result;
      }
      
      // 默认：递归处理所有子节点
      if (node.content && node.content.size > 0) {
        let result = '';
        node.content.forEach((child) => {
          result += processNode(child);
        });
        return result;
      }
      
      return '';
    };
    
    // 处理文档根节点
    let text = '';
    const state = editor.state;
    state.doc.forEach((node, index) => {
      const content = processNode(node);
      if (content) {
        text += content;
        // 段落之间添加换行符
        if (node.isBlock && index < state.doc.content.size - 1) {
          text += '\n\n';
        }
      }
    });
    
    // 清理多余的换行（保留原始格式，只清理连续3个以上的换行）
    text = text.replace(/\n{3,}/g, '\n\n');
    
    return text;
  };

  const editor = useEditor({
    extensions: [
      // 只使用基础扩展：Text, Paragraph, Doc, HardBreak
      // 不解析 Markdown，保持原始文本格式
      StarterKit.configure({
        history: false, // 禁用历史记录
        // 禁用所有格式化功能，只保留基础文本编辑
        bold: false,
        italic: false,
        heading: false,
        blockquote: false,
        codeBlock: false,
        code: false,
        horizontalRule: false,
        bulletList: false,
        orderedList: false,
        listItem: false,
        // 只保留：Text, Paragraph, Doc, HardBreak
      }),
      TiptapVariable, // 自定义变量节点（用于识别和显示变量）
    ],
    content: '', // 初始内容为空，将在 useEffect 中设置
    editorProps: {
      attributes: {
        // 样式配置，类似原生 textarea，使用等宽字体显示原始文本
        class: 'p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words focus:outline-none w-full h-full',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingFromOutside.current) return;
      // 序列化为原始文本格式（保持 Markdown 原始格式）
      const newTextValue = serializeToText(editor);
      if (onUpdate) {
        onUpdate(newTextValue);
      }
    },
  });

  // 确保变量被正确识别的函数（从 VisualEditor 借鉴）
  const ensureVariablesAreRecognized = (editor) => {
    if (!editor) return false;
    
    try {
      const { state } = editor;
      const { tr } = state;
      const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
      const changes = [];
      
      // 收集所有需要转换的变量位置
      state.doc.descendants((node, pos) => {
        // 只处理文本节点
        if (node.type.name === 'text' && node.text) {
          const text = node.text;
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
                  
                  // 如果当前位置不是变量节点，记录需要转换
                  if (!nodeAtPos || nodeAtPos.type.name !== 'variable') {
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
                  console.warn('Failed to resolve position for variable:', e);
                }
              }
            }
          });
        }
      });
      
      // 从后往前应用更改，避免位置偏移问题
      if (changes.length > 0) {
        changes.sort((a, b) => b.from - a.from);
        
        changes.forEach(({ from, to, key, text }) => {
          try {
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
          return true;
        }
      }
      
      return false;
    } catch (error) {
      console.error('Error ensuring variables are recognized:', error);
      return false;
    }
  };

  // 将纯文本内容转换为 Tiptap 节点树，同时识别变量
  const parseTextToContent = (text) => {
    if (!text) return '<p></p>';
    
    // 将文本按行分割
    const lines = text.split('\n');
    const paragraphs = [];
    
    lines.forEach((line) => {
      if (line.trim() === '' && paragraphs.length > 0) {
        // 空行：添加新段落
        paragraphs.push('<p></p>');
      } else if (line.trim() !== '') {
        // 非空行：处理变量并创建段落
        let paragraphHtml = '<p>';
        let lastIndex = 0;
        const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
        let match;
        
        while ((match = variableRegex.exec(line)) !== null) {
          // 添加变量前的文本
          if (match.index > lastIndex) {
            const beforeText = line.substring(lastIndex, match.index);
            paragraphHtml += escapeHtml(beforeText);
          }
          
          // 添加变量节点
          const key = match[1];
          paragraphHtml += `<span data-variable-key="${escapeHtml(key)}"></span>`;
          
          lastIndex = variableRegex.lastIndex;
        }
        
        // 添加剩余的文本
        if (lastIndex < line.length) {
          paragraphHtml += escapeHtml(line.substring(lastIndex));
        }
        
        paragraphHtml += '</p>';
        paragraphs.push(paragraphHtml);
      }
    });
    
    // 如果没有内容，至少返回一个空段落
    if (paragraphs.length === 0) {
      return '<p></p>';
    }
    
    return paragraphs.join('');
  };

  // HTML 转义函数
  const escapeHtml = (text) => {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  };

  // 当 value prop 变化时，同步编辑器内容
  useEffect(() => {
    if (editor && value !== undefined) {
      try {
        const currentEditorValue = serializeToText(editor);
        const normalizedCurrent = currentEditorValue || '';
        const normalizedValue = (value || '').toString();
        
        // 只有内容真正改变时才更新
        if (normalizedValue !== normalizedCurrent) {
          isUpdatingFromOutside.current = true;
          
          // 将纯文本转换为 HTML（识别变量）
          const htmlContent = parseTextToContent(normalizedValue);
          
          // 使用 queueMicrotask 延迟执行，避免在 React 渲染期间调用 setContent
          // 这样可以避免 flushSync 警告
          queueMicrotask(() => {
            // 设置内容（使用 HTML 格式，这样变量会被 TiptapVariable 解析为节点）
            editor.commands.setContent(htmlContent, false);
            
            // 确保所有变量都被正确识别
            setTimeout(() => {
              ensureVariablesAreRecognized(editor);
              isUpdatingFromOutside.current = false;
            }, 10);
          });
        } else {
          isUpdatingFromOutside.current = false;
        }
      } catch (error) {
        console.error('Error setting content:', error);
        isUpdatingFromOutside.current = false;
      }
    }
  }, [value, editor]);

  // 暴露方法给父组件（保持与原有 API 兼容）
  useImperativeHandle(ref, () => ({
    insertVariable: (key) => {
      if (editor) {
        // 直接插入变量文本，输入规则会自动将其转换为变量节点
        editor.chain().focus().insertContent(`{{${key}}}`).run();
      }
    },
    focus: () => {
      editor?.commands.focus();
    },
  }), [editor]);
  
  // 准备 EditorContext 的值
  const editorContextValue = {
    banks, 
    categories, 
    activeTemplate, 
    language, 
    onVariableClick, 
    defaults,
  };

  // 如果编辑器未初始化，显示加载状态或空内容
  if (!editor) {
    return (
      <EditorContext.Provider value={editorContextValue}>
        <div className="relative w-full h-full overflow-hidden" />
      </EditorContext.Provider>
    );
  }

  return (
    <EditorContext.Provider value={editorContextValue}>
      <div className="relative w-full h-full overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </EditorContext.Provider>
  );
});

PlainTextEditor.displayName = 'PlainTextEditor';
