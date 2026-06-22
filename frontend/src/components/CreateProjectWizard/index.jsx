/**
 * @file CreateProjectWizard/index.jsx
 * @brief Modale de création de projet — formulaire unique (sans étapes)
 * @author Nathalie + Claude
 * @version 0.2.0
 * @date 2026-04-12
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import TagInput from '../TagInput'
import { PROJECT_CATEGORIES } from '../../data/projectTemplates'

const DEFAULT_TECHNICAL_FORM = {
  yarn: [{ brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }],
  needles: [{ type: '', size: '', length: '' }],
  gauge: { stitches: '', rows: '', dimensions: '10 x 10 cm', notes: '' }
}

const DRAFT_KEY = 'yf_wizard'

const CreateProjectWizard = ({
  isOpen,
  onClose,
  onSubmit,
  isSubmitting,
  submitLabel,
  canUseTags,
  popularTags,
  smartQuota,
  onShowUpgradePrompt,
  onOpenLibraryModal,
  onOpenUrlModal,
  onOpenTextModal,
  patternType,
  setPatternType,
  patternFile,
  setPatternFile,
  patternUrl,
  patternText,
  selectedLibraryPattern
}) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [mode, setMode] = useState(null) // null = choix, 'manual' = formulaire

  const [draft] = useState(() => {
    try {
      const s = sessionStorage.getItem(DRAFT_KEY)
      return s ? JSON.parse(s) : {}
    } catch { return {} }
  })

  const [name, setName] = useState(draft.name || '')
  const [technique, setTechnique] = useState(draft.technique || 'crochet')
  const [selectedCategory, setSelectedCategory] = useState(draft.selectedCategory || null)
  const [counterUnit, setCounterUnit] = useState(draft.counterUnit || 'rows')
  const [description, setDescription] = useState(draft.description || '')
  const [isFavorite, setIsFavorite] = useState(draft.isFavorite || false)
  const [projectTags, setProjectTags] = useState(draft.projectTags || [])
  const [showOptions, setShowOptions] = useState(false)
  const [showTechnicalDetails, setShowTechnicalDetails] = useState(false)
  const [technicalForm, setTechnicalForm] = useState(draft.technicalForm || DEFAULT_TECHNICAL_FORM)
  const [fileDragOver, setFileDragOver] = useState(false)
  const [selectedPreset, setSelectedPreset] = useState(draft.selectedPreset || null)
  const [sectionDetails, setSectionDetails] = useState(draft.sectionDetails || [{ name: '', total_rows: '' }])

  // Sauvegarde continue dans sessionStorage
  useEffect(() => {
    if (!isOpen) return
    try {
      sessionStorage.setItem(DRAFT_KEY, JSON.stringify({
        name, technique, selectedCategory, counterUnit, description, isFavorite, projectTags, technicalForm, selectedPreset, sectionDetails
      }))
    } catch {}
  }, [isOpen, name, technique, selectedCategory, counterUnit, description, isFavorite, projectTags, technicalForm])

  // Reset complet à la fermeture
  useEffect(() => {
    if (!isOpen) {
      setMode(null)
      setName('')
      setTechnique('crochet')
      setSelectedCategory(null)
      setCounterUnit('rows')
      setDescription('')
      setIsFavorite(false)
      setProjectTags([])
      setShowOptions(false)
      setShowTechnicalDetails(false)
      setTechnicalForm(DEFAULT_TECHNICAL_FORM)
      setSelectedPreset(null)
      setSectionDetails([{ name: '', total_rows: '' }])
      try { sessionStorage.removeItem(DRAFT_KEY) } catch {}
    }
  }, [isOpen])

  const canSubmit = name.trim().length >= 2 && selectedCategory !== null

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset.name)
    if (preset.sections.length > 0) {
      setSectionDetails(preset.sections.map(s => ({ name: s.name, total_rows: '' })))
    } else {
      setSectionDetails([{ name: '', total_rows: '' }])
    }
  }

  const handleSubmit = () => {
    if (!canSubmit || isSubmitting) return
    const sections = sectionDetails.map((s, i) => ({
      name: s.name.trim() || `Partie ${i + 1}`,
      total_rows: s.total_rows ? parseInt(s.total_rows, 10) : null,
      description: null,
      notes: null
    }))
    onSubmit({
      formData: {
        name: name.trim(),
        technique,
        type: selectedCategory.value,
        counter_unit: counterUnit,
        description
      },
      sections,
      technicalForm,
      isFavorite,
      projectTags
    })
  }

  const handleFileDrop = (e) => {
    e.preventDefault()
    setFileDragOver(false)
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    const f = Array.from(e.dataTransfer.files).find(f => allowed.includes(f.type))
    if (f) { setPatternFile(f); setPatternType('file') }
  }

  const handleAddTag = (tag) => {
    if (!canUseTags) { onShowUpgradePrompt(); return }
    if (!projectTags.includes(tag)) setProjectTags([...projectTags, tag])
  }

  const handleRemoveTag = (tag) => {
    setProjectTags(projectTags.filter(t => t !== tag))
  }

  if (!isOpen) return null

  // Écran de choix — manuel vs Création Intelligente
  if (mode === null) {
    const isPlusOrPro = smartQuota && (smartQuota.is_pro || smartQuota.plan === 'plus' || smartQuota.plan === 'plus_annual')
    const isPaidWithImports = isPlusOrPro && smartQuota.remaining > 0
    const isPlusExhausted = smartQuota && (smartQuota.plan === 'plus' || smartQuota.plan === 'plus_annual') && smartQuota.remaining === 0
    const isProExhausted = smartQuota && smartQuota.is_pro && smartQuota.remaining === 0
    const isFreeTrialAvailable = smartQuota && smartQuota.plan === 'free' && !smartQuota.free_trial_used
    const isTrialUsed = smartQuota && smartQuota.plan === 'free' && smartQuota.free_trial_used

    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
        <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-900">Nouveau projet</h2>
            <button onClick={onClose} className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div className="p-4 space-y-3">
            {/* Manuel */}
            <button
              onClick={() => setMode('manual')}
              className="w-full flex items-center gap-4 p-4 border border-gray-200 rounded-xl hover:border-primary-300 hover:bg-primary-50 transition text-left group"
            >
              <div className="w-10 h-10 bg-gray-100 group-hover:bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0 transition">
                <svg className="w-5 h-5 text-gray-600 group-hover:text-primary-600 transition" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" />
                </svg>
              </div>
              <div>
                <p className="font-semibold text-gray-900 text-sm">Créer manuellement</p>
                <p className="text-xs text-gray-500 mt-0.5">Remplissez les informations vous-même</p>
              </div>
            </button>

            {/* Création Intelligente */}
            <button
              onClick={() => { onClose(); navigate(isTrialUsed || isPlusExhausted ? '/subscription' : '/smart-project-creator') }}
              className="w-full flex items-center gap-4 p-4 border border-primary-200 rounded-xl hover:border-primary-400 hover:bg-primary-50 bg-primary-50/50 transition text-left group"
            >
              <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 0 0-3.09 3.09Z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-primary-900 text-sm">Création Intelligente</p>
                {isPaidWithImports && (
                  <p className="text-xs text-primary-600 mt-0.5">
                    <span className="font-semibold">{smartQuota.remaining} création{smartQuota.remaining !== 1 ? 's' : ''}</span> disponible{smartQuota.remaining !== 1 ? 's' : ''} ce mois
                    {user?.subscription_expires_at && (
                      <span className="text-gray-400"> — recharge le {new Date(user.subscription_expires_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
                    )}
                  </p>
                )}
                {isFreeTrialAvailable && (
                  <p className="text-xs text-primary-600 mt-0.5">
                    <span className="font-semibold">{smartQuota?.remaining ?? 2} essai{(smartQuota?.remaining ?? 2) !== 1 ? 's' : ''} gratuit{(smartQuota?.remaining ?? 2) !== 1 ? 's' : ''}</span> disponible{(smartQuota?.remaining ?? 2) !== 1 ? 's' : ''}
                  </p>
                )}
                {isTrialUsed && (
                  <p className="text-xs mt-0.5 flex items-center gap-1.5">
                    <span className="text-gray-400">Essai utilisé</span>
                    <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">Débloquer</span>
                  </p>
                )}
                {isPlusExhausted && (
                  <p className="text-xs mt-0.5 flex items-center gap-1.5">
                    <span className="text-gray-400">3/3 utilisées ce mois</span>
                    <span className="bg-primary-100 text-primary-700 text-xs font-semibold px-1.5 py-0.5 rounded-full">Passer à PRO</span>
                  </p>
                )}
                {isProExhausted && (
                  <p className="text-xs text-gray-400 mt-0.5">15/15 utilisées — renouvellement le 1er du mois</p>
                )}
                {!smartQuota && (
                  <p className="text-xs text-primary-600 mt-0.5">Importez un PDF ou une URL</p>
                )}
              </div>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl max-w-lg w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">Nouveau projet</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Corps scrollable */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

          {/* Nom */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du projet <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter' && canSubmit) handleSubmit() }}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition text-base"
              placeholder="Ex: Pull blanc pour maman"
              autoFocus
            />
          </div>

          {/* Technique */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Technique</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setTechnique('crochet')}
                className={`px-4 py-3 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                  technique === 'crochet'
                    ? 'border-primary-400 bg-primary-50 text-primary-700 ring-1 ring-primary-300'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.53 16.122a3 3 0 0 0-5.78 1.128 2.25 2.25 0 0 1-2.4 2.245 4.5 4.5 0 0 0 8.4-2.245c0-.399-.078-.78-.22-1.128Zm0 0a15.998 15.998 0 0 0 3.388-1.62m-5.043-.025a15.994 15.994 0 0 1 1.622-3.395m3.42 3.42a15.995 15.995 0 0 0 4.764-4.648l3.876-5.814a1.151 1.151 0 0 0-1.597-1.597L14.146 6.32a15.996 15.996 0 0 0-4.649 4.763m3.42 3.42a6.776 6.776 0 0 0-3.42-3.42" />
                </svg>
                Crochet
              </button>
              <button
                type="button"
                onClick={() => setTechnique('tricot')}
                className={`px-4 py-3 rounded-xl border font-medium transition flex items-center justify-center gap-2 ${
                  technique === 'tricot'
                    ? 'border-primary-400 bg-primary-50 text-primary-700 ring-1 ring-primary-300'
                    : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 7.5 3 12m0 0 3.75 4.5M3 12h18" />
                </svg>
                Tricot
              </button>
            </div>
          </div>

          {/* Catégorie */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Type de projet <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {PROJECT_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => { setSelectedCategory(cat); setSelectedPreset(null); setSectionDetails([{ name: '', total_rows: '' }]) }}
                  className={`py-2.5 px-2 rounded-xl border text-xs font-medium text-center leading-tight transition ${
                    selectedCategory?.id === cat.id
                      ? 'border-primary-400 bg-primary-50 text-primary-700 ring-1 ring-primary-300'
                      : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {cat.value}
                </button>
              ))}
            </div>
          </div>

          {/* Parties du patron */}
          {selectedCategory && (() => {
            const presets = selectedCategory.sectionPresets || []
            return (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Type d'ouvrage
                </label>
                {presets.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {presets.map(preset => (
                      <button
                        key={preset.name}
                        type="button"
                        onClick={() => handlePresetSelect(preset)}
                        className={`px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                          selectedPreset === preset.name
                            ? 'border-primary-400 bg-primary-50 text-primary-700 ring-1 ring-primary-300'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                        }`}
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                )}
                {selectedPreset && (
                  <div className="space-y-2">
                    {sectionDetails.map((section, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <input
                          type="text"
                          value={section.name}
                          onChange={(e) => {
                            const next = [...sectionDetails]
                            next[i] = { ...next[i], name: e.target.value }
                            setSectionDetails(next)
                          }}
                          placeholder={`Partie ${i + 1}`}
                          className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                        <input
                          type="number"
                          value={section.total_rows}
                          onChange={(e) => {
                            const next = [...sectionDetails]
                            next[i] = { ...next[i], total_rows: e.target.value }
                            setSectionDetails(next)
                          }}
                          placeholder="Rangs"
                          min="0"
                          className="w-24 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setSectionDetails([...sectionDetails, { name: '', total_rows: '' }])}
                      className="text-xs text-primary-600 hover:text-primary-700 mt-1"
                    >
                      + Ajouter une partie
                    </button>
                  </div>
                )}
              </div>
            )
          })()}

          {/* Accordion options */}
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <button
              type="button"
              onClick={() => setShowOptions(!showOptions)}
              className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between"
            >
              <span className="text-sm font-medium text-gray-600">
                Options — patron, tags, description...
              </span>
              <svg
                className={`w-4 h-4 text-gray-400 transition-transform flex-shrink-0 ${showOptions ? 'rotate-180' : ''}`}
                fill="none" stroke="currentColor" viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {showOptions && (
              <div className="p-4 space-y-5 border-t border-gray-200">

                {/* Unité de comptage */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Unité de comptage</label>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { value: 'rows', label: 'Rangs', icon: '📏' },
                      { value: 'cm', label: 'Centimètres', icon: '📐' }
                    ].map(opt => (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => setCounterUnit(opt.value)}
                        className={`px-3 py-2.5 rounded-lg border-2 font-medium transition flex items-center gap-2 text-sm ${
                          counterUnit === opt.value
                            ? 'border-primary-600 bg-primary-50 text-primary-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span>{opt.icon}</span>
                        <span>{opt.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Patron */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Patron</label>
                  <div className="grid grid-cols-2 gap-2">

                    <button
                      type="button"
                      onClick={onOpenLibraryModal}
                      className={`p-3 border rounded-xl bg-white hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center ${patternType === 'library' ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300' : 'border-gray-200'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className={`w-5 h-5 mb-1 ${patternType === 'library' ? 'text-primary-600' : 'text-gray-400'}`}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Bibliothèque</span>
                      {selectedLibraryPattern && (
                        <span className="text-xs text-primary-600 mt-0.5 truncate max-w-full">✓ {selectedLibraryPattern.name}</span>
                      )}
                    </button>

                    <label
                      onDragOver={(e) => { e.preventDefault(); setFileDragOver(true) }}
                      onDragLeave={() => setFileDragOver(false)}
                      onDrop={handleFileDrop}
                      className={`p-3 border rounded-xl bg-white hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center cursor-pointer ${
                        fileDragOver ? 'border-primary-400 bg-primary-50' :
                        patternType === 'file' ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300' : 'border-gray-200'
                      }`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5m-13.5-9L12 3m0 0 4.5 4.5M12 3v13.5" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Fichier</span>
                      <span className="text-xs text-gray-400">PDF ou image</span>
                      {patternFile && (
                        <span className="text-xs text-primary-600 mt-0.5 truncate max-w-full">
                          ✓ {patternFile.name.length > 15 ? patternFile.name.substring(0, 15) + '…' : patternFile.name}
                        </span>
                      )}
                      <input
                        type="file"
                        accept="image/*,.pdf,application/pdf"
                        multiple
                        onChange={(e) => { const f = e.target.files[0]; if (f) { setPatternFile(f); setPatternType('file') } }}
                        className="hidden"
                      />
                    </label>

                    <button
                      type="button"
                      onClick={onOpenUrlModal}
                      className={`p-3 border rounded-xl bg-white hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center ${patternType === 'url' ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300' : 'border-gray-200'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Lien web</span>
                      {patternUrl && <span className="text-xs text-primary-600 mt-0.5">✓ Lien ajouté</span>}
                    </button>

                    <button
                      type="button"
                      onClick={onOpenTextModal}
                      className={`p-3 border rounded-xl bg-white hover:border-primary-400 hover:bg-primary-50 transition flex flex-col items-center ${patternType === 'text' ? 'border-primary-400 bg-primary-50 ring-1 ring-primary-300' : 'border-gray-200'}`}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mb-1 text-gray-400">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m-1.5 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                      </svg>
                      <span className="text-xs font-medium text-gray-700">Texte</span>
                      {patternText && <span className="text-xs text-primary-600 mt-0.5">✓ Texte ajouté</span>}
                    </button>
                  </div>

                  {patternType && (
                    <button
                      type="button"
                      onClick={() => { setPatternType(''); setPatternFile(null) }}
                      className="mt-1.5 text-xs text-red-500 hover:text-red-700"
                    >
                      ✕ Effacer le patron
                    </button>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm resize-none"
                    placeholder="Ex: Bonnet décontracté pour l'hiver..."
                  />
                </div>

                {/* Favori */}
                <label className="flex items-center gap-3 cursor-pointer group p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition">
                  <input
                    type="checkbox"
                    checked={isFavorite}
                    onChange={(e) => setIsFavorite(e.target.checked)}
                    className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                  />
                  <span className="text-sm font-medium text-gray-700">Marquer comme favori</span>
                </label>

                {/* Tags */}
                {canUseTags ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Tags</label>
                    <TagInput
                      tags={projectTags}
                      onAddTag={handleAddTag}
                      onRemoveTag={handleRemoveTag}
                      suggestions={popularTags?.map(t => t.tag_name) ?? []}
                      placeholder="Ex: cadeau, bébé, urgent..."
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <span className="text-sm text-gray-600">Tags</span>
                    <div className="flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-primary-100 text-primary-700 rounded text-[10px] font-bold">PLUS</span>
                      <button type="button" onClick={() => { onClose(); navigate('/subscription') }} className="text-xs text-primary-600 hover:underline font-medium">
                        Voir les plans
                      </button>
                    </div>
                  </div>
                )}

                {/* Détails techniques — nested accordion */}
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 transition flex items-center justify-between text-left"
                  >
                    <span className="text-sm font-medium text-gray-600">
                      Détails techniques — laine, aiguilles, échantillon
                    </span>
                    <svg
                      className={`w-4 h-4 text-gray-400 flex-shrink-0 transition-transform ${showTechnicalDetails ? 'rotate-180' : ''}`}
                      fill="none" stroke="currentColor" viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>

                  {showTechnicalDetails && (
                    <div className="p-4 space-y-4 border-t border-gray-200">

                      {/* Laine / Fil */}
                      <div className="p-3 bg-primary-50 rounded-lg border border-primary-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {technique === 'tricot' ? 'Laine' : 'Fil'}
                        </h4>
                        {technicalForm.yarn.map((y, yIdx) => (
                          <div key={yIdx} className="mb-2 p-2 bg-white rounded border border-primary-100">
                            <div className="grid grid-cols-2 gap-2 mb-1">
                              <input
                                type="text"
                                value={y.brand}
                                onChange={(e) => {
                                  const n = [...technicalForm.yarn]
                                  n[yIdx] = { ...n[yIdx], brand: e.target.value }
                                  setTechnicalForm({ ...technicalForm, yarn: n })
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                placeholder="Marque"
                              />
                              <input
                                type="text"
                                value={y.name}
                                onChange={(e) => {
                                  const n = [...technicalForm.yarn]
                                  n[yIdx] = { ...n[yIdx], name: e.target.value }
                                  setTechnicalForm({ ...technicalForm, yarn: n })
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                placeholder="Nom"
                              />
                            </div>
                            {technicalForm.yarn.length > 1 && (
                              <button
                                type="button"
                                onClick={() => setTechnicalForm({ ...technicalForm, yarn: technicalForm.yarn.filter((_, i) => i !== yIdx) })}
                                className="text-xs text-red-500 hover:text-red-700"
                              >
                                Supprimer
                              </button>
                            )}
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTechnicalForm({ ...technicalForm, yarn: [...technicalForm.yarn, { brand: '', name: '', quantities: [{ amount: '', unit: 'pelotes', color: '' }] }] })}
                          className="text-xs text-primary-600 hover:text-primary-700"
                        >
                          + Ajouter
                        </button>
                      </div>

                      {/* Aiguilles / Crochets */}
                      <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">
                          {technique === 'tricot' ? 'Aiguilles' : 'Crochets'}
                        </h4>
                        {technicalForm.needles.map((n, nIdx) => (
                          <div key={nIdx} className="mb-2 p-2 bg-white rounded border border-gray-200">
                            <div className={`grid gap-2 ${technique === 'tricot' ? 'grid-cols-3' : 'grid-cols-1'}`}>
                              {technique === 'tricot' && (
                                <input
                                  type="text"
                                  value={n.type}
                                  onChange={(e) => {
                                    const nn = [...technicalForm.needles]
                                    nn[nIdx] = { ...nn[nIdx], type: e.target.value }
                                    setTechnicalForm({ ...technicalForm, needles: nn })
                                  }}
                                  className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                  placeholder="Type"
                                />
                              )}
                              <input
                                type="text"
                                value={n.size}
                                onChange={(e) => {
                                  const nn = [...technicalForm.needles]
                                  nn[nIdx] = { ...nn[nIdx], size: e.target.value }
                                  setTechnicalForm({ ...technicalForm, needles: nn })
                                }}
                                className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                placeholder="Taille (mm)"
                              />
                              {technique === 'tricot' && (
                                <input
                                  type="text"
                                  value={n.length}
                                  onChange={(e) => {
                                    const nn = [...technicalForm.needles]
                                    nn[nIdx] = { ...nn[nIdx], length: e.target.value }
                                    setTechnicalForm({ ...technicalForm, needles: nn })
                                  }}
                                  className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                                  placeholder="Longueur"
                                />
                              )}
                            </div>
                          </div>
                        ))}
                        <button
                          type="button"
                          onClick={() => setTechnicalForm({ ...technicalForm, needles: [...technicalForm.needles, { type: '', size: '', length: '' }] })}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          + Ajouter
                        </button>
                      </div>

                      {/* Échantillon */}
                      <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                        <h4 className="text-sm font-semibold text-gray-900 mb-3">Échantillon</h4>
                        <div className="grid grid-cols-3 gap-2">
                          <input
                            type="text"
                            value={technicalForm.gauge.stitches}
                            onChange={(e) => setTechnicalForm({ ...technicalForm, gauge: { ...technicalForm.gauge, stitches: e.target.value } })}
                            className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                            placeholder="Mailles"
                          />
                          <input
                            type="text"
                            value={technicalForm.gauge.rows}
                            onChange={(e) => setTechnicalForm({ ...technicalForm, gauge: { ...technicalForm.gauge, rows: e.target.value } })}
                            className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                            placeholder="Rangs"
                          />
                          <input
                            type="text"
                            value={technicalForm.gauge.dimensions}
                            onChange={(e) => setTechnicalForm({ ...technicalForm, gauge: { ...technicalForm.gauge, dimensions: e.target.value } })}
                            className="px-2 py-1.5 border border-gray-300 rounded text-xs"
                            placeholder="10x10 cm"
                          />
                        </div>
                      </div>

                    </div>
                  )}
                </div>

              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-200 px-6 py-4 flex items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-lg transition"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!canSubmit || isSubmitting}
            className={`flex-1 px-6 py-2.5 rounded-lg text-sm font-semibold transition ${
              canSubmit && !isSubmitting
                ? 'bg-primary-600 hover:bg-primary-700 text-white shadow-sm'
                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          >
            {isSubmitting ? 'Création en cours...' : (submitLabel || 'Créer le projet')}
          </button>
        </div>

      </div>
    </div>
  )
}

export default CreateProjectWizard
