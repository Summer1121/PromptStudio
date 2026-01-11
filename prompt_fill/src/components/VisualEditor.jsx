import React, { useEffect, useImperativeHandle, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { TiptapVariable } from './TiptapVariable';
import { EditorContext } from './VariableNode';

// A custom extension that extends TiptapVariable to add input rules.
// This rule finds text that matches the pattern `{{key}}` and automatically
// converts it into our `tiptapVariable` node on the fly.
const VariableConversion = TiptapVariable.extend({
  addInputRules() {
    return [
      {
        find: /\{\{([a-zA-Z0-9_]+)\}\}/g,
        type: this.type,
        getAttributes: match => ({ 'data-variable-key': match[1] }),
      },
    ];
  },
});

const VisualEditor = React.forwardRef((
  { value, onUpdate, banks, categories, onVariableClick, activeTemplate, defaults, language }, 
  ref
) => {
  const isUpdatingFromOutside = useRef(false);

  // Pre-process content to convert {{variables}} into nodes
  const preprocessContent = (text) => {
    if (!text) return '';
    return text.replace(/\{\{([a-zA-Z0-9_]+)\}\}/g, (match, key) => {
      return `<span data-variable-key="${key}">${match}</span>`;
    });
  };

  // Function to serialize the editor's document state back to a plain text string.
  const serializeStateToString = (state) => {
    let text = '';
    state.doc.forEach(node => {
      node.content.forEach(child => {
        if (child.type.name === 'text') {
          text += child.text;
        } else if (child.type.name === 'variable') { // Changed from tiptapVariable
          text += `{{${child.attrs['data-variable-key']}}}`;
        }
      });
      // Add a newline for each paragraph, except for the last one.
      if (node.isBlock && state.doc.content.lastChild !== node) {
         text += '\n';
      }
    });
    return text;
  };

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        history: false,
      }),
      TiptapVariable, // Use the base TiptapVariable now
    ],
    content: preprocessContent(value), // Use pre-processed content
    editorProps: {
      attributes: {
        class: 'p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words focus:outline-none w-full h-full',
        spellcheck: 'false',
      },
    },
    onUpdate: ({ editor }) => {
      if (isUpdatingFromOutside.current) return;
      const newTextValue = serializeStateToString(editor.state);
      if (onUpdate) {
        onUpdate(newTextValue);
      }
    },
  });

  // Effect to sync editor content when the `value` prop changes from the outside.
  useEffect(() => {
    if (editor) {
      const currentEditorValue = serializeStateToString(editor.state);
      if (value !== currentEditorValue) {
        isUpdatingFromOutside.current = true;
        const newContent = preprocessContent(value);
        editor.commands.setContent(newContent, false);
        isUpdatingFromOutside.current = false;
      }
    }
  }, [value, editor]);

  useImperativeHandle(ref, () => ({
    insertVariable: (key) => {
      if (editor) {
        const node = `<span data-variable-key="${key}">{{${key}}}</span>`;
        editor.chain().focus().insertContent(node).run();
      }
    },
  }), [editor]);
  
  const editorContextValue = {
    banks, categories, activeTemplate, language, onVariableClick, defaults,
  };

  return (
    <EditorContext.Provider value={editorContextValue}>
      <div className="relative w-full h-full overflow-y-auto custom-scrollbar pb-48">
        <EditorContent editor={editor} />
      </div>
    </EditorContext.Provider>
  );
});

VisualEditor.displayName = 'VisualEditor';

export { VisualEditor };
