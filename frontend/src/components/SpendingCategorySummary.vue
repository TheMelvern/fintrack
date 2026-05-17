<template>
  <div class="categories-grid">
    <div v-for="group in displayedGroups" :key="group.name" class="category-card">
      <div class="category-header">
        <div :class="['category-icon', `icon-${group.color}`]">
          <span class="material-symbols-outlined">{{ group.icon }}</span>
        </div>
      </div>
      <div class="category-stats">
        <span class="category-spent">{{ formatCurrency(group.spent) }}</span>
        <span class="category-budget">/ {{ formatCurrency(group.budget) }}</span>
      </div>
      <div class="category-progress">
        <div class="progress-bar-bg">
          <div class="progress-fill" :class="`fill-${group.color}`" :style="{ width: `${group.percent}%` }"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { usePreferenceStore } from '../stores/preferences'

const financeStore = useFinanceStore()
const prefStore = usePreferenceStore()

const mainGroups = [
  { name: 'Food & Dining', icon: 'restaurant', color: 'tertiary' },
  { name: 'Groceries', icon: 'shopping_cart', color: 'secondary' },
  { name: 'Transportation', icon: 'directions_car', color: 'primary' },
  { name: 'Rent / Mortgage', icon: 'home', color: 'primary' },
]

const groupDataMap = computed(() => financeStore.summary?.categorySummary || {})
const currencySymbol = computed(() => prefStore.preferences.currencySymbol || '$')

const displayedGroups = computed(() => {
  return mainGroups.map(group => {
    const groupData = groupDataMap.value[group.name] || { budget: 0, spent: 0 }
    const budget = groupData.budget || 0
    const spent = groupData.spent || 0
    const percent = budget === 0 ? 0 : (spent / budget) * 100
    return {
      ...group,
      budget,
      spent,
      percent: Math.min(percent, 100),
    }
  })
})

const formatCurrency = (value) => {
  if (value === undefined || value === null) return `${currencySymbol.value}0.00`
  return `${currencySymbol.value}${value.toFixed(2)}`
}
</script>

<style scoped>
.categories-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  width: 100%;
}

@media (min-width: 768px) {
  .categories-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }
}

.category-card {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1rem;
  padding: 1rem;
  width: 100%;
  box-sizing: border-box;
  text-align: center;
  transition: all 0.2s;
}

.category-card:hover {
  background: rgba(255, 255, 255, 0.7);
  transform: translateY(-2px);
}

.category-header {
  display: flex;
  justify-content: flex-start;
  margin-bottom: 0.75rem;
}

.category-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-primary { background: var(--color-primary-fixed); color: var(--color-primary); }
.icon-secondary { background: var(--color-secondary-fixed); color: var(--color-secondary); }
.icon-tertiary { background: var(--color-tertiary-fixed); color: var(--color-tertiary); }
.icon-secondary-fixed-dim { background: var(--color-secondary-fixed-dim); color: var(--color-on-secondary-fixed); }

.category-stats {
  display: flex;
  justify-content: flex-start;
  align-items: baseline;
  gap: 0.25rem;
  margin-bottom: 0.5rem;
  flex-wrap: wrap;
}

.category-spent {
  font-size: 1.25rem;
  font-weight: 700;
  white-space: nowrap;
}

.category-budget {
  font-size: 0.75rem;
  color: var(--color-outline);
  white-space: nowrap;
}

.category-progress {
  margin-top: 0.5rem;
}

.progress-bar-bg {
  background: var(--color-surface-variant);
  border-radius: 9999px;
  height: 0.25rem;
  overflow: hidden;
}

.fill-primary { background: var(--color-primary); }
.fill-secondary { background: var(--color-secondary); }
.fill-tertiary { background: var(--color-tertiary); }
.fill-secondary-fixed-dim { background: var(--color-secondary-fixed-dim); }

@media (max-width: 480px) {
  .category-spent {
    font-size: 1rem;
  }
  .category-budget {
    font-size: 0.7rem;
  }
  .category-icon {
    width: 2rem;
    height: 2rem;
  }
}
</style>