## 1. 后端 MCP 核心 (Python)
- [ ] 1.1 引入 `mcp` SDK 和 `fastmcp`。
- [ ] 1.2 实现 `McpProcessManager`：负责根据配置启动、停止本地 MCP 子进程，并监控心跳。
- [ ] 1.3 实现 `StdioClient`：通过 Stdio 与子进程通信，解析 MCP 协议消息（ListTools, CallTool）。
- [ ] 1.4 实现 `ScriptBridge`：动态加载用户 Python 脚本并生成 MCP Tool 定义的通用包装器。
- [ ] 1.5 实现 **Universal Gateway**：
    - [ ] HTTP API: `POST /api/v1/tools/{name}/call`。
    - [ ] CLI Shim: 编写 `ps-run` 脚本（或作为 Tauri 子命令）。

## 2. 前端 MCP 管理器
- [ ] 2.1 新增“MCP 资源站”页面。
- [ ] 2.2 实现 Server 列表卡片：显示状态（Running/Stopped）、日志预览、配置编辑。
- [ ] 2.3 实现 Server 市场/模板：预置官方推荐的 MCP Server 配置（如 Filesystem, Git, SQLite），一键安装。
- [ ] 2.4 实现“脚本工具”编辑器：简单的代码编辑框，保存即生效为 Tool。

## 3. Playground 集成
- [ ] 3.1 改造现有的 Chat/Test 界面。
- [ ] 3.2 增加“挂载工具”侧边栏：列出所有活跃 MCP Server 提供的 Tools。
- [ ] 3.3 升级 LLM 调用逻辑：在发送 Prompt 时，将选中的 Tools 转换为 JSON Schema 注入 API 请求。
- [ ] 3.4 解析 Tool Calls：当 LLM 返回 Tool Call 时，后端路由到对应的 MCP Server 执行并返回结果。

## 4. 验证
- [ ] 4.1 E2E: 安装 Filesystem MCP -> 启动 -> Playground 中询问 "读取当前目录文件" -> 验证 LLM 正确调用 `list_directory` 工具。
- [ ] 4.2 Gateway Test: 使用 `curl` 调用 HTTP 接口触发本地 Skill。
