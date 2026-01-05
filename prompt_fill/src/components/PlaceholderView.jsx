// PlaceholderView.jsx
import React from 'react';
import { NodeViewWrapper } from '@tiptap/react';

export const PlaceholderView = ({ node, editor, getPos, deleteNode, onClick }) => {
  const { key } = node.attrs;
  
  const handleClick = (event) => {
    if (onClick) {
      onClick(key, event);
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      className="bg-orange-200 text-orange-800 px-2 py-1 rounded-md cursor-pointer"
      onClick={handleClick}
    >
      {`{{${key}}}`}
    </NodeViewWrapper>
  );
};