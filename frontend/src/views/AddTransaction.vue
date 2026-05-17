<template>
  <div class="add-transaction-page">
    <!-- Background decorative blurs -->
    <div class="bg-blur bg-blur-1"></div>
    <div class="bg-blur bg-blur-2"></div>
    <div class="bg-blur bg-blur-3"></div>
    <div class="noise-overlay"></div>

    <!-- Header -->
    <header class="page-header">
      <button class="back-btn" @click="goBack">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1 class="page-title">Add Transaction</h1>
      <div class="placeholder"></div>
    </header>

    <main class="main-content">
      <!-- Step 1: Category selection (always visible first) -->
      <section class="category-section">
        <h2 class="category-title">Select Category</h2>
        <div v-if="categoriesLoading" class="loading-spinner">
          <div class="spinner"></div>
          <p>Loading categories...</p>
        </div>
        <div v-else-if="expenseCategories.length === 0 && incomeCategories.length === 0" class="no-categories">
          <p>No categories found. Please add a category first.</p>
        </div>
        <div v-else class="category-grid">
          <!-- Expense categories -->
          <div class="category-group" v-if="expenseCategories.length">
            <div class="group-title">Expenses</div>
            <div class="category-buttons">
              <button
                v-for="cat in expenseCategories"
                :key="cat.cat_id"
                class="category-card"
                :class="{ 'category-card--selected': selectedCategory?.cat_id === cat.cat_id }"
                @click="selectCategory(cat)"
              >
                <div class="category-icon" :style="{ backgroundColor: getCategoryColor(cat) }">
                  <span class="material-symbols-outlined">{{ cat.cat_icon || 'receipt' }}</span>
                </div>
                <span class="category-name">{{ cat.cat_name }}</span>
              </button>
            </div>
          </div>
          <!-- Income categories -->
          <div class="category-group" v-if="incomeCategories.length">
            <div class="group-title">Income</div>
            <div class="category-buttons">
              <button
                v-for="cat in incomeCategories"
                :key="cat.cat_id"
                class="category-card"
                :class="{ 'category-card--selected': selectedCategory?.cat_id === cat.cat_id }"
                @click="selectCategory(cat)"
              >
                <div class="category-icon" :style="{ backgroundColor: getCategoryColor(cat) }">
                  <span class="material-symbols-outlined">{{ cat.cat_icon || 'payments' }}</span>
                </div>
                <span class="category-name">{{ cat.cat_name }}</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <!-- Step 2: Transaction details (shown only after category is selected) -->
      <div v-if="selectedCategory" class="transaction-details">
        <!-- Amount card -->
        <section class="amount-card glass-card amount-card--clear">
          <p class="amount-label">Amount</p>
          <div class="amount-input-wrapper">
            <span class="currency-symbol">{{ currencySymbol }}</span>
            <input
              v-model.number="amount"
              type="number"
              step="0.01"
              class="amount-input"
              placeholder="0.00"
            />
          </div>
        </section>

        <!-- Remarks field (always shown) -->
        <section class="remarks-section">
          <label class="field-label">Remarks</label>
          <input
            v-model="remarks"
            type="text"
            class="remarks-input glass-card"
            placeholder="e.g., Coffee, Groceries, Salary..."
          />
        </section>

        <!-- Date field with dynamic label -->
        <section class="date-section">
          <label class="field-label">{{ dateLabel }}</label>
          <input
            v-model="transactionDate"
            type="date"
            class="date-input glass-card"
          />
        </section>
      </div>
    </main>

    <!-- Fixed bottom action button (visible only after category selection) -->
    <div v-if="selectedCategory" class="bottom-action">
      <button class="save-btn" @click="saveTransaction">
        <span class="material-symbols-outlined">check_circle</span>
        Save Transaction
      </button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/finance'
import { usePreferenceStore } from '../stores/preferences'
import { logger } from '../utils/logger'

const router = useRouter()
const store = useFinanceStore()
const prefStore = usePreferenceStore()

// Loading state
const categoriesLoading = ref(true)

// Selected category object
const selectedCategory = ref(null)

// Transaction fields (hidden until category selected)
const amount = ref(0)
const remarks = ref('')
const transactionDate = ref(new Date().toISOString().split('T')[0])

// Category lists
const expenseCategories = computed(() =>
  store.categories.filter(c => c.cat_parent === 'expense')
)
const incomeCategories = computed(() =>
  store.categories.filter(c => c.cat_parent === 'income')
)

// Currency symbol from preferences
const currencySymbol = computed(() => prefStore.preferences?.currencySymbol || '$')

// Dynamic date label based on category type
const dateLabel = computed(() => {
  if (!selectedCategory.value) return 'Date'
  return selectedCategory.value.cat_parent === 'income' ? 'Income Date' : 'Expense Date'
})

// Helper for category icon background color
const getCategoryColor = (cat) => {
  if (cat.cat_color) return `var(--color-${cat.cat_color})`
  return 'var(--color-primary-fixed)'
}

// Select a category and reveal the details form
const selectCategory = (cat) => {
  selectedCategory.value = cat
  // Optionally reset previous values if needed
  amount.value = 0
  remarks.value = ''
  transactionDate.value = new Date().toISOString().split('T')[0]
}

const goBack = () => {
  router.back()
}

const saveTransaction = async () => {
  if (!selectedCategory.value) {
    alert('Please select a category')
    return
  }
  if (amount.value <= 0) {
    alert('Please enter a valid amount')
    return
  }
  if (!remarks.value.trim()) {
    alert('Please enter remarks')
    return
  }

  const newTransaction = {
    description: remarks.value.trim(),
    amount: selectedCategory.value.cat_parent === 'expense' ? -amount.value : amount.value,
    category_id: selectedCategory.value.cat_id,
    transaction_date: transactionDate.value,
    is_recurring: false,
  }

  try {
    await store.addTransaction(newTransaction)
    logger.info('transaction_added_manually', {
      amount: amount.value,
      category_id: selectedCategory.value.cat_id,
      type: selectedCategory.value.cat_parent,
    })
    router.push('/dashboard')
  } catch (err) {
    logger.error('manual_transaction_failed', { error: err.message })
    alert('Failed to add transaction. Please try again.')
  }
}

onMounted(async () => {
  if (store.categories.length === 0) {
    await store.fetchCategories()
  }
  categoriesLoading.value = false
})
</script>

<style scoped>
/* Same styles as before, with small additions for the new layout */
.add-transaction-page {
  min-height: 100vh;
  background: var(--color-background);
  position: relative;
  padding-bottom: 6rem;
}

/* Abstract gradient backgrounds (unchanged) */
.bg-blur {
  position: fixed;
  z-index: -1;
  pointer-events: none;
  border-radius: 50%;
  filter: blur(80px);
  mix-blend-mode: multiply;
}
.bg-blur-1 {
  top: -20%;
  left: -10%;
  width: 70%;
  height: 50%;
  background: var(--color-primary-fixed-dim);
  opacity: 0.3;
}
.bg-blur-2 {
  top: 30%;
  right: -20%;
  width: 60%;
  height: 60%;
  background: var(--color-secondary-container);
  opacity: 0.2;
  filter: blur(100px);
}
.bg-blur-3 {
  bottom: -10%;
  left: 10%;
  width: 80%;
  height: 40%;
  background: var(--color-tertiary-fixed-dim);
  opacity: 0.2;
  filter: blur(90px);
}
.noise-overlay {
  position: fixed;
  inset: 0;
  background-image: url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjxyZWN0IHdpZHRoPSIxIiBoZWlnaHQ9IjEiIGZpbGw9IiMwMDAiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==");
  opacity: 0.5;
  pointer-events: none;
  z-index: -1;
  mix-blend-mode: overlay;
}

/* Header */
.page-header {
  position: sticky;
  top: 0;
  z-index: 50;
  background: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(12px);
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.6);
}
.back-btn, .placeholder {
  width: 2.5rem;
  height: 2.5rem;
}
.back-btn {
  background: rgba(255, 255, 255, 0.5);
  border: none;
  border-radius: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}
.back-btn .material-symbols-outlined {
  font-size: 1.5rem;
  color: var(--color-primary);
}
.page-title {
  font-family: var(--font-family-headline);
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--color-primary);
  margin: 0;
}

/* Main content */
.main-content {
  max-width: 28rem;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

/* Glass card base */
.glass-card {
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 1rem;
}

/* Category section */
.category-title {
  font-size: var(--text-headline-md);
  font-weight: 600;
  margin-bottom: 0.75rem;
}
.category-group {
  margin-bottom: 1.5rem;
}
.group-title {
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  margin-bottom: 0.75rem;
}
.category-buttons {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
}
.category-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}
.category-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}
.category-card--selected {
  background: rgba(0, 88, 190, 0.15);
  border-color: var(--color-primary);
}
.category-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-fixed);
  color: var(--color-primary);
}
.category-name {
  font-size: 0.7rem;
  font-weight: 500;
  text-align: center;
  color: var(--color-on-surface);
}

/* Loading & empty states */
.loading-spinner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
}
.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid var(--color-outline-variant);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.no-categories {
  text-align: center;
  padding: 2rem;
  background: rgba(255,255,255,0.5);
  border-radius: 1rem;
  color: var(--color-on-surface-variant);
}

/* Transaction details (appear after category selection) */
.transaction-details {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  animation: fadeIn 0.3s ease;
}
@keyframes fadeIn {
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Amount card (clearer card view) */
.amount-card--clear {
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(255, 255, 255, 0.8);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.05), 0 0 0 1px rgba(0, 88, 190, 0.1);
}
.amount-card {
  padding: 1.5rem;
  text-align: center;
  position: relative;
  overflow: hidden;
}
.amount-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 1px;
  background: linear-gradient(to right, transparent, white, transparent);
}
.amount-label {
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  margin-bottom: 0.5rem;
}
.amount-input-wrapper {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}
.currency-symbol {
  font-family: var(--font-family-headline);
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--color-primary);
}
.amount-input {
  background: transparent;
  border: none;
  outline: none;
  font-family: var(--font-family-headline);
  font-size: 2rem;
  font-weight: 700;
  color: var(--color-primary);
  text-align: center;
  width: 180px;
  padding: 0;
}
.amount-input::placeholder {
  color: rgba(0, 88, 190, 0.4);
}

/* Remarks & date fields */
.remarks-section, .date-section {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}
.field-label {
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  color: var(--color-on-surface-variant);
}
.remarks-input, .date-input {
  padding: 0.75rem 1rem;
  width: 100%;
  box-sizing: border-box;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
  background: rgba(255, 255, 255, 0.6);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.4);
  border-radius: 1rem;
}
.remarks-input:focus, .date-input:focus {
  outline: none;
  border-color: var(--color-primary);
}

/* Fixed bottom action button */
.bottom-action {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 1rem;
  padding-bottom: calc(1rem + env(safe-area-inset-bottom));
  background: linear-gradient(to top, var(--color-surface), rgba(248, 249, 250, 0.9), transparent);
  z-index: 40;
  max-width: 28rem;
  margin: 0 auto;
}
.save-btn {
  width: 100%;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 1rem;
  padding: 0.875rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 1rem;
  font-weight: 600;
  box-shadow: 0 4px 20px rgba(0, 88, 190, 0.3);
  cursor: pointer;
  transition: all 0.2s;
}
.save-btn:hover {
  opacity: 0.9;
}
.save-btn:active {
  transform: scale(0.98);
}
</style>