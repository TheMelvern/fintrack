<template>
  <div class="transactions-page">
    <!-- Header with back button and title -->
    <div class="page-header">
      <div class="header-content">
        <button class="back-button" @click="goBack">
          <span class="material-symbols-outlined">arrow_back</span>
        </button>
        <h1 class="page-title">History</h1>
        <button class="filter-button" @click="showAdvancedFilter = true">
          <span class="material-symbols-outlined">tune</span>
        </button>
      </div>
    </div>

    <!-- Date Range Trigger -->
    <section class="filters-section">
      <button class="date-range-trigger" @click="openDateModal">
        <span class="material-symbols-outlined">calendar_today</span>
        <span>{{ dateRangeDisplayText }}</span>
        <span class="material-symbols-outlined">expand_more</span>
      </button>
    </section>

    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading transactions...</p>
    </div>

    <!-- No Data State -->
    <div v-else-if="!hasTransactions" class="empty-state-container">
      <span class="material-symbols-outlined empty-icon">receipt_long</span>
      <p class="empty-message">No transactions yet</p>
      <p class="empty-hint">Add your first expense or income!</p>
    </div>

    <!-- Grouped Transactions -->
    <div v-else class="transactions-list">
      <div v-for="(group, date) in groupedTransactions" :key="date" class="date-card glass-card">
        <h2 class="date-header">{{ formatDateHeader(date) }}</h2>
        <div class="group-items">
          <TransactionItem
            v-for="tx in group"
            :key="tx.id"
            :transaction="tx"
          />
        </div>
      </div>
    </div>

    <BottomNav />

    <!-- Bottom Sheet: Date Range Modal -->
    <div v-if="showDateModal" class="modal-overlay" @click.self="closeDateModal">
      <div class="bottom-sheet">
        <div class="bottom-sheet-header">
          <h3>Select Date Range</h3>
          <button class="close-btn" @click="closeDateModal">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="bottom-sheet-content">
          <div class="date-input-group">
            <label class="date-label">From</label>
            <input type="date" v-model="tempDateFrom" class="date-input" />
          </div>
          <div class="date-input-group">
            <label class="date-label">To</label>
            <input type="date" v-model="tempDateTo" class="date-input" />
          </div>
        </div>
        <div class="bottom-sheet-actions">
          <button class="clear-btn" @click="resetToDefaultRange">Reset to Last 7 Days</button>
          <button class="apply-btn" @click="applyDateRange">Apply</button>
        </div>
      </div>
    </div>

    <!-- Bottom Sheet: Advanced Category Filter -->
    <div v-if="showAdvancedFilter" class="modal-overlay" @click.self="closeAdvancedFilter">
      <div class="bottom-sheet">
        <div class="bottom-sheet-header">
          <h3>Filter by Category</h3>
          <button class="close-btn" @click="closeAdvancedFilter">
            <span class="material-symbols-outlined">close</span>
          </button>
        </div>
        <div class="bottom-sheet-content">
          <div class="category-filter-list">
            <label v-for="cat in availableCategories" :key="cat.id" class="category-checkbox">
              <input type="checkbox" v-model="selectedCategories" :value="cat.id" />
              <span>{{ cat.name }}</span>
            </label>
          </div>
        </div>
        <div class="bottom-sheet-actions">
          <button class="clear-btn" @click="clearCategoryFilter">Clear All</button>
          <button class="apply-btn" @click="applyCategoryFilter">Apply</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/finance'
import BottomNav from '../components/BottomNav.vue'
import TransactionItem from '../components/TransactionItem.vue'
import { logger } from '../utils/logger'

const router = useRouter()
const store = useFinanceStore()

// Loading state
const isLoading = ref(true)

// ---------- Date range ----------
const getDateXDaysAgo = (days) => {
  const date = new Date()
  date.setDate(date.getDate() - days)
  return date.toISOString().split('T')[0]
}
const getToday = () => new Date().toISOString().split('T')[0]

const DEFAULT_FROM = getDateXDaysAgo(7)
const DEFAULT_TO = getToday()

const appliedDateFrom = ref(DEFAULT_FROM)
const appliedDateTo = ref(DEFAULT_TO)
const tempDateFrom = ref(DEFAULT_FROM)
const tempDateTo = ref(DEFAULT_TO)
const showDateModal = ref(false)

const dateRangeDisplayText = computed(() => {
  return `${formatDateForDisplay(appliedDateFrom.value)} – ${formatDateForDisplay(appliedDateTo.value)}`
})

const formatDateForDisplay = (dateStr) => {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short' })
}

const openDateModal = () => {
  tempDateFrom.value = appliedDateFrom.value
  tempDateTo.value = appliedDateTo.value
  showDateModal.value = true
}
const closeDateModal = () => { showDateModal.value = false }
const applyDateRange = () => {
  appliedDateFrom.value = tempDateFrom.value
  appliedDateTo.value = tempDateTo.value
  showDateModal.value = false
}
const resetToDefaultRange = () => {
  tempDateFrom.value = DEFAULT_FROM
  tempDateTo.value = DEFAULT_TO
  appliedDateFrom.value = DEFAULT_FROM
  appliedDateTo.value = DEFAULT_TO
  showDateModal.value = false
}

// ---------- Advanced category filter ----------
const selectedCategories = ref([])
const showAdvancedFilter = ref(false)

const availableCategories = computed(() => {
  return store.categories || []
})

const applyCategoryFilter = () => {
  showAdvancedFilter.value = false
}
const clearCategoryFilter = () => {
  selectedCategories.value = []
}
const closeAdvancedFilter = () => {
  showAdvancedFilter.value = false
}

// ---------- Transaction filtering ----------
const hasTransactions = computed(() => store.transactions.length > 0)

const filteredTransactions = computed(() => {
  let tx = store.transactions

  // Date range filter
  const fromDate = new Date(appliedDateFrom.value)
  fromDate.setHours(0, 0, 0, 0)
  const toDate = new Date(appliedDateTo.value)
  toDate.setHours(23, 59, 59, 999)
  tx = tx.filter(t => {
    const txDate = new Date(t.date)
    return txDate >= fromDate && txDate <= toDate
  })

  // Advanced category filter
  if (selectedCategories.value.length > 0) {
    tx = tx.filter(t => selectedCategories.value.includes(t.category_id))
  }

  return tx
})

// Group by date
const groupedTransactions = computed(() => {
  const groups = {}
  filteredTransactions.value.forEach(tx => {
    const date = new Date(tx.date).toDateString()
    if (!groups[date]) groups[date] = []
    groups[date].push(tx)
  })
  return groups
})

const formatDateHeader = (dateStr) => {
  const date = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Navigation
const goBack = () => {
  router.back()
}

// Load data
const loadData = async () => {
  isLoading.value = true
  try {
    // Load categories first (needed for transaction display)
    await store.fetchCategories()
    await store.fetchTransactions()
    logger.info('transactions_page_loaded', { 
      count: store.transactions.length,
      categories_count: store.categories.length 
    })
  } catch (err) {
    logger.error('failed_to_load_transactions_page', { error: err.message })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* ===== Page Layout ===== */
.transactions-page {
  padding: 0 1rem 6rem;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
  min-height: 100vh;
}

/* ===== Header ===== */
.page-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(20px);
  margin: 0 -1rem 1.5rem -1rem;
  padding: 1rem 1rem 0.75rem 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.8);
}
.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.back-button, .filter-button {
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2rem;
  width: 2.5rem;
  height: 2.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}
.back-button:hover, .filter-button:hover {
  background: rgba(255, 255, 255, 1);
}
.back-button .material-symbols-outlined,
.filter-button .material-symbols-outlined {
  font-size: 1.5rem;
  color: var(--color-primary);
}
.page-title {
  font-family: var(--font-family-headline);
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--color-on-surface);
  margin: 0;
}

/* ===== Date Range Trigger ===== */
.filters-section {
  margin-bottom: 1.5rem;
}
.date-range-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2rem;
  padding: 0.5rem 1rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-sm);
  color: var(--color-on-surface);
  cursor: pointer;
  transition: all 0.2s;
  width: fit-content;
}
.date-range-trigger:hover {
  background: rgba(255, 255, 255, 0.7);
}
.date-range-trigger .material-symbols-outlined {
  font-size: 1.2rem;
  color: var(--color-primary);
}

/* ===== Loading & Empty States ===== */
.loading-container,
.empty-state-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 88, 190, 0.2);
  border-top: 3px solid var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
.empty-icon {
  font-size: 4rem;
  color: var(--color-outline);
  margin-bottom: 1rem;
  opacity: 0.6;
}
.empty-message {
  font-size: var(--text-body-lg);
  font-weight: 500;
  color: var(--color-on-surface);
  margin: 0 0 0.5rem 0;
}
.empty-hint {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
  margin: 0;
}

/* ===== Glass Transaction Cards ===== */
.transactions-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.date-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1rem;
  padding: 1rem;
}
.date-header {
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  margin-bottom: 0.75rem;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
}
.group-items {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.group-items .transaction-item {
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  padding-bottom: 0.5rem;
}
.group-items .transaction-item:last-child {
  border-bottom: none;
  padding-bottom: 0;
}

/* ===== Bottom Sheets ===== */
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
  align-items: flex-end;
  justify-content: center;
}
.bottom-sheet {
  width: 100%;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(20px);
  border-radius: 1.5rem 1.5rem 0 0;
  padding: 1.5rem;
  animation: slideUp 0.3s ease;
}
@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}
.bottom-sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}
.bottom-sheet-header h3 {
  font-family: var(--font-family-headline);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
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
.bottom-sheet-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.category-filter-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 50vh;
  overflow-y: auto;
}
.category-checkbox {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
  color: var(--color-on-surface);
  padding: 0.25rem 0;
}
.category-checkbox input {
  width: 1.2rem;
  height: 1.2rem;
  cursor: pointer;
}
.date-input-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.date-label {
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  color: var(--color-on-surface-variant);
}
.date-input {
  background: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
  padding: 0.75rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
}
.date-input:focus {
  outline: none;
  border-color: var(--color-primary);
}
.bottom-sheet-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
}
.apply-btn, .clear-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}
.clear-btn {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-on-surface-variant);
}
.clear-btn:hover {
  background: rgba(0, 0, 0, 0.1);
}
.apply-btn {
  background: var(--color-primary);
  color: white;
}
.apply-btn:hover {
  background: var(--color-primary-container);
}
</style>