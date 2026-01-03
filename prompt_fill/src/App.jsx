import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { confirm, message } from '@tauri-apps/plugin-dialog';
import { TemplatesSidebar, BanksSidebar, EditorToolbar, VisualEditor } from './components';
import { VariablePicker } from './components/VariablePicker';
import MobileTabBar from './components/MobileTabBar';
import { TagManager } from './components/TagManager';
import { SettingsModal } from './components/SettingsModal';
import { readDataFile, writeDataFile } from './services/tauri-service';
import { getLocalized } from './utils/helpers';
import { INITIAL_TEMPLATES_CONFIG, TEMPLATE_TAG_TREE } from './data/templates';
import { INITIAL_BANKS, INITIAL_CATEGORIES, INITIAL_DEFAULTS } from './data/banks';
import { TRANSLATIONS } from './constants/translations';
import { TAG_LABELS } from './constants/styles';
import { Check } from 'lucide-react';

const App = () => {
  const APP_VERSION = "0.7.2"; // Final authoritative version with Tauri dialog

  // --- UI & Control State ---
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);

  // --- Core Data State ---
  const [templates, setTemplates] = useState([]);
  const [banks, setBanks] = useState({});
  const [categories, setCategories] = useState({});
  const [defaults, setDefaults] = useState({});
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [language, setLanguage] = useState("cn");
  const [templateLanguage, setTemplateLanguage] = useState("cn");
  const [tagTree, setTagTree] = useState(TEMPLATE_TAG_TREE);
  const [llmSettings, setLlmSettings] = useState({});
  
  // --- UI & Control State ---
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDiscoveryView, setDiscoveryView] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  
  // Sidebar filtering/sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // This will now represent an array of paths
  const [sortOrder, setSortOrder] = useState("newest");
  const [randomSeed, setRandomSeed] = useState(Date.now());
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [openDirectories, setOpenDirectories] = useState(null); // null: initial state, all open. {}: collapsed.

  const isOpenDirectory = (path) => {
    if (openDirectories === null) return true; // Default to all open initially
    return openDirectories[path] ?? false; // After first interaction, default to closed
  };

  const toggleDirectory = (path) => {
    const newOpenState = openDirectories === null 
      ? flatTags.reduce((acc, p) => ({ ...acc, [p]: true }), {}) 
      : openDirectories;
      
    setOpenDirectories({
      ...newOpenState,
      [path]: !(newOpenState[path] ?? false)
    });
  };

  const collapseAllDirectories = () => {
    setOpenDirectories({}); // Empty object means all are collapsed (defaults to false)
  };
  
  // Template renaming state
  const [editingTemplateNameId, setEditingTemplateNameId] = useState(null);
  const [tempTemplateName, setTempTemplateName] = useState("");
  const [tempTemplateAuthor, setTempTemplateAuthor] = useState("");
  const [copied, setCopied] = useState(false);
  const [variablePickerState, setVariablePickerState] = useState({
    visible: false,
    x: 0,
    y: 0,
    options: [],
    bankKey: null,
    variableIndex: null,
  });
  const [tagMenuState, setTagMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
    options: [], // This will be allTags
  });
  const [editedPreviewContent, setEditedPreviewContent] = useState(null);
  const [originalContentForDirtyCheck, setOriginalContentForDirtyCheck] = useState(null);
  const isPickerOpening = useRef(false);
  
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
  const [mobileTab, setMobileTab] = useState(isMobileDevice ? "home" : "editor");
  const textareaRef = useRef(null);

  const startResizing = useCallback(() => {
    setIsResizing(true);
  }, []);

  const stopResizing = useCallback(() => {
    setIsResizing(false);
  }, []);

  const resize = useCallback((e) => {
    if (isResizing) {
      const newWidth = e.clientX;
      if (newWidth >= 280 && newWidth <= 600) {
        setSidebarWidth(newWidth);
      }
    }
  }, [isResizing]);

  useEffect(() => {
    window.addEventListener('mousemove', resize);
    window.addEventListener('mouseup', stopResizing);
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resize, stopResizing]);
  
  // --- Data Persistence Layer (Tauri) ---
  useEffect(() => {
    const loadData = async () => {
      const savedData = await readDataFile();
      if (savedData && savedData.templates && savedData.templates.length > 0) {
        
        // --- Data Migration Logic ---
        // 1. Build a lookup map for leaf nodes to their full paths
        const leafToFullPathMap = {};
        const buildMap = (nodes, prefix) => {
          nodes.forEach(node => {
            const path = prefix ? `${prefix}/${node.name}` : node.name;
            // Only map the leaf node name if it's a child, to avoid ambiguity
            if (prefix) {
              leafToFullPathMap[node.name] = path;
            }
            if (node.children?.length > 0) {
              buildMap(node.children, path);
            }
          });
        };
        buildMap(TEMPLATE_TAG_TREE, '');

        // 2. Map over templates to migrate them
        const migratedTemplates = savedData.templates.map(t => {
          let currentTags = t.tags;

          // A. Migrate from old tagPath string to tags array if necessary
          if (t.tagPath && !currentTags) {
            currentTags = [t.tagPath];
          }

          let tagsUpdated = false;
          if (currentTags && Array.isArray(currentTags)) {
            // B. Fix leaf-only tags by replacing them with full paths
            const correctedTags = currentTags.map(tag => {
              if (tag && !tag.includes('/') && leafToFullPathMap[tag]) {
                tagsUpdated = true;
                return leafToFullPathMap[tag];
              }
              return tag;
            });
            
            if (tagsUpdated) {
              // C. Deduplicate tags after correction
              currentTags = [...new Set(correctedTags)];
            }
          }

          const newTemplate = { ...t, tags: currentTags || [] };
          delete newTemplate.tagPath; // Ensure old property is always removed
          return newTemplate;
        });
        // --- End of Migration Logic ---

        setTemplates(migratedTemplates);
        setBanks(savedData.banks || INITIAL_BANKS);
        setCategories(savedData.categories || INITIAL_CATEGORIES);
        setDefaults(savedData.defaults || INITIAL_DEFAULTS);
        setLanguage(savedData.language || 'cn');
        setTemplateLanguage(savedData.templateLanguage || 'cn');
        setTagTree(savedData.tagTree || TEMPLATE_TAG_TREE);
        setLlmSettings(savedData.llmSettings || {});
        
        const activeIdIsValid = migratedTemplates.some(t => t.id === savedData.activeTemplateId);
        setActiveTemplateId(activeIdIsValid ? savedData.activeTemplateId : (migratedTemplates[0]?.id || null));
      } else {
        setTemplates(INITIAL_TEMPLATES_CONFIG);
        setBanks(INITIAL_BANKS);
        setCategories(INITIAL_CATEGORIES);
        setDefaults(INITIAL_DEFAULTS);
        setActiveTemplateId(INITIAL_TEMPLATES_CONFIG[0]?.id);
      }
      setTimeout(() => setDataLoaded(true), 50);
    };
    loadData();
  }, []);

  useEffect(() => {
    if (!dataLoaded) return;
    const handler = setTimeout(() => {
      writeDataFile({
        templates,
        banks,
        categories,
        defaults,
        activeTemplateId,
        language,
        templateLanguage,
        tagTree,
        llmSettings,
      });
    }, 1000);
    return () => clearTimeout(handler);
  }, [templates, banks, categories, defaults, activeTemplateId, language, templateLanguage, tagTree, llmSettings, dataLoaded]);

  useEffect(() => {
    setEditedPreviewContent(null);
    setOriginalContentForDirtyCheck(null);
  }, [activeTemplateId]);

  // --- Helper Functions ---
  const t = (key, params = {}) => {
    let str = TRANSLATIONS[language]?.[key] || key;
    Object.keys(params).forEach(k => { str = str.replace(`{{${k}}}`, params[k]); });
    return str;
  };
  
  const displayTag = React.useCallback((tag) => {
    return TAG_LABELS[language]?.[tag] || tag;
  }, [language]);

  const flatTags = useMemo(() => {
    const flatten = (nodes, prefix = '') => {
      let paths = [];
      if (!Array.isArray(nodes)) return paths;
      nodes.forEach(node => {
        const currentPath = prefix ? `${prefix}/${node.name}` : node.name;
        paths.push(currentPath);
        if (node.children && node.children.length > 0) {
          paths = paths.concat(flatten(node.children, currentPath));
        }
      });
      return paths;
    };
    return flatten(tagTree || []);
  }, [tagTree]);

  // --- Derived State ---
  const activeTemplate = useMemo(() => {
      if (!activeTemplateId || !Array.isArray(templates) || templates.length === 0) return null;
      return templates.find(t => t.id === activeTemplateId);
  }, [templates, activeTemplateId]);

  const isDirty = originalContentForDirtyCheck && activeTemplate && JSON.stringify(activeTemplate.content) !== JSON.stringify(originalContentForDirtyCheck);
  
  const filteredTemplates = useMemo(() => {
    let processedTemplates = [...templates];

    // 1. Filter by search query
    if (searchQuery) {
      processedTemplates = processedTemplates.filter(t => {
        if (!t || !t.name) return false;
        const templateName = getLocalized(t.name, language);
        return templateName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // 2. Filter by selected tag paths from the filter dropdown
    if (selectedTags.length > 0) {
      processedTemplates = processedTemplates.filter(t => {
        if (!t.tags || t.tags.length === 0) return false;
        return t.tags.some(templateTag => selectedTags.some(filterTag => templateTag.startsWith(filterTag)));
      });
    }

    // 3. Sort the filtered templates
    processedTemplates.sort((a, b) => {
        const nameA = getLocalized(a.name, language) || '';
        const nameB = getLocalized(b.name, language) || '';
        switch(sortOrder) {
            case 'a-z': return nameA.localeCompare(nameB, language === 'cn' ? 'zh-CN' : 'en');
            case 'z-a': return nameB.localeCompare(nameA, language === 'cn' ? 'zh-CN' : 'en');
            case 'random':
                const hashA = (a.id + randomSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                const hashB = (b.id + randomSeed).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
                return hashA - hashB;
            case 'oldest': return new Date(a.createdAt || 0) - new Date(b.createdAt || 0);
            case 'newest': default: return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    // 4. Group into a tree structure based on the `tags` array
    const tree = {};
    processedTemplates.forEach(template => {
      const paths = template.tags && template.tags.length > 0 ? template.tags : ['uncategorized'];
      paths.forEach(path => {
        if (path === 'uncategorized' || !path) {
          if (!tree.uncategorized) tree.uncategorized = { children: {}, templates: [] };
          if (!tree.uncategorized.templates.some(t => t.id === template.id)) {
            tree.uncategorized.templates.push(template);
          }
          return;
        }

        const parts = path.split('/');
        let parentNode = tree;
        // Traverse to find the parent of the leaf
        for (let i = 0; i < parts.length - 1; i++) {
          const part = parts[i];
          if (!parentNode[part]) {
            parentNode[part] = { children: {}, templates: [] };
          }
          parentNode = parentNode[part].children;
        }
        
        // Add template to the leaf node
        const leafName = parts[parts.length - 1];
        if (!parentNode[leafName]) {
          parentNode[leafName] = { children: {}, templates: [] };
        }
        if (!parentNode[leafName].templates.some(t => t.id === template.id)) {
          parentNode[leafName].templates.push(template);
        }
      });
    });
    return tree;
  }, [templates, searchQuery, selectedTags, sortOrder, randomSeed, language]);

  // --- Action Handlers ---
  const handleAddTemplate = () => {
    const newId = `tpl_${Date.now()}`;
    const newTemplate = { id: newId, name: t('new_template_name'), author: "Me", content: t('new_template_content'), selections: {}, tags: [], createdAt: new Date().toISOString() };
    setTemplates(prev => [newTemplate, ...prev]);
    setActiveTemplateId(newId);
  };
  
  const handleDuplicateTemplate = (templateToCopy, e) => {
    e.stopPropagation();
    const newId = `tpl_${Date.now()}`;
    const duplicateName = (name) => {
      if (typeof name === 'string') return `${name}${t('copy_suffix')}`;
      const newName = { ...name };
      Object.keys(newName).forEach(lang => { newName[lang] = `${newName[lang]}${t('copy_suffix') || ' (Copy)'}` });
      return newName;
    };
    const newTemplate = { ...templateToCopy, id: newId, name: duplicateName(templateToCopy.name), createdAt: new Date().toISOString() };
    setTemplates(prev => [newTemplate, ...prev]);
    setActiveTemplateId(newId);
  };

  const handleDeleteTemplate = async (idToDelete, e) => {
    if (e) e.stopPropagation();
    
    const confirmed = await confirm(t('confirm_delete_template'), { 
      title: t('confirm_delete_title') || 'Confirm Deletion', 
      type: 'warning' 
    });

    if (confirmed) {
      const newTemplates = templates.filter(t => t.id !== idToDelete);
      setTemplates(newTemplates);
      if (activeTemplateId === idToDelete) {
        setActiveTemplateId(newTemplates[0]?.id || null);
      }
    }
  };

  const handleUpdateTemplate = (id, updates) => {
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, ...updates, updatedAt: new Date().toISOString() } : t));
  };
  
  const startRenamingTemplate = (t_item, e) => {
    e.stopPropagation();
    setEditingTemplateNameId(t_item.id);
    setTempTemplateName(getLocalized(t_item.name, language));
    setTempTemplateAuthor(t_item.author || "");
  };

  const saveTemplateName = () => {
    if (tempTemplateName.trim() && editingTemplateNameId) {
      const templateToUpdate = templates.find(t => t.id === editingTemplateNameId);
      if(templateToUpdate) {
        const newName = typeof templateToUpdate.name === 'object' 
          ? { ...templateToUpdate.name, [language]: tempTemplateName }
          : tempTemplateName;
        handleUpdateTemplate(editingTemplateNameId, { name: newName, author: tempTemplateAuthor });
      }
    }
    setEditingTemplateNameId(null);
  };

  const insertVariableToTemplate = (key) => {
    if (!activeTemplate) return;
    const textarea = document.querySelector('#prompt-editor-textarea');
    if (!textarea) return;
    const textToInsert = ` {{${key}}} `;
    const { selectionStart, selectionEnd, value } = textarea;
    const updatedText = `${value.substring(0, selectionStart)}${textToInsert}${value.substring(selectionEnd)}`;
    const newContent = typeof activeTemplate.content === 'object'
      ? { ...activeTemplate.content, [templateLanguage]: updatedText }
      : updatedText;
    handleUpdateTemplate(activeTemplate.id, { content: newContent });
    setTimeout(() => {
      textarea.focus();
      const newPos = selectionStart + textToInsert.length;
      textarea.setSelectionRange(newPos, newPos);
    }, 0);
  };

  const handleCopy = () => {
    if (!activeTemplate) return;

    const parts = getLocalized(activeTemplate.content, templateLanguage).split(/(\{\{[^\}\n]+\}\})/g);
    const finalContent = parts.map((part, i) => {
      if (part.startsWith('{{') && part.endsWith('}}')) {
        const key = part.slice(2, -2).trim();
        const bankKey = key.trim();
        const selectionKey = `${activeTemplate.id}-${bankKey}-${i}`;
        const selectionIndex = activeTemplate.selections?.[selectionKey];
        if (selectionIndex !== undefined && banks[bankKey]) {
          return getLocalized(banks[bankKey].options[selectionIndex], language);
        }
        return part; // Keep placeholder if not found
      }
      return part;
    }).join('');

    navigator.clipboard.writeText(finalContent).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleVariableClick = (key, event, variableIndex) => {
    isPickerOpening.current = true;
    const bank = banks[key];
    if (!bank || !bank.options) return;

    const rect = event.target.getBoundingClientRect();
    setVariablePickerState({
      visible: true,
      x: rect.left,
      y: rect.bottom,
      options: bank.options.map(opt => getLocalized(opt, language)),
      bankKey: key,
      variableIndex: variableIndex,
    });
    setTimeout(() => { isPickerOpening.current = false; }, 100);
  };

  const handleVariableSelect = (selectedIndex) => {
    if (!activeTemplate || !variablePickerState.bankKey) return;

    const { bankKey, variableIndex } = variablePickerState;
    const selectionKey = `${activeTemplate.id}-${bankKey}-${variableIndex}`;
    
    const newSelections = {
      ...activeTemplate.selections,
      [selectionKey]: selectedIndex,
    };
    
    handleUpdateTemplate(activeTemplate.id, { selections: newSelections });

    setVariablePickerState({ ...variablePickerState, visible: false });
  };
  
  const onOpenTagMenu = (rect) => {
    setTagMenuState({
      visible: true,
      x: rect.left,
      y: rect.bottom,
      options: flatTags, // Use flatTags for options
    });
  };

  const onCloseTagMenu = () => {
    setTagMenuState(prev => ({ ...prev, visible: false }));
  };

  const handleSaveAsNew = () => {
    let contentToSave;
    if (editedPreviewContent) {
      // Logic for saving from edited preview
      let newContent = editedPreviewContent;
      const valueToPlaceholderMap = {};
      Object.entries(banks).forEach(([bankKey, bank]) => {
        bank.options.forEach((option) => {
          const value = getLocalized(option, language);
          valueToPlaceholderMap[value] = `{{${bankKey}}}`;
        });
      });
      Object.entries(valueToPlaceholderMap).forEach(([value, placeholder]) => {
        newContent = newContent.replace(new RegExp(value, 'g'), placeholder);
      });
      contentToSave = newContent;
    } else {
      // Logic for saving from dirty content state
      contentToSave = activeTemplate.content;
    }

    const newId = `tpl_${Date.now()}`;
    const newName = `${getLocalized(activeTemplate.name, language)} (Edited)`;
    const newTemplate = { ...activeTemplate, id: newId, name: newName, content: contentToSave, createdAt: new Date().toISOString() };
    
    setTemplates(prev => [newTemplate, ...prev]);
    setActiveTemplateId(newId);
    setOriginalContentForDirtyCheck(null);
    setEditedPreviewContent(null);
  };

  const handleOverwrite = () => {
    if (editedPreviewContent) {
      let newContent = editedPreviewContent;
      const valueToPlaceholderMap = {};
      Object.entries(banks).forEach(([bankKey, bank]) => {
        bank.options.forEach((option) => {
          const value = getLocalized(option, language);
          valueToPlaceholderMap[value] = `{{${bankKey}}}`;
        });
      });
      Object.entries(valueToPlaceholderMap).forEach(([value, placeholder]) => {
        newContent = newContent.replace(new RegExp(value, 'g'), placeholder);
      });
      handleUpdateTemplate(activeTemplate.id, { content: newContent });
    }
    // For both cases (preview edit or content edit), clear the dirty states
    setOriginalContentForDirtyCheck(null);
    setEditedPreviewContent(null);
  };

  const handleGenerate = async () => {
    if (!llmSettings.endpoint || !llmSettings.apiKey) {
      await message(t('llm_settings_not_configured'));
      return;
    }

    if (!activeTemplate) return;

    const content = getLocalized(activeTemplate.content, templateLanguage);

    try {
      const response = await fetch(llmSettings.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmSettings.apiKey}`,
        },
        body: JSON.stringify({
          model: "gpt-3.5-turbo",
          messages: [
            {
              role: "system",
              content: "You are an expert in analyzing prompts. Your task is to extract relevant tags and identify replaceable parts as variables from the given prompt content. Return a JSON object with two keys: 'tags' (an array of strings) and 'variables' (an array of strings).",
            },
            {
              role: "user",
              content: `Analyze the following prompt and extract tags and variables:\n\n${content}`,
            }
          ],
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);
      console.log('Generated data:', result);
      
      await message(`Generated Tags: ${result.tags.join(', ')}\nGenerated Variables: ${result.variables.join(', ')}`);

    } catch (error) {
      console.error('Error generating tags and variables:', error);
      await message(t('ai_generation_failed'));
    }
  };
  
  if (!dataLoaded) {
      return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <div className={`font-sans antialiased bg-gray-100 flex flex-col h-screen overflow-hidden`}>
      {variablePickerState.visible && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setVariablePickerState({ ...variablePickerState, visible: false })}
          />
          <div style={{ position: 'fixed', top: variablePickerState.y, left: variablePickerState.x, zIndex: 50 }}>
            <VariablePicker
              options={variablePickerState.options}
              onSelect={handleVariableSelect}
              onClose={() => setVariablePickerState({ ...variablePickerState, visible: false })}
            />
          </div>
        </>
      )}
      {tagMenuState.visible && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={onCloseTagMenu}
          />
          <div style={{ position: 'fixed', top: tagMenuState.y, left: tagMenuState.x, zIndex: 50 }}>
            <div className="bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[160px] z-[100]">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">{t('assign_tags')}</div>
              <div className="max-h-48 overflow-y-auto">
                {(tagMenuState.options || []).map(path => (
                  <button
                    key={path}
                    onClick={() => {
                      const currentTags = activeTemplate.tags || [];
                      const newTags = currentTags.includes(path)
                        ? currentTags.filter(p => p !== path)
                        : [...currentTags, path];
                      handleUpdateTemplate(activeTemplate.id, { tags: newTags });
                      onCloseTagMenu();
                    }}
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between ${
                      (activeTemplate.tags || []).includes(path) ? 'text-orange-600 font-semibold' : 'text-gray-700'
                    }`}
                  >
                    <span>{path}</span>
                    {(activeTemplate.tags || []).includes(path) && <Check size={14} />}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
      {isTagManagerOpen && (
        <TagManager
          tags={tagTree}
          setTags={setTagTree}
          onClose={() => setIsTagManagerOpen(false)}
          t={t}
        />
      )}
      {isSettingsOpen && (
        <SettingsModal
          settings={llmSettings}
          setSettings={setLlmSettings}
          onClose={() => setIsSettingsOpen(false)}
          t={t}
        />
      )}
      <div className="flex flex-1 overflow-hidden">
        <div style={{ width: `${sidebarWidth}px` }} className="relative flex flex-col flex-shrink-0 h-full">
          <TemplatesSidebar
            templates={filteredTemplates}
            activeTemplateId={activeTemplateId}
            setActiveTemplateId={setActiveTemplateId}
            onAddTemplate={handleAddTemplate}
            onDuplicateTemplate={handleDuplicateTemplate}
            onDeleteTemplate={handleDeleteTemplate}
            onRenameTemplate={startRenamingTemplate}
            saveTemplateName={saveTemplateName}
            editingTemplateNameId={editingTemplateNameId}
            setEditingTemplateNameId={setEditingTemplateNameId}
            tempTemplateName={tempTemplateName}
            setTempTemplateName={setTempTemplateName}
            tempTemplateAuthor={tempTemplateAuthor}
            setTempTemplateAuthor={setTempTemplateAuthor}
            handleResetTemplate={() => alert('Reset not implemented yet')}
            handleExportTemplate={() => alert('Export not implemented yet')}
            language={language}
            setLanguage={setLanguage}
            t={t}
            displayTag={displayTag}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            selectedTags={selectedTags}
            setSelectedTags={setSelectedTags}
            sortOrder={sortOrder}
            setSortOrder={setSortOrder}
            isSortMenuOpen={isSortMenuOpen}
            setIsSortMenuOpen={setIsSortMenuOpen}
            setRandomSeed={setRandomSeed}
            setDiscoveryView={setDiscoveryView}
            setIsSettingsOpen={setIsSettingsOpen}
            tagTree={tagTree}
            onManageTags={() => setIsTagManagerOpen(true)}
            isOpenDirectory={isOpenDirectory}
            toggleDirectory={toggleDirectory}
            collapseAllDirectories={collapseAllDirectories}
          />
        </div>
        <div onMouseDown={startResizing} className="w-2 cursor-col-resize bg-gray-200 hover:bg-orange-300 transition-colors duration-200"/>
        <main className="flex-1 flex flex-col relative overflow-y-auto z-10">
           {activeTemplate ? (
             <>
               <EditorToolbar
                 activeTemplate={activeTemplate}
                 onCopy={handleCopy}
                 copied={copied}
                 isEditing={isEditing}
                 setIsEditing={(editing) => {
                    setIsEditing(editing);
                    if (editing && activeTemplate) {
                      setOriginalContentForDirtyCheck(activeTemplate.content);
                    }
                  }}
                 isDirty={isDirty}
                 editedPreviewContent={editedPreviewContent}
                 t={t}
                 language={language}
                 onOverwrite={handleOverwrite}
                 onSaveAsNew={handleSaveAsNew}
                 onGenerate={handleGenerate}
                 allTags={flatTags}
                 onUpdateTemplate={handleUpdateTemplate}
                 onOpenTagMenu={onOpenTagMenu}
                 onCloseTagMenu={onCloseTagMenu}
               />
               <VisualEditor
                 ref={textareaRef}
                 key={activeTemplate.id}
                 value={getLocalized(activeTemplate.content, templateLanguage)}
                 onChange={(e) => {
                    const newContent = typeof activeTemplate.content === 'object'
                        ? { ...activeTemplate.content, [templateLanguage]: e.target.value }
                        : e.target.value;
                    handleUpdateTemplate(activeTemplate.id, { content: newContent });
                 }}
                 banks={banks}
                 categories={categories}
                 isEditing={isEditing}
                 onVariableClick={handleVariableClick}
                 activeTemplate={activeTemplate}
                 defaults={defaults}
                 language={language}
                 onUpdate={setEditedPreviewContent}
                 isPickerOpening={isPickerOpening}
               />
             </>
           ) : (
             <div className="flex-1 flex items-center justify-center text-gray-400">Select a template.</div>
           )}
        </main>
        <BanksSidebar
            banks={banks}
            categories={categories}
            onInsert={insertVariableToTemplate}
            language={language}
            t={t}
        />
      </div>
    </div>
  );
};

export default App;
