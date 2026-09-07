import { defineStore } from 'pinia';
import { encountersApi } from '../api/encounters.js';
import { unitsApi } from '../api/units.js';

const KIND_ORDER = { boss: 0, roaming: 1, mob: 2 };

export const useBoardStore = defineStore('board', {
  state: () => ({
    encounter: null,
    units: [],
    loading: false,
  }),
  getters: {
    orderedUnits: (state) => [...state.units].sort((a, b) => KIND_ORDER[a.kind] - KIND_ORDER[b.kind]),
  },
  actions: {
    async load(id) {
      this.loading = true;
      try {
        const data = await encountersApi.get(id);
        const { units, ...encounter } = data;
        this.encounter = encounter;
        this.units = units;
      } finally {
        this.loading = false;
      }
    },

    findUnit(unitId) {
      return this.units.find((u) => u.id === unitId) || null;
    },

    replaceUnit(updated) {
      const index = this.units.findIndex((u) => u.id === updated.id);
      if (index !== -1) this.units[index] = updated;
    },

    // ---- hero count / darkness: client-owned state, persisted via PATCH ----
    async setHeroCount(delta) {
      const next = Math.max(1, Math.min(6, this.encounter.heroCount + delta));
      if (next === this.encounter.heroCount) return;
      this.encounter.heroCount = next;
      await encountersApi.patch(this.encounter.id, { heroCount: next });
    },

    async moveDarkness(delta) {
      const d = { ...this.encounter.darkness };
      const max = d.side === 'A' ? 9 : 4;
      d.pos += delta;
      if (d.pos > max) {
        if (d.side === 'A') {
          d.side = 'B';
          d.pos = 1;
        } else {
          d.pos = 1;
        }
      }
      if (d.pos < 1) d.pos = 1;
      this.encounter.darkness = d;
      await encountersApi.patch(this.encounter.id, { darknessSide: d.side, darknessPos: d.pos });
    },

    async setDarknessPos(pos) {
      this.encounter.darkness = { ...this.encounter.darkness, pos };
      await encountersApi.patch(this.encounter.id, { darknessPos: pos });
    },

    async flipSide() {
      this.encounter.darkness = { side: 'B', pos: 1 };
      await encountersApi.patch(this.encounter.id, { darknessSide: 'B', darknessPos: 1 });
    },

    // ---- units ----
    async addUnit(payload) {
      const unit = await encountersApi.addUnit(this.encounter.id, payload);
      this.units.push(unit);
      return unit;
    },

    async removeUnit(unitId) {
      await unitsApi.remove(unitId);
      this.units = this.units.filter((u) => u.id !== unitId);
    },

    async updateUnitFields(unitId, fields) {
      const updated = await unitsApi.patch(unitId, fields);
      this.replaceUnit(updated);
    },

    async toggleNotes(unitId) {
      const unit = this.findUnit(unitId);
      if (!unit) return;
      await this.updateUnitFields(unitId, { showNotes: !unit.showNotes });
    },

    async wound(unitId, amount, mode) {
      const updated = await unitsApi.wound(unitId, amount, mode);
      this.replaceUnit(updated);
    },

    async leaderWound(unitId, amount, mode) {
      const updated = await unitsApi.leaderWound(unitId, amount, mode);
      this.replaceUnit(updated);
    },

    async addMinion(unitId) {
      const updated = await unitsApi.addMinion(unitId);
      this.replaceUnit(updated);
    },

    async minionWound(unitId, minionId, amount, mode) {
      const { wounds } = await unitsApi.minionWound(minionId, amount, mode);
      const unit = this.findUnit(unitId);
      if (!unit) return;
      const minion = unit.minions.find((m) => m.id === minionId);
      if (minion) minion.wounds = wounds;
    },

    async removeMinion(unitId, minionId) {
      await unitsApi.removeMinion(minionId);
      const unit = this.findUnit(unitId);
      if (!unit) return;
      unit.minions = unit.minions.filter((m) => m.id !== minionId);
    },
  },
});
