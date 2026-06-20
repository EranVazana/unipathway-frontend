import { apiClient } from './apiClient';

export const authService = {
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout')
};
