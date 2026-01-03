import React, { useState, useEffect, useRef } from 'react';
import { ChevronRight, Filter } from 'lucide-react';

const findNode = (nodes, pathParts) => {
  if (!pathParts || !pathParts.length) return null;
  const [head, ...tail] = pathParts;
  const node = nodes.find(n => n.name === head);
  if (!node || !tail.length) return node;
  if (!node.children) return null;
  return findNode(node.children, tail);
};

const getDescendantsAndSelf = (node, path) => {
  let paths = [path];
  if (node && node.children) {
    node.children.forEach(child => {
      paths = paths.concat(getDescendantsAndSelf(child, `${path}/${child.name}`));
    });
  }
  return paths;
};

// Recursive component to render each node in the tag tree
const DropdownNode = ({ node, path, selectedTags, handleTagSelection }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;
  
  const isSelected = selectedTags.includes(path);

  return (
    <div className="pl-3">
      <div className="flex items-center">
        {hasChildren && (
          <ChevronRight 
            size={14} 
            onClick={() => setIsOpen(!isOpen)} 
            className={`mr-1 transform transition-transform cursor-pointer flex-shrink-0 ${isOpen ? 'rotate-90' : ''}`}
          />
        )}
        <div className={`flex items-center w-full ${!hasChildren ? 'ml-[18px]' : ''}`}>
          <input
            type="checkbox"
            checked={isSelected}
            onChange={() => handleTagSelection(path, node)}
            className="h-4 w-4 rounded border-gray-300 text-orange-600 focus:ring-orange-500 cursor-pointer"
          />
          <label onClick={() => handleTagSelection(path, node)} className="ml-2 text-sm text-gray-700 cursor-pointer select-none">
            {node.name}
          </label>
        </div>
      </div>
      {isOpen && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <DropdownNode 
              key={child.name}
              node={child}
              path={`${path}/${child.name}`}
              selectedTags={selectedTags}
              handleTagSelection={handleTagSelection}
            />
          ))}
        </div>
      )}
    </div>
  );
};


// Main Dropdown Component
export const TagFilterDropdown = ({ tagTree, selectedTags, setSelectedTags, t }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const handleTagSelection = (path, node) => {
    const pathsToToggle = getDescendantsAndSelf(node, path);
    
    setSelectedTags(prev => {
      const newSelection = new Set(prev);
      const isSelecting = !newSelection.has(path);

      if (isSelecting) {
        pathsToToggle.forEach(p => newSelection.add(p));
      } else {
        pathsToToggle.forEach(p => newSelection.delete(p));
      }
      return Array.from(newSelection);
    });
  };

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getButtonText = () => {
    if (selectedTags.length === 0) return t('all_templates');
    if (selectedTags.length === 1) return selectedTags[0].split('/').pop();
    return t('multiple_tags_selected', { count: selectedTags.length });
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex-shrink-0 w-full flex justify-between items-center px-3 py-2 rounded-lg text-sm font-medium transition-all border bg-white text-gray-700 border-gray-200 hover:border-orange-300"
      >
        <div className="flex items-center gap-2">
            <Filter size={14} className="text-gray-400" />
            <span className="truncate">{getButtonText()}</span>
        </div>
        <ChevronRight size={16} className={`transform transition-transform text-gray-400 ${isOpen ? 'rotate-90' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-100 p-4 z-30">
          <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-2">
            {tagTree.map(node => (
              <DropdownNode 
                key={node.name}
                node={node}
                path={node.name}
                selectedTags={selectedTags}
                handleTagSelection={handleTagSelection}
              />
            ))}
          </div>
          <div className="mt-3 pt-3 border-t">
              <button
                onClick={() => setSelectedTags([])}
                className="w-full text-center px-3 py-1.5 rounded-md text-xs text-gray-600 hover:bg-gray-100"
              >
                {t('clear_selection')}
              </button>
          </div>
        </div>
      )}
    </div>
  );
};