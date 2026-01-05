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

  // Function to serialize the editor's document state back to a plain text string.
  const serializeStateToString = (state) => {
    let text = '';
    state.doc.forEach(node => {
      node.content.forEach(child => {
        if (child.type.name === 'text') {
          text += child.text;
        } else if (child.type.name === 'tiptapVariable') {
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
        // Disable default key mappings that might interfere
        history: false, // We'll manage history at the app level if needed
      }),
      VariableConversion, // Use our extended version with input rules
    ],
    content: value, // Initial content
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
    if (editor && value !== serializeStateToString(editor.state)) {
      isUpdatingFromOutside.current = true;
      editor.commands.setContent(value, false); // `false` to not emit an update
      isUpdatingFromOutside.current = false;
    }
  }, [value, editor]);

  // Expose an imperative handle to the parent component.
  // This allows the parent to call `insertVariable` directly on the editor instance.
  useImperativeHandle(ref, () => ({
    insertVariable: (key) => {
      if (editor) {
        // Insert the variable as text, which will be automatically converted by our input rule.
        editor.chain().focus().insertContent(`{{${key}}}`).run();
      }
    },
  }), [editor]);
  
  const editorContextValue = {
    banks, categories, activeTemplate, language, onVariableClick, defaults,
  };

  return (
    <EditorContext.Provider value={editorContextValue}>
      <div className="relative w-full h-full overflow-y-auto custom-scrollbar">
        <EditorContent editor={editor} />
      </div>
    </EditorContext.Provider>
  );
});

VisualEditor.displayName = 'VisualEditor';

export { VisualEditor };
