import { defineStore } from 'pinia';
import { authApi } from '../api/auth.js';
import { setUnauthorizedHandler } from '../api/client.js';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    hydrated: false,
  }),
  getters: {
    isAuthenticated: (state) => !!state.user,
  },
  actions: {
    async hydrate() {
      setUnauthorizedHandler(() => {
        this.user = null;
      });
      try {
        this.user = await authApi.me();
      } catch {
        this.user = null;
      } finally {
        this.hydrated = true;
      }
    },
    async login(username, password) {
      this.user = await authApi.login(username, password);
    },
    async register(username, password) {
      this.user = await authApi.register(username, password);
    },
    async logout() {
      await authApi.logout();
      this.user = null;
    },
    async changePassword(currentPassword, newPassword) {
      await authApi.changePassword(currentPassword, newPassword);
    },
  },
});
