// 持久化存储 Hook
import { useState, useEffect } from 'react';

export const useStickyState = (defaultValue, key) => {
  const [value, setValue] = useState(() => {
    try {
      const stickyValue = window.localStorage.getItem(key);
      return stickyValue !== null ? JSON.parse(stickyValue) : defaultValue;
    } catch (error) {
      console.error(`读取 localStorage 失败 (${key}):`, error);
      return defaultValue;
    }
  });

  useEffect(() => {
    try {
      const storageMode = window.localStorage.getItem('app_storage_mode') || 'browser';
      // 在使用本地文件夹模式时，不再写入 localStorage，避免大图触发配额弹窗
      if (storageMode === 'folder') return;

      const serialized = JSON.stringify(value);
      window.localStorage.setItem(key, serialized);
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage 存储空间已满！');
        // 仅浏览器存储模式下提示，文件夹模式直接跳过
        const storageMode = window.localStorage.getItem('app_storage_mode') || 'browser';
        if (storageMode === 'browser') {
          alert('存储空间不足！图片过大或数据过多。建议：\n1. 使用更小的图片（建议小于500KB）\n2. 删除一些不需要的模板\n3. 清理浏览器缓存');
        }
      } else {
        console.error(`保存到 localStorage 失败 (${key}):`, error);
      }
    }
  }, [key, value]);

  return [value, setValue];
};
