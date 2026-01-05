import React, { useContext } from 'react';
import { NodeViewWrapper, NodeViewContent } from '@tiptap/react';
import { getLocalized } from '../utils/helpers';
import { CATEGORY_STYLES } from '../constants/styles';

// Using a React Context to provide data deep down to the node view
// without prop-drilling through the Tiptap component hierarchy.
export const EditorContext = React.createContext({});

export const VariableNode = (props) => {
  const { node } = props;
  const { 
    banks, 
    categories, 
    activeTemplate, 
    language, 
    onVariableClick 
  } = useContext(EditorContext);

  const key = node.attrs['data-variable-key'];
  const bank = banks[key];
  const categoryId = bank?.category || 'other';
  const colorKey = categories[categoryId]?.color || 'slate';
  const style = CATEGORY_STYLES[colorKey];
  
  // Calculate the selection key. The position (`getPos()`) ensures it's unique
  // even if the same variable appears multiple times.
  const selectionKey = `${activeTemplate.id}-${key}-${props.getPos()}`;
  const selectionIndex = activeTemplate.selections?.[selectionKey];
  
  let content = `{{${key}}}`;
  if (selectionIndex !== undefined && bank) {
    const option = bank.options[selectionIndex];
    content = getLocalized(option, language);
  }

  const handleClick = (e) => {
    // Stop propagation to prevent the editor from handling the click.
    e.stopPropagation();
    if (onVariableClick) {
      onVariableClick(key, e, props.getPos());
    }
  };

  return (
    <NodeViewWrapper
      as="span"
      onClick={handleClick}
      className={`${style.bg} ${style.text} font-bold rounded-sm cursor-pointer mx-px px-1 select-none`}
      draggable="true"
      data-drag-handle
    >
      {content}
    </NodeViewWrapper>
  );
};