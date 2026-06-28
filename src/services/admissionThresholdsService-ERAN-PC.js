import { apiClient } from './apiClient';

export const admissionThresholdsService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/admission-thresholds${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiClient.get(`/admission-thresholds/${id}`),
  create: (data) => apiClient.post('/admission-thresholds', data),
  update: (id, data) => apiClient.put(`/admission-thresholds/${id}`, data),
  delete: (id) => apiClient.delete(`/admission-thresholds/${id}`),
};