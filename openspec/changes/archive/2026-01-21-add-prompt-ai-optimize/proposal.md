# Change: 增加提示词 AI 优化能力

## Why

用户需要借助大模型对当前提示词进行理解、评价与优化，并能在不完善时获得修改建议且一键应用；同时需在设置中按模型类型配置 API（如 Gemini），以便通过统一入口访问不同供应商的接口。

## What Changes

- **大模型配置扩展**：在设置弹窗（由侧边栏 `p-1.5 rounded-lg ...` 的设置按钮打开）中增加模型选择；每种模型有各自的必填项，本期以 **Gemini** 为例，并保留现有「自定义/OpenAI 兼容」配置（endpoint、apiKey、model）以兼容既有的 tags/variables 生成等能力。
- **智能评价/优化**：在 EditorToolbar 的 `flex items-center gap-3` 按钮组中新增「智能评价/优化」按钮；点击后调用已配置的大模型，对当前提示词做评价与优化；模型返回（1）理解与评价、（2）可选修改建议；若有建议则以 Diff 窗口对比，支持一键应用替换。先实现基础能力，向大模型提问的 system/user 提示词给出第一版，后续可迭代。

## Impact

- **Affected specs**：新增 `llm-config`、`prompt-optimize`；`editor-ui` 无修改（按钮与 Diff 复用为实现细节，未改变既有 editor-ui 的语义）。
- **Affected code**：`SettingsModal.jsx`、`App.jsx`（llmSettings schema、持久化、调用入口）、`EditorToolbar.jsx`、新增 LLM 适配与智能优化逻辑（可在 `App.jsx` 或独立模块）、`DiffView` 的调用处、`translations.js`；`prompt_fill/tests/e2e/` 需补 E2E。
