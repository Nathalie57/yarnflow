/**
 * @file SaveGaugeToProjectModal.jsx
 * @brief Modal pour enregistrer un échantillon dans un projet existant
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'
import { apiErrorMessage } from '../../utils/apiError'

export default function SaveGaugeToProjectModal({ gauge, onClose }) {
  const { t } = useTranslation('tools')
  const [projects, setProjects] = useState([])
  const [selectedId, setSelectedId] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api.get('/projects?limit=100').then(res => {
      setProjects(res.data?.projects || res.data || [])
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleSave = async () => {
    if (!selectedId) return
    setSaving(true)
    setError('')

    const project = projects.find(p => p.id === Number(selectedId))
    let existing = {}
    try {
      existing = project?.technical_details ? JSON.parse(project.technical_details) : {}
    } catch (_) {}

    // [AI:Claude] 2026-09-26 — on n'écrase que les champs saisis : un échantillon
    // 22 × 30 existant garde ses rangs si seules les mailles sont renseignées ici.
    const updated = {
      ...existing,
      gauge: {
        ...(existing?.gauge && typeof existing.gauge === 'object' ? existing.gauge : {}),
        ...(gauge.stitches ? { stitches: gauge.stitches } : {}),
        ...(gauge.rows ? { rows: gauge.rows } : {}),
        dimensions: '10 x 10 cm',
        notes: existing?.gauge?.notes || '',
      }
    }

    try {
      await api.put(`/projects/${selectedId}`, {
        technical_details: JSON.stringify(updated)
      })
      setSaved(true)
      setTimeout(onClose, 1200)
    } catch (err) {
      console.error('Erreur sauvegarde échantillon:', err)
      setError(apiErrorMessage(err, t('ui.saveFailed')))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 pb-20 sm:pb-4 bg-black/40">
      <div className="bg-white rounded-card shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[80vh] overflow-y-auto">
        <div>
          <h2 className="text-lg font-bold text-flow-ink">{t('ui.saveGauge')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {gauge.stitches && gauge.rows
              ? t('ui.gaugeFor10x10', { stitches: gauge.stitches, rows: gauge.rows })
              : gauge.stitches
                ? t('ui.gaugeStitchesFor10', { stitches: gauge.stitches })
                : gauge.rows
                  ? t('ui.gaugeRowsFor10', { rows: gauge.rows })
                  : t('ui.gaugeFor10')}
          </p>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">{t('ui.loadingProjects')}</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500">{t('ui.noProjectFound')}</p>
        ) : (
          <select
            value={selectedId}
            onChange={e => setSelectedId(e.target.value)}
            className="w-full border border-gray-300 rounded-control px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="">{t('ui.chooseProject')}</option>
            {projects.map(p => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        )}

        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        {saved && (
          <p className="text-sm text-green-600 font-medium text-center">{t('ui.gaugeSaved')}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-control text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            {t('ui.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!selectedId || saving || saved}
            className="flex-1 py-2 rounded-control text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? t('ui.savingDots') : t('ui.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
