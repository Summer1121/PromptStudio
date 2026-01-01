// VisualEditor 组件 - 可视化编辑器
import React, { useRef } from 'react';
import { CATEGORY_STYLES } from '../constants/styles';
import { getLocalized } from '../utils/helpers';

export const VisualEditor = React.forwardRef(({ value, onChange, banks, categories, isEditing, onVariableClick, activeTemplate, defaults, language }, ref) => {
  const preRef = useRef(null);

  const handleScroll = (e) => {
    if (preRef.current) {
      preRef.current.scrollTop = e.target.scrollTop;
    }
  };

  const renderHighlights = (text) => {
    if (!text || typeof text !== 'string') return null;
    const parts = text.split(/(\{\{[^{}\n]+\}\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2).trim();
        const bank = banks[key];
        const categoryId = bank?.category || 'other';
        const colorKey = categories[categoryId]?.color || 'slate';
        const style = CATEGORY_STYLES[colorKey];

        if (isEditing) {
          return (
            <button
              key={i}
              onClick={(e) => onVariableClick && onVariableClick(key, e)}
              className={`${style.bg} ${style.text} font-bold rounded-sm cursor-pointer`}
            >
              {part}
            </button>
          );
        } else {
          const selectionKey = `${activeTemplate.id}-${key}`;
          const selectionIndex = activeTemplate.selections?.[selectionKey];
          let content = part;

          if (selectionIndex !== undefined && bank) {
            content = getLocalized(bank.options[selectionIndex], language);
          } else {
            const defaultIndex = defaults[key];
            if (defaultIndex !== undefined && bank) {
              content = getLocalized(bank.options[defaultIndex], language);
            }
          }

          return (
            <button
              key={i}
              onClick={(e) => {
                console.log('Variable clicked in VisualEditor');
                onVariableClick && onVariableClick(key, e);
              }}
              className={`${style.bg} ${style.text} font-bold rounded-sm cursor-pointer`}
            >
              {content}
            </button>
          );
        }
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="relative w-full h-full overflow-hidden bg-gray-50">
      {/* Backdrop */}
      <pre
        ref={preRef}
        className={`absolute inset-0 p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words m-0 ${isEditing ? 'text-transparent pointer-events-none' : 'text-gray-800 pointer-events-auto'}`}
        style={{ fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }} 
        aria-hidden="true"
      >
        {renderHighlights(value)}
        <br />
      </pre>

      {/* Textarea */}
      <textarea
        ref={ref}
        value={value}
        onChange={onChange}
        onScroll={handleScroll}
        readOnly={!isEditing}
        className={`absolute inset-0 w-full h-full p-8 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words bg-transparent caret-gray-800 resize-none focus:outline-none overflow-auto z-10 m-0 selection:bg-orange-200 selection:text-orange-900 ${isEditing ? 'text-gray-800 pointer-events-auto' : 'text-transparent pointer-events-none'}`}
        style={{ fontFamily: 'Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}
        spellCheck={false}
      />
    </div>
  );
});

VisualEditor.displayName = 'VisualEditor';