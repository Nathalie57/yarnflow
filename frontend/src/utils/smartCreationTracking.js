export const SMART_CREATION_STAGES = Object.freeze([
  'source_selected',
  'left_during_analysis',
  'gate_shown',
  'notice_shown',
  'notice_clicked',
])

export const createSmartCreationAttemptId = () => {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `${Date.now().toString(16)}-${Math.random().toString(16).slice(2)}-${Math.random().toString(16).slice(2)}`
}

export const buildSmartCreationProgress = (stage, data = {}) => {
  if (!SMART_CREATION_STAGES.includes(stage)) {
    throw new Error(`Unsupported smart creation stage: ${stage}`)
  }
  return Object.fromEntries(Object.entries({ ...data, stage }).filter(([, value]) => value !== undefined && value !== null && value !== ''))
}

// Only an observed route departure counts. Hiding/reloading/closing the browser is
// deliberately not inferred as a SPA navigation or an abandonment.
export const shouldTrackAnalysisDeparture = ({ analysisInFlight, alreadyTracked, sourcePath, currentPath }) => (
  Boolean(analysisInFlight) && !alreadyTracked && Boolean(sourcePath) && sourcePath !== currentPath
)

export const noticeTrackingData = (notice) => ({
  attempt_id: notice.attemptId,
  import_id: notice.importId,
  source_type: notice.sourceType,
  project_id: notice.kind === 'ready' ? notice.id : undefined,
  gate_type: notice.gateType,
  display_context: notice.display === 'compact' ? 'compact' : 'expanded',
  notice_kind: notice.kind,
})
