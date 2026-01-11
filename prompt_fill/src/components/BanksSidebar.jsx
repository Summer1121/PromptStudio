import React, { useState, useEffect } from 'react';
import { Settings, ChevronRight, ChevronDown, FoldVertical, X } from 'lucide-react';
import { CATEGORY_STYLES } from '../constants/styles';
import { getLocalized } from '../utils/helpers';

const CategorySection = ({ catId, categories, banks, onInsert, t, language, isCollapsed, onToggle }) => {
  const category = categories[catId];
  if (!category) return null;

  const catBanks = Object.entries(banks).filter(([_, bank]) => (bank.category || 'other') === catId);
  if (catBanks.length === 0) return null;

  const style = CATEGORY_STYLES[category.color] || CATEGORY_STYLES.slate;

  return (
    <div>
      <div
        className="flex items-center gap-2 mb-2 cursor-pointer p-2 rounded-md hover:bg-gray-200"
        onClick={onToggle}
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
        <h3 className={`text-xs font-bold uppercase ${style.text}`}>{getLocalized(category.label, language)}</h3>
      </div>
      {!isCollapsed && (
        <div className="space-y-2 pl-4">
          {catBanks.map(([key, bank]) => (
            <BankGroup
              key={key}
              bankKey={key}
              bank={bank}
              onInsert={onInsert}
              t={t}
              language={language}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const BankGroup = ({ bankKey, bank, onInsert, t, language }) => {
  const handleDragStart = (e) => {
    e.dataTransfer.setData('text/plain', `{{${bankKey}}}`);
  };

  return (
    <div
      draggable="true"
      onDragStart={handleDragStart}
      className="p-2 border rounded-md cursor-grab bg-white hover:bg-gray-50"
      onClick={() => onInsert(bankKey)}
    >
      <p className="text-sm font-medium">{getLocalized(bank.label, language)}</p>
      <code className="text-xs text-gray-500">{`{{${bankKey}}}`}</code>
    </div>
  );
};

export const BanksSidebar = React.memo(({ categories, banks, onInsert, t, language }) => {
  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [collapsedState, setCollapsedState] = useState({});

  useEffect(() => {
    const initialState = {};
    Object.keys(categories).forEach(catId => {
      initialState[catId] = true;
    });
    setCollapsedState(initialState);
  }, [categories]);

  const handleToggleCategory = (catId) => {
    setCollapsedState(prev => ({
      ...prev,
      [catId]: !prev[catId],
    }));
  };

  const collapseAll = () => {
    const newState = {};
    Object.keys(categories).forEach(catId => {
      newState[catId] = true;
    });
    setCollapsedState(newState);
  };

  if (!isWindowOpen) {
    return (
      <button
        onClick={() => setIsWindowOpen(true)}
        className="fixed top-1/2 right-0 -translate-y-1/2 z-40 p-3 bg-white border border-r-0 border-gray-200 rounded-l-lg shadow-lg hover:bg-gray-100"
        title={t('bank_config')}
      >
        <Settings size={20} className="text-gray-700" />
      </button>
    );
  }

  return (
    <div className="fixed top-0 right-0 h-full w-[340px] z-50 bg-gray-50 border-l border-gray-200 shadow-2xl flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-gray-600" />
          <h2 className="text-sm font-bold text-gray-800">{t('bank_config')}</h2>
        </div>
        <div className="flex items-center gap-2">
            <button onClick={collapseAll} className="p-1.5 hover:bg-gray-200 rounded-md" title={t('collapse_all')}>
                <FoldVertical size={16} className="text-gray-600" />
            </button>
            <button onClick={() => setIsWindowOpen(false)} className="p-1.5 hover:bg-gray-200 rounded-md" title={t('close')}>
                <X size={16} className="text-gray-600" />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <div className="space-y-4">
          {Object.keys(categories).map(catId => (
            <CategorySection
              key={catId}
              catId={catId}
              categories={categories}
              banks={banks}
              onInsert={onInsert}
              t={t}
              language={language}
              isCollapsed={collapsedState[catId] ?? true}
              onToggle={() => handleToggleCategory(catId)}
            />
          ))}
        </div>
      </div>
    </div>
  );
});

BanksSidebar.displayName = 'BanksSidebar';