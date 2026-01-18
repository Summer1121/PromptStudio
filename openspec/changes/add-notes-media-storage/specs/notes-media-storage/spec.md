# Spec: 注释媒体文件存储

## ADDED Requirements

### Requirement: 媒体文件存储到应用目录

系统 SHALL 将注释中的图片和视频文件保存到应用数据目录的 `media/` 子目录中，而不是使用 base64 编码嵌入到数据文件中。

#### Scenario: 用户插入图片到注释

**GIVEN** 用户在注释编辑器中点击图片插入按钮
**WHEN** 用户选择了一个图片文件
**THEN** 系统 SHALL 将图片文件保存到 `{app_data_dir}/media/{templateId}_{timestamp}_{hash}.{ext}`
**AND THEN** 系统 SHALL 在注释 HTML 中插入 `<img src="media://{filename}">` 标签
**AND THEN** 系统 SHALL 在编辑器中显示该图片

#### Scenario: 用户插入视频到注释

**GIVEN** 用户在注释编辑器中点击视频插入按钮
**WHEN** 用户选择了一个视频文件
**THEN** 系统 SHALL 将视频文件保存到 `{app_data_dir}/media/{templateId}_{timestamp}_{hash}.{ext}`
**AND THEN** 系统 SHALL 在注释 HTML 中插入 `<video src="media://{filename}">` 标签
**AND THEN** 系统 SHALL 在编辑器中显示该视频

### Requirement: 支持剪切板粘贴媒体文件

系统 SHALL 支持用户从剪切板直接粘贴图片和视频到注释编辑器。

#### Scenario: 用户从剪切板粘贴图片

**GIVEN** 用户复制了一张图片到剪切板（例如从截图工具或图片编辑器）
**WHEN** 用户在注释编辑器中按下 Ctrl+V（或 Cmd+V）
**THEN** 系统 SHALL 检测剪切板中的图片数据
**AND THEN** 系统 SHALL 将图片保存到媒体目录
**AND THEN** 系统 SHALL 在光标位置插入图片引用

#### Scenario: 用户从剪切板粘贴视频

**GIVEN** 用户复制了一个视频到剪切板
**WHEN** 用户在注释编辑器中按下 Ctrl+V（或 Cmd+V）
**THEN** 系统 SHALL 检测剪切板中的视频数据
**AND THEN** 系统 SHALL 将视频保存到媒体目录
**AND THEN** 系统 SHALL 在光标位置插入视频引用

### Requirement: 使用路径引用而非 base64

系统 SHALL 在注释的 HTML 内容中使用媒体文件的路径引用，而不是 base64 编码。

#### Scenario: 保存注释时使用路径引用

**GIVEN** 注释编辑器中包含图片和视频
**WHEN** 用户点击保存按钮
**THEN** 系统 SHALL 提取 HTML 中的所有媒体文件路径
**AND THEN** 系统 SHALL 将路径引用（`media://{filename}`）保存到模板的 `notes` 字段
**AND THEN** 系统 SHALL 不保存 base64 编码的媒体数据

#### Scenario: 加载注释时转换路径为可访问 URL

**GIVEN** 模板的注释中包含媒体文件路径引用
**WHEN** 系统加载注释内容到编辑器
**THEN** 系统 SHALL 将 `media://{filename}` 转换为可访问的文件 URL
**AND THEN** 系统 SHALL 在编辑器中正确显示图片和视频

### Requirement: 切换模板时正确加载注释

系统 SHALL 在用户切换提示词模板时，正确加载并显示对应模板的注释内容。

#### Scenario: 切换模板加载注释

**GIVEN** 用户当前正在编辑模板 A 的注释
**WHEN** 用户在左侧模板列表中选择模板 B
**THEN** 系统 SHALL 立即加载模板 B 的注释内容
**AND THEN** 系统 SHALL 在注释编辑器中显示模板 B 的注释
**AND THEN** 系统 SHALL 正确显示模板 B 注释中的图片和视频

#### Scenario: 切换回之前的模板

**GIVEN** 用户从模板 A 切换到模板 B，然后切换回模板 A
**WHEN** 用户选择模板 A
**THEN** 系统 SHALL 加载模板 A 之前保存的注释内容
**AND THEN** 系统 SHALL 恢复用户之前在模板 A 中的编辑状态（如果未保存则丢失）

## MODIFIED Requirements

### Requirement: 注释编辑器支持媒体文件显示

注释编辑器 SHALL 支持显示图片和视频，使用文件路径引用而非 base64 编码。

#### Scenario: 显示存储的媒体文件

**GIVEN** 注释中包含 `<img src="media://filename.jpg">` 或 `<video src="media://filename.mp4">`
**WHEN** 注释编辑器加载该内容
**THEN** 系统 SHALL 将 `media://` 协议转换为实际的文件路径
**AND THEN** 系统 SHALL 在编辑器中正确渲染图片或视频
**AND THEN** 系统 SHALL 处理文件不存在的情况（显示占位符或错误提示）
