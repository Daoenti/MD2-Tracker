<script setup>
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.js';

const auth = useAuthStore();
const router = useRouter();

const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function onSubmit() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.register(username.value, password.value);
    router.push({ name: 'encounters' });
  } catch (err) {
    error.value = err.message || 'Registration failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-shell">
    <form class="auth-card" @submit.prevent="onSubmit">
      <h1>Create account</h1>
      <p class="subtext">Registration is disabled unless the server owner has enabled it.</p>
      <p v-if="error" class="auth-error">{{ error }}</p>
      <label>
        Username
        <input v-model.trim="username" autocomplete="username" required minlength="3" />
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="new-password" required minlength="8" />
      </label>
      <button type="submit" class="btn btn-accent" :disabled="submitting">Register</button>
    </form>
  </div>
</template>
