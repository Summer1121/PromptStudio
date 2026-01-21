import React from 'react';
import { X, Undo2, Check } from 'lucide-react';
import diff from '../utils/diff';

export const DiffView = ({ originalContent, newContent, onClose, onReset, onApply, t, isHistoryDiff, evaluation, newVersionLabel }) => {
  const diffResult = diff(originalContent || '', newContent || '');
  const rightLabel = newVersionLabel || (isHistoryDiff ? t('current_version') : t('draft_version'));

  return (
    <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl overflow-hidden flex flex-col h-[80vh]">
        <div className="p-4 border-b border-gray-100 flex justify-between items-start bg-gray-50">
          <div>
            <h3 className="font-bold text-gray-800">{t('diff_view_title')}</h3>
            {evaluation && <p className="text-xs text-gray-600 mt-1 max-w-2xl">{evaluation}</p>}
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500 flex-shrink-0"><X size={18}/></button>
        </div>
        
        <div className="flex-1 p-4 overflow-y-auto font-mono text-xs">
          <div className="text-sm font-semibold mb-2 text-gray-500">{isHistoryDiff ? t('historical_version') : t('original_version')}</div>
          <pre className="text-xs p-4 rounded-lg bg-gray-100 whitespace-pre-wrap font-mono relative">
            <div className="absolute top-0 left-0 w-full h-full bg-white opacity-50 z-0"></div>
            {diffResult.map((part, index) => {
              const spanClass = part.type === 'added' 
                ? 'bg-green-100 text-green-800' 
                : part.type === 'deleted' 
                  ? 'bg-red-100 text-red-800' 
                  : '';
              
              const textDecoration = part.type === 'deleted' ? 'line-through' : '';

              return (
                <span 
                  key={index} 
                  className={`${spanClass} ${textDecoration} relative z-10`}
                  dangerouslySetInnerHTML={{ __html: part.content }}
                />
              );
            })}
          </pre>
          <div className="text-sm font-semibold mt-4 mb-2 text-green-600">{rightLabel}</div>
          <pre className="text-xs p-4 rounded-lg bg-green-50 whitespace-pre-wrap font-mono">
            {newContent}
          </pre>
        </div>

        <div className="p-4 border-t border-gray-200 bg-white flex justify-end gap-3">
          {!isHistoryDiff && ( // Conditionally render the Reset button
            <button
              onClick={onReset}
              className="px-4 py-2 text-sm font-semibold rounded-lg border border-gray-300 hover:bg-gray-100 flex items-center gap-2"
            >
              <Undo2 size={16} />
              {t('reset')}
            </button>
          )}
          <button
            onClick={onApply}
            className="px-4 py-2 text-sm font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-2"
          >
            <Check size={16} />
            {isHistoryDiff ? t('restore') : t('apply_changes')}
          </button>
        </div>
      </div>
    </div>
  );
};
