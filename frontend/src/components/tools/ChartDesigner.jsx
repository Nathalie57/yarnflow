/**
 * @file ChartDesigner.jsx
 * @brief Outil "bac à sable" pour créer une grille jacquard/colorwork, sans projet au
 * départ — à enregistrer ensuite dans un projet via SaveChartToProjectModal
 */

import { useState, useRef, useEffect } from 'react'
import SaveChartToProjectModal from './SaveChartToProjectModal'

const MAX_GRID_SIZE = 200
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
  const [chart, setChart] = useState(null)
  const [name, setName] = useState('')
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)
  const [selectedColor, setSelectedColor] = useState(1)
  const [cellPx, setCellPx] = useState(DEFAULT_CELL_PX)
  const [editingPaletteIndex, setEditingPaletteIndex] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const canvasRef = useRef(null)
  const isPaintingRef = useRef(false)
  const paintValueRef = useRef(1)

  const handleStart = () => {
    if (!name.trim() || !width || !height) return
    setChart(makeBlankChart(name.trim(), Number(width), Number(height)))
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

  const removePaletteColor = (index) => {
    if (index === 0) return
    updateChart(prev => {
      if (prev.palette.length <= 2) return prev
      const palette = prev.palette.filter((_, i) => i !== index)
      const cells = prev.cells.map(row => row.map(c => (c === index ? 0 : c > index ? c - 1 : c)))
      return { ...prev, palette, cells }
    })
    if (selectedColor === index) setSelectedColor(0)
  }

  // Étape 1 : dimensions
  if (!chart) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Dessinez librement une grille jacquard/colorwork, puis enregistrez-la dans un de vos projets une fois terminée.
        </p>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nom de la grille</label>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Ex: Motif manche"
            maxLength={100}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <div className="flex items-center gap-3">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Largeur (mailles)</label>
            <input type="number" min="1" max="200" value={width} onChange={e => setWidth(e.target.value)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Hauteur (rangs)</label>
            <input type="number" min="1" max="200" value={height} onChange={e => setHeight(e.target.value)} className="w-24 px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
        </div>
        <button
          onClick={handleStart}
          disabled={!name.trim() || !width || !height}
          className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
        >
          Créer la grille
        </button>
      </div>
    )
  }

  // Étape 2 : dessin
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => setChart(null)} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          Recommencer
        </button>
        <button
          onClick={() => setShowSaveModal(true)}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary-600 text-white hover:bg-primary-700 transition"
        >
          Enregistrer dans un projet →
        </button>
      </div>

      <div className="flex items-center justify-center gap-3">
        <button onClick={() => setCellPx(v => Math.max(6, v - 4))} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100">−</button>
        <span className="text-xs text-gray-400">{chart.name} — {chart.width} × {chart.height}</span>
        <button onClick={() => setCellPx(v => Math.min(48, v + 4))} className="w-7 h-7 rounded-full bg-white border border-gray-300 text-gray-600 hover:bg-gray-100">+</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 overflow-auto">
        <div className="flex justify-center mb-2 gap-2">
          <button onClick={() => addColumn('left')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">+ Colonne gauche</button>
          <button onClick={() => removeColumn('left')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">− Colonne gauche</button>
        </div>
        <div className="flex items-start gap-2 justify-center">
          <div className="flex flex-col gap-2 pt-8">
            <button onClick={() => addRow('top')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">+ Rang haut</button>
            <button onClick={() => removeRow('top')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">− Rang haut</button>
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
          <div className="flex flex-col gap-2 pt-8">
            <button onClick={() => addRow('bottom')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">+ Rang bas</button>
            <button onClick={() => removeRow('bottom')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">− Rang bas</button>
          </div>
        </div>
        <div className="flex justify-center mt-2 gap-2">
          <button onClick={() => addColumn('right')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">+ Colonne droite</button>
          <button onClick={() => removeColumn('right')} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200">− Colonne droite</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Palette — cliquez pour peindre</p>
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
                  <button onClick={() => setEditingPaletteIndex(null)} className="text-xs px-2 py-1 bg-primary-600 text-white rounded hover:bg-primary-700">Terminé</button>
                </div>
              )}
              {i > 0 && (
                <button
                  onClick={() => removePaletteColor(i)}
                  className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] leading-none flex items-center justify-center hover:bg-red-600"
                  title="Supprimer cette couleur"
                >×</button>
              )}
            </div>
          ))}
          <button
            onClick={addPaletteColor}
            className="w-9 h-9 rounded-lg border-2 border-dashed border-gray-300 text-gray-400 hover:border-primary-400 hover:text-primary-500 flex items-center justify-center"
            title="Ajouter une couleur"
          >＋</button>
        </div>
        <p className="text-xs text-gray-400 mt-2">Double-cliquez une couleur pour la modifier.</p>
      </div>

      {showSaveModal && (
        <SaveChartToProjectModal
          chart={chart}
          onClose={() => setShowSaveModal(false)}
        />
      )}
    </div>
  )
}
