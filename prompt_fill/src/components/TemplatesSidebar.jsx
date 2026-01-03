import React from 'react';
import { Search, RotateCcw, Globe, Settings, ArrowUpDown, Home, Pencil, Copy as CopyIcon, Download, Trash2, Plus } from 'lucide-react';
import { getLocalized } from '../utils/helpers';

export const TemplatesSidebar = React.memo(({ 
  templates,
  activeTemplateId,
  setActiveTemplateId, 
  onAddTemplate,
  onDuplicateTemplate,
  onDeleteTemplate,
  onRenameTemplate,
  saveTemplateName,
  editingTemplateNameId,
  setEditingTemplateNameId,
  tempTemplateName,
  setTempTemplateName,
  tempTemplateAuthor,
  setTempTemplateAuthor,
  handleResetTemplate,
  handleExportTemplate,
  language,
  setLanguage,
  t,
  displayTag,
  searchQuery,
  setSearchQuery,
  selectedTags,
  setSelectedTags,
  sortOrder,
  setSortOrder,
  isSortMenuOpen,
  setIsSortMenuOpen,
  setRandomSeed,
  setDiscoveryView,
  setIsSettingsOpen,
  tags,
  onManageTags
}) => {

  return (
    <div className="relative flex flex-col flex-shrink-0 h-full w-[380px] border-r border-gray-200 bg-white overflow-hidden">
      <div className="flex flex-col w-full h-full">
        <div className="flex-shrink-0 p-5 border-b border-gray-200 bg-white">
          <div className="flex items-center justify-between mb-3">
              <h1 className="font-bold tracking-tight text-sm text-orange-500">提示词填空器</h1>
              <div className="flex items-center gap-1.5">
                    <button onClick={() => setDiscoveryView(true)} className="p-1.5 rounded-lg transition-all text-orange-500 bg-orange-50/50 hover:text-orange-600 hover:bg-orange-100 shadow-sm" title={t('back_to_discovery')}><Home size={18} /></button>
                    <button onClick={handleResetTemplate} className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-orange-600 hover:bg-orange-50" title={t('refresh_desc')}><RotateCcw size={16} /></button>
                    <div className="relative">
                      <button onClick={() => setIsSortMenuOpen(!isSortMenuOpen)} className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-orange-600 hover:bg-orange-50" title={t('sort')}><ArrowUpDown size={16} /></button>
                      {isSortMenuOpen && (
                        <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[140px] z-[100]">
                          {[
                            { value: 'newest', label: t('sort_newest') },
                            { value: 'oldest', label: t('sort_oldest') },
                            { value: 'a-z', label: t('sort_az') },
                            { value: 'z-a', label: t('sort_za') },
                            { value: 'random', label: t('sort_random') }
                          ].map(option => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSortOrder(option.value);
                                if (option.value === 'random') setRandomSeed(Date.now());
                                setIsSortMenuOpen(false);
                              }}
                              className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 transition-colors ${sortOrder === option.value ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <button onClick={() => setLanguage(language === 'cn' ? 'en' : 'cn')} className="text-[10px] px-2 py-1 rounded-full border transition-colors flex items-center gap-1 shadow-sm bg-transparent text-gray-400 border-gray-200 hover:text-orange-600 hover:bg-orange-50"><Globe size={10} />{language.toUpperCase()}</button>
                    <button onClick={() => setIsSettingsOpen(true)} className="p-1.5 rounded-lg transition-colors text-gray-400 hover:text-orange-600 hover:bg-orange-50" title={t('settings')}><Settings size={16} /></button>
              </div>
          </div>
          <div className="flex flex-col gap-3">
            <div className="relative group">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={14} />
                <input type="text" placeholder={t('search_templates')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-gray-100 border-none rounded-xl text-xs focus:ring-2 focus:ring-orange-500/20 transition-all outline-none" />
            </div>
            <div className="flex flex-wrap items-center gap-2 pb-1">
                <button onClick={() => setSelectedTags("")} className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${selectedTags === "" ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500'}`}>{t('all_templates')}</button>
                {(tags || []).map(tag => (<button key={tag} onClick={() => setSelectedTags(selectedTags === tag ? "" : tag)} className={`flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border ${selectedTags === tag ? 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/20' : 'bg-white text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500'}`}>{displayTag(tag)}</button>))}
                <button onClick={onManageTags} className="flex-shrink-0 px-3 py-1 rounded-full text-[10px] font-bold transition-all border bg-gray-100 text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500">{t('manage_tags')}</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <div className="space-y-4">
                {Object.entries(templates).map(([tag, templateList]) => (
                    <div key={tag}>
                        <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-2">{tag === 'uncategorized' ? t('uncategorized') : displayTag(tag)}</h3>
                        <div className="grid grid-cols-1 gap-2.5 mt-2">
                            {templateList.map(t_item => (
                                <div 
                                    key={t_item.id} 
                                    onClick={() => setActiveTemplateId(t_item.id)}
                                    className={`group flex flex-col p-4 rounded-2xl border transition-all duration-300 relative text-left cursor-pointer ${t_item.id === activeTemplateId ? 'bg-orange-50 border-orange-200 shadow-sm' : 'bg-white border-transparent hover:border-orange-100 hover:bg-orange-50/30'}`}
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2.5 overflow-hidden flex-1">
                                            {editingTemplateNameId === t_item.id ? (
                                              <div className="flex-1 flex flex-col gap-2" onClick={(e) => e.stopPropagation()}>
                                                  <input 
                                                      autoFocus
                                                      type="text" 
                                                      value={tempTemplateName}
                                                      onChange={(e) => setTempTemplateName(e.target.value)}
                                                      className="w-full px-2 py-1 text-sm font-bold border-b-2 border-orange-500 bg-transparent focus:outline-none"
                                                      onKeyDown={(e) => e.key === 'Enter' && saveTemplateName()}
                                                  />
                                              </div>
                                            ) : (
                                              <span className={`truncate text-sm transition-all ${activeTemplateId === t_item.id ? 'font-bold text-gray-900' : 'font-medium text-gray-700'}`}>{getLocalized(t_item.name, language)}</span>
                                            )}
                                        </div>
                                        
                                        {!editingTemplateNameId && (
                                          <div className={`flex items-center gap-1.5 ${activeTemplateId === t_item.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-all duration-300`}>
                                              <button title={t('rename')} onClick={(e) => onRenameTemplate(t_item, e)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600"><Pencil size={13} /></button>
                                              <button title={t('duplicate')} onClick={(e) => onDuplicateTemplate(t_item, e)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600"><CopyIcon size={13} /></button>
                                              <button title={t('delete')} onClick={(e) => onDeleteTemplate(t_item.id, e)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
                                          </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
        <div className="flex-shrink-0 p-4 border-t border-gray-200/50 bg-white">
            <button onClick={onAddTemplate} className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg font-medium transition-all duration-300 bg-orange-500 text-white hover:bg-orange-600 shadow-lg shadow-orange-500/30">
                <Plus size={16} />
                <span>{t('new_template')}</span>
            </button>
        </div>
      </div>
    </div>
  );
});

TemplatesSidebar.displayName = 'TemplatesSidebar';