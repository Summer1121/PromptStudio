import React from 'react';
import { Bold, Italic, List, ListOrdered, Image, Video } from 'lucide-react';

export const NotesToolbar = ({ editor }) => {
  if (!editor) {
    return null;
  }

  const handleImageUpload = () => {
    const url = window.prompt('Enter image URL:');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const handleVideoUpload = () => {
    const url = window.prompt('Enter video URL:');
    if (url) {
      // Assuming a simple iframe embed for videos
      editor.chain().focus().insertContent(`<iframe src="${url}"></iframe>`).run();
    }
  };

  return (
    <div className="flex items-center gap-2 p-2 border-b border-gray-200">
      <button
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={`p-2 rounded ${editor.isActive('bold') ? 'bg-gray-200' : ''}`}
      >
        <Bold size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={`p-2 rounded ${editor.isActive('italic') ? 'bg-gray-200' : ''}`}
      >
        <Italic size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-gray-200' : ''}`}
      >
        <List size={16} />
      </button>
      <button
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-gray-200' : ''}`}
      >
        <ListOrdered size={16} />
      </button>
      <button onClick={handleImageUpload} className="p-2 rounded">
        <Image size={16} />
      </button>
      <button onClick={handleVideoUpload} className="p-2 rounded">
        <Video size={16} />
      </button>
    </div>
  );
};
