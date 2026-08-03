/**
 * @file ChartEditor.jsx
 * @brief Éditeur de grille jacquard/colorwork — création manuelle et édition
 */

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import api from '../services/api'
import SaveChartToProjectModal from '../components/tools/SaveChartToProjectModal'

const MAX_GRID_SIZE = 200
const MIN_GRID_SIZE = 1
const DEFAULT_CELL_PX = 24

const ChartEditor = () => {
  const { t } = useTranslation('library')
  const { projectId, chartId } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const justCreated = location.state?.justCreated === true

  const [chart, setChart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedColor, setSelectedColor] = useState(1)
  const [cellPx, setCellPx] = useState(DEFAULT_CELL_PX)
  const [editingPaletteIndex, setEditingPaletteIndex] = useState(null)
  const [showAssignModal, setShowAssignModal] = useState(false)
  // [AI:Claude] Verrou anti-modification accidentelle, persisté côté serveur (champ
  // locked) — modifiable juste après la création, verrouillée automatiquement dès
  // qu'on y accède autrement (liste du projet), et le reste tant qu'on n'a pas
  // cliqué sur "Modifier". PDO peut renvoyer 0/1 sous forme de string — Boolean("0")
  // vaudrait true à tort, d'où la comparaison explicite plutôt qu'une conversion générique.
  const isLocked = chart?.locked === 1 || chart?.locked === '1' || chart?.locked === true

  const canvasRef = useRef(null)
  const canvasRowRef = useRef(null)
  const isPaintingRef = useRef(false)
  const paintValueRef = useRef(1)
  const saveTimeoutRef = useRef(null)
  const lastFitDimsRef = useRef(null)

  // [AI:Claude] Ajuste le zoom pour que toute la grille tienne à l'écran à
  // l'ouverture — sans ça une grande grille (ex: 55×60 importée d'une image)
  // démarre au zoom fixe par défaut, bien trop grand, et donne l'impression
  // qu'un bout du motif manque alors qu'on n'en voit qu'une portion zoomée.
  const fitZoomToScreen = () => {
    const row = canvasRowRef.current
    if (!row || !chart) return
    const sideButtonsWidth = 80 // boutons +/− compacts de part et d'autre du canevas
    const usable = Math.max(80, row.clientWidth - sideButtonsWidth)
    const fit = Math.floor(usable / chart.width)
    setCellPx(Math.max(2, Math.min(DEFAULT_CELL_PX, fit)))
  }

  useEffect(() => {
    if (!chart) return
    const dims = `${chart.width}x${chart.height}`
    if (lastFitDimsRef.current === dims) return
    lastFitDimsRef.current = dims
    requestAnimationFrame(fitZoomToScreen)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chart?.width, chart?.height])

  useEffect(() => {
    const loadChart = async () => {
      try {
        const res = await api.get(`/projects/${projectId}/charts/${chartId}`)
        const loadedChart = res.data.chart
        const alreadyLocked = loadedChart.locked === 1 || loadedChart.locked === '1' || loadedChart.locked === true

        // [AI:Claude] Verrouillage automatique à l'arrivée, sauf juste après la création
        if (!justCreated && !alreadyLocked) {
          try {
            await api.put(`/projects/${projectId}/charts/${chartId}`, { locked: true })
            loadedChart.locked = true
          } catch { /* on affiche quand même la grille si le verrouillage échoue */ }
        }

        setChart(loadedChart)
      } catch (err) {
        setError(err.response?.data?.error || 'Impossible de charger cette grille')
      } finally {
        setLoading(false)
      }
    }
    loadChart()
  }, [projectId, chartId])

  const scheduleSave = useCallback((updated) => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => {
      api.put(`/projects/${projectId}/charts/${chartId}`, {
        cells: updated.cells,
        palette: updated.palette,
        width: updated.width,
        height: updated.height,
        current_row: updated.current_row,
        name: updated.name,
      }).catch(() => {})
    }, 600)
  }, [projectId, chartId])

  const updateChart = (updater) => {
    setChart(prev => {
      const updated = updater(prev)
      scheduleSave(updated)
      return updated
    })
  }

  // Rendu du canvas
  useEffect(() => {
    if (!chart) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')

    canvas.width = chart.width * cellPx
    canvas.height = chart.height * cellPx

    for (let y = 0; y < chart.height; y++) {
      for (let x = 0; x < chart.width; x++) {
        const colorIndex = chart.cells[y]?.[x] ?? 0
        ctx.fillStyle = chart.palette[colorIndex] || '#FFFFFF'
        ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx)
      }
    }

    // Grille
    ctx.strokeStyle = 'rgba(0,0,0,0.15)'
    ctx.lineWidth = 1
    for (let x = 0; x <= chart.width; x++) {
      ctx.beginPath()
      ctx.moveTo(x * cellPx, 0)
      ctx.lineTo(x * cellPx, chart.height * cellPx)
      ctx.stroke()
    }
    for (let y = 0; y <= chart.height; y++) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellPx)
      ctx.lineTo(chart.width * cellPx, y * cellPx)
      ctx.stroke()
    }
  }, [chart, cellPx])

  const paintCellAt = (clientX, clientY) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    const x = Math.floor(((clientX - rect.left) * scaleX) / cellPx)
    const y = Math.floor(((clientY - rect.top) * scaleY) / cellPx)

    updateChart(prev => {
      if (x < 0 || x >= prev.width || y < 0 || y >= prev.height) return prev
      if (prev.cells[y][x] === paintValueRef.current) return prev
      const cells = prev.cells.map(row => [...row])
      cells[y][x] = paintValueRef.current
      return { ...prev, cells }
    })
  }

  const handlePointerDown = (e) => {
    if (isLocked) return
    isPaintingRef.current = true
    paintValueRef.current = selectedColor
    paintCellAt(e.clientX, e.clientY)
  }
  const handlePointerMove = (e) => {
    if (isLocked || !isPaintingRef.current) return
    paintCellAt(e.clientX, e.clientY)
  }
  const handlePointerUp = () => { isPaintingRef.current = false }

  const toggleLock = async () => {
    const next = !isLocked
    setChart(prev => ({ ...prev, locked: next }))
    try {
      await api.put(`/projects/${projectId}/charts/${chartId}`, { locked: next })
    } catch {
      setChart(prev => ({ ...prev, locked: !next })) // revert si échec
    }
  }

  const addRow = (position) => {
    updateChart(prev => {
      if (prev.height >= MAX_GRID_SIZE) return prev
      const newRow = new Array(prev.width).fill(0)
      const cells = position === 'top' ? [newRow, ...prev.cells] : [...prev.cells, newRow]
      const current_row = position === 'top' ? prev.current_row + 1 : prev.current_row
      return { ...prev, cells, height: prev.height + 1, current_row }
    })
  }

  const removeRow = (position) => {
    updateChart(prev => {
      if (prev.height <= MIN_GRID_SIZE) return prev
      const cells = position === 'top' ? prev.cells.slice(1) : prev.cells.slice(0, -1)
      const current_row = position === 'top' ? Math.max(0, prev.current_row - 1) : Math.min(prev.current_row, prev.height - 2)
      return { ...prev, cells, height: prev.height - 1, current_row }
    })
  }

  const addColumn = (position) => {
    updateChart(prev => {
      if (prev.width >= MAX_GRID_SIZE) return prev
      const cells = prev.cells.map(row => position === 'left' ? [0, ...row] : [...row, 0])
      return { ...prev, cells, width: prev.width + 1 }
    })
  }

  const removeColumn = (position) => {
    updateChart(prev => {
      if (prev.width <= MIN_GRID_SIZE) return prev
      const cells = prev.cells.map(row => position === 'left' ? row.slice(1) : row.slice(0, -1))
      return { ...prev, cells, width: prev.width - 1 }
    })
  }

  const addPaletteColor = () => {
    updateChart(prev => {
      if (prev.palette.length >= 20) return prev
      return { ...prev, palette: [...prev.palette, '#CCCCCC'] }
    })
  }

  const changePaletteColor = (index, hex) => {
    updateChart(prev => {
      const palette = [...prev.palette]
      palette[index] = hex
      return { ...prev, palette }
    })
  }

  const removePaletteColor = (index) => {
    if (index === 0) return // couleur 0 = fond, on ne la retire pas
    updateChart(prev => {
      if (prev.palette.length <= 2) return prev
      const palette = prev.palette.filter((_, i) => i !== index)
      // Les cases qui utilisaient cette couleur retombent sur le fond (0)
      const cells = prev.cells.map(row => row.map(c => (c === index ? 0 : c > index ? c - 1 : c)))
      return { ...prev, palette, cells }
    })
    if (selectedColor === index) setSelectedColor(0)
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center text-gray-400">{t('ui.loadingChart')}</div>
  }

  if (error || !chart) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-4">
        <p className="text-gray-500">{error || 'Grille introuvable'}</p>
        <Link to={`/projects/${projectId}`} className="text-primary-600 hover:text-primary-700 font-medium">
          ← Retour au projet
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      <div className="max-w-3xl mx-auto p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <button onClick={() => navigate(`/projects/${projectId}`)} className="flex-shrink-0 text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            <span className="hidden sm:inline">{t('ui.back')}</span>
          </button>
          <input
            type="text"
            value={chart.name}
            onChange={e => updateChart(prev => ({ ...prev, name: e.target.value }))}
            disabled={isLocked}
            className="flex-1 min-w-0 text-lg font-bold text-gray-900 text-center bg-transparent border-b border-transparent hover:border-gray-300 focus:border-primary-500 focus:outline-none px-2 disabled:opacity-70"
          />
          <button
            onClick={toggleLock}
            className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              isLocked ? 'bg-gray-100 text-gray-600 hover:bg-gray-200' : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
            title={isLocked ? t('ui.chartLocked') : t('ui.chartLockHint')}
          >
            {isLocked ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8 11V7a4 4 0 118 0m-8 4h8m-8 0a2 2 0 00-2 2v6a2 2 0 002 2h8a2 2 0 002-2v-6a2 2 0 00-2-2" /></svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
            )}
            <span className="hidden sm:inline">{isLocked ? 'Modifier' : 'Enregistrer'}</span>
          </button>
        </div>

        {isLocked && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 text-xs text-amber-800 text-center">
            Grille verrouillée — vous pouvez suivre votre progression sans risque de la modifier par erreur. Cliquez sur "Modifier" pour la déverrouiller et dessiner.
          </div>
        )}

        {/* Association projet/section — une grille peut être réutilisée sur un
            autre projet après sa création (ex: même motif sur un autre pull) */}
        <button
          onClick={() => setShowAssignModal(true)}
          className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition text-gray-600 flex items-center justify-center gap-1.5"
        >
          🔗 {chart.section_id ? t('ui.changeProjectSection') : t('ui.linkToProjectSection')}
        </button>

        {/* Zoom */}
        <div className="flex items-center justify-center gap-3">
          <button onClick={() => setCellPx(v => Math.max(2, v - 2))} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100">−</button>
          <span className="text-xs text-gray-400">{chart.width} × {chart.height}</span>
          <button onClick={() => setCellPx(v => Math.min(48, v + 2))} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100">+</button>
          <button onClick={fitZoomToScreen} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600">{t('ui.fitToScreen')}</button>
        </div>

        {/* Palette — masquée grille verrouillée : la peinture y est désactivée */}
        {!isLocked && (
          <div className="bg-white rounded-2xl shadow-sm p-4">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('ui.paletteHint')}</p>
            <div className="flex flex-wrap gap-2">
              {chart.palette.map((hex, i) => (
                <div key={i} className="relative">
                  <button
                    onClick={() => setSelectedColor(i)}
                    onDoubleClick={() => setEditingPaletteIndex(i)}
                    className={`w-9 h-9 rounded-lg border-2 transition ${selectedColor === i ? 'border-primary-600 ring-2 ring-primary-300 ring-offset-1 scale-110' : 'border-gray-200'}`}
                    style={{ backgroundColor: hex }}
                    title={i === 0 ? 'Fond' : `Couleur ${i}`}
                  />
                  {selectedColor === i && (
                    <span className="absolute -top-1.5 -left-1.5 w-4 h-4 bg-primary-600 text-white rounded-full text-[10px] leading-none flex items-center justify-center shadow">
                      ✓
                    </span>
                  )}
                  {editingPaletteIndex === i && (
                    <div className="absolute top-10 left-0 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 flex items-center gap-2 whitespace-nowrap">
                      <input
                        type="color"
                        autoFocus
                        value={hex}
                        onChange={e => changePaletteColor(i, e.target.value)}
                      />
                      <button
                        onClick={() => setEditingPaletteIndex(null)}
                        className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700"
                      >
                        {t('ui.done')}
                      </button>
                    </div>
                  )}
                  {i > 0 && (
                    <button
                      onClick={() => removePaletteColor(i)}
                      className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center hover:bg-red-600"
                      title={t('ui.deleteThisColor')}
                    >×</button>
                  )}
                </div>
              ))}
              <button
                onClick={addPaletteColor}
                className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-500 flex items-center justify-center"
                title={t('ui.addColor')}
              >＋</button>
            </div>
            <p className="text-xs text-gray-400 mt-2">{t('ui.doubleClickColor')}</p>
          </div>
        )}

        {/* Grille avec boutons d'ajout/retrait — masqués grille verrouillée */}
        <div className="bg-white rounded-2xl shadow-sm p-4 overflow-auto">
          {!isLocked && (
            <div className="flex justify-center mb-1 gap-1.5">
              <button onClick={() => addRow('top')} title={t('ui.addRowAbove')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
              <button onClick={() => removeRow('top')} title={t('ui.removeTopRow')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
            </div>
          )}
          <div ref={canvasRowRef} className="flex items-center gap-1.5 justify-center">
            {!isLocked && (
              <div className="flex flex-col gap-1.5">
                <button onClick={() => addColumn('left')} title={t('ui.addColumnLeft')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
                <button onClick={() => removeColumn('left')} title={t('ui.removeLeftColumn')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
              </div>
            )}
            <canvas
              ref={canvasRef}
              className="touch-none cursor-crosshair border border-gray-200 rounded"
              onMouseDown={handlePointerDown}
              onMouseMove={handlePointerMove}
              onMouseUp={handlePointerUp}
              onMouseLeave={handlePointerUp}
              onTouchStart={e => { e.preventDefault(); const t = e.touches[0]; handlePointerDown({ clientX: t.clientX, clientY: t.clientY }) }}
              onTouchMove={e => { e.preventDefault(); const t = e.touches[0]; handlePointerMove({ clientX: t.clientX, clientY: t.clientY }) }}
              onTouchEnd={handlePointerUp}
            />
            {!isLocked && (
              <div className="flex flex-col gap-1.5">
                <button onClick={() => addColumn('right')} title={t('ui.addColumnRight')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
                <button onClick={() => removeColumn('right')} title={t('ui.removeRightColumn')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
              </div>
            )}
          </div>
          {!isLocked && (
            <div className="flex justify-center mt-1 gap-1.5">
              <button onClick={() => addRow('bottom')} title={t('ui.addRowBelow')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
              <button onClick={() => removeRow('bottom')} title={t('ui.removeBottomRow')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
            </div>
          )}
        </div>
      </div>

      {showAssignModal && (
        <SaveChartToProjectModal
          existingChart={chart}
          onClose={() => setShowAssignModal(false)}
          onSaved={(updatedChart) => {
            // [AI:Claude] Si la grille a changé de projet, l'URL actuelle (ancien
            // projectId) ne correspond plus — on redirige vers la nouvelle.
            if (updatedChart && String(updatedChart.project_id) !== String(projectId)) {
              navigate(`/projects/${updatedChart.project_id}/charts/${chartId}`, { replace: true })
            } else {
              setChart(updatedChart)
            }
          }}
        />
      )}
    </div>
  )
}

export default ChartEditor
