# Design: 提示词 AI 优化与多模型配置

## Context

- 现有：`SettingsModal` 仅支持 endpoint + apiKey，`handleGenerate` 使用 OpenAI 形态写死 `gpt-3.5-turbo`；`DiffView` 已支持 original/new/onApply，用于历史对比与草稿应用。
- 目标：支持按模型类型（本期 Gemini、千问、自定义）配置；新增「智能评价/优化」流程，返回评价 + 可选 suggestedContent，用 Diff 展示并一键应用。

## Goals / Non-Goals

- **Goals**：模型选择与模型特定必填项（Gemini：apiKey；千问：apiKey、model；自定义：endpoint、apiKey、model）；智能评价/优化端到端（按钮→调用→展示评价→若有建议则 Diff+ 应用）；第一版对 LLM 的 prompt 可后续迭代。
- **Non-Goals**：`handleGenerate`（tags/variables 提取）在本期中不强制迁移到多模型适配器；仅当复用同一 `llmSettings` 且形态兼容时顺带支持，否则后续迭代。

## Decisions

### 1. 配置 Schema（llmSettings）

- `modelType`: `'custom'` | `'gemini'` | `'qwen'`。`custom` 保留现有 endpoint、apiKey，并增加 `model`（默认 `gpt-3.5-turbo`）；`gemini` 要求 `apiKey`（Google AI Studio），`model` 可选（默认 `gemini-1.5-flash`），endpoint 固定；`qwen` 要求 `apiKey`（DashScope），`model` 可选（默认 `qwen-turbo`），endpoint 固定为 DashScope OpenAI 兼容接口。
- 持久化：继续使用现有 `readDataFile`/`writeDataFile` 中的 `llmSettings` 字段，向后兼容：旧数据无 `modelType` 时视为 `custom`，无 `model` 时用默认。

### 2. LLM 适配器

- 抽象：`invokeLlm({ llmSettings, systemContent, userContent }) => Promise<{ text: string }>`。根据 `modelType` 分支：`custom` 走 OpenAI 形（POST endpoint，`Authorization: Bearer`，body `{ model, messages }`）；`gemini` 走 Google Generative Language（`generateContent`，API Key 用 `?key=`，contents 格式）；`qwen` 走 DashScope OpenAI 兼容接口（固定 endpoint，`Authorization: Bearer`，body `{ model, messages }`）。
- 放置：可集中在 `prompt_fill/src/services/llm-adapter.js`（或 `utils/llm-adapter.js`），便于测试与后续加模型。

### 3. 智能评价/优化的返回结构与 Prompt V1

- 约定 LLM 返回**纯 JSON**，便于解析：  
  `{ "evaluation": "对提示词的理解与评价", "suggestedContent": "可选，修改后全文，仅在不完善需建议时提供" }`。  
- 第一版 system prompt 规定角色与输出格式；user 传入当前提示词全文。具体措辞放在常量或 i18n，实现时给出 V1，后续可调。

### 4. Diff 与一键应用

- 复用 `DiffView`：`originalContent` = 当前编辑内容（draft 或已保存的 content），`newContent` = `suggestedContent`；`onApply` = 将 `suggestedContent` 写入 `drafts[activeTemplateId]` 并关闭；`onReset` = 仅关闭（不还原到优化前），`isHistoryDiff=false` 以显示「应用」按钮文案。若 `DiffView` 的 Reset 在非历史场景下语义为「丢弃 draft」，则本流程可传 `onReset=onClose` 或隐藏 Reset，以产品为准；设计上按「可选：放弃优化建议并关闭」处理。

### 5. 评价展示

- 评价（`evaluation`）以 Modal 或抽屉上半区、或可关闭的 Toast/Inline 展示；若存在 `suggestedContent`，同弹层下方或流程上先展示评价再进入 Diff。为 MVP，可在同一 Modal 内：上为评价，下为「查看修改建议」按钮→打开 Diff；或直接：有 suggested 时先 Diff，Diff 标题/副标题展示简要评价。实现时二选一即可，以简单为准。

## Risks / Trade-offs

- **多模型请求形态差异**：通过适配器隔离，新增模型时仅改适配器与配置项。
- **LLM 返回非 JSON 或格式错误**：适配器解析失败时提示「解析失败，请重试」，不落盘；可选：保留原始 text 供调试。
- **handleGenerate 与 Gemini**：若用户仅配 Gemini，现有 `handleGenerate` 的 OpenAI 调用会失败；本期不在配置层禁用，仅在文档或 UI 提示中说明「 tags/变量 生成」当前仅支持自定义/OpenAI 形态，后续可迁到适配器。

## Migration Plan

- 无数据迁移：旧 `llmSettings` 缺 `modelType` 时视作 `custom`，缺 `model` 用默认。新字段加在保存时一并写入。

## Open Questions

- 评价与 Diff 的先后与同屏展示形式（评价 Modal + 按钮进 Diff vs 仅 Diff 标题区展示一句评价）：实现时按最小可用选一种，后续可调。
