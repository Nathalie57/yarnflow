/**
 * @file ImportPartnerPattern.jsx
 * @brief Page d'import de projet via QR code partenaire
 *
 * Flux :
 *   - Connecté  → charge le template, crée le projet, redirige vers le projet
 *   - Non connecté → affiche les infos du patron + CTA inscription/connexion
 *                    L'intent est sauvegardé en localStorage et traité après login
 */

import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { partnerImportAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'

const PENDING_IMPORT_KEY = 'yf_pending_import'

const ImportPartnerPattern = () => {
  const { code }     = useParams()
  const navigate     = useNavigate()
  const { user, loading: authLoading } = useAuth()

  const [template, setTemplate] = useState(null)
  const [loading, setLoading]   = useState(true)
  const [importing, setImporting] = useState(false)
  const [error, setError]       = useState(null)

  // Charger le template (public)
  useEffect(() => {
    const load = async () => {
      try {
        const res = await partnerImportAPI.getTemplate(code)
        setTemplate(res.data.template)
      } catch {
        setError('Ce lien est invalide ou expiré.')
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [code])

  // Dès que l'utilisateur est connecté ET qu'un import est en attente, on importe
  useEffect(() => {
    if (authLoading || !user || !template) return

    const pending = localStorage.getItem(PENDING_IMPORT_KEY)
    if (pending === code) {
      localStorage.removeItem(PENDING_IMPORT_KEY)
      doImport()
    }
  }, [user, authLoading, template])

  const doImport = async () => {
    try {
      setImporting(true)
      const res = await partnerImportAPI.importProject(code)
      navigate(`/projects/${res.data.project.id}`, { replace: true })
    } catch {
      setError('Impossible de créer le projet. Réessaie.')
      setImporting(false)
    }
  }

  const handleImportClick = () => {
    if (!user) {
      localStorage.setItem(PENDING_IMPORT_KEY, code)
      navigate('/register', { state: { from: `/import/${code}` } })
      return
    }
    doImport()
  }

  // -------------------------------------------------------------------------

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center px-4 text-center">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">
          <p className="text-4xl mb-4">🧶</p>
          <h1 className="text-lg font-semibold text-gray-800 mb-2">Lien invalide</h1>
          <p className="text-sm text-gray-500 mb-6">{error}</p>
          <Link to="/" className="text-sm text-primary-600 hover:text-primary-700 font-medium">
            Retour à YarnFlow
          </Link>
        </div>
      </div>
    )
  }

  if (importing) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3">
        <div className="animate-spin w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full" />
        <p className="text-sm text-gray-500">Création du projet en cours…</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col items-center justify-center px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-sm w-full">

        {/* Partenaire */}
        <p className="text-xs font-medium text-primary-600 uppercase tracking-wider mb-1">
          Patron {template.partner_name}
        </p>

        {/* Titre */}
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{template.title}</h1>

        {/* Description */}
        {template.description && (
          <p className="text-sm text-gray-500 mb-4">{template.description}</p>
        )}

        {/* Infos techniques */}
        <div className="flex flex-wrap gap-2 mb-6">
          {template.technique && (
            <span className="px-3 py-1 bg-primary-50 text-primary-700 rounded-full text-xs font-medium capitalize">
              {template.technique}
            </span>
          )}
          {template.needle_size && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
              Aiguilles {template.needle_size}
            </span>
          )}
          {template.yarn_weight && (
            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs capitalize">
              {template.yarn_weight}
            </span>
          )}
        </div>

        {/* Sections */}
        {template.sections && template.sections.length > 0 && (
          <div className="mb-6">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
              Sections ({template.sections.length})
            </p>
            <div className="space-y-1.5">
              {template.sections.map((s, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-gray-50">
                  <span className="text-sm text-gray-700">{s.title}</span>
                  {s.row_count && (
                    <span className="text-xs text-gray-400">{s.row_count} rangs</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <button
          onClick={handleImportClick}
          className="w-full py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold transition-colors"
        >
          {user ? 'Ajouter à mes projets' : 'Créer un compte pour utiliser ce patron'}
        </button>

        {!user && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Déjà un compte ?{' '}
            <button
              onClick={() => {
                localStorage.setItem(PENDING_IMPORT_KEY, code)
                navigate('/login', { state: { from: `/import/${code}` } })
              }}
              className="text-primary-600 hover:text-primary-700 font-medium"
            >
              Se connecter
            </button>
          </p>
        )}

        {/* Logo YarnFlow discret */}
        <div className="mt-6 pt-4 border-t border-gray-100 text-center">
          <Link to="/" className="text-xs text-gray-400 hover:text-gray-500">
            Propulsé par YarnFlow
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ImportPartnerPattern
