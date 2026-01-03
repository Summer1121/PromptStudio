// TiptapEditor.jsx
import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { PlaceholderExtension } from './PlaceholderExtension';

const TiptapEditor = ({ content, onUpdate, onVariableClick, isEditing }) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      PlaceholderExtension.configure({
        // Pass the onVariableClick handler to the node view
        nodeViewProps: {
          onClick: (key, event) => onVariableClick(key, event),
        },
      }),
    ],
    content: content,
    onUpdate: ({ editor }) => {
      onUpdate(editor.getHTML());
    },
    editable: isEditing,
  });

  return (
    <EditorContent editor={editor} />
  );
};

export default TiptapEditor;