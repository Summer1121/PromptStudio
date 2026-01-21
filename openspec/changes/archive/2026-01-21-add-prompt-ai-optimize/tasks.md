## 1. 大模型配置（llm-config）

- [x] 1.1 扩展 `llmSettings` schema：`modelType`（'custom'|'gemini'|'qwen'）、`model`（可选），及保留/新增模型特定字段；加载时对缺省 `modelType` 做兼容（视为 custom）。
- [x] 1.2 在 `SettingsModal` 增加模型选择（自定义/OpenAI 兼容、Gemini、千问）；按 `modelType` 展示必填项：custom → endpoint、apiKey、model；gemini → apiKey、model（可选）；qwen → apiKey、model（可选）。
- [x] 1.5 增加千问模型类型及表单项；模型名输入框旁增加「查看模型列表」文档链接（`constants/llm-config.js` 集中 `MODEL_DOC_URLS`、`DEFAULT_MODELS` 等预配置）。
- [x] 1.3 持久化：保存时写入新字段，确保 `readDataFile`/`writeDataFile` 的 `llmSettings` 含 modelType/model 及模型特定项。
- [x] 1.4 翻译：`llm_model_type`、`llm_model_type_custom`、`llm_model_type_gemini`、`llm_model_name` 等。

## 2. LLM 适配器

- [x] 2.1 实现 `invokeLlm({ llmSettings, systemContent, userContent })`：按 `modelType` 分别构造请求（custom→OpenAI 形，gemini→Google generateContent，qwen→DashScope OpenAI 兼容），返回 `{ text }`；解析异常时抛出或返回明确错误。
- [x] 2.2 （可选）本期若将 `handleGenerate` 迁至适配器：在 `modelType=custom` 时用同一适配器，避免重复 fetch 逻辑；否则保留原 `handleGenerate` 实现，仅智能优化使用适配器。

## 3. 智能评价/优化（prompt-optimize）

- [x] 3.1 定义第一版 system/user prompt（含输出 JSON 结构：evaluation、suggestedContent），放在常量或 i18n。
- [x] 3.2 在 `EditorToolbar` 的 `flex items-center gap-3` 中新增「智能评价/优化」按钮；`App.jsx` 提供 `onOptimize` 并传入 toolbar。
- [x] 3.3 实现 `onOptimize`：校验 `llmSettings` 已配置且满足当前 `modelType` 必填项；取当前内容（draft 或 saved）；调用 `invokeLlm` 用 V1 prompt；解析 JSON；若解析失败则 message 提示。
- [x] 3.4 展示评价：在 Modal/Inline 或 Diff 的标题区展示 `evaluation` 文本（具体形态见 design 决策，先实现一种）。
- [x] 3.5 若有 `suggestedContent`：以 `originalContent`=当前内容、`newContent`=suggestedContent 打开 `DiffView`，`onApply` 将 suggested 写入 `drafts[activeTemplateId]` 并关闭；`onReset`/onClose 按设计实现（如仅关闭）。
- [x] 3.6 翻译：`smart_evaluate_optimize`、`optimize_evaluation`、`view_suggested_changes`、`optimize_parse_error`、`llm_settings_not_configured` 等（若已有则复用）。

## 4. 测试与校验

- [x] 4.1 E2E：打开设置 → 选择 Gemini → 填写 apiKey → 保存；在编辑器点击「智能评价/优化」，未配置时应有提示；配置后能触发请求（可 mock 或使用真实 key，视环境而定）。
- [ ] 4.2 E2E（可选）：当 mock 或真实返回含 `suggestedContent` 时，Diff 打开且「应用」后，编辑器内容被替换。
- [x] 4.3 运行 `openspec validate add-prompt-ai-optimize --strict --no-interactive`，确保通过。
