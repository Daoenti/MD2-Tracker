<script setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useAuthStore } from '../stores/auth.store.js';
import { useAdminStore } from '../stores/admin.store.js';

const auth = useAuthStore();
const admin = useAdminStore();

const tab = ref('users');

onMounted(() => {
  admin.fetchUsers();
  admin.fetchTemplates();
});

function kindLabel(kind) {
  return kind === 'mob' ? 'Mob' : kind === 'roaming' ? 'Roaming' : 'Boss';
}

function templatesByKind(kind) {
  return admin.templates.filter((t) => t.kind === kind);
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString();
}

function toInt(event) {
  const value = parseInt(event.target.value, 10);
  return Number.isNaN(value) ? undefined : value;
}

// ---- users ----
const newUsername = ref('');
const newPassword = ref('');
const newIsAdmin = ref(false);
const userError = ref('');

async function createUser() {
  userError.value = '';
  try {
    await admin.createUser(newUsername.value, newPassword.value, newIsAdmin.value);
    newUsername.value = '';
    newPassword.value = '';
    newIsAdmin.value = false;
  } catch (err) {
    userError.value = err.message || 'Failed to create user';
  }
}

async function toggleAdmin(user, event) {
  userError.value = '';
  try {
    await admin.patchUser(user.id, { isAdmin: event.target.checked });
  } catch (err) {
    event.target.checked = user.isAdmin; // revert the checkbox on failure
    userError.value = err.message || 'Failed to update user';
  }
}

async function deleteUser(user) {
  if (!confirm(`Delete user "${user.username}"? This also deletes their encounters.`)) return;
  userError.value = '';
  try {
    await admin.removeUser(user.id);
  } catch (err) {
    userError.value = err.message || 'Failed to delete user';
  }
}

const resettingUserId = ref(null);
const resettingUsername = ref('');
const resetPassword = ref('');

function startReset(user) {
  resettingUserId.value = user.id;
  resettingUsername.value = user.username;
  resetPassword.value = '';
}

async function submitReset() {
  userError.value = '';
  try {
    await admin.patchUser(resettingUserId.value, { password: resetPassword.value });
    resettingUserId.value = null;
  } catch (err) {
    userError.value = err.message || 'Failed to reset password';
  }
}

// ---- enemy templates ----
const templateError = ref('');

function defaultsFor(kind) {
  if (kind === 'mob') return { name: '', level: '1-2', healthMax: 4, minionCount: 4 };
  if (kind === 'roaming') return { name: '', level: '1-2', healthMax: 10 };
  return { name: '', healthMax: 20, bossTrackMax: 8 };
}

const newTemplate = reactive({
  mob: defaultsFor('mob'),
  roaming: defaultsFor('roaming'),
  boss: defaultsFor('boss'),
});

async function createTemplate(kind) {
  templateError.value = '';
  const form = newTemplate[kind];
  try {
    await admin.createTemplate({ kind, ...form });
    Object.assign(newTemplate[kind], defaultsFor(kind));
  } catch (err) {
    templateError.value = err.message || 'Failed to create template';
  }
}

async function patchField(template, field, value) {
  if (value === undefined || value === template[field]) return;
  templateError.value = '';
  try {
    await admin.patchTemplate(template.id, { [field]: value });
  } catch (err) {
    templateError.value = err.message || 'Failed to update template';
  }
}

async function deleteTemplate(template) {
  if (!confirm(`Delete "${template.name}" from the catalog?`)) return;
  templateError.value = '';
  try {
    await admin.removeTemplate(template.id);
  } catch (err) {
    templateError.value = err.message || 'Failed to delete template';
  }
}

const kinds = ['mob', 'roaming', 'boss'];
</script>

<template>
  <header class="list-topbar">
    <div class="brand">
      <RouterLink to="/" class="icon-btn" aria-label="Back to encounters">&larr;</RouterLink>
      <div class="brand-text">
        <h1>Admin</h1>
        <p>Users &amp; enemy catalog</p>
      </div>
    </div>
  </header>

  <main class="admin-main">
    <div class="seg" role="tablist">
      <button type="button" class="seg-btn" :class="{ active: tab === 'users' }" @click="tab = 'users'">Users</button>
      <button
        type="button"
        class="seg-btn"
        :class="{ active: tab === 'templates' }"
        @click="tab = 'templates'"
      >
        Enemy Templates
      </button>
    </div>

    <section v-if="tab === 'users'" class="admin-section">
      <h2>Users</h2>
      <div class="admin-table-wrap">
        <table class="admin-table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Admin</th>
              <th>Created</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in admin.users" :key="u.id">
              <td>{{ u.username }}</td>
              <td>
                <input
                  type="checkbox"
                  :checked="u.isAdmin"
                  :disabled="u.id === auth.user.id"
                  @change="toggleAdmin(u, $event)"
                />
              </td>
              <td>{{ formatDate(u.createdAt) }}</td>
              <td>
                <span v-if="u.id === auth.user.id" class="subtext">You</span>
                <template v-else>
                  <button type="button" class="btn btn-ghost btn-sm" @click="startReset(u)">Reset password</button>
                  <button type="button" class="icon-btn danger" aria-label="Delete user" @click="deleteUser(u)">&times;</button>
                </template>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <form v-if="resettingUserId" class="admin-inline-form" @submit.prevent="submitReset">
        <label>
          New password for {{ resettingUsername }}
          <input v-model="resetPassword" type="password" minlength="8" required />
        </label>
        <button type="submit" class="btn btn-accent btn-sm">Save</button>
        <button type="button" class="btn btn-ghost btn-sm" @click="resettingUserId = null">Cancel</button>
      </form>

      <h3>Create user</h3>
      <form class="admin-inline-form" @submit.prevent="createUser">
        <label>
          Username
          <input v-model.trim="newUsername" required minlength="3" />
        </label>
        <label>
          Password
          <input v-model="newPassword" type="password" required minlength="8" />
        </label>
        <label>
          Admin
          <input v-model="newIsAdmin" type="checkbox" />
        </label>
        <button type="submit" class="btn btn-accent btn-sm">+ Create user</button>
      </form>
      <p v-if="userError" class="admin-error">{{ userError }}</p>
    </section>

    <section v-else class="admin-section">
      <h2>Enemy Templates</h2>

      <div v-for="kind in kinds" :key="kind">
        <h3>{{ kindLabel(kind) }}</h3>
        <div class="admin-table-wrap">
          <table class="admin-table">
            <thead>
              <tr>
                <th>Name</th>
                <th v-if="kind !== 'boss'">Level</th>
                <th>Health</th>
                <th v-if="kind === 'mob'">Minions</th>
                <th v-if="kind === 'boss'">Boss Track</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="t in templatesByKind(kind)" :key="t.id">
                <td><input type="text" :value="t.name" @change="patchField(t, 'name', $event.target.value)" /></td>
                <td v-if="kind !== 'boss'">
                  <input type="text" :value="t.level" @change="patchField(t, 'level', $event.target.value)" />
                </td>
                <td>
                  <input type="number" min="1" :value="t.healthMax" @change="patchField(t, 'healthMax', toInt($event))" />
                </td>
                <td v-if="kind === 'mob'">
                  <input
                    type="number"
                    min="0"
                    :value="t.minionCount"
                    @change="patchField(t, 'minionCount', toInt($event))"
                  />
                </td>
                <td v-if="kind === 'boss'">
                  <input
                    type="number"
                    min="1"
                    :value="t.bossTrackMax"
                    @change="patchField(t, 'bossTrackMax', toInt($event))"
                  />
                </td>
                <td>
                  <button type="button" class="icon-btn danger" aria-label="Delete template" @click="deleteTemplate(t)">&times;</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <form class="admin-inline-form" @submit.prevent="createTemplate(kind)">
          <label>
            Name
            <input v-model.trim="newTemplate[kind].name" required />
          </label>
          <label v-if="kind !== 'boss'">
            Level
            <input v-model.trim="newTemplate[kind].level" placeholder="1-2" />
          </label>
          <label>
            Health
            <input v-model.number="newTemplate[kind].healthMax" type="number" min="1" required />
          </label>
          <label v-if="kind === 'mob'">
            Minions
            <input v-model.number="newTemplate[kind].minionCount" type="number" min="0" />
          </label>
          <label v-if="kind === 'boss'">
            Boss track
            <input v-model.number="newTemplate[kind].bossTrackMax" type="number" min="1" required />
          </label>
          <button type="submit" class="btn btn-accent btn-sm">+ Add {{ kindLabel(kind) }}</button>
        </form>
      </div>

      <p v-if="templateError" class="admin-error">{{ templateError }}</p>
    </section>
  </main>
</template>
