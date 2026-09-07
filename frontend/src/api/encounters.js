import { api } from './client.js';

export const encountersApi = {
  list: () => api.get('/encounters'),
  create: (name) => api.post('/encounters', { name }),
  get: (id) => api.get(`/encounters/${id}`),
  patch: (id, fields) => api.patch(`/encounters/${id}`, fields),
  remove: (id) => api.delete(`/encounters/${id}`),
  addUnit: (encounterId, unit) => api.post(`/encounters/${encounterId}/units`, unit),
};
