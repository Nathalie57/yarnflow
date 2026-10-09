import test from 'node:test'
import assert from 'node:assert/strict'
import { bindExtractedSections, projectReviewPoints, sectionReviewPoints, explicitMeasurementConflict, patternReference, updateSmartSection } from '../src/utils/smartCreationSafety.js'

const fourRows = { name: 'Bord', description: 'Tricoter 4 rangs.', unit: 'rangs', target: 4, progression_type: 'simple' }
const diagnostic = { code: 'section_measurement_conflict', message: 'Vérifier l’unité.', context: { section_index: 1 } }

test('diagnostic follows its source section after deletion and duplication', () => {
  const points = projectReviewPoints({ validation_issues: { unverifiable: [diagnostic] } })
  const original = bindExtractedSections([{ ...fourRows, name: 'A' }, { ...fourRows, name: 'B' }, { ...fourRows, name: 'C' }])
  const afterDeletion = original.slice(1)
  assert.equal(sectionReviewPoints(points, afterDeletion[0], 0).length, 1)
  assert.equal(sectionReviewPoints(points, afterDeletion[1], 1).length, 0)
  const copy = { ...original[1], _source_index: null, _manually_edited: true }
  assert.equal(sectionReviewPoints(points, copy, 1).length, 0)
  assert.equal(sectionReviewPoints(points, original[1], 2).length, 1)
})

test('coherent four rows marks the initial measurement flag as resolved without deleting it', () => {
  const points = projectReviewPoints({ validation_issues: { unverifiable: [diagnostic] } })
  assert.equal(explicitMeasurementConflict(fourRows), false)
  const section = { ...fourRows, _source_index: 1 }
  assert.equal(sectionReviewPoints(points, section, 0)[0].displayState, 'resolved')
  assert.equal(points.length, 1)
  assert.equal(points[0].message, 'Vérifier l’unité.')
  assert.equal(sectionReviewPoints(points, { ...section, target: 5 }, 0)[0].displayState, 'current')
})

test('round and tour units are coherent discrete measurements while cm remains distinct', () => {
  const rounds = { name: 'Oreille', description: 'Crocheter 12 tours.', unit: 'tours', target: 12, progression_type: 'simple' }
  assert.equal(explicitMeasurementConflict(rounds), false)
  assert.equal(explicitMeasurementConflict({ ...rounds, unit: 'rounds' }), false)
  assert.equal(explicitMeasurementConflict({ ...rounds, unit: 'rows' }), false)
  assert.equal(explicitMeasurementConflict({ ...rounds, unit: 'cm' }), true)
  assert.equal(explicitMeasurementConflict({ ...rounds, target: 10 }), true)
})

test('uncertain human ambiguities and composites remain initial review points', () => {
  const points = [{ code: 'structural_ambiguity_unresolved', sectionIndex: 0 }]
  assert.equal(sectionReviewPoints(points, { ...fourRows, _source_index: 0 }, 0)[0].displayState, 'initial')
  assert.equal(explicitMeasurementConflict({ ...fourRows, progression_type: 'composite', target: null }), null)
  assert.equal(explicitMeasurementConflict({ ...fourRows, target_measured_from: 'piece_start' }), null)
})

test('a cm reference survives a unit edit without becoming a target in the new unit', () => {
  const section = bindExtractedSections([{ name: 'Corps', unit: 'cm', target: null, target_raw: 48,
    target_measured_from: 'piece_start', progression_type: 'simple' }])[0]
  const edited = updateSmartSection(section, 'unit', 'rangs')
  assert.equal(edited.target, null)
  assert.equal(edited.target_raw, null)
  assert.deepEqual(patternReference(edited), { value: 48, unit: 'cm', from: 'piece_start' })
})

test('explicit composite pattern reference is displayed without changing classification', () => {
  const section = { progression_type: 'composite', unit: 'rangs', target: null,
    pattern_reference: { value: 48, unit: 'cm', from: 'piece_start' } }
  assert.deepEqual(patternReference(section), section.pattern_reference)
  assert.equal(section.target, null)
  assert.equal(section.progression_type, 'composite')
})
