# Story-20260126-05: Local MCP & Skill Resource Hub

## 1. 背景与目标 (Context)
随着 AI 代理能力的增强，用户需要管理越来越多的本地 AI 资源：提示词 (Prompt)、技能/工具 (Skill)、以及上下文数据 (Context)。目前市面上的工具往往只聚焦于其中一点，且各自为战。

PromptStudio 将引入 **Local MCP Resource Hub**，利用 **Model Context Protocol (MCP)** 标准，统一纳管所有本地资源。
- **核心理念**：Skill 即 MCP Tool，Context 即 MCP Resource。
- **定位**：PromptStudio 不仅是 Prompt 编辑器，更是本地 AI 资源的**服务器 (Server)** 和 **连接器 (Hub)**。

## 2. 核心功能 (Features)

### 2.1 统一资源管理界面 (Resource Hub UI)
- **Dashboard**: 一个类似 Docker Desktop 的管理面板。
- **Tabs**:
    - **Servers**: 管理所有运行中的 MCP 服务实例（包括外部安装的和内部脚本生成的）。
    - **Skills (Internal)**: 专门的代码编辑器，用于编写 Python/JS 脚本。
    - **Logs**: 查看所有服务的实时运行日志 (Stdout/Stderr)。

### 2.2 脚本即服务 (Script-as-a-Service)
- **痛点**：用户只想写个简单的 Python 函数给 AI 用，不想配置复杂的 MCP Server 代码。
- **解决方案**：
    - 提供内置的代码编辑器。
    - 用户输入：
      ```python
      def calculate_tax(amount: float) -> float:
          """Calculate tax for a given amount."""
          return amount * 0.1
      ```
    - 系统动作：自动保存文件 -> 启动内置的 `mcp-runner` 包装器 -> 暴露为标准 MCP Tool `calculate_tax`。

### 2.3 外部 MCP 服务连接 (External MCP Connection)
- **功能**：支持通过配置 JSON 连接标准的外部 MCP Server。
- **预置模板**：提供常见服务的配置模板，如：
    - `Filesystem`: 允许 AI 读写本地文件。
    - `Git`: 允许 AI 操作 Git 仓库。
    - `SQLite`: 允许 AI 查询本地数据库。
- **操作**：一键安装（通过 `uvx` 或 `npm`）、启动、停止。

### 2.4 Playground 调试场 (Debug Playground)
- **功能**：在原本的 Prompt 调试界面增加“工具挂载”栏。
- **交互**：
    - 用户勾选 `calculate_tax` (Local Skill) 和 `filesystem` (External Server)。
    - 发送 Prompt: "帮我算一下 100 块钱的税，并把结果写入 result.txt"。
    - 系统动作：
        1. LLM 调用 `calculate_tax(100)` -> 返回 `10.0`。
        2. LLM 调用 `filesystem.write_file("result.txt", "10.0")` -> 返回 `Success`。
        3. LLM 回复用户：“已计算并保存。”
- **日志**：清晰展示 Tool Call 的完整调用链，方便排查错误。

## 3. 技术架构 (Technical Architecture)

### 3.1 进程模型
- **Backend (Django)**: 充当 MCP Host。
- **Subprocesses**: 每个 Skill 或 External Server 都在独立的子进程中运行。
- **Communication**: 通过 Stdio (标准输入输出) 进行 JSON-RPC 消息传递。

### 3.2 目录结构
```text
~/.promptstudio/
  ├── mcp_config.json      # 服务器配置注册表
  ├── skills/              # 用户编写的脚本存放目录
  │   ├── my_math.py
  │   └── web_search.py
  └── logs/                # 运行日志
```

### 3.3 关键依赖
- `mcp` (Python SDK): 用于实现协议通信。
- `fastmcp`: 用于快速将 Python 函数转换为 MCP Server。
- `uv`: 推荐用于管理 Python 环境依赖。

## 4. 交付计划 (Roadmap)

### Phase 1: 基础框架 (MVP)
- [ ] 实现 `McpProcessManager` 后端服务。
- [ ] 实现前端管理界面，支持启动/停止 "Filesystem MCP Server"。
- [ ] 实现基础的 Playground Tool Call 支持。

### Phase 2: 技能编辑器 (Script Support)
- [ ] 集成 Monaco Editor，支持 Python 语法高亮。
- [ ] 实现 `Script-to-MCP` 动态加载器。
- [ ] 支持查看实时运行日志。

### Phase 3: 上下文资源 (Context Resource)
- [ ] 支持将本地文件夹拖拽为 "Knowledge Base"。
- [ ] 暴露为 MCP Resource (`mcp://...`) 供外部调用。
