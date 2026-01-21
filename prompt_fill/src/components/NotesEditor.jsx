import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Save, Expand } from 'lucide-react';
import { NotesToolbar } from './NotesToolbar';
import { NotesExpandedModal } from './NotesExpandedModal';
import { getMediaUrl, convertMediaForSave } from '../services/tauri-service';

/**
 * 将 HTML 中的 media:// 路径转换为可访问的 URL
 */
async function convertMediaPathsInHtml(html) {
  if (!html || typeof html !== 'string') return html;
  
  // 查找所有 media:// 路径的图片和视频标签
  const mediaPathRegex = /src=["'](media:\/\/[^"']+)["']/g;
  const matches = Array.from(html.matchAll(mediaPathRegex));
  
  if (matches.length === 0) {
    return html; // 没有 media:// 路径，直接返回
  }
  
  // 转换所有 media:// 路径
  let convertedHtml = html;
  for (const match of matches) {
    const mediaPath = match[1];
    try {
      const url = await getMediaUrl(mediaPath);
      if (url) {
        convertedHtml = convertedHtml.replace(`src="${mediaPath}"`, `src="${url}"`);
        convertedHtml = convertedHtml.replace(`src='${mediaPath}'`, `src='${url}'`);
      }
    } catch (error) {
      console.error('Error converting media path:', mediaPath, error);
    }
  }
  
  return convertedHtml;
}

export const NotesEditor = ({ notes, onSaveNotes, t, templateId }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 保存状态：'saving', 'success', 'error'
  const isUpdatingFromOutside = useRef(false); // 标记是否正在从外部更新
  const lastNotesRef = useRef(notes); // 记录上次的 notes 值
  const lastTemplateIdRef = useRef(undefined); // 初始为 undefined，确保刷新后首次加载也会做 setContent 与 media 转换
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          style: 'max-width: 100%; height: auto;',
        },
      }),
    ],
    content: notes || '',
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
    onFocus: () => {
      setIsFocused(true);
    },
    onBlur: () => {
      // 延迟设置 isFocused，避免在 blur 时立即触发同步
      setTimeout(() => {
        setIsFocused(false);
        // 更新 lastNotesRef，但不自动保存（用户可以通过保存按钮保存）
        if (editor) {
          const content = editor.getHTML();
          lastNotesRef.current = content;
        }
      }, 100);
    },
    onUpdate: () => {
      // 当编辑器内容变化时，更新 lastNotesRef
      if (editor && !isUpdatingFromOutside.current) {
        lastNotesRef.current = editor.getHTML();
      }
    },
  });

  // 同步 notes prop 到编辑器，但只在模板切换时更新（不在失焦时重新加载）
  useEffect(() => {
    if (editor && notes !== undefined) {
      // 先检查模板是否切换（在更新 lastTemplateIdRef 之前）
      const templateChanged = templateId !== lastTemplateIdRef.current;
      
      // 只有在模板切换时才同步内容，不在失焦时重新加载
      if (!templateChanged) {
        // 模板未切换，只更新 lastNotesRef 记录，但不更新编辑器内容
        // 这样可以避免失焦时用旧内容覆盖用户正在编辑的内容
        if (lastNotesRef.current !== notes) {
          lastNotesRef.current = notes;
        }
        return;
      }
      
      // 模板切换了，更新 lastTemplateIdRef
      lastTemplateIdRef.current = templateId;
      lastNotesRef.current = null; // 重置，强制更新

      isUpdatingFromOutside.current = true;
      
      // 如果模板切换了且 notes 为空，清空编辑器
      // 否则使用 notes 的值（可能为空字符串或 '<p></p>'）
      let contentToSet = (!notes || notes === '' || notes === '<p></p>') 
        ? '' 
        : (notes || '');
      
      // 转换 media:// 路径为可访问的 URL
      if (contentToSet && contentToSet.includes('media://')) {
        convertMediaPathsInHtml(contentToSet).then(convertedContent => {
          if (!editor) return;
          editor.commands.setContent(convertedContent);
          lastNotesRef.current = notes || '';
          setTimeout(() => {
            isUpdatingFromOutside.current = false;
          }, 100);
        });
        return; // 异步转换，提前返回
      }
      
      editor.commands.setContent(contentToSet);
      lastNotesRef.current = notes || '';
      
      // 重置标记
      setTimeout(() => {
        isUpdatingFromOutside.current = false;
      }, 100);
    }
  }, [notes, editor, templateId]); // 移除 isFocused 依赖，避免失焦时触发

  const handleSave = async () => {
    if (editor) {
      let content = editor.getHTML();
      // 保存时：Tauri 转成 media://；浏览器将 blob/media:// 转成 data URL 以在刷新后可用
      content = await convertMediaForSave(content);
      lastNotesRef.current = content; // 更新记录的 notes 值
      setSaveStatus('saving');
      try {
        await onSaveNotes(content);
        setSaveStatus('success');
        // 3秒后清除成功提示
        setTimeout(() => {
          setSaveStatus(null);
        }, 3000);
      } catch (error) {
        console.error('Error saving notes:', error);
        setSaveStatus('error');
        setTimeout(() => {
          setSaveStatus(null);
        }, 3000);
      }
    }
  };

  const handleExpand = () => {
    // 先保存当前内容
    handleSave();
    setIsExpanded(true);
  };

  const handleCloseExpanded = () => {
    setIsExpanded(false);
  };

  return (
    <>
      <div className="bg-white border-t border-gray-200 notes-editor-container flex-shrink-0" style={{ minHeight: '200px', maxHeight: '400px' }}>
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">{t('notes')}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saveStatus === 'saving'}
              className={`flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                saveStatus === 'success' 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : saveStatus === 'error'
                  ? 'bg-red-500 text-white hover:bg-red-600'
                  : saveStatus === 'saving'
                  ? 'bg-gray-400 text-white cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
            >
              <Save size={14} />
              {saveStatus === 'saving' 
                ? (t('saving') || '保存中...') 
                : saveStatus === 'success'
                ? (t('saved') || '已保存')
                : t('save_notes')}
            </button>
            <button 
              onClick={handleExpand}
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
              title={t('expand_view') || '展开视图'}
            >
              <Expand size={14} />
            </button>
          </div>
        </div>
        <div className="relative flex flex-col" style={{ height: 'calc(100% - 57px)', minHeight: 'calc(45px + 6rem)' }}>
          {editor && <NotesToolbar editor={editor} t={t} templateId={templateId} />}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4" style={{ minHeight: '6rem' }}>
            <EditorContent
              editor={editor}
            />
          </div>
        </div>
      </div>
      
      {/* 展开模态 */}
      {isExpanded && (
        <NotesExpandedModal
          notes={notes}
          onSaveNotes={onSaveNotes}
          onClose={handleCloseExpanded}
          templateId={templateId}
          t={t}
        />
      )}
    </>
  );
};
