# Design: 注释媒体文件存储架构

## Context

当前注释编辑器使用 base64 编码直接嵌入图片和视频，导致数据文件过大、性能问题，且不支持剪切板粘贴。需要重构为文件存储 + 路径引用的架构。

## Goals / Non-Goals

### Goals
- 将媒体文件存储到应用目录，使用路径引用而非 base64
- 支持从剪切板直接粘贴图片和视频
- 修复切换模板时注释加载失败的问题
- 提升性能，减少数据文件大小

### Non-Goals
- 不支持云端同步（当前阶段）
- 不支持媒体文件的版本管理
- 不实现媒体文件的压缩优化（保持原始质量）

## Decisions

### Decision: 文件存储位置

**方案**：使用 Tauri 的 `app_data_dir` + `media/` 子目录

**理由**：
- Tauri 提供了标准的应用数据目录 API
- 跨平台兼容（Windows: `%APPDATA%`, macOS: `~/Library/Application Support`, Linux: `~/.config`)
- 与应用数据文件在同一目录层级，便于管理

**实现**：
```rust
// Rust 后端
let app_data_dir = app.path().app_data_dir()?;
let media_dir = app_data_dir.join("media");
```

### Decision: 文件命名规则

**方案**：`{templateId}_{timestamp}_{hash}.{ext}`

**理由**：
- `templateId`：便于识别文件所属模板，清理时可按模板删除
- `timestamp`：避免文件名冲突
- `hash`：文件内容哈希，用于去重（可选，如果实现去重功能）
- `ext`：保持原始文件扩展名

**示例**：`tpl_1234567890_1705123456_a1b2c3d4.jpg`

### Decision: 路径引用格式

**方案**：在 HTML 中使用自定义协议 `media://` 或相对路径

**理由**：
- 自定义协议便于识别和转换
- 相对路径便于迁移和备份
- 读取时转换为实际的 `file://` 或 `asset://` URL

**格式**：
- 存储格式：`<img src="media://tpl_1234567890_1705123456_a1b2c3d4.jpg">`
- 显示格式：`<img src="file:///path/to/app_data/media/tpl_1234567890_1705123456_a1b2c3d4.jpg">`

### Decision: 剪切板处理

**方案**：使用 Tiptap 的 `ClipboardTextSerializer` 和原生 Clipboard API

**理由**：
- Tiptap 提供了粘贴事件钩子
- 原生 Clipboard API 可以访问图片和视频数据
- 需要同时处理浏览器和 Tauri 环境

**实现**：
```javascript
editor.setOptions({
  editorProps: {
    handlePaste: (view, event, slice) => {
      const items = event.clipboardData?.items;
      // 检测图片/视频并保存
    }
  }
});
```

### Decision: 模板切换修复

**方案**：使用 `key` prop 强制重新渲染，或改进 `useEffect` 依赖

**理由**：
- React 的 `key` prop 可以强制组件重新挂载
- 改进 `useEffect` 依赖可以确保正确响应模板切换

**实现**：
```jsx
<NotesEditor
  key={activeTemplateId}  // 强制重新渲染
  notes={activeTemplate.notes}
  templateId={activeTemplateId}
  ...
/>
```

## Risks

1. **文件路径兼容性**：不同操作系统的路径格式不同，需要统一处理
2. **文件权限**：Tauri 应用可能需要额外的文件系统权限配置
3. **数据迁移**：现有 base64 格式的注释需要迁移，可能影响用户体验
4. **性能**：大量媒体文件可能影响应用启动速度（需要延迟加载）

## Migration Plan

1. **阶段 1**：实现新的文件存储功能，同时保持 base64 兼容
2. **阶段 2**：添加数据迁移工具，将现有 base64 转换为文件存储
3. **阶段 3**：移除 base64 支持，完全使用文件存储

## Alternatives Considered

1. **使用 IndexedDB 存储媒体文件**：
   - 优点：浏览器原生支持，无需文件系统权限
   - 缺点：Tauri 环境中不如文件系统直接，且容量限制

2. **使用相对路径引用用户选择的文件夹**：
   - 优点：用户可以选择存储位置
   - 缺点：需要用户手动选择，增加复杂度

3. **使用 base64 但压缩图片**：
   - 优点：无需文件系统操作
   - 缺点：仍然会增加数据文件大小，且不支持视频
