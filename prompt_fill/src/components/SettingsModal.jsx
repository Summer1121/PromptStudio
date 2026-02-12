import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { message } from '@tauri-apps/plugin-dialog';
import { LLM_MODEL_CONFIG } from '../constants/llm-config';

// 归一化：旧数据缺 modelType 时视为 custom
function normalizeSettings(settings) {
  const s = settings || {};
  const modelType = s.modelType || 'custom';
  return {
    ...s,
    modelType,
    model: s.model ?? (LLM_MODEL_CONFIG[modelType]?.defaultModel ?? LLM_MODEL_CONFIG.custom.defaultModel),
  };
}

export const SettingsModal = ({ settings, setSettings, onClose, t }) => {
  const [localSettings, setLocalSettings] = useState(() => normalizeSettings(settings));

  // 当外部 settings 变化时（如初次打开）同步到 local
  useEffect(() => {
    setLocalSettings(normalizeSettings(settings));
  }, [settings]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'modelType') {
      // 切换模型类型时，将 model 置为该校验类型的默认模型
      const defaultModel = LLM_MODEL_CONFIG[value]?.defaultModel ?? LLM_MODEL_CONFIG.custom.defaultModel;
      setLocalSettings(prev => ({ ...prev, modelType: value, model: defaultModel }));
    } else {
      setLocalSettings(prev => ({ ...prev, [name]: value }));
    }
  };

  const validate = () => {
    const mt = localSettings.modelType || 'custom';
    if (mt === 'custom') {
      if (!localSettings.endpoint?.trim()) return false;
      if (!localSettings.apiKey?.trim()) return false;
    } else if (mt === 'gemini') {
      if (!localSettings.apiKey?.trim()) return false;
    } else if (mt === 'qwen') {
      if (!localSettings.apiKey?.trim()) return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) {
      await message(t('llm_required_validation'));
      return;
    }
    // 保存时补全 modelType，便于持久化
    const toSave = { ...localSettings, modelType: localSettings.modelType || 'custom' };
    setSettings(toSave);
    onClose();
  };

  const modelType = localSettings.modelType || 'custom';
  const isCustom = modelType === 'custom';
  const isGemini = modelType === 'gemini';
  const isQwen = modelType === 'qwen';
  const modelDocUrl = LLM_MODEL_CONFIG[modelType]?.docUrl ?? LLM_MODEL_CONFIG.custom.docUrl;

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
          {/* 模型类型选择 */}
          <div>
            <label className="block text-sm font-medium text-gray-700">{t('llm_model_type')}</label>
            <select
              name="modelType"
              value={modelType}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value="custom">{t('llm_model_type_custom')}</option>
              <option value="gemini">{t('llm_model_type_gemini')}</option>
              <option value="qwen">{t('llm_model_type_qwen')}</option>
            </select>
          </div>

          {/* 自定义：endpoint、apiKey、model */}
          {isCustom && (
            <>
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
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('llm_model_name')}（{t('optional')}）</label>
                  <a href={modelDocUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{t('llm_model_doc_link')}</a>
                </div>
                <input
                  type="text"
                  name="model"
                  value={localSettings.model || ''}
                  onChange={handleChange}
                  placeholder={LLM_MODEL_CONFIG.custom.defaultModel}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}

          {/* Gemini：apiKey、model */}
          {isGemini && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('llm_api_endpoint')} (Proxy)</label>
                <input
                  type="text"
                  name="endpoint"
                  value={localSettings.endpoint || ''}
                  onChange={handleChange}
                  placeholder="https://generativelanguage.googleapis.com"
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
                  placeholder="Google AI Studio API Key"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('llm_model_name')}（{t('optional')}）</label>
                  <a href={modelDocUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{t('llm_model_doc_link')}</a>
                </div>
                <input
                  type="text"
                  name="model"
                  value={localSettings.model || ''}
                  onChange={handleChange}
                  placeholder={LLM_MODEL_CONFIG.gemini.defaultModel}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}

          {/* 千问：apiKey、model */}
          {isQwen && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700">{t('llm_api_key')}</label>
                <input
                  type="password"
                  name="apiKey"
                  value={localSettings.apiKey || ''}
                  onChange={handleChange}
                  placeholder="DashScope / 通义千问 API Key"
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
              <div>
                <div className="flex justify-between items-center">
                  <label className="block text-sm font-medium text-gray-700">{t('llm_model_name')}（{t('optional')}）</label>
                  <a href={modelDocUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">{t('llm_model_doc_link')}</a>
                </div>
                <input
                  type="text"
                  name="model"
                  value={localSettings.model || ''}
                  onChange={handleChange}
                  placeholder={LLM_MODEL_CONFIG.qwen.defaultModel}
                  className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                />
              </div>
            </>
          )}
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
