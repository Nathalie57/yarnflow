/**
 * @file SaveGaugeToProjectModal.jsx
 * @brief Modal pour enregistrer un échantillon dans un projet existant
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'

export default function SaveGaugeToProjectModal({ gauge, onClose }) {
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    api.get('/projects?limit=100').then(res => {
      setProjects(res.data?.projects || res.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)

    const project = projects.find(p => p.id === Number(selectedId))
    let existing = {}
    try {
      existing = project?.technical_details ? JSON.parse(project.technical_details) : {}
    } catch (_) {}

    const updated = {
      ...existing,
      gauge: {
        stitches: gauge.stitches,
        rows: gauge.rows,
        dimensions: '10 x 10 cm',
        notes: existing?.gauge?.notes || '',
      }
    }

    await api.put(`/projects/${selectedId}`, {
      technical_details: JSON.stringify(updated)
    })

    setSaving(false)
    setSaved(true)
    setTimeout(onClose, 1200)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Enregistrer l'échantillon</h2>
          <p className="text-sm text-gray-500 mt-1">
            {gauge.stitches && <span>{gauge.stitches} m</span>}
            {gauge.stitches && gauge.rows && <span> × </span>}
            {gauge.rows && <span>{gauge.rows} rgs</span>}
            {' '}pour 10 × 10 cm
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-400">Chargement des projets...</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500">Aucun projet trouvé.</p>
        ) : (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">-- Choisir un projet --</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {saved && (
          <p className="text-sm text-green-600 font-medium text-center">Échantillon enregistré !</p>
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
            disabled={!selectedId || saving || saved}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </button>
        </div>
      </div>
    </div>
  )
}
