<script setup>
import { ref, computed } from 'vue';
import { useBoardStore } from '../stores/board.store.js';
import MiniChip from './MiniChip.vue';
import NotesBlock from './NotesBlock.vue';

const props = defineProps({
  unit: { type: Object, required: true },
});

const board = useBoardStore();
const dealAmount = ref(1);

const leaderDead = computed(() => props.unit.leader.wounds >= props.unit.healthMax);

function removeUnit() {
  board.removeUnit(props.unit.id);
}

function onHealthMaxChange(event) {
  const value = Math.max(1, parseInt(event.target.value, 10) || 1);
  board.updateUnitFields(props.unit.id, { healthMax: value });
}

function addMinion() {
  board.addMinion(props.unit.id);
}

function wound() {
  const amount = Math.max(0, parseInt(dealAmount.value, 10) || 0);
  if (amount <= 0) return;
  board.wound(props.unit.id, amount, 'wound');
}

function heal() {
  const amount = Math.max(0, parseInt(dealAmount.value, 10) || 0);
  if (amount <= 0) return;
  board.wound(props.unit.id, amount, 'heal');
}
</script>

<template>
  <article class="card type-mob" :class="{ defeated: leaderDead }">
    <div class="card-head">
      <div class="card-title">
        <h3>{{ unit.name }}</h3>
        <div class="tag-row">
          <span class="tag mob">Mob</span>
          <span v-if="leaderDead" class="tag defeated-tag">Defeated</span>
        </div>
      </div>
      <button type="button" class="icon-btn danger" aria-label="Remove card" @click="removeUnit">&times;</button>
    </div>

    <p class="subtext">
      <template v-if="unit.level">Lvl {{ unit.level }} · </template>
      1 Leader + {{ unit.minions.length }} Minion{{ unit.minions.length === 1 ? '' : 's' }}
    </p>

    <div class="health-edit">
      <label>Health / mini</label>
      <input type="number" min="1" :value="unit.healthMax" @change="onHealthMaxChange" />
      <button type="button" class="btn btn-ghost btn-sm" @click="addMinion">+ Minion</button>
    </div>

    <div class="deal-row">
      <input v-model.number="dealAmount" type="number" min="1" inputmode="numeric" aria-label="Wound amount" />
      <button type="button" class="btn btn-accent btn-sm" @click="wound">Wound</button>
      <button type="button" class="btn btn-ghost btn-sm" @click="heal">Heal</button>
    </div>

    <div class="mini-grid">
      <MiniChip :unit-id="unit.id" :health-max="unit.healthMax" :wounds="unit.leader.wounds" is-leader />
      <MiniChip
        v-for="m in unit.minions"
        :key="m.id"
        :unit-id="unit.id"
        :minion-id="m.id"
        :health-max="unit.healthMax"
        :wounds="m.wounds"
      />
    </div>

    <NotesBlock :unit-id="unit.id" :notes="unit.notes" :show-notes="unit.showNotes" />

    <div v-if="leaderDead" class="defeated-banner">
      <span>Mob defeated</span>
      <button type="button" @click="removeUnit">Remove</button>
    </div>
  </article>
</template>
