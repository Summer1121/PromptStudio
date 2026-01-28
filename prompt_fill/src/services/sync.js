import { readDataFile, writeDataFile } from './tauri-service';
import { apiClient } from './api-client';

/**
 * 云端同步服务
 */
export const syncService = {
    /**
     * 执行云端备份：上传本地所有数据
     */
    async backup() {
        const localData = await readDataFile();
        if (!localData) throw new Error("无法读取本地数据");

        // 也可以在这里处理多媒体文件的同步（如果需要的话）
        // 目前简单处理，只上传 JSON
        return apiClient.post('/market/backup/', localData);
    },

    /**
     * 从云端恢复：下载并覆盖本地数据
     */
    async restore() {
        const cloudData = await apiClient.get('/market/backup/');
        if (cloudData) {
            await writeDataFile(cloudData);
            return cloudData;
        }
        return null;
    }
};
