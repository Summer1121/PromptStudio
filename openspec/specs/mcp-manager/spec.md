# mcp-manager Specification

## Purpose
TBD - created by archiving change add-local-mcp-resource-hub. Update Purpose after archive.
## Requirements
### Requirement: 本地 MCP 服务管理
系统 SHALL 提供 GUI 界面用于管理本地 Model Context Protocol (MCP) 服务。

#### Scenario: 启动预置的 MCP 服务
- **GIVEN** 用户在 MCP 资源站页面
- **WHEN** 用户点击 "Filesystem Server" 卡片上的“启动”按钮
- **THEN** 系统应在后台启动对应的子进程
- **AND THEN** 卡片状态应更新为 "Running"，并显示绿色指示灯

#### Scenario: 查看服务日志
- **GIVEN** 一个 MCP 服务正在运行
- **WHEN** 用户点击“日志”图标
- **THEN** 应弹出一个终端风格的窗口，实时显示该服务的 stdout/stderr 输出

### Requirement: 脚本即工具 (Script-as-a-Tool)
系统 SHALL 允许用户编写简单的 Python 脚本，并自动将其转换为符合 MCP 标准的工具服务。

#### Scenario: 创建自定义工具
- **GIVEN** 用户在“脚本工具”编辑器中
- **WHEN** 用户编写了一个 `calculate_tax(price)` 函数并保存
- **THEN** 系统应自动重载内部的 MCP Server
- **AND THEN** 在 Playground 的工具列表中应能看到 `calculate_tax` 工具

### Requirement: 通用访问网关 (Universal Gateway)
系统 SHALL 提供 HTTP API 和 CLI 命令，允许不支持 MCP 协议的外部应用调用本地管理的 Skill。

#### Scenario: 通过 HTTP 调用本地 Skill
- **GIVEN** 本地已运行一个名为 `get_weather` 的 Skill
- **WHEN** 外部应用向 `http://localhost:PORT/api/v1/tools/get_weather/call` 发送 POST 请求
- **THEN** 系统应代理该请求到对应的 Skill 进程并返回结果

#### Scenario: 通过 CLI 命令调用
- **GIVEN** 本地已运行一个名为 `get_weather` 的 Skill
- **WHEN** 用户在终端执行 `ps-run get_weather --city Beijing`
- **THEN** 系统应输出该 Skill 的执行结果 (stdout)

### Requirement: 作用域与可见性
系统 SHALL 支持全局和项目级两层 Skill 配置，确保正确的可见性控制。

#### Scenario: 项目级 Skill 隔离
- **GIVEN** 用户在项目 A 中定义了 Skill `process_logs`
- **WHEN** 用户切换到项目 B
- **THEN** 项目 B 的工具列表中不应出现 `process_logs`
- **BUT** 全局定义的 `web_search` Skill 应在两个项目中都可见

### Requirement: 技能链式调用
系统 SHALL 允许一个 Skill 调用另一个 Skill，以支持复杂的任务编排。

#### Scenario: Skill 调用 Skill
- **GIVEN** Skill A 需要获取天气信息
- **WHEN** Skill A 的代码中调用 `mcp.call_tool("get_weather", {"city": "Beijing"})`
- **THEN** 系统应执行 `get_weather` Skill 并将结果返回给 Skill A

### Requirement: 调用链路审计 (Audit Logs)
系统 SHALL 提供可视化的日志界面，展示 Skill 调用的完整链路和数据。

#### Scenario: 查看调用链
- **GIVEN** Skill A 调用了 Skill B，Skill B 调用了外部 API
- **WHEN** 用户在日志页面查看该次请求
- **THEN** 应展示一个树状结构：`Request -> Skill A -> Skill B -> API -> Response`
- **AND** 点击每个节点可查看详细的 Input/Output JSON

### Requirement: 智能环境管理
系统 SHALL 自动管理 Skill 的运行环境依赖，支持自动检测和一键安装。

#### Scenario: 自动安装缺失依赖
- **GIVEN** 用户编写了一个使用了 `pandas` 但未安装该库的 Skill
- **WHEN** 用户尝试运行或保存该 Skill
- **THEN** 系统应检测到 `ModuleNotFoundError`
- **AND** 弹窗提示“检测到缺失依赖 pandas，是否自动安装？”
- **WHEN** 用户确认
- **THEN** 系统应调用 `uv` 自动安装依赖并成功运行 Skill

#### Scenario: 带工具的 Prompt 调试
- **GIVEN** 用户正在调试一个“天气助手”提示词
- **AND** 本地已启动 "Weather MCP" 服务
- **WHEN** 用户在侧边栏勾选 "Weather MCP"
- **THEN** 发送给 LLM 的请求中应包含该服务提供的工具定义
- **AND THEN** 如果 LLM 决定调用工具，系统应自动执行并回传结果，最终生成自然语言回复

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

