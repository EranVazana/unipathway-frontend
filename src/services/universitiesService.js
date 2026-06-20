import { apiClient } from './apiClient';

export const universitiesService = {
  getAll: () => apiClient.get('/universities'),
  getById: (id) => apiClient.get(`/universities/${id}`),
  create: (data) => apiClient.post('/universities', data),
  update: (id, data) => apiClient.put(`/universities/${id}`, data),
  delete: (id) => apiClient.delete(`/universities/${id}`)
};