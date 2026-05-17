<template>
  <div class="auth-page">
    <div class="container-responsive">
      <!-- Mascot Section -->
      <div class="mascot-section">
        <img :src="owlMascot" alt="Owl Mascot" class="mascot-image" />
      </div>
      <h1 class="auth-title">Create Account</h1>
      <p class="auth-subtitle">Start tracking your finances today</p>

      <!-- Sign Up Form -->
      <form @submit.prevent="handleSignUp" class="auth-form">
        <div class="form-field">
          <label class="form-label" for="email">Email Address</label>
          <input v-model="email" type="email" id="email" class="form-input" placeholder="name@example.com" required
            :disabled="isLoading" />
        </div>

        <!-- Password field with show/hide -->
        <div class="form-field">
          <label class="form-label" for="password">Password</label>
          <div class="password-wrapper">
            <input v-model="password" :type="showPassword ? 'text' : 'password'" id="password"
              class="form-input password-input" placeholder="••••••••" required :disabled="isLoading" />
            <button type="button" class="toggle-password" @click="togglePasswordVisibility('password')"
              :disabled="isLoading">
              <span class="material-symbols-outlined">
                {{ showPassword ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
        </div>

        <!-- Confirm Password field with show/hide -->
        <div class="form-field">
          <label class="form-label" for="confirmPassword">Confirm Password</label>
          <div class="password-wrapper">
            <input v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" id="confirmPassword"
              class="form-input password-input" placeholder="••••••••" required :disabled="isLoading" />
            <button type="button" class="toggle-password" @click="togglePasswordVisibility('confirm')"
              :disabled="isLoading">
              <span class="material-symbols-outlined">
                {{ showConfirmPassword ? 'visibility_off' : 'visibility' }}
              </span>
            </button>
          </div>
          <p v-if="passwordMismatch && !isLoading" class="error-message">Passwords do not match</p>
        </div>

        <button type="submit" class="btn-primary" :disabled="isLoading">
          {{ isLoading ? 'Creating account...' : 'Sign Up' }}
        </button>
      </form>

      <!-- Social Sign Up Section -->
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
              alt="Google" class="social-icon" />
          </button>
          <button @click="goToAppleAuth" class="social-btn" :disabled="isLoading">
            <svg class="social-icon-svg" viewBox="0 0 384 512" fill="currentColor">
              <path
                d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C63.3 141.2 4 184.8 4 273.5q0 39.3 14.4 81.2c12.8 36.7 59 126.7 107.2 125.2 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.4-82.5 102.6-119.3-65.2-30.7-61.7-90-61.7-91.9zm-56.6-164.2c27.3-32.4 24.8-61.9 24-72.5-24.1 1.4-52 16.4-67.9 34.9-17.5 19.8-27.8 44.3-25.6 71.9 26.1 2 49.9-11.4 69.5-34.3z" />
            </svg>
          </button>
          <button @click="goToFacebookAuth" class="social-btn" :disabled="isLoading">
            <svg class="social-icon-svg facebook" viewBox="0 0 512 512" fill="#1877F2">
              <path
                d="M504 256C504 119 393 8 256 8S8 119 8 256c0 123.78 90.69 226.38 209.25 245V327.69h-63V256h63v-54.64c0-62.15 37-96.48 93.67-96.48 27.14 0 55.52 4.84 55.52 4.84v61h-31.28c-30.8 0-40.41 19.12-40.41 38.73V256h68.78l-11 71.69h-57.78V501C413.31 482.38 504 379.78 504 256z" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Carousel Indicators -->
      <div class="carousel-indicators">
        <div class="indicator"></div>
        <div class="indicator active"></div>
        <div class="indicator"></div>
      </div>

      <!-- Back to Login -->
      <button class="btn-link" @click="goToLogin" :disabled="isLoading">
        Already have an account? <span class="link-text">Sign In</span>
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFinanceStore } from '../stores/finance'
import owlMascot from '../assets/owl-mascot.png'

const router = useRouter()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

// Form fields
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)

// Validation
const passwordMismatch = computed(() => {
  return password.value !== confirmPassword.value && confirmPassword.value !== ''
})

const togglePasswordVisibility = (field) => {
  if (field === 'password') {
    showPassword.value = !showPassword.value
  } else if (field === 'confirm') {
    showConfirmPassword.value = !showConfirmPassword.value
  }
}

const handleSignUp = async () => {
  // Validation
  if (!email.value || !password.value) {
    alert('Please fill in all fields')
    return
  }
  if (passwordMismatch.value) {
    alert('Passwords do not match')
    return
  }
  if (password.value.length < 6) {
    alert('Password must be at least 6 characters')
    return
  }

  isLoading.value = true
  const success = await authStore.signup(email.value, password.value, '')
  isLoading.value = false

  if (success) {
    // Refresh finance data (the backend has already merged the guest account)
    await financeStore.fetchTransactions()
    await financeStore.fetchBudgets(financeStore.getCurrentMonth())
    await financeStore.fetchSummary()
    router.push('/dashboard')
  } else {
    alert('Signup failed. Email may already be in use.')
  }
}

// Social auth (replace with actual OAuth endpoints)
const getApiBaseUrl = () => {
  const url = import.meta.env.VITE_API_BASE_URL;
  if (!url) {
    console.warn('VITE_API_BASE_URL missing, using fallback for UAT');
    return 'http://192.168.1.113:5000/api';
  }
  return url;
};

const goToGoogleAuth = () => {
  window.location.href = `${getApiBaseUrl()}/auth/google`;
};
const goToAppleAuth = () => {
  window.location.href = `${getApiBaseUrl()}/auth/apple`;
};
const goToFacebookAuth = () => {
  window.location.href = `${getApiBaseUrl()}/auth/facebook`;
};

const goToLogin = () => {
  router.push('/')
}
</script>

<style scoped>
/* All styles remain exactly the same as your original – no changes needed */
.auth-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 1rem;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
}

.container-responsive {
  width: 100%;
  max-width: 28rem;
  margin: 0 auto;
}

.mascot-section {
  margin-bottom: 1.5rem;
  text-align: center;
}

.mascot-image {
  width: 8rem;
  height: 8rem;
  object-fit: contain;
  margin: 0 auto;
}

.auth-title {
  font-family: var(--font-family-headline);
  font-size: 1.75rem;
  font-weight: 700;
  text-align: center;
  margin-bottom: 0.5rem;
}

.auth-subtitle {
  font-family: var(--font-family-sans);
  font-size: 1rem;
  color: var(--color-on-surface-variant);
  text-align: center;
  margin-bottom: 1.5rem;
}

.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.form-field {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.form-label {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  color: var(--color-on-surface-variant);
}

.form-input {
  width: 100%;
  padding: 0.75rem 1rem;
  border-radius: 0.75rem;
  border: 1px solid var(--color-outline-variant);
  background: rgba(255, 255, 255, 0.8);
  font-family: var(--font-family-sans);
  font-size: 1rem;
  transition: all 0.2s;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

.password-wrapper {
  position: relative;
}

.password-input {
  padding-right: 3rem;
}

.toggle-password {
  position: absolute;
  right: 0.75rem;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-outline);
}

.btn-primary {
  width: 100%;
  background: var(--color-primary);
  color: white;
  padding: 0.75rem;
  border-radius: 2rem;
  border: none;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary:hover {
  background: var(--color-primary-container);
  transform: scale(0.98);
}

.btn-primary:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.social-section {
  margin-top: 1.5rem;
}

.divider {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.divider-line {
  flex: 1;
  height: 1px;
  background: var(--color-outline-variant);
  opacity: 0.5;
}

.divider-text {
  font-size: 0.75rem;
  font-weight: 600;
  color: var(--color-on-surface-variant);
}

.social-buttons {
  display: flex;
  justify-content: center;
  gap: 1rem;
}

.social-btn {
  width: 3rem;
  height: 3rem;
  border-radius: 9999px;
  border: 1px solid var(--color-outline-variant);
  background: rgba(255, 255, 255, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.social-btn:hover {
  background: rgba(255, 255, 255, 0.8);
}

.social-icon {
  width: 1.5rem;
  height: 1.5rem;
}

.social-icon-svg {
  width: 1.5rem;
  height: 1.5rem;
}

.carousel-indicators {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin: 1.5rem 0;
}

.indicator {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 9999px;
  background: var(--color-outline-variant);
  transition: all 0.2s;
}

.indicator.active {
  width: 1.5rem;
  background: var(--color-primary);
}

.btn-link {
  background: none;
  border: none;
  width: 100%;
  text-align: center;
  font-size: 0.875rem;
  color: var(--color-on-surface-variant);
  cursor: pointer;
}

.link-text {
  color: var(--color-primary);
  font-weight: 600;
}

.error-message {
  font-size: 0.75rem;
  color: var(--color-error);
  margin-top: 0.25rem;
}
</style>