import React, { useState } from 'react';
import { X, Plus, Trash2, Edit3 } from 'lucide-react';

export const TagManager = ({ tags, setTags, onClose, t }) => {
  const [newTag, setNewTag] = useState('');
  const [editingTag, setEditingTag] = useState(null);
  const [editingText, setEditingText] = useState('');

  const handleAddTag = () => {
    if (newTag && !tags.includes(newTag)) {
      setTags([...tags, newTag]);
      setNewTag('');
    }
  };

  const handleDeleteTag = (tagToDelete) => {
    setTags(tags.filter(tag => tag !== tagToDelete));
  };

  const handleStartEditing = (tag) => {
    setEditingTag(tag);
    setEditingText(tag);
  };

  const handleSaveEditing = () => {
    if (editingText && !tags.includes(editingText)) {
      setTags(tags.map(tag => (tag === editingTag ? editingText : tag)));
    }
    setEditingTag(null);
    setEditingText('');
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('manage_tags')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="mb-4 flex gap-2">
          <input
            type="text"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            placeholder={t('add_new_tag')}
            className="flex-grow px-3 py-2 border rounded-md"
          />
          <button onClick={handleAddTag} className="px-4 py-2 bg-blue-500 text-white rounded-md">
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
          {tags.map(tag => (
            <div key={tag} className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100">
              {editingTag === tag ? (
                <input
                  type="text"
                  value={editingText}
                  onChange={(e) => setEditingText(e.target.value)}
                  onBlur={handleSaveEditing}
                  onKeyDown={(e) => e.key === 'Enter' && handleSaveEditing()}
                  autoFocus
                  className="flex-grow px-2 py-1 border rounded-md"
                />
              ) : (
                <span className="flex-grow">{tag}</span>
              )}
              <div className="flex gap-2">
                <button onClick={() => handleStartEditing(tag)} className="p-1 hover:text-blue-500">
                  <Edit3 size={16} />
                </button>
                <button onClick={() => handleDeleteTag(tag)} className="p-1 hover:text-red-500">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
