import { apiClient } from './apiClient';

export const watchlistService = {
  getByUser: (userId) => apiClient.get(`/watchlist?userId=${userId}`),
  add: (userId, departmentId, status) =>
    apiClient.post('/watchlist', { userId, departmentId, status }),
  updateStatus: (watchlistId, status) =>
    apiClient.put(`/watchlist/${watchlistId}`, { status }),
  remove: (watchlistId) => apiClient.delete(`/watchlist/${watchlistId}`)
};
