# Project Context

## Purpose
PromptStudio 是一个开源的提示词（Prompt）创作、管理与分享平台，整体是C/S架构，由本地数据+云端社区组成。


## Tech Stack

-   **前端**: React, Vite, Tailwind CSS, Tauri (for cross-platform desktop app)
-   **后端**: Python (Django, Django REST Framework), PostgreSQL/SQLite, Celery + Redis

## Project Conventions

### Code Style
- 高度工程化，易于维护
- 代码简洁，尽量使用最简、最佳实现
- 详细的中文注释

### Architecture Patterns
- **C/S 架构**: 核心是一个客户端/服务器架构。
- **桌面客户端**: 使用 [Tauri](https://tauri.app/) 构建，将基于 React 的 Web 前端打包成轻量级的跨平台桌面应用。这使得应用可以直接与用户本地文件系统交互。
- **后端 API**: 由 Django 和 Django REST Framework 提供支持的 RESTful API，处理核心业务逻辑、数据持久化和用户管理。
- **异步任务**: 使用 Celery 和 Redis 来处理耗时操作（例如，与云端社区的同步），确保主应用的响应性。

### Testing Strategy
- **端到端 (E2E) 测试**: 采用 [Playwright](https://playwright.dev/) 对所有面向用户的交互进行全面的自动化测试。
- **测试用例维护**: 所有C端交互都需要在`prompt_fill/tests/e2e/`目录中添加或修改e2e测试用例。
- **回归验证**: 在功能归档或发布前，必须完整运行并通过所有 E2E 测试用例，确保新旧功能正常。

### Git Workflow
- **分支模型**: 目前所有开发都在 `main` 分支上进行，以支持 MVP (Minimum Viable Product) 版本的快速迭代。
- **提交信息**: Commit messages 使用中文，风格简洁，以功能或修复为导向（例如, "优化页面交互", "添加备注功能"）。

## Domain Context
- **核心领域**: 项目围绕“提示词工程”（Prompt Engineering），这是一个与大型语言模型（LLM）高效交互的领域。
- **核心实体**:
    - **提示词 (Prompt)**: 发送给 AI 模型的一组指令或问题。
    - **模板 (Template)**: 一个可复用的、包含变量的提示词结构，方便用户快速生成和定制提示词。
    - **变量 (Variable)**: 在模板中定义的占位符，用户可以填充具体内容。
    - **标签/目录 (Tag/Directory)**: 用于组织和分类提示词模板。

## Important Constraints
- **中文优先**: 所有代码注释和面向用户的文本都必须使用中文。
- **MVP 阶段**: 当前开发集中于 `main` 分支，目标是快速交付核心功能的最小可行产品。
- **跨平台**: 客户端必须支持主流桌面操作系统（Windows, macOS, Linux），这是通过 Tauri 实现的。

## External Dependencies
- **前端**:
    - `react`: 构建用户界面的核心库。
    - `vite`: 前端构建工具，提供快速的开发体验。
    - `tailwindcss`: 用于快速构建UI的原子化CSS框架。
    - `tiptap`: 一个功能丰富的文本编辑器框架，用于提示词的创作。
- **后端**:
    - `Django`: Web 框架。
    - `djangorestframework`: 用于构建 REST API。
    - `celery`: 异步任务队列。
    - `redis`: 作为 Celery 的消息代理和后端缓存。
    - `psycopg2-binary`: PostgreSQL 数据库驱动。
- **测试**:
    - `playwright`: 用于端到端测试。
