<script setup>
import { useBoardStore } from '../stores/board.store.js';

const board = useBoardStore();
</script>

<template>
  <div class="field-group">
    <label>Heroes</label>
    <div class="stepper">
      <button type="button" aria-label="Fewer heroes" @click="board.setHeroCount(-1)">&minus;</button>
      <span>{{ board.encounter.heroCount }}</span>
      <button type="button" aria-label="More heroes" @click="board.setHeroCount(1)">+</button>
    </div>
  </div>
</template>
