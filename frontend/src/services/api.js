import axios from 'axios'

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
    const token = localStorage.getItem('token')
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
    console.log('[API Interceptor] Erreur détectée:', error.response?.status)
    const originalRequest = error.config

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

      const token = localStorage.getItem('token')

      if (!token) {
        // Pas de token, déconnecter directement
        localStorage.removeItem('token')
        localStorage.removeItem('user')
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
          localStorage.setItem('token', newToken)
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

        localStorage.removeItem('token')
        localStorage.removeItem('user')
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

export default api
