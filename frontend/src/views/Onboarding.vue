<template>
  <div class="auth-page">
    <div class="container-responsive">
      <!-- Mascot Section -->
      <div class="mascot-section">
        <img :src="owlMascot" alt="Owl Mascot" class="mascot-image" />
      </div>
      <h1 class="auth-title">Welcome to FinTrack</h1>
      <p class="auth-subtitle">Let's get your finances on track together</p>

      <!-- Login Form -->
      <form @submit.prevent="handleSignIn" class="auth-form">
        <div class="form-field">
          <label class="form-label" for="email">Email Address</label>
          <input
            v-model="email"
            type="email"
            id="email"
            class="form-input"
            placeholder="name@example.com"
            required
            :disabled="isLoading"
          />
        </div>
        <div class="form-field">
          <label class="form-label" for="password">Password</label>
          <input
            v-model="password"
            type="password"
            id="password"
            class="form-input"
            placeholder="••••••••"
            required
            :disabled="isLoading"
          />
        </div>
        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Signing in...' : 'Sign In' }}
        </button>
        <button type="button" @click="goToSignUp" class="btn-secondary" :disabled="isLoading">
          Sign Up
        </button>
      </form>

      <!-- Social Login Section -->
      <div class="social-section">
        <div class="divider">
          <span class="divider-line"></span>
          <span class="divider-text">Or sign up with</span>
          <span class="divider-line"></span>
        </div>
        <div class="social-buttons">
          <button @click="goToGoogleAuth" class="social-btn" :disabled="isLoading">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuDFOrFW45T5TLqgwPjd-aGFCKRvoFm7wgSc7nnaG_OnE9yg62J__ewEKd0pi2PwONHMwtBr4TIWn2voUl7-OwrOM6Mgjs-aW8_QpnT9LcbSrfAeh-d7ACVZYGk_J4UmPckeA3PHOkhVaTv_mYqSKw7-G8KPv2SPFxKqs65RjSFldrztEkF9638V8DMOaH-wk8_mQEu5TcgECMqA1VP5jq6BuKI8NMHQ6qt4Z5Sa1u7Sfrc9uL9muefhv5bpvsRlbVFmhcBMXBo6GYs"
              alt="Google"
              class="social-icon"
            />
          </button>
          <button @click="goToAppleAuth" class="social-btn" :disabled="isLoading">
            <svg class="social-icon-svg" viewBox="0 0 384 512" fill="currentColor">
              <path
                d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z"
              />
            </svg>
          </button>
          <button @click="goToFacebookAuth" class="social-btn" :disabled="isLoading">
            <svg class="social-icon-svg facebook" viewBox="0 0 512 512" fill="#1877F2">
              <path
                d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z"
              />
            </svg>
          </button>
        </div>
      </div>

      <!-- Getting Started Section -->
      <div class="getting-started">
        <div class="getting-started-header">
          <h2 class="getting-started-title">Getting Started</h2>
          <p class="getting-started-subtitle">
            Connect your accounts to see the full picture of your wealth.
          </p>
        </div>
        <div class="carousel-indicators">
          <div class="indicator active"></div>
          <div class="indicator"></div>
          <div class="indicator"></div>
        </div>
      </div>

      <!-- Skip Button -->
      <button class="btn-skip" @click="skipOnboarding" :disabled="isLoading">
        Skip for now
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import owlMascot from '../assets/owl-mascot.png'

const router = useRouter()
const authStore = useAuthStore()

const email = ref('')
const password = ref('')
const isLoading = ref(false)

const handleSignIn = async () => {
  if (!email.value || !password.value) {
    alert('Please enter both email and password')
    return
  }
  isLoading.value = true
  const success = await authStore.login(email.value, password.value)
  isLoading.value = false
  if (success) {
    router.push('/dashboard')
  } else {
    alert('Invalid email or password')
  }
}

const goToSignUp = () => {
  router.push('/signup')
}

const goToGoogleAuth = () => {
  window.location.href = 'https://your-backend.com/auth/google'
}
const goToAppleAuth = () => {
  window.location.href = 'https://your-backend.com/auth/apple'
}
const goToFacebookAuth = () => {
  window.location.href = 'https://your-backend.com/auth/facebook'
}

const skipOnboarding = () => {
  const wantsToSignUp = window.confirm(
    "You're skipping sign‑up. Would you like to create an account now?\n\n" +
    "• Press OK to go to Sign Up\n" +
    "• Press Cancel to continue as a guest"
  )
  if (wantsToSignUp) {
    router.push('/signup')
  } else {
    // Guest session is already created automatically in main.js.
    // No need to set any flags. Just go to the dashboard.
    router.push('/dashboard')
  }
}
</script>

<style scoped>
.getting-started {
  margin-top: var(--spacing-space-xl);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--spacing-space-md);
  text-align: center;
}

.getting-started-title {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-md);
  font-weight: var(--text-headline-md--font-weight);
  color: var(--color-on-surface);
}

.getting-started-subtitle {
  font-family: var(--font-family-sans);
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
}

.btn-skip {
  width: 100%;
  background: transparent;
  color: var(--color-primary);
  margin-top: var(--spacing-space-sm);
  padding: var(--spacing-space-sm) 0;
  border-radius: var(--radius-md);
  border: none;
  cursor: pointer;
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-skip:hover {
  background-color: var(--color-surface-container-high);
}
</style>