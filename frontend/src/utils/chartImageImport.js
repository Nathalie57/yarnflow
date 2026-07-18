/**
 * @file chartImageImport.js
 * @brief Détection automatique d'une grille jacquard/colorwork depuis une image
 * (diagramme photographié ou scanné) — partagé entre l'outil bac à sable
 * (ChartDesigner) et la création de grille directement depuis un projet.
 */

export const MAX_GRID_SIZE = 200
export const NO_GRID_DETECTED = 'NO_GRID_DETECTED'

export const rgbToHex = ([r, g, b]) =>
  '#' + [r, g, b].map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('').toUpperCase()

const dist2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2

// Regroupement automatique des couleurs par seuil de distance : on ne
// demande pas un nombre de couleurs à l'avance, on trouve le nombre réel de
// couleurs présentes dans l'image. On part de "seaux" grossiers (pour ne pas
// comparer des milliers de pixels entre eux), fusionnés par ordre de
// fréquence tant qu'ils sont assez proches pour être la même couleur.
const MAX_AUTO_COLORS = 20
// 55 plutôt qu'un seuil serré : un diagramme avec plusieurs couleurs proches
// (nuances d'un même ton dues à l'anti-crénelage/JPEG) éclate sinon une seule
// couleur voulue en plusieurs clusters quasi identiques.
const MERGE_THRESHOLD = 55

// Construit la palette à partir de TOUS les pixels intérieurs des cases (pas
// des médianes par case) : retourne les clusters de couleurs [r,g,b].
const buildPaletteFromPixels = (pixels, mergeThreshold = MERGE_THRESHOLD, maxColors = MAX_AUTO_COLORS) => {
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

  // Filet minimal : n'absorbe que les toutes petites miettes de bruit JPEG
  // résiduel. Un seuil élevé ici supprimerait à tort de vraies petites
  // touches de couleur voulues (ex: les yeux, un petit motif dans un coin).
  const minorThreshold = Math.max(10, Math.round(pixels.length * 0.005))
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

  return clusters.map(c => c.color)
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

  // Échantillonnage par VOTE : beaucoup de diagrammes ont des symboles
  // imprimés dans les cases (point de croix) — une médiane par case mélange
  // la couleur de fond avec l'encre du symbole et produit des teintes boueuses
  // et des couleurs dédoublées. À la place : palette construite sur tous les
  // pixels intérieurs de l'image, puis chaque pixel d'une case vote pour sa
  // couleur de palette la plus proche — le fond gagne le vote même avec un
  // symbole par-dessus.
  const cellPixelLists = []
  const allPixels = []
  for (let r = 0; r < numRows; r++) {
    const y0 = hLines[r]
    const y1 = hLines[r + 1]
    const my = Math.max(0.5, (y1 - y0) * 0.25)
    for (let c = 0; c < numCols; c++) {
      const x0 = vLines[c]
      const x1 = vLines[c + 1]
      const mx = Math.max(0.5, (x1 - x0) * 0.25)
      const pix = []
      for (let y = Math.ceil(y0 + my); y <= Math.floor(y1 - my); y++) {
        for (let x = Math.ceil(x0 + mx); x <= Math.floor(x1 - mx); x++) {
          if (x < 0 || x >= W || y < 0 || y >= H) continue
          const i = (y * W + x) * 4
          const p = [data[i], data[i + 1], data[i + 2]]
          pix.push(p)
          allPixels.push(p)
        }
      }
      if (pix.length === 0) {
        const cx = Math.min(W - 1, Math.max(0, Math.round((x0 + x1) / 2)))
        const cy = Math.min(H - 1, Math.max(0, Math.round((y0 + y1) / 2)))
        const i = (cy * W + cx) * 4
        pix.push([data[i], data[i + 1], data[i + 2]])
      }
      cellPixelLists.push(pix)
    }
  }

  const paletteColors = buildPaletteFromPixels(allPixels)
  const cells = []
  for (let r = 0; r < numRows; r++) {
    const row = []
    for (let c = 0; c < numCols; c++) {
      const votes = new Array(paletteColors.length).fill(0)
      for (const p of cellPixelLists[r * numCols + c]) {
        let best = 0
        let bestDist = Infinity
        for (let i = 0; i < paletteColors.length; i++) {
          const d = dist2(p, paletteColors[i])
          if (d < bestDist) { bestDist = d; best = i }
        }
        votes[best]++
      }
      let winner = 0
      for (let i = 1; i < votes.length; i++) if (votes[i] > votes[winner]) winner = i
      row.push(winner)
    }
    cells.push(row)
  }

  // Fusion des couleurs "mouchetées" : une vraie couleur de fil forme des
  // zones continues (forte auto-adjacence entre cases voisines), une nuance
  // parasite issue du JPEG est dispersée en poivre-et-sel dans une autre
  // couleur (auto-adjacence quasi nulle). On fusionne les mouchetées dans la
  // couleur la plus proche, MAIS seulement si la distance RGB est raisonnable
  // — ça protège les détails réellement isolés mais distincts (yeux noirs,
  // points des papillons), qui ont eux aussi une faible auto-adjacence.
  const protectedIdx = new Set()
  for (let iter = 0; iter < 30; iter++) {
    const n = paletteColors.length
    const counts = new Array(n).fill(0)
    const selfAdj = new Array(n).fill(0)
    const totalAdj = new Array(n).fill(0)
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        const k = cells[r][c]
        counts[k]++
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nc = c + dx
          const nr = r + dy
          if (nc < 0 || nc >= numCols || nr < 0 || nr >= numRows) continue
          totalAdj[k]++
          if (cells[nr][nc] === k) selfAdj[k]++
        }
      }
    }
    let worst = -1
    let worstRatio = 0.42
    for (let k = 0; k < n; k++) {
      if (counts[k] === 0 || totalAdj[k] === 0 || protectedIdx.has(k)) continue
      const ratio = selfAdj[k] / totalAdj[k]
      if (ratio < worstRatio) { worstRatio = ratio; worst = k }
    }
    if (worst < 0) break

    let nearest = -1
    let nearestD = Infinity
    for (let k = 0; k < n; k++) {
      if (k === worst || counts[k] === 0) continue
      const d = dist2(paletteColors[worst], paletteColors[k])
      if (d < nearestD) { nearestD = d; nearest = k }
    }
    if (nearest < 0 || nearestD > 90 * 90) {
      // Couleur mouchetée mais sans voisine plausible : c'est un vrai détail
      // isolé (yeux, petits points) — on la garde telle quelle.
      protectedIdx.add(worst)
      continue
    }
    for (let r = 0; r < numRows; r++) {
      for (let c = 0; c < numCols; c++) {
        if (cells[r][c] === worst) cells[r][c] = nearest
      }
    }
  }

  // Compacter la palette : retirer les couleurs qui n'ont plus aucune case
  const usedIdx = new Set()
  for (const row of cells) for (const k of row) usedIdx.add(k)
  const remap = new Map()
  const finalPalette = []
  for (let k = 0; k < paletteColors.length; k++) {
    if (usedIdx.has(k)) { remap.set(k, finalPalette.length); finalPalette.push(paletteColors[k]) }
  }
  for (const row of cells) for (let c = 0; c < row.length; c++) row[c] = remap.get(row[c])

  return { width: numCols, height: numRows, palette: finalPalette.map(rgbToHex), cells }
}

export const imageFileToChart = (file) => new Promise((resolve, reject) => {
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
