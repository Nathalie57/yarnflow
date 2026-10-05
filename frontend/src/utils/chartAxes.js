export const CHART_AXIS_MIN_CELL_PX = 8

export function descendingChartAxisLabels(length) {
  const size = Math.max(0, Math.floor(Number(length) || 0))
  return Array.from({ length: size }, (_, index) => size - index)
}

export function shouldShowChartAxes(cellPx) {
  return Number(cellPx) >= CHART_AXIS_MIN_CELL_PX
}

export function meaningfulChartName(name) {
  const value = typeof name === 'string' ? name.trim() : ''
  if (!value) return null

  const genericNames = new Set(['chart', 'diagramme', 'grid', 'grille', 'untitled', 'sans titre'])
  return genericNames.has(value.toLocaleLowerCase()) ? null : value
}
