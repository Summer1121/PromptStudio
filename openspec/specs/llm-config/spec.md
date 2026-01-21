# llm-config Specification

## Purpose
TBD - created by archiving change add-prompt-ai-optimize. Update Purpose after archive.
## Requirements
### Requirement: 模型选择与模型特定必填项

在由侧边栏设置按钮（`p-1.5 rounded-lg transition-colors text-gray-400 hover:text-orange-600 hover:bg-orange-50`）打开的设置弹窗中，系统 SHALL 提供模型类型选择；每种模型类型 SHALL 有各自的必填配置项，且仅在选中该类型时展示对应表单项。本期支持：（1）**自定义（OpenAI 兼容）**：endpoint、apiKey、model（可选，默认 gpt-3.5-turbo）；（2）**Gemini**：apiKey（必填）、model（可选，默认 gemini-1.5-flash）；（3）**千问（通义）**：apiKey（必填）、model（可选，默认 qwen-turbo），不展示 endpoint（使用固定 DashScope 兼容接口）。系统 SHALL 在保存时校验当前所选类型的必填项已填写，未通过时给出提示且不关闭弹窗。

#### Scenario: 选择自定义时展示 endpoint、apiKey、model

- **GIVEN** 用户打开设置弹窗
- **WHEN** 用户选择模型类型为「自定义（OpenAI 兼容）」
- **THEN** 应展示 endpoint、apiKey、model（可选）输入项
- **AND THEN** 不展示 Gemini 专属项（如仅与 Gemini 相关的说明）

#### Scenario: 选择 Gemini 时展示 apiKey、model

- **GIVEN** 用户打开设置弹窗
- **WHEN** 用户选择模型类型为「Gemini」
- **THEN** 应展示 apiKey（必填）、model（可选）输入项
- **AND THEN** endpoint 可使用固定默认或隐藏，不以通用 endpoint 为主必填项

#### Scenario: 选择千问时展示 apiKey、model

- **GIVEN** 用户打开设置弹窗
- **WHEN** 用户选择模型类型为「千问（通义）」
- **THEN** 应展示 apiKey（必填）、model（可选）输入项
- **AND THEN** 不展示 endpoint（使用固定 DashScope OpenAI 兼容接口）

#### Scenario: 保存时校验必填项

- **GIVEN** 用户选择 Gemini 且 apiKey 为空
- **WHEN** 用户点击保存
- **THEN** 系统 SHALL 提示必填项未填写
- **AND THEN** 不关闭设置弹窗，不覆写已持久化的配置

### Requirement: 大模型配置持久化

系统 SHALL 将 `modelType`、`model` 及各模型类型的专属字段（如 endpoint、apiKey）与现有数据一同持久化；加载时，若缺少 `modelType`，SHALL 将其视为「自定义」以保持向后兼容。

#### Scenario: 保存后再次打开保留模型类型与表单值

- **GIVEN** 用户已选择 Gemini 并填写 apiKey、model 后保存
- **WHEN** 用户再次打开设置弹窗
- **THEN** 模型类型应显示为 Gemini，apiKey、model 应保留上次保存的值
- **AND THEN** 不展示自定义类型的 endpoint 等字段

#### Scenario: 旧数据缺 modelType 时按自定义兼容

- **GIVEN** 持久化数据中 `llmSettings` 仅有 endpoint、apiKey，无 `modelType`
- **WHEN** 应用加载并打开设置弹窗
- **THEN** 模型类型应视为或显示为「自定义」，endpoint、apiKey 正常展示
- **AND THEN** 可正常保存，保存后应写入 `modelType`（如 'custom'）以便后续一致

