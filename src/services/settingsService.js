import { apiClient } from './apiClient';

export const settingsService = {
  getSettings: () => apiClient.get('/settings'),
  updateSettings: (updates) => apiClient.put('/settings', updates)
};
