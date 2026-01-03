import React, { useState } from 'react';
import { X, Plus, Trash2, ChevronRight } from 'lucide-react';

const removeNodeByPath = (nodes, path) => {
  if (!path || path.length === 0) return nodes;

  const [head, ...tail] = path;

  if (tail.length === 0) {
    return nodes.filter(node => node.name !== head);
  }

  return nodes.map(node => {
    if (node.name === head && node.children) {
      const newChildren = removeNodeByPath(node.children, tail);
      return { ...node, children: newChildren };
    }
    return node;
  });
};

const TagNode = ({ node, path, onDelete }) => {
  const [isOpen, setIsOpen] = useState(false);
  const hasChildren = node.children && node.children.length > 0;

  return (
    <div className="ml-4">
      <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
        <div className="flex items-center">
            {hasChildren && (
                <button onClick={() => setIsOpen(!isOpen)} className="p-0.5 rounded-full hover:bg-gray-200">
                    <ChevronRight size={14} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            )}
            <span className={`ml-1 ${!hasChildren ? 'ml-[22px]' : ''}`}>{node.name}</span>
        </div>
        <button onClick={() => onDelete(path)} className="p-1 text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
          <Trash2 size={16} />
        </button>
      </div>
      {isOpen && hasChildren && (
        <div className="border-l border-gray-200">
          {node.children.map((child) => (
            <TagNode 
              key={child.name}
              node={child}
              path={[...path, child.name]}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const TagManager = ({ tags: tagTree, setTags: setTagTree, onClose, t }) => {
  const [newTag, setNewTag] = useState('');

  const handleAddTopLevel = () => {
    if (newTag && !tagTree.some(t => t.name === newTag)) {
      setTagTree([...tagTree, { name: newTag, children: [] }]);
      setNewTag('');
    }
  };

  const handleDelete = (path) => {
    const newTree = removeNodeByPath(tagTree, path);
    setTagTree(newTree);
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
            placeholder={t('add_new_tag_folder')}
            className="flex-grow px-3 py-2 border rounded-md"
          />
          <button onClick={handleAddTopLevel} className="px-4 py-2 bg-blue-500 text-white rounded-md">
            <Plus size={16} />
          </button>
        </div>

        <div className="space-y-1 max-h-60 overflow-y-auto border rounded-lg p-1">
          {tagTree.map((node) => (
             <TagNode 
                key={node.name}
                node={node}
                path={[node.name]}
                onDelete={handleDelete}
             />
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-4">{t('tag_manager_note')}</p>
      </div>
    </div>
  );
};