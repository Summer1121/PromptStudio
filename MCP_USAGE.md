# PromptStudio MCP 使用指南

PromptStudio 的本地 MCP 服务 (Local MCP Host) 运行在 `http://localhost:19880`。您可以将外部 AI 客户端（如 Gemini CLI, Claude Desktop）连接到此服务，从而使用您在 PromptStudio 中管理的本地技能。

## 1. 连接 Gemini CLI

Gemini CLI 支持通过 SSE (Server-Sent Events) 协议连接。

**配置步骤：**
1.  找到或创建 Gemini CLI 的配置文件 `settings.json`（通常位于 `~/.gemini/settings.json` 或项目根目录）。
2.  在 `mcpServers` 部分添加如下配置：

```json
{
  "mcpServers": {
    "prompt-studio": {
      "url": "http://localhost:19880/api/v1/mcp/sse"
    }
  }
}
```
*注意：请使用 `url` 字段（对应 SSE），而不是 `httpUrl`。*

## 2. 连接 Claude Desktop / Cursor

Claude Desktop 支持通过本地命令 (Stdio) 连接。我们需要使用 `ps-mcp-bridge.py` 桥接脚本。

**配置步骤：**
1.  找到 Claude Desktop 配置文件：
    *   macOS: `~/Library/Application Support/Claude/claude_desktop_config.json`
    *   Windows: `%APPDATA%\Claude\claude_desktop_config.json`
2.  添加如下配置（请修改脚本路径）：

```json
{
  "mcpServers": {
    "prompt-studio": {
      "command": "python",
      "args": ["/绝对路径/到/PromptStudio/ps-mcp-bridge.py"]
    }
  }
}
```

## 3. 在 PromptStudio 中管理技能

### 方式 A：一键发布 (Prompt-to-Skill)
1.  在编辑器中编写并打磨好您的提示词模板。
2.  点击工具栏上的 **"发布为 Skill"** (闪电图标)。
3.  AI 会自动生成配套的 Python 代码及 MCP 描述。
4.  预览无误后点击 **"保存并运行"**。系统会自动关联该 Template 与 Skill。

### 方式 B：手动编写
1.  访问 **MCP 资源中心** (点击侧边栏 CPU 图标)。
2.  在 **我的技能** 标签页创建 Python 脚本。
3.  保存后，服务会自动启动。外部客户端重连后即可看到新工具。

## 4. 同步更新
如果您修改了已关联 Skill 的提示词模板，工具栏会提示 **"Skill 已过期"**。点击即可快速同步最新的提示词逻辑到 Skill 代码中。
