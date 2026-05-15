import apiClient from './axios';

export interface User {
  email: string;
  role: 'NATIONAL_PORTAL' | 'LOCAL_STRUCTURE';
  structureName: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (credentials: { email: string; password: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('nc_token', response.data.token);
      localStorage.setItem('nc_user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  register: async (data: { email: string; password: string; role: string; structureName: string }) => {
    const response = await apiClient.post<AuthResponse>('/auth/register', data);
    return response.data;
  },

  logout: () => {
    localStorage.removeItem('nc_token');
    localStorage.removeItem('nc_user');
  },

  getCurrentUser: (): User | null => {
    const userStr = localStorage.getItem('nc_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  getToken: () => {
    return localStorage.getItem('nc_token');
  }
};
