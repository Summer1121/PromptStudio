import React, { useMemo, useEffect, useRef } from 'react';
import { marked } from 'marked';
import { getLocalized } from '../utils/helpers';
import { CATEGORY_STYLES } from '../constants/styles';

// 配置 marked
marked.setOptions({
  breaks: true, // 支持换行
  gfm: true, // GitHub Flavored Markdown
});

/**
 * Markdown 预览组件
 * 渲染 Markdown 文本，并将变量替换为实际值
 */
export const MarkdownPreview = ({ 
  content, 
  banks, 
  categories, 
  activeTemplate, 
  defaults, 
  language 
}) => {
  // 处理内容：替换变量为实际值
  // 注意：只有在有明确选择时才替换，否则显示变量名
  const processedContent = useMemo(() => {
    if (!content) return '';
    
    // 替换所有变量 {{key}} 为实际值
    // 只有在模板有明确选择时才替换，否则保持变量名
    let processed = content;
    const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    
    processed = processed.replace(variableRegex, (match, key) => {
      // 默认显示变量名
      let value = `{{${key}}}`;
      
      // 只有在模板有明确选择时才替换
      if (activeTemplate?.selections) {
        // 查找所有相关的 selectionKey
        const selectionKeys = Object.keys(activeTemplate.selections).filter(
          sk => sk.startsWith(`${activeTemplate.id}-${key}-`)
        );
        
        if (selectionKeys.length > 0) {
          // 使用第一个找到的选择
          const selectionKey = selectionKeys[0];
          const selectionIndex = activeTemplate.selections[selectionKey];
          const bank = banks?.[key];
          if (bank && bank.options && bank.options[selectionIndex] !== undefined) {
            value = getLocalized(bank.options[selectionIndex], language);
          }
        }
      }
      
      // 如果没有选择，保持变量名不变
      return value;
    });
    
    return processed;
  }, [content, banks, activeTemplate, defaults, language]);
  
  // 将 Markdown 转换为 HTML
  const htmlContent = useMemo(() => {
    if (!processedContent) return '';
    
    try {
      return marked.parse(processedContent);
    } catch (error) {
      console.error('Error parsing Markdown:', error);
      return processedContent.replace(/\n/g, '<br>');
    }
  }, [processedContent]);
  
  const contentRef = useRef(null);
  
  // 在渲染后手动处理变量染色
  useEffect(() => {
    if (!contentRef.current || !content || !banks || !categories) return;
    
    const container = contentRef.current;
    const variableRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
    const variableMap = new Map(); // key -> { value, style }
    
    // 收集所有变量及其对应的值和样式
    let match;
    while ((match = variableRegex.exec(content)) !== null) {
      const key = match[1];
      if (!variableMap.has(key)) {
        const bank = banks?.[key];
        const categoryId = bank?.category || 'other';
        const colorKey = categories?.[categoryId]?.color || 'slate';
        const style = CATEGORY_STYLES[colorKey] || CATEGORY_STYLES.slate;
        
        // 获取变量的实际值
        // 只有在有明确选择时才替换，否则显示变量名
        let value = `{{${key}}}`;
        
        if (activeTemplate?.selections) {
          const selectionKeys = Object.keys(activeTemplate.selections).filter(
            sk => sk.startsWith(`${activeTemplate.id}-${key}-`)
          );
          if (selectionKeys.length > 0) {
            const selectionKey = selectionKeys[0];
            const selectionIndex = activeTemplate.selections[selectionKey];
            const bank = banks?.[key];
            if (bank && bank.options && bank.options[selectionIndex] !== undefined) {
              value = getLocalized(bank.options[selectionIndex], language);
            }
          }
        }
        
        // 如果没有选择，保持变量名，但也要添加样式
        // 这样变量名也会被染色显示
        const variableName = `{{${key}}}`;
        variableMap.set(key, { value, style, variableName });
      }
    }
    
    // 为每个变量值或变量名添加样式
    variableMap.forEach(({ value, style, variableName }, key) => {
      // 确定要搜索的值：如果有实际值就搜索实际值，否则搜索变量名
      const searchValue = value !== variableName ? value : variableName;
      
      // 使用 TreeWalker 查找所有文本节点
      const walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: (node) => {
            // 跳过已经在样式标签内的节点
            let parent = node.parentElement;
            while (parent && parent !== container) {
              if (parent.classList.contains(style.bg.split(' ')[0])) {
                return NodeFilter.FILTER_REJECT;
              }
              parent = parent.parentElement;
            }
            // 匹配变量值或变量名
            return node.textContent.includes(searchValue)
              ? NodeFilter.FILTER_ACCEPT 
              : NodeFilter.FILTER_REJECT;
          }
        },
        false
      );
      
      const textNodes = [];
      let node;
      while (node = walker.nextNode()) {
        textNodes.push(node);
      }
      
      // 处理每个文本节点
      textNodes.forEach(textNode => {
        const text = textNode.textContent;
        
        if (!text.includes(searchValue)) return;
        
        const parts = text.split(searchValue);
        if (parts.length < 2) return;
        
        const fragment = document.createDocumentFragment();
        
        parts.forEach((part, index) => {
          if (part) {
            fragment.appendChild(document.createTextNode(part));
          }
          if (index < parts.length - 1) {
            const span = document.createElement('span');
            span.className = `${style.bg} ${style.text} font-bold rounded-sm px-1`;
            span.textContent = searchValue;
            fragment.appendChild(span);
          }
        });
        
        if (textNode.parentNode) {
          textNode.parentNode.replaceChild(fragment, textNode);
        }
      });
    });
  }, [htmlContent, content, banks, categories, activeTemplate, defaults, language]);
  
  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 bg-white">
      <div 
        ref={contentRef}
        className="prose prose-sm max-w-none"
        dangerouslySetInnerHTML={{ __html: htmlContent }}
        style={{
          fontFamily: 'monospace',
          fontSize: '14px',
          lineHeight: '1.6',
        }}
      />
    </div>
  );
};
