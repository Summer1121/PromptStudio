# Story-20260126-02: MCP (Model Context Protocol) 标准化集成

## 1. 痛点分析
目前 AI 模型与外部系统的连接缺乏标准。每接入一个新工具，都需要针对不同模型（OpenAI, Claude, Gemini）编写不同的适配代码。这导致集成成本高且难以维护。MCP 协议提供了一套通用的“插槽”，让 PromptStudio 可以像使用 USB 接口一样连接各种 AI 数据源。

## 2. 核心需求

### 2.1 MCP 客户端架构 (MCP Client Support)
- **需求**：使 PromptStudio 具备 MCP Client 能力，能够连接并通信 MCP Server。
- **功能点**：
    - 支持通过 URL 或本地命令连接 MCP Server。
    - 自动发现 Server 暴露的 **Resources** (数据)、**Prompts** (模板) 和 **Tools** (工具)。
    - 实现对 MCP Lifecycle (Initialize, Ping, Shutdown) 的完整支持。

### 2.2 统一上下文窗口 (Unified Context Manager)
- **需求**：将从 MCP 检索到的数据无缝集成到当前的提示词上下文中。
- **功能点**：
    - **Resource Picker**: 允许用户在编写提示词时，直接引用 MCP Server 提供的资源（如：`mcp://github-repo/readme.md`）。
    - 实时同步：当 MCP Server 端的数据发生变化时，PromptStudio 的预览内容可选择性同步。

### 2.3 跨模型协议适配 (Cross-Model Adapter)
- **需求**：无论用户配置的是 Gemini 还是 Claude，系统都能将 MCP 的 Tool 定义自动转换为对应模型支持的 Function Calling 格式。
- **功能点**：
    - 动态转换层：MCP 工具定义 -> 模型特定 JSON Schema。
    - 响应转换层：模型 Tool Call -> MCP Tool Call -> 执行结果 -> 模型上下文。

## 3. 用户场景示例
- **场景**：直接操作本地文件系统的 AI 助手。
- **流程**：
    1. 用户在本地启动一个官方的 Filesystem MCP Server。
    2. PromptStudio 检测到该 Server 并建立连接。
    3. 用户在提示词中写道：“总结 `projects/notes` 目录下的所有 markdown 文件”。
    4. AI 通过 MCP 接口读取目录并获取文件内容，无需用户手动上传任何文件。
