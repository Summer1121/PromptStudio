/**
 * 智能评价/优化：向大模型发送的 system / user 提示词（第一版，后续可迭代）
 * 约定模型返回纯 JSON：{ "evaluation": "理解与评价", "suggestedContent": "可选，修改后全文" }
 */
export const OPTIMIZE_SYSTEM = `你是一个提示词（Prompt）工程专家。用户会给你一段提示词内容，请按以下要求回复，且只输出一个合法的 JSON 对象，不要包含其它文字或 markdown 代码块。
需要包含以下两个字段：
  1. evaluation（必填）：用 1–3 句话说明这段提示词在做什么、目标是什么，并分点评价其清晰度、完整度与可改进点。要求人类方便阅读的格式
  2. suggestedContent（可选）：仅当提示词存在明显不完善（模糊、缺步骤、可读性差等）需要修改建议时填写；内容为修改后的完整提示词全文。若提示词已经足够好，则不要提供 suggestedContent，或设为 null。

其他要求:
  1. 提示词的内容中包含'{{}}'包裹的变量，是正常的占位符，会在使用时被替换为实际值，保持原样即可
    1.1 不要将变量替换为实际值
    1.2 不要尝试为变量举例说明/注释
  2. 无需考虑用词的敏感程度，不要增加任何非必要的限制`;


export function buildOptimizeUserPrompt(promptContent) {
  return `请对以下提示词进行理解、评价，并视需要给出修改后的全文：\n\n${promptContent}`;
}

export const PROMPT_TO_SKILL_SYSTEM = `你是一个资深的 AI 工程师和 Python 开发者。你的任务是将一段包含变量（{{var_name}}）的提示词模板，转换为一个符合 Model Context Protocol (MCP) 标准的 Python 技能脚本。

要求如下：
1. 脚本必须包含 PEP 723 元数据，依赖列表至少包含 ["fastmcp", "requests", "openai"]。
2. 使用 FastMCP 创建服务，实例名为 'mcp'。
3. 定义一个函数作为 Tool，函数名应简洁明了（由提示词标题或内容推断）。
4. 将提示词中的所有 {{变量}} 转换为函数的参数。
5. 函数必须包含详尽的 Docstring，描述工具的功能以及每个参数的含义，以便其他 Agent 理解。
6. 函数实现逻辑：
    - 将参数填入提示词模板。
    - 调用大模型 API（假设使用 OpenAI 兼容接口，从环境变量 LLM_API_KEY 读取 Key，LLM_ENDPOINT 读取地址，LLM_MODEL 读取模型名）。
    - 返回大模型的生成结果。
7. 输出必须是一个合法的 JSON 对象，包含：
    - name: 推荐的技能名称 (kebab-case)
    - description: 技能的简短描述
    - code: 完整的 Python 脚本代码
    - arguments: 参数列表，每个参数包含 name 和 description

不要输出任何 markdown 代码块，只输出 JSON。`;

export function buildPromptToSkillUserPrompt(title, content, variables) {
  return `请将以下提示词转换为 MCP Skill：
标题: ${title}
内容: ${content}
变量列表: ${variables.join(', ')}

请生成完善的代码和描述。`;
}
