<template>
  <div class="summary-card">
    <div class="decorative-blur"></div>
    <div class="balance-section">
      <span class="balance-label">Total Savings</span>
      <span class="balance-amount">${{ formatNumber(totalSavings) }}</span>
    </div>
    <!-- Yearly savings indicator -->
    <div class="yearly-savings" v-if="yearlySavings !== null">
      <span class="yearly-label">Saved this year</span>
      <span class="yearly-amount">${{ formatNumber(yearlySavings) }}</span>
    </div>
    <div class="spending-breakdown">
      <div class="spending-header">
        <div>
          <span class="spending-label">Monthly Spending</span>
          <span class="spending-target">vs Target (${{ formatNumber(monthlyTarget) }})</span>
        </div>
        <span class="spending-amount">${{ formatNumber(monthlySpent) }}</span>
      </div>
      <div class="progress-bar">
        <div class="progress-fill" :style="{ width: `${spendingPercentage}%` }"></div>
      </div>
      <div class="spending-stats">
        <span>{{ spendingPercentage }}% used</span>
        <span>${{ formatNumber(monthlyRemaining) }} left</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFinanceStore } from '../stores/finance'

const store = useFinanceStore()

// ----- Savings (total balance / all-time) -----
const totalSavings = computed(() => {
  // Sum of all transaction amounts (positive = income, negative = expense)
  const total = store.transactions.reduce((sum, t) => sum + t.amount, 0)
  return total ?? 0
})

// ----- Yearly savings (income - expenses for current year) -----
const yearlySavings = computed(() => {
  const currentYear = new Date().getFullYear()
  const yearTransactions = store.transactions.filter(t => {
    const txDate = new Date(t.date)
    return txDate.getFullYear() === currentYear
  })
  const total = yearTransactions.reduce((sum, t) => sum + t.amount, 0)
  return total ?? 0
})

// ----- Monthly spending -----
const monthlyTarget = computed(() => store.monthlyTotalBudget ?? 0)
const monthlySpent = computed(() => store.totalSpentThisMonth ?? 0)
const monthlyRemaining = computed(() => Math.max(0, monthlyTarget.value - monthlySpent.value))
const spendingPercentage = computed(() => {
  if (monthlyTarget.value === 0) return 0
  return ((monthlySpent.value / monthlyTarget.value) * 100).toFixed(1)
})

const formatNumber = (val) => {
  const num = Number(val)
  return isNaN(num) ? '0.00' : new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)
}
</script>

<style scoped>
/* All styles remain exactly as in the original – no changes needed */
.summary-card {
  background: linear-gradient(135deg, rgba(0, 88, 190, 0.85), rgba(0, 108, 73, 0.85));
  backdrop-filter: blur(12px);
  border-radius: 1rem;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  color: white;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
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
}
.balance-section {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.75rem;
  position: relative;
  z-index: 1;
}
.balance-label {
  font-size: var(--text-body-sm);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  opacity: 0.8;
}
.balance-amount {
  font-family: var(--font-family-headline);
  font-size: 2rem;
  font-weight: 700;
}
/* New yearly savings row */
.yearly-savings {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 1rem;
  padding-bottom: 0.5rem;
  position: relative;
  z-index: 1;
}
.yearly-label {
  font-size: var(--text-body-sm);
  opacity: 0.8;
}
.yearly-amount {
  font-family: var(--font-family-headline);
  font-size: 1.2rem;
  font-weight: 600;
}
.spending-breakdown {
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 1rem;
  position: relative;
  z-index: 1;
}
.spending-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-end;
  margin-bottom: 0.5rem;
}
.spending-label {
  font-weight: 600;
  display: block;
}
.spending-target {
  font-size: 0.75rem;
  opacity: 0.8;
}
.spending-amount {
  font-size: 1.25rem;
  font-weight: 700;
}
.progress-bar {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 9999px;
  height: 0.5rem;
  overflow: hidden;
  margin: 0.5rem 0;
}
.progress-fill {
  background: var(--color-secondary-container);
  height: 100%;
  width: 0%;
}
.spending-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  opacity: 0.9;
}
</style>