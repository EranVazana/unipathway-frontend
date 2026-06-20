import { apiClient } from './apiClient';

export const admissionThresholdsService = {
  getAll: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiClient.get(`/admission-thresholds${query ? `?${query}` : ''}`);
  },
  getById: (id) => apiClient.get(`/admission-thresholds/${id}`)
};
