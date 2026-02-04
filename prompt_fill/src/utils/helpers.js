// 通用工具函数

// 深拷贝对象
export const deepClone = (obj) => JSON.parse(JSON.stringify(obj));

// 生成唯一键名
export const makeUniqueKey = (base, existingKeys, suffix = "custom") => {
  let candidate = `${base}_${suffix}`;
  let counter = 1;
  while (existingKeys.has(candidate)) {
    candidate = `${base}_${suffix}${counter}`;
    counter += 1;
  }
  return candidate;
};

// 获取本地化文本（obj 可为 string 或 { cn: "...", en: "..." }）
export const getLocalized = (obj, language) => {
  if (!obj) return "";
  if (typeof obj === 'string') return obj;
  const localizedValue = obj[language] ?? obj.en ?? obj.cn ?? (Object.values(obj)[0] ?? "");
  return localizedValue;
};

/**
 * 为字符串生成简单的哈希值
 */
export const hashCode = (str) => {
  let hash = 0;
  if (!str || str.length === 0) return hash.toString();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32bit integer
  }
  return hash.toString();
};


// 等待图片加载完成，避免导出时空白
export const waitForImageLoad = (img, timeout = 6000) => {
  if (!img) return Promise.resolve();
  if (img.complete && img.naturalWidth > 0) return Promise.resolve();
  return new Promise((resolve) => {
    const clear = () => {
      img.removeEventListener('load', onLoad);
      img.removeEventListener('error', onError);
      clearTimeout(timer);
    };
    const onLoad = () => { clear(); resolve(); };
    const onError = () => { clear(); resolve(); }; // 失败也放行，避免阻塞
    const timer = setTimeout(() => { clear(); resolve(); }, timeout);
    img.addEventListener('load', onLoad);
    img.addEventListener('error', onError);
  });
};
