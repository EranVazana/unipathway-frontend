import { apiClient } from './apiClient';

export const departmentsService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/departments${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiClient.get(`/departments/${id}`),
  create: (data) => apiClient.post('/departments', data),
  update: (id, data) => apiClient.put(`/departments/${id}`, data),
  delete: (id) => apiClient.delete(`/departments/${id}`)
};