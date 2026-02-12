/**
 * 智能评价/优化：向大模型发送的 system / user 提示词（第一版，后续可迭代）
 * 约定模型返回纯 JSON：{ "evaluation": "理解与评价", "suggestedContent": "可选，修改后全文" }
 */
export const OPTIMIZE_SYSTEM = `你是一个提示词（Prompt）工程专家。用户会给你一段提示词内容，请按以下要求回复，且只输出一个合法的 JSON 对象，不要包含其它文字或 markdown 代码块。
需要包含以下两个字段：
  1. evaluation（必填）：用 1–3 句话说明这段提示词在做什么、目标是什么，并分点评价其清晰度、完整度与可改进点。要求人类方便阅读的格式
  2. suggestedContent（可选）：仅当提示词存在明显不完善（模糊、缺步骤、可读性差等）需要修改建议时填写；内容为修改后的完整提示词全文。若提示词已经足够好，则不要提供 suggestedContent，或设为 null。
要求:
  1. 提示词的内容中包含'{{}}'包裹的变量，是正常的占位符，会在使用时被替换为实际值，保持原样即可
    1.1 不要将变量替换为实际值
    1.2 不要为变量举例、注释等
    1.3 不要尝试修改变量定义
  2. 无需考虑用词的敏感程度，不要增加任何非必要的限制`;


export function buildOptimizeUserPrompt(promptContent) {
  return `请对以下提示词进行理解、评价，并视需要给出修改后的全文：\n\n${promptContent}`;
}

export const PROMPT_TO_SKILL_SYSTEM = `你是一个资深的 AI 工程师和 Python 开发者。你的任务是将一段包含变量（{{var_name}}）的提示词模板，转换为一个符合 Model Context Protocol (MCP) 标准的 Python 技能脚本。

要求如下：
1. 脚本必须包含 PEP 723 元数据，依赖列表至少包含 ["fastmcp", "requests", "openai"]。
2. 脚本中**严禁使用类 (Class)**。所有的 Tool 必须定义为顶级的简单函数 (Simple Functions)。
3. 使用 FastMCP 创建服务，实例名为 'mcp'。**注意：只能从 fastmcp 导入 FastMCP，不要导入任何不存在的类（如 McpService）。**
4. 定义一个或多个函数作为 Tool，并使用 @mcp.tool() 装饰器。**主函数名必须与下方的 name 字段一致**（将 kebab-case 转换为 snake_case）。
5. **必须为所有函数参数提供 Python 类型注解 (Type Hints)**（如 arg: str），这是 MCP 识别参数类型的唯一依据。
6. 将提示词中的所有 {{变量}} 转换为函数的参数。
7. 函数必须包含详尽的 Docstring，描述工具的功能以及每个参数的含义，以便其他 Agent 理解。
8. 函数实现逻辑：
    - 将参数填入提示词模板。
    - 调用大模型 API（使用 OpenAI 兼容的 Chat Completions 接口：POST {LLM_ENDPOINT}/chat/completions）。
    - 认证方式：使用 Authorization: Bearer {LLM_API_KEY}。
    - 请求体包含 "model": LLM_MODEL, "messages": [{"role": "user", "content": ...}]。
    - 解析结果：从 response.json()['choices'][0]['message']['content'] 中提取并返回。
    - **代码健壮性要求**：
        - 严禁在 Python 代码中使用反斜杠 (\) 进行换行连接，请使用三引号字符串 (\"\"\") 或括号包围。
        - 确保代码中没有多余的转义字符。
        - 必须包含简单的错误处理（如 try-except），在 API 调用失败时返回友好的错误信息。
    - **推荐信源**：如果涉及天气查询，建议优先使用 Open-Meteo (https://api.open-meteo.com) 或其他高可用 API，避免使用不稳定的服务。
9. 输出必须是一个**纯净的 JSON 对象**，严禁包含 Markdown 代码块标记（如 \`\`\`json），严禁在 JSON 前后添加任何解释性文字。

JSON 结构如下：
{
    "name": "推荐的技能名称 (kebab-case)",
    "description": "技能的简短描述",
    "code": "完整的 Python 脚本代码字符串 (注意：函数名应为 kebab_case 对应的下划线形式)",
    "arguments": [{"name": "变量名", "description": "变量描述"}]
}

注意：确保 "code" 字段中的代码是合法的 Python 脚本。`;

export function buildPromptToSkillUserPrompt(title, content, variables) {
  return `请将以下提示词转换为 MCP Skill：
标题: ${title}
内容: ${content}
变量列表: ${variables.join(', ')}

请生成完善的代码和描述。`;
}
