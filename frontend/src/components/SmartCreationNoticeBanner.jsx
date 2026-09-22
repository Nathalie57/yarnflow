import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

const STORAGE_KEY = 'yf_smart_project_notice'

// [AI:Claude] 2026-09-22 — Bandeau global (monté dans Layout, comme PendingCheckoutBanner)
// pour le cas où l'utilisatrice a quitté SmartProjectCreator pendant l'analyse ("Continuer
// dans YarnFlow"), unifiant 2 issues possibles derrière une seule clé/un seul événement :
//   - kind 'ready'  : succès sans avertissement, submitProject() a créé le projet tout seul.
//   - kind 'gate'   : un avertissement (diagramme/traduction/partiel) attend sa confirmation
//                     — le projet n'existe pas encore, on renvoie vers la reprise existante
//                     (?resume=1 → GET /smart-create/pending, mécanisme pendingImport déjà
//                     en place, non modifié).
// Jamais écrit si l'utilisatrice est restée sur la page (isMountedRef.current vrai dans les
// deux cas côté SmartProjectCreator) — pas de doublon avec la redirection/l'affichage normal.
const readStored = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

const clearStored = () => {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

const SmartCreationNoticeBanner = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(() => readStored())

  useEffect(() => {
    const handler = (e) => setNotice(e.detail || readStored())
    window.addEventListener('yf:smart-creation-notice', handler)
    return () => window.removeEventListener('yf:smart-creation-notice', handler)
  }, [])

  if (!notice) return null

  // [AI:Claude] Ouvrir/reprendre retire la notice stockée, mais ne touche jamais à
  // yf_smart_onboarding_${id} (cas 'ready') ni au pending import backend (cas 'gate') —
  // uniquement la notice de ce bandeau disparaît, l'état réel qu'elle signale est géré
  // ailleurs (ProjectCounter pour l'onboarding, pendingImport()/?resume=1 pour le gate).
  const handleAction = () => {
    clearStored()
    setNotice(null)
    if (notice.kind === 'ready') {
      navigate(`/projects/${notice.id}`)
    } else {
      navigate('/smart-project-creator?resume=1')
    }
  }

  const handleDismiss = () => {
    clearStored()
    setNotice(null)
  }

  return (
    <div className="bg-primary-600 border-b border-primary-700">
      <div className="container mx-auto px-4 py-3">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 flex-1">
            <svg className="w-5 h-5 text-white flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-white font-medium">
              {notice.kind === 'ready'
                ? t('smartCreationNotice.readyBanner', { name: notice.name })
                : t('smartCreationNotice.gateBanner')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAction}
              className="px-4 py-1.5 bg-white text-primary-700 text-sm font-semibold rounded-control hover:bg-primary-50 transition"
            >
              {notice.kind === 'ready' ? t('smartCreationNotice.readyCta') : t('smartCreationNotice.gateCta')}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-primary-100 text-sm hover:text-white transition"
            >
              {t('smartCreationNotice.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SmartCreationNoticeBanner
