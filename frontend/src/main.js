// main.js
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { logger } from './utils/logger'
import { setupGlobalErrorHandler } from './utils/errorHandler'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/auth'
import './main.css'
import './styles/auth-common.css'

const pinia = createPinia()
const app = createApp(App)

// Vue error handler
app.config.errorHandler = (err, instance, info) => {
  logger.error('vue_error', {
    error: err?.message || String(err),
    stack: err?.stack,
    info,
    component: instance?.$options?.name,
  })
}

app.use(pinia)
app.use(router)

// Initialize auth store (restores token, fetches user, or creates guest session)
const initAuth = async () => {
  const authStore = useAuthStore()
  await authStore.init() // This handles token restoration, user fetch, or guest creation
  logger.info('auth_initialized', { isGuest: authStore.isGuest })
}

// Mount after init
initAuth().finally(() => {
  app.mount('#app')
})

setupGlobalErrorHandler()
logger.info('app_started', { version: '1.0.0' })