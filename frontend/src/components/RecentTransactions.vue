<template>
  <div class="transactions-section">
    <div class="transactions-header">
      <h2 class="transactions-title">Recent Transactions</h2>
      <button class="view-all-btn" @click="goToTransactions">View All</button>
    </div>
    <div class="transactions-list">
      <div v-if="recentTransactions.length === 0" class="empty-state">
        <span class="material-symbols-outlined empty-icon">receipt_long</span>
        <p class="empty-message">No transactions yet <br />Add your first expense or income!</p>
      </div>
      <TransactionItem
        v-else
        v-for="tx in recentTransactions"
        :key="tx.id"
        :transaction="tx"
      />
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useFinanceStore } from '../stores/finance'
import TransactionItem from './TransactionItem.vue'

const router = useRouter()
const store = useFinanceStore()
const recentTransactions = computed(() => store.transactions.slice(0, 3))

const goToTransactions = () => {
  router.push('/transactions')
}
</script>

<style scoped>
.transactions-section {
  margin-bottom: 1rem;
}
.transactions-header {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  margin-bottom: 0.75rem;
}
.transactions-title {
  font-size: var(--text-headline-md);
  font-weight: 600;
  margin: 0;
}
.view-all-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-weight: 600;
  font-size: var(--text-label-md);
  cursor: pointer;
  transition: opacity 0.2s;
}
.view-all-btn:hover {
  opacity: 0.8;
}
.transactions-list {
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 1rem;
  padding: 0.5rem;
  min-height: 100px;
}

/* Empty state styling */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 1.5rem 1rem;
  text-align: center;
}
.empty-icon {
  font-size: 3rem;
  color: var(--color-outline);
  margin-bottom: 0.5rem;
  opacity: 0.6;
}
.empty-message {
  font-size: var(--text-body-sm);
  color: var(--color-on-surface-variant);
  margin: 0;
  line-height: 1.4;
}
</style>