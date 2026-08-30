/**
 * @file AssociatePatternForAi.jsx
 * @brief "Aide YarnFlow à comprendre ce patron" — associe une analyse IA à un
 * projet existant pour que l'assistant contextuel connaisse ses instructions,
 * sans jamais toucher aux sections/rangs suivis manuellement (voir
 * ProjectController::linkAiPatternReference() côté backend).
 *
 * Si le projet a déjà un patron attaché (fichier importé ou URL, via l'onglet
 * Patron classique), on l'analyse automatiquement — pas de choix proposé,
 * puisqu'il n'y a rien d'autre à faire que réutiliser ce qui existe déjà.
 * Sinon, les 4 mêmes modes d'import que la Création Intelligente (PDF, URL,
 * texte collé, bibliothèque) sont proposés, sans étape de relecture : on
 * enregistre directement le résultat pour que l'assistant puisse démarrer.
 */

import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import api from '../services/api'

const AssociatePatternForAi = ({ projectId, project, onLinked }) => {
  const { t } = useTranslation('counter')
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
  const fileRef = useRef(null)

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

  // [AI:Claude] Patron déjà attaché : on l'analyse directement, aucun choix à faire.
  useEffect(() => {
    if (!existingSource || busy || feedback) return
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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

  // [AI:Claude] Patron déjà attaché : analyse automatique, pas de choix affiché.
  if (existingSource) {
    return (
      <div>
        <p className="text-sm text-gray-600 mb-3">{t('ui.aiHelpPatternDesc')}</p>
        {feedback ? (
          <p className={`text-sm ${feedback.type === 'success' ? 'text-green-700' : 'text-amber-700'}`}>
            {feedback.text}
          </p>
        ) : (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            {t('ui.aiHelpAnalyzingExisting')}
          </p>
        )}
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
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleLibrarySelect(p)}
                  disabled={busy}
                  className="w-full text-left px-3 py-2.5 text-sm hover:bg-gray-50 disabled:opacity-60"
                >
                  {p.name}
                </button>
              ))
            )}
          </div>
          <button type="button" onClick={() => setMode(null)} disabled={busy} className="text-sm text-gray-500 hover:text-gray-700">
            {t('ui.cancel')}
          </button>
        </div>
      )}

      <input ref={fileRef} type="file" accept="application/pdf" className="hidden" onChange={handleFile} />
    </div>
  )
}

export default AssociatePatternForAi
