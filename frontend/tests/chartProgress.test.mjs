import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import {
  chartsForSection,
  getChartProgress,
  selectedChartIdForSection,
  shouldExpandChart,
} from '../src/utils/chartProgress.js'

test('current_row 0 and start_row 0 point to row 1 at the bottom of the canvas', () => {
  assert.deepEqual(getChartProgress(0, 0, 8), {
    status: 'active',
    activeLine: 1,
    canvasRow: 7,
  })
})

test('no row is active before start_row', () => {
  assert.deepEqual(getChartProgress(4, 5, 8), {
    status: 'before',
    activeLine: null,
    canvasRow: null,
  })
})

test('the exact chart start points to row 1', () => {
  assert.equal(getChartProgress(5, 5, 8).activeLine, 1)
})

test('increment and decrement move the active row in both directions', () => {
  const initial = getChartProgress(5, 5, 8)
  const incremented = getChartProgress(6, 5, 8)
  const decremented = getChartProgress(5, 5, 8)

  assert.equal(initial.activeLine, 1)
  assert.equal(incremented.activeLine, 2)
  assert.equal(incremented.canvasRow, 6)
  assert.deepEqual(decremented, initial)
})

test('the last line is active until every chart row is completed', () => {
  const last = getChartProgress(12, 5, 8)
  assert.equal(last.status, 'active')
  assert.equal(last.activeLine, 8)
  assert.equal(last.canvasRow, 0)

  assert.deepEqual(getChartProgress(13, 5, 8), {
    status: 'completed',
    activeLine: null,
    canvasRow: null,
  })
})

test('row 1 is mapped to the bottom and the last row to the top', () => {
  assert.equal(getChartProgress(0, 0, 10).canvasRow, 9)
  assert.equal(getChartProgress(9, 0, 10).canvasRow, 0)
})

test('changing section only exposes charts for the new active section', () => {
  const charts = [
    { id: 10, section_id: 1, name: 'Body' },
    { id: 11, section_id: 2, name: 'Sleeve' },
  ]
  assert.deepEqual(chartsForSection(charts, 1).map(chart => chart.id), [10])
  assert.deepEqual(chartsForSection(charts, 2).map(chart => chart.id), [11])
})

test('centimetre sections never receive synchronized charts', () => {
  assert.deepEqual(chartsForSection([{ id: 10, section_id: 1 }], 1, 'cm'), [])
  assert.equal(getChartProgress(2, 0, 8, 'cm').status, 'unsupported')
})

test('multiple charts remain selectable by name instead of being merged', () => {
  const charts = [
    { id: 10, section_id: 1, name: 'Motif A' },
    { id: 12, section_id: 1, name: 'Motif B' },
  ]
  const sectionCharts = chartsForSection(charts, 1)
  assert.equal(sectionCharts.length, 2)
  assert.equal(selectedChartIdForSection(sectionCharts), 10)
  assert.equal(selectedChartIdForSection(sectionCharts, 12), 12)
})

test('normal view is compact, work mode opens the chart, and a completed chart stays folded', () => {
  assert.equal(shouldExpandChart('compact', 'active'), false)
  assert.equal(shouldExpandChart('work', 'before'), true)
  assert.equal(shouldExpandChart('work', 'active'), true)
  assert.equal(shouldExpandChart('work', 'completed'), false)
})

test('the counter integration never writes progression through a chart endpoint', () => {
  const projectCounter = readFileSync(new URL('../src/pages/ProjectCounter.jsx', import.meta.url), 'utf8')
  const progressView = readFileSync(new URL('../src/components/ChartProgressView.jsx', import.meta.url), 'utf8')

  assert.doesNotMatch(projectCounter, /api\.put\([^\n]*\/charts\//)
  assert.doesNotMatch(progressView, /\bapi\.|\bfetch\s*\(/)
  assert.match(projectCounter, /activeSectionCharts\.length > 1/)
  assert.match(projectCounter, /<select/)
  assert.match(projectCounter, /mode=\{isFocusMode \? 'work' : 'compact'\}/)

  const chartLoader = projectCounter.slice(
    projectCounter.indexOf('const requestKey = String(projectId)'),
    projectCounter.indexOf('setProxyError(null)')
  )
  assert.doesNotMatch(chartLoader, /isFocusMode|currentRow/)

  const chartPanelPosition = projectCounter.indexOf('hasJacquardAccess && currentSectionId')
  const primaryControlsPosition = projectCounter.indexOf('Mobile: 2 lignes')
  const followingWorkModeActionsPosition = projectCounter.indexOf("t('ui.startWorkMode')", chartPanelPosition)
  assert.ok(primaryControlsPosition > 0 && primaryControlsPosition < chartPanelPosition)
  assert.ok(chartPanelPosition < followingWorkModeActionsPosition)
  assert.doesNotMatch(projectCounter, /sectionName=\{/)
})
