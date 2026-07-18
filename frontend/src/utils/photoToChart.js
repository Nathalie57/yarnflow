/**
 * @file photoToChart.js
 * @brief Conversion d'une image quelconque (photo, logo, dessin) en grille
 * jacquard/colorwork façon pixelart. Contrairement à chartImageImport.js (qui
 * DÉTECTE un diagramme existant dans l'image), ici la transformation est
 * déterministe : l'utilisateur choisit la largeur de grille et le nombre max
 * de couleurs, l'algo fait le reste.
 *
 * Pipeline (validé sur prototype PHP avec images réelles) :
 *  1. Quantification k-means en espace Lab (distance perceptuelle — évite que
 *     des couleurs distinctes à l'œil fusionnent, ex: gants blancs vs peau)
 *  2. Sauvetage des petites couleurs saillantes que le k-means sacrifie
 *     (ex: boutons jaunes à 0.4% des pixels) en fusionnant les deux couleurs
 *     de palette les plus proches entre elles
 *  3. Ré-optimisation k-means après sauvetage
 *  4. Couleur de chaque case = vote majoritaire de ses pixels (pas la moyenne,
 *     qui crée des couleurs boueuses aux contours)
 *  5. Lissage spatial : une case isolée bascule vers la couleur majoritaire de
 *     son voisinage si cette couleur avait déjà des voix parmi ses pixels
 */

import { rgbToHex } from './chartImageImport'

const KMEANS_MAX_ITER = 12
const RESCUE_MAX = 3
// deltaE > 30 : pixels vraiment orphelins (loin de toute couleur de palette)
const RESCUE_DELTA_E = 30
// Surface minimale pour qu'un groupe d'orphelins mérite un slot de palette
const RESCUE_MIN_RATIO = 0.0008
const SMOOTH_PASSES = 2

// --- RGB -> Lab (D65), avec cache : la quantification compare sans arrêt les
// mêmes couleurs de buckets/palette entre elles ---
const labCache = new Map()
const rgb2lab = (r, g, b) => {
  const key = (r << 16) | (g << 8) | b
  let lab = labCache.get(key)
  if (lab) return lab
  const f = c => (c > 0.04045 ? Math.pow((c + 0.055) / 1.055, 2.4) : c / 12.92)
  const R = f(r / 255); const G = f(g / 255); const B = f(b / 255)
  const x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047
  const y = R * 0.2126 + G * 0.7152 + B * 0.0722
  const z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883
  const g2 = t => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116)
  const fx = g2(x); const fy = g2(y); const fz = g2(z)
  lab = [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)]
  labCache.set(key, lab)
  return lab
}

const labDist2 = (p, q) => {
  const a = rgb2lab(Math.round(p[0]), Math.round(p[1]), Math.round(p[2]))
  const b = rgb2lab(Math.round(q[0]), Math.round(q[1]), Math.round(q[2]))
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2
}

// Quelques itérations de k-means (sur buckets pondérés, distance Lab)
const kmeansRefine = (points, centers) => {
  for (let iter = 0; iter < KMEANS_MAX_ITER; iter++) {
    const acc = centers.map(() => ({ r: 0, g: 0, b: 0, n: 0 }))
    for (const p of points) {
      let bi = 0
      let best = Infinity
      for (let i = 0; i < centers.length; i++) {
        const d = labDist2(p.color, centers[i].color)
        if (d < best) { best = d; bi = i }
      }
      acc[bi].r += p.color[0] * p.n
      acc[bi].g += p.color[1] * p.n
      acc[bi].b += p.color[2] * p.n
      acc[bi].n += p.n
    }
    let moved = false
    for (let i = 0; i < centers.length; i++) {
      if (acc[i].n === 0) continue
      const nc = [acc[i].r / acc[i].n, acc[i].g / acc[i].n, acc[i].b / acc[i].n]
      if (Math.abs(nc[0] - centers[i].color[0]) + Math.abs(nc[1] - centers[i].color[1]) + Math.abs(nc[2] - centers[i].color[2]) > 1) moved = true
      centers[i] = { color: nc, n: acc[i].n }
    }
    if (!moved) break
  }
  return centers
}

/**
 * Convertit une image chargée en grille pixelart.
 *
 * @param {HTMLImageElement} img Image source chargée
 * @param {number} gridWidth Largeur de grille voulue (en cases)
 * @param {number} maxColors Nombre max de couleurs de palette
 * @returns {{width: number, height: number, palette: string[], cells: number[][]}}
 */
export const photoToChart = (img, gridWidth, maxColors) => {
  const srcW = img.naturalWidth
  const srcH = img.naturalHeight
  const gridW = Math.max(1, Math.round(gridWidth))
  const gridH = Math.max(1, Math.round(gridW * srcH / srcW))

  // Downscale d'analyse : assez de pixels par case pour un vote fiable, sans
  // parcourir des mégapixels inutiles
  const aw = Math.min(srcW, Math.max(gridW * 6, 400))
  const ah = Math.round(aw * srcH / srcW)
  const canvas = document.createElement('canvas')
  canvas.width = aw
  canvas.height = ah
  const ctx = canvas.getContext('2d')
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(img, 0, 0, aw, ah)
  const { data } = ctx.getImageData(0, 0, aw, ah)

  // --- 1. Histogramme par buckets (4 bits/canal) ---
  const buckets = new Map()
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]; const g = data[i + 1]; const b = data[i + 2]
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    let bk = buckets.get(key)
    if (!bk) { bk = { r: 0, g: 0, b: 0, n: 0 }; buckets.set(key, bk) }
    bk.r += r; bk.g += g; bk.b += b; bk.n++
  }
  const points = Array.from(buckets.values())
    .map(bk => ({ color: [bk.r / bk.n, bk.g / bk.n, bk.b / bk.n], n: bk.n }))
    .sort((a, b) => b.n - a.n)
  const totalPx = points.reduce((s, p) => s + p.n, 0)

  // --- 2. Init k-means++ pondéré : score = population × distance² au centre
  // le plus proche ---
  const minN = Math.max(2, totalPx * 0.0005)
  let centers = [{ color: points[0].color.slice(), n: points[0].n }]
  while (centers.length < maxColors) {
    let bestScore = 0
    let bestP = null
    for (const p of points) {
      if (p.n < minN) continue
      let dMin = Infinity
      for (const c of centers) {
        const d = labDist2(p.color, c.color)
        if (d < dMin) dMin = d
      }
      const score = p.n * dMin
      if (score > bestScore) { bestScore = score; bestP = p }
    }
    if (!bestP || bestScore === 0) break
    centers.push({ color: bestP.color.slice(), n: bestP.n })
  }

  centers = kmeansRefine(points, centers)

  // --- 3. Sauvetage des couleurs saillantes sacrifiées ---
  for (let rescue = 0; rescue < RESCUE_MAX; rescue++) {
    const orphans = []
    let orphanN = 0
    for (const p of points) {
      let dMin = Infinity
      for (const c of centers) {
        const d = labDist2(p.color, c.color)
        if (d < dMin) dMin = d
      }
      if (dMin > RESCUE_DELTA_E * RESCUE_DELTA_E) { orphans.push(p); orphanN += p.n }
    }
    if (orphanN < totalPx * RESCUE_MIN_RATIO || orphans.length === 0) break

    orphans.sort((a, b) => b.n - a.n)
    const seed = orphans[0]
    const acc = { r: 0, g: 0, b: 0, n: 0 }
    for (const o of orphans) {
      if (labDist2(o.color, seed.color) < 25 * 25) {
        acc.r += o.color[0] * o.n; acc.g += o.color[1] * o.n; acc.b += o.color[2] * o.n; acc.n += o.n
      }
    }
    if (acc.n < totalPx * RESCUE_MIN_RATIO) break
    const newCenter = { color: [acc.r / acc.n, acc.g / acc.n, acc.b / acc.n], n: acc.n }

    // Fusionner les deux centres les plus proches pour libérer un slot
    let bi = 0; let bj = 1; let best = Infinity
    for (let i = 0; i < centers.length; i++) {
      for (let j = i + 1; j < centers.length; j++) {
        const d = labDist2(centers[i].color, centers[j].color)
        if (d < best) { best = d; bi = i; bj = j }
      }
    }
    const a = centers[bi]; const b = centers[bj]; const n = a.n + b.n
    centers[bi] = { color: [0, 1, 2].map(k => (a.color[k] * a.n + b.color[k] * b.n) / n), n }
    centers[bj] = newCenter
  }

  // --- Ré-optimisation après sauvetage ---
  centers = kmeansRefine(points, centers)

  const palette = centers.map(c => c.color.map(v => Math.round(v)))

  // LUT bucket -> index palette pour accélérer le vote par pixel
  const lut = new Map()
  const nearestPalette = (r, g, b) => {
    const key = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
    let idx = lut.get(key)
    if (idx !== undefined) return idx
    let best = Infinity
    idx = 0
    for (let i = 0; i < palette.length; i++) {
      const d = labDist2([r, g, b], palette[i])
      if (d < best) { best = d; idx = i }
    }
    lut.set(key, idx)
    return idx
  }

  // --- 4. Case = vote majoritaire de ses pixels ---
  const cells = []
  const cellVotes = []
  for (let gy = 0; gy < gridH; gy++) {
    const y0 = Math.floor(gy * ah / gridH)
    const y1 = Math.max(y0 + 1, Math.floor((gy + 1) * ah / gridH))
    const row = []
    const voteRow = []
    for (let gx = 0; gx < gridW; gx++) {
      const x0 = Math.floor(gx * aw / gridW)
      const x1 = Math.max(x0 + 1, Math.floor((gx + 1) * aw / gridW))
      const votes = new Map()
      for (let y = y0; y < y1; y++) {
        for (let x = x0; x < x1; x++) {
          const i = (y * aw + x) * 4
          const pi = nearestPalette(data[i], data[i + 1], data[i + 2])
          votes.set(pi, (votes.get(pi) || 0) + 1)
        }
      }
      let bestIdx = 0
      let bestCount = -1
      for (const [pi, count] of votes) {
        if (count > bestCount) { bestCount = count; bestIdx = pi }
      }
      row.push(bestIdx)
      voteRow.push(votes)
    }
    cells.push(row)
    cellVotes.push(voteRow)
  }

  // --- 5. Lissage spatial : nettoie le bruit de contour sans gommer un vrai
  // détail isolé voulu (qui a 100% de ses voix pour sa propre couleur) ---
  for (let pass = 0; pass < SMOOTH_PASSES; pass++) {
    let changed = 0
    for (let gy = 0; gy < gridH; gy++) {
      for (let gx = 0; gx < gridW; gx++) {
        const own = cells[gy][gx]
        const neigh = new Map()
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            if (!dx && !dy) continue
            const ny = gy + dy
            const nx = gx + dx
            if (ny < 0 || ny >= gridH || nx < 0 || nx >= gridW) continue
            const c = cells[ny][nx]
            neigh.set(c, (neigh.get(c) || 0) + 1)
          }
        }
        if ((neigh.get(own) || 0) > 1) continue
        let majColor = own
        let majCount = 0
        for (const [c, count] of neigh) {
          if (count > majCount) { majCount = count; majColor = c }
        }
        if (majColor === own || majCount < 5) continue
        const votes = cellVotes[gy][gx]
        let totalV = 0
        for (const count of votes.values()) totalV += count
        if ((votes.get(majColor) || 0) >= 0.15 * totalV) {
          cells[gy][gx] = majColor
          changed++
        }
      }
    }
    if (changed === 0) break
  }

  return { width: gridW, height: gridH, palette: palette.map(rgbToHex), cells }
}

/**
 * Version fichier : charge l'image puis convertit.
 *
 * @param {File} file Fichier image
 * @param {number} gridWidth Largeur de grille voulue (en cases)
 * @param {number} maxColors Nombre max de couleurs
 * @returns {Promise<{width, height, palette, cells}>}
 */
export const photoFileToChart = (file, gridWidth, maxColors) => new Promise((resolve, reject) => {
  const img = new Image()
  const url = URL.createObjectURL(file)
  img.onload = () => {
    try {
      resolve(photoToChart(img, gridWidth, maxColors))
    } catch (e) {
      reject(e)
    } finally {
      URL.revokeObjectURL(url)
    }
  }
  img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')) }
  img.src = url
})
