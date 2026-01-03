import React, { useState, useEffect, useRef } from 'react';
import { FileText, Copy, Edit3, Check, Sparkles, Tag } from 'lucide-react';
import { getLocalized } from '../utils/helpers';

export const EditorToolbar = React.memo(({
  activeTemplate,
  onCopy,
  copied,
  isEditing,
  setIsEditing,
  isDirty,
  t,
  language,
  editedPreviewContent,
  onSaveAsNew,
  onOverwrite,
  onGenerate,
  allTags,
  onUpdateTemplate,
  onOpenTagMenu,
  onCloseTagMenu,
}) => {
  const tagButtonRef = useRef(null);

  if (!activeTemplate) {
    return (
      <div className="h-16 border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center px-6 flex-shrink-0 z-20">
        <span className="text-gray-400">{t('no_template_selected')}</span>
      </div>
    );
  }

  return (
    <div className="border-b border-gray-200 bg-white/80 backdrop-blur-sm flex items-center justify-between px-6 py-2 flex-wrap z-20">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white rounded-lg shadow-sm border border-gray-100">
            <FileText size={20} className="text-orange-500" />
        </div>
        <div>
            <h2 className="font-bold text-gray-800 text-base leading-tight">{getLocalized(activeTemplate.name, language)}</h2>
            <div className="flex items-center gap-2">
              <p className="text-xs text-gray-500 leading-tight mt-0.5">by {activeTemplate.author || 'Unknown'}</p>
              {activeTemplate.tags && activeTemplate.tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {activeTemplate.tags.map(tag => (
                    <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {(isDirty || editedPreviewContent) && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onOverwrite}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600"
            >
              {t('overwrite_template')}
            </button>
            <button
              onClick={onSaveAsNew}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
            >
              {t('save_as_new_template')}
            </button>
          </div>
        )}
        
        <div className="relative">
          <button
            ref={tagButtonRef}
            onClick={(e) => onOpenTagMenu(e.currentTarget.getBoundingClientRect())}
            className="p-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <Tag size={16} />
          </button>
        </div>

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