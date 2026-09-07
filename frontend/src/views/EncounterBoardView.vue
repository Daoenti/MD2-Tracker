<script setup>
import { ref, watch, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useBoardStore } from '../stores/board.store.js';
import TopBar from '../components/TopBar.vue';
import MobCard from '../components/MobCard.vue';
import SingleUnitCard from '../components/SingleUnitCard.vue';
import AddEnemyModal from '../components/AddEnemyModal.vue';

const route = useRoute();
const board = useBoardStore();
const showAddModal = ref(false);

async function loadForRoute() {
  await board.load(route.params.id);
}

onMounted(loadForRoute);
watch(() => route.params.id, loadForRoute);
</script>

<template>
  <template v-if="board.encounter">
    <TopBar @open-add="showAddModal = true" />

    <p v-if="board.encounter.isSample" class="sample-banner">
      This is a sample encounter so you can see how the tracker works.
    </p>

    <main class="grid">
      <div v-if="board.orderedUnits.length === 0" class="empty-state">
        <h2>No enemies on the board</h2>
        <p>Tap "+ Add Enemy" to log a Mob, Roaming Monster, or Boss.</p>
      </div>
      <template v-for="unit in board.orderedUnits" :key="unit.id">
        <MobCard v-if="unit.kind === 'mob'" :unit="unit" />
        <SingleUnitCard v-else :unit="unit" />
      </template>
    </main>

    <AddEnemyModal v-if="showAddModal" @close="showAddModal = false" />
  </template>
</template>
