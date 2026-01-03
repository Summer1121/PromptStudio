import { TemplatesSidebar, BanksSidebar, EditorToolbar, VisualEditor } from './components';
import { VariablePicker } from './components/VariablePicker';
import MobileTabBar from './components/MobileTabBar';
import { TagManager } from './components/TagManager';
import { SettingsModal } from './components/SettingsModal';


const App = () => {
  const APP_VERSION = "0.7.2"; // Final authoritative version with Tauri dialog

  // --- Core Data State ---
  const [templates, setTemplates] = useState([]);
  const [banks, setBanks] = useState({});
  const [categories, setCategories] = useState({});
  const [defaults, setDefaults] = useState({});
  const [activeTemplateId, setActiveTemplateId] = useState(null);
  const [language, setLanguage] = useState("cn");
  const [templateLanguage, setTemplateLanguage] = useState("cn");
  const [allTags, setAllTags] = useState(TEMPLATE_TAGS);
  const [llmSettings, setLlmSettings] = useState({});
  
  // --- UI & Control State ---
  const [dataLoaded, setDataLoaded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isDiscoveryView, setDiscoveryView] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTagManagerOpen, setIsTagManagerOpen] = useState(false);
  
  // Sidebar filtering/sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState("");
  const [sortOrder, setSortOrder] = useState("newest");
  const [randomSeed, setRandomSeed] = useState(Date.now());
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  
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
  const [editedPreviewContent, setEditedPreviewContent] = useState(null);
  
  const isMobileDevice = typeof window !== 'undefined' && window.innerWidth < 768;
  const [mobileTab, setMobileTab] = useState(isMobileDevice ? "home" : "editor");
  const textareaRef = useRef(null);
  
  // --- Data Persistence Layer (Tauri) ---
  useEffect(() => {
    const loadData = async () => {
      const savedData = await readDataFile();
      if (savedData && savedData.templates && savedData.templates.length > 0) {
        setTemplates(savedData.templates);
        setBanks(savedData.banks || INITIAL_BANKS);
        setCategories(savedData.categories || INITIAL_CATEGORIES);
        setDefaults(savedData.defaults || INITIAL_DEFAULTS);
        setLanguage(savedData.language || 'cn');
        setTemplateLanguage(savedData.templateLanguage || 'cn');
        setAllTags(savedData.allTags || TEMPLATE_TAGS);
        setLlmSettings(savedData.llmSettings || {});
        
        const activeIdIsValid = savedData.templates.some(t => t.id === savedData.activeTemplateId);
        setActiveTemplateId(activeIdIsValid ? savedData.activeTemplateId : savedData.templates[0].id);
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
        allTags,
        llmSettings,
      });
    }, 1000);
    return () => clearTimeout(handler);
  }, [templates, banks, categories, defaults, activeTemplateId, language, templateLanguage, allTags, llmSettings, dataLoaded]);

  // --- Helper Functions ---
  const t = (key, params = {}) => {
    let str = TRANSLATIONS[language]?.[key] || key;
    Object.keys(params).forEach(k => { str = str.replace(`{{${k}}}`, params[k]); });
    return str;
  };
  
  const displayTag = React.useCallback((tag) => {
    return TAG_LABELS[language]?.[tag] || tag;
  }, [language]);

  // --- Derived State ---
  const activeTemplate = useMemo(() => {
      if (!activeTemplateId || !Array.isArray(templates) || templates.length === 0) return null;
      return templates.find(t => t.id === activeTemplateId);
  }, [templates, activeTemplateId]);
  
  const filteredTemplates = useMemo(() => {
    if (!Array.isArray(templates)) return [];
    
    let filtered = templates.filter(t => {
        if (!t || !t.name) return false;
        const templateName = getLocalized(t.name, language);
        const matchesSearch = !searchQuery || templateName.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesTags = selectedTags === "" || (t.tags && t.tags.includes(selectedTags));
        return matchesSearch && matchesTags;
    });

    // Sort the filtered templates
    filtered = [...filtered].sort((a, b) => {
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
            case 'newest':
            default:
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
    });

    if (selectedTags) {
        return { [selectedTags]: filtered };
    }

    const grouped = filtered.reduce((acc, template) => {
        const tags = template.tags && template.tags.length > 0 ? template.tags : ['uncategorized'];
        tags.forEach(tag => {
            if (!acc[tag]) {
                acc[tag] = [];
            }
            acc[tag].push(template);
        });
        return acc;
    }, {});

    return grouped;
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
      Object.keys(newName).forEach(lang => { newName[lang] = `${newName[lang]}${t('copy_suffix') || ' (Copy)'}`; });
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

  const handleSaveAsNew = () => {
    if (!editedPreviewContent) return;

    // This is a brittle and inefficient way to convert the rendered content back to a template.
    // It might fail in many cases. A better solution would be to use a proper rich text editor
    // that can handle variables as custom nodes.
    let newContent = editedPreviewContent;
    const valueToPlaceholderMap = {};
    Object.entries(banks).forEach(([bankKey, bank]) => {
      bank.options.forEach((option, index) => {
        const value = getLocalized(option, language);
        // This will have issues if multiple variables have the same value.
        valueToPlaceholderMap[value] = `{{${bankKey}}}`;
      });
    });

    Object.entries(valueToPlaceholderMap).forEach(([value, placeholder]) => {
      newContent = newContent.replace(new RegExp(value, 'g'), placeholder);
    });

    const newId = `tpl_${Date.now()}`;
    const newTemplate = {
      id: newId,
      name: `${getLocalized(activeTemplate.name, language)} (Edited)`,
      author: "Me",
      content: newContent,
      selections: {},
      tags: activeTemplate.tags,
      createdAt: new Date().toISOString(),
    };
    setTemplates(prev => [newTemplate, ...prev]);
    setActiveTemplateId(newId);
    setEditedPreviewContent(null);
  };

  const handleOverwrite = () => {
    if (!editedPreviewContent) return;

    // This is a brittle and inefficient way to convert the rendered content back to a template.
    // It might fail in many cases. A better solution would be to use a proper rich text editor
    // that can handle variables as custom nodes.
    let newContent = editedPreviewContent;
    const valueToPlaceholderMap = {};
    Object.entries(banks).forEach(([bankKey, bank]) => {
      bank.options.forEach((option, index) => {
        const value = getLocalized(option, language);
        // This will have issues if multiple variables have the same value.
        valueToPlaceholderMap[value] = `{{${bankKey}}}`;
      });
    });

    Object.entries(valueToPlaceholderMap).forEach(([value, placeholder]) => {
      newContent = newContent.replace(new RegExp(value, 'g'), placeholder);
    });

    handleUpdateTemplate(activeTemplate.id, { content: newContent });
    setEditedPreviewContent(null);
  };

  const handleGenerate = async () => {
    if (!llmSettings.endpoint || !llmSettings.apiKey) {
      alert(t('llm_settings_not_configured'));
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
          model: "gpt-3.5-turbo", // Or any other model
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
      
      // I will add the logic to update the template with the generated tags and variables later.
      alert(`Generated Tags: ${result.tags.join(', ')}\nGenerated Variables: ${result.variables.join(', ')}`);

    } catch (error) {
      console.error('Error generating tags and variables:', error);
      alert(t('ai_generation_failed'));
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
      {isTagManagerOpen && (
        <TagManager
          tags={allTags}
          setTags={setAllTags}
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
          tags={allTags}
          onManageTags={() => setIsTagManagerOpen(true)}
        />
        <main className="flex-1 flex flex-col relative overflow-y-auto">
           {activeTemplate ? (
             <>
               <EditorToolbar
                 activeTemplate={activeTemplate}
                 onCopy={handleCopy}
                 copied={copied}
                 isEditing={isEditing}
                 setIsEditing={
                  (editing) => {
                    setIsEditing(editing);
                    if (!editing) {
                      setEditedPreviewContent(getLocalized(activeTemplate.content, templateLanguage));
                    }
                  }
                 }
                 t={t}
                 language={language}
                 editedPreviewContent={editedPreviewContent}
                 onOverwrite={handleOverwrite}
                 onSaveAsNew={handleSaveAsNew}
                 onGenerate={handleGenerate}
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