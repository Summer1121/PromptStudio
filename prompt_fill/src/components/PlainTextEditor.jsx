import React, { useEffect, useImperativeHandle, useRef, useState, useCallback } from 'react';
import { CATEGORY_STYLES } from '../constants/styles';
import { getLocalized } from '../utils/helpers';

/**
 * 纯文本编辑器组件
 * 读取 markdown 格式内容，将 {{}} 包裹的变量做染色渲染
 * 参考 PromptFill 项目的实现方式
 */
export const PlainTextEditor = React.forwardRef((
  { value, onUpdate, banks, categories, onVariableClick, activeTemplate, defaults, language }, 
  ref
) => {
  const textareaRef = useRef(null);
  const highlightLayerRef = useRef(null);
  const [highlightedContent, setHighlightedContent] = useState('');
  
  // 高亮变量 {{variable}}，参考 VariableNode 的实现
  const highlightText = useCallback((text) => {
    if (!text) return '';
    
    // 转义 HTML 特殊字符
    const escapeHtml = (str) => {
      const div = document.createElement('div');
      div.textContent = str;
      return div.innerHTML;
    };
    
    let highlighted = escapeHtml(text);
    
    // 高亮变量 {{variable}}
    // 参考 VariableNode：如果有选择的值，显示实际值；否则显示变量名
    highlighted = highlighted.replace(
      /\{\{([a-zA-Z0-9_]+)\}\}/g,
      (match, key) => {
        const bank = banks?.[key];
        const categoryId = bank?.category || 'other';
        const colorKey = categories?.[categoryId]?.color || 'slate';
        const style = CATEGORY_STYLES[colorKey] || CATEGORY_STYLES.slate;
        
        // 检查是否有选择的值（参考 VariableNode 的逻辑）
        let displayContent = match; // 默认显示变量名
        if (activeTemplate?.selections && bank) {
          // 查找所有相关的 selectionKey
          const selectionKeys = Object.keys(activeTemplate.selections).filter(
            sk => sk.startsWith(`${activeTemplate.id}-${key}-`)
          );
          
          if (selectionKeys.length > 0) {
            const selectionKey = selectionKeys[0];
            const selectionIndex = activeTemplate.selections[selectionKey];
            if (bank.options && bank.options[selectionIndex] !== undefined) {
              displayContent = getLocalized(bank.options[selectionIndex], language);
            }
          }
        }
        
        // 参考 VariableNode：添加 cursor-pointer 和样式
        return `<span class="${style.bg} ${style.text} font-bold rounded-sm px-1 cursor-pointer select-none" data-variable-key="${key}" data-variable-clickable="true">${escapeHtml(displayContent)}</span>`;
      }
    );
    
    return highlighted;
  }, [banks, categories, activeTemplate, language]);
  
  // 更新高亮内容
  useEffect(() => {
    if (value !== undefined) {
      setHighlightedContent(highlightText(value));
    }
  }, [value, highlightText]);
  
  // 处理变量点击：参考 VariableNode 的 handleClick
  const handleVariableClick = useCallback((e) => {
    const variableElement = e.target.closest('[data-variable-clickable="true"]');
    if (!variableElement) return;
    
    const key = variableElement.dataset.variableKey;
    if (!key || !onVariableClick) return;
    
    // 参考 VariableNode：调用 onVariableClick，传入 key, event, position
    const textarea = textareaRef.current;
    if (textarea) {
      const text = textarea.value;
      const variableRegex = new RegExp(`\\{\\{${key}\\}\\}`, 'g');
      let match;
      let position = 0;
      
      // 找到第一个匹配的位置
      while ((match = variableRegex.exec(text)) !== null) {
        position = match.index;
        break;
      }
      
      // 参考 VariableNode：调用 onVariableClick 打开选择器
      const mockEvent = {
        ...e,
        target: textarea,
      };
      
      onVariableClick(key, mockEvent, position);
    }
  }, [onVariableClick]);
  
  // 为变量元素添加点击事件
  useEffect(() => {
    const highlightLayer = highlightLayerRef.current;
    if (!highlightLayer) return;
    
    const variableElements = highlightLayer.querySelectorAll('[data-variable-clickable="true"]');
    const clickHandlers = new Map();
    
    variableElements.forEach((element) => {
      // 参考 VariableNode：让变量可以点击
      element.style.pointerEvents = 'auto';
      element.style.cursor = 'pointer';
      
      const clickHandler = (e) => {
        e.preventDefault();
        e.stopPropagation();
        handleVariableClick(e);
      };
      
      clickHandlers.set(element, clickHandler);
      element.addEventListener('click', clickHandler);
    });
    
    return () => {
      clickHandlers.forEach((handler, element) => {
        element.removeEventListener('click', handler);
      });
      clickHandlers.clear();
    };
  }, [highlightedContent, handleVariableClick]);
  
  // 同步滚动
  const handleScroll = () => {
    if (textareaRef.current && highlightLayerRef.current) {
      highlightLayerRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightLayerRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };
  
  // 处理文本变化
  const handleChange = (e) => {
    if (onUpdate) {
      onUpdate(e.target.value);
    }
  };
  
  // 暴露方法给父组件
  useImperativeHandle(ref, () => ({
    insertVariable: (key) => {
      const textarea = textareaRef.current;
      if (textarea) {
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const newText = `${text.substring(0, start)}{{${key}}}${text.substring(end)}`;
        
        textarea.value = newText;
        textarea.focus();
        textarea.setSelectionRange(start + key.length + 4, start + key.length + 4);
        
        if (onUpdate) {
          onUpdate(newText);
        }
      }
    },
    focus: () => {
      textareaRef.current?.focus();
    },
  }), [onUpdate]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {/* 高亮层：显示变量染色，参考 VariableNode 的显示逻辑 */}
      <div
        ref={highlightLayerRef}
        className="highlight-layer"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          pointerEvents: 'none', // 默认穿透，变量元素单独设置
          overflow: 'auto',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          padding: 'inherit',
          font: 'inherit',
          color: '#000',
        }}
        dangerouslySetInnerHTML={{ __html: highlightedContent }}
      />
      
      {/* 输入层 */}
      <textarea
        ref={textareaRef}
        value={value || ''}
        onChange={handleChange}
        onScroll={handleScroll}
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          color: 'transparent',
          background: 'transparent',
          border: 'none',
          outline: 'none',
          resize: 'none',
          caretColor: '#000',
          padding: 'inherit',
          font: 'inherit',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          pointerEvents: 'auto',
        }}
        spellCheck={false}
      />
    </div>
  );
});

PlainTextEditor.displayName = 'PlainTextEditor';
