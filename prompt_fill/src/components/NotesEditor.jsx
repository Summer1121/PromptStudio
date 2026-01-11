import React, { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Save, Expand } from 'lucide-react';
import { NotesToolbar } from './NotesToolbar';

export const NotesEditor = ({ notes, onSaveNotes, t }) => {
  const [isFocused, setIsFocused] = useState(false);
  const editor = useEditor({
    extensions: [
      StarterKit,
    ],
    content: notes,
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none focus:outline-none',
      },
    },
    onFocus: () => setIsFocused(true),
    onBlur: () => setIsFocused(false),
  });

  useEffect(() => {
    if (editor && !isFocused) {
      editor.commands.setContent(notes);
    }
  }, [notes, editor, isFocused]);

  const handleSave = () => {
    if (editor) {
      onSaveNotes(editor.getHTML());
    }
  };

    return (
      <div className="absolute bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-lg border-t border-x border-gray-200 z-20 notes-editor-container">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 className="text-sm font-semibold text-gray-700">{t('notes')}</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-500 text-white hover:bg-blue-600 transition-colors"
            >
              <Save size={14} />
              {t('save_notes')}
            </button>
            <button className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
              <Expand size={14} />
            </button>
          </div>
        </div>
        <div className="relative">
          {editor && <NotesToolbar editor={editor} />}
          <EditorContent
            editor={editor}
            className="p-4 h-32 overflow-y-auto custom-scrollbar"
          />
        </div>
      </div>
    );};
