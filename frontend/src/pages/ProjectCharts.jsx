/**
 * @file ProjectCharts.jsx
 * @brief Liste des grilles jacquard/colorwork d'un projet + création
 */

import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import { imageFileToChart, NO_GRID_DETECTED } from '../utils/chartImageImport'
import { photoFileToChart } from '../utils/photoToChart'

const ProjectCharts = () => {
  const { t } = useTranslation('library')
  const { projectId } = useParams()
  const navigate = useNavigate()

  const [charts, setCharts] = useState([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [mode, setMode] = useState('draw')
  const [name, setName] = useState('')
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [imageFile, setImageFile] = useState(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [photoFile, setPhotoFile] = useState(null)
  const [photoGridWidth, setPhotoGridWidth] = useState(50)
  const [photoMaxColors, setPhotoMaxColors] = useState(8)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [sections, setSections] = useState([])
  const [sectionId, setSectionId] = useState('')
  const [startRow, setStartRow] = useState(0)

  const loadCharts = async () => {
    try {
      const res = await api.get(`/projects/${projectId}/charts`)
      setCharts(res.data.charts || [])
    } catch {
      setError('Impossible de charger les grilles')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadCharts() }, [projectId])

  useEffect(() => {
    api.get(`/projects/${projectId}/sections`).then(res => {
      setSections(res.data?.sections || res.data || [])
    }).catch(() => setSections([]))
  }, [projectId])

  const selectedSection = sections.find(s => String(s.id) === String(sectionId))

  const handleCreate = async () => {
    if (!name.trim() || !width || !height) return
    setSaving(true)
    setError('')
    try {
      const res = await api.post(`/projects/${projectId}/charts`, {
        name: name.trim(),
        width: Number(width),
        height: Number(height),
        section_id: sectionId || null,
        start_row: sectionId ? Number(startRow) || 0 : 0,
      })
      navigate(`/projects/${projectId}/charts/${res.data.chart.id}`, { state: { justCreated: true } })
    } catch (err) {
      setError(err.response?.data?.error || t('ui.chartCreateFailed'))
      setSaving(false)
    }
  }

  const handleCreateFromImage = async () => {
    if (!name.trim() || !imageFile) return
    setIsProcessingImage(true)
    setError('')
    try {
      const result = await imageFileToChart(imageFile)
      setSaving(true)
      const res = await api.post(`/projects/${projectId}/charts`, {
        name: name.trim(),
        width: result.width,
        height: result.height,
        palette: result.palette,
        cells: result.cells,
        section_id: sectionId || null,
        start_row: sectionId ? Number(startRow) || 0 : 0,
      })
      navigate(`/projects/${projectId}/charts/${res.data.chart.id}`, { state: { justCreated: true } })
    } catch (err) {
      setError(err?.message === NO_GRID_DETECTED
        ? t('ui.notAChart')
        : (err.response?.data?.error || t('ui.imageProcessFailed')))
      setSaving(false)
    } finally {
      setIsProcessingImage(false)
    }
  }

  const handleCreateFromPhoto = async () => {
    if (!name.trim() || !photoFile) return
    setIsProcessingPhoto(true)
    setError('')
    try {
      const result = await photoFileToChart(photoFile, Number(photoGridWidth), Number(photoMaxColors))
      setSaving(true)
      const res = await api.post(`/projects/${projectId}/charts`, {
        name: name.trim(),
        width: result.width,
        height: result.height,
        palette: result.palette,
        cells: result.cells,
        section_id: sectionId || null,
        start_row: sectionId ? Number(startRow) || 0 : 0,
      })
      navigate(`/projects/${projectId}/charts/${res.data.chart.id}`, { state: { justCreated: true } })
    } catch (err) {
      setError(err.response?.data?.error || t('ui.imageProcessFailed'))
      setSaving(false)
    } finally {
      setIsProcessingPhoto(false)
    }
  }

  const handleDelete = async (chartId) => {
    if (!window.confirm(t('ui.confirmDeleteChart'))) return
    try {
      await api.delete(`/projects/${projectId}/charts/${chartId}`)
      setCharts(prev => prev.filter(c => c.id !== chartId))
    } catch {
      setError('Erreur lors de la suppression')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-2xl mx-auto p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Link to={`/projects/${projectId}`} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            {t('ui.backToProject')}
          </Link>
          <h1 className="text-lg font-bold text-gray-900">{t('ui.jacquardCharts')}</h1>
          <div className="w-24" />
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-3 rounded text-sm text-red-700">{error}</div>
        )}

        {loading ? (
          <p className="text-center text-gray-400 py-8">{t('ui.loading')}</p>
        ) : (
          <div className="space-y-2">
            {charts.map(c => (
              <div key={c.id} className="bg-white rounded-xl shadow-sm p-4 flex items-center justify-between">
                <Link to={`/projects/${projectId}/charts/${c.id}`} className="flex-1">
                  <p className="font-semibold text-gray-900">{c.name}</p>
                  <p className="text-xs text-gray-400">{c.width} × {c.height} — rang {c.current_row}/{c.height}</p>
                </Link>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="text-red-400 hover:text-red-600 p-2"
                  title={t('ui.delete')}
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        {isCreating ? (
          <div className="bg-white rounded-xl shadow-sm p-4 space-y-3">
            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setMode('draw')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'draw' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
              >
                {t('ui.drawByHand')}
              </button>
              <button
                onClick={() => setMode('image')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'image' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
              >
                {t('ui.importChart')}
              </button>
              <button
                onClick={() => setMode('photo')}
                className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'photo' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
              >
                {t('ui.createFromPhoto')}
              </button>
            </div>

            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder={t('ui.phChartName')}
              maxLength={100}
              autoFocus
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
            />

            {sections.length > 0 && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('ui.sectionOptional')}</label>
                <select
                  value={sectionId}
                  onChange={e => setSectionId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">{t('ui.noSectionOption')}</option>
                  {sections.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
            )}

            {sectionId && (
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('ui.startRowInSection')}</label>
                <input
                  type="number"
                  min="0"
                  value={startRow}
                  onChange={e => setStartRow(e.target.value)}
                  className="w-24 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Combien de rangs de la section sont déjà faits quand ce motif commence (0 si le motif démarre au tout premier rang de la section).
                  {selectedSection?.total_rows > 0 && mode === 'draw' && (
                    <>
                      {' '}La grille couvrira les rangs {Number(startRow) + 1} à {Number(startRow) + Number(height)} sur {selectedSection.total_rows}.
                      {Number(startRow) + Number(height) > selectedSection.total_rows && (
                        <span className="text-amber-600 font-medium">{t('ui.exceedsSectionRows')}</span>
                      )}
                    </>
                  )}
                </p>
              </div>
            )}

            {mode === 'draw' && (
              <>
                <div className="flex items-center gap-3">
                  <label className="text-sm text-gray-600">{t('ui.widthStitches')}</label>
                  <input type="number" min="1" max="200" value={width} onChange={e => setWidth(e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                  <label className="text-sm text-gray-600">{t('ui.heightRows')}</label>
                  <input type="number" min="1" max="200" value={height} onChange={e => setHeight(e.target.value)} className="w-20 px-2 py-1 border border-gray-300 rounded text-sm" />
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreating(false)} className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">{t('ui.cancel')}</button>
                  <button onClick={handleCreate} disabled={saving || !name.trim()} className="flex-1 py-2 rounded-lg text-sm bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50">
                    {saving ? t('ui.creatingEllipsis') : t('ui.create')}
                  </button>
                </div>
              </>
            )}

            {mode === 'image' && (
              <>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => { setImageFile(e.target.files?.[0] || null); setError('') }}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t('ui.chartAutoDetectHint')}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreating(false)} className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">{t('ui.cancel')}</button>
                  <button
                    onClick={handleCreateFromImage}
                    disabled={saving || isProcessingImage || !name.trim() || !imageFile}
                    className="flex-1 py-2 rounded-lg text-sm bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isProcessingImage ? t('ui.processing') : saving ? t('ui.creatingEllipsis') : t('ui.generateFromImage')}
                  </button>
                </div>
              </>
            )}

            {mode === 'photo' && (
              <>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={e => { setPhotoFile(e.target.files?.[0] || null); setError('') }}
                    className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    {t('ui.convertsAnyImage')}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('ui.chartWidth')}</label>
                    <input type="number" min="10" max="200" value={photoGridWidth} onChange={e => setPhotoGridWidth(e.target.value)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                  </div>
                  <div>
                    <label className="block text-sm text-gray-600 mb-1">{t('ui.maxColors')}</label>
                    <input type="number" min="2" max="20" value={photoMaxColors} onChange={e => setPhotoMaxColors(e.target.value)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => setIsCreating(false)} className="flex-1 py-2 rounded-lg text-sm bg-gray-100 text-gray-700 hover:bg-gray-200">{t('ui.cancel')}</button>
                  <button
                    onClick={handleCreateFromPhoto}
                    disabled={saving || isProcessingPhoto || !name.trim() || !photoFile}
                    className="flex-1 py-2 rounded-lg text-sm bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50"
                  >
                    {isProcessingPhoto ? t('ui.processing') : saving ? t('ui.creatingEllipsis') : t('ui.generateFromPhoto')}
                  </button>
                </div>
              </>
            )}
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full py-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-primary-400 hover:text-primary-600 text-sm font-medium"
          >
            ＋ Nouvelle grille
          </button>
        )}
      </div>
    </div>
  )
}

export default ProjectCharts
