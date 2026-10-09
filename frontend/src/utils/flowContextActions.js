export const FLOW_CONTEXT_ACTION_EXPLAIN_NEXT_ROW = 'explain_next_row'

export const canExplainNextRow = progress => {
  if (!progress?.sectionName || progress.isCompleted) return false
  if (!['rows', 'rounds'].includes(progress.unit)) return false
  if (progress.progressionType === 'action') return false
  const current = Number(progress.currentRow)
  const total = progress.total == null ? null : Number(progress.total)
  return total === null || !Number.isFinite(current) || !Number.isFinite(total) || current < total
}
