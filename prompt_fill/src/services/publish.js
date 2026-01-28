import { marketService } from './market';

/**
 * 发布提示词的工作流服务
 */
export const publishService = {
    /**
     * 检测提示词内容中是否包含敏感信息 (API Keys)
     */
    detectSensitiveInfo(content) {
        // 匹配常见的 API Key 格式，如 sk-..., AIza... 等
        const patterns = [
            /sk-[a-zA-Z0-9]{32,}/g, // OpenAI
            /AIza[0-9A-Za-z-_]{35}/g, // Google
            /[0-9a-f]{32}/g, // Generic hex keys
        ];

        let found = [];
        patterns.forEach(p => {
            const matches = content.match(p);
            if (matches) found.push(...matches);
        });

        return found;
    },

    /**
     * 处理发布流程
     */
    async publish(promptData, onSensitiveFound) {
        const sensitive = this.detectSensitiveInfo(promptData.content);
        
        if (sensitive.length > 0 && onSensitiveFound) {
            const proceed = await onSensitiveFound(sensitive);
            if (!proceed) return null;
        }

        // 处理内容中的图片：扫描 base64 并上传
        // 这一步较为复杂，MVP 阶段我们假设用户已经手动处理或我们只处理文本
        // 如果要处理图片，我们需要解析 HTML，找到 img 标签，提取 base64
        
        return marketService.publishPrompt(promptData);
    }
};
