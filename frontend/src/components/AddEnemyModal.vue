<script setup>
import { ref, computed, watch } from 'vue';
import { useBoardStore } from '../stores/board.store.js';
import { namesForKind } from '../constants/enemyNames.js';

const emit = defineEmits(['close']);
const board = useBoardStore();

const LEVELS = ['1-2', '3-4', '5', '6-7', '8-9', '10'];

const type = ref('mob');
const name = ref('');
const level = ref('1-2');
const healthMob = ref(4);
const minionCount = ref(board.encounter.heroCount);
const healthSingle = ref(10);
const bossTrackMax = ref(8);

const names = computed(() => namesForKind(type.value));

watch(type, (next) => {
  name.value = '';
  healthSingle.value = next === 'boss' ? 20 : 10;
});

function close() {
  emit('close');
}

async function onSubmit() {
  const trimmed = name.value.trim();
  if (!trimmed) return;

  const payload = { kind: type.value, name: trimmed };

  if (type.value === 'mob') {
    payload.level = level.value;
    payload.healthMax = Math.max(1, parseInt(healthMob.value, 10) || 1);
    payload.minionCount = Math.max(0, parseInt(minionCount.value, 10) || 0);
  } else if (type.value === 'roaming') {
    payload.level = level.value;
    payload.healthMax = Math.max(1, parseInt(healthSingle.value, 10) || 1);
  } else {
    payload.healthMax = Math.max(1, parseInt(healthSingle.value, 10) || 1);
    payload.bossTrackMax = Math.max(1, parseInt(bossTrackMax.value, 10) || 1);
  }

  await board.addUnit(payload);
  close();
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <form class="modal" @submit.prevent="onSubmit">
      <h2>Add Enemy</h2>
      <div class="seg" role="tablist">
        <button
          v-for="t in ['mob', 'roaming', 'boss']"
          :key="t"
          type="button"
          class="seg-btn"
          :class="{ active: type === t }"
          role="tab"
          :aria-selected="type === t"
          @click="type = t"
        >
          {{ t === 'mob' ? 'Mob' : t === 'roaming' ? 'Roaming' : 'Boss' }}
        </button>
      </div>

      <label>
        Name
        <input v-model.trim="name" list="name-datalist" autocomplete="off" placeholder="e.g. Skeletons" required />
      </label>
      <datalist id="name-datalist">
        <option v-for="n in names" :key="n" :value="n" />
      </datalist>

      <label v-if="type !== 'boss'">
        Dungeon level
        <select v-model="level">
          <option v-for="l in LEVELS" :key="l" :value="l">{{ l }}</option>
        </select>
      </label>

      <div v-if="type === 'mob'" class="add-fields">
        <label>
          Health / miniature
          <input v-model.number="healthMob" type="number" min="1" inputmode="numeric" />
        </label>
        <label>
          Minions
          <input v-model.number="minionCount" type="number" min="0" inputmode="numeric" />
        </label>
      </div>

      <div v-else-if="type === 'roaming'" class="add-fields">
        <label>
          Health
          <input v-model.number="healthSingle" type="number" min="1" inputmode="numeric" />
        </label>
      </div>

      <div v-else class="add-fields">
        <label>
          Health
          <input v-model.number="healthSingle" type="number" min="1" inputmode="numeric" />
        </label>
        <label>
          Boss track length
          <input v-model.number="bossTrackMax" type="number" min="1" inputmode="numeric" />
        </label>
      </div>

      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="close">Cancel</button>
        <button type="submit" class="btn btn-accent">Add to encounter</button>
      </div>
    </form>
  </div>
</template>
