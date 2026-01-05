import React, { useState, useRef } from 'react';
import { X, Plus, Trash2, ChevronRight, Check } from 'lucide-react';

const addNodeByPath = (nodes, path, newNodeName) => {
  if (!path || path.length === 0) return nodes;

  const [head, ...tail] = path;

  return nodes.map(node => {
    if (node.name === head) {
      if (tail.length === 0) {
        // This is the parent, add the new node here
        const newChildren = [...(node.children || []), { name: newNodeName, children: [] }];
        return { ...node, children: newChildren };
      } else {
        // Continue traversing
        const newChildren = addNodeByPath(node.children, tail, newNodeName);
        return { ...node, children: newChildren };
      }
    }
    return node;
  });
};

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

const TagNode = ({ node, path, onDelete, onAddSubTag }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [newSubTag, setNewSubTag] = useState("");
  const hasChildren = node.children && node.children.length > 0;

  const handleConfirmAdd = () => {
    if (newSubTag.trim()) {
      onAddSubTag(path, newSubTag.trim());
      setNewSubTag("");
      setIsAdding(false);
      setIsOpen(true); // Auto-open the parent after adding
    }
  };

  return (
    <div className="ml-4">
      <div className="flex items-center justify-between p-2 rounded-md hover:bg-gray-100 group">
        <div className="flex items-center flex-1 min-w-0">
            {hasChildren ? (
                <button onClick={() => setIsOpen(!isOpen)} className="p-0.5 rounded-full hover:bg-gray-200">
                    <ChevronRight size={14} className={`transform transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                </button>
            ) : (
              <div className="w-[18px]"></div> // Placeholder for alignment
            )}
            <span className="ml-1 truncate">{node.name}</span>
        </div>
        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={() => setIsAdding(true)} className="p-1 text-gray-400 hover:text-blue-500" title="添加子文件夹">
                <Plus size={16} />
            </button>
            <button onClick={() => onDelete(path)} className="p-1 text-gray-400 hover:text-red-500">
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {isAdding && (
          <div className="ml-8 my-1 flex gap-2 animate-in fade-in duration-300">
              <input
                  autoFocus
                  type="text"
                  value={newSubTag}
                  onChange={(e) => setNewSubTag(e.target.value)}
                  placeholder="新子文件夹名称"
                  className="flex-grow px-2 py-1 text-sm border rounded-md"
                  onKeyDown={(e) => e.key === 'Enter' && handleConfirmAdd()}
              />
              <button onClick={handleConfirmAdd} className="p-2 bg-blue-500 text-white rounded-md">
                  <Check size={14} />
              </button>
          </div>
      )}

      {isOpen && hasChildren && (
        <div className="border-l border-gray-200">
          {node.children.map((child) => (
            <TagNode 
              key={child.name}
              node={child}
              path={[...path, child.name]}
              onDelete={onDelete}
              onAddSubTag={onAddSubTag}
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
  
  const handleAddSubTag = (path, newName) => {
    const newTree = addNodeByPath(tagTree, path, newName);
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
                onAddSubTag={handleAddSubTag}
             />
          ))}
        </div>
      </div>
    </div>
  );
};