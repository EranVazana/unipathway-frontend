// src/services/authService.js

import { apiClient } from './apiClient';

export const authService = {
  login: (email, password) =>
    apiClient.post('/auth/login', { email, password }),

  register: (firstName, lastName, username, email, password) =>
    apiClient.post('/auth/register', { firstName, lastName, username, email, password }),

  logout: () =>
    apiClient.post('/auth/logout')
};
