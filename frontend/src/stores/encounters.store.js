import { defineStore } from 'pinia';
import { encountersApi } from '../api/encounters.js';

export const useEncountersStore = defineStore('encounters', {
  state: () => ({
    list: [],
    loaded: false,
  }),
  actions: {
    async fetchList() {
      this.list = await encountersApi.list();
      this.loaded = true;
    },
    async create(name) {
      const encounter = await encountersApi.create(name);
      this.list.push(encounter);
      return encounter;
    },
    async remove(id) {
      await encountersApi.remove(id);
      this.list = this.list.filter((e) => e.id !== id);
    },
  },
});
