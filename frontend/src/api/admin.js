import { api } from './client.js';

export const adminApi = {
  listUsers: () => api.get('/admin/users'),
  createUser: (username, password, isAdmin) => api.post('/admin/users', { username, password, isAdmin }),
  patchUser: (id, fields) => api.patch(`/admin/users/${id}`, fields),
  removeUser: (id) => api.delete(`/admin/users/${id}`),
};
