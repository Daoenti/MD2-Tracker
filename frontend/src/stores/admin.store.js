import { defineStore } from 'pinia';
import { adminApi } from '../api/admin.js';
import { enemyTemplatesApi } from '../api/enemyTemplates.js';

export const useAdminStore = defineStore('admin', {
  state: () => ({
    users: [],
    templates: [],
    usersLoaded: false,
    templatesLoaded: false,
  }),
  actions: {
    async fetchUsers() {
      this.users = await adminApi.listUsers();
      this.usersLoaded = true;
    },
    async createUser(username, password, isAdmin) {
      const user = await adminApi.createUser(username, password, isAdmin);
      this.users.push(user);
      return user;
    },
    async patchUser(id, fields) {
      const user = await adminApi.patchUser(id, fields);
      const index = this.users.findIndex((u) => u.id === id);
      if (index !== -1) this.users[index] = user;
      return user;
    },
    async removeUser(id) {
      await adminApi.removeUser(id);
      this.users = this.users.filter((u) => u.id !== id);
    },

    async fetchTemplates() {
      this.templates = await enemyTemplatesApi.list();
      this.templatesLoaded = true;
    },
    async createTemplate(template) {
      const created = await enemyTemplatesApi.create(template);
      this.templates.push(created);
      return created;
    },
    async patchTemplate(id, fields) {
      const updated = await enemyTemplatesApi.patch(id, fields);
      const index = this.templates.findIndex((t) => t.id === id);
      if (index !== -1) this.templates[index] = updated;
      return updated;
    },
    async removeTemplate(id) {
      await enemyTemplatesApi.remove(id);
      this.templates = this.templates.filter((t) => t.id !== id);
    },
  },
});
