<template>
  <div class="category-card" :class="colSpanClass">
    <div class="card-header">
      <div class="category-icon" :class="`icon-${category.color}`">
        <span class="material-symbols-outlined">{{ category.icon }}</span>
      </div>
      <h3 class="category-title">{{ category.name }}</h3>
    </div>
    <div class="category-stats">
      <span class="amount-spent">\${{ spent }}</span>
      <span class="amount-budget">of \${{ budget }}</span>
    </div>
    <div class="progress-bar-container">
      <div class="progress-bar-fill" :class="`fill-${category.color}`" :style="{ width: `${percentage}%` }"></div>
    </div>
    <p v-if="percentage > 80" class="warning-text">Near limit!</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  category: {
    type: Object,
    required: true,
    default: () => ({ id: 1, name: 'Category', icon: 'receipt', color: 'primary', budget: 0 })
  },
  spent: {
    type: Number,
    default: 0
  },
  budget: {
    type: Number,
    default: 0
  },
  colSpan: {
    type: String,
    default: 'col-span-1'
  }
})

const colSpanClass = computed(() => {
  if (props.category.name === 'Entertainment') return 'category-card--wide'
  return props.colSpan
})

const percentage = computed(() => {
  if (props.budget === 0) return 0
  return (props.spent / props.budget) * 100
})
</script>

<style scoped>
.category-card {
  background-color: var(--color-surface-container-lowest);
  border-radius: var(--radius-lg);
  padding: var(--spacing-space-md);
  box-shadow: var(--shadow-soft);
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-medium);
}

.category-card--wide {
  grid-column: span 2;
}

.card-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-space-sm);
  margin-bottom: var(--spacing-space-md);
}

.category-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-primary {
  background-color: var(--color-primary-fixed);
  color: var(--color-on-primary-fixed);
}

.icon-secondary {
  background-color: var(--color-secondary-fixed);
  color: var(--color-on-secondary-fixed);
}

.icon-tertiary {
  background-color: var(--color-tertiary-fixed);
  color: var(--color-on-tertiary-fixed);
}

.icon-secondary-fixed-dim {
  background-color: var(--color-secondary-fixed-dim);
  color: var(--color-on-secondary-fixed);
}

.category-title {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-md);
  font-weight: var(--text-headline-md--font-weight);
  color: var(--color-on-surface);
}

.category-stats {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: var(--spacing-space-xs);
}

.amount-spent {
  font-family: var(--font-family-headline);
  font-size: var(--text-numeric-lg);
  font-weight: var(--text-numeric-lg--font-weight);
  color: var(--color-on-surface);
}

.amount-budget {
  color: var(--color-outline);
  font-family: var(--font-family-sans);
  font-size: var(--text-body-sm);
}

.progress-bar-container {
  width: 100%;
  background-color: var(--color-surface-container);
  height: 0.5rem;
  border-radius: var(--radius-full);
  overflow: hidden;
  margin: var(--spacing-space-sm) 0;
}

.progress-bar-fill {
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
}

.fill-primary {
  background-color: var(--color-primary);
}

.fill-secondary {
  background-color: var(--color-secondary);
}

.fill-tertiary {
  background-color: var(--color-tertiary);
}

.fill-secondary-fixed-dim {
  background-color: var(--color-secondary-fixed-dim);
}

.warning-text {
  margin-top: var(--spacing-space-xs);
  font-family: var(--font-family-sans);
  font-size: var(--text-label-md);
  font-weight: var(--text-label-md--font-weight);
  color: var(--color-tertiary);
}
</style>