import React, { useState } from 'react';
import { X } from 'lucide-react';

export const SettingsModal = ({ settings, setSettings, onClose, t }) => {
  const [localSettings, setLocalSettings] = useState(settings);

  const handleSave = () => {
    setSettings(localSettings);
    onClose();
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setLocalSettings(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-lg">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">{t('settings')}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200">
            <X size={20} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('llm_api_endpoint')}</label>
            <input
              type="text"
              name="endpoint"
              value={localSettings.endpoint || ''}
              onChange={handleChange}
              placeholder="https://api.openai.com/v1/chat/completions"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('llm_api_key')}</label>
            <input
              type="password"
              name="apiKey"
              value={localSettings.apiKey || ''}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300">
            {t('cancel')}
          </button>
          <button onClick={handleSave} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
            {t('save')}
          </button>
        </div>
      </div>
    </div>
  );
};
