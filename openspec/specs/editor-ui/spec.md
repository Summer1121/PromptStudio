# editor-ui Specification

## Purpose
TBD - created by archiving change fix-editor-ui-issues. Update Purpose after archive.
## Requirements
### Requirement: PlainTextEditor 高亮层渲染

PlainTextEditor 的高亮层 SHALL 只显示渲染后的变量高亮效果，不显示未渲染的原始文本内容。高亮层 SHALL 保持不可见、不可交互的状态，仅用于视觉展示。

#### Scenario: 框选文本时不应看到双重文字

- **WHEN** 用户在 PlainTextEditor 中框选文本
- **THEN** 只应看到一层文字（输入层的文本），高亮层不应显示原始文本内容
- **AND THEN** 变量的高亮样式应正确显示在变量位置

### Requirement: 变量交互功能

PlainTextEditor 中的变量 SHALL 可以通过点击来打开变量选择器，用户可以选择不同的选项来替换变量值。

#### Scenario: 点击变量打开选择器

- **WHEN** 用户点击 PlainTextEditor 中渲染的变量（如 `{{variable}}`）
- **THEN** 应弹出变量选择器，显示该变量的所有可选选项
- **AND THEN** 用户可以选择一个选项来替换变量值

#### Scenario: 选择变量值后更新内容

- **WHEN** 用户在变量选择器中选择了一个选项
- **THEN** PlainTextEditor 的内容应更新，显示选中的值
- **AND THEN** 变量的选择和显示状态应正确保存

### Requirement: NotesEditor 布局位置

NotesEditor SHALL 固定在编辑栏下方，不覆盖编辑器内容。注释板块 SHALL 始终可见，默认占用合适的高度（约 200px 或根据内容自适应）。

#### Scenario: 注释板块固定在编辑栏下方

- **WHEN** 用户打开编辑器
- **THEN** NotesEditor 应显示在编辑器的底部区域
- **AND THEN** NotesEditor 不应覆盖 PlainTextEditor 的文本内容
- **AND THEN** NotesEditor 应有明确的边界和合适的默认高度

#### Scenario: 注释板块始终可见

- **WHEN** 用户浏览或编辑模板
- **THEN** NotesEditor 应始终显示，不隐藏
- **AND THEN** 注释板块应有合适的高度，既能显示内容又不过度占用空间

### Requirement: NotesEditor 展开功能

NotesEditor 的展开按钮 SHALL 能够在独立窗口或视图中展示注释内容，方便用户查看和编辑较长的注释。

#### Scenario: 点击展开按钮打开独立视图

- **WHEN** 用户点击 NotesEditor 的展开按钮
- **THEN** 应打开一个独立窗口或视图来展示注释内容
- **AND THEN** 独立视图应支持完整的编辑功能（包括工具栏按钮）
- **AND THEN** 在独立视图中编辑的内容应同步回 NotesEditor

### Requirement: NotesEditor 多语言支持

NotesEditor 中的所有用户可见文本（包括标题、按钮等）SHALL 支持多语言，默认使用中文，可通过语言设置切换到英文。

#### Scenario: 注释板块文本支持多语言

- **WHEN** 用户切换应用语言
- **THEN** NotesEditor 的标题（"注释"）应显示对应的翻译文本
- **AND THEN** 保存按钮的文字应显示对应的翻译文本（如 "保存注释"）
- **AND THEN** 所有界面文本应正确翻译

### Requirement: NotesToolbar 功能完整性

NotesToolbar 中的所有按钮 SHALL 正常工作，不会导致文本清空或功能失效。

#### Scenario: 加粗按钮正常工作

- **WHEN** 用户在 NotesEditor 中选择文本并点击加粗按钮
- **THEN** 选中的文本应变为加粗格式
- **AND THEN** 不应出现文本清空的现象

#### Scenario: 斜体按钮正常工作

- **WHEN** 用户在 NotesEditor 中选择文本并点击斜体按钮
- **THEN** 选中的文本应变为斜体格式
- **AND THEN** 不应出现文本清空的现象

#### Scenario: 图片插入功能

- **WHEN** 用户点击图片按钮
- **THEN** 应弹出输入框允许用户输入图片 URL
- **AND THEN** 输入的图片应正确插入到注释内容中
- **AND THEN** 图片应正确显示

#### Scenario: 视频插入功能

- **WHEN** 用户点击视频按钮
- **THEN** 应弹出输入框允许用户输入视频 URL
- **AND THEN** 输入的视频应正确插入到注释内容中（以 iframe 或其他适当方式）
- **AND THEN** 视频应正确显示或可播放

