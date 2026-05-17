<template>
  <div class="auth-callback">
    <div class="spinner"></div>
    <p>{{ message }}</p>
  </div>
</template>

<script setup>
import { onMounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useAuthStore } from '../stores/auth';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const message = ref('Signing you in...');

onMounted(async () => {
  const token = route.query.token;
  if (!token) {
    message.value = 'No token received. Redirecting...';
    setTimeout(() => router.push('/'), 2000);
    return;
  }

  localStorage.setItem('token', token);
  authStore.token = token;
  
  message.value = 'Almost there...';
  
  // Use a timeout to ensure redirect happens even if fetchUser hangs
  const timeout = setTimeout(() => {
    router.push('/dashboard');
  }, 3000);
  
  try {
    await authStore.fetchUser();
    clearTimeout(timeout);
    router.push('/dashboard');
  } catch (err) {
    console.warn('Fetch user failed, but token is stored', err);
    clearTimeout(timeout);
    router.push('/dashboard');
  }
});
</script>