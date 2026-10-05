import { Navigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { canAccessJacquard } from '../config/features'

/** Bloque le montage des pages jacquard avant leurs appels API. */
const JacquardRoute = ({ children }) => {
  const { user, loading } = useAuth()

  if (loading) return null
  if (!canAccessJacquard(user)) return <Navigate to="/my-projects" replace />

  return children
}

export default JacquardRoute
