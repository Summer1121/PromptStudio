/**
 * 社区 API 客户端的基础封装
 */

const BASE_URL = 'http://localhost:8000/api'; // 后端 Django 默认地址

async function request(path, options = {}) {
    const token = localStorage.getItem('auth_token');
    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    const url = `${BASE_URL}${path}`;
    const response = await fetch(url, {
        ...options,
        headers,
    });

    if (response.status === 401) {
        // Token 过期，可能需要处理刷新逻辑或强制登出
        localStorage.removeItem('auth_token');
        // window.location.reload(); // 或者显示登录弹窗
    }

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || errorData.error || `请求失败: ${response.status}`);
    }

    return response.json();
}

export const apiClient = {
    get: (path, options) => request(path, { ...options, method: 'GET' }),
    post: (path, body, options) => request(path, { ...options, method: 'POST', body: JSON.stringify(body) }),
    put: (path, body, options) => request(path, { ...options, method: 'PUT', body: JSON.stringify(body) }),
    delete: (path, options) => request(path, { ...options, method: 'DELETE' }),
    
    // 特殊处理文件上传
    upload: async (path, formData) => {
        const token = localStorage.getItem('auth_token');
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        const response = await fetch(`${BASE_URL}${path}`, {
            method: 'POST',
            headers,
            body: formData
        });
        
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.detail || errorData.error || `上传失败: ${response.status}`);
        }
        
        return response.json();
    }
};
