export const sectionIsCompleted = section => Number(section?.is_completed) === 1

export const sectionHasNumericCounter = section => Boolean(section)
  && section.progression_type !== 'action'
  && !(section.progression_type === 'composite' && section.counter_unit == null)

export function simpleSectionTarget(section) {
  if (!section || (section.progression_type || 'simple') !== 'simple') return null
  const target = Number(section.total_rows)
  return Number.isFinite(target) && target > 0 ? target : null
}

export function cappedSectionProgress(section, value) {
  const target = simpleSectionTarget(section)
  return target === null ? value : Math.min(value, target)
}

export function patternProgressRange(patternStartRow, completed, sectionTarget = null) {
  const start = Number(patternStartRow)
  if (!Number.isInteger(start) || start <= 0) return null
  const current = start + Math.max(0, Math.floor(Number(completed) || 0))
  const target = Number(sectionTarget)
  return {
    current,
    total: Number.isFinite(target) && target > 0 ? start + Math.floor(target) - 1 : null,
  }
}

export function nextJourneySection(sections, activeId) {
  const ordered = [...sections].sort((a, b) => Number(a.display_order ?? 0) - Number(b.display_order ?? 0) || Number(a.id) - Number(b.id))
  const index = ordered.findIndex(section => Number(section.id) === Number(activeId))
  if (index < 0) return null
  // Après une reprise au milieu du parcours, les étapes antérieures restent accessibles.
  return ordered.slice(index + 1).find(section => !sectionIsCompleted(section))
    || ordered.slice(0, index).find(section => !sectionIsCompleted(section)) || null
}

export function resolveJourneySection(sections, ...preferredIds) {
  for (const id of preferredIds) {
    const section = id != null && sections.find(section => Number(section.id) === Number(id))
    if (section) return section.id // Une étape terminée reste active jusqu'au choix explicite.
  }
  return (sections.find(section => !sectionIsCompleted(section)) || sections[0])?.id ?? null
}
