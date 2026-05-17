<template>
  <button class="fab" @click="$emit('click')">
    <span class="material-symbols-outlined">add</span>
  </button>
</template>

<script setup>
defineEmits(['click'])
</script>

<style scoped>
.fab {
  position: fixed;
  bottom: 6rem;
  right: var(--spacing-container-margin);
  width: 3.5rem;
  height: 3.5rem;
  background-color: var(--color-primary);
  color: var(--color-on-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
  z-index: 40;
}

.fab:hover {
  transform: scale(1.05);
}

.fab:active {
  transform: scale(0.95);
}

.fab .material-symbols-outlined {
  font-size: 1.75rem;
}
</style>