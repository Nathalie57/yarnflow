/**
 * @file PatternTranslator.jsx
 * @brief Traducteur de patrons tricot/crochet (anglais → français)
 */

import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import api from '../services/api'

export default function PatternTranslator() {
  const { hasActiveSubscription } = useAuth()
  const [mode, setMode] = useState('url') // 'url' | 'text' | 'pdf'
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)
  const [quota, setQuota] = useState(null)
  const [copied, setCopied] = useState(false)
  const [showSaveForm, setShowSaveForm] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveTechnique, setSaveTechnique] = useState('tricot')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
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

      setResult(res.data.translation)
      setSaved(false)
      setShowSaveForm(false)
      if (res.data.quota) setQuota(res.data.quota)
      if (res.data.truncated) setError('Le patron était très long — seule la première partie a été traduite.')

    } catch (err) {
      const data = err.response?.data
      if (data?.quota_exceeded) {
        setError(data.error)
        if (data.quota) setQuota(data.quota)
      } else {
        setError(data?.error || 'Une erreur est survenue. Réessayez.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!saveName.trim() || !result) return
    setSaving(true)
    try {
      await api.post('/pattern-library', {
        source_type: 'text',
        name: saveName.trim(),
        pattern_text: result,
        technique: saveTechnique,
      })
      setSaved(true)
      setShowSaveForm(false)
    } catch (err) {
      setError('Impossible d\'enregistrer dans la bibliothèque.')
    } finally {
      setSaving(false)
    }
  }

  const handleCopy = () => {
    if (!result) return
    navigator.clipboard.writeText(result).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  const canTranslate = quota && quota.remaining > 0

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-6">

      {/* En-tête */}
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
            onClick={() => { setMode(m.key); setError(null); setResult(null) }}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition ${
              mode === m.key ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {m.label}
          </button>
        ))}
      </div>

      {/* Zone de saisie */}
      <div className="space-y-3">
        {mode === 'url' && (
          <input
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://www.ravelry.com/patterns/library/..."
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            disabled={loading}
          />
        )}

        {mode === 'text' && (
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Collez ici le texte du patron en anglais..."
            rows={10}
            className="w-full border border-gray-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-mono"
            disabled={loading}
          />
        )}

        {mode === 'pdf' && (
          <div
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
              file ? 'border-primary-400 bg-primary-50' : 'border-gray-300 hover:border-primary-300'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => setFile(e.target.files?.[0] || null)}
            />
            {file ? (
              <div className="space-y-1">
                <p className="text-sm font-medium text-primary-700">{file.name}</p>
                <p className="text-xs text-gray-400">{(file.size / 1024 / 1024).toFixed(1)} MB</p>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  className="text-xs text-red-400 hover:text-red-600"
                >
                  Supprimer
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <svg className="w-8 h-8 text-gray-400 mx-auto" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5" />
                </svg>
                <p className="text-sm text-gray-500">Cliquez pour sélectionner un PDF</p>
                <p className="text-xs text-gray-400">Max 10 MB</p>
              </div>
            )}
          </div>
        )}

        {/* Avertissement copyright */}
        <p className="text-xs text-gray-400">
          Usage personnel uniquement. La traduction automatique peut contenir des erreurs — vérifiez les abréviations avant de tricoter.
        </p>
      </div>

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

      {/* Résultat */}
      {result && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700">Traduction</h2>
            <div className="flex items-center gap-3">
              {saved ? (
                <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                  </svg>
                  Enregistré
                </span>
              ) : (
                <button
                  onClick={() => setShowSaveForm(s => !s)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium"
                >
                  Enregistrer dans la bibliothèque
                </button>
              )}
            <button
              onClick={handleCopy}
              className="text-xs text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
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
                  Copier
                </>
              )}
            </button>
            </div>
          </div>

          {/* Formulaire sauvegarde bibliothèque */}
          {showSaveForm && (
            <div className="bg-primary-50 border border-primary-200 rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-primary-700">Enregistrer dans la bibliothèque</p>
              <input
                type="text"
                placeholder="Nom du patron"
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-primary-400"
              />
              <div className="flex gap-2">
                {['tricot', 'crochet'].map(t => (
                  <button
                    key={t}
                    onClick={() => setSaveTechnique(t)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                      saveTechnique === t
                        ? 'bg-primary-600 text-white border-primary-600'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-primary-300'
                    }`}
                  >
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSave}
                  disabled={saving || !saveName.trim()}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg text-xs font-semibold hover:bg-primary-700 transition disabled:opacity-50"
                >
                  {saving ? 'Enregistrement…' : 'Enregistrer'}
                </button>
                <button
                  onClick={() => setShowSaveForm(false)}
                  className="px-4 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-gray-50 transition"
                >
                  Annuler
                </button>
              </div>
            </div>
          )}

          <textarea
            readOnly
            value={result}
            rows={16}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm bg-gray-50 font-mono focus:outline-none resize-y"
          />
        </div>
      )}
    </div>
  )
}
