import { useEffect, useRef, useState } from 'react'
import axios from 'axios'
import api from '../../services/api'

const adminPartnerAPI = {
  list:   ()     => api.get('/admin/partner-patterns'),
  create: (data) => api.post('/admin/partner-patterns', data),
}

const EMPTY_FORM = {
  partner_name: '',
  title: '',
  type: 'other',
  technique: 'tricot',
  description: '',
  needle_size: '',
  yarn_weight: '',
  sections: '',
}

const AdminPartnerPatterns = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading]     = useState(true)
  const [showForm, setShowForm]   = useState(false)
  const [saving, setSaving]       = useState(false)
  const [form, setForm]           = useState(EMPTY_FORM)
  const [created, setCreated]     = useState(null)
  const [error, setError]         = useState(null)

  const [analyzing, setAnalyzing] = useState(false)
  const [analyzeError, setAnalyzeError] = useState(null)
  const fileRef = useRef(null)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const res = await adminPartnerAPI.list()
      setTemplates(res.data.templates || [])
    } catch {
      setError('Impossible de charger les templates.')
    } finally {
      setLoading(false)
    }
  }

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleAnalyzePdf = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      setAnalyzeError('Seuls les fichiers PDF sont acceptés.')
      return
    }
    setAnalyzing(true)
    setAnalyzeError(null)
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('file', file)
      const res = await axios.post('/api/projects/smart-create/analyze', formData, {
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'multipart/form-data' }
      })
      if (!res.data.success) throw new Error(res.data.error || 'Erreur analyse')
      const d = res.data.data
      const sections = (d.sections || [])
        .map(s => `${s.title || ''}${s.total_rows ? ', ' + s.total_rows : ''}`)
        .join('\n')
      setForm(f => ({
        ...f,
        title:       d.title             || f.title,
        technique:   d.craft_type === 'crochet' ? 'crochet' : 'tricot',
        needle_size: d.hook_or_needles?.size || f.needle_size,
        yarn_weight: d.yarn?.weight      || f.yarn_weight,
        description: d.description       || f.description,
        sections,
      }))
    } catch (err) {
      setAnalyzeError(err.response?.data?.error || err.message || 'Erreur lors de l\'analyse.')
    } finally {
      setAnalyzing(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setSaving(true)
    try {
      let sections = null
      if (form.sections.trim()) {
        sections = form.sections.trim().split('\n').map(line => {
          const [title, row_count] = line.split(',').map(s => s.trim())
          return { title, row_count: row_count ? parseInt(row_count) : null }
        })
      }
      const res = await adminPartnerAPI.create({
        partner_name: form.partner_name,
        title:        form.title,
        type:         form.type,
        technique:    form.technique,
        description:  form.description || null,
        needle_size:  form.needle_size  || null,
        yarn_weight:  form.yarn_weight  || null,
        sections,
      })
      setCreated(res.data)
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la création.')
    } finally {
      setSaving(false)
    }
  }

  const inputCls = "w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-400"
  const labelCls = "block text-xs font-medium text-gray-600 mb-1"

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Patrons partenaires</h1>
          <p className="text-sm text-gray-500 mt-0.5">QR codes d'import de projets</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setCreated(null); setAnalyzeError(null) }}
          className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold"
        >
          + Nouveau template
        </button>
      </div>

      {/* Dernier QR code créé */}
      {created && (
        <div className="mb-6 bg-green-50 border border-green-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-green-800 mb-1">Template créé</p>
          <p className="text-sm text-green-700 mb-2">
            Code : <strong>{created.template?.code}</strong>
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800 break-all">
              {created.qr_url}
            </code>
            <button
              onClick={() => navigator.clipboard.writeText(created.qr_url)}
              className="px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700"
            >
              Copier
            </button>
          </div>
        </div>
      )}

      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">
          {error}
        </div>
      )}

      {/* Formulaire création */}
      {showForm && (
        <div className="mb-6 bg-white border border-gray-200 rounded-2xl p-6">
          <h2 className="font-semibold text-gray-900 mb-4">Nouveau template</h2>

          {/* Zone analyse PDF */}
          <div className="mb-5 bg-primary-50 border border-primary-200 rounded-xl p-4">
            <p className="text-xs font-medium text-primary-800 mb-2">
              Analyser un PDF pour pré-remplir le formulaire
            </p>
            <label className={`flex items-center gap-3 cursor-pointer ${analyzing ? 'opacity-50 pointer-events-none' : ''}`}>
              <span className="px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-lg text-xs font-semibold">
                {analyzing ? 'Analyse en cours…' : 'Choisir un PDF'}
              </span>
              <span className="text-xs text-primary-700">ou remplir manuellement ci-dessous</span>
              <input
                ref={fileRef}
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={handleAnalyzePdf}
                disabled={analyzing}
              />
            </label>
            {analyzing && (
              <div className="flex items-center gap-2 mt-2">
                <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-primary-700">Analyse IA en cours…</span>
              </div>
            )}
            {analyzeError && (
              <p className="text-xs text-red-600 mt-2">{analyzeError}</p>
            )}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={labelCls}>Partenaire *</label>
                <input required className={inputCls} placeholder="Knit Eat" value={form.partner_name} onChange={set('partner_name')} />
              </div>
              <div>
                <label className={labelCls}>Titre du patron *</label>
                <input required className={inputCls} placeholder="Pull Léa" value={form.title} onChange={set('title')} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className={labelCls}>Technique</label>
                <select className={inputCls} value={form.technique} onChange={set('technique')}>
                  <option value="tricot">Tricot</option>
                  <option value="crochet">Crochet</option>
                  <option value="autre">Autre</option>
                </select>
              </div>
              <div>
                <label className={labelCls}>Aiguilles</label>
                <input className={inputCls} placeholder="4mm" value={form.needle_size} onChange={set('needle_size')} />
              </div>
              <div>
                <label className={labelCls}>Épaisseur</label>
                <input className={inputCls} placeholder="DK" value={form.yarn_weight} onChange={set('yarn_weight')} />
              </div>
            </div>

            <div>
              <label className={labelCls}>Description</label>
              <textarea rows={2} className={inputCls + ' resize-none'} placeholder="Description courte du patron…" value={form.description} onChange={set('description')} />
            </div>

            <div>
              <label className={labelCls}>
                Sections <span className="font-normal text-gray-400">(une par ligne, format : Titre, NbRangs — ex: "Dos, 80")</span>
              </label>
              <textarea
                rows={4}
                className={inputCls + ' resize-none font-mono text-xs'}
                placeholder={"Dos, 80\nDevant, 80\nManche gauche, 50\nManche droite, 50"}
                value={form.sections}
                onChange={set('sections')}
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                Annuler
              </button>
              <button type="submit" disabled={saving} className="flex-1 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-sm font-semibold disabled:opacity-60">
                {saving ? 'Création…' : 'Créer le template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">
          <div className="animate-spin w-6 h-6 border-2 border-primary-400 border-t-transparent rounded-full mx-auto mb-2" />
          Chargement…
        </div>
      ) : templates.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">Aucun template pour l'instant.</div>
      ) : (
        <div className="space-y-3">
          {templates.map(t => (
            <div key={t.code} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-primary-600 font-medium">{t.partner_name}</p>
                  <p className="font-semibold text-gray-900">{t.title}</p>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {t.technique} · {t.needle_size || '—'} · {t.yarn_weight || '—'}
                    {t.sections?.length > 0 && ` · ${t.sections.length} sections`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs bg-primary-50 text-primary-700 rounded-full px-2 py-1">{t.scan_count} scans</span>
                  <p className="text-xs text-gray-400 mt-1 font-mono">{t.code}</p>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <code className="flex-1 text-xs bg-gray-50 rounded-lg px-2 py-1.5 text-gray-600 truncate">
                  yarnflow.fr/import/{t.code}
                </code>
                <button
                  onClick={() => navigator.clipboard.writeText(`https://yarnflow.fr/import/${t.code}`)}
                  className="text-xs text-primary-600 hover:text-primary-700 font-medium whitespace-nowrap"
                >
                  Copier
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminPartnerPatterns
