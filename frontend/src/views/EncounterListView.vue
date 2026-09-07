<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.js';
import { useEncountersStore } from '../stores/encounters.store.js';
import ChangePasswordModal from '../components/ChangePasswordModal.vue';

const auth = useAuthStore();
const encounters = useEncountersStore();
const router = useRouter();

const newName = ref('');
const creating = ref(false);
const showChangePassword = ref(false);

onMounted(() => {
  encounters.fetchList();
});

async function createEncounter() {
  const name = newName.value.trim();
  if (!name) return;
  creating.value = true;
  try {
    const encounter = await encounters.create(name);
    newName.value = '';
    router.push({ name: 'board', params: { id: encounter.id } });
  } finally {
    creating.value = false;
  }
}

async function removeEncounter(id) {
  if (!confirm('Delete this encounter? This cannot be undone.')) return;
  await encounters.remove(id);
}

async function logout() {
  await auth.logout();
  router.push({ name: 'login' });
}
</script>

<template>
  <header class="list-topbar">
    <div class="brand">
      <span class="brand-mark" aria-hidden="true">💀</span>
      <div class="brand-text">
        <h1>Hellscape Tracker</h1>
        <p>{{ auth.user?.username }}</p>
      </div>
    </div>
    <div class="controls">
      <RouterLink v-if="auth.user?.isAdmin" to="/admin" class="btn btn-ghost btn-sm">Admin</RouterLink>
      <button type="button" class="btn btn-ghost btn-sm" @click="showChangePassword = true">Change password</button>
      <button type="button" class="btn btn-ghost btn-sm" @click="logout">Log out</button>
    </div>
  </header>

  <ChangePasswordModal v-if="showChangePassword" @close="showChangePassword = false" />

  <form class="new-encounter-form" @submit.prevent="createEncounter">
    <input v-model.trim="newName" placeholder="New encounter name" required />
    <button type="submit" class="btn btn-accent" :disabled="creating">+ New encounter</button>
  </form>

  <main class="encounter-list">
    <div v-if="encounters.loaded && encounters.list.length === 0" class="empty-state">
      <h2>No encounters yet</h2>
      <p>Create one above to start tracking a fight.</p>
    </div>

    <article v-for="e in encounters.list" :key="e.id" class="encounter-tile">
      <div class="row">
        <h3>{{ e.name }}</h3>
        <span v-if="e.isSample" class="tag mob">Sample</span>
      </div>
      <p class="subtext">{{ e.heroCount }} heroes · Darkness {{ e.darkness.side }}{{ e.darkness.pos }}</p>
      <div class="row">
        <RouterLink :to="{ name: 'board', params: { id: e.id } }" class="btn btn-accent btn-sm">Resume</RouterLink>
        <button type="button" class="icon-btn danger" aria-label="Delete encounter" @click="removeEncounter(e.id)">&times;</button>
      </div>
    </article>
  </main>
</template>
