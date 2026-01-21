/**
 * LLM 预配置：MAP<模型类型, 模型配置>
 * 模型配置: { defaultModel, docUrl, endpoint? }
 * - defaultModel: 未填写时使用的默认模型名
 * - docUrl: 模型列表/选型官方文档链接，用于设置页「查看模型列表」
 * - endpoint: 仅当该类型使用固定 endpoint 时存在（如 qwen/DashScope）；custom 由用户填写，gemini 由适配器按规则拼接
 *
 * llm-adapter、SettingsModal、App.jsx 均从 LLM_MODEL_CONFIG 引用；后续增删模型类型或修改仅改此 MAP。
 */
export const LLM_MODEL_CONFIG = {
  custom: {
    defaultModel: 'gpt-3.5-turbo',
    docUrl: 'https://platform.openai.com/docs/models',
  },
  gemini: {
    defaultModel: 'gemini-1.5-flash',
    docUrl: 'https://ai.google.dev/models/gemini',
  },
  qwen: {
    defaultModel: 'qwen3-max',
    docUrl: 'https://help.aliyun.com/zh/model-studio/models?spm=a2c4g.11186623.0.0.4b7770afA6f7Ir#9f8890ce29g5u',
    endpoint: 'https://dashscope.aliyuncs.com/compatible-mode/v1/chat/completions',
  },
};
