import React from 'react';
import { Search, RotateCcw, Globe, Settings, ArrowUpDown, Home, Pencil, Copy as CopyIcon, Download, Trash2, Plus, FoldVertical } from 'lucide-react';
import { getLocalized } from '../utils/helpers';
import Directory from './Directory';
import { TagFilterDropdown } from './TagFilterDropdown';

export const TemplatesSidebar = React.memo(({
  templates, // Now a tree structure
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
  tagTree,
  onManageTags,
  isOpenDirectory,
  toggleDirectory,
  collapseAllDirectories
}) => {

  return (
    <div className="relative flex flex-col flex-shrink-0 h-full w-full border-r border-gray-200 bg-white overflow-hidden">
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
            <div className="flex items-start gap-2 pb-1">
                <TagFilterDropdown 
                  tagTree={tagTree} 
                  selectedTags={selectedTags} 
                  setSelectedTags={setSelectedTags} 
                  t={t} 
                />
                <button onClick={collapseAllDirectories} className="flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-all border bg-gray-100 text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500" title={t('collapse_all')}><FoldVertical size={16} /></button>
                <button onClick={onManageTags} className="flex-shrink-0 px-3 py-2 rounded-lg text-sm transition-all border bg-gray-100 text-gray-500 border-gray-200 hover:border-orange-200 hover:text-orange-500">{t('manage_tags')}</button>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-4 custom-scrollbar">
            <div className="space-y-4">
              {Object.entries(templates).map(([name, node]) => (
                <Directory 
                  key={name}
                  name={name}
                  node={node}
                  path={name}
                  // Pass down all relevant props
                  {...{
                    activeTemplateId,
                    setActiveTemplateId,
                    onRenameTemplate,
                    saveTemplateName,
                    editingTemplateNameId,
                    setEditingTemplateNameId,
                    tempTemplateName,
                    setTempTemplateName,
                    language,
                    onDuplicateTemplate,
                    onDeleteTemplate,
                    displayTag,
                    t,
                    isOpenDirectory,
                    toggleDirectory
                  }}
                />
              ))}
            </div>
        </div>        <div className="flex-shrink-0 p-4 border-t border-gray-200/50 bg-white">
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