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
        // 如果包含 uuid，则是更新现有提示词
        if (promptData.uuid) {
            return apiClient.put(`/market/prompts/${promptData.uuid}/`, promptData);
        }
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
