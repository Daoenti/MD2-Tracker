import { api } from './client.js';

export const authApi = {
  me: () => api.get('/auth/me'),
  login: (username, password) => api.post('/auth/login', { username, password }),
  register: (username, password) => api.post('/auth/register', { username, password }),
  logout: () => api.post('/auth/logout'),
};
