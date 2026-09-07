import { api } from './client.js';

export const unitsApi = {
  patch: (id, fields) => api.patch(`/units/${id}`, fields),
  remove: (id) => api.delete(`/units/${id}`),
  wound: (id, amount, mode) => api.post(`/units/${id}/wound`, { amount, mode }),
  leaderWound: (id, amount, mode) => api.post(`/units/${id}/leader/wound`, { amount, mode }),
  addMinion: (id) => api.post(`/units/${id}/minions`),
  minionWound: (minionId, amount, mode) => api.post(`/minions/${minionId}/wound`, { amount, mode }),
  removeMinion: (minionId) => api.delete(`/minions/${minionId}`),
};
