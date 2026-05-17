<template>
  <nav class="bottom-nav">
    <router-link v-for="item in leftItems" :key="item.path" :to="item.path" custom
      v-slot="{ navigate, isActive, href }">
      <a :href="href" @click="navigate" :class="['nav-item', { 'nav-item--active': isActive }]">
        <span class="material-symbols-outlined nav-icon" :class="{ 'filled-icon': isActive }">
          {{ item.icon }}
        </span>
      </a>
    </router-link>

    <!-- Scan Button (opens modal) -->
    <button class="scan-button" @click="openScanner">
      <span class="material-symbols-outlined scan-icon">center_focus_strong</span>
    </button>

    <router-link v-for="item in rightItems" :key="item.path" :to="item.path" custom
      v-slot="{ navigate, isActive, href }">
      <a :href="href" @click="navigate" :class="['nav-item', { 'nav-item--active': isActive }]">
        <span class="material-symbols-outlined nav-icon" :class="{ 'filled-icon': isActive }">
          {{ item.icon }}
        </span>
      </a>
    </router-link>

  </nav>
  
  <!-- Scan Receipt Modal -->
  <ScanReceiptModal :isOpen="showScanner" @close="showScanner = false" @transaction-added="onTransactionAdded" />

</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import ScanReceiptModal from './ScanReceiptModal.vue'

const router = useRouter()

const leftItems = [
  { path: '/dashboard', icon: 'home' },
  { path: '/budgets', icon: 'account_balance_wallet' },
]

const rightItems = [
  { path: '/insights', icon: 'bar_chart' },
  { path: '/profile', icon: 'person' },
]

const showScanner = ref(false)

const openScanner = () => {
  showScanner.value = true
}

const onTransactionAdded = () => {
  // Optional: refresh transactions or show a toast
  console.log('Transaction added via scan')
  // Reload current page if needed (e.g., router.go(0))
  // For better UX, you might emit an event to parent or refresh store data
}
</script>

<style scoped>
.bottom-nav {
  position: fixed;
  bottom: var(--spacing-space-md);
  left: 50%;
  transform: translateX(-50%);
  width: calc(100% - 2 * var(--spacing-space-md));
  max-width: 520px;
  z-index: 50;
  display: flex;
  justify-content: space-evenly;
  align-items: center;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(32px);
  border-radius: 100px;
  padding: 0.3rem 0.6rem;
  box-shadow: var(--shadow-medium);
  border: 1px solid rgba(255, 255, 255, 0.4);
}

.nav-item {
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
  color: var(--color-on-surface-variant);
  transition: all 0.2s ease;
  border-radius: 100px;
  cursor: pointer;
  width: 3rem;
  height: 3rem;
  margin: 0;
}

.nav-item--active {
  background-color: rgba(0, 88, 190, 0.25);
  color: var(--color-primary);
  transform: scale(1.05);
  box-shadow: 0 0 0 4px rgba(0, 88, 190, 0.1);
}

.nav-icon {
  font-size: 1.6rem;
}

.filled-icon {
  font-variation-settings: 'FILL' 1;
}

.scan-button {
  width: 3.6rem;
  height: 3.6rem;
  background: linear-gradient(135deg, #0058be, #006c49);
  color: white;
  border: none;
  border-radius: 100px;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: var(--shadow-medium);
  transition: transform 0.2s ease;
  cursor: pointer;
  margin: 0 0.2rem;
}

.scan-button:hover {
  transform: scale(1.05);
}

.scan-icon {
  font-size: 2rem;
  color: white;
}

/* Responsive adjustments */
@media (min-width: 768px) {
  .bottom-nav {
    max-width: 600px;
    padding: 0.4rem 0.8rem;
  }

  .nav-item {
    width: 3.2rem;
    height: 3.2rem;
  }

  .nav-icon {
    font-size: 1.8rem;
  }

  .scan-button {
    width: 4rem;
    height: 4rem;
  }

  .scan-icon {
    font-size: 2.2rem;
  }
}

@media (min-width: 1024px) {
  .bottom-nav {
    max-width: 680px;
    padding: 0.5rem 1rem;
  }

  .nav-item {
    width: 3.6rem;
    height: 3.6rem;
  }

  .nav-icon {
    font-size: 2rem;
  }

  .scan-button {
    width: 4.2rem;
    height: 4.2rem;
  }

  .scan-icon {
    font-size: 2.4rem;
  }
}

@media (max-width: 480px) {
  .bottom-nav {
    width: calc(100% - 1rem);
    padding: 0.25rem 0.4rem;
    max-width: 400px;
  }

  .nav-item {
    width: 2.6rem;
    height: 2.6rem;
  }

  .nav-icon {
    font-size: 1.4rem;
  }

  .scan-button {
    width: 3rem;
    height: 3rem;
  }

  .scan-icon {
    font-size: 1.6rem;
  }
}
</style>