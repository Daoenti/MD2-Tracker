<script setup>
import { ref, computed } from 'vue';
import { useBoardStore } from '../stores/board.store.js';
import { healthClass } from '../utils/health.js';
import NotesBlock from './NotesBlock.vue';
import BossTrack from './BossTrack.vue';

const props = defineProps({
  unit: { type: Object, required: true },
});

const board = useBoardStore();
const dealAmount = ref(1);

const isBoss = computed(() => props.unit.kind === 'boss');
const remaining = computed(() => Math.max(0, props.unit.healthMax - props.unit.wounds));
const cls = computed(() => healthClass(remaining.value, props.unit.healthMax));
const pct = computed(() =>
  props.unit.healthMax > 0 ? Math.max(0, Math.min(100, (remaining.value / props.unit.healthMax) * 100)) : 0,
);
const dead = computed(() => remaining.value <= 0);

function removeUnit() {
  board.removeUnit(props.unit.id);
}

function onHealthMaxChange(event) {
  const value = Math.max(1, parseInt(event.target.value, 10) || 1);
  board.updateUnitFields(props.unit.id, { healthMax: value });
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
  <article class="card" :class="[`type-${unit.kind}`, { defeated: dead }]">
    <div class="card-head">
      <div class="card-title">
        <h3>{{ unit.name }}</h3>
        <div class="tag-row">
          <span class="tag" :class="unit.kind">{{ isBoss ? 'Boss' : 'Roaming' }}</span>
          <span v-if="dead" class="tag defeated-tag">Defeated</span>
        </div>
      </div>
      <button type="button" class="icon-btn danger" aria-label="Remove card" @click="removeUnit">&times;</button>
    </div>

    <p v-if="!isBoss && unit.level" class="subtext">Level {{ unit.level }}</p>

    <div class="health-edit">
      <label>Max health</label>
      <input type="number" min="1" :value="unit.healthMax" @change="onHealthMaxChange" />
    </div>

    <div class="single-health">
      <span class="stat-num" :class="cls">{{ remaining }}</span>
      <span class="stat-max">/ {{ unit.healthMax }}</span>
      <div class="bar-track"><div class="bar-fill" :class="cls" :style="{ width: pct + '%' }"></div></div>
    </div>

    <div class="deal-row">
      <input v-model.number="dealAmount" type="number" min="1" inputmode="numeric" aria-label="Wound amount" />
      <button type="button" class="btn btn-accent btn-sm" @click="wound">Wound</button>
      <button type="button" class="btn btn-ghost btn-sm" @click="heal">Heal</button>
    </div>

    <BossTrack v-if="isBoss" :unit-id="unit.id" :pos="unit.bossTrack.pos" :max="unit.bossTrack.max" />

    <NotesBlock :unit-id="unit.id" :notes="unit.notes" :show-notes="unit.showNotes" />

    <div v-if="dead" class="defeated-banner">
      <span>Defeated</span>
      <button type="button" @click="removeUnit">Remove</button>
    </div>
  </article>
</template>
