import React from 'react';
import { X } from 'lucide-react';

/**
 * 仅展示智能评价（无 suggestedContent 时）
 */
export const OptimizeEvalModal = ({ evaluation, onClose, t }) => (
  <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh]">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
        <h3 className="font-bold text-gray-800">{t('optimize_eval_title')}</h3>
        <button onClick={onClose} className="p-1 hover:bg-gray-200 rounded text-gray-500">
          <X size={18} />
        </button>
      </div>
      <div className="p-4 overflow-y-auto text-sm text-gray-700 whitespace-pre-wrap flex-1">
        {evaluation || ''}
      </div>
      <div className="p-4 border-t border-gray-200 flex justify-end">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-200 text-gray-800 hover:bg-gray-300"
        >
          {t('done')}
        </button>
      </div>
    </div>
  </div>
);
