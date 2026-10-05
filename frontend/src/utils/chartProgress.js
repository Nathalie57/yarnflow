/**
 * Calcule la prochaine ligne d'une grille a travailler depuis le compteur de
 * la section. currentRow represente le nombre de rangs deja termines dans la
 * section, et startRow le nombre de rangs termines avant le debut du motif.
 */
export function getChartProgress(currentRow, startRow, height, counterUnit = 'rows') {
  if (counterUnit !== 'rows') {
    return { status: 'unsupported', activeLine: null, canvasRow: null }
  }

  const sectionRow = Number(currentRow)
  const chartStart = Number(startRow)
  const chartHeight = Number(height)

  if (!Number.isFinite(sectionRow) || !Number.isFinite(chartStart) || !Number.isInteger(chartHeight) || chartHeight <= 0) {
    return { status: 'invalid', activeLine: null, canvasRow: null }
  }

  const completedInChart = Math.floor(sectionRow) - Math.max(0, Math.floor(chartStart))

  if (completedInChart < 0) {
    return { status: 'before', activeLine: null, canvasRow: null }
  }

  if (completedInChart >= chartHeight) {
    return { status: 'completed', activeLine: null, canvasRow: null }
  }

  return {
    status: 'active',
    activeLine: completedInChart + 1,
    // cells[0] est dessine en haut, tandis que le rang 1 est en bas.
    canvasRow: chartHeight - 1 - completedInChart,
  }
}

export function chartsForSection(charts, sectionId, counterUnit = 'rows') {
  if (counterUnit !== 'rows' || sectionId == null || !Array.isArray(charts)) return []
  return charts.filter(chart => Number(chart.section_id) === Number(sectionId))
}

export function selectedChartIdForSection(charts, preferredId = null) {
  if (!Array.isArray(charts) || charts.length === 0) return null
  if (preferredId != null && charts.some(chart => Number(chart.id) === Number(preferredId))) {
    return Number(preferredId)
  }
  return Number(charts[0].id)
}

export function shouldExpandChart(mode, status) {
  return mode === 'work' && status !== 'completed'
}
