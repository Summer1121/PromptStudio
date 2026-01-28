import { apiClient } from './api-client';

export const marketService = {
    async listPrompts(params = {}) {
        const query = new URLSearchParams(params).toString();
        return apiClient.get(`/market/prompts/?${query}`);
    },

    async getPromptDetail(uuid) {
        return apiClient.get(`/market/prompts/${uuid}/`);
    },

    async publishPrompt(promptData) {
        // promptData 包含 title, description, tags, content
        // 第一次发布创建，后续发布可能需要特殊处理版本（目前的后端逻辑是 CRUD）
        // 我们在发布前可以先检查敏感信息
        return apiClient.post('/market/prompts/', promptData);
    },

    async interact(promptUuid, type) {
        return apiClient.post('/market/interact/', { prompt: promptUuid, type });
    },

    async addComment(promptUuid, content, parentId = null) {
        return apiClient.post('/market/comments/', { 
            prompt: promptUuid, 
            content, 
            parent: parentId 
        });
    },

    async uploadMedia(file) {
        const formData = new FormData();
        formData.append('file', file);
        return apiClient.upload('/market/media/upload/', formData);
    }
};
