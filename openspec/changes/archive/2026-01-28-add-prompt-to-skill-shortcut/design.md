# Design: Prompt-to-Skill 转换机制

## Context
我们需要将一个静态的 Prompt 模板（如 `翻译 {{text}} 为 {{lang}}`）转换为一个动态可执行的 Python 脚本。

## Goals
- **自动化**: 尽可能少让用户写代码。
- **标准化**: 生成的代码必须符合 MCP 标准 (`fastmcp`)。
- **智能**: 描述（Docstring）必须足够清晰，以便 Agent 能够正确路由。

## Decisions

### 1. 代码生成模板
生成的 Python 脚本将采用以下结构：
```python
# /// script
# dependencies = ["fastmcp", "requests"]
# ///
from fastmcp import FastMCP
import requests
import os

# 初始化 MCP 服务
mcp = FastMCP("skill_name")

@mcp.tool()
def skill_name(var1: str, var2: str = "default") -> str:
    """
    [AI Generated Description]
    
    Args:
        var1: [AI Generated Desc]
        var2: [AI Generated Desc]
    """
    # 构造 Prompt
    prompt = f"..." 
    
    # 调用 LLM (默认使用 OpenAI 兼容接口，需注入 Key)
    # 为了简化体验，生成的代码默认从环境变量读取配置，或者硬编码当前配置（需提示用户）
    # 更好的方案：调用 PromptStudio 自身的 Proxy API (如果有)
    # 这里决定：生成标准的 OpenAI 调用代码，并注释说明如何配置 Key。
    
    # ... implementation ...
    return result
```

### 2. 交互流程
1.  **触发**: 用户点击“保存为 Skill”。
2.  **分析**:
    *   前端解析 Prompt 获取变量列表。
    *   前端调用 `invokeLlm` (使用 `system: You are an expert code generator...`)，传入 Prompt 内容和变量。
    *   LLM 返回 JSON: `{ "description": "...", "args": { "var1": "desc" }, "code": "..." }`。
3.  **预览与确认**:
    *   弹出 `PromptToSkillModal`。
    *   展示生成的名称、描述、参数列表。
    *   展示完整的 Python 代码预览（支持编辑）。
4.  **保存**:
    *   用户点击“保存并运行”。
    *   前端调用 `POST /api/v1/mcp/skills` 保存代码。
    *   MCP Host 自动启动服务。

### 3. API Key 处理
生成的脚本是独立的，原则上不应依赖 PromptStudio 的运行状态。
*   **Decision**: 生成的代码将包含 `api_key = os.getenv("LLM_API_KEY")`。
*   **UX**: 在保存弹窗中，提示用户该脚本运行时需要环境变量。PromptStudio 的 `ProcessManager` 在启动 Skill 时，可以注入当前配置的 API Key 吗？
    *   可以！`McpProcessManager` 可以读取 `llmSettings` 并注入到子进程的 env 中。这是一个极佳的 DX 提升。

### 4. 关联与同步机制 (Linkage & Sync)
- **数据模型**:
    - 在 `Template` 对象中新增字段 `linkedSkill`: `{ name: string, lastSyncHash: string }`。
- **关联建立**:
    - 当用户通过“保存为 Skill”成功创建 Skill 后，回写 `activeTemplate.linkedSkill`。
- **变更检测**:
    - 在保存 Template (`handleUpdateTemplate`) 时，计算当前内容的 Hash。
    - 如果 `contentHash != linkedSkill.lastSyncHash`，在编辑器工具栏显示“Skill Outdated”提示或“同步”按钮。
- **同步流程 (Update Workflow)**:
    - 用户点击“同步到 Skill”。
    - 打开 `PromptToSkillModal`，进入 **Update Mode**。
    - 系统重新生成代码。
    - **智能合并 (Smart Merge)**: 尝试读取现有 Skill 代码，保留用户修改过的 Docstring 或额外逻辑（如果技术复杂度允许），或者简单地展示 Diff，让用户决定是否覆盖。
    - *Decision for MVP*: 重新生成完整代码，并提供 Diff 视图与现有 Skill 代码对比。用户确认覆盖后，更新 `lastSyncHash`。

### 5. 恢复启动修复 (Safe Restart Fix)
- **现状分析**: 用户反馈二次确认功能未生效。可能原因：
    1. 后端 `last_status` 未持久化成功。
    2. 前端 `checkAndRestoreServers` 调用时机不当（例如 `servers` 状态尚未更新导致过滤逻辑错误）。
- **优化方案**:
    - **后端**: 确保 `mcp_config.json` 在每次进程状态变化时（Start/Stop）立即强制刷盘。
    - **前端**: 改为由独立的状态控制弹窗逻辑，不再依赖 `refreshData` 的回调。在 `McpManager` 挂载时，优先获取 `lastActive` 列表，如果存在则直接弹窗。
- **UI 优化**: 将关闭图标改为标准的 `X` 图标（`X` 或 `XCircle` from `lucide-react`）。

## Risks
- **变量类型推断**: LLM 可能无法准确推断变量是 `str` 还是 `int`。默认全为 `str`。
- **复杂的 Prompt 逻辑**: 如果 Template 包含复杂的 Liquid/Jinja 逻辑，简单的 f-string 可能不够。
    *   **Mitigation**: MVP 阶段仅支持简单的 `{{var}}` 替换。

## Open Questions
- 是否支持流式 Skill？（`fastmcp` 支持 generator，但 LLM 调用也得是流式的）。MVP 先做同步返回文本。
