# Change: 本地 MCP 资源中心 (Local MCP Resource Hub)

## Why
PromptStudio 的核心定位是本地化的提示词与 AI 资源管理工具。随着 AI 代理能力的增强，"资源"的概念已从纯文本提示词扩展到工具 (Skills) 和上下文 (Context)。目前市面上缺乏直观管理这些本地资源的工具，且 MCP (Model Context Protocol) 正在成为行业标准。我们需要一个 GUI 来管理本地的 MCP 服务，并将用户的脚本和文件转化为 AI 可用的标准化资产，而不是去构建一个复杂的 Agent 编排平台。

## What Changes
- **新增能力**: `mcp-manager` (统一的本地 MCP 服务与技能管理)。
- **Skill = Local MCP**: 将“用户脚本”与“MCP 服务”概念统一。用户编写的 Python/JS 脚本（Skill）会被系统自动封装为标准的 MCP Server。
- **Universal Gateway (通用网关)**: 为了支持所有类型的客户端（包括不支持 MCP 的传统 CLI），PromptStudio 将提供：
    - **MCP Protocol**: 标准支持 (Claude Desktop, Cursor)。
    - **HTTP API**: `POST /v1/tools/{name}` (通用编程语言/Curl)。
    - **CLI Command**: `ps-run {tool_name}` (Shell 脚本/终端)。
- **GUI 管理器**: 提供可视化界面管理所有资源：
    - **External Servers**: 连接外部标准 MCP 服务（如 Filesystem, Git）。
    - **Local Skills**: 编辑、调试和运行用户自定义的脚本工具。
- **Script-to-MCP Engine**: 内置转换引擎，利用 `fastmcp` 或 SDK 动态将函数转换为 MCP Tool 定义。
- **Local Context**: 简单的本地文件索引，作为 MCP Resource 暴露。
- **Playground 升级**: 支持在“试车场”中挂载任意 MCP 资源（无论是外部服务还是本地 Skill）进行 Prompt 调试。

## Impact
- **Affected specs**: 新增 `mcp-manager`。
- **Affected code**:
    - 后端: `server/mcp_bridge/` (新增模块，负责 MCP 协议通信与进程管理)。
    - 前端: `prompt_fill/src/components/McpManager/`。
- **User Experience**: 用户不再需要命令行来运行 MCP 服务；PromptStudio 变成了一个“AI 资源服务器”，既可以自己用，也可以服务于其他 AI 客户端。
