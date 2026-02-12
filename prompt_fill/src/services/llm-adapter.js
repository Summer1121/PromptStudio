import { LLM_MODEL_CONFIG } from '../constants/llm-config';
import { callMcpTool } from './mcp-service';

/**
 * 判断当前是否已配置 LLM
 */
export function isLlmConfigured(settings) {
    if (!settings) return false;
    const type = settings.modelType || 'custom';
    if (type === 'custom') {
        return !!(settings.endpoint && settings.apiKey);
    }
    return !!settings.apiKey;
}

/**
 * 调用 LLM 生成内容，支持流式输出和工具调用 (MCP)
 */
export async function invokeLlm({ llmSettings, systemContent, userContent, messages, tools = [] }, options = {}) {
    const type = llmSettings?.modelType || 'custom';
    const apiKey = llmSettings?.apiKey;
    let modelName = (llmSettings?.model?.trim()) || getDefaultModel(type);
    
    console.log(`[LLM] Using model: ${modelName}, type: ${type}`);
    
    let currentMessages = messages || [];
    if (!messages && (systemContent || userContent)) {
        if (systemContent) currentMessages.push({ role: 'system', content: systemContent });
        if (userContent) currentMessages.push({ role: 'user', content: userContent });
    }

    let finalContent = "";
    const maxTurns = 5;
    let turn = 0;

    while (turn < maxTurns) {
        turn++;
        console.log(`[LLM] Turn ${turn}, messages:`, JSON.parse(JSON.stringify(currentMessages)));

        let response;
        if (type === 'gemini') {
            response = await callGemini(apiKey, modelName, currentMessages, tools, options, llmSettings);
        } else if (type === 'qwen') {
            response = await callQwen(apiKey, modelName, currentMessages, tools, options);
        } else {
            response = await callOpenAICompatible(llmSettings.endpoint, apiKey, modelName, currentMessages, tools, options);
        }

        const toolCalls = response.tool_calls;
        if (toolCalls && toolCalls.length > 0) {
            // 将助手含有 tool_calls 的消息存入历史
            currentMessages.push(response.message);
            
            for (const call of toolCalls) {
                const { id, function: fn } = call;
                const toolName = fn.name;
                const args = typeof fn.arguments === 'string' ? JSON.parse(fn.arguments) : fn.arguments;

                if (options.onToolCall) options.onToolCall(toolName, args);
                
                let toolResult;
                try {
                    const targetTool = tools.find(t => t.name === toolName);
                    const serverName = targetTool?._server_name;
                    
                    if (!serverName) throw new Error(`Unknown server for tool ${toolName}`);

                    const mcpResult = await callMcpTool(serverName, toolName, args);
                    toolResult = mcpResult; // 保持结构，各 adapter 自行处理
                } catch (err) {
                    console.error(`[MCP] Tool execution failed:`, err);
                    toolResult = { error: err.message };
                }

                // 将工具结果加入历史 (使用兼容格式，adapter 会转换)
                currentMessages.push({
                    role: 'tool',
                    tool_call_id: id,
                    content: toolResult,
                    name: toolName
                });
            }
        } else {
            finalContent = response.content;
            break;
        }
    }

    return { text: finalContent };
}

function getDefaultModel(type) {
    if (type === 'gemini') return LLM_MODEL_CONFIG.gemini.defaultModel;
    if (type === 'qwen') return LLM_MODEL_CONFIG.qwen.defaultModel;
    return LLM_MODEL_CONFIG.custom.defaultModel;
}

// --- Helpers ---

async function fetchWithTimeout(resource, options = {}) {
    const { timeout = 300000 } = options; // 延长至 5 分钟
    
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    
    try {
        const response = await fetch(resource, {
            ...options,
            signal: controller.signal
        });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        if (error.name === 'AbortError') {
            throw new Error('模型生成耗时过长 (超过 5 分钟)，请检查网络或尝试切换更快的模型。');
        }
        if (error instanceof TypeError) {
            throw new Error('网络请求失败 (Load Failed): 请检查 API 地址是否正确或是否存在跨域 (CORS) 限制。');
        }
        throw error;
    }
}

// --- Adapters ---

async function callOpenAICompatible(endpoint, apiKey, model, messages, tools, options) {
    const body = {
        model,
        messages: messages.map(m => {
            // 简单转换格式
            if (m.role === 'tool') {
                return { 
                    ...m, 
                    content: typeof m.content === 'object' ? JSON.stringify(m.content) : m.content 
                };
            }
            return m;
        }),
        stream: false, // 简化处理
    };

    if (tools && tools.length > 0) {
        body.tools = tools.map(t => ({
            type: 'function',
            function: {
                name: t.name,
                description: t.description,
                parameters: t.inputSchema || { type: "object", properties: {} }
            }
        }));
    }

    const res = await fetchWithTimeout(endpoint, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        timeout: options.timeout
    });

    if (!res.ok) throw new Error(`OpenAI API Error: ${res.status}`);
    const data = await res.json();
    const choice = data.choices[0];
    return {
        content: choice.message.content || "",
        tool_calls: choice.message.tool_calls,
        message: choice.message
    };
}

async function callGemini(apiKey, model, messages, tools, options, llmSettings) {
    // 转换消息为 Gemini 格式
    // roles: user, model
    let contents = [];
    let systemInstruction = "";

    messages.forEach(m => {
        if (m.role === 'system') {
            systemInstruction = m.content;
        } else if (m.role === 'user') {
            contents.push({ role: 'user', parts: [{ text: m.content }] });
        } else if (m.role === 'assistant') {
            const parts = [];
            if (m.content) parts.push({ text: m.content });
            if (m.tool_calls) {
                m.tool_calls.forEach(tc => {
                    parts.push({ 
                        functionCall: { 
                            name: tc.function.name, 
                            args: typeof tc.function.arguments === 'string' ? JSON.parse(tc.function.arguments) : tc.function.arguments 
                        } 
                    });
                });
            }
            contents.push({ role: 'model', parts });
        } else if (m.role === 'tool') {
            contents.push({
                role: 'model', // Gemini 的 tool 响应也属于 model 角色或单独处理
                parts: [{ 
                    functionResponse: { 
                        name: m.name, 
                        response: { content: m.content } 
                    } 
                }]
            });
        }
    });

    const body = {
        contents,
        generationConfig: {
            temperature: 0.7,
        }
    };

    if (systemInstruction) {
        body.system_instruction = { parts: [{ text: systemInstruction }] };
    }

    if (tools && tools.length > 0) {
        body.tools = [{
            function_declarations: tools.map(t => ({
                name: t.name,
                description: t.description,
                parameters: t.inputSchema || { type: "object", properties: {} }
            }))
        }];
    }

    const baseUrl = llmSettings?.endpoint?.replace(/\/$/, '') || 'https://generativelanguage.googleapis.com';
    const url = `${baseUrl}/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const res = await fetchWithTimeout(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        timeout: options.timeout
    });

    if (!res.ok) {
        const err = await res.json();
        console.error('[Gemini] API Error Response:', {
            status: res.status,
            statusText: res.statusText,
            error: err
        });
        throw new Error(`Gemini Error: ${err.error?.message || JSON.stringify(err) || res.status}`);
    }

    const data = await res.json();
    const candidate = data.candidates[0];
    const assistantParts = candidate.content.parts;
    
    let content = "";
    let tool_calls = [];

    assistantParts.forEach(p => {
        if (p.text) content += p.text;
        if (p.functionCall) {
            tool_calls.push({
                id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
                type: 'function',
                function: {
                    name: p.functionCall.name,
                    arguments: p.functionCall.args
                }
            });
        }
    });

    return {
        content,
        tool_calls,
        message: { 
            role: 'assistant', 
            content, 
            tool_calls: tool_calls.length > 0 ? tool_calls : undefined 
        }
    };
}

async function callQwen(apiKey, model, messages, tools, options) {
    const endpoint = LLM_MODEL_CONFIG.qwen.endpoint;
    return callOpenAICompatible(endpoint, apiKey, model, messages, tools, options);
}
