import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json'
  }
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

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
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
