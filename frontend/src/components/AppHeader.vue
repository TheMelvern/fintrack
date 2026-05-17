<template>
  <header class="app-header">
    <div class="logo-area">
      <div class="logo-icon">
        <span class="material-symbols-outlined">owl</span>
      </div>
      <h1 class="logo-text">{{ title }}</h1>
    </div>
    <div class="header-actions">
      <button class="icon-btn">
        <span class="material-symbols-outlined">search</span>
      </button>
      <button class="icon-btn">
        <span class="material-symbols-outlined">account_circle</span>
      </button>
    </div>
  </header>
</template>

<script setup>
defineProps({ title: { type: String, default: 'FinTrack' } })
</script>

<style scoped>
.app-header {
  background-color: var(--color-surface-bright);
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  padding: var(--spacing-space-sm) var(--spacing-container-margin);
  height: 4rem;
  position: fixed;
  top: 0;
  left: 0;
  z-index: 50;
}

.logo-area {
  display: flex;
  align-items: center;
  gap: var(--spacing-space-sm);
}

.logo-icon {
  width: 2.5rem;
  height: 2.5rem;
  border-radius: var(--radius-full);
  background-color: var(--color-primary-fixed);
  display: flex;
  align-items: center;
  justify-content: center;
}

.logo-icon .material-symbols-outlined {
  color: var(--color-primary);
  font-size: 1.5rem;
}

.logo-text {
  font-family: var(--font-family-headline);
  font-size: var(--text-headline-lg);
  font-weight: 600;
  color: var(--color-primary);
}

.header-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-space-md);
}

.icon-btn {
  background: transparent;
  border: none;
  cursor: pointer;
  padding: var(--spacing-space-sm);
  border-radius: var(--radius-full);
  transition: background-color 0.2s;
}

.icon-btn .material-symbols-outlined {
  color: var(--color-primary);
  font-size: 1.5rem;
}

.icon-btn:hover {
  background-color: var(--color-surface-container);
}
</style>