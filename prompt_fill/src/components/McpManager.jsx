import React, { useState, useEffect } from 'react';
import { Settings, Play, Square, Terminal, Plus, Trash2, Cpu, Globe, Code, Save, RotateCcw, HelpCircle } from 'lucide-react';
import { listMcpTools, getMcpServers, getLastActiveServers, startMcpServer, stopMcpServer } from '../services/mcp-service';
import { confirm, message } from '@tauri-apps/plugin-dialog';

const McpManager = ({ onClose, t }) => {
    const [servers, setServers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('servers'); // 'servers', 'skills'
    
    // Skill Editor State
    const [skills, setSkills] = useState([]);
    const [selectedSkill, setSelectedSkill] = useState(null);
    const [editorContent, setEditorContent] = useState('');
    const [skillName, setSkillName] = useState('');
    const [isEditingSkill, setIsEditingSkill] = useState(false);
    const [showHelp, setShowHelp] = useState(false);

    const refreshData = async () => {
        setLoading(true);
        try {
            const serverList = await getMcpServers();
            setServers(serverList);
            
            const skillsRes = await fetch('http://localhost:19880/api/v1/mcp/skills');
            const { skills: skillsList } = await skillsRes.json();
            setSkills(skillsList || []);
        } catch (error) {
            console.error('Failed to load MCP data', error);
        } finally {
            setLoading(false);
        }
    };

    const checkAndRestoreServers = async () => {
        try {
            const { last_active_servers } = await getLastActiveServers();
            // 过滤掉已经在运行的
            const currentRunning = servers.map(s => s.name);
            const toRestore = last_active_servers.filter(name => !currentRunning.includes(name));

            if (toRestore.length > 0) {
                const confirmed = await confirm(`检测到上次有 ${toRestore.length} 个 MCP 服务正在运行 (${toRestore.join(', ')})。是否恢复启动？`, { 
                    title: '恢复 MCP 服务',
                    type: 'info'
                });
                
                if (confirmed) {
                    for (const name of toRestore) {
                        try {
                            await startMcpServer(name);
                        } catch (e) {
                            console.error(`Failed to start ${name}`, e);
                        }
                    }
                    await refreshData();
                    await message(`已尝试恢复 ${toRestore.length} 个服务。`);
                }
            }
        } catch (e) {
            console.error('Failed to restore servers', e);
        }
    };

    useEffect(() => {
        refreshData().then(() => {
            // 延迟一点检查，避免UI闪烁
            setTimeout(checkAndRestoreServers, 500);
        });
    }, []);

    const handleCreateSkill = () => {
        setIsEditingSkill(true);
        setSelectedSkill(null);
        setSkillName('');
        setEditorContent(`# /// script
# dependencies = []
# ///

def run_tool(param1: str) -> str:
    """
    在这里写下工具的详细描述。
    
    AI 会读取这段文字来决定何时调用此工具。
    例如： "计算两个数的和" 或 "查询当前天气"。
    
    Args:
        param1: 参数说明...
    """
    return f"Hello {param1}"`);
    };

    const handleSaveSkill = async () => {
        if (!skillName.trim()) return;
        try {
            const res = await fetch('http://localhost:19880/api/v1/mcp/skills', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: skillName, code: editorContent })
            });
            if (res.ok) {
                await refreshData();
                setIsEditingSkill(false);
            }
        } catch (error) {
            console.error('Failed to save skill', error);
        }
    };

    const handleSelectSkill = async (skill) => {
        try {
            const res = await fetch(`http://localhost:19880/api/v1/mcp/skills/${skill.name}`);
            const data = await res.json();
            setSelectedSkill(skill);
            setIsEditingSkill(true);
            setSkillName(data.name);
            setEditorContent(data.code);
        } catch (error) {
            console.error('Failed to load skill detail', error);
        }
    };

    const handleStopServer = async (serverName) => {
        try {
            await stopMcpServer(serverName);
            await refreshData();
            await message(`服务器 ${serverName} 已停止`);
        } catch (e) {
            console.error('Stop server failed', e);
        }
    };

    const handleViewLogs = (serverName) => {
        // TODO: Implement real log viewer via WebSocket or polling
        message(`查看 ${serverName} 日志功能暂未开放。请查看终端输出。`);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl h-[80vh] flex flex-col overflow-hidden">
                {/* Header */}
                <div className="px-6 py-4 border-b flex items-center justify-between bg-gray-50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                            <Cpu size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-gray-800">{t('mcp_resource_hub')}</h2>
                            <p className="text-sm text-gray-500">管理本地 AI 技能与 MCP 服务</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setShowHelp(true)}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors text-blue-500"
                            title="如何连接"
                        >
                            <HelpCircle size={20} />
                        </button>
                        <button 
                            onClick={onClose}
                            className="p-2 hover:bg-gray-200 rounded-full transition-colors"
                        >
                            <Trash2 size={20} className="text-gray-400 rotate-45" />
                        </button>
                    </div>
                </div>

                {/* Help Modal */}
                {showHelp && (
                    <div className="absolute inset-0 bg-white z-50 flex flex-col p-6 animate-in slide-in-from-bottom-10 fade-in duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-gray-800">如何连接外部客户端</h2>
                            <button onClick={() => setShowHelp(false)} className="p-2 hover:bg-gray-100 rounded-full">
                                <Trash2 size={24} className="rotate-45 text-gray-500" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto prose max-w-none text-sm text-gray-600 space-y-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2">1. Gemini CLI</h3>
                                <p className="mb-2">修改配置文件 <code>~/.gemini/settings.json</code>：</p>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`"mcpServers": {
  "local": {
    "url": "http://localhost:19880/api/v1/mcp/sse"
  }
}`}
                                </pre>
                            </div>

                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <h3 className="font-bold text-gray-800 mb-2">2. Claude Desktop</h3>
                                <p className="mb-2">使用桥接脚本连接：</p>
                                <pre className="bg-gray-900 text-gray-100 p-3 rounded overflow-x-auto">
{`"mcpServers": {
  "prompt-studio": {
    "command": "python",
    "args": ["${window.__TAURI_INTERNALS__ ? 'path/to/' : ''}ps-mcp-bridge.py"]
  }
}`}
                                </pre>
                                <p className="mt-2 text-xs text-gray-500">注意：请使用 ps-mcp-bridge.py 的绝对路径。</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Tabs */}
                <div className="flex border-b px-6 bg-white">
                    <button 
                        onClick={() => setActiveTab('servers')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'servers' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        已连接的服务 (Servers)
                    </button>
                    <button 
                        onClick={() => setActiveTab('skills')}
                        className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'skills' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        我的技能 (Skills)
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-6 bg-gray-50/30">
                    {activeTab === 'servers' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {servers.length > 0 ? servers.map(server => (
                                <div key={server.name} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
                                    <div className="flex items-start justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                                                <Globe size={18} />
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800">{server.name}</h3>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                                    Running
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <button 
                                                onClick={() => handleViewLogs(server.name)}
                                                className="p-1.5 hover:bg-gray-100 rounded text-gray-400" 
                                                title="日志"
                                            >
                                                <Terminal size={16} />
                                            </button>
                                            <button 
                                                onClick={() => handleStopServer(server.name)}
                                                className="p-1.5 hover:bg-red-50 text-red-400 rounded" 
                                                title="停止"
                                            >
                                                <Square size={16} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-xs text-gray-400 uppercase font-semibold">可用工具:</p>
                                        <div className="flex flex-wrap gap-1">
                                            {server.tools.map(tool => (
                                                <span key={tool.name} className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] border border-gray-200">
                                                    {tool.name}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )) : (
                                <div className="col-span-full py-12 text-center text-gray-400">
                                    暂无运行中的 MCP 服务
                                </div>
                            )}
                            
                            <button className="border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-orange-300 hover:bg-orange-50 transition-all text-gray-400 hover:text-orange-500">
                                <Plus size={24} />
                                <span className="text-sm font-medium">添加外部 MCP 服务器</span>
                            </button>
                        </div>
                    ) : (
                        <div className="flex h-full gap-4">
                            {/* Skill List Sidebar */}
                            <div className="w-1/4 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                                <div className="p-3 border-b bg-gray-50 flex justify-between items-center">
                                    <span className="text-xs font-bold text-gray-500 uppercase">本地脚本</span>
                                    <button onClick={handleCreateSkill} className="p-1 hover:bg-gray-200 rounded text-orange-600">
                                        <Plus size={16} />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-y-auto">
                                    {skills.map(skill => (
                                        <button 
                                            key={skill.name}
                                            onClick={() => handleSelectSkill(skill)}
                                            className={`w-full text-left px-4 py-3 text-sm hover:bg-gray-50 border-b border-gray-50 ${selectedSkill?.name === skill.name ? 'bg-orange-50 text-orange-700 border-l-4 border-l-orange-500' : 'text-gray-700'}`}
                                        >
                                            <div className="font-medium">{skill.name}</div>
                                            <div className="text-xs text-gray-400 truncate">{skill.filename}</div>
                                        </button>
                                    ))}
                                    {skills.length === 0 && (
                                        <div className="p-4 text-center text-xs text-gray-400">
                                            点击 + 创建新技能
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Editor Area */}
                            <div className="flex-1 bg-white rounded-xl border border-gray-200 flex flex-col overflow-hidden">
                                {isEditingSkill ? (
                                    <>
                                        <div className="px-4 py-2 border-b flex items-center justify-between bg-gray-50">
                                            <input 
                                                type="text" 
                                                value={skillName}
                                                onChange={(e) => setSkillName(e.target.value)}
                                                placeholder="输入技能名称 (如 get_weather)"
                                                className="bg-transparent font-mono font-bold text-gray-800 outline-none w-full"
                                            />
                                            <div className="flex gap-2">
                                                <button onClick={handleSaveSkill} className="flex items-center gap-1 px-3 py-1.5 bg-orange-500 text-white rounded-lg text-xs font-bold hover:bg-orange-600 transition-colors">
                                                    <Save size={14} /> 保存并运行
                                                </button>
                                            </div>
                                        </div>
                                        <div className="flex-1 relative">
                                            <textarea 
                                                value={editorContent}
                                                onChange={(e) => setEditorContent(e.target.value)}
                                                className="absolute inset-0 w-full h-full p-4 font-mono text-sm bg-gray-900 text-gray-100 resize-none outline-none"
                                                spellCheck="false"
                                            />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                                        <Code size={48} className="mb-4 opacity-20" />
                                        <p>选择或创建一个技能开始编辑</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t bg-white flex justify-end">
                    <button 
                        onClick={refreshData}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <RotateCcw size={14} /> 刷新列表
                    </button>
                </div>
            </div>
        </div>
    );
};

export default McpManager;