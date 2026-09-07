<script setup>
import { computed } from 'vue';
import { useBoardStore } from '../stores/board.store.js';

const board = useBoardStore();

const side = computed(() => board.encounter.darkness.side);
const pos = computed(() => board.encounter.darkness.pos);
const max = computed(() => (side.value === 'A' ? 9 : 4));
const showFlip = computed(() => side.value === 'A' && pos.value >= 9);
</script>

<template>
  <div class="field-group">
    <label>Darkness · Track {{ side }}</label>
    <div class="darkness-widget">
      <div class="darkness-track">
        <button
          v-for="i in max"
          :key="i"
          type="button"
          class="darkness-pip"
          :class="{ filled: i <= pos }"
          :aria-label="`Set darkness to ${i}`"
          @click="board.setDarknessPos(i)"
        >
          {{ i }}
        </button>
      </div>
      <div class="darkness-actions">
        <button type="button" @click="board.moveDarkness(-1)">&minus; Phase</button>
        <button type="button" @click="board.moveDarkness(1)">+ Phase</button>
        <button v-if="showFlip" type="button" @click="board.flipSide()">Flip to Side B</button>
      </div>
    </div>
  </div>
</template>
