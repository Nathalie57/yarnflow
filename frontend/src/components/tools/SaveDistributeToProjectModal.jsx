/**
 * @file SaveDistributeToProjectModal.jsx
 * @brief Modal pour enregistrer le résultat de répartition dans les notes d'un projet ou d'une section
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function SaveDistributeToProjectModal({ text, onClose }) {
  const [projects, setProjects] = useState([])
  const [sections, setSections] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState('')
  const [selectedSectionId, setSelectedSectionId] = useState('') // '' = notes projet
  const [loadingProjects, setLoadingProjects] = useState(true)
  const [loadingSections, setLoadingSections] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/projects?limit=100').then(res => {
      setProjects(res.data?.projects || res.data || [])
      setLoadingProjects(false)
    }).catch(() => setLoadingProjects(false))
  }, [])

  useEffect(() => {
    if (!selectedProjectId) { setSections([]); return }
    setLoadingSections(true)
    setSelectedSectionId('')
    api.get(`/projects/${selectedProjectId}/sections`).then(res => {
      setSections(res.data?.sections || res.data || [])
      setLoadingSections(false)
    }).catch(() => setLoadingSections(false))
  }, [selectedProjectId])

  const handleSave = async () => {
    if (!selectedProjectId) return
    setSaving(true)

    if (selectedSectionId) {
      // Ajouter aux notes de la section
      const section = sections.find(s => s.id === Number(selectedSectionId))
      const existing = section?.notes ? section.notes + '\n\n' : ''
      await api.put(`/projects/${selectedProjectId}/sections/${selectedSectionId}`, {
        notes: existing + text
      })
    } else {
      // Ajouter aux notes du projet
      const project = projects.find(p => p.id === Number(selectedProjectId))
      const existing = project?.notes ? project.notes + '\n\n' : ''
      await api.put(`/projects/${selectedProjectId}`, {
        notes: existing + text
      })
    }

    setSaving(false)
    setSaved(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Enregistrer dans un projet</h2>
          <p className="text-sm text-gray-500 mt-1 italic">"{text}"</p>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Ajouter dans</label>
                {loadingSections ? (
                  <p className="text-xs text-gray-400">Chargement des sections...</p>
                ) : (
                  <select
                    value={selectedSectionId}
                    onChange={e => setSelectedSectionId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">Notes du projet (global)</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>Section : {s.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>
        )}

        {saved && (
          <p className="text-sm text-green-600 font-medium text-center">Enregistré !</p>
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
            disabled={!selectedProjectId || saving || saved}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
