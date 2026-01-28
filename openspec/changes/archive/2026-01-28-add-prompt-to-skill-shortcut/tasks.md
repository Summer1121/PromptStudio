## 1. 前端实现
- [x] 1.1 在 `EditorToolbar` 增加“保存为 Skill”按钮（仅在非 Draft 状态或保存后可用？或者 Draft 也可以，转换的是当前内容）。
- [x] 1.2 创建 `PromptToSkillModal.jsx` 组件：
    - [x] 状态管理：`step` (analyzing, preview, saving)。
    - [x] 变量解析：复用现有的 regex `{{(.*?)}}`。
    - [x] AI 生成：调用 `invokeLlm` 生成描述和代码。
- [x] 1.3 实现 AI 生成逻辑：
    - [x] 编写 System Prompt：要求生成 Python 代码，包含 `fastmcp` 装饰器和完善的 Docstring。
    - [x] 用户确认：允许用户在 Modal 中修改代码。
- [x] 1.4 保存与关联逻辑：
    - [x] 调用 `POST /api/v1/mcp/skills` 保存代码。
    - [x] 成功后，更新 `Template.linkedSkill` ({ name, lastSyncHash })。
    - [x] 能够读取现有 Skill 代码，以便在“更新”模式下展示 Diff。
- [x] 1.5 同步检测：
    - [x] 在 `EditorToolbar` 检测关联状态，若内容变更，高亮“同步 Skill”按钮。
- [x] 1.6 MCP 资源中心优化：
    - [x] 完善刷新按钮逻辑：确保点击后重新加载所有 Server 和 Tools。
    - [x] 修复二次确认逻辑：确保服务启动后的恢复弹窗能正确触发并执行。
    - [x] 更换关闭按钮图标：将 `Trash2` 替换为标准的 `X` 或 `XCircle`。

## 2. 后端增强 (mcp_host)
- [x] 2.1 增强 `McpProcessManager`：
    - [x] 在 `start_server` / `start_skill` 时，接受可选的 `env` 参数。
    - [x] 或者默认将主进程的 `OPENAI_API_KEY` 等关键变量透传给子进程。
    - [x] *Decision*: 修改 `process_manager.py`，在 `start` 时注入环境变量（如果配置中有）。

## 3. 验证
- [x] 3.1 E2E: 打开一个“翻译”模板 -> 点击“保存为 Skill” -> 等待 AI 生成 -> 确认 -> 在 Playground 挂载该 Skill -> 测试调用。