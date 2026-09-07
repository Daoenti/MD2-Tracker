<script setup>
import { useBoardStore } from '../stores/board.store.js';

const props = defineProps({
  unitId: { type: String, required: true },
  notes: { type: String, default: '' },
  showNotes: { type: Boolean, default: false },
});

const board = useBoardStore();

function toggle() {
  board.toggleNotes(props.unitId);
}

function onBlur(event) {
  const value = event.target.value;
  if (value !== props.notes) {
    board.updateUnitFields(props.unitId, { notes: value });
  }
}
</script>

<template>
  <button type="button" class="notes-toggle" @click="toggle">
    {{ showNotes ? 'Hide notes' : notes ? 'Edit notes' : '+ Add notes' }}
  </button>
  <div v-if="showNotes" class="notes-box">
    <textarea :value="notes" placeholder="Conditions, tokens, abilities..." @blur="onBlur"></textarea>
  </div>
  <p v-else-if="notes" class="subtext">{{ notes }}</p>
</template>
