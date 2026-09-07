<script setup>
import { ref } from 'vue';
import { useAuthStore } from '../stores/auth.store.js';

const emit = defineEmits(['close']);
const auth = useAuthStore();

const currentPassword = ref('');
const newPassword = ref('');
const error = ref('');
const submitting = ref(false);

function close() {
  emit('close');
}

async function onSubmit() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.changePassword(currentPassword.value, newPassword.value);
    close();
  } catch (err) {
    error.value = err.message || 'Failed to change password';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="modal-backdrop" @click.self="close">
    <form class="modal" @submit.prevent="onSubmit">
      <h2>Change password</h2>
      <p v-if="error" class="auth-error">{{ error }}</p>
      <label>
        Current password
        <input v-model="currentPassword" type="password" autocomplete="current-password" required />
      </label>
      <label>
        New password
        <input v-model="newPassword" type="password" autocomplete="new-password" required minlength="8" />
      </label>
      <div class="modal-actions">
        <button type="button" class="btn btn-ghost" @click="close">Cancel</button>
        <button type="submit" class="btn btn-accent" :disabled="submitting">Save</button>
      </div>
    </form>
  </div>
</template>
