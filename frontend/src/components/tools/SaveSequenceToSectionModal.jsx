/**
 * @file SaveSequenceToSectionModal.jsx
 * @brief Modal pour sauvegarder une séquence d'augmentations/diminutions dans une section de projet
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function SaveSequenceToSectionModal({ sequence, onClose }) {
  const [projects, setProjects] = useState([])
  const [sections, setSections] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('')
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingSections, setLoadingSections] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/projects?limit=100').then(res => {
      setProjects(res.data?.projects || res.data || [])
      setLoadingProjects(false)
    }).catch(() => setLoadingProjects(false))
  }, [])

  useEffect(() => {
    if (!selectedProjectId) { setSections([]); setSelectedSectionId(''); return }
    setLoadingSections(true)
    setSelectedSectionId('')
    api.get(`/projects/${selectedProjectId}/sections`).then(res => {
      setSections(res.data?.sections || res.data || [])
      setLoadingSections(false)
    }).catch(() => setLoadingSections(false))
  }, [selectedProjectId])

  const handleSave = async () => {
    if (!selectedProjectId || !selectedSectionId) return
    setSaving(true)
    setError('')

    const { label, steps } = sequence
    const sequenceData = {
      label,
      steps,
      current_step: 0,
      current_done: 0
    }

    try {
      await api.put(`/projects/${selectedProjectId}/sections/${selectedSectionId}`, {
        secondary_sequence: JSON.stringify(sequenceData),
        secondary_label: label,
        secondary_target: steps[0]?.target,
        secondary_count: 0
      })
      setSaving(false)
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      console.error('Erreur sauvegarde séquence:', err)
      setError('Erreur lors de la sauvegarde. Vérifiez que la migration SQL a bien été exécutée.')
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[calc(100vh-6rem)] sm:max-h-[80vh] overflow-y-auto mb-16 sm:mb-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Créer un compteur de section</h2>
          <p className="text-sm text-gray-500 mt-1">{sequence.label} — {sequence.steps.length} étape{sequence.steps.length > 1 ? 's' : ''}</p>
          <div className="mt-2 space-y-1">
            {sequence.steps.map((step, i) => (
              <p key={i} className="text-xs text-gray-600 italic">
                Tous les <strong>{step.target}</strong> → {step.repeat} fois
              </p>
            ))}
          </div>
        </div>

        {loadingProjects ? (
          <p className="text-sm text-gray-400">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun projet trouvé.</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Projet</label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">-- Choisir un projet --</option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProjectId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Section <span className="text-red-500">*</span></label>
                {loadingSections ? (
                  <p className="text-xs text-gray-400">Chargement des sections...</p>
                ) : sections.length === 0 ? (
                  <p className="text-xs text-gray-500">Ce projet n'a pas de section.</p>
                ) : (
                  <select
                    value={selectedSectionId}
                    onChange={e => setSelectedSectionId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">-- Choisir une section --</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        {saved && (
          <p className="text-sm text-green-600 font-medium text-center">Compteur créé !</p>
        )}
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            Annuler
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedProjectId || !selectedSectionId || saving || saved}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
