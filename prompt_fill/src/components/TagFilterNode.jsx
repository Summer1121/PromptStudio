import React, { useState } from 'react';
import { ChevronRight } from 'lucide-react';

const TagFilterNode = ({ node, currentPath, selectedTags, setSelectedTags, level = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = node.children && node.children.length > 0;

  const isActiveBranch = selectedTags && selectedTags.startsWith(currentPath);
  const isSelectedExact = selectedTags === currentPath;

  return (
    <div style={{ paddingLeft: `${level * 12}px` }}>
      <div className="flex items-center group">
        {hasChildren ? (
          <ChevronRight 
            size={14} 
            onClick={() => setIsOpen(!isOpen)} 
            className={`mr-1 transform transition-transform cursor-pointer flex-shrink-0 ${isOpen ? 'rotate-90' : ''} ${isActiveBranch ? 'text-gray-700' : 'text-gray-400'}`} 
          />
        ) : (
          <div className="w-[18px] flex-shrink-0"></div>
        )}
        <button 
          onClick={() => setSelectedTags(isSelectedExact ? "" : currentPath)}
          className={`flex-grow text-left rounded-md px-2 py-1 text-sm transition-colors w-full truncate ${isSelectedExact ? 'text-white bg-orange-500' : isActiveBranch ? 'text-orange-600 font-medium' : 'text-gray-600 hover:bg-gray-100'}`}
        >
          {node.name}
        </button>
      </div>

      {isOpen && hasChildren && (
        <div className="mt-1 space-y-1">
          {node.children.map(child => (
            <TagFilterNode
              key={child.name}
              node={child}
              currentPath={`${currentPath}/${child.name}`}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default TagFilterNode;
