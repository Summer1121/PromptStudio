/**
 * LLM 适配器：根据 llmSettings.modelType 构造请求并解析响应，返回 { text }。
 * - custom：OpenAI 形（POST endpoint, Authorization: Bearer, body { model, messages }），支持 stream + onFirstChunk
 * - gemini：Google Generative Language generateContent，API Key 用 ?key=，暂不支持流式
 * - qwen：DashScope OpenAI 兼容 chat/completions，支持 stream + onFirstChunk
 */
import { LLM_MODEL_CONFIG } from '../constants/llm-config';

/**
 * 解析 OpenAI 兼容的 SSE 流，累积 content，在收到首个内容时调用 onFirstChunk，最终返回完整文本。
 * @param {Response} res - fetch 返回的 Response（body 为 stream）
 * @param {() => void} [onFirstChunk] - 收到首个 content 增量时调用
 * @returns {Promise<string>}
 */
async function streamOpenAICompatibleResponse(res, onFirstChunk) {
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';
  let firstFired = false;
  /** 当服务端忽略 stream 返回纯 JSON 时，用于回退解析 */
  let rawJsonFallback = '';
  try {
    for (;;) {
      const { value, done } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';
      for (const ev of events) {
        const line = ev.trim().split('\n').find((l) => l.startsWith('data: '));
        if (line) {
          const d = line.slice(6).trim();
          if (d === '[DONE]') return fullText;
          try {
            const j = JSON.parse(d);
            const c = j?.choices?.[0]?.delta?.content;
            if (typeof c === 'string' && c) {
              fullText += c;
              if (!firstFired && onFirstChunk) {
                firstFired = true;
                onFirstChunk();
              }
            }
          } catch (_) {}
        } else if (ev.trim().startsWith('{')) {
          rawJsonFallback = ev.trim();
        }
      }
    }
    if (fullText === '' && rawJsonFallback) {
      try {
        const j = JSON.parse(rawJsonFallback);
        return j?.choices?.[0]?.message?.content ?? '';
      } catch (_) {}
    }
  } finally {
    try {
      reader.releaseLock();
    } catch (_) {}
  }
  return fullText;
}

/**
 * @param {{ llmSettings: { modelType?: string, endpoint?: string, apiKey?: string, model?: string }, systemContent: string, userContent: string }}
 * @param {{ stream?: boolean, onFirstChunk?: () => void }} [opts] - stream: 使用流式；onFirstChunk: 收到首个内容块时回调（仅 custom/qwen 流式时生效）
 * @returns {Promise<{ text: string }>}
 */
export async function invokeLlm({ llmSettings, systemContent, userContent }, opts = {}) {
  const mt = llmSettings?.modelType || 'custom';

  if (mt === 'gemini') {
    return invokeGemini({ llmSettings, systemContent, userContent });
  }
  if (mt === 'qwen') {
    return invokeQwen({ llmSettings, systemContent, userContent }, opts);
  }
  return invokeCustom({ llmSettings, systemContent, userContent }, opts);
}

async function invokeCustom({ llmSettings, systemContent, userContent }, opts = {}) {
  const endpoint = llmSettings?.endpoint?.trim();
  const apiKey = llmSettings?.apiKey?.trim();
  const model = llmSettings?.model?.trim() || LLM_MODEL_CONFIG.custom.defaultModel;

  if (!endpoint || !apiKey) {
    throw new Error('LLM_CUSTOM_REQUIRED'); // 由调用方映射为 llm_settings_not_configured 或必填提示
  }

  const useStream = !!(opts.stream && opts.onFirstChunk);
  const body = {
    model,
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ],
    ...(useStream && { stream: true }),
  };

  const res = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  if (useStream) {
    const text = await streamOpenAICompatibleResponse(res, opts.onFirstChunk);
    return { text };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (text == null) throw new Error('LLM_PARSE_EMPTY');
  return { text };
}

async function invokeGemini({ llmSettings, systemContent, userContent }) {
  const apiKey = llmSettings?.apiKey?.trim();
  const model = llmSettings?.model?.trim() || LLM_MODEL_CONFIG.gemini.defaultModel;

  if (!apiKey) throw new Error('LLM_GEMINI_REQUIRED');

  // Google Generative Language API: generateContent
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
  // 将 system 与 user 合并到一条 user 消息中（Gemini 部分型号支持 systemInstruction，此处用简单合并）
  const combined = `${systemContent}\n\n---\n\n${userContent}`;

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ text: combined }] }],
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (text == null) throw new Error('LLM_PARSE_EMPTY');
  return { text };
}

async function invokeQwen({ llmSettings, systemContent, userContent }, opts = {}) {
  const apiKey = llmSettings?.apiKey?.trim();
  const model = llmSettings?.model?.trim() || LLM_MODEL_CONFIG.qwen.defaultModel;

  if (!apiKey) throw new Error('LLM_QWEN_REQUIRED');

  const useStream = !!(opts.stream && opts.onFirstChunk);
  const body = {
    model,
    messages: [
      { role: 'system', content: systemContent },
      { role: 'user', content: userContent },
    ],
    ...(useStream && { stream: true }),
  };

  const res = await fetch(LLM_MODEL_CONFIG.qwen.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`HTTP ${res.status}: ${errText}`);
  }

  if (useStream) {
    const text = await streamOpenAICompatibleResponse(res, opts.onFirstChunk);
    return { text };
  }

  const data = await res.json();
  const text = data?.choices?.[0]?.message?.content;
  if (text == null) throw new Error('LLM_PARSE_EMPTY');
  return { text };
}

/**
 * 校验当前 llmSettings 是否满足调用要求（用于智能优化、后续 handleGenerate 等）
 * @param {Record<string, unknown>} llmSettings
 * @returns {boolean}
 */
export function isLlmConfigured(llmSettings) {
  if (!llmSettings || typeof llmSettings !== 'object') return false;
  const mt = llmSettings.modelType || 'custom';
  if (mt === 'custom') {
    return !!(llmSettings.endpoint && String(llmSettings.endpoint).trim() && llmSettings.apiKey && String(llmSettings.apiKey).trim());
  }
  if (mt === 'gemini') {
    return !!(llmSettings.apiKey && String(llmSettings.apiKey).trim());
  }
  if (mt === 'qwen') {
    return !!(llmSettings.apiKey && String(llmSettings.apiKey).trim());
  }
  return false;
}
