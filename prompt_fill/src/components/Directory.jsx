import React, { useState } from 'react';
import { ChevronRight, Folder, Pencil, Copy, Trash2 } from 'lucide-react';
import { getLocalized } from '../utils/helpers';

// A single template item - extracted for clarity
const TemplateItem = ({ t_item, activeTemplateId, setActiveTemplateId, onRenameTemplate, saveTemplateName, editingTemplateNameId, tempTemplateName, setTempTemplateName, language, onDuplicateTemplate, onDeleteTemplate, displayTag, t }) => (
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
                <button title={t('duplicate')} onClick={(e) => onDuplicateTemplate(t_item, e)} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-400 hover:text-orange-600"><Copy size={13} /></button>
                <button title={t('delete')} onClick={(e) => onDeleteTemplate(t_item.id, e)} className="p-1.5 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500"><Trash2 size={13} /></button>
            </div>
          )}
      </div>
      {t_item.tags && t_item.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {t_item.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 text-[10px] rounded-full bg-gray-100 text-gray-600">
              {tag}
            </span>
          ))}
        </div>
      )}
  </div>
);


const Directory = ({ 
  name, 
  node, 
  level = 0, 
  path, 
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
}) => {
  const isOpen = isOpenDirectory(path);

  const hasChildren = node.children && Object.keys(node.children).length > 0;
  const hasTemplates = node.templates && node.templates.length > 0;

  if (!hasChildren && !hasTemplates) {
    return null;
  }
  
  const handleToggle = () => toggleDirectory(path);

  return (
    <div style={{ paddingLeft: `${level * 1}rem` }}>
      <button 
        onClick={handleToggle}
        className="flex items-center w-full text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 pt-2 hover:text-gray-600"
      >
        <ChevronRight size={14} className={`mr-1 transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
        <Folder size={14} className="mr-2" />
        <span>{name === 'uncategorized' ? t('uncategorized') : displayTag(name)}</span>
      </button>

      {isOpen && (
        <div className="mt-2">
          {hasChildren && (
            <div className="space-y-1">
              {Object.entries(node.children).map(([childName, childNode]) => {
                const childPath = path ? `${path}/${childName}` : childName;
                return (
                  <Directory 
                    key={childName} 
                    name={childName} 
                    node={childNode} 
                    level={level + 1} 
                    path={childPath} 
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
                )
              })}
            </div>
          )}
          
          {hasTemplates && (
            <div className="grid grid-cols-1 gap-2.5 mt-2">
              {node.templates.map(t_item => (
                <TemplateItem 
                  key={t_item.id} 
                  t_item={t_item} 
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
                    t
                  }}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Directory;
