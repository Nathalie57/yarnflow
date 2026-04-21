import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext(null)

// [AI:Claude] Helper de stockage robuste (localStorage avec fallback sessionStorage)
const storage = {
  getItem: (key) => {
    try {
      return localStorage.getItem(key) || sessionStorage.getItem(key)
    } catch (e) {
      console.warn('[Storage] Erreur lecture:', e)
      return null
    }
  },
  setItem: (key, value) => {
    try {
      localStorage.setItem(key, value)
    } catch (e) {
      console.warn('[Storage] localStorage plein, utilisation sessionStorage')
      try {
        sessionStorage.setItem(key, value)
      } catch (e2) {
        console.error('[Storage] Impossible de sauvegarder:', e2)
      }
    }
  },
  removeItem: (key) => {
    try {
      localStorage.removeItem(key)
      sessionStorage.removeItem(key)
    } catch (e) {
      console.warn('[Storage] Erreur suppression:', e)
    }
  }
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Charger l'utilisateur depuis localStorage au démarrage
  useEffect(() => {
    const loadUser = async () => {
      const token = storage.getItem('token')
      const storedUser = storage.getItem('user')

      if (token && storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser)
          setUser(parsedUser)

          // Vérifier si le token est toujours valide
          try {
            const response = await authAPI.me()
            setUser(response.data.data.user)
          } catch (err) {
            console.error('Erreur validation token:', err)
            // On garde l'utilisateur du localStorage même si la validation échoue
          }
        } catch (err) {
          console.error('Erreur chargement utilisateur:', err)
          logout()
        }
      }
      setLoading(false)
    }

    loadUser()
  }, [])

  const login = async (email, password) => {
    try {
      setError(null)
      const response = await authAPI.login({ email, password })
      const { user, token } = response.data.data

      storage.setItem('token', token)
      storage.setItem('user', JSON.stringify(user))
      setUser(user)

      return { success: true }
    } catch (err) {
      const message = err.response?.data?.message || 'Erreur de connexion'
      setError(message)
      return { success: false, error: message }
    }
  }

  const register = async (data) => {
    try {
      setError(null)
      console.log('[AuthContext] Appel API register...')
      const response = await authAPI.register(data)
      console.log('[AuthContext] Réponse API:', response.status, response.data)
      console.log('[AuthContext] response.data.data:', response.data.data)

      const { user, token } = response.data.data
      console.log('[AuthContext] user:', user)
      console.log('[AuthContext] token:', token ? 'présent' : 'MANQUANT')

      // [AI:Claude] Utiliser le helper storage robuste
      storage.setItem('token', token)
      storage.setItem('user', JSON.stringify(user))
      setUser(user)

      console.log('[AuthContext] Inscription réussie, user:', user?.email)
      return { success: true }
    } catch (err) {
      console.error('[AuthContext] Erreur inscription:', err.response?.status, err.response?.data)
      console.error('[AuthContext] Exception complète:', err.message, err)
      const message = err.response?.data?.message || 'Erreur d\'inscription'
      setError(message)
      return { success: false, error: message }
    }
  }

  const logout = () => {
    storage.removeItem('token')
    storage.removeItem('user')
    setUser(null)
  }

  const updateUser = (userData) => {
    setUser(userData)
    storage.setItem('user', JSON.stringify(userData))
  }

  const isAdmin = () => {
    return user?.role === 'admin'
  }

  const hasActiveSubscription = () => {
    if (!user) return false
    if (user.subscription_type === 'free') return false

    const expiresAt = new Date(user.subscription_expires_at)
    return expiresAt > new Date()
  }

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    updateUser,
    isAdmin,
    hasActiveSubscription
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
