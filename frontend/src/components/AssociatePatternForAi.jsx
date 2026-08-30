/**
 * @file AssociatePatternForAi.jsx
 * @brief "Aide YarnFlow à comprendre ce patron" — associe une analyse IA à un
 * projet existant pour que l'assistant contextuel connaisse ses instructions,
 * sans jamais toucher aux sections/rangs suivis manuellement (voir
 * ProjectController::linkAiPatternReference() côté backend).
 *
 * Consomme le même quota que la Création Intelligente classique (voir
 * ProjectController::linkAiPatternReference()) — jamais déclenché sans une
 * confirmation explicite de l'utilisatrice, même quand un patron est déjà
 * attaché et qu'il n'y a "rien d'autre à choisir" : consommer un crédit
 * limité sans prévenir serait trompeur.
 *
 * Si le projet a déjà un patron attaché (fichier importé ou URL, via l'onglet
 * Patron classique), un seul bouton de confirmation suffit (pas de choix de
 * source à faire, juste valider). Sinon, les 4 mêmes modes d'import que la
 * Création Intelligente (PDF, URL, texte collé, bibliothèque) sont proposés,
 * sans étape de relecture : on enregistre directement le résultat pour que
 * l'assistant puisse démarrer.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { useAlert } from '../hooks/useAlert'

const AssociatePatternForAi = ({ projectId, project, onLinked }) => {
  const { t } = useTranslation('counter')
  const { showConfirm, AlertModals } = useAlert()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState(null) // { type: 'success' | 'error', text }
  const [mode, setMode] = useState(null) // null | 'pdf' | 'url' | 'text' | 'library'
  const [urlInput, setUrlInput] = useState('')
  const [pastedText, setPastedText] = useState('')
  // [AI:Claude] URL d'origine optionnelle quand le texte est collé faute de pouvoir
  // scraper le site (ex: Cloudflare) — pour retrouver facilement le patron original
  const [pastedTextSourceUrl, setPastedTextSourceUrl] = useState('')
  const [libraryPatterns, setLibraryPatterns] = useState([])
  const [loadingLibrary, setLoadingLibrary] = useState(false)
  const [quotaRemaining, setQuotaRemaining] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => {
    api.get('/projects/smart-create/quota')
      .then(res => setQuotaRemaining(res.data?.quota?.remaining ?? null))
      .catch(() => {})
  }, [])

  const existingSource = project?.pattern_url
    ? { type: 'url', value: project.pattern_url }
    : project?.pattern_path
      ? { type: 'file', value: `${import.meta.env.VITE_BACKEND_URL}${project.pattern_path}` }
      : null

  const analyzeAndLink = async (formData, patternText, sourceUrl) => {
    setBusy(true)
    setFeedback(null)
    try {
      const analyzeRes = await api.post('/projects/smart-create/analyze', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      if (!analyzeRes.data.success) {
        setFeedback({ type: 'error', text: analyzeRes.data.error || t('ui.aiHelpAnalyzeFailed') })
        return
      }

      await api.post(`/projects/${projectId}/link-pattern-reference`, {
        import_id: analyzeRes.data.import_id,
        pattern_text: patternText,
        source_url: sourceUrl
      })
      setFeedback({ type: 'success', text: t('ui.aiHelpLinked') })
      if (onLinked) onLinked()
    } catch (err) {
      const data = err.response?.data
      setFeedback({ type: 'error', text: data?.error || t('ui.aiHelpAnalyzeFailed') })
    } finally {
      setBusy(false)
    }
  }

  // [AI:Claude] Patron déjà attaché : rien à choisir, mais l'analyse consomme quand
  // même un crédit — un clic de confirmation explicite reste nécessaire.
  const analyzeExisting = () => {
    if (!existingSource || busy) return
    if (existingSource.type === 'url') {
      const formData = new FormData()
      formData.append('url', existingSource.value)
      analyzeAndLink(formData)
      return
    }
    setBusy(true)
    setFeedback(null)
    fetch(existingSource.value)
      .then(res => res.blob())
      .then(blob => {
        const formData = new FormData()
        formData.append('file', blob, 'patron.pdf')
        return analyzeAndLink(formData)
      })
      .catch(() => {
        setFeedback({ type: 'error', text: t('ui.aiHelpAnalyzeFailed') })
        setBusy(false)
      })
  }

  const loadLibrary = async () => {
    setMode('library')
    setLoadingLibrary(true)
    try {
      const response = await api.get('/pattern-library', { params: { limit: 100 } })
      setLibraryPatterns((response.data.patterns || []).filter(p => p.file_path))
    } catch (err) {
      setFeedback({ type: 'error', text: t('ui.aiHelpAnalyzeFailed') })
    } finally {
      setLoadingLibrary(false)
    }
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    const formData = new FormData()
    formData.append('file', file)
    analyzeAndLink(formData)
  }

  const handleUrlSubmit = () => {
    if (!urlInput.trim() || busy) return
    const formData = new FormData()
    formData.append('url', urlInput.trim())
    analyzeAndLink(formData)
  }

  const handleTextSubmit = () => {
    if (!pastedText.trim() || busy) return
    const formData = new FormData()
    formData.append('pattern_text', pastedText.trim())
    analyzeAndLink(formData, pastedText.trim(), pastedTextSourceUrl.trim() || undefined)
  }

  const handleLibrarySelect = (pattern) => {
    if (busy) return
    const formData = new FormData()
    formData.append('library_pattern_id', pattern.id)
    analyzeAndLink(formData)
  }

  // [AI:Claude] Aucun moyen de nettoyer une entrée de bibliothèque (ex: test, doublon)
  // sans quitter ce picker pour la page "Ma bibliothèque" — autant le permettre ici.
  const handleDeleteLibraryPattern = (pattern) => {
    showConfirm({
      message: t('ui.confirmDeleteLibraryPattern', { name: pattern.name }),
      onConfirm: async () => {
        try {
          await api.delete(`/pattern-library/${pattern.id}`)
          setLibraryPatterns(prev => prev.filter(p => p.id !== pattern.id))
        } catch {
          setFeedback({ type: 'error', text: t('ui.aiHelpAnalyzeFailed') })
        }
      },
      title: t('ui.deletePattern')
    })
  }

  // [AI:Claude] Patron déjà attaché : rien à choisir comme source, mais l'analyse
  // consomme un crédit — un bouton de confirmation explicite reste nécessaire.
  if (existingSource) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-3">{t('ui.aiHelpPatternDesc')}</p>
        {feedback ? (
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-amber-700'}`}>
            {feedback.text}
          </p>
        ) : busy ? (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            {t('ui.aiHelpAnalyzingExisting')}
          </p>
        ) : (
          <div>
            <p className="text-xs text-gray-500 mb-3">
              {quotaRemaining !== null ? t('ui.aiHelpCreditCost', { count: quotaRemaining }) : t('ui.aiHelpCreditCostGeneric')}
            </p>
            <button
              type="button"
              onClick={analyzeExisting}
              className="w-full px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition"
            >
              {t('ui.aiHelpAnalyzeExistingCta')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // [AI:Claude] L'analyse (upload PDF/URL/bibliothèque) peut prendre plusieurs dizaines
  // de secondes (Gemini) — sans indicateur, l'écran semblait figé (boutons désactivés,
  // rien d'autre) une fois qu'on avait choisi une source.
  if (busy) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-3">{t('ui.aiHelpPatternDesc')}</p>
        <p className="text-sm text-gray-500 flex items-center gap-2">
          <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
          {t('ui.aiHelpAnalyzing')}
        </p>
      </div>
    )
  }

  return (
    <div>
      <p className="text-sm text-gray-600 mb-4">{t('ui.aiHelpPatternDesc')}</p>
      {feedback && (
        <p className={`text-xs mb-3 ${feedback.type === 'success' ? 'text-green-700' : 'text-amber-700'}`}>
          {feedback.text}
        </p>
      )}

      {mode === null && (
        <>
          <p className="text-xs text-gray-500 mb-2">
            {quotaRemaining !== null ? t('ui.aiHelpCreditCost', { count: quotaRemaining }) : t('ui.aiHelpCreditCostGeneric')}
          </p>
          <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={busy}
            className="p-3 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition text-left disabled:opacity-60"
          >
            <div className="text-sm font-medium text-gray-900">{t('ui.pdfFile')}</div>
            <div className="text-xs text-gray-500">{t('ui.pdfMaxSize')}</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('url')}
            disabled={busy}
            className="p-3 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition text-left disabled:opacity-60"
          >
            <div className="text-sm font-medium text-gray-900">{t('ui.webLink')}</div>
            <div className="text-xs text-gray-500">{t('ui.fromUrl')}</div>
          </button>
          <button
            type="button"
            onClick={() => setMode('text')}
            disabled={busy}
            className="p-3 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition text-left disabled:opacity-60"
          >
            <div className="text-sm font-medium text-gray-900">{t('ui.pasteText')}</div>
            <div className="text-xs text-gray-500">{t('ui.pasteTextHint')}</div>
          </button>
          <button
            type="button"
            onClick={loadLibrary}
            disabled={busy}
            className="p-3 border border-gray-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 transition text-left disabled:opacity-60"
          >
            <div className="text-sm font-medium text-gray-900">{t('ui.myLibrary')}</div>
            <div className="text-xs text-gray-500">{t('ui.patternAlreadyInLibrary')}</div>
          </button>
          </div>
        </>
      )}

      {mode === 'url' && (
        <div className="space-y-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="https://..."
            disabled={busy}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleUrlSubmit}
              disabled={busy || !urlInput.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-60"
            >
              {busy ? t('ui.aiHelpAnalyzing') : t('ui.aiHelpPatternCta')}
            </button>
            <button type="button" onClick={() => setMode(null)} disabled={busy} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              {t('ui.cancel')}
            </button>
          </div>
        </div>
      )}

      {mode === 'text' && (
        <div className="space-y-2">
          <textarea
            value={pastedText}
            onChange={(e) => setPastedText(e.target.value)}
            rows={5}
            placeholder={t('ui.phPastedPattern')}
            disabled={busy}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <input
            type="url"
            value={pastedTextSourceUrl}
            onChange={(e) => setPastedTextSourceUrl(e.target.value)}
            placeholder={t('ui.phPastedTextSourceUrl')}
            disabled={busy}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={handleTextSubmit}
              disabled={busy || !pastedText.trim()}
              className="flex-1 px-4 py-2 bg-primary-600 text-white rounded-lg text-sm font-medium hover:bg-primary-700 transition disabled:opacity-60"
            >
              {busy ? t('ui.aiHelpAnalyzing') : t('ui.aiHelpPatternCta')}
            </button>
            <button type="button" onClick={() => setMode(null)} disabled={busy} className="px-3 py-2 text-sm text-gray-500 hover:text-gray-700">
              {t('ui.cancel')}
            </button>
          </div>
        </div>
      )}

      {mode === 'library' && (
        <div className="space-y-2">
          <div className="border border-gray-200 rounded-xl max-h-56 overflow-y-auto">
            {loadingLibrary ? (
              <p className="text-sm text-gray-500 p-3">{t('ui.loading')}</p>
            ) : libraryPatterns.length === 0 ? (
              <p className="text-sm text-gray-500 p-3">{t('ui.noPdfPattern')}</p>
            ) : (
              libraryPatterns.map((p) => (
                <div key={p.id} className="w-full flex items-center gap-2 hover:bg-gray-50">
                  <button
                    type="button"
                    onClick={() => handleLibrarySelect(p)}
                    disabled={busy}
                    className="flex-1 text-left px-3 py-2.5 text-sm disabled:opacity-60"
                  >
                    {p.name}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteLibraryPattern(p)}
                    disabled={busy}
                    className="px-2 text-gray-400 hover:text-red-500 disabled:opacity-60"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                  </button>
                </div>
              ))
            )}
          </div>
          <button type="button" onClick={() => setMode(null)} disabled={busy} className="text-sm text-gray-500 hover:text-gray-700">
            {t('ui.cancel')}
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
      <AlertModals />
    </div>
  )
}

export default AssociatePatternForAi
