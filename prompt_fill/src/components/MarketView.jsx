import React, { useState, useEffect } from 'react';
import { marketService } from '../services/market';
import { Search, Download, ThumbsUp, MessageSquare, ArrowLeft } from 'lucide-react';

const MarketView = ({ onClose, onInstall, t }) => {
    const [prompts, setPrompts] = useState([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(true);
    const [selectedPrompt, setSelectedPrompt] = useState(null);

    useEffect(() => {
        loadPrompts();
    }, [search]);

    const loadPrompts = async () => {
        setLoading(true);
        try {
            const data = await marketService.listPrompts({ search });
            setPrompts(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (selectedPrompt) {
        return <MarketPromptDetail 
            promptUuid={selectedPrompt.uuid} 
            onBack={() => setSelectedPrompt(null)} 
            onInstall={onInstall}
            t={t}
        />;
    }

    return (
        <div className="flex flex-col h-full bg-gray-50 overflow-hidden">
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-600" title="返回">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-xl font-bold text-gray-800">提示词市场</h1>
                </div>
                <div className="relative w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                    <input
                        type="text"
                        placeholder="搜索提示词或标签..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-full focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                </div>
            </header>

            <main className="flex-1 overflow-y-auto p-6">
                {loading ? (
                    <div className="flex items-center justify-center h-full text-gray-500">加载中...</div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {prompts.map(prompt => (
                            <div 
                                key={prompt.uuid}
                                onClick={() => setSelectedPrompt(prompt)}
                                className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-shadow p-5 cursor-pointer flex flex-col"
                            >
                                <h3 className="text-lg font-bold text-gray-800 mb-2 truncate list-item-text">{prompt.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-3 flex-1 mb-4">{prompt.description}</p>
                                <div className="flex items-center justify-between text-xs text-gray-400">
                                    <div className="flex items-center gap-3">
                                        <span className="flex items-center gap-1"><ThumbsUp size={14} /> {prompt.like_count}</span>
                                        <span className="flex items-center gap-1"><MessageSquare size={14} /> 评论</span>
                                    </div>
                                    <span>by {prompt.owner_name}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </main>
        </div>
    );
};

const MarketPromptDetail = ({ promptUuid, onBack, onInstall, t }) => {
    const [prompt, setPrompt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [comment, setComment] = useState('');

    useEffect(() => {
        setLoading(true);
        marketService.getPromptDetail(promptUuid)
            .then(data => {
                setPrompt(data);
                setError(null);
            })
            .catch(err => {
                console.error(err);
                setError('加载详情失败');
            })
            .finally(() => {
                setLoading(false);
            });
    }, [promptUuid]);

    const handleLike = async () => {
        try {
            await marketService.interact(promptUuid, 'like');
            setPrompt(prev => ({ ...prev, like_count: (prev.like_count || 0) + 1 }));
        } catch (err) {
            console.error(err);
        }
    };

    const handleInstall = () => {
        if (prompt) onInstall(prompt);
    };

    if (loading) return <div className="flex-1 flex items-center justify-center">加载中...</div>;
    if (error) return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4">
            <div className="text-red-500">{error}</div>
            <button onClick={onBack} className="px-4 py-2 border rounded hover:bg-gray-50">返回列表</button>
        </div>
    );
    if (!prompt) return <div className="flex-1 flex items-center justify-center">未找到该提示词</div>;

    return (
        <div className="flex flex-col h-full bg-white overflow-hidden">
            <header className="border-b px-6 py-4 flex items-center justify-between">
                <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                    <ArrowLeft size={20} /> 返回列表
                </button>
                <button 
                    onClick={handleInstall}
                    className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                    <Download size={18} /> 安装到本地
                </button>
            </header>

            <main className="flex-1 overflow-y-auto p-8 max-w-4xl mx-auto w-full">
                <h1 className="text-3xl font-bold mb-4">{prompt.title}</h1>
                <div className="flex items-center gap-4 text-sm text-gray-500 mb-8">
                    <span>作者: {prompt.owner_name}</span>
                    <span>版本: v{prompt.latest_version}</span>
                    <span>发布时间: {new Date(prompt.created_at).toLocaleDateString()}</span>
                </div>

                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-2">描述</h2>
                    <p className="text-gray-700 whitespace-pre-wrap">{prompt.description}</p>
                </section>

                <section className="mb-8">
                    <h2 className="text-lg font-bold mb-2">提示词内容</h2>
                    <div className="bg-gray-50 rounded-lg p-4 font-mono text-sm border whitespace-pre-wrap">
                        {prompt.latest_content}
                    </div>
                </section>

                <hr className="my-8" />

                <section>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold">社区互动</h2>
                        <button onClick={handleLike} className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50">
                            <ThumbsUp size={18} /> 点赞 ({prompt.like_count})
                        </button>
                    </div>
                    
                    {/* 评论区简略实现 */}
                    <div className="space-y-4">
                        <textarea
                            className="w-full border rounded-lg p-3 outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="写下你的想法..."
                            rows={3}
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                        />
                        <button className="px-6 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-900">
                            发布评论
                        </button>
                    </div>
                </section>
            </main>
        </div>
    );
};

export default MarketView;
