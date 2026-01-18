// src/services/tauri-service.js

/**
 * 检查是否在 Tauri 环境中
 */
function isTauriAvailable() {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
}

/**
 * 生成媒体文件名
 * 格式：{templateId}_{timestamp}_{随机字符串}.{ext}
 */
function generateMediaFileName(templateId, originalPath, timestamp = Date.now()) {
  // 从原始路径提取扩展名
  const ext = originalPath.split('.').pop() || 'bin';
  // 生成随机字符串（8位）
  const randomStr = Math.random().toString(36).substring(2, 10);
  // 清理 templateId（移除特殊字符）
  const cleanTemplateId = (templateId || 'unknown').replace(/[^a-zA-Z0-9]/g, '_');
  return `${cleanTemplateId}_${timestamp}_${randomStr}.${ext}`;
}

/**
 * Reads the entire application data from the local JSON file via the Rust backend.
 * 在浏览器模式下，使用 localStorage 作为降级方案。
 * @returns {Promise<object|null>} A promise that resolves to the parsed data object, or null if not found or error.
 */
export async function readDataFile() {
  // 检查是否在 Tauri 环境中
  if (!isTauriAvailable()) {
    // 在非 Tauri 环境（如浏览器开发模式）中，使用 localStorage 作为降级方案
    try {
      const savedData = localStorage.getItem('app_data');
      if (savedData) {
        return JSON.parse(savedData);
      }
      return null;
    } catch (error) {
      console.error("Failed to read data from localStorage:", error);
      return null;
    }
  }

  try {
    // 动态导入 invoke，只在 Tauri 环境中使用
    const { invoke } = await import('@tauri-apps/api/core');
    // This will call the 'read_data' command in the Rust backend
    const dataString = await invoke('read_data');
    return JSON.parse(dataString);
  } catch (error) {
    console.error("Failed to read data file via Tauri:", error);
    // Return a default structure if the file doesn't exist or is corrupted
    return null;
  }
}

/**
 * Writes the entire application data to the local JSON file via the Rust backend.
 * 在浏览器模式下，使用 localStorage 作为降级方案。
 * @param {object} data - The complete data object to be saved.
 * @returns {Promise<void>}
 */
export async function writeDataFile(data) {
  // 检查是否在 Tauri 环境中
  if (!isTauriAvailable()) {
    // 在非 Tauri 环境中，使用 localStorage 作为降级方案
    try {
      const dataString = JSON.stringify(data, null, 2);
      localStorage.setItem('app_data', dataString);
      console.log('Data saved to localStorage (browser mode)');
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        console.error('LocalStorage quota exceeded. Data not saved.');
      } else {
        console.error("Failed to write data to localStorage:", error);
      }
    }
    return;
  }

  try {
    // 动态导入 invoke，只在 Tauri 环境中使用
    const { invoke } = await import('@tauri-apps/api/core');
    // This will call the 'write_data' command in the Rust backend
    await invoke('write_data', { data: JSON.stringify(data, null, 2) });
    console.log('Data saved via Tauri');
  } catch (error) {
    console.error("Failed to write data file via Tauri:", error);
  }
}

/**
 * 保存媒体文件到应用数据目录的 media 子目录
 * @param {string|File|Blob} fileSource - 源文件路径（Tauri 环境）或 File/Blob 对象
 * @param {string} templateId - 模板 ID，用于生成文件名
 * @returns {Promise<string>} 返回媒体文件引用路径（media://filename）
 */
export async function saveMediaFile(fileSource, templateId) {
  // 浏览器模式：使用 Blob URL（临时方案，仅用于开发/测试）
  if (!isTauriAvailable()) {
    // 浏览器模式下，无法访问文件系统，使用 Blob URL 作为临时方案
    // 这些 URL 仅在当前会话有效，页面刷新后会丢失
    if (fileSource instanceof File || fileSource instanceof Blob) {
      // 生成一个临时文件名，存储在 sessionStorage 中
      const fileName = generateMediaFileName(templateId, fileSource.name || 'file');
      const blobUrl = URL.createObjectURL(fileSource);
      // 临时存储 Blob URL 映射（仅用于当前会话）
      const mediaMap = JSON.parse(sessionStorage.getItem('media_blob_map') || '{}');
      mediaMap[`media://${fileName}`] = blobUrl;
      sessionStorage.setItem('media_blob_map', JSON.stringify(mediaMap));
      // 浏览器模式下不输出警告，这是预期的降级行为
      return `media://${fileName}`;
    }
    console.warn('Browser mode: fileSource must be a File or Blob object');
    return '';
  }

  try {
    // 动态导入 Tauri FS 插件（如果可用）
    let readFile, writeFile, BaseDirectory, exists, createDir;
    let appDataDir, join;
    
    try {
      const fsPlugin = await import('@tauri-apps/plugin-fs');
      readFile = fsPlugin.readFile;
      writeFile = fsPlugin.writeFile;
      BaseDirectory = fsPlugin.BaseDirectory;
      exists = fsPlugin.exists;
      createDir = fsPlugin.createDir;
      
      const pathPlugin = await import('@tauri-apps/api/path');
      appDataDir = pathPlugin.appDataDir;
      join = pathPlugin.join;
    } catch (importError) {
      console.warn('Tauri FS plugin not available, using invoke fallback:', importError);
      // 如果插件不可用，使用 invoke 调用 Rust 后端命令（需要后端支持）
      throw new Error('FS plugin not available. Please ensure @tauri-apps/plugin-fs is installed.');
    }
    
    // 生成文件名
    const originalPath = typeof fileSource === 'string' ? fileSource : (fileSource.name || 'file');
    const fileName = generateMediaFileName(templateId, originalPath);
    
    // 确保 media 目录存在
    const mediaDirPath = `media/${fileName.split('/')[0]}`;
    const mediaFileExists = await exists('media', { baseDir: BaseDirectory.AppData, recursive: false });
    if (!mediaFileExists) {
      await createDir('media', { baseDir: BaseDirectory.AppData, recursive: true });
    }
    
    // 读取源文件
    let fileData;
    if (typeof fileSource === 'string') {
      // 文件路径（Tauri 环境）- 使用 fetch 读取，因为 readFile 需要特定的路径格式
      try {
        const response = await fetch(`file://${fileSource}`);
        if (!response.ok) {
          throw new Error('Failed to read file');
        }
        const blob = await response.blob();
        const arrayBuffer = await blob.arrayBuffer();
        fileData = new Uint8Array(arrayBuffer);
      } catch (fetchError) {
        // 如果 fetch 失败，尝试使用 readFile（需要绝对路径）
        console.warn('Fetch failed, trying readFile:', fetchError);
        fileData = await readFile(fileSource);
      }
    } else if (fileSource instanceof File || fileSource instanceof Blob) {
      // File/Blob 对象
      const arrayBuffer = await fileSource.arrayBuffer();
      fileData = new Uint8Array(arrayBuffer);
    } else {
      throw new Error('Invalid file source type');
    }
    
    // 写入到 media 目录
    const targetPath = `media/${fileName}`;
    console.log('Writing file to:', targetPath, 'File size:', fileData.length, 'bytes');
    await writeFile(targetPath, fileData, {
      baseDir: BaseDirectory.AppData
    });
    console.log('File written successfully');
    
    // 验证文件是否存在
    const fileExists = await exists(targetPath, { baseDir: BaseDirectory.AppData });
    console.log('File exists after write:', fileExists);
    
    // 返回媒体文件引用路径
    const mediaPath = `media://${fileName}`;
    console.log('Returning media path:', mediaPath);
    return mediaPath;
  } catch (error) {
    console.error('Failed to save media file:', error);
    throw error;
  }
}

/**
 * 将 URL 转换回 media:// 路径引用（用于保存时）
 * @param {string} url - 可访问的文件 URL（file:// 或 blob://）
 * @returns {string} media:// 路径引用，如果无法识别则返回原值
 */
export function convertUrlToMediaPath(url) {
  if (!url || typeof url !== 'string') return url;
  
  // 如果是 media:// 格式，直接返回
  if (url.startsWith('media://')) {
    return url;
  }
  
  // 尝试从 file:// URL 中提取文件名
  // file:// URL 格式：file:///path/to/app_data/media/filename.ext
  const fileUrlMatch = url.match(/media[\\\/]([^"'>\s]+)/);
  if (fileUrlMatch) {
    const fileName = fileUrlMatch[1];
    return `media://${fileName}`;
  }
  
  // 如果是 blob:// URL，尝试从 sessionStorage 中查找对应的 media:// 路径
  if (url.startsWith('blob:')) {
    try {
      const mediaMap = JSON.parse(sessionStorage.getItem('media_blob_map') || '{}');
      for (const [mediaPath, blobUrl] of Object.entries(mediaMap)) {
        if (blobUrl === url) {
          return mediaPath;
        }
      }
    } catch (error) {
      // 忽略错误
    }
  }
  
  // 如果无法转换，返回原值（可能是其他类型的 URL）
  return url;
}

/**
 * 将 HTML 中的所有媒体 URL 转换回 media:// 路径引用
 * @param {string} html - HTML 内容
 * @returns {string} 转换后的 HTML
 */
export function convertMediaUrlsToPathsInHtml(html) {
  if (!html || typeof html !== 'string') return html;
  
  // 查找所有 src 属性，并尝试转换
  return html.replace(/src=["']([^"']+)["']/g, (match, url) => {
    const mediaPath = convertUrlToMediaPath(url);
    return `src="${mediaPath}"`;
  });
}

/**
 * 将媒体文件引用路径转换为可访问的 URL
 * @param {string} mediaPath - 媒体文件引用路径（media://filename）
 * @returns {Promise<string>} 可访问的文件 URL
 */
export async function getMediaUrl(mediaPath) {
  console.log('getMediaUrl called with:', mediaPath);
  if (!mediaPath || !mediaPath.startsWith('media://')) {
    console.log('Not a media:// path, returning as-is');
    return mediaPath; // 如果不是 media:// 格式，直接返回
  }

  const fileName = mediaPath.replace('media://', '');
  console.log('Extracted filename:', fileName);
  
  // 浏览器模式：从 sessionStorage 获取 Blob URL
  if (!isTauriAvailable()) {
    console.log('Browser mode: looking up Blob URL');
    try {
      const mediaMap = JSON.parse(sessionStorage.getItem('media_blob_map') || '{}');
      const blobUrl = mediaMap[mediaPath];
      if (blobUrl) {
        console.log('Found Blob URL:', blobUrl);
        return blobUrl;
      }
      console.warn('Blob URL not found in sessionStorage for:', mediaPath);
    } catch (error) {
      console.warn('Failed to get media URL from sessionStorage:', error);
    }
    return ''; // 或返回占位符 URL
  }

  try {
    console.log('Tauri mode: converting path to URL');
    // 使用 Tauri FS API 转换路径
    const { appDataDir, join } = await import('@tauri-apps/api/path');
    const { convertFileSrc } = await import('@tauri-apps/api/core');
    
    const appDataDirPath = await appDataDir();
    console.log('App data dir:', appDataDirPath);
    const mediaDir = await join(appDataDirPath, 'media');
    const filePath = await join(mediaDir, fileName);
    console.log('Full file path:', filePath);
    
    // 使用 convertFileSrc 将文件路径转换为可访问的 URL
    const url = convertFileSrc(filePath);
    console.log('Converted URL:', url);
    return url;
  } catch (error) {
    console.error('Failed to get media URL:', error);
    console.error('Error details:', error.message, error.stack);
    // 降级：尝试使用 file:// 协议
    try {
      const { appDataDir, join } = await import('@tauri-apps/api/path');
      const appDataDirPath = await appDataDir();
      const mediaDir = await join(appDataDirPath, 'media');
      const filePath = await join(mediaDir, fileName);
      const normalizedPath = filePath.replace(/\\/g, '/');
      const fallbackUrl = `file:///${normalizedPath}`;
      console.log('Using fallback URL:', fallbackUrl);
      return fallbackUrl;
    } catch (fallbackError) {
      console.error('Fallback media URL conversion failed:', fallbackError);
      return '';
    }
  }
}
