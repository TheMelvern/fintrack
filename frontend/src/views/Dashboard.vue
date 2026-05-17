<template>
  <div class="dashboard">
    <!-- Loading overlay (optional) -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="spinner"></div>
      <p>Loading your finances...</p>
    </div>

    <!-- Main content -->
    <div v-else>
      <SummaryCard />
      <SpendingCategorySummary />
      <RecentTransactions />
    </div>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { useAuthStore } from '../stores/auth'
import BottomNav from '../components/BottomNav.vue'
import SummaryCard from '../components/SummaryCard.vue'
import SpendingCategorySummary from '../components/SpendingCategorySummary.vue'
import RecentTransactions from '../components/RecentTransactions.vue'

const financeStore = useFinanceStore()
const authStore = useAuthStore()
const isLoading = ref(true)

const loadDashboardData = async () => {
  try {
    isLoading.value = true
    // If authenticated, fetch from API; if guest, store should return mock data
    await Promise.all([
      financeStore.fetchSummary(),
      financeStore.fetchTransactions(),
      // fetch budgets for current month (format YYYY-MM-DD)
      financeStore.fetchBudgets(new Date().toISOString().slice(0, 7) + '-01')
    ])
  } catch (error) {
    console.error('Failed to load dashboard data', error)
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem 1rem 5rem;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
  min-height: 100vh;
  position: relative;
}

/* Simple loading spinner – matches glassy style */
.loading-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  z-index: 200;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid rgba(0, 88, 190, 0.2);
  border-top: 4px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.loading-overlay p {
  font-family: var(--font-family-sans);
  color: var(--color-on-surface);
  font-size: var(--text-body-md);
}
</style>