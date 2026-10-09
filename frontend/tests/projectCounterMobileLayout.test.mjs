import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { parse } from '@babel/parser'

const source = readFileSync(new URL('../src/pages/ProjectCounter.jsx', import.meta.url), 'utf8')
const fr = JSON.parse(readFileSync(new URL('../src/i18n/locales/fr/counter.json', import.meta.url), 'utf8'))
const en = JSON.parse(readFileSync(new URL('../src/i18n/locales/en/counter.json', import.meta.url), 'utf8'))

test('ProjectCounter remains valid JSX after the compact mobile composition', () => {
  assert.doesNotThrow(() => parse(source, { sourceType: 'module', plugins: ['jsx'] }))
})

test('compact progress is initialized only after the production progress data', () => {
  const progressDataIndex = source.indexOf('const progressData = getSectionProgressData()')
  const compactProgressIndex = source.indexOf('const hasNextPatternRow = Boolean(')

  assert.ok(progressDataIndex > -1)
  assert.ok(compactProgressIndex > progressDataIndex)
})

test('mobile progress combines next pattern row and remaining work without a mascot', () => {
  const compactStart = source.indexOf('{(hasNextPatternRow || remainingProgress !== null)')
  const compactEnd = source.indexOf('{isDemoProject && demoGuideStep', compactStart)
  const compact = source.slice(compactStart, compactEnd)

  assert.ok(compactStart > -1)
  assert.match(compact, /sm:hidden flex flex-wrap/)
  assert.match(compact, /ui\.patternRowOfTotal/)
  assert.match(compact, /ui\.flowCmLeft/)
  assert.doesNotMatch(compact, /FlowMascot/)
  assert.match(compact, /ui\.patternRoundOfTotal/)
  assert.match(compact, /ui\.patternRowNumber/)
  assert.equal(fr.ui.patternRowOfTotal, 'Rang {{current}} sur {{total}}')
  assert.equal(fr.ui.patternRoundOfTotal, 'Tour {{current}} sur {{total}}')
  assert.equal(en.ui.patternRowOfTotal, 'Row {{current}} of {{total}}')
  assert.equal(en.ui.patternRoundOfTotal, 'Round {{current}} of {{total}}')
})

test('leaving work mode only changes presentation and keeps the active session', () => {
  const toggleStart = source.indexOf('onClick={() => setFocusModeDismissed(v => !v)}')
  const toggleArea = source.slice(toggleStart, toggleStart + 350)

  assert.ok(toggleStart > -1)
  assert.doesNotMatch(toggleArea, /handleEndSession|setIsTimerRunning|setSessionId/)
  assert.match(source, /const isFocusMode = isTimerRunning && !focusModeDismissed/)
  assert.match(source, /Boolean\(sessionId && isTimerRunning\)/)
})

test('mobile timer keeps session and project total as the only primary durations', () => {
  assert.match(source, /formatTime\(elapsedTime\)[\s\S]+ui\.session/)
  assert.match(source, /formatTime\(projectTimeIncludingActiveSession\)[\s\S]+ui\.projectTotalTime/)
  assert.match(source, /hidden sm:block text-center border-l[^>]*>[\s\S]+currentSection\.time_formatted/)
})

test('secondary counters use one management disclosure and stay expanded in work mode', () => {
  assert.match(source, /onClick=\{\(\) => setShowSecondaryCountersExpanded\(value => !value\)\}/)
  assert.match(source, /ui\.secondaryCountersFoldedSummary/)
  assert.match(source, /ui\.manageSecondaryCounters/)
  assert.match(source, /\(isFocusMode \|\| showSecondaryCountersExpanded\) && secondaryCounters\.map/)
  assert.match(source, /!isFocusMode && showSecondaryCountersExpanded && \(isAddingCounter/)
  assert.equal(fr.ui.manageSecondaryCounters, 'Gérer')
  assert.equal(en.ui.manageSecondaryCounters, 'Manage')
  assert.match(source, /min-w-0 flex-1 break-words pr-2 text-xs font-semibold/)
  assert.match(source, /w-11 h-11 sm:w-8 sm:h-8 bg-gray-100/)
  assert.match(source, /w-10 h-10 sm:w-6 sm:h-6 flex items-center/)
})

test('mobile Flow access is compact while desktop keeps the mascot', () => {
  assert.match(source, /FlowMascot pose="content" size=\{24\} className="hidden sm:block/)
  assert.match(source, /FlowMascot pose="content" size=\{26\} className="hidden sm:block/)
})
