// stores/preferences.js
import { defineStore } from 'pinia';
import api from '../utils/axios';

export const usePreferenceStore = defineStore('preferences', {
  state: () => ({
    preferences: {
      theme: 'light',
      currency: 'USD',
      currencySymbol: '$',
      notifications: { email: true, push: true, budget_alerts: true },
      security: { two_factor: false, session_timeout: 30 },
    },
    isLoading: false,
  }),
  actions: {
    async fetchPreferences() {
      this.isLoading = true;
      try {
        const { data } = await api.get('/preferences');
        // The backend now returns the currencySymbol as part of the object
        this.preferences = data;
        this.applyTheme();
      } catch (err) {
        console.error('Failed to fetch preferences', err);
      } finally {
        this.isLoading = false;
      }
    },
    async updatePreference(key, value) {
      try {
        const { data } = await api.put('/preferences', { [key]: value });
        this.preferences = { ...this.preferences, ...data };
        if (key === 'theme') this.applyTheme();
        if (key === 'currency') {
          // After updating currency, re‑fetch to get the new symbol
          await this.fetchPreferences();
        }
      } catch (err) {
        console.error('Failed to update preference', err);
      }
    },
    applyTheme() {
      const theme = this.preferences.theme;
      if (theme === 'dark') {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      localStorage.setItem('theme', theme);
    },
    initTheme() {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        this.preferences.theme = savedTheme;
        this.applyTheme();
      } else if (this.preferences.theme) {
        this.applyTheme();
      }
    },
  },
});