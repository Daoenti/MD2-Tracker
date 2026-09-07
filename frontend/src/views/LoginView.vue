<script setup>
import { ref } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { useAuthStore } from '../stores/auth.store.js';

const auth = useAuthStore();
const router = useRouter();
const route = useRoute();

const username = ref('');
const password = ref('');
const error = ref('');
const submitting = ref(false);

async function onSubmit() {
  error.value = '';
  submitting.value = true;
  try {
    await auth.login(username.value, password.value);
    router.push(route.query.redirect || { name: 'encounters' });
  } catch (err) {
    error.value = err.message || 'Login failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div class="auth-shell">
    <form class="auth-card" @submit.prevent="onSubmit">
      <h1>Hellscape Tracker</h1>
      <p class="subtext">Sign in to your encounters</p>
      <p v-if="error" class="auth-error">{{ error }}</p>
      <label>
        Username
        <input v-model.trim="username" autocomplete="username" required />
      </label>
      <label>
        Password
        <input v-model="password" type="password" autocomplete="current-password" required />
      </label>
      <button type="submit" class="btn btn-accent" :disabled="submitting">Log in</button>
    </form>
  </div>
</template>
