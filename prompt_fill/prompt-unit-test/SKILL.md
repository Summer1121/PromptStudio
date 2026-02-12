---
name: prompt-unit-test
description: 用于为 Prompt 模板编写和运行单元测试。当用户需要验证 Prompt 的输出稳定性、对比不同版本 Prompt 效果或为现有模板增加测试用例时使用。
---

# Prompt 单元测试技能

此技能旨在帮助开发者确保 Prompt 模板在迭代过程中的质量。

## 核心流程

1. **识别模板**：查找项目中的 Prompt 模板（通常在 `src/data/templates.js`）。
2. **定义预期**：为模板的每个变量提供输入值，并定义预期的输出关键词或格式。
3. **执行验证**：
    - 生成测试脚本。
    - 使用模拟数据填充模板。
    - 检查输出是否满足预设条件。

## 常用指令

- "为模板 'Translate' 编写三个单元测试用例"
- "验证当前的 Prompt 模板是否能够正确处理包含特殊字符的输入"

## 资源引用

- 参考 [TEMPLATE_SCHEMA.md](references/TEMPLATE_SCHEMA.md) 了解本项目模板的 JSON 结构。