<template>
  <div class="insights-page">
    <!-- Page Title -->
    <section class="page-header">
      <h1 class="page-title">Insights</h1>
      <p class="page-subtitle">Analyze your financial growth and spending patterns.</p>
    </section>

    <div v-if="isLoading" class="loading-container">
      <div class="spinner"></div>
      <p>Loading insights...</p>
    </div>

    <template v-else>
      <div class="insights-grid">
        <!-- Pie Chart Card -->
        <div class="insight-card glass-card pie-card">
          <div class="card-header">
            <h2 class="card-title">Spending Categories</h2>
            <span class="badge">THIS MONTH</span>
          </div>
          <div v-if="Object.keys(categorySpending).length === 0" class="empty-chart">
            <span class="material-symbols-outlined">pie_chart</span>
            <p>No spending data this month</p>
          </div>
          <div v-else>
            <div class="chart-container">
              <canvas ref="pieChartCanvas" class="pie-chart"></canvas>
            </div>
            <div class="legend">
              <div v-for="(amount, cat) in categorySpending" :key="cat" class="legend-item">
                <span class="legend-color" :style="{ backgroundColor: getCategoryColor(cat) }"></span>
                <span class="legend-label">{{ cat }} ({{ ((amount / totalSpent) * 100).toFixed(0) }}%)</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Bar Chart Card with Week/Month Toggle -->
        <div class="insight-card glass-card bar-card">
          <div class="card-header">
            <h2 class="card-title">Spending Trend</h2>
            <div class="trend-toggle">
              <button 
                :class="['toggle-btn', { active: trendView === 'week' }]" 
                @click="trendView = 'week'"
              >Week</button>
              <button 
                :class="['toggle-btn', { active: trendView === 'month' }]" 
                @click="trendView = 'month'"
              >Month</button>
            </div>
          </div>
          <div v-if="activeTrendData.length === 0" class="empty-chart">
            <span class="material-symbols-outlined">bar_chart</span>
            <p>Not enough data</p>
          </div>
          <div v-else>
            <canvas ref="barChartCanvas" class="bar-chart"></canvas>
            <div class="trend-message" :class="{ positive: trendPercent >= 0, negative: trendPercent < 0 }">
              <span class="material-symbols-outlined filled-icon">{{ trendPercent >= 0 ? 'trending_up' : 'trending_down' }}</span>
              <span>Your spending is {{ Math.abs(trendPercent).toFixed(0) }}% {{ trendPercent >= 0 ? 'higher' : 'lower' }} than last {{ trendView }}!</span>
            </div>
          </div>
        </div>

        <!-- Smart Tip Card -->
        <div class="insight-card tip-card glass-card">
          <div class="tip-content">
            <div class="tip-icon">
              <span class="material-symbols-outlined">lightbulb</span>
            </div>
            <div class="tip-text">
              <span class="tip-badge">SMART TIP</span>
              <h3 class="tip-title">{{ smartTip.title }}</h3>
              <p class="tip-description">{{ smartTip.description }}</p>
              <button class="tip-button" @click="smartTip.action">{{ smartTip.buttonText }}</button>
            </div>
          </div>
        </div>

        <!-- Savings Goal Card -->
        <div class="insight-card goal-card glass-card">
          <div class="goal-header">
            <h4 class="goal-title">Savings Goal</h4>
            <span class="material-symbols-outlined">savings</span>
          </div>
          <div class="goal-stats">
            <span>{{ savingsPercent }}% Reached</span>
            <span>{{ formatCurrency(savingsAmount) }}</span>
          </div>
          <div class="goal-progress">
            <div class="goal-fill" :style="{ width: `${savingsPercent}%` }"></div>
          </div>
          <p class="goal-message">{{ savingsMessage }}</p>
        </div>
      </div>

      <!-- Quick Facts Section -->
      <section class="quick-facts">
        <h2 class="quick-facts-title">Quick Facts</h2>
        <div class="facts-grid">
          <div class="fact-card glass-card">
            <span class="material-symbols-outlined">account_balance</span>
            <p>Top Income</p>
            <strong>{{ topIncomeCategory }}</strong>
          </div>
          <div class="fact-card glass-card">
            <span class="material-symbols-outlined">warning</span>
            <p>Highest Expense</p>
            <strong>{{ topExpenseCategory }}</strong>
          </div>
          <div class="fact-card glass-card">
            <span class="material-symbols-outlined">savings</span>
            <p>Savings Rate</p>
            <strong>{{ savingsPercent.toFixed(0) }}%</strong>
          </div>
          <div class="fact-card glass-card">
            <span class="material-symbols-outlined">receipt_long</span>
            <p>Transactions</p>
            <strong>{{ totalTransactions }}</strong>
          </div>
        </div>
      </section>
    </template>

    <BottomNav />
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import Chart from 'chart.js/auto'
import { useFinanceStore } from '../stores/finance'
import { usePreferenceStore } from '../stores/preferences'
import BottomNav from '../components/BottomNav.vue'
import { logger } from '../utils/logger'

const router = useRouter()
const store = useFinanceStore()
const prefStore = usePreferenceStore()
const isLoading = ref(true)

// Chart refs
const pieChartCanvas = ref(null)
const barChartCanvas = ref(null)
let pieChart = null
let barChart = null

// View toggle: 'week' or 'month'
const trendView = ref('month')

// Helper: get category name from id
const getCategoryName = (categoryId) => {
  const cat = store.categories.find(c => c.cat_id === categoryId)
  return cat ? cat.cat_name : 'Other'
}

// Format currency
const formatCurrency = (value) => {
  const symbol = prefStore.preferences?.currencySymbol || '$'
  return `${symbol}${(value || 0).toFixed(2)}`
}

// Dynamic color based on category name (deterministic)
const getCategoryColor = (categoryName) => {
  let hash = 0
  for (let i = 0; i < categoryName.length; i++) {
    hash = ((hash << 5) - hash) + categoryName.charCodeAt(i)
    hash |= 0
  }
  const hue = Math.abs(hash % 360)
  return `hsl(${hue}, 70%, 55%)`
}

// Current month spending by category
const categorySpending = computed(() => {
  const map = {}
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  store.transactions.forEach(t => {
    if (t.amount < 0 && new Date(t.date) >= startOfMonth) {
      const catName = getCategoryName(t.category_id)
      map[catName] = (map[catName] || 0) + Math.abs(t.amount)
    }
  })
  return map
})

const totalSpent = computed(() => Object.values(categorySpending.value).reduce((a, b) => a + b, 0))

// Weekly trend data (last 6 weeks)
const weeklySpending = computed(() => {
  const weeks = []
  const now = new Date()
  // Go back 6 weeks
  for (let i = 5; i >= 0; i--) {
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - (now.getDay() + 7 * i))
    weekStart.setHours(0, 0, 0, 0)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6)
    weekEnd.setHours(23, 59, 59, 999)
    let total = 0
    store.transactions.forEach(t => {
      if (t.amount < 0) {
        const tDate = new Date(t.date)
        if (tDate >= weekStart && tDate <= weekEnd) {
          total += Math.abs(t.amount)
        }
      }
    })
    weeks.push({
      label: `${weekStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${weekEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`,
      amount: total
    })
  }
  return weeks
})

// Monthly trend data (last 6 months, based on actual transaction dates)
const monthlySpending = computed(() => {
  const months = []
  const transactionMonths = new Set()
  store.transactions.forEach(t => {
    if (t.amount < 0) {
      const d = new Date(t.date)
      transactionMonths.add(`${d.getFullYear()}-${d.getMonth()}`)
    }
  })
  const sortedMonths = Array.from(transactionMonths).sort().slice(-6)
  for (const key of sortedMonths) {
    const [year, month] = key.split('-')
    const date = new Date(parseInt(year), parseInt(month), 1)
    const monthStart = date
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0)
    let total = 0
    store.transactions.forEach(t => {
      if (t.amount < 0) {
        const tDate = new Date(t.date)
        if (tDate >= monthStart && tDate <= monthEnd) total += Math.abs(t.amount)
      }
    })
    months.push({
      label: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
      amount: total
    })
  }
  return months
})

// Active trend data based on toggle
const activeTrendData = computed(() => {
  return trendView.value === 'week' ? weeklySpending.value : monthlySpending.value
})

// Trend percentage change
const trendPercent = computed(() => {
  const data = activeTrendData.value
  if (data.length < 2) return 0
  const current = data[data.length - 1]?.amount || 0
  const previous = data[data.length - 2]?.amount || 1
  return ((current - previous) / previous) * 100
})

// Smart tip based on largest expense category
const smartTip = computed(() => {
  const categories = categorySpending.value
  let maxCat = '', maxAmount = 0
  for (const [cat, amt] of Object.entries(categories)) {
    if (amt > maxAmount) { maxAmount = amt; maxCat = cat }
  }
  if (maxCat && maxAmount > 0) {
    return {
      title: `Reduce ${maxCat} spending`,
      description: `You spent ${formatCurrency(maxAmount)} on ${maxCat} this month. Could you save 20% by adjusting habits?`,
      buttonText: `Set ${maxCat} Limit`,
      action: () => alert(`Set a budget limit for ${maxCat} in the Budget Planner.`)
    }
  }
  return {
    title: 'Start tracking expenses',
    description: 'Add transactions to get personalized insights.',
    buttonText: 'Add Transaction',
    action: () => router.push('/add-transaction')
  }
})

// Savings goal
const totalIncome = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  return store.transactions
    .filter(t => t.amount > 0 && new Date(t.date) >= startOfMonth)
    .reduce((sum, t) => sum + t.amount, 0)
})

const savingsAmount = computed(() => totalIncome.value - totalSpent.value)
const savingsPercent = computed(() => {
  if (totalIncome.value === 0) return 0
  return Math.min(100, Math.max(0, (savingsAmount.value / totalIncome.value) * 100))
})
const savingsMessage = computed(() => {
  if (savingsPercent.value >= 30) return 'Excellent! You’re saving over 30% of your income.'
  if (savingsPercent.value >= 15) return 'Good progress – try to save 30% of your income.'
  if (savingsPercent.value > 0) return 'Keep going! Every dollar saved adds up.'
  return 'Start saving by reducing expenses.'
})

// Quick facts
const topIncomeCategory = computed(() => {
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const incomeByCat = {}
  store.transactions.forEach(t => {
    if (t.amount > 0 && new Date(t.date) >= startOfMonth) {
      const catName = getCategoryName(t.category_id)
      incomeByCat[catName] = (incomeByCat[catName] || 0) + t.amount
    }
  })
  let topCat = '', topAmt = 0
  for (const [cat, amt] of Object.entries(incomeByCat)) {
    if (amt > topAmt) { topAmt = amt; topCat = cat }
  }
  return topCat || '—'
})

const topExpenseCategory = computed(() => {
  let topCat = '', topAmt = 0
  for (const [cat, amt] of Object.entries(categorySpending.value)) {
    if (amt > topAmt) { topAmt = amt; topCat = cat }
  }
  return topCat || '—'
})

const totalTransactions = computed(() => store.transactions.length)

// --- Chart management ---
const destroyCharts = () => {
  if (pieChart) { pieChart.destroy(); pieChart = null }
  if (barChart) { barChart.destroy(); barChart = null }
}

const createPieChart = async () => {
  await nextTick()
  if (!pieChartCanvas.value) return
  const ctx = pieChartCanvas.value.getContext('2d')
  const labels = Object.keys(categorySpending.value)
  const data = Object.values(categorySpending.value)
  if (data.length === 0) return
  pieChart = new Chart(ctx, {
    type: 'pie',
    data: {
      labels,
      datasets: [{
        data,
        backgroundColor: labels.map(getCategoryColor),
        borderWidth: 0,
        hoverOffset: 8,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: 'rgba(0,0,0,0.7)',
          callbacks: {
            label: (ctx) => {
              const val = ctx.raw
              const total = ctx.dataset.data.reduce((a,b)=>a+b,0)
              const percent = ((val/total)*100).toFixed(1)
              return `${ctx.label}: ${formatCurrency(val)} (${percent}%)`
            }
          }
        }
      },
      cutout: '0%',
      radius: '85%',
    }
  })
}

const createBarChart = async () => {
  await nextTick()
  if (!barChartCanvas.value) return
  const labels = activeTrendData.value.map(d => d.label)
  const data = activeTrendData.value.map(d => d.amount)
  if (data.length === 0) return
  const ctx = barChartCanvas.value.getContext('2d')
  if (barChart) barChart.destroy()
  barChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [{
        label: 'Spending',
        data,
        backgroundColor: 'rgba(0, 88, 190, 0.7)',
        borderRadius: 8,
        barPercentage: 0.7,
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: { callbacks: { label: (ctx) => formatCurrency(ctx.raw) } }
      },
      scales: {
        y: { beginAtZero: true, ticks: { callback: (v) => formatCurrency(v) } },
        x: { grid: { display: false }, ticks: { maxRotation: 45, minRotation: 45 } }
      }
    }
  })
}

const refreshCharts = async () => {
  destroyCharts()
  await nextTick()
  setTimeout(async () => {
    await createPieChart()
    await createBarChart()
  }, 100)
}

// Watch for view toggle
watch(trendView, async () => {
  if (!isLoading.value) {
    await createBarChart()
  }
})

// Load data
const loadData = async () => {
  isLoading.value = true
  try {
    await Promise.all([
      store.fetchCategories(),
      store.fetchTransactions(),
    ])
    await refreshCharts()
  } catch (err) {
    logger.error('insights_load_failed', { error: err.message })
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
/* Page Layout */
.insights-page {
  padding: 1rem 1rem 6rem;
  max-width: 800px;
  margin: 0 auto;
  background: linear-gradient(135deg, #dbeafe, #e0e7ff, #ccfbf1);
  min-height: 100vh;
}

/* Page Header */
.page-header {
  margin-bottom: 1.5rem;
}
.page-title {
  font-family: var(--font-family-headline);
  font-size: 1.75rem;
  font-weight: 700;
  margin: 0 0 0.25rem 0;
  color: var(--color-on-surface);
}
.page-subtitle {
  font-family: var(--font-family-sans);
  font-size: var(--text-body-md);
  color: var(--color-on-surface-variant);
}

/* Glass Card Base */
.glass-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1.5rem;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.05);
}

/* Insights Grid */
.insights-grid {
  display: grid;
  gap: 1rem;
  margin-bottom: 1.5rem;
}
.insight-card {
  padding: 1rem;
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}
.card-title {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-md);
  font-weight: 600;
  margin: 0;
}
.badge {
  background: rgba(0, 88, 190, 0.15);
  color: var(--color-primary);
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-label-md);
  font-weight: 600;
}
.chart-container {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}
.pie-chart {
  max-width: 200px;
  max-height: 200px;
}
.legend {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.5rem;
}
.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}
.legend-color {
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 9999px;
}
.legend-label {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
}
.bar-chart {
  max-height: 200px;
  width: 100%;
}
.trend-message {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 1rem;
  font-size: var(--text-body-sm);
}
.trend-message.positive {
  color: #b91c1c;
}
.trend-message.negative {
  color: var(--color-secondary);
}

/* Toggle Buttons */
.trend-toggle {
  display: flex;
  gap: 0.5rem;
}
.toggle-btn {
  background: rgba(255, 255, 255, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 2rem;
  padding: 0.25rem 0.75rem;
  font-size: var(--text-label-md);
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}
.toggle-btn.active {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}
.toggle-btn:hover {
  background: rgba(255, 255, 255, 0.6);
}

/* Tip Card */
.tip-card {
  background: linear-gradient(135deg, rgba(0, 88, 190, 0.1), rgba(0, 108, 73, 0.1));
  backdrop-filter: blur(12px);
}
.tip-content {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.tip-icon {
  width: 3.5rem;
  height: 3.5rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 9999px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.tip-icon .material-symbols-outlined {
  font-size: 1.75rem;
  color: var(--color-primary);
}
.tip-badge {
  background: var(--color-secondary-container);
  padding: 0.2rem 0.75rem;
  border-radius: 9999px;
  font-size: var(--text-label-md);
  font-weight: 600;
}
.tip-title {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-md);
  margin: 0.25rem 0;
}
.tip-description {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
}
.tip-button {
  margin-top: 0.5rem;
  background: var(--color-primary);
  color: white;
  border: none;
  border-radius: 2rem;
  padding: 0.25rem 1rem;
  font-size: var(--text-label-md);
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s;
}
.tip-button:hover {
  background: var(--color-primary-container);
}

/* Goal Card */
.goal-card {
  background: rgba(108, 248, 187, 0.2);
}
.goal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}
.goal-title {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-md);
  margin: 0;
}
.goal-stats {
  display: flex;
  justify-content: space-between;
  font-size: var(--text-label-md);
  margin-bottom: 0.5rem;
}
.goal-progress {
  background: rgba(0, 0, 0, 0.1);
  border-radius: 9999px;
  height: 0.5rem;
  overflow: hidden;
}
.goal-fill {
  background: var(--color-secondary);
  height: 100%;
  border-radius: 9999px;
}
.goal-message {
  font-size: var(--text-body-sm);
  margin-top: 0.75rem;
  font-style: italic;
}

/* Quick Facts */
.quick-facts {
  margin-top: 1.5rem;
}
.quick-facts-title {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-md);
  font-weight: 600;
  margin-bottom: 1rem;
}
.facts-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}
.fact-card {
  padding: 1rem;
  text-align: center;
}
.fact-card .material-symbols-outlined {
  font-size: 1.75rem;
  color: var(--color-primary);
  margin-bottom: 0.25rem;
}
.fact-card p {
  font-size: var(--text-label-md);
  color: var(--color-on-surface-variant);
  margin: 0;
}
.fact-card strong {
  display: block;
  font-size: var(--text-body-lg);
  font-weight: 700;
}

/* Loading & Empty States */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  text-align: center;
}
.spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(0, 88, 190, 0.2);
  border-top-color: var(--color-primary);
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
  margin-bottom: 1rem;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.empty-chart {
  text-align: center;
  padding: 2rem;
  color: var(--color-on-surface-variant);
}
.empty-chart .material-symbols-outlined {
  font-size: 3rem;
  margin-bottom: 0.5rem;
}
</style>