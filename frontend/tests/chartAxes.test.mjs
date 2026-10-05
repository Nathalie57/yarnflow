import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { descendingChartAxisLabels, meaningfulChartName, shouldShowChartAxes } from '../src/utils/chartAxes.js'

test('twenty stitches are numbered from 20 on the left to 1 on the right', () => {
  const labels = descendingChartAxisLabels(20)
  assert.equal(labels[0], 20)
  assert.deepEqual(labels.slice(-3), [3, 2, 1])
})

test('nineteen rows are numbered from 19 at the top to 1 at the bottom', () => {
  const labels = descendingChartAxisLabels(19)
  assert.equal(labels[0], 19)
  assert.deepEqual(labels.slice(-3), [3, 2, 1])
})

test('chart axes use the existing eight-pixel visibility threshold', () => {
  assert.equal(shouldShowChartAxes(7), false)
  assert.equal(shouldShowChartAxes(8), true)
})

test('empty or default chart names do not create an unnecessary title line', () => {
  assert.equal(meaningfulChartName(''), null)
  assert.equal(meaningfulChartName('  Diagramme  '), null)
  assert.equal(meaningfulChartName('Chart'), null)
  assert.equal(meaningfulChartName('Motif jacquard'), 'Motif jacquard')
})

test('designer and progress view share the same axis components', () => {
  const designer = readFileSync(new URL('../src/components/tools/ChartDesigner.jsx', import.meta.url), 'utf8')
  const progressView = readFileSync(new URL('../src/components/ChartProgressView.jsx', import.meta.url), 'utf8')

  for (const source of [designer, progressView]) {
    assert.match(source, /ChartColumnLabels/)
    assert.match(source, /ChartRowLabels/)
  }
})

test('the progress view keeps the current-row highlight driven by canvasRow', () => {
  const progressView = readFileSync(new URL('../src/components/ChartProgressView.jsx', import.meta.url), 'utf8')
  assert.match(progressView, /const y = progress\.canvasRow \* cellPx/)
  assert.match(progressView, /ctx\.fillRect\(0, y, width \* cellPx, cellPx\)/)
  assert.match(progressView, /ctx\.strokeRect\(1, y \+ 1, width \* cellPx - 2/)
  assert.match(progressView, /activeLabel=\{progress\.status === 'active' \? progress\.activeLine : null\}/)
})
