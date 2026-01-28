import React, { useState, useEffect } from 'react';
import { Sparkles, Code, Save, X, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { invokeLlm } from '../services/llm-adapter';
import { PROMPT_TO_SKILL_SYSTEM, buildPromptToSkillUserPrompt } from '../constants/optimize-prompts';
import { getLocalized, hashCode } from '../utils/helpers';

export const PromptToSkillModal = ({ 
    activeTemplate, 
    llmSettings, 
    onClose, 
    t, 
    language,
    onSuccess 
}) => {
    const [step, setStep] = useState('analyzing'); // 'analyzing', 'preview', 'saving', 'success', 'error'
    const [skillData, setSkillData] = useState(null);
    const [editedCode, setEditedCode] = useState('');
    const [skillName, setSkillName] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    useEffect(() => {
        analyzePrompt();
    }, []);

    const analyzePrompt = async () => {
        setStep('analyzing');
        try {
            const content = getLocalized(activeTemplate.content, language);
            const title = getLocalized(activeTemplate.name, language);
            
            // Extract variables
            const varRegex = /\{\{([a-zA-Z0-9_]+)\}\}/g;
            const variables = [];
            let match;
            while ((match = varRegex.exec(content)) !== null) {
                if (!variables.includes(match[1])) {
                    variables.push(match[1]);
                }
            }

            const { text } = await invokeLlm({
                llmSettings,
                systemContent: PROMPT_TO_SKILL_SYSTEM,
                userContent: buildPromptToSkillUserPrompt(title, content, variables)
            });

            let data;
            try {
                // Try to find JSON if model output extra text
                const jsonStr = text.match(/\{[\s\S]*\}/)?.[0] || text;
                data = JSON.parse(jsonStr);
            } catch (e) {
                console.error('Failed to parse AI output:', text);
                throw new Error('AI 返回格式错误，请重试');
            }

            setSkillData(data);
            setSkillName(activeTemplate?.linkedSkill?.name || data.name || 'new-skill');
            setEditedCode(data.code || '');
            setStep('preview');
        } catch (err) {
            console.error('Prompt to Skill analysis error:', err);
            setErrorMessage(err.message || '分析提示词失败');
            setStep('error');
        }
    };

    const handleSave = async () => {
        setStep('saving');
        try {
            const response = await fetch('http://localhost:19880/api/v1/mcp/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    name: skillName, 
                    code: editedCode,
                    // Pass current LLM settings to be injected as env if needed by backend
                    env: {
                        LLM_API_KEY: llmSettings.apiKey || '',
                        LLM_ENDPOINT: llmSettings.endpoint || '',
                        LLM_MODEL: llmSettings.model || ''
                    }
                })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.detail || '保存失败');
            }

            const currentHash = hashCode(getLocalized(activeTemplate.content, language));
            onSuccess(skillName, currentHash);
            setStep('success');
        } catch (err) {
            console.error('Save skill error:', err);
            setErrorMessage(err.message || '保存技能失败');
            setStep('error');
        }
    };

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-indigo-50/50">
                    <div className="flex items-center gap-3 text-indigo-600">
                        <Sparkles size={24} />
                        <h2 className="text-xl font-bold">{activeTemplate?.linkedSkill ? t('update_skill') : t('save_as_skill')}</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                        <X size={20} className="text-gray-400" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {step === 'analyzing' && (
                        <div className="flex flex-col items-center justify-center py-20 text-indigo-500">
                            <Loader2 size={48} className="animate-spin mb-4" />
                            <p className="text-lg font-medium">AI 正在分析提示词并生成 Skill 代码...</p>
                        </div>
                    )}

                    {step === 'preview' && (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">技能名称</label>
                                    <input 
                                        type="text" 
                                        value={skillName}
                                        onChange={(e) => setSkillName(e.target.value)}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-gray-500 uppercase">参数列表</label>
                                    <div className="flex flex-wrap gap-1">
                                        {skillData?.arguments?.map(arg => (
                                            <span key={arg.name} className="px-2 py-1 bg-indigo-50 text-indigo-600 rounded text-[10px] font-mono border border-indigo-100" title={arg.description}>
                                                {arg.name}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">功能描述</label>
                                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg border border-gray-100 italic">
                                    {skillData?.description}
                                </p>
                            </div>

                            <div className="space-y-1 flex-1 flex flex-col min-h-[300px]">
                                <label className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                    <Code size={14} /> 核心代码预览 (FastMCP)
                                </label>
                                <textarea 
                                    value={editedCode}
                                    onChange={(e) => setEditedCode(e.target.value)}
                                    className="flex-1 w-full p-4 font-mono text-xs bg-gray-900 text-gray-100 rounded-xl resize-none outline-none border-2 border-transparent focus:border-indigo-500/50"
                                    spellCheck="false"
                                />
                                <p className="text-[10px] text-gray-400 mt-1">提示：您可以手动优化代码逻辑，确保 API 调用配置正确。</p>
                            </div>
                        </div>
                    )}

                    {step === 'saving' && (
                        <div className="flex flex-col items-center justify-center py-20 text-orange-500">
                            <Loader2 size={48} className="animate-spin mb-4" />
                            <p className="text-lg font-medium">正在保存到 MCP 资源中心...</p>
                        </div>
                    )}

                    {step === 'success' && (
                        <div className="flex flex-col items-center justify-center py-20 text-green-500">
                            <CheckCircle2 size={64} className="mb-4" />
                            <h3 className="text-2xl font-bold mb-2">发布成功！</h3>
                            <p className="text-gray-500 mb-6">您的提示词已成功转化为 MCP Skill，并在后台开始运行。</p>
                            <button onClick={onClose} className="px-8 py-2 bg-green-500 text-white rounded-full font-bold hover:bg-green-600 transition-colors">
                                太棒了
                            </button>
                        </div>
                    )}

                    {step === 'error' && (
                        <div className="flex flex-col items-center justify-center py-20 text-red-500">
                            <AlertCircle size={64} className="mb-4" />
                            <h3 className="text-2xl font-bold mb-2">出现错误</h3>
                            <p className="text-gray-600 mb-6 text-center max-w-md">{errorMessage}</p>
                            <div className="flex gap-4">
                                <button onClick={analyzePrompt} className="px-6 py-2 bg-gray-100 text-gray-700 rounded-full font-bold hover:bg-gray-200 transition-colors">
                                    重试分析
                                </button>
                                <button onClick={onClose} className="px-6 py-2 bg-red-500 text-white rounded-full font-bold hover:bg-red-600 transition-colors">
                                    取消退出
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                {step === 'preview' && (
                    <div className="px-6 py-4 border-t bg-gray-50 flex justify-end gap-3">
                        <button 
                            onClick={onClose}
                            className="px-4 py-2 text-sm text-gray-500 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleSave}
                            className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                        >
                            <Save size={16} /> 保存并运行
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};
