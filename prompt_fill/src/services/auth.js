import { apiClient } from './api-client';

export const authService = {
    async register(username, email, password) {
        const data = await apiClient.post('/auth/register/', { username, email, password });
        return data;
    },

    async login(username, password) {
        const data = await apiClient.post('/auth/token/', { username, password });
        if (data.access) {
            localStorage.setItem('auth_token', data.access);
            localStorage.setItem('refresh_token', data.refresh);
            localStorage.setItem('user_info', JSON.stringify({ username }));
        }
        return data;
    },

    logout() {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_info');
    },

    isLoggedIn() {
        return !!localStorage.getItem('auth_token');
    },

    getUserInfo() {
        const info = localStorage.getItem('user_info');
        return info ? JSON.parse(info) : null;
    }
};
