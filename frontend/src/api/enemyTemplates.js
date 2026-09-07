import { api } from './client.js';

export const enemyTemplatesApi = {
  list: () => api.get('/enemy-templates'),
  create: (template) => api.post('/enemy-templates', template),
  patch: (id, fields) => api.patch(`/enemy-templates/${id}`, fields),
  remove: (id) => api.delete(`/enemy-templates/${id}`),
};
