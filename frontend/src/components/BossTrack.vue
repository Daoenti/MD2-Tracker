<script setup>
import { useBoardStore } from '../stores/board.store.js';

const props = defineProps({
  unitId: { type: String, required: true },
  pos: { type: Number, required: true },
  max: { type: Number, required: true },
});

const board = useBoardStore();

function setPos(value) {
  board.updateUnitFields(props.unitId, { bossTrackPos: value });
}
</script>

<template>
  <div class="boss-track-block">
    <p class="subtext">Boss track</p>
    <div class="boss-track-row">
      <button
        v-for="i in max"
        :key="i"
        type="button"
        class="boss-pip"
        :class="{ filled: i <= pos }"
        :aria-label="`Set boss track to ${i}`"
        @click="setPos(i)"
      >
        {{ i }}
      </button>
    </div>
  </div>
</template>
