import { createRouter, createWebHistory } from 'vue-router'
import Onboarding from '../views/Onboarding.vue'
import SignUpPage from '../views/SignUp.vue'
import Dashboard from '../views/Dashboard.vue'
import BudgetPlanner from '../views/BudgetPlanner.vue'
import Transactions from '../views/Transactions.vue'
import Insights from '../views/Insights.vue'
import Profile from '../views/Profile.vue'
import AddTransaction from '../views/AddTransaction.vue'
import AddBudgetPlanner from '../views/AddBudgetPlanner.vue'
import AuthCallback from '../views/AuthCallback.vue'

const routes = [
  { path: '/', component: Onboarding },
  { path: '/dashboard', component: Dashboard, meta: { requiresAuth: true } },
  { path: '/signup', component: SignUpPage },
  { path: '/auth-callback', component: AuthCallback },
  { path: '/budgets', component: BudgetPlanner, meta: { requiresAuth: true } },
  { path: '/transactions', component: Transactions, meta: { requiresAuth: true } },
  { path: '/insights', component: Insights, meta: { requiresAuth: true } },
  { path: '/add-transaction', component: AddTransaction, meta: { requiresAuth: true } },
  { path: '/add-budget', component: AddBudgetPlanner, meta: { requiresAuth: true } },
  { path: '/profile', component: Profile, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// Navigation guard
router.beforeEach((to, from) => {
  const token = localStorage.getItem('token')
  const isGuest = localStorage.getItem('isGuest') === 'true'
  
  if (to.meta.requiresAuth && !token && !isGuest) {
    return '/'
  }
  return true
})

export default router