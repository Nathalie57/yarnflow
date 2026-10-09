import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { parse } from '@babel/parser'
import { transform } from 'sucrase'
import * as journey from '../src/utils/projectJourney.js'

const source = readFileSync(new URL('../src/pages/ProjectCounter.jsx', import.meta.url), 'utf8')
const navbarSource = readFileSync(new URL('../src/components/Navbar.jsx', import.meta.url), 'utf8')
const component = parse(source, { sourceType: 'module', plugins: ['jsx'] }).program.body
  .find(node => node.type === 'VariableDeclaration' && node.declarations[0].id.name === 'ProjectCounter').declarations[0].init
// Execute production handlers with state/API doubles; no copied transition implementation.
function handler(name, context) {
  const declaration = component.body.body.flatMap(node => node.declarations || []).find(node => node.id.name === name)
  assert.ok(declaration, name)
  return vm.runInNewContext(`(${source.slice(declaration.init.start, declaration.init.end)})`, context)
}
const section = (id, order, extra = {}) => ({ id, display_order: order, name: `Step ${id}`, description: 'Instructions', current_row: 3, total_rows: 4, counter_unit: 'rows', progression_type: 'simple', is_completed: 0, ...extra })

test('pattern range respects the explicit start row and optional section target', () => {
  assert.deepEqual(journey.patternProgressRange(1, 0, 38), { current: 1, total: 38 })
  assert.deepEqual(journey.patternProgressRange(5, 0, 38), { current: 5, total: 42 })
  assert.deepEqual(journey.patternProgressRange(12, 2, null), { current: 14, total: null })
  assert.equal(journey.patternProgressRange(null, 2, 4), null)
})

function environment(items = [section(1, 1), section(2, 2)]) {
  const database = structuredClone(items), calls = [], storage = new Map(), errors = []
  const env = {
    ...journey, isDiscreteCounterUnit: unit => unit === 'rows' || unit === 'rounds', sections: structuredClone(items), currentSectionId: items[0]?.id ?? null,
    expandedSections: new Set(),
    activeProjectSection: items[0] || null, currentRow: items[0]?.current_row ?? 3,
    project: { id: 7, name: 'Project', current_section_id: items[0]?.id ?? null, status: 'in_progress', has_ai_pattern_reference: true },
    projectId: 7, counterUnit: items[0]?.counter_unit || 'rows', counterIncrement: 1,
    isActionSection: items[0]?.progression_type === 'action', isDemoProject: false,
    isFocusMode: false, focusModeDismissed: false,
    isTimerRunning: false, sessionId: null, sessionStartRow: 0,
    showOnboarding: false, smartOnboardingPhase: null, smartOnboardingBlocking: false, secondaryCounters: [], reminders: [],
    changingSectionRef: { current: false }, completingSectionRef: { current: false },
    isSavingRowRef: { current: false }, isEndingSessionRef: { current: false }, counterSaveTimers: { current: {} },
    pendingRowsRef: { current: [] }, progressData: { total: 4 },
    sectionsCollapsed: true,
    sectionsListRef: { current: { scrollIntoView: (...args) => calls.push(['scroll-sections', ...args]) } },
    sectionsListScrollPendingRef: { current: false },
    requestAnimationFrame: callback => callback(),
    localStorage: { getItem: key => storage.get(key) ?? null, setItem: (key, value) => storage.set(key, value), removeItem: key => storage.delete(key) },
    window: { dispatchEvent() {} }, Event: class {}, clearTimeout() {},
    console: { error: (...args) => errors.push(args), log() {} },
    t: key => key, showAlert: alert => calls.push(['alert', alert]),
    getExactDuration: () => 90,
    requestWakeLock: async () => calls.push(['request-wake-lock']),
    triggerOnce: key => calls.push(['trigger-once', key]),
    fetchSecondaryCounters: async id => calls.push(['secondary', id]),
    handleEndSession: async (...args) => calls.push(['end-session', ...args]),
    releaseWakeLock: async () => calls.push(['release-wake-lock']),
    setShowProjectCompletionModal: value => calls.push(['finish-modal', value]),
    openWithProject: (...args) => calls.push(['flow', ...args]),
  }
  const setters = [...new Set(source.match(/\bset[A-Z]\w*/g))]
  for (const setter of setters) {
    if (env[setter]) continue
    const key = setter[3].toLowerCase() + setter.slice(4)
    env[setter] = value => { env[key] = typeof value === 'function' ? value(env[key]) : value; calls.push([setter, env[key]]) }
  }
  env.api = {
    get: async path => { calls.push(['get', path]); return { data: { sections: structuredClone(database) } } },
    put: async (path, data) => {
      calls.push(['put', path, data])
      const match = path.match(/\/sections\/(\d+)$/)
      if (match) Object.assign(database.find(item => item.id === Number(match[1])), data)
      else if (path === '/projects/7') Object.assign(env.project, data)
      return { data: { success: true } }
    },
    post: async (path, data) => {
      calls.push(['post', path, data])
      if (path.endsWith('/sessions/start')) return { data: { success: true, session_id: 501 } }
      const match = path.match(/\/sections\/(\d+)\/complete$/)
      if (match) { const item = database.find(item => item.id === Number(match[1])); item.is_completed = Number(item.is_completed) === 1 ? 0 : 1 }
      if (path.endsWith('/current-section')) env.project.current_section_id = data.section_id
      if (path.endsWith('/rows')) database.find(item => item.id === data.section_id)?.current_row != null && (database.find(item => item.id === data.section_id).current_row = data.row_number)
      return { data: { success: true } }
    },
  }
  env.fetchProject = async () => { env.currentSectionId = env.project.current_section_id; return env.project }
  for (const name of ['fetchSections', 'handleAllSectionsCompleted', 'syncRequiredCounters', 'handleAutomaticSectionCompletion', 'handleChangeSection', 'handleToggleSectionComplete', 'handleIncrementRow', 'handleDecrementRow', 'handleCounterInputSubmit', 'getFlowProjectProgress', 'handleOpenAiHelp', 'toggleSectionExpanded', 'handleToggleSectionsList', 'handleSelectSectionFromList']) env[name] = handler(name, env)
  return { env, calls, database, errors }
}

test('next step follows display_order despite visual sorting and skips completed steps', () => {
  const items = [section(3, 3), section(1, 1), section(2, 2), section(4, 4, { is_completed: '1' })]
  assert.equal(journey.nextJourneySection(items, 1).id, 2)
  assert.equal(journey.nextJourneySection(items.reverse(), 2).id, 3)
  assert.equal(journey.nextJourneySection(items, 99), null)
})

test('completed active section survives refresh; empty projects keep the global counter', async () => {
  const { env } = environment([section(1, 1, { is_completed: '1' }), section(2, 2)])
  assert.equal((await env.fetchSections()).resolvedSectionId, 1)
  assert.equal(journey.resolveJourneySection([], 1), null)
  assert.equal(journey.resolveJourneySection(env.sections, 99, '2'), 2)
})

for (const unit of ['rows', 'cm']) {
  test(`${unit}: reaching target completes without switching section and closes its session`, async () => {
    const { env, calls, errors } = environment([section(1, 1, { counter_unit: unit, current_row: unit === 'cm' ? 3.5 : 3 }), section(2, 2)])
    env.isTimerRunning = true
    env.sessionId = 9
    await env.handleIncrementRow()
    assert.equal(env.currentSectionId, 1)
    assert.equal(env.project.current_section_id, 1)
    assert.equal(Number(env.sections[0].is_completed), 1)
    assert.ok(calls.some(call => call[1]?.endsWith?.('/complete') && call[2].automatic === true))
    assert.ok(!calls.some(call => call[1]?.endsWith?.('/current-section')))
    assert.ok(calls.some(call => call[0] === 'end-session'))
    assert.ok(!calls.some(call => call[0] === 'alert' && call[1]?.type === 'success'))
    assert.deepEqual(errors, [])
  })
  test(`${unit}: incomplete required counter prevents automatic completion`, async () => {
    const { env, calls } = environment([section(1, 1, { counter_unit: unit, current_row: unit === 'cm' ? 3.5 : 3 })])
    env.secondaryCounters = [{ id: 8, tracking_role: 'required_parallel', target: 2, count: 1 }]
    await env.handleIncrementRow()
    assert.ok(!calls.some(call => call[1]?.endsWith?.('/complete')))
    assert.equal(Number(env.sections[0].is_completed), 0)
  })
  test(`${unit}: last section uses existing project completion confirmation`, async () => {
    const { env, calls } = environment([section(1, 1, { counter_unit: unit, current_row: unit === 'cm' ? 3.5 : 3 })])
    env.isTimerRunning = true
    await env.handleIncrementRow()
    assert.ok(calls.some(call => call[0] === 'end-session'))
    assert.ok(calls.some(call => call[0] === 'finish-modal' && call[1] === true))
    assert.equal(env.project.status, 'in_progress')
  })
}

for (const type of ['simple', 'action', 'composite']) {
  test(`${type}: manual completion stays active and reopening preserves recorded measurement`, async () => {
    const { env, calls } = environment([section(1, 1, { progression_type: type, total_rows: null }), section(2, 2)])
    await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })
    assert.equal(env.currentSectionId, 1)
    assert.equal(env.sections[0].is_completed, 1)
    env.project.status = 'completed'
    await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })
    assert.equal(env.sections[0].is_completed, 0)
    assert.equal(env.sections[0].current_row, 3)
    assert.equal(env.project.status, 'in_progress')
    assert.ok(!calls.some(call => call[0] === 'alert' && call[1]?.type === 'success'))
  })
}

test('early completion at 0/8 preserves progress, closes the session and waits for Continue', async () => {
  const { env, calls, database } = environment([
    section(1, 1, { current_row: 0, total_rows: 8, counter_unit: 'rounds' }),
    section(2, 2)
  ])
  env.currentRow = 0
  env.isTimerRunning = true
  env.sessionId = 93

  await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })

  assert.equal(database[0].current_row, 0)
  assert.equal(Number(database[0].is_completed), 1)
  assert.equal(env.currentSectionId, 1)
  assert.equal(env.project.current_section_id, 1)
  assert.ok(calls.some(call => call[0] === 'end-session' && call[1] === 0))
  assert.ok(!calls.some(call => call[1]?.endsWith?.('/current-section')))
  assert.ok(!calls.some(call => call[0] === 'alert' && call[1]?.type === 'success'))

  env.isTimerRunning = false
  env.sessionId = null
  await env.handleChangeSection(2)
  assert.equal(env.currentSectionId, 2)
  assert.equal(env.project.current_section_id, 2)
})

test('an action step can start, pause, resume and end one section-bound session', async () => {
  const { env, calls } = environment([
    section(7, 1, { progression_type: 'action', counter_unit: null, total_rows: null, current_row: 0 })
  ])
  env.counterUnit = null
  env.handleStartSession = handler('handleStartSession', env)
  env.handlePauseSession = handler('handlePauseSession', env)
  env.handleResumeSession = handler('handleResumeSession', env)
  env.handleEndSession = handler('handleEndSession', env)

  await env.handleStartSession()
  assert.equal(env.sessionId, 501)
  assert.equal(env.isTimerRunning, true)
  assert.equal(calls.find(call => call[1]?.endsWith?.('/sessions/start'))[2].section_id, 7)

  env.handlePauseSession()
  assert.equal(env.isTimerPaused, true)
  await env.handleResumeSession()
  assert.equal(env.isTimerPaused, false)
  await env.handleEndSession()

  const endings = calls.filter(call => call[1]?.endsWith?.('/sessions/end'))
  assert.equal(endings.length, 1)
  assert.equal(endings[0][2].session_id, 501)
  assert.equal(endings[0][2].rows_completed, 0)
  assert.equal(endings[0][2].duration, 90)
  assert.equal(env.isTimerRunning, false)
  assert.equal(env.sessionId, null)
})

test('Continue persists the section before local activation and reloads secondary counters and reminders', async () => {
  const { env, calls, errors } = environment([section(1, 1), section(2, 2, { reminders: '[{"row":2}]' })])
  env.isTimerRunning = true; env.sessionId = 9; env.sessionStartRow = 1
  let release
  const original = env.api.post
  env.api.post = async (path, data) => {
    if (path.endsWith('/current-section')) await new Promise(resolve => { release = resolve })
    return original(path, data)
  }
  const pending = env.handleChangeSection(2)
  await new Promise(resolve => setImmediate(resolve))
  assert.equal(env.currentSectionId, 1)
  env.handleOpenAiHelp()
  assert.ok(!calls.some(call => call[0] === 'flow'))
  release(); await pending
  assert.equal(env.currentSectionId, 2)
  assert.equal(env.project.current_section_id, 2)
  const saved = calls.findIndex(call => call[1]?.endsWith?.('/current-section'))
  const activated = calls.findIndex(call => call[0] === 'setCurrentSectionId' && call[1] === 2)
  assert.ok(saved < activated)
  assert.ok(calls.some(call => call[1]?.endsWith?.('/sessions/end') && call[2].duration === 90 && call[2].rows_completed === 2))
  assert.ok(calls.some(call => call[0] === 'secondary' && call[1] === 2))
  assert.equal(env.reminders[0].row, 2)
  env.currentRow = 3; env.progressData = { total: 4 }
  env.handleOpenAiHelp()
  assert.equal(calls.find(call => call[0] === 'flow')[3].sectionName, 'Step 2')
  assert.deepEqual(errors, [])
})

test('opening the existing steps list does not change the active section', () => {
  const { env, calls } = environment()
  env.handleToggleSectionsList()
  assert.equal(env.sectionsCollapsed, false)
  assert.equal(env.sectionsListScrollPendingRef.current, true)
  assert.equal(env.currentSectionId, 1)
  assert.ok(!calls.some(call => call[1]?.endsWith?.('/current-section')))

  env.handleToggleSectionsList()
  assert.equal(env.sectionsCollapsed, true)
})

test('steps remain reachable from work mode without selecting another section', () => {
  const { env, calls } = environment()
  assert.doesNotMatch(source, /\bsetIsFocusMode\b/)
  env.isFocusMode = true
  env.sectionsCollapsed = true
  env.handleToggleSectionsList()
  assert.equal(env.focusModeDismissed, true)
  assert.equal(env.sectionsCollapsed, false)
  assert.equal(env.sectionsListScrollPendingRef.current, true)
  assert.equal(env.currentSectionId, 1)
  assert.ok(!calls.some(call => call[1]?.endsWith?.('/current-section')))
})

test('expanding a mobile step for consultation does not select it', () => {
  const { env, calls } = environment()
  env.toggleSectionExpanded(2, { stopPropagation() {} })
  assert.equal(env.expandedSections.has(2), true)
  assert.equal(env.currentSectionId, 1)
  assert.ok(!calls.some(call => call[1]?.endsWith?.('/current-section')))
})

test('selecting any listed step reuses the persisted section transition', async () => {
  const { env, calls } = environment([
    section(2, 2),
    section(1, 1, { is_completed: 1 }),
  ])
  await env.handleSelectSectionFromList(1, { stopPropagation() {} })
  assert.equal(env.currentSectionId, 1)
  assert.equal(env.project.current_section_id, 1)
  assert.ok(calls.some(call => call[1]?.endsWith?.('/current-section') && call[2].section_id === 1))
})

test('failed section persistence keeps old active section', async () => {
  const { env } = environment()
  env.api.post = async path => { if (path.endsWith('/current-section')) throw Error('save failed'); return { data: {} } }
  await env.handleChangeSection(2)
  assert.equal(env.currentSectionId, 1)
  assert.equal(env.project.current_section_id, 1)
  assert.equal(env.changingSectionRef.current, false)
})

test('manual completion never fabricates the recorded measurement', () => {
  const { env } = environment([section(1, 1, { is_completed: 1, current_row: 2, total_rows: 4 })])
  const progress = handler('getSectionProgressData', env)()
  assert.equal(progress.current, 2)
  assert.equal(progress.total, 4)
})

for (const unit of ['rows', 'cm']) {
  test(`${unit}: project without sections retains global completion behavior`, async () => {
    const { env, calls, errors } = environment([])
    env.counterUnit = unit; env.counterIncrement = unit === 'cm' ? 0.5 : 1
    env.currentRow = unit === 'cm' ? 3.5 : 3; env.project.total_rows = 4
    await env.handleIncrementRow()
    assert.equal(env.currentRow, 4)
    assert.equal(env.project.status, 'completed')
    assert.ok(!calls.some(call => call[1]?.includes?.('/sections/')))
    assert.deepEqual(errors, [])
  })
}

test('required cycle counters still synchronize before automatic completion', async () => {
  const { env, calls } = environment()
  env.secondaryCounters = [{ id: 8, count: 1, target: 2, tracking_role: 'required_cycle', cycle_length: 2 }]
  await env.handleIncrementRow()
  const counter = calls.findIndex(call => call[1]?.endsWith?.('/secondary-counters/8'))
  const completion = calls.findIndex(call => call[1]?.endsWith?.('/complete'))
  assert.ok(counter >= 0 && counter < completion)
  assert.equal(env.secondaryCounters[0].count, 2)
})

test('actions cannot increment, and composite tracking does not infer completion', async () => {
  const action = environment([section(1, 1, { progression_type: 'action', total_rows: null })])
  await action.env.handleIncrementRow()
  assert.equal(action.calls.length, 0)
  const composite = environment([section(1, 1, { progression_type: 'composite', total_rows: null })])
  await composite.env.handleIncrementRow()
  assert.equal(composite.env.currentRow, 4)
  assert.ok(!composite.calls.some(call => call[1]?.endsWith?.('/complete')))
})

test('unitless composite has no numeric counter and completes manually before explicit transition', async () => {
  const items = [section(1, 1, { progression_type: 'composite', counter_unit: null, total_rows: null, current_row: 0 }), section(2, 2, { reminders: '[{"row":2}]' })]
  const { env, calls, database } = environment(items)
  env.counterUnit = null
  assert.equal(journey.sectionHasNumericCounter(env.sections[0]), false)
  await env.handleIncrementRow()
  env.counterInputValue = '12'
  await env.handleCounterInputSubmit()
  await env.handleDecrementRow()
  assert.equal(database[0].current_row, 0)
  assert.ok(!calls.some(call => call[1]?.endsWith?.('/rows') || call[0] === 'put'))
  await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })
  assert.equal(database[0].is_completed, 1)
  assert.equal(env.currentSectionId, 1)
  env.isTimerRunning = true; env.sessionId = 12; env.sessionStartRow = 0
  await env.handleChangeSection(2)
  assert.equal(env.project.current_section_id, 2)
  assert.equal(env.currentSectionId, 2)
  assert.ok(calls.some(call => call[1]?.endsWith?.('/sessions/end')))
  assert.equal(env.reminders[0].row, 2)
})

test('composites with an explicit unit keep numeric free tracking', () => {
  assert.equal(journey.sectionHasNumericCounter(section(1, 1, { progression_type: 'composite', counter_unit: 'rows' })), true)
  assert.equal(journey.sectionHasNumericCounter(section(1, 1, { progression_type: 'composite', counter_unit: 'cm' })), true)
})

test('project screen gates every primary counter layout behind the numeric-counter invariant', () => {
  assert.ok(source.includes("{hasPrimaryCounter && <div ref={primaryCounterRef}"))
  assert.ok(source.includes('{hasPrimaryCounter && <div ref={primaryCounterRef} className="flex items-center gap-2 min-w-0">'))
  assert.ok(source.includes('{hasPrimaryCounter && <div className="hidden sm:flex items-center gap-2 flex-shrink-0">'))
  assert.ok(source.includes("'ui.unitlessCompositeTracking'"))
  assert.ok(source.includes('showCompactWorkCounter && hasPrimaryCounter'))
})

test('timer controls remain rendered for action and unitless steps without a numeric counter', () => {
  assert.ok(source.includes("t(isActionSection ? 'ui.timerOnlyTracking' : 'ui.unitlessCompositeTracking')"))
  assert.ok(source.includes("project.status !== 'completed' && ("))
  assert.ok(!source.includes("project.status !== 'completed' && !isActionSection"))
  assert.ok(source.includes('{hasPrimaryCounter && <div ref={primaryCounterRef}'))
})

test('mobile counter relay is reserved for work mode and reuses the existing handlers', () => {
  assert.ok(source.includes('setShowCompactWorkCounter(!entry.isIntersecting)'))
  assert.ok(source.includes('{isFocusMode && showCompactWorkCounter && hasPrimaryCounter && !smartOnboardingBlocking && ('))
  assert.ok(source.includes("style={{ top: 'var(--yf-navbar-height, calc(4rem + env(safe-area-inset-top)))' }}"))
  assert.ok(source.includes('rootMargin: `-${mobileNavbarHeight}px 0px 0px 0px`'))
  assert.ok(!source.includes("style={{ bottom: 'calc(68px + env(safe-area-inset-bottom))' }}"))
  assert.ok(source.includes('onClick={handleDecrementRow}'))
  assert.ok(source.includes('onClick={handleIncrementRow}'))
})

test('navbar publishes its rendered safe-area-aware height for sticky project controls', () => {
  assert.ok(navbarSource.includes('data-yf-navbar'))
  assert.ok(navbarSource.includes("paddingTop: 'env(safe-area-inset-top)'"))
  assert.ok(navbarSource.includes("style.setProperty('--yf-navbar-height'"))
  assert.ok(navbarSource.includes("new ResizeObserver(updateHeight)"))
  assert.ok(navbarSource.includes("new CustomEvent('yf:navbar-resized'"))
})

test('notes shortcut stays out of work mode instead of stacking over the counter', () => {
  assert.ok(source.includes('{canShowNotesShortcut && ('))
  assert.ok(source.includes('&& !smartOnboardingBlocking && !isFocusMode'))
  assert.ok(!source.includes('absolute right-2 bottom-full'))
})

test('guided work precedes global project statistics and keeps one compact steps access', () => {
  const stepsAccess = source.indexOf("t('ui.viewProjectSteps'")
  const currentStep = source.indexOf('<ProjectCurrentStep')
  const overview = source.indexOf("t('ui.projectOverview')")
  assert.ok(stepsAccess > 0 && stepsAccess < currentStep)
  assert.ok(currentStep < overview)
  assert.ok(source.includes('<details className="sm:hidden bg-white rounded-control border border-gray-200'))
  assert.ok(source.includes("t('ui.finishWholeProject')"))
  assert.ok(!source.slice(stepsAccess - 700, currentStep).includes("t('ui.projectSteps')"))
  assert.ok(source.includes('{isFocusMode && showCompactWorkCounter && hasPrimaryCounter && !smartOnboardingBlocking && ('))
})

test('mobile work mode starts above steps and scrolls the existing counter into view', () => {
  const topWorkMode = source.indexOf("smartOnboardingPhase !== 'workModeIntro'")
  const stepsAccess = source.indexOf("t('ui.viewProjectSteps'")
  assert.ok(topWorkMode > 0 && topWorkMode < stepsAccess)
  assert.ok(source.includes('onClick={handleStartSession}'))
  assert.ok(source.includes("className=\"sm:hidden mb-3 w-full"))
  assert.ok(source.includes("primaryCounterRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })"))
  assert.ok(source.includes('prioritizeControls={isFocusMode}'))
})

test('cm cap handles both 16.5 + 1.5 and an increment beyond 18 exactly', () => {
  const step = section(1, 1, { counter_unit: 'cm', total_rows: 18 })
  assert.equal(journey.cappedSectionProgress(step, 16.5 + 1.5), 18)
  assert.equal(journey.cappedSectionProgress(step, 17 + 1.5), 18)
})

test('cm: last increment is capped and completes without changing the active section', async () => {
  const { env, database, errors } = environment([section(1, 1, { counter_unit: 'cm', current_row: 17.8, total_rows: 18 }), section(2, 2)])
  await env.handleIncrementRow()
  assert.equal(env.currentRow, 18)
  assert.equal(database[0].current_row, 18)
  assert.equal(database[0].is_completed, 1)
  assert.equal(env.project.current_section_id, 1)
  assert.deepEqual(errors, [])
})

test('rows: 3/4 finishes at 4/4; another attempt never records a fifth row', async () => {
  const { env, calls, database } = environment()
  await env.handleIncrementRow()
  env.activeProjectSection = env.sections[0] // next React render
  await env.handleIncrementRow()
  assert.equal(database[0].current_row, 4)
  assert.equal(database[0].is_completed, 1)
  assert.equal(calls.filter(call => call[1]?.endsWith?.('/rows')).length, 1)
})

test('rounds: 3/4 uses the discrete row history and finishes at 4/4', async () => {
  const { env, calls, database } = environment([section(1, 1, { counter_unit: 'rounds' })])
  await env.handleIncrementRow()
  env.activeProjectSection = env.sections[0]
  await env.handleIncrementRow()
  assert.equal(database[0].current_row, 4)
  assert.equal(database[0].is_completed, 1)
  assert.equal(calls.filter(call => call[1]?.endsWith?.('/rows')).length, 1)
  assert.equal(env.getFlowProjectProgress().unit, 'rounds')
})

test('37/38 with the nineteenth required cycle completes, stops timing at 38, then continues explicitly', async () => {
  const { env, calls, database } = environment([
    section(1, 1, { name: 'Augmentations du haut du corps', current_row: 37, total_rows: 38 }),
    section(2, 2, { name: 'Séparation du corps et des manches', current_row: 0, total_rows: null, progression_type: 'action' })
  ])
  env.currentRow = 37
  env.isTimerRunning = true
  env.sessionId = 91
  env.sessionStartRow = 0
  env.secondaryCounters = [{ id: 8, tracking_role: 'required_cycle', target: 19, count: 18, cycle_length: 2 }]

  await env.handleIncrementRow()
  assert.equal(database[0].current_row, 38)
  assert.equal(Number(database[0].is_completed), 1)
  assert.ok(calls.some(call => call[0] === 'end-session' && call[1] === 38))
  assert.ok(calls.some(call => typeof call[1] === 'string' && call[1].includes('/secondary-counters/8') && call[2]?.count === 19))

  // React applique ensuite l'arrêt de session avant que la transition soit cliquable.
  env.isTimerRunning = false
  env.sessionId = null
  await env.handleChangeSection(2)
  assert.equal(env.currentSectionId, 2)
  assert.equal(env.project.current_section_id, 2)
})

test('ending a completed step records the final increment instead of the stale rendered row', async () => {
  const { env, calls } = environment([section(1, 1, { current_row: 38, total_rows: 38 })])
  env.currentRow = 37
  env.sessionStartRow = 1
  env.sessionId = 91
  env.isTimerRunning = true
  await handler('handleEndSession', env)(38)
  const request = calls.find(call => call[1]?.endsWith?.('/sessions/end'))
  assert.equal(request[2].rows_completed, 37)
  assert.equal(env.isTimerRunning, false)
  assert.ok(calls.some(call => call[0] === 'release-wake-lock'))
})

test('manual completion of an unbounded active step also closes its section session', async () => {
  const { env, calls } = environment([section(1, 1, { total_rows: null, progression_type: 'composite', current_row: 6 }), section(2, 2)])
  env.isTimerRunning = true
  env.sessionId = 92
  env.currentRow = 6
  await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })
  assert.ok(calls.some(call => call[0] === 'end-session' && call[1] === 6))
})

test('completed row targets never announce a next pattern row beyond the section', () => {
  assert.ok(source.includes('&& !sectionIsCompleted(activeProjectSection)'))
  assert.ok(source.includes('(progressData.total == null || Number(currentRow) < Number(progressData.total))'))
})

for (const unit of ['cm', 'rows']) {
  test(`${unit}: direct input is capped and finishes the section`, async () => {
    const { env, database } = environment([section(1, 1, { counter_unit: unit, current_row: unit === 'cm' ? 16.5 : 3, total_rows: unit === 'cm' ? 18 : 4 }), section(2, 2)])
    env.counterInputValue = unit === 'cm' ? '19.5' : '5'
    await env.handleCounterInputSubmit()
    assert.equal(env.currentRow, unit === 'cm' ? 18 : 4)
    assert.equal(database[0].current_row, unit === 'cm' ? 18 : 4)
    assert.equal(database[0].is_completed, 1)
    assert.equal(env.currentSectionId, 1)
  })
  test(`${unit}: required counters keep the section open at the capped target, then permit completion`, async () => {
    const { env, database, calls } = environment([section(1, 1, { counter_unit: unit, current_row: unit === 'cm' ? 3.8 : 3 }), section(2, 2)])
    env.secondaryCounters = [{ id: 8, tracking_role: 'required_parallel', target: 2, count: 1 }]
    await env.handleIncrementRow()
    assert.equal(database[0].current_row, 4)
    assert.equal(database[0].is_completed, 0)
    const writesBefore = calls.filter(call => call[0] === 'put' || call[1]?.endsWith?.('/rows')).length
    await env.handleIncrementRow()
    assert.equal(database[0].current_row, 4)
    assert.equal(database[0].is_completed, 0)
    env.secondaryCounters[0].count = 2
    await env.handleIncrementRow()
    assert.equal(database[0].is_completed, 1)
    assert.equal(calls.filter(call => call[0] === 'put' || call[1]?.endsWith?.('/rows')).length, writesBefore)
  })
}

test('direct input respects required counters, while unbounded and composite sections remain free', async () => {
  const required = environment()
  required.env.secondaryCounters = [{ id: 8, tracking_role: 'required_parallel', target: 2, count: 0 }]
  required.env.counterInputValue = '6'
  await required.env.handleCounterInputSubmit()
  assert.equal(required.database[0].current_row, 4)
  assert.equal(required.database[0].is_completed, 0)
  for (const step of [section(1, 1, { total_rows: null }), section(1, 1, { progression_type: 'composite', total_rows: 4 })]) {
    const { env, database } = environment([step])
    env.counterInputValue = '5'
    await env.handleCounterInputSubmit()
    await env.handleIncrementRow()
    assert.equal(database[0].current_row, 6)
    assert.equal(database[0].is_completed, 0)
  }
})

test('reopened section at its target can complete without adding a row', async () => {
  const { env, calls, database } = environment([section(1, 1, { current_row: 4, is_completed: 1 }), section(2, 2)])
  await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })
  env.activeProjectSection = env.sections[0]
  await env.handleIncrementRow()
  assert.equal(database[0].current_row, 4)
  assert.equal(database[0].is_completed, 1)
  assert.ok(!calls.some(call => call[1]?.endsWith?.('/rows')))
})

test('historical over-target measurements survive load, reopening, plus and unchanged input', async () => {
  const { env, database, calls } = environment([section(1, 1, { counter_unit: 'cm', current_row: 19, total_rows: 18, is_completed: 1 }), section(2, 2)])
  await env.fetchSections()
  await env.handleToggleSectionComplete(env.sections[0], { stopPropagation() {} })
  env.activeProjectSection = env.sections[0]
  await env.handleIncrementRow()
  env.counterInputValue = '19'
  await env.handleCounterInputSubmit()
  assert.equal(database[0].current_row, 19)
  assert.equal(env.currentRow, 19)
  assert.equal(database[0].is_completed, 0)
  assert.ok(!calls.some(call => call[0] === 'put'))
  env.counterInputValue = '17.5' // explicit user correction
  await env.handleCounterInputSubmit()
  assert.equal(database[0].current_row, 17.5)
})

test('opening and submitting a historical decimal must not round it down silently', async () => {
  const { env, database, calls } = environment([section(1, 1, { counter_unit: 'cm', current_row: 18.2, total_rows: 18 })])
  env.counterInputValue = '18.2'
  await env.handleCounterInputSubmit()
  assert.equal(database[0].current_row, 18.2)
  assert.equal(env.currentRow, 18.2)
  assert.ok(!calls.some(call => call[0] === 'put'))
})

test('Smart Creation resume keeps its existing selection and initialization paths', async () => {
  const { env } = environment([section(1, 1), section(2, 2, { progression_type: 'composite', total_rows: null })])
  await handler('handleSmartOnboardingPickSection', env)(env.sections[1])
  assert.equal(env.currentSectionId, 2)
  assert.equal(env.project.current_section_id, 2)
  assert.equal(env.smartOnboardingPhase, 'workModeIntro')
  await handler('handleSmartOnboardingPickSection', env)(env.sections[0])
  assert.equal(env.smartOnboardingPhase, 'setProgress')
  env.smartOnboardingRowValue = '2'
  await handler('handleSmartOnboardingFinishResume', env)()
  assert.equal(env.project.current_section_id, 1)
  assert.equal(env.sections[0].current_row, 2)
  assert.equal(env.smartOnboardingPhase, 'workModeIntro')
})

const react = { createElement: (type, props, ...children) => ({ type, props: { ...props, children } }), Fragment: 'fragment' }
const module = { exports: {} }
vm.runInNewContext(transform(readFileSync(new URL('../src/components/ProjectCurrentStep.jsx', import.meta.url), 'utf8'), { transforms: ['jsx', 'imports'], production: true }).code,
  { module, exports: module.exports, React: react, require: () => journey })
function nodes(tree) { return !tree || typeof tree !== 'object' ? [] : Array.isArray(tree) ? tree.flatMap(nodes) : [tree, ...nodes(tree.props?.children)] }
function renderedText(tree) {
  if (tree == null || typeof tree === 'boolean') return ''
  if (typeof tree !== 'object') return String(tree)
  return (Array.isArray(tree) ? tree.map(renderedText).join('') : renderedText(tree.props?.children))
}

test('counter presents current / target and unit clearly, including decimal cm', () => {
  const render = module.exports.CurrentStepProgress
  assert.equal(renderedText(render({ current: 9, total: 18, unit: 'cm', unitLabel: 'cm', locale: 'fr' })).trim(), '9 / 18 cm')
  assert.equal(renderedText(render({ current: 9.5, total: 18, unit: 'cm', unitLabel: 'cm', locale: 'fr' })).trim(), '9,5 / 18 cm')
  assert.equal(renderedText(render({ current: 2, total: 4, unit: 'rows', unitLabel: 'rangs', locale: 'fr' })).trim(), '2 / 4 rangs')
  assert.equal(renderedText(render({ current: 2, total: 4, unit: 'rounds', unitLabel: 'tours', locale: 'fr' })).trim(), '2 / 4 tours')
  assert.equal(renderedText(render({ current: 19, total: null, unit: 'cm', unitLabel: 'cm', locale: 'fr' })).trim(), '19')
})

test('all three real counter layouts hide repeated section headings but keep reminders accessible', () => {
  const layouts = []
  const visit = node => {
    if (!node || typeof node !== 'object') return
    if (node.type === 'JSXElement' && node.children.some(child => child.type === 'JSXExpressionContainer'
      && child.expression.type === 'LogicalExpression'
      && child.expression.left.type === 'UnaryExpression'
      && child.expression.left.argument.name === 'activeProjectSection'
      && source.slice(child.start, child.end).includes("t('ui.activeSection')"))) layouts.push(node)
    for (const [key, value] of Object.entries(node)) {
      if (key === 'loc') continue
      if (Array.isArray(value)) value.forEach(visit)
      else if (value && typeof value === 'object') visit(value)
    }
  }
  visit(component)
  assert.equal(layouts.length, 3)
  for (const layout of layouts) {
    const jsx = transform(`(${source.slice(layout.start, layout.end)})`, { transforms: ['jsx'], production: true }).code
    const context = { React: react, activeProjectSection: section(1, 1), currentSectionId: 1,
      sections: [section(1, 1)], t: key => key, reminders: [], showMoreOptions: true, isFocusMode: false, hasPrimaryCounter: true }
    const active = vm.runInNewContext(jsx, context)
    assert.ok(!renderedText(active).includes('ui.activeSection'))
    assert.ok(!renderedText(active).includes('Step 1'))
    if (source.slice(layout.start, layout.end).includes('ui.reminders')) assert.ok(nodes(active).some(node => node.type === 'button'))
    context.activeProjectSection = null; context.currentSectionId = null
    assert.ok(renderedText(vm.runInNewContext(jsx, context)).includes('ui.wholeProject'))
  }
})
test('card shows instructions and preview; Continue is only offered after completion', () => {
  const props = { section: section(1, 1), nextSection: section(2, 2), t: key => key, renderInstructions: value => value, children: 'existing counter', onContinue() {}, onToggleComplete() {} }
  const before = nodes(module.exports.default(props))
  assert.ok(before.some(node => node.props.children.includes('ui.journeyNext')))
  assert.ok(!before.some(node => node.props.children.includes('ui.journeyContinue')))
  const after = nodes(module.exports.default({ ...props, section: { ...props.section, is_completed: 1 } }))
  assert.ok(after.some(node => node.props.children.includes('ui.journeyContinue')))
  assert.ok(after.some(node => node.props.children.includes('Instructions')))
  const global = nodes(module.exports.default({ ...props, section: null }))
  assert.ok(!global.some(node => node.type === 'section'))
})

test('work mode renders the existing counter before the instructions', () => {
  const props = { section: section(1, 1), nextSection: null, t: key => key, renderInstructions: value => value, children: 'existing counter', onToggleComplete() {}, prioritizeControls: true }
  const text = renderedText(module.exports.default(props))
  assert.ok(text.indexOf('existing counter') < text.indexOf('Instructions'))
})

test('completed transition is rendered once between the counter and instructions', () => {
  const props = { section: section(1, 1, { is_completed: 1 }), nextSection: section(2, 2), t: key => key, renderInstructions: value => value, children: 'existing counter', onContinue() {}, onToggleComplete() {}, prioritizeControls: true }
  const text = renderedText(module.exports.default(props))
  assert.ok(text.indexOf('existing counter') < text.indexOf('ui.journeyDone'))
  assert.ok(text.indexOf('ui.journeyDone') < text.indexOf('Instructions'))
  assert.equal(text.split('ui.journeyContinue').length - 1, 1)
})
