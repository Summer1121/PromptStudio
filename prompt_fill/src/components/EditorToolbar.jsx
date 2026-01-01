import React from 'react';
import { FileText, Copy, Edit3, Check } from 'lucide-react';
import { getLocalized } from '../utils/helpers';

export const EditorToolbar = React.memo(({ 
  activeTemplate,
  onCopy,
  copied,
  isEditing,
  setIsEditing,
  t,
  language
}) => {

  if (!activeTemplate) {
    return (
      <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center px-6 flex-shrink-0 z-20">
        <span className="text-gray-400">{t('no_template_selected')}</span>
      </div>
    );
  }

  return (
    <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 flex-shrink-0 z-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
            <FileText size={20} className="text-orange-500" />
        </div>
        <div>
            <h2 className="font-bold text-gray-800 text-base leading-tight">{getLocalized(activeTemplate.name, language)}</h2>
            <p className="text-xs text-gray-500 leading-tight mt-0.5">by {activeTemplate.author || 'Unknown'}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={onCopy}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${
            copied
              ? 'bg-green-500 text-white'
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {copied ? <Check size={16} /> : <Copy size={16} />}
          {copied ? t('copied') : t('copy')}
        </button>
        <button
          onClick={() => setIsEditing(!isEditing)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 border ${
            isEditing
              ? 'bg-orange-500 text-white border-orange-500'
              : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
          }`}
        >
          {isEditing ? <Check size={16} /> : <Edit3 size={16} />}
          {isEditing ? t('done') : t('edit')}
        </button>
      </div>
    </div>
  );
});

EditorToolbar.displayName = 'EditorToolbar';