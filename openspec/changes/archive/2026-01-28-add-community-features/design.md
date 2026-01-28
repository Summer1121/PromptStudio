# 设计：社区功能

## 架构

### 1. 混合存储模型
PromptStudio 遵循“本地优先”原则，但增加了“云端增强”能力。
- **本地（用户的事实来源）**：文件系统（`.json`, `.md` 提示词）。
- **云端（备份与社区）**：
    - **备份存储**：用于用户同步的私有、非结构化或半结构化存储。
    - **市场存储**：用于公共/共享提示词的结构化关系型数据库 (PostgreSQL)，与私有备份隔离。

### 2. 数据流
- **备份**：
    - 触发：手动或定时（仅在登录时）。
    - 动作：将本地目录状态同步到用户的私有云端桶/目录。
    - 多媒体：图片/视频通过哈希 (SHA-256) 处理并上传到中央 CAS (内容可寻址存储) 模拟器（例如 `server/media/<hash>`）。备份将引用这些 URL。
- **发布（市场）**：
    - 触发：用户点击提示词上的“发布”。
    - 流程：
        1.  **脱敏**：调用 LLM/正则表达式检查密钥（API Keys）。
        2.  **资产处理**：确保多媒体已上传并由 URL 引用。
        3.  **版本控制**：客户端生成/维护 `prompt_id` (UUID)。服务器接受此 ID，如果 ID 已存在，则视为新版本。
        4.  **元数据**：标题、标签、描述、可见性（公开/仅链接）。
- **安装/更新（市场 -> 本地）**：
    - 下载 JSON/内容。
    - 在本地存储原始“市场版本”元数据以跟踪更新。
    - “更新”从服务器拉取最新版本，执行差异对比/替换，并将旧版本保存在本地以便回滚。

### 3. 身份与安全
- **认证**：基于 JWT 的身份验证 (Django Simple JWT)。
- **ID**：对公共实体（提示词、用户）使用 UUIDv4 以防止枚举攻击。
- **密码**：Argon2 或 PBKDF2 哈希（Django 默认）。

## 数据库模式变更（概念性）

### `User`
- 标准 Django 用户。
- 个人资料字段（头像、昵称）。

### `MarketPrompt`
- `uuid`：UUID (主键，公开)。
- `owner`：外键关联到 User。
- `visibility`：枚举（公开、仅链接、私有）。
- `latest_version`：整数。

### `PromptVersion`
- `prompt`：外键关联到 MarketPrompt。
- `version`：整数。
- `content`：文本/JSON。
- `changelog`：文本。
- `created_at`：时间戳。

### `Interaction`
- `type`：点赞/踩。
- `user`：外键关联到 User。
- `target_uuid`：外键关联到 MarketPrompt（或评论）。

### `Comment`
- `user`：外键关联到 User。
- `content`：文本。
- `target_uuid`：外键关联到 MarketPrompt。
- `parent`：外键关联到 Comment（用于回复）。

## API 策略
- **RESTful API**：`/api/v1/market/...`, `/api/v1/auth/...`, `/api/v1/backup/...`。
- **媒体**：`/api/v1/media/upload`（返回 URL）。

## 前端组件
- **市场页面**：网格/瀑布流布局。
- **提示词详情**：富文本预览、历史版本、评论。
- **认证弹窗**：全局“登录后继续”弹窗。
- **通知中心**：轮询或 WebSocket（MVP 阶段使用轮询）。