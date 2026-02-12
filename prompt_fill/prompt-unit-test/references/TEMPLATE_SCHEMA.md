# Prompt 模板架构

本项目中的 Prompt 模板通常存储在 `src/data/templates.js`，采用以下格式：

```javascript
{
  id: "unique-id",
  title: "模板标题",
  content: "这是一段包含 {{variable}} 的 Prompt 文本",
  tags: ["标签1", "标签2"],
  // 其他元数据
}
```

测试时应确保：
1. `{{variable}}` 被正确替换。
2. 替换后的文本长度符合模型限制。
3. 关键指令（如 "Translate"）在替换后依然清晰。
