/**
 * @file SaveChartToProjectModal.jsx
 * @brief Modal pour associer une grille jacquard à un projet/section — soit à
 * la création (outil bac à sable), soit pour réassigner une grille existante
 * (même motif réutilisé sur un autre projet/section plus tard).
 */

import { useState, useEffect } from 'react'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'

export default function SaveChartToProjectModal({ chart, existingChart, onClose, onSaved }) {
  const { t } = useTranslation('tools')
  const isReassign = !!existingChart
  const [projects, setProjects] = useState([])
  const [sections, setSections] = useState([])
  const [selectedProjectId, setSelectedProjectId] = useState(isReassign ? String(existingChart.project_id) : '')
  const [selectedSectionId, setSelectedSectionId] = useState(isReassign && existingChart.section_id ? String(existingChart.section_id) : '')
  const [startRow, setStartRow] = useState(isReassign ? (existingChart.start_row || 0) : 0)
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
    // [AI:Claude] Ne pas réinitialiser la section/le rang de départ si on ne
    // fait que pré-remplir le projet initial en mode réassignation
    if (!isReassign || selectedProjectId !== String(existingChart.project_id)) {
      setSelectedSectionId('')
      setStartRow(0)
    }
    api.get(`/projects/${selectedProjectId}/sections`).then(res => {
      setSections(res.data?.sections || res.data || [])
      setLoadingSections(false)
    }).catch(() => setLoadingSections(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedProjectId])

  const selectedSection = sections.find(s => String(s.id) === String(selectedSectionId))
  const chartHeight = isReassign ? existingChart.height : chart.height

  const handleSave = async () => {
    if (isReassign && !selectedProjectId) return
    setSaving(true)
    setError('')

    try {
      let res
      if (isReassign) {
        res = await api.put(`/projects/${existingChart.project_id}/charts/${existingChart.id}`, {
          project_id: Number(selectedProjectId),
          section_id: selectedSectionId || null,
          start_row: selectedSectionId ? Number(startRow) || 0 : 0,
        })
      } else if (selectedProjectId) {
        res = await api.post(`/projects/${selectedProjectId}/charts`, {
          section_id: selectedSectionId || null,
          start_row: selectedSectionId ? Number(startRow) || 0 : 0,
          name: chart.name,
          width: chart.width,
          height: chart.height,
          palette: chart.palette,
          cells: chart.cells,
        })
      } else {
        // [AI:Claude] Pas de projet choisi : la grille est enregistrée seule,
        // visible uniquement dans "Mes grilles".
        res = await api.post(`/charts`, {
          name: chart.name,
          width: chart.width,
          height: chart.height,
          palette: chart.palette,
          cells: chart.cells,
        })
      }
      setSaving(false)
      setSaved(true)
      if (onSaved) onSaved(res.data.chart)
      setTimeout(onClose, 1200)
    } catch (err) {
      console.error('Erreur sauvegarde grille:', err)
      setError(err.response?.data?.error || t('ui.saveFailed'))
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4 bg-black/40">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 max-h-[calc(100vh-6rem)] sm:max-h-[80vh] overflow-y-auto mb-16 sm:mb-0">
        <div>
          <h2 className="text-lg font-bold text-gray-900">{isReassign ? t('ui.linkToProjectSection') : t('ui.saveChart')}</h2>
          <p className="text-sm text-gray-500 mt-1">
            {isReassign ? existingChart.name : chart.name} — {isReassign ? existingChart.width : chart.width} × {chartHeight}
          </p>
        </div>

        {loadingProjects ? (
          <p className="text-sm text-gray-500">{t('ui.loadingProjects')}</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-gray-500">{t('ui.noProjectFound')}</p>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Projet {isReassign && <span className="text-red-500">*</span>}
              </label>
              <select
                value={selectedProjectId}
                onChange={e => setSelectedProjectId(e.target.value)}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="">
                  {isReassign ? t('ui.chooseProject') : t('ui.noProjectJustCharts')}
                </option>
                {projects.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            {selectedProjectId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">{t('ui.sectionOptional')}</label>
                {loadingSections ? (
                  <p className="text-xs text-gray-500">{t('ui.loadingSections')}</p>
                ) : sections.length === 0 ? (
                  <p className="text-xs text-gray-500">{t('ui.noSectionChart')}</p>
                ) : (
                  <select
                    value={selectedSectionId}
                    onChange={e => setSelectedSectionId(e.target.value)}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value="">{t('ui.noSectionOption')}</option>
                    {sections.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                )}
              </div>
            )}

            {selectedSectionId && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {t('ui.startRow')}
                </label>
                <input
                  type="number"
                  min="0"
                  value={startRow}
                  onChange={e => setStartRow(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  {t('ui.chartStartRowHelp')}
                  {selectedSection?.total_rows > 0 && (
                    <>
                      {' '}{t('ui.chartWillCover', { from: Number(startRow) + 1, to: Number(startRow) + chartHeight, total: selectedSection.total_rows })}
                      {Number(startRow) + chartHeight > selectedSection.total_rows && (
                        <span className="text-amber-600 font-medium">{t('ui.exceedsSectionRows')}</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}
          </div>
        )}

        {saved && (
          <p className="text-sm text-green-600 font-medium text-center">
            {isReassign ? t('ui.chartReassigned') : (selectedProjectId ? t('ui.chartSaved') : t('ui.chartSavedInMyCharts'))}
          </p>
        )}
        {error && (
          <p className="text-sm text-red-600 text-center">{error}</p>
        )}

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition"
          >
            {t('ui.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={(isReassign && !selectedProjectId) || saving || saved}
            className="flex-1 py-2 rounded-lg text-sm font-medium bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
          >
            {saving ? 'Enregistrement...' : (isReassign ? 'Associer' : 'Enregistrer')}
          </button>
        </div>
      </div>
    </div>
  )
}
