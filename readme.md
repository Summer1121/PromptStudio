# 🎨 PromptStudio

PromptStudio 是一个开源的提示词（Prompt）创作、管理与分享平台。无论你是经验丰富的提示词工程师，还是刚刚入门的 AI 爱好者，本工具都将为你提供前所未有的流畅体验。

## ✨ 核心功能

我们致力于将提示词的管理和分发变得简单、高效。

### ✍️ 提示词管理 (Prompt Management)

提供一个强大的工作区来组织和优化你的每一个奇思妙想。

-   **智能分类与总结 (Automatic Classification & Summarization)**
    -   利用大语言模型（LLM）自动分析你的提示词，为其生成精准的标签（如 `图像生成`, `文本摘要`, `代码辅助` 等）。
    -   为复杂的提示词自动生成简洁明了的核心功能总结，让你一目了然。

-   **运行实例记录 (Record Examples)**
    -   可以为每个提示词保存多组成对的“输入/输出”实例。
    -   直观地展示提示词在不同变量下的实际效果，方便调试和迭代。

-   **模板化填空 (Prompt Templating)**
    -   将提示词中的可变部分设置为变量（例如 `{{主题}}` 或 `{{风格}}`）。
    -   同时也用于分享信息时的用户数据脱敏
    -   用户只需填写变量，即可快速生成、测试和复用不同场景下的提示词，极大地提升效率。

-   **智能评分 (Intelligent Scoring)**
    -   从清晰度、具体性、性能潜力等多个维度，为你的提示词进行智能评估和打分。
    -   提供可操作的优化建议，帮助你创作出更高质量的提示词。

### 🏪 咒语商店 (Spell Store)

一个开放的社区，让你发现、分享和评价高质量的提示词。
-   **一键分享 (One-Click Sharing)**
    -   将你在工作区创作的优秀提示词一键发布到“咒语商店”，与全球用户分享。
    -   支持通过链接将提示词私密地分享给好友或团队成员。

-   **社区驱动的评价体系 (Community-Driven Feedback)**
    -   用户可以对商店中的提示词进行投票、评论，并分享自己的使用效果图或文本。
    -   高质量的提示词将获得更多曝光，形成良性循环。

-   **版本控制与更新 (Versioning & Updates)**
    -   提示词作者可以随时更新已发布的提示词。
    -   系统会清晰地记录每个提示词的历史版本，用户可以选择使用旧版本，并会收到更新推送。

## 🚀 技术栈 (Tech Stack)

-   **前端**: React, Vite, Tailwind CSS
-   **后端**: Python (Django, Django REST Framework), PostgreSQL/SQLite, Celery + Redis

## 🛠️ 如何本地运行 (Getting Started)

本指南将帮助你快速在本地搭建并运行 PromptStudio 项目。项目分为前端和后端两部分，请分别进行配置。

### 💻 前端本地运行 (Frontend Getting Started)

前端应用使用 React、Vite 和 Tailwind CSS 构建，并通过 Tauri 框架打包成桌面应用。

1.  **进入前端目录**:
    ```bash
    cd prompt_fill
    ```

2.  **安装依赖**:
    ```bash
    npm install
    ```

3.  **启动前端开发服务器 (Web 版本)**:
    如果您只希望在浏览器中运行前端进行开发：
    ```bash
    npm run dev
    ```
    服务默认运行在 `http://localhost:1420/`。

4.  **启动桌面应用开发模式 (Tauri 版本)**:
    如果您希望以桌面应用的形式运行，并测试本地文件持久化功能：
    ```bash
    npx tauri dev
    ```
    *注意：此命令会同时启动前端开发服务器和 Tauri 后端，并在一个桌面窗口中显示您的应用。*

### 🖥️ 后端本地运行 (Backend Getting Started)

后端服务基于 Django 和 Django REST Framework 构建。

1.  **进入后端目录**:
    ```bash
    cd server
    ```

2.  **创建并激活虚拟环境**:
    建议使用 Python 3.9+。
    ```bash
    python3 -m venv venv
    source venv/bin/activate
    ```
    (Windows 用户请使用 `venv\Scripts\activate`)

3.  **安装依赖**:
    首先，确保您已生成 `requirements.txt` 文件。然后，在激活虚拟环境后，安装所有后端依赖。
    ```bash
    pip install -r requirements.txt
    ```

4.  **运行数据库迁移**:
    项目默认使用 SQLite 数据库，如果你想使用 PostgreSQL，请修改 `server/prompt_studio_be/settings.py` 中的 `DATABASES` 配置。
    ```bash
    python manage.py makemigrations
    python manage.py migrate
    ```

5.  **创建超级用户 (可选，用于访问Admin后台)**:
    ```bash
    python manage.py createsuperuser
    ```
    按照提示输入用户名、邮箱和密码。

6.  **启动后端开发服务器**:
    ```bash
    python manage.py runserver
    ```
    服务默认运行在 `http://127.0.0.1:8000/`。

    你可以访问 `http://127.0.0.1:8000/admin/` 登录管理后台，访问 `http://127.0.0.1:8000/api/` 查看 API 根路径。