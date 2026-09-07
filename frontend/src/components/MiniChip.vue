<script setup>
import { computed } from 'vue';
import { healthClass } from '../utils/health.js';
import { useBoardStore } from '../stores/board.store.js';

const props = defineProps({
  unitId: { type: String, required: true },
  healthMax: { type: Number, required: true },
  wounds: { type: Number, required: true },
  isLeader: { type: Boolean, default: false },
  minionId: { type: String, default: null },
});

const board = useBoardStore();

const remaining = computed(() => Math.max(0, props.healthMax - props.wounds));
const cls = computed(() => healthClass(remaining.value, props.healthMax));

function hit() {
  if (props.isLeader) board.leaderWound(props.unitId, 1, 'wound');
  else board.minionWound(props.unitId, props.minionId, 1, 'wound');
}
function heal() {
  if (props.isLeader) board.leaderWound(props.unitId, 1, 'heal');
  else board.minionWound(props.unitId, props.minionId, 1, 'heal');
}
function remove() {
  board.removeMinion(props.unitId, props.minionId);
}
</script>

<template>
  <div class="mini" :class="{ 'mini-leader': isLeader }">
    <span v-if="isLeader" class="mini-crown" aria-hidden="true">&#9819;</span>
    <button
      type="button"
      class="mini-tap"
      :class="cls"
      :aria-label="(isLeader ? 'Leader' : 'Minion') + ' takes 1 wound'"
      @click="hit"
    >
      <span class="mini-hp">{{ remaining }}</span>
      <span class="mini-max">/ {{ healthMax }}</span>
    </button>
    <div class="mini-controls">
      <button type="button" aria-label="Heal 1" @click="heal">+</button>
      <button v-if="!isLeader" type="button" aria-label="Remove miniature" @click="remove">&times;</button>
    </div>
  </div>
</template>
