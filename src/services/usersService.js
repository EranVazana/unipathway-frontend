import { apiClient } from './apiClient';

export const usersService = {
  getCurrentUser: () => apiClient.get('/users/me'),
  getAll: () => apiClient.get('/users'),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  updateSettings: (id, data) => apiClient.put(`/users/${id}/settings`, data),
  delete: (id) => apiClient.delete(`/users/${id}`)
};