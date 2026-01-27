import React, { useRef } from 'react';
import { FileText, Copy, Check, Tag, GitCompareArrows, History, Sparkles, Loader2, Wrench } from 'lucide-react';
import { getLocalized } from '../utils/helpers';

export const EditorToolbar = React.memo(({
  activeTemplate,
  onCopy,
  copied,
  isDraft,
  t,
  language,
  onSaveAsNew,
  onGenerate,
  onUpdateTemplate,
  onOpenTagMenu,
  onOpenHistory,
  onOpenDiff,
  onOptimize,
  optimizeStatus = null,
  onOpenToolMenu,
  selectedTools = [],
}) => {
  const tagButtonRef = useRef(null);
  const historyButtonRef = useRef(null);
  const toolButtonRef = useRef(null);

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
        {isDraft && (
          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={onOpenDiff}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 bg-yellow-500 text-white hover:bg-yellow-600"
            >
              <GitCompareArrows size={16} />
              {t('diff')}
            </button>
            <button
              onClick={onSaveAsNew}
              className="px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 bg-green-500 text-white hover:bg-green-600"
            >
              {t('save_as_new_template')}
            </button>
          </div>
        )}
        
        <button
          onClick={onOptimize}
          disabled={!!optimizeStatus}
          className="px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 bg-orange-100 text-orange-600 hover:bg-orange-200 disabled:opacity-70 disabled:cursor-not-allowed"
        >
          {optimizeStatus ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {optimizeStatus === 'requesting'
            ? t('optimize_requesting')
            : optimizeStatus === 'optimizing'
              ? t('optimize_optimizing')
              : t('smart_evaluate_optimize')}
        </button>

        <div className="relative">
          <button
            ref={toolButtonRef}
            onClick={(e) => onOpenToolMenu && onOpenToolMenu(e.currentTarget.getBoundingClientRect())}
            className={`p-2 rounded-lg text-sm font-semibold transition-all duration-200 flex items-center gap-2 ${selectedTools.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
            title="Attach Tools"
          >
            <Wrench size={16} />
            {selectedTools.length > 0 && <span className="text-xs bg-orange-200 px-1.5 rounded-full">{selectedTools.length}</span>}
          </button>
        </div>

        <div className="relative">
          <button
            ref={historyButtonRef}
            onClick={(e) => onOpenHistory(e.currentTarget.getBoundingClientRect())}
            className="px-3 py-2 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2 bg-gray-100 text-gray-600 hover:bg-gray-200"
          >
            <History size={14} />
            v{activeTemplate.version || 1}
          </button>
        </div>

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
      </div>
    </div>
  );
});

EditorToolbar.displayName = 'EditorToolbar';