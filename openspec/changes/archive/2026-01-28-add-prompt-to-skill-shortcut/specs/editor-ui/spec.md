# editor-ui Specification Delta

## ADDED Requirements

### Requirement: 保存为 Skill 入口
编辑器工具栏 SHALL 提供“保存为 Skill”按钮，允许用户将当前 Prompt 转换为 MCP 工具。

#### Scenario: 打开转换弹窗
- **GIVEN** 用户正在编辑一个模板
- **WHEN** 用户点击“保存为 Skill”按钮
- **THEN** 应弹出 `PromptToSkillModal`
- **AND** 系统应自动开始分析 Prompt 内容

### Requirement: AI 辅助代码生成
转换流程 SHALL 调用 LLM 自动生成包含完整 Docstring 的 Python 代码。

#### Scenario: 生成代码预览
- **GIVEN** 弹窗已打开并完成分析
- **WHEN** 显示预览
- **THEN** 用户应看到生成的 Python 代码，其中包含 `fastmcp` 定义
- **AND** 用户可以手动修改代码和描述

### Requirement: 模板与 Skill 关联
系统 SHALL 记录 Template 与生成的 Skill 之间的关联关系，并监控同步状态。

#### Scenario: 建立关联
- **GIVEN** 用户成功将 Template 保存为 Skill "translator"
- **THEN** Template 数据中应记录 `linkedSkill: "translator"`
- **AND** 记录当前的同步状态（如内容 Hash）

#### Scenario: 提示同步更新
- **GIVEN** 一个已关联 Skill 的 Template
- **WHEN** 用户修改了 Template 内容并保存
- **THEN** 编辑器应提示 Skill 可能已过期
- **AND** 提供快捷入口重新生成代码并更新 Skill
