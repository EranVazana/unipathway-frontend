import { apiClient } from './apiClient';

export const academicScoresService = {
  getByUser: (userId) => apiClient.get(`/academic-scores?userId=${userId}`),
  update: (academicScoresId, payload) => apiClient.put(`/academic-scores/${academicScoresId}`, payload)
};