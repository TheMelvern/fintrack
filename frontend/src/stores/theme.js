import { defineStore } from 'pinia'

export const useThemeStore = defineStore('theme', {
  state: () => ({
  }),
  actions: {
    initTheme() {
      document.documentElement.classList.remove('dark')
    }
  }
})