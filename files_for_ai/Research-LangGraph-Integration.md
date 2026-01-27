# 技术调研报告：LangGraph 集成可行性分析

## 1. 调研结论 (Executive Summary)
**结论**：**极力推荐引入 LangGraph**。
**理由**：LangGraph 是目前 Python 生态中解决 **"Agent 有状态循环"** 和 **"多智能体协作"** 问题的最佳实践。它与 PromptStudio 现有的 Python (Django) 后端完美兼容，能够以极低的开发成本赋予平台以下核心能力：
1.  **复杂工作流编排**（不仅是线性链，更是包含循环、条件判断的图）。
2.  **原生的人工介入能力**（Human-in-the-loop，对于 Skill 安全执行至关重要）。
3.  **状态持久化与“时间旅行”**（查看每一步的中间状态，甚至回滚重试）。

---

## 2. 核心价值匹配 (Value Alignment)

我们将 LangGraph 的特性与我们规划的四大 Story 进行映射：

### 2.1 匹配 Story-20260126-04: Agent 编排
*   **PromptStudio 需求**：可视化的工作流编辑器，支持串行、并行、条件分支。
*   **LangGraph 解决方案**：
    *   **Graph Structure**: LangGraph 的核心就是 Node（节点）和 Edge（边）。前端的可视化图（如 React Flow）可以轻松转换为后端的 LangGraph 定义。
    *   **State Management**: 它自动管理 Agent 运行过程中的全局状态（State），解决了在不同 Agent 间传递数据的难题。

### 2.2 匹配 Story-20260126-01: Skill 管理与安全确认
*   **PromptStudio 需求**：在 AI 执行敏感操作（如发邮件）前，暂停并等待用户点击“批准”。
*   **LangGraph 解决方案**：
    *   **Human-in-the-loop (HITL)**: LangGraph 原生支持 `interrupt_before` 或 `interrupt_after`。我们可以在“执行工具”这个节点前设置断点。
    *   **流程**：Graph 运行 -> 遇到工具节点 -> **暂停并保存状态** -> 前端弹窗请求用户确认 -> 用户点击确认 -> **恢复运行**。这是手写很难实现的逻辑，LangGraph 开箱即用。

### 2.3 匹配 Story-20260126-02/03: MCP & RAG
*   **PromptStudio 需求**：根据上下文动态调用工具或检索知识库。
*   **LangGraph 解决方案**：
    *   **Prebuilt ToolNode**: LangGraph 提供了现成的 `ToolNode`，可以无缝集成 LangChain 的 Tools（很容易适配 MCP）。
    *   **Agent Supervisor**: 可以构建一个 "Router Agent"（路由节点），专门决定是去检索知识库 (RAG)，还是去调用外部工具 (MCP)，还是直接回答。

---

## 3. 技术集成方案 (Technical Architecture)

### 3.1 架构图示
```mermaid
graph TD
    User[用户 (Frontend/Tauri)] -->|HTTP/WebSocket| Django[Django Backend]
    Django -->|Task Request| LangGraph[LangGraph Engine]
    
    subgraph "LangGraph Engine (Python)"
        State[Shared State]
        Node1[Prompt Node]
        Node2[Tool Node]
        Node3[Human Review Node]
        
        Node1 -->|Check| Node2
        Node2 -->|Wait Approval| Node3
        Node3 -->|Result| Node1
    end
    
    LangGraph -->|Persist| Postgres[(PostgreSQL/Sqlite)]
    LangGraph -->|Stream Events| Django
```

### 3.2 关键实施点
1.  **依赖引入**：在 `server/requirements.txt` 中添加 `langgraph` 和 `langchain`。
2.  **持久化层 (Checkpointer)**：LangGraph 需要保存每一步的状态快照。我们可以利用 Django 的 ORM 实现一个自定义的 `Checkpointer`，或者直接使用 Postgres。这将允许用户在前端查看历史运行记录，并从任意步骤“Fork”出新的运行。
3.  **流式响应 (Streaming)**：LangGraph 支持流式输出每一步的中间结果（Thought Process）。Django 需要通过 `StreamingHttpResponse` 或 WebSocket 将这些事件实时推送到前端，让用户看到 AI 是如何“思考”和“行动”的。

---

## 4. 潜在风险与应对 (Risks & Mitigations)

| 风险点 | 描述 | 应对策略 |
| :--- | :--- | :--- |
| **学习曲线** | LangGraph 引入了 State, Graph, Conditional Edge 等新概念，开发团队需要适应。 | 前期先封装几个固定的 Template（如 ReAct Agent, Plan-and-Execute），不暴露底层 Graph 给用户。 |
| **调试难度** | 图的执行逻辑可能很复杂，出现死循环或状态异常难排查。 | 集成 **LangSmith**（LangChain 官方的可视化追踪平台），在开发阶段用于 Trace 和 Debug。 |
| **延迟问题** | 每次状态转换都需要持久化，可能增加延迟。 | 使用 Redis 作为热数据的 Backend，仅异步归档到 SQL 数据库。 |

## 5. 推荐路线图 (Implementation Roadmap)

1.  **Phase 1: 基础集成 (v0.1)**
    *   引入 `langgraph` 库。
    *   实现一个最简单的 **ReAct Agent**（思考-行动-观察循环），替换当前直接调用 LLM API 的逻辑。
    *   实现这一过程的流式输出到前端日志窗口。

2.  **Phase 2: 人机交互 (v0.2)**
    *   利用 `interrupt` 机制实现“工具调用审批”功能。
    *   前端增加“请求确认”的交互卡片。

3.  **Phase 3: 编排能力 (v1.0)**
    *   开发后端的 Graph 定义 DSL（JSON 格式）。
    *   前端开发拖拽式编辑器，生成上述 JSON，动态构建 LangGraph。

## 6. 结论
LangGraph 就像是为我们的 Vision-2026 量身定做的引擎。它解决了“怎么让 AI 连续做事”和“怎么让人控制 AI”这两大难题。**强烈建议立即启动 POC (概念验证)**。
