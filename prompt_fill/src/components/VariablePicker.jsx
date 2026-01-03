// VariablePicker.jsx
import React from 'react';

export const VariablePicker = ({ options, onSelect, onClose }) => {
  console.log('VariablePicker rendered with options:', options);
  return (
    <div 
      className="absolute z-50 bg-white rounded-md shadow-lg border border-gray-200 min-w-max"
    >
      <div className="p-2">
        <ul className="space-y-1">
          {options.map((option, index) => (
            <li key={index}>
              <button
                onClick={() => onSelect(index)}
                className="w-full text-left px-3 py-1.5 text-sm text-gray-700 rounded-md hover:bg-gray-100 focus:outline-none focus:bg-gray-100"
              >
                {option}
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};
