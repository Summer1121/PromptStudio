## Context

当前编辑器界面存在多个UI和功能问题，影响用户体验。需要修复 PlainTextEditor 的双层文字显示、变量交互失效，以及重构 NotesEditor 的布局和功能。

## Goals / Non-Goals

### Goals
- 修复 PlainTextEditor 视觉和交互问题
- 重构 NotesEditor 布局，避免遮挡内容
- 完善 NotesEditor 的功能（展开、多语言、工具栏）

### Non-Goals
- 不改变编辑器的核心编辑功能
- 不引入新的编辑器框架或库
- 不改变现有的数据结构和存储方式

## Decisions

### Decision: PlainTextEditor 高亮层渲染方式

**方案**：高亮层只渲染变量部分的高亮HTML，非变量文本在HTML中使用透明或空的占位符，或者完全移除原始文本，只保留变量高亮标记。

**理由**：PlainTextEditor 使用了高亮层 + textarea 的双层架构来同时支持文本输入和变量高亮。问题的根源是高亮层显示了完整的原始文本。解决方案是修改 `highlightText` 函数，只生成变量部分的高亮HTML，非变量部分不生成可见内容或使用透明样式。

**替代方案**：使用 CSS 让非变量文本透明，但这可能会影响渲染性能。

### Decision: NotesEditor 布局方式

**方案**：将 NotesEditor 从 `absolute` 定位改为正常的 flex 布局，放在 PlainTextEditor 容器下方，使用固定高度或最小高度。

**理由**：当前 NotesEditor 使用 `absolute bottom-0` 定位，会覆盖编辑器内容。改为正常的布局流，可以避免遮挡问题，同时保持注释板块始终可见。

**实现位置**：在 `App.jsx` 中调整包含 PlainTextEditor 和 NotesEditor 的容器结构。

### Decision: 展开按钮的实现方式

**方案**：展开按钮可以打开一个新的浏览器窗口（使用 `window.open`）或一个全屏的模态视图来展示注释内容。

**理由**：考虑到 Tauri 桌面应用的上下文，可以使用 Tauri 的窗口 API 打开新窗口，或者在应用内使用全屏模态。由于当前代码中没有看到 Tauri 窗口管理的使用，建议先使用应用内的全屏模态实现，后续可以升级为独立窗口。

**替代方案**：使用 Tauri 的 `WindowManager` API 创建独立窗口，这需要引入 Tauri API 调用。

### Decision: NotesToolbar 按钮问题修复

**方案**：检查 Tiptap 编辑器的命令调用方式，确保命令链正确执行，避免在调用时丢失焦点或清空内容。

**理由**：文本清空问题可能是由于编辑器状态管理或命令执行顺序问题导致的。需要检查是否在命令执行前正确保持了编辑器的焦点和选择状态。

## Risks / Trade-offs

### 风险：高亮层修改可能影响性能

**风险**：修改高亮层的渲染逻辑可能需要重新计算和生成HTML，频繁更新时可能影响性能。

**缓解**：使用 `useMemo` 优化高亮内容的计算，避免不必要的重新渲染。

### 风险：布局变更可能影响现有E2E测试

**风险**：NotesEditor 位置改变可能导致现有测试失败。

**缓解**：更新 E2E 测试以反映新的布局结构，确保测试用例与实际UI一致。

## Migration Plan

1. 先修复 PlainTextEditor 的双层文字问题（低风险）
2. 修复变量交互功能（中等风险）
3. 重构 NotesEditor 布局（可能影响测试，需要同步更新）
4. 实现展开功能和多语言支持（功能增强，风险较低）
5. 修复工具栏按钮问题（功能修复，风险中等）

每个步骤完成后进行手动测试，确保不影响现有功能。

## Open Questions

- NotesEditor 的展开功能是否应该使用 Tauri 的独立窗口，还是应用内模态视图？
- NotesEditor 的默认高度应该如何确定？固定值还是根据内容自适应？
- 图片和视频的插入是否需要支持本地文件上传，还是仅支持 URL？
