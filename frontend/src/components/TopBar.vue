<script setup>
import { useBoardStore } from '../stores/board.store.js';
import HeroStepper from './HeroStepper.vue';
import DarknessTracker from './DarknessTracker.vue';

defineEmits(['open-add']);
const board = useBoardStore();
</script>

<template>
  <header class="topbar">
    <div class="brand">
      <RouterLink to="/" class="icon-btn" aria-label="Back to encounters">&larr;</RouterLink>
      <div class="brand-text">
        <h1>{{ board.encounter.name }}</h1>
        <p>Massive Darkness 2 encounter log</p>
      </div>
    </div>
    <div class="controls">
      <HeroStepper />
      <DarknessTracker />
      <button type="button" class="btn btn-accent" @click="$emit('open-add')">+ Add Enemy</button>
    </div>
  </header>
</template>
