import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { confirm as tauriConfirm, message as tauriMessage } from '@tauri-apps/plugin-dialog';
import { TemplatesSidebar, BanksSidebar, EditorToolbar, VisualEditor, NotesEditor, PlainTextEditor, McpManager, PromptToSkillModal, AuthModal, MarketView } from './components';
import { authService } from './services/auth';
import { syncService } from './services/sync';
import { publishService } from './services/publish';
import { marketService } from './services/market';
import { VariablePicker } from './components/VariablePicker';
import MobileTabBar from './components/MobileTabBar';
import { TagManager } from './components/TagManager';
import { SettingsModal } from './components/SettingsModal';
import { DiffView } from './components/DiffView';
import { OptimizeEvalModal } from './components/OptimizeEvalModal';
import { readDataFile, writeDataFile } from './services/tauri-service';
import { invokeLlm, isLlmConfigured } from './services/llm-adapter';
import { LLM_MODEL_CONFIG } from './constants/llm-config';
import { OPTIMIZE_SYSTEM, buildOptimizeUserPrompt } from './constants/optimize-prompts';
import { getLocalized, hashCode } from './utils/helpers';
import { INITIAL_TEMPLATES_CONFIG, TEMPLATE_TAG_TREE } from './data/templates';
import { INITIAL_BANKS, INITIAL_CATEGORIES, INITIAL_DEFAULTS } from './data/banks';
import { TRANSLATIONS } from './constants/translations';
import { TAG_LABELS } from './constants/styles';
import { Check, List, Cpu, Cloud } from 'lucide-react';

import { listMcpTools } from './services/mcp-service';

// 应用顶级标签：提示词管理 | MCP 中心 | 提示词市场
const APP_TOP_TABS = [
  { id: 'prompts', icon: List, labelKey: 'app_tab_prompts', label: '提示词管理' },
  { id: 'mcp', icon: Cpu, labelKey: 'mcp_resource_hub', label: 'MCP 中心' },
  { id: 'market', icon: Cloud, labelKey: 'app_tab_market', label: '提示词市场' },
];

// --- Safe Wrappers for Tauri Plugins ---
const isTauri = typeof window !== 'undefined' && window.__TAURI_INTERNALS__;

const confirm = async (msg, options) => {
  if (isTauri) return await tauriConfirm(msg, options);
  return window.confirm(msg);
};

const message = async (msg, options) => {
  if (isTauri) {
    try {
      return await tauriMessage(msg, options);
    } catch (err) {
      console.error('Tauri message failed:', err);
    }
  }
  window.alert(msg);
};

const App = () => {
  const APP_VERSION = "0.5.1"; // Updated to match package.json

  // --- UI & Control State ---
  const [sidebarWidth, setSidebarWidth] = useState(380);
  const [isResizing, setIsResizing] = useState(false);
  const [notesPanelHeight, setNotesPanelHeight] = useState(200);
  const [isResizingNotes, setIsResizingNotes] = useState(false);
  const notesResizeStartYRef = useRef(0);
  const notesResizeStartHeightRef = useRef(200);

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
  const [availableTools, setAvailableTools] = useState([]);
  const [selectedTools, setSelectedTools] = useState([]); // Array of tool names
  const [toolCallHistory, setToolCallHistory] = useState([]); // Array of { name, args, result, status }
  const [toolMenuState, setToolMenuState] = useState({ visible: false, x: 0, y: 0, options: [] });
  
  // --- UI & Control State ---
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isDiscoveryView, setDiscoveryView] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  const [isDiffViewOpen, setIsDiffViewOpen] = useState(false);
  const [optimizeSuggestedContent, setOptimizeSuggestedContent] = useState(null);
  const [optimizeEvaluation, setOptimizeEvaluation] = useState(null);
  const [isOptimizeEvalModalOpen, setIsOptimizeEvalModalOpen] = useState(false);
  const [isPromptToSkillModalOpen, setIsPromptToSkillModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [appTopTab, setAppTopTab] = useState('prompts'); // 'prompts' | 'mcp' | 'market'
  const [user, setUser] = useState(authService.getUserInfo());
  /** 'requesting'=已发请求等待响应，'optimizing'=已收到首包，模型生成中；null=空闲 */
  const [optimizeStatus, setOptimizeStatus] = useState(null);
  
  // Sidebar filtering/sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState([]); // This will now represent an array of paths
  const [sortOrder, setSortOrder] = useState("newest");
  const [randomSeed, setRandomSeed] = useState(Date.now());
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [openDirectories, setOpenDirectories] = useState(null); // null: initial state, all open. {}: collapsed.

  const editorRef = useRef(null);

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
  const [historyMenuState, setHistoryMenuState] = useState({
    visible: false,
    x: 0,
    y: 0,
  });
  const [drafts, setDrafts] = useState({}); // Stores draft content for each template ID
  const [historyDiffTarget, setHistoryDiffTarget] = useState(null);
  const isPickerOpening = useRef(false);
  const keepDraftOnNextSwitch = useRef(false);

  const onOpenToolMenu = async (rect) => {
    try {
      const { tools } = await listMcpTools();
      setToolMenuState({
        visible: true,
        x: rect.left,
        y: rect.bottom,
        options: tools || [],
      });
    } catch (e) {
      console.error('Failed to list tools', e);
      // await message('Failed to list MCP tools');
    }
  };
  
  const onCloseToolMenu = () => {
    setToolMenuState(prev => ({ ...prev, visible: false }));
  };

  const handleToggleTool = (toolName) => {
    setSelectedTools(prev => {
      if (prev.includes(toolName)) return prev.filter(t => t !== toolName);
      return [...prev, toolName];
    });
  };

  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
  const [mobileTab, setMobileTab] = useState(isMobileDevice ? "home" : "editor");

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

  // 注释区域高度拖拽：上下拖动边框调整注释窗体大小
  const NOTES_PANEL_MIN = 120;
  const NOTES_PANEL_MAX = 600;
  const startNotesResize = useCallback((e) => {
    notesResizeStartYRef.current = e.clientY;
    notesResizeStartHeightRef.current = notesPanelHeight;
    setIsResizingNotes(true);
  }, [notesPanelHeight]);
  const resizeNotes = useCallback((e) => {
    if (!isResizingNotes) return;
    const startY = notesResizeStartYRef.current;
    const startH = notesResizeStartHeightRef.current;
    const delta = startY - e.clientY; // 条在上方：向上拖条→注释区变高，向下拖条→注释区变矮
    let next = Math.round(startH + delta);
    next = Math.max(NOTES_PANEL_MIN, Math.min(NOTES_PANEL_MAX, next));
    setNotesPanelHeight(next);
  }, [isResizingNotes]);
  const stopNotesResize = useCallback(() => setIsResizingNotes(false), []);
  useEffect(() => {
    if (!isResizingNotes) return;
    const onMove = (e) => resizeNotes(e);
    const onUp = () => {
      stopNotesResize();
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizingNotes, resizeNotes, stopNotesResize]);
  
  // --- Data Persistence Layer (Tauri) ---
  useEffect(() => {
      const loadData = async () => {
      const savedData = await readDataFile();
      console.log('Loading data. Saved data exists:', !!savedData);
      if (savedData && savedData.templates && savedData.templates.length > 0) {
        console.log('Loaded templates count:', savedData.templates.length);
        
        const migratedTemplates = savedData.templates.map(t => {
          const newTemplate = { ...t };
          if (t.tagPath && !t.tags) {
            newTemplate.tags = [t.tagPath];
          }
          delete newTemplate.tagPath;

          if (newTemplate.version === undefined) {
            newTemplate.version = 1;
            newTemplate.history = [];
          }

          if (newTemplate.notes === undefined) {
            newTemplate.notes = "";
          } else {
            console.log(`Template ${t.id} notes length:`, newTemplate.notes?.length || 0);
          }
          return newTemplate;
        });

        setTemplates(migratedTemplates);
        setBanks(savedData.banks || INITIAL_BANKS);
        setCategories(savedData.categories || INITIAL_CATEGORIES);
        setDefaults(savedData.defaults || INITIAL_DEFAULTS);
        setLanguage(savedData.language || 'cn');
        setTemplateLanguage(savedData.templateLanguage || 'cn');
        setTagTree(savedData.tagTree || TEMPLATE_TAG_TREE);
        setLlmSettings((() => {
          const s = savedData.llmSettings || {};
          return { ...s, modelType: s.modelType || 'custom' };
        })());
        
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
      // 检查 templates 中是否包含 notes 字段
      const templatesWithNotes = templates.map(t => ({
        ...t,
        notes: t.notes || '' // 确保 notes 字段存在
      }));
      console.log('Writing data file. Templates count:', templatesWithNotes.length);
      console.log('Active template notes:', templatesWithNotes.find(t => t.id === activeTemplateId)?.notes?.substring(0, 50) || 'empty');
      writeDataFile({
        templates: templatesWithNotes,
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
    if (keepDraftOnNextSwitch.current) {
        keepDraftOnNextSwitch.current = false;
        return;
    }
    // No longer clearing drafts on switch
  }, [activeTemplateId]);

    const handleRestoreVersion = (historyEntry) => {
      if (!activeTemplate) return;
      const newHistoryEntry = {
        content: activeTemplate.content,
        version: activeTemplate.version,
        createdAt: activeTemplate.updatedAt || activeTemplate.createdAt,
      };
      const newHistory = [newHistoryEntry, ...(activeTemplate.history || [])];
      handleUpdateTemplate(activeTemplate.id, {
        content: historyEntry.content,
        version: (activeTemplate.version || 1) + 1,
        history: newHistory,
      });
      setDrafts(prev => {
        const newDrafts = { ...prev };
        delete newDrafts[activeTemplateId];
        return newDrafts;
      });
    };
  
    const onOpenHistory = (rect) => {
      setHistoryMenuState({
        visible: true,
        x: rect.left,
        y: rect.bottom,
      });
    };
  
      const onCloseHistory = () => {
        setHistoryMenuState({ ...historyMenuState, visible: false });
      };
  
      const handleViewHistoryDiff = (historyEntry) => {
        setHistoryDiffTarget(historyEntry);
        setIsDiffViewOpen(true);
      };
  
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
        if (node.children && node.children.length > 0) {
          paths = paths.concat(flatten(node.children, currentPath));
        } else {
          paths.push(currentPath);
        }
      });
      return paths;
    };
    return flatten(tagTree || []);
  }, [tagTree]);

  const activeTemplate = useMemo(() => {
      if (!activeTemplateId || !Array.isArray(templates) || templates.length === 0) return null;
      return templates.find(t => t.id === activeTemplateId);
  }, [templates, activeTemplateId]);

  const isDraft = useMemo(() => {
    const draftContent = drafts[activeTemplateId];
    if (!activeTemplate || draftContent === undefined) return false;
    return draftContent !== getLocalized(activeTemplate.content, templateLanguage);
  }, [activeTemplate, drafts, activeTemplateId, templateLanguage]);

  const isSkillOutdated = useMemo(() => {
    if (!activeTemplate?.linkedSkill) return false;
    const currentContent = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);
    const currentHash = hashCode(currentContent);
    return currentHash !== activeTemplate.linkedSkill.lastSyncHash;
  }, [activeTemplate, drafts, activeTemplateId, templateLanguage]);

  const handleSaveAsSkill = () => {
    setIsPromptToSkillModalOpen(true);
  };

  const handleSkillShortcutSuccess = (skillName, contentHash) => {
    if (activeTemplate) {
      handleUpdateTemplate(activeTemplate.id, {
        linkedSkill: {
          name: skillName,
          lastSyncHash: contentHash
        }
      });
    }
  };
  
  const displayTemplates = useMemo(() => {
    let processedTemplates = [...templates];
    if (searchQuery) {
      processedTemplates = processedTemplates.filter(t => {
        if (!t || !t.name) return false;
        const templateName = getLocalized(t.name, language);
        return templateName.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }
    if (selectedTags.length > 0) {
      processedTemplates = processedTemplates.filter(t => {
        if (!t.tags || t.tags.length === 0) return false;
        return t.tags.some(templateTag => selectedTags.some(filterTag => templateTag.startsWith(filterTag)));
      });
    }
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
    return processedTemplates;
  }, [templates, searchQuery, selectedTags, sortOrder, randomSeed, language]);


  const handleAddTemplate = () => {
    const newId = `tpl_${Date.now()}`;
    const newTemplate = { id: newId, name: t('new_template_name'), author: "Me", content: t('new_template_content'), selections: {}, tags: [], createdAt: new Date().toISOString(), notes: "", version: 1, history: [] };
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
    const newTemplate = { ...templateToCopy, id: newId, name: duplicateName(templateToCopy.name), createdAt: new Date().toISOString(), version: 1, history: [] };
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
    if (editorRef.current) {
      editorRef.current.insertVariable(key);
    }
  };

  const handleCopy = () => {
    if (!activeTemplate) return;
    const content = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);
    // 按出现顺序将 {{key}} 替换为所选值。selections 的 key 为 `${id}-${key}-${getPos()}`，
    // 在纯字符串解析时没有 getPos，故用「同一 key 的出现次序」与「同 key 的 selection 按 pos 排序后的次序」对应。
    const keyOccurrenceIndex = {};
    const finalContent = content.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      const bankKey = key.trim();
      const bank = banks[bankKey];
      if (!activeTemplate.selections) return match;
      const selectionKeys = Object.keys(activeTemplate.selections).filter(
        (sk) => sk.startsWith(`${activeTemplate.id}-${bankKey}-`)
      );
      selectionKeys.sort((a, b) => {
        const posA = parseInt(a.split('-').pop(), 10);
        const posB = parseInt(b.split('-').pop(), 10);
        return (isNaN(posA) ? 0 : posA) - (isNaN(posB) ? 0 : posB);
      });
      const occurrence = keyOccurrenceIndex[bankKey] ?? 0;
      keyOccurrenceIndex[bankKey] = occurrence + 1;
      const selectionKey = selectionKeys[occurrence];
      if (!selectionKey) return match;
      const selectionIndex = activeTemplate.selections[selectionKey];
      if (bank?.options && bank.options[selectionIndex] !== undefined) {
        return getLocalized(bank.options[selectionIndex], language);
      }
      return match;
    });

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
      options: flatTags, 
    });
  };

  const onCloseTagMenu = () => {
    setTagMenuState(prev => ({ ...prev, visible: false }));
  };

  const handleSaveAsNew = () => {
    if (!activeTemplate) return;
    const contentToSave = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);

    const newId = `tpl_${Date.now()}`;
    const newName = (name => {
      const suffix = t('copy_suffix') || ' (Copy)';
      if (typeof name === 'object') {
        const newNameObj = { ...name };
        Object.keys(newNameObj).forEach(lang => { newNameObj[lang] = `${newNameObj[lang]}${suffix}` });
        return newNameObj;
      }
      return `${name}${suffix}`;
    })(activeTemplate.name);

    const newTemplate = { 
      ...activeTemplate, 
      id: newId, 
      name: newName, 
      content: contentToSave, 
      createdAt: new Date().toISOString(),
      notes: activeTemplate.notes,
      version: 1, 
      history: []
    };
    
    setTemplates(prev => [newTemplate, ...prev]);
    
    keepDraftOnNextSwitch.current = true;
    setActiveTemplateId(newId);
  };

  const handleApplyDraft = () => {
    const draftContent = drafts[activeTemplateId];
    if (!activeTemplate || draftContent === undefined) return;

    const currentTemplate = templates.find(t => t.id === activeTemplateId);
    if (!currentTemplate) return;

    const historyEntry = {
      content: currentTemplate.content,
      version: currentTemplate.version,
      createdAt: currentTemplate.updatedAt || currentTemplate.createdAt,
    };
    
    const newHistory = [historyEntry, ...(currentTemplate.history || [])];

    handleUpdateTemplate(activeTemplate.id, { 
      content: draftContent,
      version: (currentTemplate.version || 1) + 1,
      history: newHistory,
    });
    
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[activeTemplateId];
      return newDrafts;
    });
  };
  
  const handleResetDraft = () => {
    setDrafts(prev => {
      const newDrafts = { ...prev };
      delete newDrafts[activeTemplateId];
      return newDrafts;
    });
  };

  const onSaveNotes = async (notesContent) => {
    if (activeTemplate) {
      console.log('Saving notes for template:', activeTemplate.id, 'Content length:', notesContent?.length || 0);
      handleUpdateTemplate(activeTemplate.id, { notes: notesContent });
      // 返回 Promise 以便 NotesEditor 可以显示保存状态
      return Promise.resolve();
    }
    return Promise.reject(new Error('No active template'));
  };

  const handleShare = async () => {
    if (!authService.isLoggedIn()) {
      setIsAuthModalOpen(true);
      return;
    }

    if (!activeTemplate) return;

    const content = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);
    
    try {
      const result = await publishService.publish({
        uuid: activeTemplate.marketId,
        title: getLocalized(activeTemplate.name, language),
        description: activeTemplate.notes || "",
        content: content,
        tags: (activeTemplate.tags || []).join(','),
        visibility: 'public'
      }, async (sensitive) => {
        return confirm(`检测到敏感信息: ${sensitive.join(', ')}\n是否继续发布？`);
      });

      if (result && !activeTemplate.marketId) {
        // 更新本地模板的 marketId
        setTemplates(prev => prev.map(t => 
          t.id === activeTemplateId ? { ...t, marketId: result.uuid } : t
        ));
      }
      
      await message("发布成功！");
    } catch (err) {
      await message("发布失败: " + err.message);
    }
  };

  const handleCloudSync = async () => {
    if (!authService.isLoggedIn()) {
      setIsAuthModalOpen(true);
      return;
    }

    try {
      await syncService.backup();
      await message("云端备份成功！");
    } catch (err) {
      await message("备份失败: " + err.message);
    }
  };

  const handleInstallPrompt = async (marketPrompt) => {
    const newId = `market_${marketPrompt.uuid}`;
    const newTemplate = {
      id: newId,
      name: marketPrompt.title,
      author: marketPrompt.owner_name,
      content: marketPrompt.latest_content,
      tags: [], // 用户自行指定标签
      notes: marketPrompt.description,
      marketId: marketPrompt.uuid,
      version: marketPrompt.latest_version,
      createdAt: new Date().toISOString(),
      history: []
    };

    setTemplates(prev => [newTemplate, ...prev]);
    setActiveTemplateId(newId);
    setAppTopTab('prompts');
    await message("提示词已安装到本地");
  };

  const handleGenerate = async () => {
    if (!isLlmConfigured(llmSettings)) {
      await message(t('llm_settings_not_configured'));
      return;
    }

    const mt = llmSettings?.modelType || 'custom';
    if (mt === 'gemini') {
      await message(t('generate_unsupported_for_gemini'));
      return;
    }

    let endpoint;
    let model;
    const apiKey = llmSettings.apiKey;
    if (mt === 'qwen') {
      endpoint = LLM_MODEL_CONFIG.qwen.endpoint;
      model = llmSettings.model?.trim() || LLM_MODEL_CONFIG.qwen.defaultModel;
    } else {
      endpoint = llmSettings.endpoint;
      model = llmSettings.model?.trim() || LLM_MODEL_CONFIG.custom.defaultModel;
    }

    if (!endpoint || !apiKey) {
      await message(t('llm_settings_not_configured'));
      return;
    }

    if (!activeTemplate) return;

    const content = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${llmSettings.apiKey}`,
        },
        body: JSON.stringify({
          model,
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

  const handleOptimize = async () => {
    if (!isLlmConfigured(llmSettings)) {
      await message(t('llm_settings_not_configured'));
      return;
    }
    if (!activeTemplate) return;

    const content = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);
    setOptimizeStatus('requesting');
    
    // Filter full tool definitions
    const activeTools = availableTools.filter(t => selectedTools.includes(t.name));

    try {
      const { text } = await invokeLlm(
        {
          llmSettings,
          systemContent: OPTIMIZE_SYSTEM,
          userContent: buildOptimizeUserPrompt(content),
          tools: activeTools,
        },
        {
          stream: true,
          onFirstChunk: () => setOptimizeStatus('optimizing'),
          onToolCall: (name, args) => {
            setToolCallHistory(prev => [...prev, { name, args, status: 'running', timestamp: Date.now() }]);
          },
        }
      );
      let j;
      try {
        j = JSON.parse(text);
      } catch {
        await message(t('optimize_parse_error'));
        return;
      }
      const ev = (j && typeof j.evaluation === 'string') ? j.evaluation : '';
      const sug = j?.suggestedContent;
      const hasSuggested = sug != null && String(sug).trim();

      if (hasSuggested) {
        setOptimizeEvaluation(ev);
        setOptimizeSuggestedContent(String(sug).trim());
        setIsDiffViewOpen(true);
      } else {
        setOptimizeEvaluation(ev);
        setIsOptimizeEvalModalOpen(true);
      }
    } catch (err) {
      console.error('Smart optimize error details:', err);
      if (err.message) console.error('Error message:', err.message);
      if (err.stack) console.error('Error stack:', err.stack);
      await message(`${t('ai_generation_failed')}: ${err.message || 'Unknown error'}`);
    } finally {
      setOptimizeStatus(null);
    }
  };
  
  if (!dataLoaded) {
      return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <div className={`font-sans antialiased bg-gray-100 flex flex-col h-screen`}>
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
                    className={`w-full text-left px-4 py-2 text-sm hover:bg-orange-50 transition-colors flex items-center justify-between ${ (activeTemplate.tags || []).includes(path) ? 'text-orange-600 font-semibold' : 'text-gray-700'}`}
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
      {isPromptToSkillModalOpen && activeTemplate && (
        <PromptToSkillModal
          activeTemplate={activeTemplate}
          llmSettings={llmSettings}
          onClose={() => setIsPromptToSkillModalOpen(false)}
          t={t}
          language={language}
          onSuccess={handleSkillShortcutSuccess}
        />
      )}
      {historyMenuState.visible && activeTemplate && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={onCloseHistory}
          />
          <div style={{ position: 'fixed', top: historyMenuState.y, left: historyMenuState.x, zIndex: 50 }}>
            <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-xl border border-gray-100 py-2 min-w-[220px] z-[100]">
              <div className="px-4 py-2 text-xs font-semibold text-gray-500 border-b">{t('version_history')}</div>
              <div className="max-h-60 overflow-y-auto">
                {(activeTemplate.history || []).length > 0 ? (
                  activeTemplate.history.map(h => (
                    <div key={h.version} className="flex items-center justify-between px-4 py-2 text-sm text-gray-700">
                      <div>
                        <span className="font-bold">v{h.version}</span>
                        <span className="text-xs text-gray-400 ml-2">{new Date(h.createdAt).toLocaleString()}</span>
                      </div>
                                            <button 
                                              onClick={() => {
                                                handleViewHistoryDiff(h);
                                                onCloseHistory();
                                              }}
                                              className="px-2 py-1 text-xs rounded bg-gray-100 hover:bg-yellow-100 hover:text-yellow-600 transition-colors"
                                            >
                                              {t('diff')}
                                            </button>                    </div>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-gray-400">{t('no_history')}</div>
                )}
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
      {isAuthModalOpen && (
        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          onAuthSuccess={() => setUser(authService.getUserInfo())}
        />
      )}
      {isOptimizeEvalModalOpen && (
        <OptimizeEvalModal
          evaluation={optimizeEvaluation}
          onClose={() => setIsOptimizeEvalModalOpen(false)}
          t={t}
        />
      )}
      {isDiffViewOpen && activeTemplate && (() => {
        const isHistory = !!historyDiffTarget;
        const isOptimize = optimizeSuggestedContent != null;
        const currentContent = drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage);

        if (isHistory) {
          return (
            <DiffView
              isHistoryDiff
              originalContent={historyDiffTarget.content}
              newContent={getLocalized(activeTemplate.content, templateLanguage)}
              onClose={() => { setIsDiffViewOpen(false); setHistoryDiffTarget(null); }}
              onReset={() => {}}
              onApply={() => { handleRestoreVersion(historyDiffTarget); setIsDiffViewOpen(false); setHistoryDiffTarget(null); }}
              t={t}
            />
          );
        }
        if (isOptimize) {
          return (
            <DiffView
              isHistoryDiff={false}
              originalContent={currentContent}
              newContent={optimizeSuggestedContent}
              evaluation={optimizeEvaluation || undefined}
              newVersionLabel={t('optimize_suggested_version')}
              onClose={() => { setIsDiffViewOpen(false); setOptimizeSuggestedContent(null); setOptimizeEvaluation(null); }}
              onReset={() => { setIsDiffViewOpen(false); setOptimizeSuggestedContent(null); setOptimizeEvaluation(null); }}
              onApply={() => {
                setDrafts(prev => ({ ...prev, [activeTemplateId]: optimizeSuggestedContent }));
                setIsDiffViewOpen(false);
                setOptimizeSuggestedContent(null);
                setOptimizeEvaluation(null);
              }}
              t={t}
            />
          );
        }
        return (
          <DiffView
            isHistoryDiff={false}
            originalContent={getLocalized(activeTemplate.content, templateLanguage)}
            newContent={drafts[activeTemplate.id]}
            onClose={() => { setIsDiffViewOpen(false); setHistoryDiffTarget(null); }}
            onReset={() => { handleResetDraft(); setIsDiffViewOpen(false); setHistoryDiffTarget(null); }}
            onApply={() => { handleApplyDraft(); setIsDiffViewOpen(false); setHistoryDiffTarget(null); }}
            t={t}
          />
        );
      })()}
      <div className="flex flex-1 h-full overflow-hidden min-h-0">
        {/* 顶级标签栏：左侧竖向，固定宽度，缩放抗乱序 */}
        <nav className="app-top-tab-bar flex-shrink-0 w-16 min-w-[64px] flex flex-col items-center py-3 gap-1 bg-white border-r border-gray-200">
          {APP_TOP_TABS.map(({ id, icon: Icon, labelKey, label }) => {
            const tabLabel = t(labelKey) || label;
            const isActive = appTopTab === id;
            return (
              <button
                key={id}
                type="button"
                onClick={() => setAppTopTab(id)}
                title={tabLabel}
                className={`app-top-tab-btn flex flex-col items-center justify-center min-h-[44px] min-w-[44px] w-full py-2 px-1 rounded-lg transition-colors ${
                  isActive ? 'bg-orange-50 text-orange-600' : 'text-gray-500 hover:bg-gray-100 hover:text-orange-600'
                }`}
              >
                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} className="flex-shrink-0" aria-hidden />
              </button>
            );
          })}
        </nav>

        {/* 提示词管理：侧栏 + 主内容 */}
        {appTopTab === 'prompts' && (
          <>
            <div style={{ width: `${sidebarWidth}px` }} className="relative flex flex-col flex-shrink-0 h-full">
              <TemplatesSidebar
                tagTree={tagTree}
                displayTemplates={displayTemplates}
                templates={templates}
                activeTemplateId={activeTemplateId}
                drafts={drafts}
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
                onCloudSync={handleCloudSync}
                onManageTags={() => setIsTagManagerOpen(true)}
                isOpenDirectory={isOpenDirectory}
                toggleDirectory={toggleDirectory}
                collapseAllDirectories={collapseAllDirectories}
              />
            </div>
            <div onMouseDown={startResizing} className="w-2 cursor-col-resize bg-gray-200 hover:bg-orange-300 transition-colors duration-200 h-full flex-shrink-0"/>
            <main className="flex-1 flex flex-col relative z-10 h-full overflow-hidden min-w-0">
               {activeTemplate ? (
                 <>
                   <EditorToolbar
                     activeTemplate={activeTemplate}
                     onCopy={handleCopy}
                     copied={copied}
                     isDraft={isDraft}
                     t={t}
                     language={language}
                     onSaveAsNew={handleSaveAsNew}
                     onGenerate={handleGenerate}
                     onUpdateTemplate={handleUpdateTemplate}
                     onOpenTagMenu={onOpenTagMenu}
                     onCloseTagMenu={onCloseTagMenu}
                     onOpenHistory={onOpenHistory}
                     onCloseHistory={onCloseHistory}
                     onRestoreVersion={handleRestoreVersion}
                     onOpenDiff={() => { setOptimizeSuggestedContent(null); setOptimizeEvaluation(null); setHistoryDiffTarget(null); setIsDiffViewOpen(true); }}
                     onOptimize={handleOptimize}
                     optimizeStatus={optimizeStatus}
                     onOpenToolMenu={onOpenToolMenu}
                     selectedTools={selectedTools}
                     onSaveAsSkill={handleSaveAsSkill}
                     isSkillOutdated={isSkillOutdated}
                     onShare={handleShare}
                   />
                   <div className="flex-grow relative h-full flex flex-col min-h-0">
                     <div className="flex-1 min-h-0 relative overflow-hidden">
                       <PlainTextEditor
                         ref={editorRef}
                         key={activeTemplate.id}
                         value={drafts[activeTemplateId] ?? getLocalized(activeTemplate.content, templateLanguage)}
                         banks={banks}
                         categories={categories}
                         onVariableClick={handleVariableClick}
                         activeTemplate={activeTemplate}
                         defaults={defaults}
                         language={language}
                         onUpdate={(newContent) => setDrafts(prev => ({...prev, [activeTemplateId]: newContent}))}
                       />
                     </div>
                     <div
                       role="separator"
                       aria-label="拖动调整注释区高度"
                       onMouseDown={startNotesResize}
                       className="h-2 flex-shrink-0 cursor-row-resize bg-gray-200 hover:bg-orange-300 transition-colors duration-200 flex items-center justify-center group"
                     >
                       <span className="w-12 h-0.5 rounded-full bg-gray-400 group-hover:bg-orange-500 transition-colors opacity-0 group-hover:opacity-100" />
                     </div>
                     <div className="flex-shrink-0 overflow-hidden flex flex-col" style={{ height: notesPanelHeight }}>
                       <NotesEditor
                         notes={activeTemplate.notes}
                         onSaveNotes={onSaveNotes}
                         templateId={activeTemplateId}
                         t={t}
                         fillHeight
                       />
                     </div>
                   </div>
                 </>
               ) : (
                 <div className="flex-1 flex items-center justify-center text-gray-400">Select a template.</div>
               )}
            </main>
          </>
        )}

        {/* MCP 中心：嵌入主内容区 */}
        {appTopTab === 'mcp' && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-white">
            <McpManager onClose={() => setAppTopTab('prompts')} t={t} />
          </div>
        )}

        {/* 提示词市场：嵌入主内容区 */}
        {appTopTab === 'market' && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-gray-50">
            <MarketView onClose={() => setAppTopTab('prompts')} onInstall={handleInstallPrompt} t={t} />
          </div>
        )}
      </div>

      {/* 词库侧栏：仅在提示词管理页显示 */}
      {appTopTab === 'prompts' && (
        <BanksSidebar
          banks={banks}
          categories={categories}
          onInsert={insertVariableToTemplate}
          language={language}
          t={t}
        />
      )}
    </div>
  );
};

export default App;