// Keep the selected source and size together, including imports restored from the server.
export function analysisSelection({ mode, file, url = '', pastedText = '', libraryId, resumedImportId, patternSize = '' }) {
  const type = pastedText.trim() && mode === 'url' ? 'text' : mode
  const source = resumedImportId ? `import:${resumedImportId}`
    : type === 'pdf' ? file
      : type === 'library' ? libraryId
        : type === 'text' ? pastedText.trim() : url.trim()
  return { type, source, size: patternSize.trim() }
}

export function sameAnalysisSelection(a, b) {
  return !!a && !!b && a.type === b.type && a.source === b.source && a.size === b.size
}

export function blockingPrecreationIssue(data) {
  return blockingPrecreationIssues(data)[0] || null
}

const REVIEWABLE_ERROR_CODES = new Set([
  'section_empty', 'section_instructions_missing', 'section_target_invalid',
  'symmetric_piece_missing', 'structural_ambiguity_unresolved',
])

export function blockingPrecreationIssues(data) {
  const errors = data?.validation_issues?.errors
  return Array.isArray(errors)
    ? errors.filter(issue => typeof issue?.code === 'string' && !REVIEWABLE_ERROR_CODES.has(issue.code))
    : []
}

export function projectReviewPoints(data, aiStatus = null) {
  const validation = data?.validation_issues || {}
  const errors = Array.isArray(validation.errors)
    ? validation.errors.filter(issue => REVIEWABLE_ERROR_CODES.has(issue?.code))
    : []
  const issues = [
    ...errors,
    ...(Array.isArray(validation.warnings) ? validation.warnings : []),
    ...(Array.isArray(validation.unverifiable) ? validation.unverifiable : []),
    ...(Array.isArray(validation.section_measurements) ? validation.section_measurements : []),
  ]
  const points = []
  const seen = new Set()
  for (const issue of issues) {
    if (!issue?.code) continue
    const field = String(issue.context?.field || '')
    const fieldSection = field.match(/^sections\[(\d+)]\./)
    const sectionIndex = Number.isInteger(issue.context?.section_index)
      ? issue.context.section_index
      : fieldSection ? Number(fieldSection[1]) : null
    const key = `${issue.code}:${sectionIndex ?? ''}:${field}`
    if (seen.has(key)) continue
    seen.add(key)
    points.push({
      code: issue.code,
      ...(typeof issue.message === 'string' && issue.message ? { message: issue.message } : {}),
      ...(issue.context ? { context: issue.context } : {}),
      sectionIndex,
      availableSizes: issue.code === 'pattern_size_not_selected'
        ? (Array.isArray(issue.context?.available_sizes) && issue.context.available_sizes.length
            ? issue.context.available_sizes
            : Array.isArray(data?.available_sizes) ? data.available_sizes : [])
        : [],
      values: issue.code === 'structural_ambiguity_unresolved'
        ? safeMeasurementValues(issue.context?.source_values)
        : [],
    })
  }
  if (data?.contains_diagram) points.push({ code: data.diagram_source_accessible === false ? 'diagram_unavailable' : 'diagram_present', sectionIndex: null, values: [] })
  // "partial" est un résumé technique, pas une action à lui seul. Ne l'afficher que si
  // aucun diagnostic concret ne permet déjà à l'utilisatrice de savoir quoi vérifier.
  if (aiStatus === 'partial' && points.length === 0) points.push({ code: 'analysis_partial', sectionIndex: null, values: [] })
  return points
}

function safeMeasurementValues(sourceValues) {
  if (!Array.isArray(sourceValues)) return []
  const parsed = []
  for (const source of sourceValues) {
    const matches = [...String(source).matchAll(/(\d+(?:[.,]\d+)?)\s*(cm|mm|in(?:ches?)?|pouces?)(?:\s+\2)?\b/giu)]
    if (matches.length !== 1) return []
    const value = Number(matches[0][1].replace(',', '.'))
    const rawUnit = matches[0][2].toLowerCase()
    const unit = rawUnit === 'cm' || rawUnit === 'mm' ? rawUnit : 'in'
    if (!Number.isFinite(value)) return []
    parsed.push({ value, unit })
  }
  if (!parsed.length || new Set(parsed.map(item => item.unit)).size !== 1) return []
  return parsed.filter((item, index) => parsed.findIndex(other => other.value === item.value && other.unit === item.unit) === index)
}

export function singleCompatibleSize(issue) {
  if (issue?.code !== 'selected_size_not_available') return null
  const sizes = issue?.context?.available_sizes
  return Array.isArray(sizes) && sizes.length === 1 && String(sizes[0]).trim()
    ? String(sizes[0]).trim()
    : null
}

export function validSourceUrl(value) {
  try {
    const url = new URL(String(value || '').trim())
    return ['http:', 'https:'].includes(url.protocol) ? url.toString() : null
  } catch {
    return null
  }
}

export async function translateSmartPreview(request, project, sections) {
  const { data } = await request()
  const translated = data?.translated_sections
  if (data?.success !== true || !Array.isArray(translated) || !sections.length ||
      translated.some(section => typeof section?.name !== 'string' || !section.name.trim() ||
        typeof section.description !== 'string')) {
    throw new Error('Invalid translated sections')
  }
  return {
    project: { ...project, ...(typeof data.translated_pattern_notes === 'string' ? { pattern_notes: data.translated_pattern_notes } : {}) },
    sections: sections.map((section, index) => {
      if (section._manually_edited || section._source_index === null) return section
      const sourceIndex = Number.isInteger(section._source_index) ? section._source_index : index
      const translatedSection = translated[sourceIndex]
      if (!translatedSection || (section.description?.trim() && !translatedSection.description.trim())) {
        throw new Error('Invalid translated section mapping')
      }
      return { ...section, name: translatedSection.name, description: translatedSection.description }
    })
  }
}

export function updateSmartSection(section, field, value) {
  if (field === 'unit' && value !== section.unit) {
    return { ...section, unit: value, target: null, target_raw: null, _manually_edited: true }
  }
  if (field === 'target') {
    const target = value === '' ? null : Number(String(value).replace(',', '.'))
    return { ...section, target: target !== null && Number.isFinite(target) ? target : null, _manually_edited: true }
  }
  return { ...section, [field]: value, _manually_edited: true }
}

export function bindExtractedSections(sections = []) {
  return sections.map((section, index) => ({ ...section, _source_index: index, _manually_edited: false,
    _pattern_reference: patternReference(section),
  }))
}

// Le statut visuel ne modifie jamais les diagnostics utilisés à la confirmation.
export function sectionReviewPoints(points, section, currentIndex) {
  const sourceIndex = Object.hasOwn(section, '_source_index') ? section._source_index : currentIndex
  if (!Number.isInteger(sourceIndex)) return []
  return points.filter(point => point.sectionIndex === sourceIndex).map(point => {
    let displayState = 'initial'
    if (point.code === 'section_measurement_conflict') {
      const conflict = explicitMeasurementConflict(section)
      if (conflict === false) displayState = 'resolved'
      else if (conflict === true) displayState = 'current'
    }
    return { ...point, displayState }
  })
}

// Vérifier uniquement une instruction complète et explicite. Le reste reste à
// relire : aucun raisonnement sur les répétitions, tailles ou étapes composites.
export function explicitMeasurementConflict(section) {
  if ((section.progression_type || 'simple') !== 'simple') return null
  const match = String(section.description || '').trim().match(/^(?:tricoter|tricotez|crocheter|crochetez|faire|faites|work|knit|crochet)\s+(\d+(?:[.,]\d+)?)\s*(cm|rangs?|tours?|rows?|rounds?)\s*[.!]?$/iu)
  if (!match) return null
  const normalizeUnit = value => {
    const unit = String(value || 'rangs').toLowerCase()
    if (unit === 'cm') return 'cm'
    if (['tour', 'tours', 'round', 'rounds'].includes(unit)) return 'rounds'
    if (['rang', 'rangs', 'row', 'rows'].includes(unit)) return 'rows'
    return unit
  }
  const expectedUnit = normalizeUnit(match[2])
  const actualUnit = normalizeUnit(section.unit)
  // rows/rangs et rounds/tours sont tous deux une progression discrète : la nuance
  // lexicale est conservée à l'affichage, sans devenir un faux conflit de mesure.
  if (expectedUnit === 'cm' ? actualUnit !== 'cm' : actualUnit === 'cm') return true
  // Une cible totale et une cible de section ne sont pas directement comparables.
  if (section.target_measured_from === 'piece_start') return null
  if (section.target == null || section.target === '' || !Number.isFinite(Number(section.target))) return null
  return Math.abs(Number(section.target) - Number(match[1].replace(',', '.'))) > 0.0001
}

export function patternReference(section) {
  if (section.pattern_reference?.unit === 'cm' && Number(section.pattern_reference.value) > 0) return section.pattern_reference
  if (Number(section.target_raw) > 0) return {
    value: Number(section.target_raw), unit: section.target_raw_unit || section.unit,
    from: section.target_measured_from || 'section',
  }
  return section._pattern_reference || null
}
