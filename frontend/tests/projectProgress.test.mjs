import assert from 'node:assert/strict'
import test from 'node:test'
import { completedStepsProgress, summarizeProjectProgress } from '../src/utils/projectProgress.js'

const simple = (current, total, unit = 'rows') => ({ progression_type: 'simple', counter_unit: unit, current_row: current, total_rows: total, is_completed: 0 })
const composite = (current, completed = 0, unit = 'rows') => ({ progression_type: 'composite', counter_unit: unit, current_row: current, total_rows: null, is_completed: completed })
const action = (completed = 0) => ({ progression_type: 'action', current_row: 0, total_rows: null, is_completed: completed })

test('step progress handles projects with zero, one or several steps', () => {
  assert.equal(completedStepsProgress(0, 0), null)
  assert.deepEqual(completedStepsProgress(0, 1), { completed: 0, total: 1, percentage: 0 })
  assert.deepEqual(completedStepsProgress(1, 2), { completed: 1, total: 2, percentage: 50 })
  assert.deepEqual(completedStepsProgress(3, 9), { completed: 3, total: 9, percentage: 33 })
})

test('numeric progress never completes a step without its explicit completion state', () => {
  const steps = [simple(8, 8), { ...simple(4, 4), is_completed: 1 }]
  assert.deepEqual(completedStepsProgress(
    steps.filter(step => Number(step.is_completed) === 1).length,
    steps.length
  ), { completed: 1, total: 2, percentage: 50 })
})

test('simple 50/100 remains 50 percent', () => {
  assert.equal(summarizeProjectProgress({ status: 'in_progress' }, [simple(50, 100)]).percentage, 50)
})

test('composite rows never inflate a mixed project to 90 or 140 percent', () => {
  const mixed50 = summarizeProjectProgress({ status: 'in_progress' }, [simple(50, 100), composite(40)])
  const mixed100 = summarizeProjectProgress({ status: 'in_progress' }, [simple(100, 100), composite(40)])
  assert.equal(mixed50.mode, 'descriptive')
  assert.equal(mixed50.percentage, null)
  assert.equal(mixed50.quantifiableCurrent, 50)
  assert.equal(mixed50.unquantifiableCurrent, 40)
  assert.equal(mixed100.percentage, null)
})

test('actions do not prevent a simple project percentage', () => {
  const result = summarizeProjectProgress({ status: 'in_progress' }, [simple(50, 100), action(1)])
  assert.equal(result.percentage, 50)
  assert.equal(result.completedSections, 1)
})

test('a completed composite remains descriptive until project completion', () => {
  const result = summarizeProjectProgress({ status: 'in_progress' }, [simple(50, 100), composite(40, 1)])
  assert.equal(result.percentage, null)
  assert.equal(result.completedSections, 1)
})

test('explicit project completion is always 100 percent', () => {
  assert.equal(summarizeProjectProgress({ status: 'completed' }, [simple(50, 100), composite(40), action(1)]).percentage, 100)
})

test('composite activity remains counted separately', () => {
  assert.equal(summarizeProjectProgress({ status: 'in_progress' }, [composite(40)]).unquantifiableCurrent, 40)
})

test('rows and centimetres are never added into one percentage or one summary value', () => {
  const result = summarizeProjectProgress({ status: 'in_progress' }, [
    simple(50, 100, 'rows'),
    simple(5, 10, 'cm'),
    composite(12, 0, 'rows'),
    composite(3.5, 0, 'cm'),
  ])

  assert.equal(result.mode, 'descriptive')
  assert.equal(result.percentage, null)
  assert.deepEqual(result.quantifiableByUnit, [
    { unit: 'rows', current: 50, total: 100 },
    { unit: 'cm', current: 5, total: 10 },
  ])
  assert.deepEqual(result.unquantifiableByUnit, [
    { unit: 'rows', current: 12, total: 0 },
    { unit: 'cm', current: 3.5, total: 0 },
  ])
})
