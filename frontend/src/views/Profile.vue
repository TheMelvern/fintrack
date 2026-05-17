<template>
  <div class="profile-page">
    <!-- Guest Banner -->
    <div v-if="isGuest" class="guest-banner glass-card">
      <div class="guest-content">
        <span class="material-symbols-outlined">info</span>
        <div>
          <p><strong>Guest Mode</strong> – Your data is saved to the cloud with this device, but signing up will let you access it from anywhere.</p>
          <p class="guest-hint">Sign up to keep your transactions and budgets forever across all devices.</p>
        </div>
        <button class="signup-now-btn" @click="goToSignUp">Sign Up Now</button>
      </div>
    </div>

    <!-- User Card -->
    <div class="user-card glass-card">
      <div class="avatar-container">
        <div class="avatar">
          <span class="material-symbols-outlined">person</span>
        </div>
      </div>
      <div class="user-info">
        <h2 class="user-name">{{ displayName }}</h2>
        <p class="user-email">{{ userEmail }}</p>
        <button v-if="!isGuest" class="edit-profile-btn" @click="openEditModal">Edit Profile</button>
        <div v-else class="guest-edit-note">Sign up to edit profile</div>
      </div>
    </div>

    <!-- Stats Section -->
    <div class="stats-grid" v-if="!isGuest">
      <div class="stat-card glass-card">
        <span class="material-symbols-outlined stat-icon">account_balance_wallet</span>
        <p class="stat-label">Member Since</p>
        <p class="stat-value">{{ memberSince }}</p>
      </div>
      <div class="stat-card glass-card">
        <span class="material-symbols-outlined stat-icon">receipt_long</span>
        <p class="stat-label">Total Transactions</p>
        <p class="stat-value">{{ transactionCount }}</p>
      </div>
    </div>

    <!-- Settings -->
    <div class="settings-section glass-card">
      <h3 class="section-title">Settings</h3>
      <div class="settings-list">
        <div class="setting-item" @click="goToNotifications">
          <div class="setting-left">
            <span class="material-symbols-outlined">notifications</span>
            <span>Notifications</span>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
        <div class="setting-item" @click="goToCurrency">
          <div class="setting-left">
            <span class="material-symbols-outlined">attach_money</span>
            <span>Currency</span>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
        <!-- NEW: Customize Categories -->
        <div class="setting-item" @click="goToCustomizeCategories">
          <div class="setting-left">
            <span class="material-symbols-outlined">category</span>
            <span>Customize Categories</span>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
        <div class="setting-item" @click="goToSecurity">
          <div class="setting-left">
            <span class="material-symbols-outlined">security</span>
            <span>Security</span>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
        <div class="setting-item" @click="goToHelpCenter">
          <div class="setting-left">
            <span class="material-symbols-outlined">help</span>
            <span>Help Centre</span>
          </div>
          <span class="material-symbols-outlined">chevron_right</span>
        </div>
      </div>
    </div>

    <!-- Logout / Sign Up -->
    <button v-if="!isGuest" class="logout-btn" @click="handleLogout">
      <span class="material-symbols-outlined">logout</span>
      Logout
    </button>
    <button v-else class="signup-btn" @click="goToSignUp">
      <span class="material-symbols-outlined">person_add</span>
      Sign Up to Save Data
    </button>

    <BottomNav />

    <!-- Edit Profile Modal -->
    <div v-if="showEditModal" class="modal-overlay" @click.self="closeEditModal">
      <div class="modal glass-card">
        <div class="modal-header">
          <h3>Edit Profile</h3>
          <button class="close-btn" @click="closeEditModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="modal-content">
          <div class="input-group">
            <label>Full Name</label>
            <input type="text" v-model="editName" class="modal-input" placeholder="Enter your full name" />
          </div>
          <div class="input-group">
            <label>Email Address</label>
            <input type="email" v-model="editEmail" class="modal-input" placeholder="Enter your email" />
          </div>
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeEditModal">Cancel</button>
          <button class="save-btn" @click="saveProfile" :disabled="isSaving">Save Changes</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useFinanceStore } from '../stores/finance'
import BottomNav from '../components/BottomNav.vue'

const router = useRouter()
const authStore = useAuthStore()
const financeStore = useFinanceStore()

const isGuest = computed(() => authStore.isGuest)
const userName = ref('')
const userEmail = ref('')
const memberSince = ref('')
const transactionCount = computed(() => financeStore.transactions.length)

const showEditModal = ref(false)
const editName = ref('')
const editEmail = ref('')
const isSaving = ref(false)

const displayName = computed(() => {
  if (!isGuest.value && userName.value) return userName.value
  return authStore.displayName
})

onMounted(() => {
  if (authStore.user) {
    userName.value = authStore.user.name || ''
    userEmail.value = authStore.user.email || ''
    if (authStore.user.createdAt) {
      const date = new Date(authStore.user.createdAt)
      memberSince.value = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    }
  } else {
    userName.value = authStore.displayName
    userEmail.value = authStore.userEmail
  }
})

const openEditModal = () => {
  if (isGuest.value) return
  editName.value = userName.value || authStore.user?.name || ''
  editEmail.value = userEmail.value || authStore.user?.email || ''
  showEditModal.value = true
}

const closeEditModal = () => showEditModal.value = false

const saveProfile = async () => {
  if (isGuest.value) return
  isSaving.value = true
  try {
    const updated = await authStore.updateProfile({
      fullName: editName.value.trim(),
      email: editEmail.value.trim(),
    })
    userName.value = updated.name || ''
    userEmail.value = updated.email || ''
    closeEditModal()
  } catch (error) {
    if (error.response?.status === 404) {
      alert('Profile update endpoint not available yet.')
    } else if (error.response?.status === 403) {
      alert('Guest accounts cannot edit profile.')
    } else {
      alert('Failed to update profile.')
    }
  } finally {
    isSaving.value = false
  }
}

const goToSignUp = () => router.push('/signup')
const goToNotifications = () => console.log('Notifications')
const goToCurrency = () => console.log('Currency')
const goToSecurity = () => console.log('Security')
const goToHelpCenter = () => window.open('https://support.fintrack.com', '_blank')
const goToCustomizeCategories = () => router.push('/categories')

const handleLogout = async () => {
  await authStore.logout()
  router.push('/')
}
</script>

<style scoped>
/* (All styles remain exactly the same as in your original file – no changes needed) */
.profile-page {
  padding: 1rem 1rem 6rem;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
  min-height: 100vh;
}

.glass-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

/* Guest banner */
.guest-banner {
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, rgba(0,88,190,0.1), rgba(0,108,73,0.1));
  border: 1px solid rgba(0,88,190,0.3);
}
.guest-content {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}
.guest-content .material-symbols-outlined {
  font-size: 2rem;
  color: var(--color-primary);
}
.guest-content p {
  margin: 0;
  flex: 1;
}
.guest-hint {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
}
.signup-now-btn {
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  transition: all 0.2s;
}
.signup-now-btn:hover {
  background: var(--color-primary-container);
  transform: scale(1.02);
}

/* User card */
.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}
.avatar-container {
  flex-shrink: 0;
}
.avatar {
  width: 5rem;
  height: 5rem;
  background: var(--color-primary-fixed);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.avatar .material-symbols-outlined {
  font-size: 2.5rem;
  color: var(--color-primary);
}
.user-info {
  flex: 1;
}
.user-name {
  font-family: var(--font-family-headline);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 0.25rem;
  color: var(--color-on-surface);
}
.user-email {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
  margin: 0 0 0.5rem;
}
.edit-profile-btn {
  background: rgba(0, 88, 190, 0.1);
  border: none;
  border-radius: 2rem;
  padding: 0.25rem 1rem;
  font-size: var(--text-label-md);
  font-weight: 600;
  color: var(--color-primary);
  cursor: pointer;
  transition: background 0.2s;
}
.edit-profile-btn:hover {
  background: rgba(0, 88, 190, 0.2);
}
.guest-edit-note {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
  font-style: italic;
}

/* Stats grid */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.stat-card {
  padding: 1rem;
  text-align: center;
}
.stat-icon {
  font-size: 1.75rem;
  color: var(--color-primary);
  margin-bottom: 0.5rem;
}
.stat-label {
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  color: var(--color-on-surface-variant);
  margin: 0 0 0.25rem;
}
.stat-value {
  font-family: var(--font-family-headline);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0;
}

/* Settings */
.settings-section {
  padding: 1rem;
  margin-bottom: 1.5rem;
}
.section-title {
  font-family: var(--font-family-headline);
  font-size: 1.1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  color: var(--color-on-surface);
}
.settings-list {
  display: flex;
  flex-direction: column;
}
.setting-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.5rem;
  cursor: pointer;
  border-radius: 0.75rem;
  transition: background 0.2s;
}
.setting-item:hover {
  background: rgba(255, 255, 255, 0.4);
}
.setting-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.setting-left .material-symbols-outlined {
  font-size: 1.25rem;
  color: var(--color-primary);
}
.setting-left span:last-child {
  font-size: var(--text-body-md);
  color: var(--color-on-surface);
}
.setting-item .material-symbols-outlined:last-child {
  font-size: 1.25rem;
  color: var(--color-outline);
}

/* Logout / Sign Up buttons */
.logout-btn, .signup-btn {
  width: 100%;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2rem;
  padding: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.logout-btn {
  color: var(--color-error);
}
.signup-btn {
  color: var(--color-primary);
}
.logout-btn:hover, .signup-btn:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: scale(1.01);
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  width: 90%;
  max-width: 400px;
  padding: 1.5rem;
  animation: fadeIn 0.2s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}
.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.modal-header h3 {
  margin: 0;
  font-family: var(--font-family-headline);
  color: var(--color-on-surface);
}
.close-btn {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.25rem;
}
.close-btn .material-symbols-outlined {
  font-size: 1.5rem;
  color: var(--color-on-surface-variant);
}
.modal-content {
  margin-bottom: 1.5rem;
}
.input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}
.input-group label {
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  color: var(--color-on-surface-variant);
}
.modal-input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
  padding: 0.75rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
  width: 100%;
  box-sizing: border-box;
}
.modal-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
.modal-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
.cancel-btn, .save-btn {
  padding: 0.5rem 1.25rem;
  border-radius: 2rem;
  border: none;
  cursor: pointer;
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: 600;
  transition: all 0.2s;
}
.cancel-btn {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-on-surface-variant);
}
.cancel-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}
.save-btn {
  background: var(--color-primary);
  color: white;
}
.save-btn:hover {
  background: var(--color-primary-container);
  transform: scale(1.02);
}
.save-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>