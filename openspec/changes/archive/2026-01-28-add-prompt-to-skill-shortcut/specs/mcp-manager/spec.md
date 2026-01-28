# mcp-manager Specification Delta

## ADDED Requirements

### Requirement: 环境变量注入
`McpProcessManager` SHALL 支持在启动 Skill 进程时注入环境变量，以便 Skill 脚本能够直接使用用户的 LLM 配置（如 API Key）。

#### Scenario: 自动注入 API Key
- **GIVEN** 用户配置了 `OPENAI_API_KEY`
- **WHEN** 系统启动一个名为 `translator` 的 Skill
- **THEN** 该 Skill 的进程环境变量中应包含 `OPENAI_API_KEY`

### Requirement: Prompt-to-Skill 转换接口
系统 SHALL 提供机制，将 Prompt 模板内容转换为可执行的 Python Skill 代码。

#### Scenario: 模板变量转函数参数
- **GIVEN** 一个包含 `{{target_lang}}` 和 `{{text}}` 的 Prompt 模板
- **WHEN** 执行转换
- **THEN** 生成的 Python 函数应包含 `target_lang` 和 `text` 两个参数
- **AND** 函数的 Docstring 应描述这两个参数的作用

### Requirement: 恢复启动二次确认
当系统检测到上次关闭前有正在运行的服务时，SHALL 在用户进入 MCP 资源中心时提示是否恢复，而非自动启动。

#### Scenario: 恢复上次运行的服务
- **GIVEN** 上次关闭应用时，`web_search` 服务处于运行状态
- **WHEN** 用户再次打开 MCP 资源中心
- **THEN** 系统应弹出确认对话框询问是否恢复 `web_search`
- **AND** 仅在用户确认后才启动该服务

### Requirement: 资源中心强制刷新
系统 SHALL 提供刷新机制，手动同步最新的服务状态和工具列表。

#### Scenario: 点击刷新按钮
- **WHEN** 用户点击 MCP 资源中心的“刷新”按钮
- **THEN** 系统应重新请求后端所有活跃 Server 的工具列表
- **AND** 更新 UI 上的工具显示
