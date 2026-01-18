import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * URL 输入对话框组件
 * 用于输入图片或视频 URL（替代 window.prompt）
 */
export const URLInputModal = ({ isOpen, onClose, onConfirm, title, placeholder, t }) => {
  const [url, setUrl] = useState('');

  useEffect(() => {
    if (isOpen) {
      setUrl('');
      // 聚焦到输入框
      setTimeout(() => {
        const input = document.getElementById('url-input-modal');
        if (input) input.focus();
      }, 100);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (url.trim()) {
      onConfirm(url.trim());
      setUrl('');
      onClose();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleConfirm();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-700">{title}</h3>
          <button 
            onClick={onClose} 
            className="p-1 rounded-full hover:bg-gray-200"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="mb-4">
          <input
            id="url-input-modal"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder || '输入 URL...'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            autoFocus
          />
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
          >
            {t('cancel') || '取消'}
          </button>
          <button
            onClick={handleConfirm}
            disabled={!url.trim()}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {t('confirm') || '确认'}
          </button>
        </div>
      </div>
    </div>
  );
};
