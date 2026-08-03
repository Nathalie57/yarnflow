/**
 * @file ChartDesigner.jsx
 * @brief Outil "bac à sable" pour créer une grille jacquard/colorwork, sans projet au
 * départ — à enregistrer ensuite dans un projet via SaveChartToProjectModal
 */

import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../../services/api'
import SaveChartToProjectModal from './SaveChartToProjectModal'
import { MAX_GRID_SIZE, NO_GRID_DETECTED, imageFileToChart } from '../../utils/chartImageImport'
import { photoFileToChart } from '../../utils/photoToChart'
import { useTranslation } from 'react-i18next'

const MIN_GRID_SIZE = 1
const DEFAULT_CELL_PX = 20

const makeBlankChart = (name, width, height) => ({
  name,
  width,
  height,
  palette: ['#FFFFFF', '#000000'],
  cells: Array.from({ length: height }, () => Array(width).fill(0)),
})

export default function ChartDesigner() {
  const { t } = useTranslation('tools')
  const navigate = useNavigate()
  const [chart, setChart] = useState(null)
  const [mode, setMode] = useState('draw')
  const [name, setName] = useState('')
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)
  const [selectedColor, setSelectedColor] = useState(1)
  const [cellPx, setCellPx] = useState(DEFAULT_CELL_PX)
  const [editingPaletteIndex, setEditingPaletteIndex] = useState(null)
  const [mergingPaletteIndex, setMergingPaletteIndex] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const [imageFile, setImageFile] = useState(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const [importNote, setImportNote] = useState('')

  const [photoFile, setPhotoFile] = useState(null)
  const [photoGridWidth, setPhotoGridWidth] = useState(50)
  const [photoMaxColors, setPhotoMaxColors] = useState(8)
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false)
  const [photoError, setPhotoError] = useState('')

  const [myCharts, setMyCharts] = useState([])
  const [loadingMyCharts, setLoadingMyCharts] = useState(true)
  const [showAllCharts, setShowAllCharts] = useState(false)

  useEffect(() => {
    api.get('/charts').then(res => {
      setMyCharts(res.data?.charts || [])
    }).catch(() => setMyCharts([])).finally(() => setLoadingMyCharts(false))
  }, [])

  // [AI:Claude] Une grille sans projet n'a pas de page dédiée — on la
  // recharge dans l'éditeur bac à sable pour continuer à la modifier.
  const loadUnassignedChart = async (chartId) => {
    try {
      const res = await api.get(`/charts/${chartId}`)
      const c = res.data.chart
      setChart({ name: c.name, width: c.width, height: c.height, palette: c.palette, cells: c.cells })
      setShowAllCharts(false)
    } catch {
      // silencieux : la grille reste dans la liste, l'utilisateur peut réessayer
    }
  }

  const canvasRef = useRef(null)
  const canvasRowRef = useRef(null)
  const isPaintingRef = useRef(false)
  const paintValueRef = useRef(1)
  const lastFitDimsRef = useRef(null)

  // Ajuste automatiquement le zoom pour que toute la grille tienne à l'écran
  // dès qu'une nouvelle grille est créée/importée (dimensions différentes) —
  // sans ça, une grille importée de 68×101 cases démarre au même zoom qu'une
  // petite grille dessinée à la main et devient impossible à voir en entier.
  const fitZoomToScreen = () => {
    const row = canvasRowRef.current
    if (!row || !chart) return
    const sideButtonsWidth = 80 // boutons +/− compacts de part et d'autre du canvas
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

  const handleStart = () => {
    if (!name.trim() || !width || !height) return
    setChart(makeBlankChart(name.trim(), Number(width), Number(height)))
  }

  const handleImageImport = async () => {
    if (!name.trim() || !imageFile) return
    setIsProcessingImage(true)
    setImageError('')
    setImportNote('')
    try {
      const result = await imageFileToChart(imageFile)
      setChart({ name: name.trim(), width: result.width, height: result.height, palette: result.palette, cells: result.cells })
      const colorCount = result.palette.length
      setImportNote(`Grille détectée automatiquement depuis l'image : ${result.width} × ${result.height} cases, ${colorCount} couleur${colorCount > 1 ? 's' : ''} identifiée${colorCount > 1 ? 's' : ''}. Si un gris parasite s'est glissé dans la palette ci-dessous, un × apparaîtra dessus pour le fusionner avec la bonne couleur.`)
    } catch (e) {
      setImageError(e.message === NO_GRID_DETECTED
        ? t('ui.notAChart')
        : t('ui.imageProcessFailed'))
    } finally {
      setIsProcessingImage(false)
    }
  }

  const handlePhotoImport = async () => {
    if (!name.trim() || !photoFile) return
    setIsProcessingPhoto(true)
    setPhotoError('')
    setImportNote('')
    try {
      const result = await photoFileToChart(photoFile, Number(photoGridWidth), Number(photoMaxColors))
      setChart({ name: name.trim(), width: result.width, height: result.height, palette: result.palette, cells: result.cells })
      setImportNote(`Grille générée depuis la photo : ${result.width} × ${result.height} cases, ${result.palette.length} couleurs. Vous pouvez retoucher les cases et fusionner des couleurs ci-dessous si besoin.`)
    } catch (e) {
      setPhotoError(t('ui.imageProcessFailed'))
    } finally {
      setIsProcessingPhoto(false)
    }
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

  const updateChart = (updater) => {
    setChart(prev => updater(prev))
  }

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
    isPaintingRef.current = true
    paintValueRef.current = selectedColor
    paintCellAt(e.clientX, e.clientY)
  }
  const handlePointerMove = (e) => {
    if (!isPaintingRef.current) return
    paintCellAt(e.clientX, e.clientY)
  }
  const handlePointerUp = () => { isPaintingRef.current = false }

  const addRow = (position) => {
    updateChart(prev => {
      if (prev.height >= MAX_GRID_SIZE) return prev
      const newRow = new Array(prev.width).fill(0)
      const cells = position === 'top' ? [newRow, ...prev.cells] : [...prev.cells, newRow]
      return { ...prev, cells, height: prev.height + 1 }
    })
  }

  const removeRow = (position) => {
    updateChart(prev => {
      if (prev.height <= MIN_GRID_SIZE) return prev
      const cells = position === 'top' ? prev.cells.slice(1) : prev.cells.slice(0, -1)
      return { ...prev, cells, height: prev.height - 1 }
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

  // Fusionne sourceIndex dans targetIndex : toutes les cases de la couleur
  // source basculent vers la couleur cible, puis la source disparaît de la
  // palette. Contrairement à un simple "supprimer", on choisit vers quelle
  // couleur reporter les cases (pas systématiquement le fond).
  const mergePaletteColor = (sourceIndex, targetIndex) => {
    if (sourceIndex === 0 || sourceIndex === targetIndex) return
    updateChart(prev => {
      if (prev.palette.length <= 2) return prev
      const newTarget = targetIndex > sourceIndex ? targetIndex - 1 : targetIndex
      const cells = prev.cells.map(row => row.map(c => {
        if (c === sourceIndex) return newTarget
        if (c > sourceIndex) return c - 1
        return c
      }))
      const palette = prev.palette.filter((_, i) => i !== sourceIndex)
      return { ...prev, palette, cells }
    })
    if (selectedColor === sourceIndex) setSelectedColor(0)
    setMergingPaletteIndex(null)
  }

  // Vue "Toutes mes grilles" — remplace le créateur tant qu'elle est ouverte,
  // pour ne pas encombrer l'écran de création par défaut.
  if (showAllCharts) {
    return (
      <div className="space-y-4">
        <button onClick={() => setShowAllCharts(false)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('ui.backToCreation')}
        </button>
        <div className="bg-white rounded-2xl shadow-sm p-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">{t('ui.myCharts')}</p>
          {loadingMyCharts ? (
            <p className="text-sm text-gray-400">{t('ui.loading')}</p>
          ) : myCharts.length === 0 ? (
            <p className="text-sm text-gray-500">{t('ui.noChartsYet')}</p>
          ) : (
            <div className="space-y-2">
              {myCharts.map(c => (
                c.project_id ? (
                  <Link
                    key={c.id}
                    to={`/projects/${c.project_id}/charts/${c.id}`}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">
                        {c.project_name}{c.section_name ? ` — ${c.section_name}` : ''} · {c.width} × {c.height} · rang {c.current_row}/{c.height}
                      </p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                ) : (
                  <button
                    key={c.id}
                    onClick={() => loadUnassignedChart(c.id)}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-gray-200 hover:border-primary-300 hover:bg-primary-50 transition text-left"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{c.name}</p>
                      <p className="text-xs text-gray-400">Sans projet · {c.width} × {c.height}</p>
                    </div>
                    <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </button>
                )
              ))}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Étape 1 : dimensions (dessin libre ou import d'image)
  if (!chart) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          {t('ui.chartDesignerIntro')}
        </p>
        {!loadingMyCharts && myCharts.length > 0 && (
          <button
            onClick={() => setShowAllCharts(true)}
            className="text-xs px-3 py-1.5 bg-gray-100 rounded-lg hover:bg-gray-200 text-gray-600 font-medium"
          >
            Voir mes grilles ({myCharts.length})
          </button>
        )}

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

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('ui.chartName')}</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder={t('ui.phChartName')}
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        {mode === 'draw' && (
          <>
            <div className="flex items-center gap-3">
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('ui.widthStitches')}</label>
                <input type="number" min="1" max="200" value={width} onChange={e => setWidth(e.target.value)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
              <div>
                <label className="block text-sm text-gray-600 mb-1">{t('ui.heightRows')}</label>
                <input type="number" min="1" max="200" value={height} onChange={e => setHeight(e.target.value)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
              </div>
            </div>
            <button
              onClick={handleStart}
              disabled={!name.trim() || !width || !height}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {t('ui.createChart')}
            </button>
          </>
        )}

        {mode === 'image' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('ui.existingChartPhoto')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => { setImageFile(e.target.files?.[0] || null); setImageError('') }}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                {t('ui.chartAutoDetect')}
              </p>
            </div>
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            <button
              onClick={handleImageImport}
              disabled={!name.trim() || !imageFile || isProcessingImage}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isProcessingImage ? t('ui.processingEllipsis') : t('ui.chartFromImage')}
            </button>
          </div>
        )}

        {mode === 'photo' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">{t('ui.anyPhoto')}</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => { setPhotoFile(e.target.files?.[0] || null); setPhotoError('') }}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                Convertit n'importe quelle image (photo, logo, dessin) en motif jacquard façon pixelart. Contrairement à "Importer un diagramme", ce n'est pas un diagramme existant qui est détecté — c'est une nouvelle grille créée à partir de l'image. Le résultat peut nécessiter quelques ajustements à la main (retoucher des cases, fusionner des couleurs).
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
            {photoError && <p className="text-xs text-red-500">{photoError}</p>}
            <button
              onClick={handlePhotoImport}
              disabled={!name.trim() || !photoFile || isProcessingPhoto}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isProcessingPhoto ? t('ui.processingEllipsis') : t('ui.chartFromPhoto')}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Une couleur n'a besoin d'être fusionnée que si elle est probablement un
  // artefact (bruit de compression, sur-segmentation) plutôt qu'une vraie
  // couleur voulue du motif : soit elle ne couvre presque aucune case, soit
  // elle est visuellement quasi identique à une autre couleur de la palette.
  // Sans ce filtre, le bouton "fusionner" apparaît même sur des couleurs
  // parfaitement légitimes (ex: vert et rose dans un motif floral), ce qui
  // n'a pas de sens à proposer.
  const hexToRgb = (hex) => {
    const v = hex.replace('#', '')
    return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)]
  }
  const paletteUsageCounts = new Array(chart.palette.length).fill(0)
  let paletteTotalCells = 0
  for (const row of chart.cells) {
    for (const c of row) { paletteUsageCounts[c] = (paletteUsageCounts[c] || 0) + 1; paletteTotalCells++ }
  }
  const isSuspiciousColor = (index) => {
    if (index === 0) return false
    const usageRatio = paletteTotalCells > 0 ? (paletteUsageCounts[index] || 0) / paletteTotalCells : 0
    if (usageRatio > 0 && usageRatio < 0.05) return true
    const rgb = hexToRgb(chart.palette[index])
    return chart.palette.some((otherHex, j) => {
      if (j === index) return false
      const other = hexToRgb(otherHex)
      const d2 = (rgb[0] - other[0]) ** 2 + (rgb[1] - other[1]) ** 2 + (rgb[2] - other[2]) ** 2
      return d2 < 40 * 40
    })
  }

  // Étape 2 : dessin
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setChart(null); setImportNote('') }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          {t('ui.startOver')}
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          Enregistrer →
        </button>
      </div>

      {importNote && (
        <div className="text-xs text-primary-700 bg-primary-50 border border-primary-200 rounded-lg px-3 py-2 flex items-start justify-between gap-2">
          <span>{importNote}</span>
          <button onClick={() => setImportNote('')} className="text-primary-400 hover:text-primary-600 flex-shrink-0">×</button>
        </div>
      )}

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setCellPx(v => Math.max(2, v - 2))} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100">−</button>
        <span className="text-xs text-gray-400">{chart.name} — {chart.width} × {chart.height}</span>
        <button onClick={() => setCellPx(v => Math.min(48, v + 2))} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100">+</button>
        <button onClick={fitZoomToScreen} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600">{t('ui.fitToScreen')}</button>
      </div>

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
                  <input type="color" autoFocus value={hex} onChange={e => changePaletteColor(i, e.target.value)} />
                  <button onClick={() => setEditingPaletteIndex(null)} className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">{t('ui.done')}</button>
                </div>
              )}
              {i > 0 && isSuspiciousColor(i) && (
                <button
                  onClick={() => setMergingPaletteIndex(i)}
                  className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full text-xs leading-none flex items-center justify-center hover:bg-red-600 z-10"
                  title={t('ui.colorArtifact')}
                >×</button>
              )}
              {mergingPaletteIndex === i && (
                <div className="absolute top-10 right-0 z-20 bg-white rounded-lg shadow-lg border border-gray-200 p-2 whitespace-nowrap">
                  <p className="text-xs text-gray-500 mb-2">{t('ui.mergeWith')}</p>
                  <div className="flex items-center gap-1.5">
                    {chart.palette.map((targetHex, ti) => ti !== i && (
                      <button
                        key={ti}
                        onClick={() => mergePaletteColor(i, ti)}
                        className="w-6 h-6 rounded border border-gray-300 hover:ring-2 hover:ring-primary-400"
                        style={{ backgroundColor: targetHex }}
                        title={ti === 0 ? 'Fond' : `Couleur ${ti}`}
                      />
                    ))}
                    <button onClick={() => setMergingPaletteIndex(null)} className="text-xs px-2 py-1 ml-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-500">{t('ui.cancel')}</button>
                  </div>
                </div>
              )}
            </div>
          ))}
          <button
            onClick={addPaletteColor}
            className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-500 flex items-center justify-center"
            title={t('ui.addColor')}
          >＋</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">{t('ui.colorMergeHint')}</p>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 overflow-auto">
        <div className="flex justify-center mb-1 gap-1.5">
          <button onClick={() => addRow('top')} title={t('ui.addRowAbove')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
          <button onClick={() => removeRow('top')} title={t('ui.removeTopRow')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
        </div>
        <div ref={canvasRowRef} className="flex items-center gap-1.5 justify-center">
          <div className="flex flex-col gap-1.5">
            <button onClick={() => addColumn('left')} title={t('ui.addColLeft')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
            <button onClick={() => removeColumn('left')} title={t('ui.removeColLeft')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
          </div>
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
          <div className="flex flex-col gap-1.5">
            <button onClick={() => addColumn('right')} title={t('ui.addColRight')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
            <button onClick={() => removeColumn('right')} title={t('ui.removeColRight')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
          </div>
        </div>
        <div className="flex justify-center mt-1 gap-1.5">
          <button onClick={() => addRow('bottom')} title={t('ui.addRowBelow')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
          <button onClick={() => removeRow('bottom')} title={t('ui.removeBottomRow')} className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
        </div>
      </div>

      {showSaveModal && (
        <SaveChartToProjectModal
          chart={chart}
          onClose={() => setShowSaveModal(false)}
          onSaved={(savedChart) => {
            // [AI:Claude] Après l'enregistrement, on quitte l'édition : vers la
            // grille dans son projet si elle y est rattachée, sinon vers "Mes
            // grilles" — sans ça on reste bloqué sur la grille déjà enregistrée.
            if (savedChart?.project_id) {
              navigate(`/projects/${savedChart.project_id}/charts/${savedChart.id}`)
            } else {
              setChart(null)
              setImportNote('')
              setShowAllCharts(true)
              api.get('/charts').then(res => setMyCharts(res.data?.charts || [])).catch(() => {})
            }
          }}
        />
      )}
    </div>
  )
}
