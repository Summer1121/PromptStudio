# PlainTextEditor 重构方案调研

## 问题描述

当前 `PlainTextEditor` 使用**双层架构**（textarea + 高亮层）来实现文本输入和变量高亮，导致：
1. 框选时能看到两层文字，视觉混乱
2. 变量交互复杂，容易出现焦点和点击事件问题
3. 需要维护两套同步逻辑（滚动、内容更新等）

用户希望将 `PlainTextEditor` 改为**单一富文本编辑器**，支持变量作为特殊节点展示。

## 现状分析

### 当前实现对比

| 特性 | PlainTextEditor | VisualEditor |
|------|----------------|--------------|
| **实现方式** | textarea + HTML高亮层 | Tiptap 富文本编辑器 |
| **变量支持** | 通过正则匹配和HTML渲染 | TiptapVariable 自定义节点 |
| **编辑体验** | 原生 textarea，简单直接 | 富文本，支持 Markdown |
| **变量交互** | 点击事件处理复杂 | 通过 VariableNode React组件 |
| **序列化** | 直接文本 | Markdown 序列化 |

### VisualEditor 的优势

`VisualEditor` 已经实现了用户需要的功能：
- ✅ 单一编辑器架构（Tiptap）
- ✅ 变量作为自定义节点（TiptapVariable）
- ✅ 支持 Markdown 输入和输出
- ✅ 变量点击交互流畅（通过 React NodeView）
- ✅ 变量样式和交互统一（CATEGORY_STYLES）

## 解决方案

### 方案1：直接迁移到 Tiptap（推荐）

**核心思路**：参考 `VisualEditor` 的实现，将 `PlainTextEditor` 改为基于 Tiptap 的编辑器。

**实现要点**：
1. 使用 `TiptapVariable` 扩展（已存在）
2. 配置 Tiptap 为"纯文本模式"（禁用大部分格式化功能）
3. 保持与 `PlainTextEditor` 相同的 API 接口（向后兼容）
4. 使用 `Markdown` 扩展处理序列化

**优点**：
- ✅ 解决双层架构的所有问题
- ✅ 代码复用（利用现有的 TiptapVariable）
- ✅ 与 VisualEditor 保持一致的技术栈
- ✅ 变量交互体验优秀
- ✅ 易于维护和扩展

**缺点**：
- ⚠️ 需要引入 Tiptap（但项目已有依赖）
- ⚠️ 可能改变编辑体验（从原生 textarea 到富文本编辑器）
- ⚠️ 需要处理 Markdown 序列化的兼容性

**代码示例**：
```jsx
// 基于 VisualEditor 的简化版本
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Markdown } from '@tiptap/markdown';
import { TiptapVariable } from './TiptapVariable';

const PlainTextEditor = ({ value, onUpdate, ...props }) => {
  const editor = useEditor({
    extensions: [
      // 禁用大部分格式化功能，保持"纯文本"体验
      StarterKit.configure({
        history: false,
        // 禁用粗体、斜体等
        bold: false,
        italic: false,
        heading: false,
        // 只保留基本的文本和段落
      }),
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
      TiptapVariable, // 变量节点
    ],
    content: value || '',
    editorProps: {
      attributes: {
        class: 'plain-text-editor', // 类似原生 textarea 的样式
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.getMarkdown();
      onUpdate?.(markdown);
    },
  });

  return <EditorContent editor={editor} />;
};
```

### 方案2：Tiptap 极简配置（最小扩展）

**核心思路**：使用 Tiptap 但只加载最基础的扩展，实现接近原生 textarea 的体验。

**实现要点**：
1. 只使用 `Text`、`Paragraph`、`Doc` 等基础节点
2. 添加 `TiptapVariable` 支持变量
3. 不使用 Markdown 扩展，直接处理纯文本

**优点**：
- ✅ 最小化依赖，性能更好
- ✅ 编辑体验接近原生 textarea

**缺点**：
- ⚠️ 需要手动实现文本到节点树的转换
- ⚠️ 失去 Markdown 序列化的便利
- ⚠️ 实现复杂度较高

### 方案3：改进双层架构（不推荐）

**核心思路**：保持 textarea + 高亮层，但改进同步机制。

**缺点**：
- ❌ 无法从根本上解决双层架构的问题
- ❌ 维护成本高
- ❌ 用户体验仍有局限

## 推荐方案：方案1（Tiptap 迁移）

### 实施步骤

1. **创建新的 PlainTextEditor 实现**
   - 基于 `VisualEditor` 代码
   - 简化配置（禁用大部分格式化）
   - 保持相同的 props 接口

2. **样式适配**
   - 使用 CSS 让编辑器看起来像原生 textarea
   - 保持现有的变量样式（CATEGORY_STYLES）

3. **序列化兼容性**
   - 确保 Markdown 序列化与现有数据格式兼容
   - 变量格式保持一致：`{{variable}}`

4. **功能测试**
   - 变量点击交互
   - 文本输入和编辑
   - 变量插入（通过 `insertVariable` ref 方法）

5. **性能优化**
   - 禁用不需要的功能（history、格式化等）
   - 优化 Markdown 序列化性能

### 关键技术点

1. **TiptapVariable 已实现**：
   - 变量节点定义（`TiptapVariable.js`）
   - React 节点视图（`VariableNode.jsx`）
   - Markdown 序列化支持

2. **EditorContext 提供数据**：
   - 通过 Context 传递 `banks`、`categories`、`onVariableClick` 等
   - VariableNode 可以直接使用这些数据

3. **最小配置示例**：
   ```javascript
   StarterKit.configure({
     history: false,
     bold: false,
     italic: false,
     heading: false,
     blockquote: false,
     codeBlock: false,
     horizontalRule: false,
     // 只保留基础的 Text, Paragraph, HardBreak
   })
   ```

### 风险评估

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| **编辑体验变化** | 中 | 通过 CSS 和配置让体验接近原生 textarea |
| **性能影响** | 低 | Tiptap 性能良好，且项目已有使用经验 |
| **兼容性问题** | 中 | 保持 API 接口不变，逐步迁移 |
| **学习成本** | 低 | 代码已存在（VisualEditor），可直接参考 |

## 结论

**推荐采用方案1**：将 `PlainTextEditor` 迁移到基于 Tiptap 的实现。

**理由**：
1. ✅ 彻底解决双层架构问题
2. ✅ 代码复用性好（VisualEditor 已验证可行）
3. ✅ 变量交互体验优秀
4. ✅ 技术栈统一，易于维护
5. ✅ 项目已有 Tiptap 依赖，无额外成本

**迁移成本**：中等
- 需要重构 PlainTextEditor 组件
- 需要测试兼容性
- 可能需要调整样式

**收益**：高
- 消除所有双层架构相关问题
- 提供更好的编辑体验
- 代码更易维护和扩展
