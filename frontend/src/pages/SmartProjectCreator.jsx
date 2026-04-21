import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import axios from 'axios'

/**
 * SmartProjectCreator - Création intelligente de projets via IA
 * Version 0.17.0 - 2026-01-07
 *
 * Workflow:
 * 1. Choix du mode (PDF ou URL)
 * 2. Upload/Analyse IA (loading)
 * 3. Validation/Édition
 * 4. Création confirmée
 */

export default function SmartProjectCreator() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const isPro = user && user.subscription_type && user.subscription_type !== 'free' && (
    !user.subscription_expires_at || new Date(user.subscription_expires_at) > new Date()
  )

  // État du workflow
  const [step, setStep] = useState(1)
  const [mode, setMode] = useState(null)

  // Données
  const [quota, setQuota] = useState(null) // { is_pro, free_trial_used, total_used }
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [analyzing, setAnalyzing] = useState(false)
  const [extractedData, setExtractedData] = useState(null)
  const [aiStatus, setAiStatus] = useState(null)
  const [error, setError] = useState(null)

  // Projet éditable
  const [project, setProject] = useState({
    title: '',
    craft_type: 'crochet',
    category: null,
    description: '',
    yarn: { brand: '', color: '', weight: '', composition: '' },
    hook_or_needles: { size: '' },
    gauge: { stitches: null, rows: null, size_cm: 10 },
    pattern_notes: ''
  })

  const [sections, setSections] = useState([])
  const [creating, setCreating] = useState(false)
  const [createdProject, setCreatedProject] = useState(null)

  // Charger le quota au montage
  useEffect(() => {
    fetchQuota()
  }, [])

  const fetchQuota = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await axios.get('/api/projects/smart-create/quota', {
        headers: { Authorization: `Bearer ${token}` }
      })
      setQuota(response.data.quota)
    } catch (err) {
      console.error('Erreur quota:', err)
    }
  }

  const handleModeSelect = (selectedMode) => {
    setMode(selectedMode)
    setStep(2)
    setError(null)
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0]
    if (selectedFile) {
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('Fichier trop volumineux (max 10 MB)')
        return
      }
      if (selectedFile.type !== 'application/pdf') {
        setError('Seuls les fichiers PDF sont acceptés')
        return
      }
      setFile(selectedFile)
      setError(null)
    }
  }

  const handleAnalyze = async () => {
    if (mode === 'pdf' && !file) {
      setError('Veuillez sélectionner un fichier PDF')
      return
    }
    if (mode === 'url' && !url) {
      setError('Veuillez saisir une URL')
      return
    }

    setAnalyzing(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()

      if (mode === 'pdf') {
        formData.append('file', file)
      } else {
        formData.append('url', url)
      }

      const response = await axios.post('/api/projects/smart-create/analyze', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      })

      if (response.data.success) {
        setExtractedData(response.data.data)
        setAiStatus(response.data.ai_status)

        // Pré-remplir les champs
        setProject({
          title: response.data.data.title || '',
          craft_type: response.data.data.craft_type || 'crochet',
          category: response.data.data.category || null,
          description: response.data.data.description || '',
          yarn: response.data.data.yarn || { brand: '', color: '', weight: '', composition: '' },
          hook_or_needles: response.data.data.hook_or_needles || { size: '' },
          gauge: response.data.data.gauge || { stitches: null, rows: null, size_cm: 10 },
          pattern_notes: response.data.data.pattern_notes || ''
        })

        setSections(response.data.data.sections || [])
        setStep(3)

        // Recharger le quota
        fetchQuota()
      } else {
        setError(response.data.error || 'Erreur lors de l\'analyse')
        setAiStatus(response.data.ai_status)
      }
    } catch (err) {
      console.error('Erreur analyze:', err)
      if (err.response?.status === 403) {
        fetchQuota() // recharge pour afficher l'écran d'upgrade
        setError(err.response.data?.free_trial_used
          ? 'Essai gratuit déjà utilisé — passez à PRO pour continuer.'
          : 'La création intelligente est réservée aux abonnés PRO.'
        )
      } else {
        setError(err.response?.data?.error || 'Erreur lors de l\'analyse du patron')
      }
    } finally {
      setAnalyzing(false)
    }
  }

  const handleConfirm = async () => {
    if (!project.title) {
      setError('Le titre du projet est requis')
      return
    }

    setCreating(true)
    setError(null)

    try {
      const token = localStorage.getItem('token')
      const response = await axios.post('/api/projects/smart-create/confirm', {
        project,
        sections,
        source_type: mode,
        source_url: mode === 'pdf' ? file.name : url
      }, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      })

      if (response.data.success) {
        setCreatedProject(response.data.project)
        setStep(4)
      } else {
        setError(response.data.error || 'Erreur lors de la création du projet')
      }
    } catch (err) {
      console.error('Erreur confirm:', err)
      setError(err.response?.data?.error || 'Erreur lors de la création du projet')
    } finally {
      setCreating(false)
    }
  }

  const addSection = () => {
    setSections([...sections, { name: '', unit: 'rangs', target: null, description: '' }])
  }

  const updateSection = (index, field, value) => {
    const newSections = [...sections]
    newSections[index][field] = value
    setSections(newSections)
  }

  const removeSection = (index) => {
    setSections(sections.filter((_, i) => i !== index))
  }

  // FREE avec essai déjà utilisé → écran d'upgrade
  if (!isPro && quota?.free_trial_used) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-md mx-auto px-4 py-20 text-center space-y-6">
          <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Création Intelligente</h1>
          <p className="text-gray-500">Vous avez utilisé votre essai gratuit. Passez à PRO pour importer autant de patrons que vous voulez.</p>
          <div className="bg-primary-50 rounded-xl p-4 text-left space-y-2">
            <p className="text-sm font-semibold text-primary-900">Avec PRO :</p>
            <p className="text-sm text-primary-700">Imports illimités — PDF, URL, Ravelry</p>
            <p className="text-sm text-primary-700">Sections et détails techniques créés automatiquement</p>
            <p className="text-sm text-primary-700">Assistant IA, photos pro, stats complètes</p>
          </div>
          <Link to="/subscription" className="inline-block px-6 py-3 bg-primary-600 text-white rounded-xl font-semibold hover:bg-primary-700 transition">
            Passer à PRO — 3,99€/mois
          </Link>
          <button onClick={() => navigate(-1)} className="block w-full text-sm text-gray-400 hover:text-gray-600">
            Retour
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/my-projects')}
            className="text-primary-600 hover:text-primary-700 mb-4 flex items-center gap-2"
          >
            ← Retour aux projets
          </button>

          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Création Intelligente
          </h1>
          <p className="text-gray-600">
            Importez un patron PDF ou URL et laissez l'IA créer votre projet automatiquement
          </p>

          {/* Badge quota */}
          {quota && (
            <div className={`mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border ${
              quota.is_pro
                ? 'bg-primary-50 border-primary-200'
                : 'bg-amber-50 border-amber-200'
            }`}>
              <span className={`text-sm font-medium ${quota.is_pro ? 'text-primary-700' : 'text-amber-700'}`}>
                {quota.is_pro
                  ? `${quota.remaining} import${quota.remaining !== 1 ? 's' : ''} restant${quota.remaining !== 1 ? 's' : ''} ce mois`
                  : 'Essai gratuit — 1 import offert'
                }
              </span>
            </div>
          )}
        </div>

        {/* Étapes */}
        {/* Mobile : étape X / 4 + barre de progression */}
        <div className="mb-8 sm:hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-primary-600">
              Étape {step} / 4 — {[, 'Mode', 'Analyse', 'Validation', 'Création'][step]}
            </span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full">
            <div
              className="h-1.5 bg-primary-600 rounded-full transition-all"
              style={{ width: `${(step / 4) * 100}%` }}
            />
          </div>
        </div>
        {/* Desktop : stepper complet */}
        <div className="mb-8 hidden sm:flex items-center justify-center gap-4">
          {[
            { num: 1, label: 'Mode' },
            { num: 2, label: 'Analyse' },
            { num: 3, label: 'Validation' },
            { num: 4, label: 'Création' }
          ].map((s) => (
            <div key={s.num} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                step >= s.num ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-500'
              }`}>
                {s.num}
              </div>
              <span className={`text-sm ${step >= s.num ? 'text-primary-600 font-medium' : 'text-gray-400'}`}>
                {s.label}
              </span>
              {s.num < 4 && <span className="text-gray-300">→</span>}
            </div>
          ))}
        </div>

        {/* Erreur globale */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700">
            {error}
          </div>
        )}

        {/* ÉTAPE 1 : Choix du mode */}
        {step === 1 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6 text-center">
              Comment souhaitez-vous importer votre patron ?
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Mode PDF */}
              <button
                onClick={() => handleModeSelect('pdf')}
                className="p-8 border border-gray-200 rounded-2xl hover:border-primary-400 hover:bg-primary-50 transition group"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Fichier PDF</h3>
                <p className="text-sm text-gray-600">
                  Uploadez un patron au format PDF (max 10 MB)
                </p>
                <div className="mt-4 text-primary-600 group-hover:text-primary-700 font-medium">
                  Choisir →
                </div>
              </button>

              {/* Mode URL */}
              <button
                onClick={() => handleModeSelect('url')}
                className="p-8 border border-gray-200 rounded-2xl hover:border-primary-400 hover:bg-primary-50 transition group"
              >
                <div className="w-12 h-12 bg-primary-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
                  <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" /></svg>
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">Lien Web</h3>
                <p className="text-sm text-gray-600">
                  Importez depuis une URL (blog, site web)
                </p>
                <div className="mt-4 text-primary-600 group-hover:text-primary-700 font-medium">
                  Choisir →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Upload/URL + Analyse */}
        {step === 2 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-6">
              {mode === 'pdf' ? 'Importer un PDF' : 'Importer depuis une URL'}
            </h2>

            {mode === 'pdf' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fichier PDF (max 10 MB)
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
                {file && (
                  <p className="mt-2 text-sm text-green-600">
                    ✓ {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                  </p>
                )}
              </div>
            )}

            {mode === 'url' && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL du patron
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://exemple.com/mon-patron"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            )}

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                ← Retour
              </button>

              <button
                onClick={handleAnalyze}
                disabled={analyzing || (mode === 'pdf' && !file) || (mode === 'url' && !url)}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {analyzing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Analyse en cours...
                  </>
                ) : (
                  'Analyser avec l\'IA'
                )}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Validation/Édition */}
        {step === 3 && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-2">
              Vérifiez et modifiez les informations
            </h2>

            {aiStatus === 'partial' && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-yellow-800 text-sm">
                Certaines informations n'ont pas pu être détectées automatiquement. Complétez les champs manquants.
              </div>
            )}

            {/* Informations de base */}
            <div className="mb-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Titre du projet *</label>
                <input
                  type="text"
                  value={project.title}
                  onChange={(e) => setProject({...project, title: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Type de projet</label>
                  <select
                    value={project.craft_type}
                    onChange={(e) => setProject({...project, craft_type: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="crochet">Crochet</option>
                    <option value="tricot">Tricot</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Catégorie</label>
                  <select
                    value={project.category || ''}
                    onChange={(e) => setProject({...project, category: e.target.value || null})}
                    className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Sélectionner --</option>
                    <option value="bonnet">Bonnet</option>
                    <option value="écharpe">Écharpe</option>
                    <option value="pull">Pull</option>
                    <option value="amigurumi">Amigurumi</option>
                    <option value="couverture">Couverture</option>
                    <option value="sac">Sac</option>
                    <option value="vêtements">Vêtements</option>
                    <option value="vêtements bébé">Vêtements bébé</option>
                    <option value="accessoires bébé">Accessoires bébé</option>
                    <option value="jouets/peluches">Jouets/Peluches</option>
                    <option value="maison/déco">Maison/Déco</option>
                    <option value="autre">Autre</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={project.description}
                  onChange={(e) => setProject({...project, description: e.target.value})}
                  rows="2"
                  className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>

            {/* Détails techniques */}
            <details className="mb-6 border border-gray-200 rounded-2xl p-4" open>
              <summary className="font-medium text-gray-900 cursor-pointer">Détails techniques</summary>

              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Marque laine</label>
                    <input
                      type="text"
                      value={project.yarn.brand}
                      onChange={(e) => setProject({...project, yarn: {...project.yarn, brand: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Couleur</label>
                    <input
                      type="text"
                      value={project.yarn.color}
                      onChange={(e) => setProject({...project, yarn: {...project.yarn, color: e.target.value}})}
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Épaisseur</label>
                    <input
                      type="text"
                      value={project.yarn.weight}
                      onChange={(e) => setProject({...project, yarn: {...project.yarn, weight: e.target.value}})}
                      placeholder="DK, Worsted, Fingering..."
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 mb-1">Crochet/Aiguilles (mm)</label>
                    <input
                      type="text"
                      value={project.hook_or_needles.size}
                      onChange={(e) => setProject({...project, hook_or_needles: {...project.hook_or_needles, size: e.target.value}})}
                      placeholder="4.5"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm text-gray-700 mb-1">Échantillon (10 cm)</label>
                  <div className="grid grid-cols-2 gap-4">
                    <input
                      type="number"
                      value={project.gauge.stitches || ''}
                      onChange={(e) => setProject({...project, gauge: {...project.gauge, stitches: e.target.value ? parseInt(e.target.value) : null}})}
                      placeholder="Mailles"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                    <input
                      type="number"
                      value={project.gauge.rows || ''}
                      onChange={(e) => setProject({...project, gauge: {...project.gauge, rows: e.target.value ? parseInt(e.target.value) : null}})}
                      placeholder="Rangs"
                      className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm"
                    />
                  </div>
                </div>
              </div>
            </details>

            {/* Sections */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900">Sections du projet</h3>
                <button
                  onClick={addSection}
                  className="px-3 py-1 text-sm bg-primary-600 text-white rounded-xl hover:bg-primary-700"
                >
                  + Ajouter
                </button>
              </div>

              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div key={index} className="border border-gray-200 rounded-2xl p-3">
                    <div className="flex gap-2 items-start mb-2">
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) => updateSection(index, 'name', e.target.value)}
                          placeholder="Nom section (ex: Corps)"
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                        <select
                          value={section.unit}
                          onChange={(e) => updateSection(index, 'unit', e.target.value)}
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        >
                          <option value="rangs">Rangs</option>
                          <option value="cm">Centimètres</option>
                        </select>
                        <input
                          type="number"
                          value={section.target || ''}
                          onChange={(e) => updateSection(index, 'target', e.target.value ? parseInt(e.target.value) : null)}
                          placeholder="Objectif"
                          className="px-2 py-1 border border-gray-300 rounded text-sm"
                        />
                      </div>
                      <button
                        onClick={() => removeSection(index)}
                        className="px-2 py-1 text-red-600 hover:bg-red-50 rounded text-sm"
                      >
                        ✕
                      </button>
                    </div>
                    <textarea
                      value={section.description || ''}
                      onChange={(e) => updateSection(index, 'description', e.target.value)}
                      placeholder="Instructions complètes de cette section (tous les rangs/tours, étapes détaillées...)"
                      rows="4"
                      className="w-full px-2 py-1 border border-gray-300 rounded text-sm font-mono"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Notes patron */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes du patron</label>
              <textarea
                value={project.pattern_notes}
                onChange={(e) => setProject({...project, pattern_notes: e.target.value})}
                rows="3"
                className="w-full px-4 py-2 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="Notes importantes, conseils, modifications..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={() => setStep(2)}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                ← Retour
              </button>

              <button
                onClick={handleConfirm}
                disabled={creating || !project.title}
                className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {creating ? 'Création...' : '✓ Créer le projet'}
              </button>
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Succès */}
        {step === 4 && createdProject && (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-2xl flex items-center justify-center mb-4 mx-auto">
              <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75 11.25 15 15 9.75M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" /></svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Projet créé avec succès !
            </h2>
            <p className="text-gray-600 mb-6">
              Votre projet "{createdProject.name}" a été créé et est prêt à être utilisé.
            </p>

            <div className="flex gap-4 justify-center">
              <button
                onClick={() => navigate(`/project-counter/${createdProject.id}`)}
                className="px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700"
              >
                Ouvrir le projet →
              </button>

              <button
                onClick={() => navigate('/my-projects')}
                className="px-6 py-3 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50"
              >
                Voir tous mes projets
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}
