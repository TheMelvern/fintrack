<template>
  <div v-if="!hasValidData" class="transaction-item error-state">
    <div class="transaction-left">
      <div class="transaction-icon icon-default">
        <span class="material-symbols-outlined">error</span>
      </div>
      <div>
        <p class="transaction-name">Invalid transaction data</p>
        <p class="transaction-details">
          <span class="transaction-category">Please check your data</span>
        </p>
      </div>
    </div>
    <span class="transaction-amount negative">$0.00</span>
  </div>

  <div v-else class="transaction-item">
    <div class="transaction-left">
      <div :class="['transaction-icon', `icon-${categoryColor}`]">
        <span class="material-symbols-outlined">{{ categoryIcon }}</span>
      </div>
      <div>
        <p class="transaction-name">{{ transaction.description || 'Unnamed Transaction' }}</p>
        <p class="transaction-details">
          <span class="transaction-category">{{ categoryName }}</span>
        </p>
      </div>
    </div>
    <span class="transaction-amount" :class="{ negative: transaction.amount < 0 }">
      {{ formattedAmount }}
    </span>
  </div>
</template>

<script setup>
import { computed, onMounted, watch } from 'vue'
import { useFinanceStore } from '../stores/finance'
import { logger } from '../utils/logger'

const props = defineProps({
  transaction: {
    type: Object,
    required: true,
    default: () => ({
      id: null,
      description: '',
      amount: 0,
      category_id: null,
      date: new Date().toISOString(),
    }),
  },
})

const store = useFinanceStore()

// Log validation issues only once per transaction (on mount + when transaction changes)
const logValidation = () => {
  if (!props.transaction) {
    logger.error('transaction_prop_missing')
    return
  }
  if (!props.transaction.id) {
    logger.warn('transaction_missing_id', {
      description: props.transaction.description,
      amount: props.transaction.amount,
    })
  }
  if (!props.transaction.category_id) {
    logger.warn('transaction_missing_category', {
      transaction_id: props.transaction.id,
      description: props.transaction.description,
    })
  }
  if (typeof props.transaction.amount !== 'number' || isNaN(props.transaction.amount)) {
    logger.warn('transaction_amount_invalid', {
      transaction_id: props.transaction.id,
      amount_value: props.transaction.amount,
    })
  }
}

onMounted(() => logValidation())
watch(() => props.transaction, () => logValidation(), { deep: true })

// Remove all logger calls from computed properties
const hasValidData = computed(() => {
  return props.transaction &&
         typeof props.transaction.amount === 'number' &&
         !isNaN(props.transaction.amount) &&
         props.transaction.description
})

const category = computed(() => {
  if (!props.transaction.category_id) return null
  return store.categories.find(c => c.cat_id === props.transaction.category_id || c.id === props.transaction.category_id)
})

const categoryName = computed(() => category.value?.cat_name || category.value?.name || 'Other')
const categoryIcon = computed(() => category.value?.cat_icon || category.value?.icon || 'receipt')
const categoryColor = computed(() => category.value?.cat_color || category.value?.color || 'default')

const formattedTime = computed(() => {
  if (!props.transaction.date) return 'Unknown time'
  try {
    const date = new Date(props.transaction.date)
    if (isNaN(date.getTime())) return 'Invalid date'
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  } catch {
    return 'Invalid date'
  }
})

const formattedAmount = computed(() => {
  if (typeof props.transaction.amount !== 'number' || isNaN(props.transaction.amount)) {
    return '$0.00'
  }
  const amount = Math.abs(props.transaction.amount)
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
})
</script>

<style scoped>
.transaction-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  border-radius: 0.75rem;
  transition: background 0.2s;
}
.transaction-item:hover {
  background: rgba(255, 255, 255, 0.4);
}
.transaction-item.error-state {
  background: rgba(186, 26, 26, 0.1);
  border: 1px solid rgba(186, 26, 26, 0.3);
}
.transaction-left {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.transaction-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.75rem;
  display: flex;
  align-items: center;
  justify-content: center;
}
/* Dynamic icon colors */
.icon-primary { background: var(--color-primary-fixed); color: var(--color-primary); }
.icon-secondary { background: var(--color-secondary-fixed); color: var(--color-secondary); }
.icon-tertiary { background: var(--color-tertiary-fixed); color: var(--color-tertiary); }
.icon-secondary-fixed-dim { background: var(--color-secondary-fixed-dim); color: var(--color-on-secondary-fixed); }
.icon-default { background: var(--color-surface-container); color: var(--color-outline); }

.transaction-name {
  font-weight: 600;
  margin: 0;
  line-height: 1.3;
}
.transaction-details {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
  margin: 0;
}
.transaction-category {
  font-weight: 500;
}
.transaction-time {
  opacity: 0.7;
}
.transaction-amount {
  font-weight: 700;
}
.transaction-amount.negative {
  color: var(--color-error);
}
</style>