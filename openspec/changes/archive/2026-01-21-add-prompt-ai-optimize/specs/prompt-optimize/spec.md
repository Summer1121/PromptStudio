# prompt-optimize Specification (Delta)

## Purpose

在编辑器中通过大模型对当前提示词进行理解、评价与优化；若模型认为提示词不完善，则提供修改建议并以 Diff 形式对比，支持一键应用替换。本期实现基础能力，向大模型发送的 system/user 提示词为第一版，后续可迭代。

## ADDED Requirements

### Requirement: 智能评价/优化入口与调用

在 EditorToolbar 的 `flex items-center gap-3` 按钮组中，系统 SHALL 提供「智能评价/优化」按钮。用户点击后，系统 SHALL 在已配置大模型且必填项完整的前提下，取当前正在编辑的提示词内容（优先草稿，否则为已保存的 content），调用已配置的大模型 API，并传入第一版 system/user 提示词，要求模型返回结构化内容：对提示词的理解与评价（evaluation）、以及可选的修改后全文（suggestedContent，仅在有不完善需建议时提供）。若大模型未配置或必填项不完整，系统 SHALL 提示用户先完成配置，且不发起请求。

#### Scenario: 未配置大模型时点击按钮

- **GIVEN** 用户未在设置中配置大模型（或当前 modelType 的必填项为空）
- **WHEN** 用户在 EditorToolbar 点击「智能评价/优化」
- **THEN** 系统 SHALL 提示用户先完成大模型配置（或必填项未填写）
- **AND THEN** 不发起任何 API 请求

#### Scenario: 已配置时发起评价与优化请求

- **GIVEN** 用户已选择模型类型并填写该类型必填项且已保存
- **WHEN** 用户在 EditorToolbar 点击「智能评价/优化」
- **THEN** 系统 SHALL 取当前提示词内容（draft 或 saved），并按第一版 prompt 调用大模型
- **AND THEN** 接收并解析模型返回；若返回格式不可解析，SHALL 提示解析失败并允许用户重试

### Requirement: 评价展示与修改建议的 Diff 与一键应用

系统 SHALL 将模型返回的「理解与评价」（evaluation）以用户可见的方式展示（如 Modal、Inline 或 Diff 标题区等，实现时择一）。若模型返回了「修改后全文」（suggestedContent），系统 SHALL 使用已有的 Diff 视窗，以当前内容为 original、suggestedContent 为 new 进行对比，并提供「应用」类操作；用户点击应用后，系统 SHALL 将 suggestedContent 写回当前编辑上下文（即作为草稿或直接替换当前编辑内容），并关闭 Diff 视窗，使编辑器展示替换后的内容。

#### Scenario: 仅评价无建议时的展示

- **GIVEN** 模型返回的 JSON 中仅有 evaluation，无 suggestedContent 或 suggestedContent 为空
- **WHEN** 调用解析成功
- **THEN** 系统 SHALL 展示 evaluation 文本
- **AND THEN** 不打开 Diff 视窗

#### Scenario: 有建议时以 Diff 对比并支持一键应用

- **GIVEN** 模型返回的 JSON 中含 suggestedContent 且非空
- **WHEN** 调用解析成功
- **THEN** 系统 SHALL 展示 evaluation（形态与仅评价时一致或集成于 Diff 标题/副标题）
- **AND THEN** 打开 Diff 视窗：original=当前编辑内容，new=suggestedContent
- **AND THEN** 用户点击「应用」后，suggestedContent 应写回当前模板的编辑内容（草稿或等价状态），Diff 视窗关闭，编辑器显示替换后的文本

#### Scenario: 应用后编辑器内容已更新

- **GIVEN** 用户已在 Diff 中点击「应用」且流程成功
- **WHEN** 用户回到编辑器视图
- **THEN** PlainTextEditor（或等价编辑区）中的内容 SHALL 与 suggestedContent 一致
- **AND THEN** 用户可继续编辑或保存为模板新版本
