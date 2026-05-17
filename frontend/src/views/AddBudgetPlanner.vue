<template>
  <div class="setup-wizard">
    <!-- Persistent Page Header -->
    <div class="page-header">
      <button class="back-btn" @click="goToMainPage">
        <span class="material-symbols-outlined">arrow_back</span>
      </button>
      <h1>Budget Setup</h1>
      <div class="placeholder"></div>
    </div>

    <!-- Step 1: Month Selection -->
    <div v-if="step === 1" class="step-container">
      <div class="wizard-card glass-card">
        <div class="card-header">
          <span class="step-badge">Step 1 of 4</span>
          <h2>📅 Choose your budget month</h2>
          <p class="subtitle">Select the month you want to plan your finances for.</p>
        </div>
        <div class="month-options">
          <label class="option-card" :class="{ active: monthOption === 'current' }">
            <input type="radio" v-model="monthOption" value="current" class="hidden-radio" />
            <div class="option-content">
              <span class="material-symbols-outlined">today</span>
              <div class="option-text">
                <strong>Current month</strong>
                <span>{{ currentMonthName }}</span>
              </div>
            </div>
          </label>
          <label class="option-card" :class="{ active: monthOption === 'other' }">
            <input type="radio" v-model="monthOption" value="other" class="hidden-radio" />
            <div class="option-content">
              <span class="material-symbols-outlined">calendar_month</span>
              <div class="option-text">
                <strong>Another month</strong>
                <span>Pick a specific date</span>
              </div>
            </div>
          </label>
          <div v-if="monthOption === 'other'" class="custom-month-picker">
            <label>Select month:</label>
            <input type="month" v-model="selectedMonth" class="month-input" />
          </div>
        </div>
        <div class="action-buttons">
          <button class="primary-btn" @click="nextStep">Continue →</button>
        </div>
      </div>
    </div>

    <!-- Step 2: Income Categories (Grid + Calculator) -->
    <div v-if="step === 2" class="step-container">
      <div class="wizard-card glass-card">
        <div class="card-header">
          <span class="step-badge">Step 2 of 4</span>
          <h2>💰 Income Sources</h2>
          <p class="subtitle">Tap a category to set its expected amount.</p>
        </div>
        <div class="category-grid">
          <div v-for="cat in incomeCategories" :key="cat.cat_id" class="grid-card"
            :class="{ selected: selectedCategory?.cat_id === cat.cat_id }" @click="openCalculator(cat, 'income')">
            <div class="grid-icon" :style="{ backgroundColor: getCategoryColor(cat) }">
              <span class="material-symbols-outlined">{{ cat.cat_icon || 'payments' }}</span>
            </div>
            <div class="grid-name">{{ cat.cat_name }}</div>
            <div v-if="incomeAmounts[cat.cat_id] > 0" class="grid-amount">
              {{ formatCurrency(incomeAmounts[cat.cat_id]) }}
            </div>
          </div>
        </div>
        <div class="progress-summary" v-if="totalIncome > 0">
          <div class="summary-row">
            <span>Total Income:</span>
            <strong>{{ formatCurrency(totalIncome) }}</strong>
          </div>
        </div>
        <div class="action-buttons">
          <button class="secondary-btn" @click="step = 1">← Back</button>
          <button class="primary-btn" :disabled="totalIncome === 0" @click="step = 3">Continue →</button>
        </div>
      </div>
    </div>

    <!-- Step 3: Fixed Expenses (Grid + Calculator) -->
    <div v-if="step === 3" class="step-container">
      <div class="wizard-card glass-card">
        <div class="card-header">
          <span class="step-badge">Step 3 of 4</span>
          <h2>🏠 Fixed Expenses</h2>
          <p class="subtitle">Tap a category to enter its monthly fixed amount.</p>
        </div>
        <div class="category-grid">
          <div v-for="cat in expenseCategories" :key="cat.cat_id" class="grid-card"
            :class="{ selected: selectedCategory?.cat_id === cat.cat_id }" @click="openCalculator(cat, 'expense')">
            <div class="grid-icon" :style="{ backgroundColor: getCategoryColor(cat) }">
              <span class="material-symbols-outlined">{{ cat.cat_icon || 'receipt' }}</span>
            </div>
            <div class="grid-name">{{ cat.cat_name }}</div>
            <div v-if="expenseAmounts[cat.cat_id] > 0" class="grid-amount">
              {{ formatCurrency(expenseAmounts[cat.cat_id]) }}
            </div>
          </div>
        </div>
        <div class="progress-summary" v-if="totalFixedExpenses > 0">
          <div class="summary-row">
            <span>Total Fixed Expenses:</span>
            <strong>{{ formatCurrency(totalFixedExpenses) }}</strong>
          </div>
          <div class="summary-row" v-if="remainingAfterFixedRaw > 0">
            <span>Remaining after fixed:</span>
            <strong>{{ formatCurrency(remainingAfterFixedRaw) }}</strong>
          </div>
        </div>
        <div class="action-buttons">
          <button class="secondary-btn" @click="step = 2">← Back</button>
          <button class="primary-btn" :disabled="totalFixedExpenses === 0" @click="processExpenses">Continue →</button>
        </div>
      </div>
    </div>

    <!-- Step 4: Budget Distribution -->
    <div v-if="step === 4" class="step-container">
      <div class="wizard-card glass-card">
        <div class="card-header">
          <span class="step-badge">Step 4 of 4</span>
          <h2>📊 Your Budget Summary</h2>
          <p class="subtitle">Review your income, fixed expenses, and savings plan.</p>
        </div>

        <div class="summary-box">
          <div class="summary-row">
            <span>💰 Total Income</span>
            <strong>{{ formatCurrency(totalIncome) }}</strong>
          </div>
          <div class="summary-row">
            <span>🏠 Fixed Expenses</span>
            <strong>{{ formatCurrency(totalFixedExpenses) }}</strong>
          </div>
          <div class="summary-row">
            <span>📌 Remaining after fixed</span>
            <strong>{{ formatCurrency(remainingAfterFixed) }}</strong>
          </div>
          <div class="summary-row highlight">
            <span>💾 Savings</span>
            <div class="savings-control">
              <span class="editable-percent">
                <input type="number" v-model.number="savingsPercent" min="0" max="100" step="5" />%
              </span>
              <span class="savings-amount">{{ formatCurrency(savingsAmount) }}</span>
            </div>
          </div>
        </div>

        <!-- Variable spending categories (optional budgets) -->
        <div class="variable-section">
          <p class="section-subtitle">Variable spending (optional)</p>
          <p class="section-hint">Assign a budget to any expense category you want to track.</p>
          <div class="variable-list">
            <div v-for="cat in expenseCategories" :key="cat.cat_id" class="variable-item">
              <div class="cat-info">
                <span class="material-symbols-outlined">{{ cat.cat_icon || 'receipt' }}</span>
                <span class="cat-name">{{ cat.cat_name }}</span>
              </div>
              <div class="cat-budget">
                <span class="currency">{{ currencySymbol }}</span>
                <input type="number" v-model.number="variableBudgets[cat.cat_id]" step="10" placeholder="0" />
              </div>
            </div>
          </div>
          <div class="total-variable" :class="{ mismatch: totalVariableAllocated > flexibleBudget }">
            Total variable budget: {{ formatCurrency(totalVariableAllocated) }}
            <span v-if="totalVariableAllocated > flexibleBudget" class="warning">⚠️ Exceeds flexible budget</span>
            <span v-else-if="totalVariableAllocated < flexibleBudget" class="info">💡 You have {{ formatCurrency(flexibleBudget - totalVariableAllocated) }} unallocated</span>
            <span v-else class="success">✓ Fully allocated</span>
          </div>
        </div>

        <div class="action-buttons">
          <button class="secondary-btn" @click="step = 3">← Back</button>
          <button class="primary-btn" @click="saveBudgets" :disabled="saving || totalVariableAllocated > flexibleBudget">
            {{ saving ? 'Saving...' : 'Save Budget' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reusable Calculator Component -->
    <AmountCalculator v-if="calculatorVisible" :title="selectedCategory?.cat_name || 'Enter amount'"
      :initial-amount="tempAmountNum" :currency-symbol="currencySymbol" @save="handleCalculatorSave"
      @close="closeCalculator" />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/finance'
import { usePreferenceStore } from '../stores/preferences'
import { logger } from '../utils/logger'
import AmountCalculator from '../components/AmountCalculator.vue'

const router = useRouter()
const financeStore = useFinanceStore()
const prefStore = usePreferenceStore()
const saving = ref(false)

// Step
const step = ref(1)

// Month selection
const monthOption = ref('current')
const selectedMonth = ref('')
const currentMonthName = computed(() => {
  const now = new Date()
  return now.toLocaleString('default', { month: 'long', year: 'numeric' })
})
const getBudgetMonth = () => {
  if (monthOption.value === 'current') {
    const now = new Date()
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  } else {
    return selectedMonth.value ? selectedMonth.value + '-01' : ''
  }
}

// Categories
const incomeCategories = ref([])
const expenseCategories = ref([])
const incomeAmounts = ref({})      // amount per income category (fixed)
const expenseAmounts = ref({})     // amount per expense category (fixed)
const totalIncome = ref(0)
const totalFixedExpenses = ref(0)
const remainingAfterFixedRaw = ref(0)

// Calculator state
const calculatorVisible = ref(false)
const selectedCategory = ref(null)
const currentType = ref(null)   // 'income' or 'expense'
const tempAmountNum = ref(0)

// Step 4 – variable spending per expense category (optional)
const variableBudgets = ref({})   // key: cat_id, value: budget amount
const totalVariableAllocated = computed(() => {
  let sum = 0
  for (const cat of expenseCategories.value) {
    sum += variableBudgets.value[cat.cat_id] || 0
  }
  return sum
})

// Step 4 – summary values
const savingsPercent = ref(30)
const savingsAmount = ref(0)
const flexibleBudget = ref(0)
const remainingAfterFixed = ref(0)

const totalAllocated = computed(() => totalVariableAllocated.value) // used for display

const currencySymbol = computed(() => prefStore.preferences?.currencySymbol || '$')
const formatCurrency = (val) => `${currencySymbol.value}${(val || 0).toFixed(2)}`

const getSpentForGroup = (groupName) => {
  // Not used in this version, but kept for reference
  return financeStore.spendingByGroup?.get(groupName) || 0
}

const getCategoryColor = (cat) => {
  if (cat.cat_color) return `var(--color-${cat.cat_color})`
  return cat.cat_parent === 'expense' ? 'var(--color-primary-fixed)' : 'var(--color-secondary-fixed)'
}

// Open calculator for a category (Step 2 & 3)
function openCalculator(cat, type) {
  selectedCategory.value = cat
  currentType.value = type
  const currentVal = type === 'income' ? incomeAmounts.value[cat.cat_id] : expenseAmounts.value[cat.cat_id]
  tempAmountNum.value = currentVal || 0
  calculatorVisible.value = true
}

function handleCalculatorSave({ amount, close }) {
  if (currentType.value === 'income') {
    incomeAmounts.value[selectedCategory.value.cat_id] = amount
    let sum = 0
    Object.values(incomeAmounts.value).forEach(v => { sum += v || 0 })
    totalIncome.value = sum
  } else {
    expenseAmounts.value[selectedCategory.value.cat_id] = amount
    let sum = 0
    Object.values(expenseAmounts.value).forEach(v => { sum += v || 0 })
    totalFixedExpenses.value = sum
  }
  if (close) closeCalculator()
}

function closeCalculator() {
  calculatorVisible.value = false
  selectedCategory.value = null
  tempAmountNum.value = 0
}

// Navigation
function nextStep() {
  if (step.value === 1 && monthOption.value === 'other' && !selectedMonth.value) {
    alert('Please select a month')
    return
  }
  step.value++
}

function processExpenses() {
  remainingAfterFixed.value = totalIncome.value - totalFixedExpenses.value
  if (remainingAfterFixed.value < 0) {
    alert('Your fixed expenses exceed your income. Please adjust.')
    return
  }
  savingsAmount.value = Math.round((remainingAfterFixed.value * savingsPercent.value) / 100)
  flexibleBudget.value = remainingAfterFixed.value - savingsAmount.value

  // Initialize variableBudgets for all expense categories (default 0)
  expenseCategories.value.forEach(cat => {
    if (variableBudgets.value[cat.cat_id] === undefined) {
      variableBudgets.value[cat.cat_id] = 0
    }
  })
  step.value = 4
}

async function saveBudgets() {
  saving.value = true
  const month = getBudgetMonth()
  if (!month) {
    alert('Invalid month')
    saving.value = false
    return
  }
  try {
    // Income budgets per group (sum amounts per group)
    const incomeGroups = new Map()
    for (const cat of incomeCategories.value) {
      const amount = incomeAmounts.value[cat.cat_id] || 0
      if (amount > 0) {
        const group = cat.cat_group || cat.cat_name
        incomeGroups.set(group, (incomeGroups.get(group) || 0) + amount)
      }
    }
    for (const [group, amount] of incomeGroups.entries()) {
      await financeStore.updateBudget({
        category: group,
        amount: amount,
        month: month,
        remark: 'Income budget (setup wizard)'
      })
    }

    // Variable expense budgets per category (only where amount > 0)
    for (const cat of expenseCategories.value) {
      const amount = variableBudgets.value[cat.cat_id] || 0
      if (amount > 0) {
        await financeStore.updateBudget({
          category: cat.cat_name,  // store per category name
          amount: amount,
          month: month,
          remark: 'Variable spending budget (setup wizard)'
        })
      }
    }

    logger.info('budget_setup_completed', {
      month,
      totalIncome: totalIncome.value,
      totalFixed: totalFixedExpenses.value,
      savings: savingsAmount.value,
      variableTotal: totalVariableAllocated.value
    })
    alert('Budget saved successfully!')
    router.push('/budgets')
  } catch (err) {
    logger.error('budget_setup_failed', err)
    alert('Failed to save budget. Please try again.')
  } finally {
    saving.value = false
  }
}

function goToMainPage() {
  router.push('/budgets')
}

// Load initial data
onMounted(async () => {
  if (financeStore.categories.length === 0) {
    await financeStore.fetchCategories()
  }
  if (financeStore.transactions.length === 0) {
    await financeStore.fetchTransactions()
  }
  incomeCategories.value = financeStore.categories.filter(c => c.cat_parent === 'income')
  expenseCategories.value = financeStore.categories.filter(c => c.cat_parent === 'expense')
  incomeCategories.value.forEach(cat => { incomeAmounts.value[cat.cat_id] = 0 })
  expenseCategories.value.forEach(cat => { expenseAmounts.value[cat.cat_id] = 0 })
  // Initialize variableBudgets
  expenseCategories.value.forEach(cat => {
    if (variableBudgets.value[cat.cat_id] === undefined) {
      variableBudgets.value[cat.cat_id] = 0
    }
  })
})

// Watchers
watch([totalIncome, totalFixedExpenses], () => {
  remainingAfterFixedRaw.value = totalIncome.value - totalFixedExpenses.value
})

watch(savingsPercent, (newPercent) => {
  savingsAmount.value = Math.round((remainingAfterFixed.value * newPercent) / 100)
  flexibleBudget.value = remainingAfterFixed.value - savingsAmount.value
})

// Ensure variableBudgets is always defined for each expense category
watch(expenseCategories, (newCats) => {
  newCats.forEach(cat => {
    if (variableBudgets.value[cat.cat_id] === undefined) {
      variableBudgets.value[cat.cat_id] = 0
    }
  })
}, { immediate: true, deep: true })
</script>

<style scoped>
/* ===== All styles now use CSS variables from global :root ===== */
.setup-wizard {
  min-height: 100vh;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
  padding: 0 1rem 2rem 1rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.page-header {
  width: 100%;
  max-width: 600px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: 1rem 0 1.5rem 0;
  padding: 0.5rem 0;
}

.back-btn {
  background: none;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: background 0.2s;
}

.back-btn:hover {
  background: rgba(0, 0, 0, 0.05);
}

.back-btn .material-symbols-outlined {
  font-size: 1.5rem;
}

.page-header h1 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
}

.placeholder {
  width: 40px;
}

.step-container {
  max-width: 600px;
  width: 100%;
  margin: 0 auto;
}

.glass-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.6);
}

.wizard-card {
  background: rgba(255, 255, 255, 0.75);
  backdrop-filter: blur(16px);
  border-radius: 2rem;
  padding: 2rem;
  box-shadow: 0 20px 35px -12px rgba(0, 0, 0, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.5);
}

.card-header {
  text-align: center;
  margin-bottom: 2rem;
}

.step-badge {
  display: inline-block;
  background: rgba(0, 88, 190, 0.15);
  color: var(--color-primary);
  font-size: 0.75rem;
  font-weight: 600;
  padding: 0.25rem 0.75rem;
  border-radius: 2rem;
  margin-bottom: 1rem;
}

.wizard-card h2 {
  font-size: 1.75rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  color: var(--color-on-surface);
}

.subtitle {
  color: var(--color-on-surface-variant);
  font-size: 0.95rem;
}

/* Month options */
.month-options {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.option-card {
  background: rgba(255, 255, 255, 0.5);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.25rem;
  padding: 1rem 1.25rem;
  cursor: pointer;
  transition: all 0.2s;
}

.option-card.active {
  background: rgba(0, 88, 190, 0.1);
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(0, 88, 190, 0.15);
}

.option-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.hidden-radio {
  display: none;
}

.option-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.option-content .material-symbols-outlined {
  font-size: 2rem;
  color: var(--color-primary);
}

.option-text strong {
  font-size: 1rem;
  font-weight: 600;
  color: var(--color-on-surface);
}

.option-text span {
  font-size: 0.85rem;
  color: var(--color-on-surface-variant);
}

.custom-month-picker {
  margin-top: 0.75rem;
  margin-left: 3rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.month-input {
  padding: 0.6rem 1rem;
  border-radius: 1rem;
  border: 1px solid #d1d5db;
  background: white;
  width: 200px;
}

/* Category Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  max-height: 450px;
  overflow-y: auto;
  padding: 0.25rem;
}

.grid-card {
  background: rgba(255, 255, 255, 0.5);
  border-radius: 1rem;
  padding: 0.75rem 0.5rem;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
}

.grid-card.selected {
  background: rgba(0, 88, 190, 0.15);
  border: 1px solid var(--color-primary);
}

.grid-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-2px);
}

.grid-icon {
  width: 48px;
  height: 48px;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  background: var(--color-primary-fixed);
}

.grid-icon .material-symbols-outlined {
  font-size: 1.8rem;
}

.grid-name {
  font-size: 0.8rem;
  font-weight: 500;
  margin-bottom: 0.25rem;
}

.grid-amount {
  font-size: 0.7rem;
  font-weight: 600;
  color: var(--color-primary);
  background: rgba(255, 255, 255, 0.6);
  padding: 0.1rem 0.3rem;
  border-radius: 1rem;
}

/* Progress summary */
.progress-summary {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.25rem 0;
}

/* Step 4 summary */
.summary-box {
  background: rgba(255, 255, 255, 0.6);
  border-radius: 1.25rem;
  padding: 1rem;
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0.5rem;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  font-size: 1rem;
}

.summary-row:last-child {
  border-bottom: none;
}

.summary-row.highlight {
  background: rgba(0, 150, 0, 0.08);
  border-radius: 0.75rem;
  margin: 0.25rem 0;
  padding: 0.75rem 0.5rem;
  border-bottom: none;
}

.summary-row span:first-child {
  font-weight: 500;
  color: var(--color-on-surface);
}

.summary-row strong {
  font-weight: 700;
  color: var(--color-on-surface);
}

/* Savings control: inline percent input + amount text */
.savings-control {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.editable-percent {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  background: white;
  border: 1px solid #d1d5db;
  border-radius: 2rem;
  padding: 0.2rem 0.6rem;
}

.editable-percent input {
  width: 45px;
  border: none;
  text-align: center;
  font-size: 0.9rem;
  font-weight: 500;
  outline: none;
  background: transparent;
}

.editable-percent input:focus {
  outline: none;
}

.savings-amount {
  font-weight: 700;
  color: var(--color-secondary);
}

/* Variable spending list */
.variable-section {
  border-top: 1px solid rgba(0, 0, 0, 0.1);
  padding-top: 1rem;
}
.section-hint {
  font-size: 0.8rem;
  color: var(--color-outline);
  margin-bottom: 1rem;
}
.variable-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
  padding-right: 0.25rem;
}
.variable-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0.75rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 0.75rem;
}
.cat-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.cat-info .material-symbols-outlined {
  font-size: 1.3rem;
  color: var(--color-primary);
}
.cat-name {
  font-weight: 500;
}
.cat-budget {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}
.cat-budget input {
  width: 90px;
  padding: 0.3rem 0.5rem;
  border-radius: 1rem;
  border: 1px solid #ccc;
  text-align: right;
  font-size: 0.9rem;
}
.total-variable {
  text-align: right;
  margin-top: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
  padding: 0.5rem;
  background: rgba(255, 255, 255, 0.6);
  border-radius: 0.75rem;
}
.total-variable.mismatch { color: var(--color-error); }
.total-variable .warning { color: var(--color-error); font-size: 0.8rem; margin-left: 0.5rem; }
.total-variable .info { color: #2563eb; font-size: 0.8rem; margin-left: 0.5rem; }
.total-variable .success { color: #15803d; font-size: 0.8rem; margin-left: 0.5rem; }

/* Flexible section */
.flexible-section {
  margin-top: 1rem;
}

.section-subtitle {
  font-weight: 600;
  margin-bottom: 0.75rem;
}

.group-distribution {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.6rem 0.8rem;
  background: rgba(255, 255, 255, 0.4);
  border-radius: 0.75rem;
  margin-bottom: 0.5rem;
}

.group-info {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.2rem;
}

.group-name {
  font-weight: 600;
  font-size: 0.9rem;
}

.group-spent {
  font-size: 0.7rem;
  color: var(--color-outline);
}

.group-amount {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.group-amount input {
  width: 100px;
  padding: 0.4rem;
  border-radius: 0.75rem;
  border: 1px solid #ccc;
  text-align: right;
  font-size: 0.9rem;
}

.total-flexible {
  text-align: right;
  margin-top: 1rem;
  font-weight: 600;
  font-size: 0.9rem;
}

.total-flexible.mismatch {
  color: var(--color-error);
}

.total-flexible .warning {
  color: var(--color-error);
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

.total-flexible .success {
  color: #15803d;
  font-size: 0.8rem;
  margin-left: 0.5rem;
}

/* Action buttons */
.action-buttons {
  display: flex;
  justify-content: space-between;
  margin-top: 1.5rem;
  gap: 1rem;
}

.primary-btn,
.secondary-btn {
  padding: 0.75rem 1.5rem;
  border-radius: 2rem;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
  border: none;
}

.primary-btn {
  background: var(--color-primary);
  color: white;
}

.primary-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.secondary-btn {
  background: rgba(0, 0, 0, 0.08);
  color: var(--color-on-surface);
}

.secondary-btn:hover {
  background: rgba(0, 0, 0, 0.12);
  transform: translateY(-1px);
}

/* Responsive */
@media (max-width: 560px) {
  .wizard-card {
    padding: 1.5rem;
  }

  .category-grid {
    grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
  }

  .group-distribution {
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .group-amount input {
    width: 80px;
  }
}
</style>