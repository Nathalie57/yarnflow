/**
 * @file PatternTranslator.jsx
 * @brief Traducteur de patrons tricot/crochet (anglais → français)
 */

import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function PatternTranslator() {
  const navigate = useNavigate()
  const [mode, setMode] = useState('url')
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [quota, setQuota] = useState(null)

  // Vue résultat
  const [copied, setCopied] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveTechnique, setSaveTechnique] = useState('tricot')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState(null)

  const fileInputRef = useRef(null)

  useEffect(() => {
    api.get('/pattern-translator/quota')
      .then(res => setQuota(res.data.quota))
      .catch(() => {})
  }, [])

  const handleTranslate = async () => {
    setError(null)
    setResult(null)
    setLoading(true)

    try {
      const formData = new FormData()
      if (mode === 'url') {
        if (!url.trim()) { setError('Entrez une URL.'); setLoading(false); return }
        formData.append('url', url.trim())
      } else if (mode === 'text') {
        if (!text.trim()) { setError('Entrez le texte du patron.'); setLoading(false); return }
        formData.append('text', text.trim())
      } else if (mode === 'pdf') {
        if (!file) { setError('Sélectionnez un fichier PDF.'); setLoading(false); return }
        formData.append('file', file)
      }

      const res = await api.post('/pattern-translator/translate', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 120000,
      })

      const translation = res.data.translation

      // Auto-fill nom
      let autoName = ''
      if (mode === 'pdf' && file) {
        autoName = file.name.replace(/\.pdf$/i, '').replace(/[-_]/g, ' ')
      } else {
        const firstLine = translation.split('\n').find(l => l.trim().length > 3 && l.trim().length < 80)
        autoName = firstLine?.trim() ?? ''
      }
      setSaveName(autoName)

      // Auto-detect technique
      const lower = translation.toLowerCase()
      const crochetKeywords = ['maille serrée', ' ms ', 'bride', 'demi-bride', 'chainette', 'crochet']
      setSaveTechnique(crochetKeywords.some(k => lower.includes(k)) ? 'crochet' : 'tricot')

      setResult(translation)
      setSaveError(null)
      if (res.data.quota) setQuota(res.data.quota)
      if (res.data.truncated) setError('Le patron était très long — seule la première partie a été traduite.')

    } catch (err) {
      const data = err.response?.data
      if (data?.quota_exceeded) {
        setError(data.error)
        if (data.quota) setQuota(data.quota)
      } else {
        setError(data?.detail || data?.error || 'Une erreur est survenue. Réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const handleSave = async () => {
    if (!saveName.trim() || !result) return
    setSaving(true)
    setSaveError(null)
    try {
      const res = await api.post('/pattern-library', {
        source_type: 'text',
        name: saveName.trim(),
        pattern_text: result,
        technique: saveTechnique,
      })
      navigate(`/pattern-library/${res.data.pattern.id}`)
    } catch (err) {
      setSaveError('Impossible d\'enregistrer dans la bibliothèque.')
      setSaving(false)
    }
  }

  const canTranslate = quota && quota.remaining > 0

  // Vue résultat
  if (result) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between">
          <button
            onClick={() => setResult(null)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
            </svg>
            Traduire un autre patron
          </button>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-600 transition"
          >
            {copied ? (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
                Copié
              </>
            ) : (
              <>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.666 3.888A2.25 2.25 0 0013.5 2.25h-3c-1.03 0-1.9.693-2.166 1.638m7.332 0c.055.194.084.4.084.612v0a.75.75 0 01-.75.75H9a.75.75 0 01-.75-.75v0c0-.212.03-.418.084-.612m7.332 0c.646.049 1.288.11 1.927.184 1.1.128 1.907 1.077 1.907 2.185V19.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 19.5V6.257c0-1.108.806-2.057 1.907-2.185a48.208 48.208 0 011.927-.184" />
                </svg>
                Copier le texte
              </>
            )}
          </button>
        </div>

        {/* Enregistrer dans la bibliothèque */}
        <div className="bg-primary-50 border border-primary-200 rounded-2xl p-5 space-y-4">
          <div>
            <p className="text-sm font-semibold text-primary-800">Enregistrer dans la bibliothèque</p>
            <p className="text-xs text-primary-600 mt-0.5">Le patron traduit sera accessible depuis votre bibliothèque.</p>
          </div>
          <input
            type="text"
            placeholder="Nom du patron (ex: Pull raglan nordique)"
            value={saveName}
            onChange={e => setSaveName(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSave()}
            className="w-full border border-primary-200 bg-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-primary-400"
          />
          <div className="flex gap-2">
            {['tricot', 'crochet'].map(t => (
              <button
                key={t}
                onClick={() => setSaveTechnique(t)}
                className={`px-4 py-2 rounded-lg text-xs font-semibold border transition ${
                  saveTechnique === t
                    ? 'bg-primary-600 text-white border-primary-600'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
          {saveError && <p className="text-xs text-red-600">{saveError}</p>}
          <button
            onClick={handleSave}
            disabled={saving || !saveName.trim()}
            className="w-full py-3 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Enregistrement…' : 'Enregistrer dans la bibliothèque'}
          </button>
        </div>

        {/* Texte traduit */}
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">Patron traduit</h2>
          <div className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap font-mono">
            {result}
          </div>
        </div>

      </div>
    )
  }

  // Vue formulaire
  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Traducteur de patron</h1>
        <p className="text-sm text-gray-500 mt-1">
          Traduit automatiquement un patron anglais en français, avec les abréviations tricot et crochet.
        </p>
      </div>

      {/* Quota */}
      {quota && (
        <div className={`rounded-xl px-4 py-3 text-sm flex items-center justify-between ${
          quota.remaining === 0 ? 'bg-red-50 border border-red-200' : 'bg-primary-50 border border-primary-200'
        }`}>
          <span className={quota.remaining === 0 ? 'text-red-700' : 'text-primary-700'}>
            {quota.remaining === 0
              ? quota.is_lifetime
                ? '3 traductions gratuites utilisées'
                : `Limite mensuelle atteinte (${quota.limit}/mois)`
              : quota.is_lifetime
                ? `${quota.remaining} traduction${quota.remaining > 1 ? 's' : ''} gratuite${quota.remaining > 1 ? 's' : ''} restante${quota.remaining > 1 ? 's' : ''}`
                : `${quota.used} / ${quota.limit} traductions ce mois`
            }
          </span>
          {quota.remaining === 0 && (
            <Link to="/subscription" className="text-xs font-semibold text-primary-600 hover:underline">
              Passer à PLUS
            </Link>
          )}
        </div>
      )}

      {/* Sélection du mode */}
      <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
        {[
          { key: 'url', label: 'Lien URL' },
          { key: 'text', label: 'Texte' },
          { key: 'pdf', label: 'PDF' },
        ].map(m => (
          <button
            key={m.key}
            onClick={() => { setMode(m.key); setError(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              mode === m.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Saisie selon le mode */}
      {mode === 'url' && (
        <input
          type="url"
          placeholder="https://www.ravelry.com/patterns/..."
          value={url}
          onChange={e => setUrl(e.target.value)}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-primary-400"
        />
      )}

      {mode === 'text' && (
        <>
          <textarea
            placeholder="Collez ici le texte anglais de votre patron..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={12}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:border-primary-400 resize-y"
          />
          <p className="text-xs text-gray-400 -mt-4">Usage personnel uniquement. La traduction automatique peut contenir des erreurs — vérifiez les abréviations avant de tricoter.</p>
        </>
      )}

      {mode === 'pdf' && (
        <div
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center cursor-pointer hover:border-primary-300 hover:bg-primary-50 transition"
        >
          <input ref={fileInputRef} type="file" accept=".pdf" className="hidden" onChange={e => setFile(e.target.files[0])} />
          {file ? (
            <p className="text-sm text-primary-700 font-medium">{file.name}</p>
          ) : (
            <>
              <p className="text-sm text-gray-500">Cliquez pour sélectionner un PDF</p>
              <p className="text-xs text-gray-400 mt-1">Max 10 Mo</p>
            </>
          )}
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Bouton traduire */}
      <button
        onClick={handleTranslate}
        disabled={loading || !canTranslate}
        className="w-full py-3.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <span className="flex items-center justify-center gap-2">
            <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Traduction en cours…
          </span>
        ) : 'Traduire ce patron'}
      </button>

    </div>
  )
}
