# 任务：社区功能

## 后端 (Django)
- [x] **认证 API**：使用 DRF 和 SimpleJWT 实现注册 (`/api/register`) 和登录 (`/api/token`) 接口。 <!-- id: 0 -->
- [x] **市场模型**：在 `server/prompts` 和 `server/users` 中创建 `MarketPrompt`、`PromptVersion`、`Comment`、`Reaction` 模型。 <!-- id: 1 -->
- [x] **媒体 API**：实现 `/api/media/upload` 以处理文件上传、哈希计算和返回 URL（模拟 OSS）。 <!-- id: 2 -->
- [x] **市场 API**：实现提示词的 CRUD 接口 (`/api/market/prompts`)，包括搜索和过滤。 <!-- id: 3 -->
- [x] **互动 API**：实现评论和点赞接口 (`/api/market/interact`)。 <!-- id: 4 -->
- [x] **通知系统**：实现基础的轮询接口 (`/api/notifications`) 和模型。 <!-- id: 5 -->

## 前端核心 (Tauri/React 服务)
- [x] **认证服务**：创建 `src/services/auth.js` 处理 JWT 存储和刷新。 <!-- id: 6 -->
- [x] **同步引擎**：创建 `src/services/sync.js` 处理本地文件夹扫描和“备份”上传。 <!-- id: 7 -->
- [x] **发布流程**：实现 `src/services/publish.js`，包含敏感数据检查 (Regex) 和多媒体上传编排。 <!-- id: 8 -->
- [x] **市场客户端**：实现 `src/services/market.js` 用于获取市场数据并处理“安装/更新”逻辑（包括版本回滚）。 <!-- id: 9 -->

## 前端 UI (React)
- [x] **认证弹窗**：创建 `LoginModal` 和 `RegisterModal` 组件。 <!-- id: 10 -->
- [x] **市场页面**：实现 `src/pages/Market.jsx`，包含搜索栏和提示词网格。 <!-- id: 11 -->
- [x] **提示词详情**：创建 `src/pages/PromptDetail.jsx`，显示版本信息、内容预览和“安装”按钮。 <!-- id: 12 -->
- [x] **发布 UI**：在 `EditorToolbar` 中添加“分享/发布”按钮，触发发布流程。 <!-- id: 13 -->
- [x] **通知中心**：添加通知铃铛图标和更新下拉列表/抽屉。 <!-- id: 14 -->
- [x] **互动 UI**：在 `PromptDetail` 中添加点赞和评论区域。 <!-- id: 15 -->

## 验证
- [x] **E2E 测试**：为完整的“发布 -> 搜索 -> 安装”循环编写 Playwright 测试。 <!-- id: 16 -->
