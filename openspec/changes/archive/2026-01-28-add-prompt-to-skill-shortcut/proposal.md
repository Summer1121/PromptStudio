# Change: 提示词转技能快捷方式 (Prompt-to-Skill Shortcut)

## Why
目前用户在 PromptStudio 中打磨好的提示词模板（Template）只能在编辑器内手动使用。若想将其作为 Tool 给其他 Agent 调用，用户需要手动编写 Python 代码封装该 Prompt。这存在断层。
通过“一键保存为 Skill”，我们可以自动将 Prompt 模板转换为标准的 MCP Skill 脚本，极大地降低了“提示词工程”向“Agent 工程”转化的门槛。

## What Changes
- **Editor UI**: 在编辑器工具栏增加“保存为 Skill”入口。
- **Prompt-to-Code Conversion**:
    - 自动解析模板变量（`{{var}}`）作为函数参数。
    - 生成调用 LLM 的 Python 代码（基于 `fastmcp`）。
- **AI-Assisted Description**:
    - 调用 LLM 分析当前 Prompt，自动生成符合 MCP 标准的函数描述（Docstring）和参数描述。
- **Linkage & Sync (关联与同步)**:
    - **关联**: 保存 Skill 后，自动记录 Template 与 Skill 的关联关系。
    - **同步**: 当 Template 内容修改时，提供快捷入口更新对应的 Skill 代码，确保 Prompt 逻辑一致。
- **UI & Interaction Improvements**:
    - **Refresh Logic**: 实现 MCP 资源中心的刷新按钮逻辑，确保工具列表实时更新。
    - **Safe Restart**: 修复/完善 MCP 服务重启及二次确认逻辑，确保启动安全。
    - **Icon Optimization**: 优化 MCP 资源中心关闭按钮等图标，提升交互一致性。
- **Interactive Workflow**:
    - 弹窗预览生成的代码和描述。
    - 支持用户编辑。
    - 确认后保存到 MCP 资源中心并启动。

## Impact
- **Affected specs**: `editor-ui`, `mcp-manager`.
- **Affected code**:
    - Frontend: `EditorToolbar.jsx`, `App.jsx`, 新增 `PromptToSkillModal.jsx`。
    - Backend: 可能需要辅助 Prompt 生成的逻辑（或在前端直接调用 `invokeLlm`）。
