<template>
  <div class="budget-planner">
    <!-- Loading State -->
    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading budgets...</p>
    </div>

    <template v-else>
      <!-- Budget Summary -->
      <section class="budget-summary">
        <div class="summary-card glass-card curve-bottom">
          <div class="decorative-blur"></div>
          <p class="summary-label">TOTAL BUDGET REMAINING</p>
          <h2 class="summary-amount">{{ formatCurrency(remainingBudget) }}</h2>
          <div class="progress-bar">
            <div class="progress-fill" :style="{ width: `${spentPercent}%` }"></div>
          </div>
          <div class="summary-stats">
            <span>{{ spentPercent }}% used</span>
            <span>{{ formatCurrency(monthlyTotal) }} total</span>
          </div>
        </div>
      </section>

      <!-- Flow Toggle Buttons -->
      <section class="flow-toggle">
        <button class="flow-btn" :class="{ active: selectedFlow === 'in' }" @click="selectedFlow = 'in'">
          <span class="material-symbols-outlined">arrow_downward</span>
          Flow-In
        </button>
        <button class="flow-btn" :class="{ active: selectedFlow === 'out' }" @click="selectedFlow = 'out'">
          <span class="material-symbols-outlined">arrow_upward</span>
          Flow-Out
        </button>
      </section>

      <!-- Group Section (shows only selected flow) -->
      <section class="category-section">
        <div v-if="filteredGroups.length === 0" class="empty-state">
          <span class="material-symbols-outlined">category</span>
          <p>No {{ selectedFlow === 'in' ? 'income' : 'expense' }} groups found.</p>
        </div>
        <div v-else class="category-grid">
          <button v-for="group in filteredGroups" :key="group.name" class="category-card" @click="openBudgetModal(group)">
            <div class="category-icon" :style="{ backgroundColor: getGroupColor(group) }">
              <span class="material-symbols-outlined">{{ group.icon || 'folder' }}</span>
            </div>
            <div class="category-info">
              <span class="category-name">{{ group.name }}</span>
              <div class="category-budget">
                <span class="budget-label">Budget:</span>
                <span class="budget-amount">{{ formatCurrency(group.budget) }}</span>
              </div>
              <div class="category-spent">
                <span class="spent-label">{{ selectedFlow === 'in' ? 'Received:' : 'Spent:' }}</span>
                <span class="spent-amount">{{ formatCurrency(group.spent) }}</span>
              </div>
            </div>
            <div class="category-progress">
              <div class="progress-bar-bg">
                <div class="progress-fill fill-primary" :style="{ width: `${group.percent}%` }"></div>
              </div>
            </div>
            <span class="edit-icon material-symbols-outlined">edit</span>
          </button>
        </div>
      </section>
    </template>

    <BottomNav />

    <!-- Budget Modal (Set/Edit group budget) -->
    <div v-if="showBudgetModal" class="modal-overlay" @click.self="closeBudgetModal">
      <div class="modal glass-card">
        <h3>{{ selectedGroup?.name }} – Budget</h3>
        <div class="modal-content">
          <label>Monthly Budget ({{ currencySymbol }})</label>
          <input type="number" v-model.number="budgetAmount" step="10" class="modal-input" />
        </div>
        <div class="modal-actions">
          <button class="cancel-btn" @click="closeBudgetModal">Cancel</button>
          <button class="save-btn" @click="saveBudget">Save</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { usePreferenceStore } from '../stores/preferences'
import BottomNav from '../components/BottomNav.vue'
import { logger } from '../utils/logger'

const financeStore = useFinanceStore()
const preferenceStore = usePreferenceStore()
const isLoading = ref(true)

// Flow toggle (default to 'in' = income)
const selectedFlow = ref('in')

// Currency symbol
const currencySymbol = computed(() => preferenceStore.preferences?.currencySymbol || '$')

// Helper: safely convert any value to number
const toNumber = (val) => {
  const num = parseFloat(val)
  return isNaN(num) ? 0 : num
}

// Format currency with safe number conversion
const formatCurrency = (value) => {
  const num = toNumber(value)
  return `${currencySymbol.value}${num.toFixed(2)}`
}

// Store computed values (these are already numbers from store)
const remainingBudget = computed(() => toNumber(financeStore.remainingBudget))
const monthlyTotal = computed(() => toNumber(financeStore.monthlyTotalBudget))
const spentPercent = computed(() => {
  const total = monthlyTotal.value
  if (total === 0) return 0
  return ((total - remainingBudget.value) / total * 100).toFixed(1)
})

// ----- Build groups from categories -----
const groupsMap = computed(() => {
  const map = new Map()
  financeStore.categories.forEach(cat => {
    const groupName = cat.cat_group
    if (!groupName) return
    if (!map.has(groupName)) {
      map.set(groupName, {
        name: groupName,
        parent: cat.cat_parent,
        icon: cat.cat_icon || (cat.cat_parent === 'income' ? 'payments' : 'receipt'),
        color: cat.cat_color,
        categories: [],
        budget: 0,
        spent: 0,
      })
    }
    const group = map.get(groupName)
    group.categories.push(cat)
    if (!group.icon && cat.cat_icon) group.icon = cat.cat_icon
    if (!group.color && cat.cat_color) group.color = cat.cat_color
  })
  return map
})

// Merge with budgets (budgets are per category name, sum them for group)
const allGroups = computed(() => {
  const groups = []
  for (const [name, group] of groupsMap.value.entries()) {
    let groupBudget = 0
    for (const cat of group.categories) {
      const budgetEntry = financeStore.budgets?.find(b => b.category === cat.cat_name)
      if (budgetEntry) {
        groupBudget += toNumber(budgetEntry.amount)
      }
    }
    const spent = toNumber(financeStore.spendingByGroup?.get(name))
    const percent = groupBudget === 0 ? 0 : Math.min((spent / groupBudget) * 100, 100)
    groups.push({
      ...group,
      budget: groupBudget,
      spent,
      percent,
    })
  }
  return groups
})

// Filter groups by selected flow
const filteredGroups = computed(() => {
  return allGroups.value.filter(g => g.parent === (selectedFlow.value === 'in' ? 'income' : 'expense'))
})

// Helper: get background color for a group card
const getGroupColor = (group) => {
  if (group.color) return `var(--color-${group.color})`
  return group.parent === 'expense' ? 'var(--color-primary-fixed)' : 'var(--color-secondary-fixed)'
}

// Modal state
const showBudgetModal = ref(false)
const selectedGroup = ref(null)
const budgetAmount = ref(0)

const openBudgetModal = (group) => {
  selectedGroup.value = group
  budgetAmount.value = group.budget
  showBudgetModal.value = true
}
const closeBudgetModal = () => {
  showBudgetModal.value = false
  selectedGroup.value = null
}
const saveBudget = async () => {
  if (!selectedGroup.value || budgetAmount.value < 0) {
    alert('Please enter a valid budget amount (0 or more).')
    return
  }
  try {
    const currentMonth = financeStore.getCurrentMonth()
    await financeStore.updateBudget({
      category: selectedGroup.value.name,
      amount: budgetAmount.value,
      month: currentMonth,
    })
    logger.info('budget_updated', {
      group: selectedGroup.value.name,
      amount: budgetAmount.value,
      month: currentMonth,
    })
    closeBudgetModal()
  } catch (err) {
    logger.error('budget_update_failed', { error: err.message })
    alert('Failed to update budget. Please try again.')
  }
}

const loadData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      financeStore.fetchCategories(),
      financeStore.fetchBudgets(financeStore.getCurrentMonth()),
      financeStore.fetchTransactions(),
      financeStore.fetchSummary(),
    ])
    logger.info('budget_planner_loaded', {
      groups: allGroups.value.length,
      budgets: financeStore.budgets?.length || 0,
    })
  } catch (err) {
    logger.error('budget_planner_load_failed', { error: err.message })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Add styles for flow toggle buttons */
.flow-toggle {
  display: flex;
  gap: 1rem;
  margin: 1rem 0;
  justify-content: center;
}

.flow-btn {
  flex: 1;
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.4);
  backdrop-filter: blur(8px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
  font-weight: 600;
  color: var(--color-on-surface-variant);
  cursor: pointer;
  transition: all 0.2s ease;
}

.flow-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
  box-shadow: 0 2px 8px rgba(0, 88, 190, 0.3);
}

.flow-btn .material-symbols-outlined {
  font-size: 1.25rem;
}

.flow-btn:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-2px);
}

.flow-btn.active:hover {
  background: var(--color-primary-container);
  color: white;
}

/* Existing styles below (keep all original styles) */
.budget-planner {
  padding: 1rem 1rem 6rem;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
  min-height: 100vh;
}

.loading-container {
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
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.glass-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

.budget-summary {
  margin-bottom: 0.5rem;
}

.summary-card {
  position: relative;
  background: linear-gradient(135deg, rgba(0, 88, 190, 0.85), rgba(0, 108, 73, 0.85));
  backdrop-filter: blur(12px);
  border-radius: 1.5rem;
  padding: 1.5rem;
  color: white;
  overflow: hidden;
}

.summary-card.curve-bottom {
  border-radius: 1.5rem 1.5rem 2.5rem 2.5rem;
}

.decorative-blur {
  position: absolute;
  top: -2rem;
  right: -2rem;
  width: 8rem;
  height: 8rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  filter: blur(40px);
  pointer-events: none;
}

.summary-label {
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  letter-spacing: 0.05em;
  text-transform: uppercase;
  margin-bottom: 0.25rem;
  opacity: 0.8;
}

.summary-amount {
  font-family: var(--font-family-headline);
  font-size: 2rem;
  font-weight: 700;
  margin-bottom: 1rem;
}

.progress-bar {
  width: 100%;
  background: rgba(255, 255, 255, 0.3);
  height: 0.5rem;
  border-radius: 9999px;
  overflow: hidden;
  margin: 0.5rem 0;
}

.progress-fill {
  background: var(--color-secondary-container);
  height: 100%;
  border-radius: 9999px;
  transition: width 0.3s;
}

.summary-stats {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  opacity: 0.9;
}

.category-section {
  margin-top: 1rem;
}

.category-group .group-title {
  font-size: 0.85rem;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-on-surface-variant);
  margin-bottom: 1rem;
}

.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.category-card {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.5rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.category-card:hover {
  background: rgba(255, 255, 255, 0.8);
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
}

.category-icon {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 0.5rem;
  transition: transform 0.2s;
}

.category-card:hover .category-icon {
  transform: scale(1.05);
}

.category-icon .material-symbols-outlined {
  font-size: 1.8rem;
}

.category-info {
  width: 100%;
  margin: 0.5rem 0;
}

.category-name {
  font-weight: 600;
  font-size: 1rem;
  display: block;
  margin-bottom: 0.25rem;
}

.category-budget,
.category-spent {
  font-size: 0.75rem;
  display: flex;
  justify-content: center;
  gap: 0.25rem;
}

.budget-label,
.spent-label {
  color: var(--color-on-surface-variant);
}

.budget-amount,
.spent-amount {
  font-weight: 600;
}

.category-progress {
  width: 100%;
  margin-top: 0.5rem;
}

.progress-bar-bg {
  background: var(--color-surface-variant);
  border-radius: 9999px;
  height: 0.25rem;
  overflow: hidden;
}

.fill-primary {
  background: var(--color-primary);
}

.edit-icon {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  font-size: 1.2rem;
  color: var(--color-outline);
  opacity: 0;
  transition: opacity 0.2s;
}

.category-card:hover .edit-icon {
  opacity: 1;
}

.add-category-fab {
  position: fixed;
  bottom: 6rem;
  right: 1rem;
  width: 3.5rem;
  height: 3.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  cursor: pointer;
  transition: transform 0.2s, background 0.2s;
  z-index: 40;
}

.add-category-fab:hover {
  transform: scale(1.05);
  background: var(--color-primary-container);
}

.add-category-fab .material-symbols-outlined {
  font-size: 1.8rem;
}

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
  from {
    opacity: 0;
    transform: scale(0.95);
  }

  to {
    opacity: 1;
    transform: scale(1);
  }
}

.modal h3 {
  font-family: var(--font-family-headline);
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.modal-content {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.modal-content label {
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

.cancel-btn,
.save-btn {
  padding: 0.5rem 1.5rem;
  border-radius: 2rem;
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: 600;
  border: none;
  cursor: pointer;
}

.cancel-btn {
  background: rgba(0, 0, 0, 0.05);
  color: var(--color-on-surface-variant);
}

.save-btn {
  background: var(--color-primary);
  color: white;
}

.save-btn:hover {
  background: var(--color-primary-container);
}
</style>