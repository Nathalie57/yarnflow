const number = value => Number(value) || 0

const isAction = section => section?.progression_type === 'action'
const hasKnownTarget = section => !isAction(section) && number(section?.total_rows) > 0
const isSectionComplete = section => Number(section?.is_completed) === 1
const unitOf = section => section?.counter_unit || 'rows'
const groupProgressByUnit = sections => Object.values(sections.reduce((groups, section) => {
  const unit = unitOf(section)
  if (!groups[unit]) groups[unit] = { unit, current: 0, total: 0 }
  groups[unit].current += number(section.current_row)
  if (hasKnownTarget(section)) groups[unit].total += number(section.total_rows)
  return groups
}, {}))

export function completedStepsProgress(completedSteps, totalSteps) {
  const total = Math.max(0, Math.floor(number(totalSteps)))
  if (total === 0) return null
  const completed = Math.min(total, Math.max(0, Math.floor(number(completedSteps))))
  return { completed, total, percentage: Math.round((completed / total) * 100) }
}

export function summarizeProjectProgress(project, sections = []) {
  if (project?.status === 'completed') {
    return {
      mode: 'completed', percentage: 100,
      completedSections: sections.length, totalSections: sections.length,
      quantifiableCurrent: sections.filter(hasKnownTarget).reduce((sum, s) => sum + number(s.current_row), 0),
      quantifiableTotal: sections.filter(hasKnownTarget).reduce((sum, s) => sum + number(s.total_rows), 0),
      unquantifiableCurrent: sections.filter(s => !isAction(s) && !hasKnownTarget(s)).reduce((sum, s) => sum + number(s.current_row), 0),
    }
  }

  if (sections.length === 0) {
    const total = number(project?.total_rows)
    const current = number(project?.current_row)
    return total > 0
      ? { mode: 'percentage', percentage: Math.round((current / total) * 100), current, total }
      : { mode: 'descriptive', percentage: null, current, total: null, completedSections: 0, totalSections: 0, quantifiableCurrent: 0, quantifiableTotal: 0, unquantifiableCurrent: current, quantifiableByUnit: [], unquantifiableByUnit: current > 0 ? [{ unit: project?.counter_unit || 'rows', current, total: 0 }] : [] }
  }

  const progressionSections = sections.filter(s => !isAction(s))
  const quantifiable = progressionSections.filter(hasKnownTarget)
  const unquantifiable = progressionSections.filter(s => !hasKnownTarget(s))
  const quantifiableCurrent = quantifiable.reduce((sum, s) => sum + number(s.current_row), 0)
  const quantifiableTotal = quantifiable.reduce((sum, s) => sum + number(s.total_rows), 0)
  const unquantifiableCurrent = unquantifiable.reduce((sum, s) => sum + number(s.current_row), 0)
  const quantifiableByUnit = groupProgressByUnit(quantifiable)
  const unquantifiableByUnit = groupProgressByUnit(unquantifiable)
  const completedSections = sections.filter(isSectionComplete).length
  const progressionUnits = new Set(progressionSections.map(unitOf))

  if (unquantifiable.length === 0 && quantifiableTotal > 0 && progressionUnits.size <= 1) {
    return {
      mode: 'percentage',
      percentage: Math.round((quantifiableCurrent / quantifiableTotal) * 100),
      current: quantifiableCurrent,
      total: quantifiableTotal,
      completedSections,
      totalSections: sections.length,
      quantifiableCurrent,
      quantifiableTotal,
      unquantifiableCurrent,
      quantifiableByUnit,
      unquantifiableByUnit,
    }
  }

  return {
    mode: 'descriptive', percentage: null,
    completedSections, totalSections: sections.length,
    quantifiableCurrent, quantifiableTotal, unquantifiableCurrent,
    quantifiableByUnit, unquantifiableByUnit,
  }
}
