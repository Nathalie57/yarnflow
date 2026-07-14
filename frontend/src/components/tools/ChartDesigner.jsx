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

const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

// Regroupement automatique des couleurs par seuil de distance : on ne
// demande pas un nombre de couleurs à l'avance, on trouve le nombre réel de
// couleurs présentes dans l'image. On part de "seaux" grossiers (pour ne pas
// comparer des milliers de pixels entre eux), fusionnés par ordre de
// fréquence tant qu'ils sont assez proches pour être la même couleur.
const MAX_AUTO_COLORS = 20
const MERGE_THRESHOLD = 32

const autoQuantizeColors = (pixels, mergeThreshold = MERGE_THRESHOLD, maxColors = MAX_AUTO_COLORS) => {
  const bucketSize = 12
  const buckets = new Map()
  for (const p of pixels) {
    const key = `${Math.round(p[0] / bucketSize)},${Math.round(p[1] / bucketSize)},${Math.round(p[2] / bucketSize)}`
    let b = buckets.get(key)
    if (!b) { b = { color: [0, 0, 0], count: 0 }; buckets.set(key, b) }
    b.color[0] += p[0]; b.color[1] += p[1]; b.color[2] += p[2]; b.count++
  }
  const coarse = Array.from(buckets.values())
    .map(b => ({ color: [b.color[0] / b.count, b.color[1] / b.count, b.color[2] / b.count], count: b.count }))
    .sort((a, b) => b.count - a.count)

  const thresholdSq = mergeThreshold * mergeThreshold
  const clusters = []
  for (const bucket of coarse) {
    let nearest = null
    let nearestDist = Infinity
    for (const c of clusters) {
      const d = dist2(bucket.color, c.color)
      if (d < nearestDist) { nearestDist = d; nearest = c }
    }
    if (nearest && nearestDist <= thresholdSq) {
      const total = nearest.count + bucket.count
      nearest.color = [0, 1, 2].map(i => (nearest.color[i] * nearest.count + bucket.color[i] * bucket.count) / total)
      nearest.count = total
    } else {
      clusters.push({ color: bucket.color.slice(), count: bucket.count })
    }
  }

  // Le bruit JPEG/anti-crénelage laisse plein de petits clusters parasites
  // (gris intermédiaires entre deux vraies couleurs) après la fusion fine :
  // une couleur réellement utilisée dans le motif couvre une part
  // significative des cases, un artefact de compression non. On absorbe donc
  // les clusters minoritaires dans leur voisin le plus proche.
  const minorThreshold = Math.max(3, Math.round(pixels.length * 0.10))
  while (clusters.length > 1) {
    let minIdx = 0
    for (let i = 1; i < clusters.length; i++) if (clusters[i].count < clusters[minIdx].count) minIdx = i
    if (clusters[minIdx].count >= minorThreshold) break

    let nearestIdx = -1
    let nearestDist = Infinity
    for (let i = 0; i < clusters.length; i++) {
      if (i === minIdx) continue
      const d = dist2(clusters[minIdx].color, clusters[i].color)
      if (d < nearestDist) { nearestDist = d; nearestIdx = i }
    }
    const total = clusters[nearestIdx].count + clusters[minIdx].count
    clusters[nearestIdx].color = [0, 1, 2].map(k => (clusters[nearestIdx].color[k] * clusters[nearestIdx].count + clusters[minIdx].color[k] * clusters[minIdx].count) / total)
    clusters[nearestIdx].count = total
    clusters.splice(minIdx, 1)
  }

  // Filet de sécurité : si l'image est trop bruitée (vraie photo), on
  // fusionne les clusters les plus proches jusqu'à rester dans une palette
  // gérable — l'utilisatrice peut encore fusionner à la main après coup.
  while (clusters.length > maxColors) {
    let bi = 0, bj = 1, bd = Infinity
    for (let i = 0; i < clusters.length; i++) {
      for (let j = i + 1; j < clusters.length; j++) {
        const d = dist2(clusters[i].color, clusters[j].color)
        if (d < bd) { bd = d; bi = i; bj = j }
      }
    }
    const total = clusters[bi].count + clusters[bj].count
    clusters[bi].color = [0, 1, 2].map(k => (clusters[bi].color[k] * clusters[bi].count + clusters[bj].color[k] * clusters[bj].count) / total)
    clusters[bi].count = total
    clusters.splice(bj, 1)
  }

  const indices = pixels.map(p => {
    let best = 0
    let bestDist = Infinity
    for (let i = 0; i < clusters.length; i++) {
      const d = dist2(p, clusters[i].color)
      if (d < bestDist) { bestDist = d; best = i }
    }
    return best
  })

  return { palette: clusters.map(c => rgbToHex(c.color)), indices }
}

const luminance = (r, g, b) => 0.299 * r + 0.587 * g + 0.114 * b

// Profil de gradient : somme des |Δ luminance| entre colonnes (ou lignes)
// voisines. Dans un diagramme, TOUTES les frontières — lignes de grille comme
// bords du motif — tombent sur les limites de cases, donc le profil a un pic
// à chaque frontière. Bien plus fiable qu'un comptage de pixels sombres, qui
// confond une colonne de cases foncées avec une ligne de grille.
const gradientProfile = (data, W, H, axis) => {
  const length = axis === 'x' ? W : H
  const other = axis === 'x' ? H : W
  const profile = new Array(length).fill(0)
  for (let i = 1; i < length; i++) {
    let sum = 0
    for (let j = 0; j < other; j++) {
      const p1 = axis === 'x' ? (j * W + i) * 4 : (i * W + j) * 4
      const p0 = axis === 'x' ? (j * W + i - 1) * 4 : ((i - 1) * W + j) * 4
      sum += Math.abs(
        luminance(data[p1], data[p1 + 1], data[p1 + 2]) -
        luminance(data[p0], data[p0 + 1], data[p0 + 2])
      )
    }
    profile[i] = sum
  }
  return profile
}

const interpProfile = (profile, pos) => {
  const i = Math.floor(pos)
  if (i < 0 || i >= profile.length) return 0
  const frac = pos - i
  const next = i + 1 < profile.length ? profile[i + 1] : profile[i]
  return profile[i] * (1 - frac) + next * frac
}

// Ajuste un "peigne" (période + phase fractionnaires) sur le profil de
// gradient. Le score combine deux critères :
// 1. netteté : gradient moyen aux dents MOINS aux contre-dents (milieux de
//    cases) — à la vraie période les milieux sont plats ;
// 2. couverture : part du gradient total capturée par les dents — à un
//    multiple de la vraie période le peigne ne capture qu'une fraction des
//    lignes (1/5 à 5×), alors que la vraie période les capture toutes. C'est
//    ce qui élimine les harmoniques, y compris impaires, que le critère 1
//    seul laisse passer.
// La période fractionnaire est indispensable : 236 px pour 69 cases =
// 3,42 px/case, et une période arrondie accumule l'erreur case après case.
const combFit = (profile, minP, maxP) => {
  const n = profile.length
  const totalSum = profile.reduce((a, b) => a + b, 0)
  if (totalSum <= 0) return null
  let best = null
  for (let period = minP; period <= maxP; period += 0.02) {
    for (let phase = 0; phase < period; phase += 0.1) {
      let teeth = 0
      let mids = 0
      let count = 0
      for (let pos = phase; pos < n - 1; pos += period) {
        teeth += interpProfile(profile, pos)
        mids += interpProfile(profile, pos + period / 2)
        count++
      }
      if (count < 4) continue
      const sharpness = (teeth - mids) / count
      const coverage = teeth / totalSum
      const score = sharpness * coverage
      if (!best || score > best.score) best = { score, period, phase, sharpness }
    }
  }
  if (!best) return null
  const mean = totalSum / n
  // Confiance : netteté relative au niveau moyen de gradient. Une vraie
  // grille tranche net (>= ~0.9 mesuré) ; une photo/illustration sans grille
  // reste < ~0.4 — le seuil 0.6 sépare les deux.
  best.confidence = best.sharpness / mean
  return best
}

const MIN_COMB_CONFIDENCE = 0.6
const ANALYSIS_MAX_DIM = 800

const buildLinePositions = (phase, period, length) => {
  const lines = []
  for (let x = phase; x <= length - 1; x += period) lines.push(x)
  return lines
}

const detectGridFromImage = (img) => {
  // Downscale des très grandes images : suffisant pour l'analyse, et borne
  // le coût du fit (le peigne est en O(W×H) + O(périodes×phases×dents)).
  const scale = Math.min(1, ANALYSIS_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight))
  const W = Math.round(img.naturalWidth * scale)
  const H = Math.round(img.naturalHeight * scale)
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, W, H)
  const { data } = ctx.getImageData(0, 0, W, H)

  const vProfile = gradientProfile(data, W, H, 'x')
  const hProfile = gradientProfile(data, W, H, 'y')
  const v = combFit(vProfile, 2.4, 20)
  const h = combFit(hProfile, 2.4, 20)
  if (!v || !h) return null
  if (v.confidence < MIN_COMB_CONFIDENCE || h.confidence < MIN_COMB_CONFIDENCE) return null

  // Les cases d'une grille jacquard/point de croix sont à peu près carrées.
  // Une image quelconque avec des lignes régulières (tableau, infographie)
  // donne des "cases" très allongées dans un sens — pas une grille de motif.
  if (v.period / h.period > 2.5 || h.period / v.period > 2.5) return null

  const vLines = buildLinePositions(v.phase, v.period, W)
  const hLines = buildLinePositions(h.phase, h.period, H)

  const numCols = vLines.length - 1
  const numRows = hLines.length - 1
  if (numCols < 2 || numRows < 2 || numCols > MAX_GRID_SIZE || numRows > MAX_GRID_SIZE) return null

  const pixels = []
  for (let r = 0; r < numRows; r++) {
    const y0 = hLines[r]
    const y1 = hLines[r + 1]
    const my = Math.max(0.5, (y1 - y0) * 0.25)
    for (let c = 0; c < numCols; c++) {
      const x0 = vLines[c]
      const x1 = vLines[c + 1]
      const mx = Math.max(0.5, (x1 - x0) * 0.25)
      // Médiane plutôt que moyenne : plus robuste aux quelques pixels de
      // bruit JPEG/anti-crénelage qui traînent encore dans la marge.
      const rArr = [], gArr = [], bArr = []
      for (let y = Math.ceil(y0 + my); y <= Math.floor(y1 - my); y++) {
        for (let x = Math.ceil(x0 + mx); x <= Math.floor(x1 - mx); x++) {
          if (x < 0 || x >= W || y < 0 || y >= H) continue
          const i = (y * W + x) * 4
          rArr.push(data[i]); gArr.push(data[i + 1]); bArr.push(data[i + 2])
        }
      }
      const n = rArr.length
      const median = (arr) => { arr.sort((a, b) => a - b); return arr[Math.floor(arr.length / 2)] }
      if (n === 0) {
        const cx = Math.min(W - 1, Math.max(0, Math.round((x0 + x1) / 2)))
        const cy = Math.min(H - 1, Math.max(0, Math.round((y0 + y1) / 2)))
        const i = (cy * W + cx) * 4
        pixels.push([data[i], data[i + 1], data[i + 2]])
      } else {
        pixels.push([median(rArr), median(gArr), median(bArr)])
      }
    }
  }

  const { palette, indices } = autoQuantizeColors(pixels)
  const cells = []
  for (let r = 0; r < numRows; r++) cells.push(indices.slice(r * numCols, (r + 1) * numCols))
  return { width: numCols, height: numRows, palette, cells }
}

const NO_GRID_DETECTED = 'NO_GRID_DETECTED'

const imageFileToChart = (file) => new Promise((resolve, reject) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    try {
      const detected = detectGridFromImage(img)
      if (detected) { resolve(detected); return }
      reject(new Error(NO_GRID_DETECTED))
    } catch (e) {
      reject(e)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')) }
  img.src = url
})

export default function ChartDesigner() {
  const [chart, setChart] = useState(null)
  const [mode, setMode] = useState('draw')
  const [name, setName] = useState('')
  const [width, setWidth] = useState(20)
  const [height, setHeight] = useState(20)
  const [selectedColor, setSelectedColor] = useState(1)
  const [cellPx, setCellPx] = useState(DEFAULT_CELL_PX)
  const [editingPaletteIndex, setEditingPaletteIndex] = useState(null)
  const [showSaveModal, setShowSaveModal] = useState(false)

  const [imageFile, setImageFile] = useState(null)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const [imageError, setImageError] = useState('')
  const [importNote, setImportNote] = useState('')

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
      setImportNote(`Grille détectée automatiquement depuis l'image : ${result.width} × ${result.height} cases, ${colorCount} couleur${colorCount > 1 ? 's' : ''} identifiée${colorCount > 1 ? 's' : ''}. Vous pouvez fusionner des couleurs dans la palette ci-dessous si besoin.`)
    } catch (e) {
      setImageError(e.message === NO_GRID_DETECTED
        ? "Cette image ne ressemble pas à une grille de motif (aucune ligne régulière détectée). Essayez une image avec des lignes de grille visibles, ou dessinez votre motif à la main."
        : "Impossible de traiter cette image. Essayez avec un autre fichier.")
    } finally {
      setIsProcessingImage(false)
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

  // Étape 1 : dimensions (dessin libre ou import d'image)
  if (!chart) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-gray-500">
          Créez une grille jacquard/colorwork à la main ou depuis une image, puis enregistrez-la dans un de vos projets une fois terminée.
        </p>

        <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setMode('draw')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'draw' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
          >
            Dessiner à la main
          </button>
          <button
            onClick={() => setMode('image')}
            className={`flex-1 py-1.5 rounded-md text-sm font-medium transition ${mode === 'image' ? 'bg-white shadow-sm text-primary-700' : 'text-gray-500'}`}
          >
            Importer une image
          </button>
        </div>

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
        {mode === 'draw' && (
          <>
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
          </>
        )}

        {mode === 'image' && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Image du motif</label>
              <input
                type="file"
                accept="image/*"
                onChange={e => { setImageFile(e.target.files?.[0] || null); setImageError('') }}
                className="w-full text-sm text-gray-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary-50 file:text-primary-700 hover:file:bg-primary-100"
              />
              <p className="text-xs text-gray-400 mt-1">
                La taille de la grille et le nombre de couleurs sont détectés automatiquement depuis l'image. Vous pourrez fusionner des couleurs ensuite si besoin.
              </p>
            </div>
            {imageError && <p className="text-xs text-red-500">{imageError}</p>}
            <button
              onClick={handleImageImport}
              disabled={!name.trim() || !imageFile || isProcessingImage}
              className="w-full py-2.5 rounded-lg text-sm font-semibold bg-primary-600 text-white hover:bg-primary-700 transition disabled:opacity-50"
            >
              {isProcessingImage ? 'Traitement en cours…' : "Générer la grille depuis l'image"}
            </button>
          </div>
        )}
      </div>
    )
  }

  // Étape 2 : dessin
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <button onClick={() => { setChart(null); setImportNote('') }} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">
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
        <button onClick={fitZoomToScreen} className="text-xs px-2 py-1 bg-gray-100 rounded hover:bg-gray-200 text-gray-600">Ajuster à l'écran</button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm p-4 overflow-auto">
        <div className="flex justify-center mb-1 gap-1.5">
          <button onClick={() => addRow('top')} title="Ajouter un rang au-dessus" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
          <button onClick={() => removeRow('top')} title="Retirer le rang du dessus" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
        </div>
        <div ref={canvasRowRef} className="flex items-center gap-1.5 justify-center">
          <div className="flex flex-col gap-1.5">
            <button onClick={() => addColumn('left')} title="Ajouter une colonne à gauche" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
            <button onClick={() => removeColumn('left')} title="Retirer la colonne de gauche" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
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
            <button onClick={() => addColumn('right')} title="Ajouter une colonne à droite" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
            <button onClick={() => removeColumn('right')} title="Retirer la colonne de droite" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
          </div>
        </div>
        <div className="flex justify-center mt-1 gap-1.5">
          <button onClick={() => addRow('bottom')} title="Ajouter un rang en-dessous" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">+</button>
          <button onClick={() => removeRow('bottom')} title="Retirer le rang du dessous" className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm leading-none">−</button>
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
