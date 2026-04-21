import axios from 'axios'

// [AI:Claude] Configuration retry pour erreurs réseau
const RETRY_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000, // 1 seconde initial
  retryableStatuses: [408, 429, 500, 502, 503, 504], // Timeout, Too Many Requests, Server errors
}

// [AI:Claude] Fonction de délai avec backoff exponentiel
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms))

// [AI:Claude] Vérifier si une erreur est retryable (réseau ou serveur temporaire)
const isRetryableError = (error) => {
  // Erreur réseau (pas de réponse du serveur)
  if (!error.response) {
    return true
  }
  // Erreurs serveur temporaires
  return RETRY_CONFIG.retryableStatuses.includes(error.response.status)
}

// [AI:Claude] Helper de stockage robuste (localStorage avec fallback sessionStorage)
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (e) {
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      try { sessionStorage.setItem(key, value) } catch (e2) { /* ignore */ }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (e) { /* ignore */ }
  }
}

// Détection automatique de l'environnement via variables d'environnement
const getAPIUrl = () => {
  // Utilise VITE_API_URL défini dans .env.development, .env.staging ou .env.production
  return import.meta.env.VITE_API_URL || 'http://patron-maker.local/api'
}

const api = axios.create({
  baseURL: getAPIUrl(),
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 120000 // 120 secondes (2 minutes) pour la génération d'images IA
})

// Intercepteur pour ajouter le token JWT
api.interceptors.request.use(
  (config) => {
    const token = storage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Variable pour éviter les boucles infinies de refresh
let isRefreshing = false
let failedQueue = []

const processQueue = (error, token = null) => {
  failedQueue.forEach(prom => {
    if (error) {
      prom.reject(error)
    } else {
      prom.resolve(token)
    }
  })
  failedQueue = []
}

// Intercepteur pour gérer les erreurs et rafraîchir le token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config

    // [AI:Claude] Retry automatique pour erreurs réseau/serveur temporaires
    if (isRetryableError(error) && originalRequest) {
      const retryCount = originalRequest._retryCount || 0

      if (retryCount < RETRY_CONFIG.maxRetries) {
        originalRequest._retryCount = retryCount + 1
        const retryDelay = RETRY_CONFIG.retryDelay * Math.pow(2, retryCount) // Backoff exponentiel

        console.log(`[API Retry] Tentative ${retryCount + 1}/${RETRY_CONFIG.maxRetries} dans ${retryDelay}ms...`)

        await delay(retryDelay)
        return api(originalRequest)
      } else {
        console.log('[API Retry] Échec après', RETRY_CONFIG.maxRetries, 'tentatives')
      }
    }

    console.log('[API Interceptor] Erreur détectée:', error.response?.status || 'Network Error')

    // Si erreur 401 et qu'on n'a pas déjà essayé de rafraîchir
    if (error.response?.status === 401 && !originalRequest._retry) {
      console.log('[API Interceptor] Erreur 401, tentative de refresh...')
      if (isRefreshing) {
        // Si un refresh est déjà en cours, attendre qu'il se termine
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          originalRequest.headers.Authorization = 'Bearer ' + token
          return api(originalRequest)
        }).catch(err => {
          return Promise.reject(err)
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      const token = storage.getItem('token')

      if (!token) {
        // Pas de token, déconnecter directement
        storage.removeItem('token')
        storage.removeItem('user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      try {
        // Essayer de rafraîchir le token
        console.log('[API Interceptor] Envoi requête refresh...')

        // Créer une instance axios SANS intercepteur pour éviter la boucle
        const refreshApi = axios.create({
          baseURL: getAPIUrl()
        })

        const response = await refreshApi.post(
          '/auth/refresh',
          {},
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        )

        console.log('[API Interceptor] Réponse refresh:', response.data)

        if (response.data?.data?.token) {
          const newToken = response.data.data.token
          storage.setItem('token', newToken)
          console.log('[API Interceptor] ✅ Nouveau token sauvegardé')

          // Mettre à jour le header de la requête originale
          originalRequest.headers.Authorization = 'Bearer ' + newToken

          // Traiter toutes les requêtes en attente
          processQueue(null, newToken)

          isRefreshing = false

          // Réessayer la requête originale avec le nouveau token
          return api(originalRequest)
        } else {
          throw new Error('Pas de token dans la réponse')
        }
      } catch (refreshError) {
        // Le refresh a échoué, déconnecter l'utilisateur
        console.log('[API Interceptor] ❌ Refresh échoué:', refreshError.message)
        processQueue(refreshError, null)
        isRefreshing = false

        storage.removeItem('token')
        storage.removeItem('user')
        console.log('[API Interceptor] Redirection vers /login')
        window.location.href = '/login'

        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)

// Auth
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
  refresh: () => api.post('/auth/refresh')
}

// Patterns
export const patternsAPI = {
  calculatePrice: (data) => api.post('/patterns/calculate-price', data),
  generate: (data) => api.post('/patterns/generate', data),
  getAll: (params) => api.get('/patterns', { params }),
  getById: (id) => api.get(`/patterns/${id}`),
  checkStatus: (id) => api.get(`/patterns/${id}/status`),
  downloadPDF: (id) => api.get(`/patterns/${id}/pdf`, { responseType: 'blob' }),
  delete: (id) => api.delete(`/patterns/${id}`)
}

// Payments
export const paymentsAPI = {
  checkoutPattern: (data) => api.post('/payments/checkout/pattern', data),
  checkoutSubscription: (data) => api.post('/payments/checkout/subscription', data),
  checkoutCredits: (data) => api.post('/payments/checkout/credits', data),
  checkStatus: (sessionId) => api.get(`/payments/status/${sessionId}`),
  getHistory: (params) => api.get('/payments/history', { params })
}

// User
export const userAPI = {
  getProfile: () => api.get('/user/profile'),
  updateProfile: (data) => api.put('/user/profile', data),
  changePassword: (data) => api.put('/user/password', data),
  deleteAccount: (data) => api.delete('/user/account', { data }),
  getDashboard: () => api.get('/user/dashboard'),
  getSubscription: () => api.get('/user/subscription')
}

// Admin
export const adminAPI = {
  getStats: () => api.get('/admin/stats'),
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (id) => api.get(`/admin/users/${id}`),
  updateUserSubscription: (id, data) => api.put(`/admin/users/${id}/subscription`, data),
  manageUserCredits: (id, data) => api.post(`/admin/users/${id}/credits`, data),
  updateUserRole: (id, data) => api.put(`/admin/users/${id}/role`, data),
  toggleBan: (id, data) => api.put(`/admin/users/${id}/ban`, data),
  getPatterns: (params) => api.get('/admin/patterns', { params }),
  deletePattern: (id) => api.delete(`/admin/patterns/${id}`),
  getTemplates: (params) => api.get('/admin/templates', { params }),
  createTemplate: (data) => api.post('/admin/templates', data),
  updateTemplate: (id, data) => api.put(`/admin/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/admin/templates/${id}`),
  getPayments: (params) => api.get('/admin/payments', { params }),
  getCategories: () => api.get('/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  createSubtype: (categoryKey, data) => api.post(`/admin/categories/${categoryKey}/subtypes`, data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),
  reorderCategories: (data) => api.post('/admin/categories/reorder', data),
  // [AI:Claude] Pattern Options admin routes
  getPatternOptions: (params) => api.get('/pattern-options', { params }),
  createPatternOption: (data) => api.post('/admin/pattern-options', data),
  updatePatternOption: (id, data) => api.put(`/admin/pattern-options/${id}`, data),
  deletePatternOption: (id) => api.delete(`/admin/pattern-options/${id}`)
}

// Categories (public)
export const categoriesAPI = {
  getAll: () => api.get('/categories'),
  getSubtypes: (categoryKey) => api.get(`/categories/${categoryKey}/subtypes`)
}

// [AI:Claude] Pattern Options (public)
export const patternOptionsAPI = {
  getAll: (params) => api.get('/pattern-options', { params }),
  getRequired: (categoryKey) => api.get(`/pattern-options/required/${categoryKey}`),
  getByKey: (optionKey) => api.get(`/pattern-options/key/${optionKey}`),
  getByGroup: (group) => api.get(`/pattern-options/group/${group}`)
}

// [AI:Claude] Utilitaires de connexion réseau
export const networkUtils = {
  isOnline: () => navigator.onLine,

  // Listener pour changements de connexion
  onConnectionChange: (callback) => {
    const handleOnline = () => callback(true)
    const handleOffline = () => callback(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Retourner fonction de cleanup
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }
}

export default api
