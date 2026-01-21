import React, { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { X } from 'lucide-react';
import { NotesToolbar } from './NotesToolbar';
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

/**
 * 注释展开模态组件
 * 在独立窗口中展示和编辑注释内容
 */
export const NotesExpandedModal = ({ notes, onSaveNotes, onClose, templateId, t }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [saveStatus, setSaveStatus] = useState(null); // 保存状态：'saving', 'success', 'error'
  const isUpdatingFromOutside = useRef(false); // 标记是否正在从外部更新
  const lastNotesRef = useRef(notes); // 记录上次的 notes 值
  const lastTemplateIdRef = useRef(undefined); // 初始为 undefined，确保打开模态后首次也会做 setContent 与 media 转换
  
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

  // 当 notes prop 变化时，同步到编辑器（仅在非焦点状态且内容真正改变时）
  useEffect(() => {
    if (editor && notes !== undefined) {
      // 先检查模板是否切换（在更新 lastTemplateIdRef 之前）
      const templateChanged = templateId !== lastTemplateIdRef.current;
      
      // 如果模板切换了，更新 lastTemplateIdRef
      if (templateChanged) {
        lastTemplateIdRef.current = templateId;
        lastNotesRef.current = null; // 重置，强制更新
      }
      
      // 如果 notes 没有变化且模板未切换，跳过更新
      if (!templateChanged && lastNotesRef.current === notes) {
        return;
      }
      
      // 如果编辑器正在被用户编辑（有焦点）且模板未切换，不更新
      if (!templateChanged && isFocused) {
        return;
      }
      
      const currentContent = editor.getHTML();
      // 只有当内容真正不同时才更新，避免意外清空
      // 但如果模板切换了，强制更新（即使 notes 为空也要清空编辑器）
      if (templateChanged || currentContent !== notes) {
        // 额外检查：如果当前内容非空但 notes 为空，可能是意外清空，不更新
        // 但如果模板切换了，允许更新（可能是新模板确实没有注释，需要清空）
        if (!templateChanged && currentContent && currentContent !== '<p></p>' && (!notes || notes === '<p></p>')) {
          console.warn('Prevented clearing editor content: current has content but notes is empty');
          return;
        }
        
        isUpdatingFromOutside.current = true;
        // 如果模板切换了且 notes 为空，清空编辑器
        // 否则使用 notes 的值（可能为空字符串或 '<p></p>'）
        let contentToSet = templateChanged && (!notes || notes === '' || notes === '<p></p>') 
          ? '' 
          : (notes || '');
        
        // 转换 media:// 路径为可访问的 URL
        if (contentToSet && contentToSet.includes('media://')) {
          convertMediaPathsInHtml(contentToSet).then(convertedContent => {
            if (editor && !isUpdatingFromOutside.current) return; // 编辑器已被更新
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
    }
  }, [notes, editor, isFocused, templateId]);

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

  const handleClose = () => {
    // 关闭前保存
    handleSave();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={handleClose}>
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 标题栏 */}
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-700">{t('notes')}</h2>
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
              {saveStatus === 'saving' 
                ? (t('saving') || '保存中...') 
                : saveStatus === 'success'
                ? (t('saved') || '已保存')
                : t('save_notes')}
            </button>
            <button 
              onClick={handleClose} 
              className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* 编辑器内容 */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {editor && <NotesToolbar editor={editor} t={t} templateId={templateId} />}
          <div className="flex-1 overflow-y-auto p-4">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
};
