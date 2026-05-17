import { defineStore } from 'pinia';
import api from '../utils/axios';
import { usePreferenceStore } from './preferences';

export const useFinanceStore = defineStore('finance', {
  state: () => ({
    transactions: [],
    budgets: [],               // each: { id, category (group name), amount, month, remark }
    categories: [],           // categories still used for transaction mapping
    monthlyTotalBudget: 0,
    remainingBudget: 0,
    isLoading: false,
    error: null,
  }),

  getters: {
    totalSpentThisMonth: (state) => {
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return state.transactions
        .filter(t => t.amount < 0 && new Date(t.date) >= startOfMonth)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    },

    // Spending per category (still useful for transaction details)
    spendingByCategory: (state) => {
      const map = new Map();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      state.transactions
        .filter(t => t.amount < 0 && new Date(t.date) >= startOfMonth)
        .forEach(t => {
          const catId = t.category_id;
          map.set(catId, (map.get(catId) || 0) + Math.abs(t.amount));
        });
      return map;
    },

    // Spending per category group (needed for group budgets)
    spendingByGroup: (state) => {
      const map = new Map();
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      state.transactions
        .filter(t => t.amount < 0 && new Date(t.date) >= startOfMonth)
        .forEach(t => {
          // Find category to get its group
          const cat = state.categories.find(c => c.cat_id === t.category_id);
          const group = cat?.cat_group || 'Uncategorized';
          map.set(group, (map.get(group) || 0) + Math.abs(t.amount));
        });
      return map;
    },
  },

  actions: {
    getCurrentMonth() {
      const now = new Date();
      return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    },

    // ---------- Categories (unchanged) ----------
    async fetchCategories() {
      try {
        const { data } = await api.get('/categories');
        this.categories = data;
      } catch (err) {
        console.error('Failed to fetch categories', err);
        this.error = err.message;
      }
    },

    async createCategory(category) {
      const { data } = await api.post('/categories', category);
      this.categories.push(data);
      return data;
    },

    async updateCategory(id, updates) {
      const { data } = await api.put(`/categories/${id}`, updates);
      const index = this.categories.findIndex(c => c.cat_id === id);
      if (index !== -1) this.categories[index] = data;
      return data;
    },

    async deleteCategory(id) {
      await api.delete(`/categories/${id}`);
      this.categories = this.categories.filter(c => c.cat_id !== id);
    },

    // ---------- Transactions (unchanged) ----------
    async fetchTransactions() {
      try {
        const { data } = await api.get('/transactions');
        this.transactions = data.map(t => ({ ...t, amount: Number(t.amount) }))
      } catch (err) {
        console.error('Failed to fetch transactions', err);
        this.error = err.message;
      }
    },

    async addTransaction(transaction) {
      try {
        const { data } = await api.post('/transactions', transaction);
        this.transactions.unshift(data);
        return data;
      } catch (err) {
        console.error('Failed to add transaction', err);
        this.error = err.message;
        throw err;
      }
    },

    // ---------- Budgets (updated for group budgets) ----------
    async fetchBudgets(month) {
      if (!month) month = this.getCurrentMonth();
      try {
        const { data } = await api.get(`/budgets?month=${month}`);
        // Expected data format: array of { id, category, amount, month, remark }
        this.budgets = data;
        this.updateTotalsFromBudgets();
      } catch (err) {
        console.error('Failed to fetch budgets', err);
        this.error = err.message;
      }
    },

    async updateBudget(budget) {
      // budget: { category (group name), amount, month, remark (optional) }
      try {
        const { data } = await api.post('/budgets', budget);
        // data: { id, category, amount, month, remark }
        const index = this.budgets.findIndex(b => b.category === data.category);
        if (index !== -1) this.budgets[index] = data;
        else this.budgets.push(data);
        this.updateTotalsFromBudgets();
        return data;
      } catch (err) {
        console.error('Failed to update budget', err);
        this.error = err.message;
        throw err;
      }
    },

    // ---------- Summary (unchanged, but ensure backend returns group-based total) ----------
    async fetchSummary() {
      try {
        const prefStore = usePreferenceStore();
        const currency = prefStore.preferences?.currency || 'USD';
        const { data } = await api.get(`/summary?currency=${currency}`);
        this.monthlyTotalBudget = data.totalBudget;
        this.remainingBudget = data.remainingBudget;
        this.summary = data;
      } catch (err) {
        console.error('Failed to fetch summary', err);
        this.error = err.message;
      }
    },

    updateTotalsFromBudgets() {
      this.monthlyTotalBudget = this.budgets.reduce((sum, b) => sum + b.amount, 0);
      this.remainingBudget = this.monthlyTotalBudget - this.totalSpentThisMonth;
    },

    resetStore() {
      this.transactions = [];
      this.budgets = [];
      this.categories = [];
      this.monthlyTotalBudget = 0;
      this.remainingBudget = 0;
      this.isLoading = false;
      this.error = null;
    },
  },
});