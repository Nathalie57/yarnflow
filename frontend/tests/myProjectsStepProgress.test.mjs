import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'

const source = readFileSync(new URL('../src/pages/MyProjects.jsx', import.meta.url), 'utf8')
const fr = JSON.parse(readFileSync(new URL('../src/i18n/locales/fr/projects.json', import.meta.url), 'utf8'))
const en = JSON.parse(readFileSync(new URL('../src/i18n/locales/en/projects.json', import.meta.url), 'utf8'))

test('project cards render a thin step-completion bar from explicit aggregate counts', () => {
  assert.doesNotThrow(() => parse(source, { sourceType: 'module', plugins: ['jsx'] }))
  const blockStart = source.indexOf('const stepProgress = completedStepsProgress(')
  const blockEnd = source.indexOf('{/* Actions */}', blockStart)
  const block = source.slice(blockStart, blockEnd)

  assert.ok(blockStart > -1)
  assert.match(block, /project\.completed_sections_count, project\.sections_count/)
  assert.match(block, /ui\.stepsCompleted/)
  assert.match(block, /role="progressbar"/)
  assert.match(block, /h-1\.5/)
  assert.doesNotMatch(block, /completion_percentage|current_row|quantifiable|unitRows|unitRounds|unitCm/)
})

test('project step labels use step vocabulary with singular and plural translations', () => {
  assert.equal(fr.ui.stepsCompleted_one, '{{count}} étape terminée sur {{total}}')
  assert.equal(fr.ui.stepsCompleted_other, '{{count}} étapes terminées sur {{total}}')
  assert.equal(en.ui.stepsCompleted_one, '{{count}} step completed out of {{total}}')
  assert.equal(en.ui.stepsCompleted_other, '{{count}} steps completed out of {{total}}')
})
