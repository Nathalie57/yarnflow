import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import FlowMascot from './FlowMascot'
import api from '../services/api'

const STORAGE_KEY = 'yf_smart_project_notice'
const NOTICE_TTL_MS = 7 * 24 * 60 * 60 * 1000

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
    const stored = raw ? JSON.parse(raw) : null
    if (stored?.kind === 'gate' && stored.createdAt && Date.now() - stored.createdAt >= NOTICE_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return stored
  } catch {
    return null
  }
}

const clearStored = () => {
  try { localStorage.removeItem(STORAGE_KEY) } catch { /* ignore */ }
}

const SmartCreationNoticeBanner = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const [notice, setNotice] = useState(() => readStored())

  useEffect(() => {
    const handler = (e) => setNotice(e.detail ?? null)
    window.addEventListener('yf:smart-creation-notice', handler)
    return () => window.removeEventListener('yf:smart-creation-notice', handler)
  }, [])

  useEffect(() => {
    if (notice?.kind !== 'gate') return
    let cancelled = false
    api.get('/projects/smart-create/pending')
      .then((response) => {
        const pending = response.data?.pending
        const sameImport = !notice.importId || response.data?.import_id === notice.importId
        if (!cancelled && (!pending || !sameImport)) {
          clearStored()
          setNotice(null)
        }
      })
      .catch(() => {})
    return () => { cancelled = true }
  }, [notice?.kind, notice?.importId])

  useEffect(() => {
    if (notice?.kind !== 'gate' || !notice.createdAt) return
    const remainingMs = NOTICE_TTL_MS - (Date.now() - notice.createdAt)
    if (remainingMs <= 0) {
      clearStored()
      setNotice(null)
      return
    }
    const expiryTimer = setTimeout(() => {
      clearStored()
      setNotice(null)
    }, remainingMs)
    return () => clearTimeout(expiryTimer)
  }, [notice?.kind, notice?.createdAt])

  if (!notice) return null

  // Un projet déjà créé peut retirer sa notice. Une analyse à confirmer reste au contraire
  // disponible sous forme compacte jusqu'à sa résolution ou son expiration.
  const handleAction = () => {
    if (notice.kind === 'ready') {
      clearStored()
      setNotice(null)
      navigate(`/projects/${notice.id}`)
    } else {
      const compactNotice = { ...notice, display: 'compact' }
      try { localStorage.setItem(STORAGE_KEY, JSON.stringify(compactNotice)) } catch { /* ignore */ }
      setNotice(compactNotice)
      navigate('/smart-project-creator?resume=1')
    }
  }

  const handleDismiss = () => {
    if (notice.kind === 'ready') {
      clearStored()
      setNotice(null)
      return
    }
    const compactNotice = { ...notice, display: 'compact' }
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(compactNotice)) } catch { /* ignore */ }
    setNotice(compactNotice)
  }

  const languageName = (() => {
    if (!notice.language) return ''
    try { return new Intl.DisplayNames([i18n.language], { type: 'language' }).of(notice.language) }
    catch { return notice.language }
  })()

  if (notice.kind === 'gate' && notice.display === 'compact') {
    return (
      <div className="bg-primary-50 border-b border-primary-200">
        <div className="container mx-auto px-4 py-2 flex items-center gap-3">
          <FlowMascot pose="interrogatif" size={42} className="flex-shrink-0" />
          <p className="text-sm text-flow-ink font-medium flex-1">{t('smartCreationNotice.compactReminder')}</p>
          <button
            onClick={handleAction}
            className="px-4 py-1.5 bg-primary-600 text-white text-sm font-semibold rounded-control hover:bg-primary-700 transition"
          >
            {t('smartCreationNotice.resumeCta')}
          </button>
        </div>
      </div>
    )
  }

  const gateContent = {
    translation: {
      title: t('smartCreationNotice.translationTitle', { language: languageName }),
      body: t('smartCreationNotice.translationBody'),
      cta: t('smartCreationNotice.translationCta'),
      pose: 'interrogatif',
    },
    diagram: {
      title: t('smartCreationNotice.diagramTitle'),
      body: t('smartCreationNotice.diagramBody'),
      cta: t('smartCreationNotice.reviewCta'),
      pose: 'quiReflechit',
    },
    partial: {
      title: t('smartCreationNotice.partialTitle'),
      body: t('smartCreationNotice.partialBody'),
      cta: t('smartCreationNotice.checkCta'),
      pose: 'interrogatif',
    },
  }[notice.gateType] || {
    title: t('smartCreationNotice.gateBanner'),
    body: '',
    cta: t('smartCreationNotice.gateCta'),
    pose: 'interrogatif',
  }

  return (
    <div className="bg-primary-50 border-b border-primary-200 animate-fade-in-up">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <FlowMascot pose={notice.kind === 'ready' ? 'heureux' : gateContent.pose} size={64} className="flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-base text-flow-ink font-bold">
                {notice.kind === 'ready' ? t('smartCreationNotice.readyTitle') : gateContent.title}
              </p>
              <p className="text-sm text-gray-600 mt-0.5">
                {notice.kind === 'ready'
                  ? t('smartCreationNotice.readyBody', { name: notice.name })
                  : gateContent.body}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={handleAction}
              className="px-4 py-1.5 bg-white text-primary-700 text-sm font-semibold rounded-control hover:bg-primary-50 transition"
            >
              {notice.kind === 'ready' ? t('smartCreationNotice.readyCta') : gateContent.cta}
            </button>
            <button
              onClick={handleDismiss}
              className="px-3 py-1.5 text-primary-700 text-sm hover:text-primary-900 transition"
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
