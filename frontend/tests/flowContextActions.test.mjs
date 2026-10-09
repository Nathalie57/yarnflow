import assert from 'node:assert/strict'
import test from 'node:test'
import { canExplainNextRow, FLOW_CONTEXT_ACTION_EXPLAIN_NEXT_ROW } from '../src/utils/flowContextActions.js'

const rows = overrides => ({
  sectionName: 'Corps',
  currentRow: 0,
  total: 4,
  unit: 'rows',
  progressionType: 'simple',
  isCompleted: false,
  ...overrides
})

test('the permanent action is available for row 1 and row 2', () => {
  assert.equal(canExplainNextRow(rows({ currentRow: 0 })), true)
  assert.equal(canExplainNextRow(rows({ currentRow: 1 })), true)
  assert.equal(FLOW_CONTEXT_ACTION_EXPLAIN_NEXT_ROW, 'explain_next_row')
})

test('row and round counters remain eligible with pattern offsets and repetitions', () => {
  assert.equal(canExplainNextRow(rows({ unit: 'rounds', patternStartRow: 12, secondaryCounters: [{ count: 2, target: 6, cycle_length: 4 }] })), true)
  assert.equal(canExplainNextRow(rows({ progressionType: 'composite', unit: 'rows' })), true)
})

test('cm, actions, unitless composites, completed and missing sections are hidden', () => {
  assert.equal(canExplainNextRow(rows({ unit: 'cm' })), false)
  assert.equal(canExplainNextRow(rows({ progressionType: 'action', unit: null })), false)
  assert.equal(canExplainNextRow(rows({ progressionType: 'composite', unit: null })), false)
  assert.equal(canExplainNextRow(rows({ isCompleted: true })), false)
  assert.equal(canExplainNextRow(rows({ currentRow: 4, total: 4 })), false)
  assert.equal(canExplainNextRow(rows({ sectionName: null })), false)
})
