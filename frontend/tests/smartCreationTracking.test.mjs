import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { transform } from 'sucrase'
import * as tracking from '../src/utils/smartCreationTracking.js'
import * as safety from '../src/utils/smartCreationSafety.js'

// Lightweight hook harness: executes the real component and its handlers/effects,
// with HTTP/router/storage doubles. No browser, bundle, network or new dependency.
function mount(relativePath, { storedNotice = null, sessionEntries = [], analyze, pending, translate, confirm, resume = false, initialPath = '/smart-project-creator' } = {}) {
  const events = [], requests = [], slots = [], effects = [], listeners = new Map(), intersections = [], refActions = []
  const storage = new Map([
    ...(storedNotice ? [['yf_smart_project_notice', JSON.stringify(storedNotice)]] : []),
    ...sessionEntries,
  ])
  const localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }
  let cursor = 0, dirty = false, tree
  const window = {
    location: { pathname: initialPath },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    dispatchEvent: e => listeners.get(e.type)?.(e), confirm: () => true,
  }
  class IntersectionObserver {
    constructor(callback) { this.callback = callback; intersections.push(this) }
    observe(target) { this.target = target }
    disconnect() {}
  }
  const react = {
    createElement: (type, props, ...children) => ({ type, props: { ...props, children } }),
    Fragment: 'fragment',
    useState(initial) {
      const i = cursor++
      if (!(i in slots)) slots[i] = typeof initial === 'function' ? initial() : initial
      return [slots[i], value => { slots[i] = typeof value === 'function' ? value(slots[i]) : value; dirty = true }]
    },
    useRef(initial) { const i = cursor++; return slots[i] ||= { current: initial } },
    useEffect(fn, deps) {
      const i = cursor++
      const old = slots[i]
      if (!old || !deps || deps.some((dep, j) => !Object.is(dep, old.deps[j]))) {
        effects.push(() => { old?.cleanup?.(); slots[i] = { deps, cleanup: fn() } })
      }
    },
  }
  const api = {
    get: async path => ({ data: path.includes('/pending') ? pending || { pending: true, import_id: 7 } : { quota: { remaining: 3 }, entry: null } }),
    post: async (path, data, config) => {
      requests.push({ path, data, config })
      if (path.endsWith('/analyze')) return analyze(data)
      if (path.endsWith('/translate-preview')) return translate(data)
      if (path.endsWith('/confirm')) return confirm ? confirm(data) : { data: { success: true, project: { id: 12 } } }
      return { data: {} }
    },
  }
  const params = new URLSearchParams(resume ? 'resume=1' : '')
  const code = transform(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), { transforms: ['jsx', 'imports'], production: true }).code
  const module = { exports: {} }
  const context = {
    module, exports: module.exports, React: react, window, localStorage, sessionStorage: localStorage, IntersectionObserver,
    URLSearchParams, FormData, Intl, Date, Math, Set, queueMicrotask,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail } },
    console: { error() {} },
    require(name) {
      if (name === 'react') return react
      if (name === 'react-router-dom') return {
        useNavigate: () => path => { window.location.pathname = path }, Link: 'a',
        useSearchParams: () => [params, () => {}], useLocation: () => ({ pathname: window.location.pathname, state: {} }),
      }
      if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key, i18n: { language: 'fr' } }) }
      if (name.includes('AuthContext')) return { useAuth: () => ({ user: { subscription_type: 'free' } }) }
      if (name.includes('useAnalytics')) return { useAnalytics: () => ({ trackSmartAnalysis() {}, trackProjectCreated() {} }) }
      if (name.includes('productEvents')) return { trackPaywallShown() {}, trackProductEvent: (name, data) => events.push({ name, ...data }) }
      if (name.includes('smartCreationTracking')) return tracking
      if (name.includes('smartCreationSafety')) return safety
      if (name.includes('apiError')) return { apiErrorMessage: (_, fallback) => fallback }
      if (name === 'axios' || name.endsWith('/api')) return api
      return () => null
    },
  }
  vm.runInNewContext(code, context)
  const render = () => {
    let count = 0
    do {
      dirty = false; cursor = 0; tree = module.exports.default()
      const attachRefs = node => {
        if (!node || typeof node !== 'object') return
        if (Array.isArray(node)) return node.forEach(attachRefs)
        if (node.props?.ref && typeof node.type === 'string') {
          const target = {
            scrollIntoView: options => refActions.push({ type: 'scroll', options, node }),
            focus: options => refActions.push({ type: 'focus', options, node }),
          }
          if (typeof node.props.ref === 'function') node.props.ref(target)
          else node.props.ref.current = target
        }
        attachRefs(node.props?.children)
      }
      attachRefs(tree)
      effects.splice(0).forEach(effect => effect())
      assert.ok(++count < 15, 'render converges')
    } while (dirty)
    return tree
  }
  const find = predicate => {
    const walk = node => {
      if (!node || typeof node !== 'object') return null
      if (Array.isArray(node)) return node.map(walk).find(Boolean)
      return predicate(node) ? node : walk(node.props?.children)
    }
    const node = walk(tree)
    assert.ok(node, 'target rendered')
    return node
  }
  const findAll = predicate => {
    const matches = []
    const walk = node => {
      if (!node || typeof node !== 'object') return
      if (Array.isArray(node)) return node.forEach(walk)
      if (predicate(node)) matches.push(node)
      walk(node.props?.children)
    }
    walk(tree)
    return matches
  }
  render()
  return { events, requests, window, storage, refActions, render, find, findAll,
    setPrimaryActionVisible(isIntersecting) {
      const observer = intersections.at(-1)
      assert.ok(observer, 'validation action observer registered')
      observer.callback([{ isIntersecting }])
    },
    unmount() { slots.forEach(slot => slot?.cleanup?.()) },
  }
}

async function launch(analyze, options = {}) {
  const app = mount('../src/pages/SmartProjectCreator.jsx', { analyze, ...options })
  app.find(n => /handleModeSelect\(['"]text['"]\)/.test(n.props?.onClick?.toString() || '')).props.onClick()
  app.render()
  app.find(n => n.type === 'textarea').props.onChange({ target: { value: 'Rang 1: tricoter. Rang 2: tricoter. Un patron de test suffisamment long.' } })
  app.render()
  if (options.size) {
    app.find(n => n.type === 'button' && n.props.children.includes(options.size)).props.onClick()
    app.render()
  }
  const promise = app.find(n => n.props?.onClick?.name === 'handleAnalyze').props.onClick()
  app.render()
  return { app, promise }
}

const success = (form, extra = {}) => ({ data: {
  success: true, attempt_id: form.get('attempt_id'), import_id: 7, source_type: 'text', ai_status: 'success',
  data: { title: 'Test', language: 'fr', craft_type: 'tricot', sections: [{ name: 'Corps', description: 'Tricoter' }], ...extra },
} })

test('completed analysis keeps review active across rerenders until explicit confirmation', async () => {
  const { app, promise } = await launch(async form => success(form))
  await promise; app.render(); app.render()
  assert.equal(app.events.filter(e => e.stage === 'source_selected').length, 1)
  assert.equal(app.events.find(e => e.stage === 'source_selected').source_type, 'text')
  const request = app.requests.find(r => r.path.endsWith('/analyze'))
  assert.equal(confirms(app).length, 0)
  await button(app, 'ui.createProjectCheck').props.onClick()
  const confirm = confirms(app)[0]
  assert.equal(confirm.data.analyze_metadata.attempt_id, request.data.get('attempt_id'))
  assert.equal(confirm.data.analyze_metadata.import_id, 7)
})

test('analysis without a selected size opens the editable review', async () => {
  const issue = { code: 'symmetric_piece_missing', context: { section_name: 'Left front' } }
  const { app, promise } = await launch(async form => {
    assert.equal(form.has('pattern_size'), false)
    return success(form, {
      validation_issues: { errors: [issue], unverifiable: [issue] },
    })
  })

  await promise; app.render(); app.render()

  button(app, 'ui.createProjectCheck')
  button(app, 'ui.duplicateThisStep')
  assert.throws(() => app.find(n => n.props?.onClick?.name === 'handleAnalyze'))
})

test('analysis failure never confirms or shows a gate', async () => {
  const { app, promise } = await launch(async () => { throw new Error('network') })
  await promise; app.render()
  assert.ok(!app.requests.some(r => r.path.endsWith('/confirm')))
  assert.ok(!app.events.some(e => e.stage === 'gate_shown'))
})

test('unsupported URL compression offers retry and pasted-text import without exposing curl details', async () => {
  let calls = 0
  const app = mount('../src/pages/SmartProjectCreator.jsx', { analyze: async form => {
    calls += 1
    if (calls === 1) return { data: {
      success: false,
      error: 'La page utilise une compression que YarnFlow ne peut pas lire actuellement.',
      error_code: 'url_compression_unsupported',
      ai_status: 'failed',
    } }
    return success(form)
  } })
  app.find(n => /handleModeSelect\(['"]url['"]\)/.test(n.props?.onClick?.toString() || '')).props.onClick()
  app.render()
  app.find(n => n.type === 'input' && n.props.type === 'url').props.onChange({ target: { value: 'https://example.com/pattern' } })
  app.render()
  const firstRequest = app.find(n => n.props?.onClick?.name === 'handleAnalyze').props.onClick()
  await firstRequest; app.render()

  button(app, 'ui.retryUrlImport')
  app.find(n => n.props?.children?.includes?.('ui.urlImportRecoveryHelp'))
  assert.equal(app.findAll(n => String(n.props?.children || '').includes('libcurl')).length, 0)

  const fallback = app.find(n => n.type === 'textarea')
  fallback.props.onChange({ target: { value: 'Un texte de patron suffisamment long pour utiliser la méthode de remplacement sans URL.' } })
  app.render()
  const retry = app.find(n => n.props?.onClick?.name === 'handleAnalyze')
  await retry.props.onClick(); app.render()
  const secondAnalyze = app.requests.filter(request => request.path.endsWith('/analyze'))[1]
  assert.equal(secondAnalyze.data.get('pattern_text').includes('méthode de remplacement'), true)
  assert.equal(secondAnalyze.data.has('url'), false)
})

test('real SPA departure during HTTP analysis is tracked once and correlated', async () => {
  let resolve
  const { app, promise } = await launch(form => new Promise(r => { resolve = () => r(success(form, { contains_diagram: true })) }))
  app.window.location.pathname = '/my-projects'
  app.unmount(); await Promise.resolve()
  const departure = app.events.find(e => e.stage === 'left_during_analysis')
  assert.equal(departure.attempt_id, app.requests.find(r => r.path.endsWith('/analyze')).data.get('attempt_id'))
  resolve(); await promise
  assert.equal(app.events.filter(e => e.stage === 'left_during_analysis').length, 1)
  assert.equal(JSON.parse(app.storage.get('yf_smart_project_notice')).attemptId, departure.attempt_id)
  assert.ok(!app.events.some(e => e.stage === 'gate_shown'))
})

test('visibility alone, completed analysis and same-route cleanup are not departures', () => {
  const state = { analysisInFlight: true, alreadyTracked: false, sourcePath: '/smart-project-creator', currentPath: '/smart-project-creator', visibilityState: 'hidden' }
  assert.equal(tracking.shouldTrackAnalysisDeparture(state), false)
  assert.equal(tracking.shouldTrackAnalysisDeparture({ ...state, currentPath: '/my-projects' }), true)
  assert.equal(tracking.shouldTrackAnalysisDeparture({ ...state, currentPath: '/my-projects', analysisInFlight: false }), false)
  assert.equal(tracking.shouldTrackAnalysisDeparture({ ...state, currentPath: '/my-projects', alreadyTracked: true }), false)
})

test('diagram warning is shown in review without creating an intermediate gate', async () => {
  const { app, promise } = await launch(async form => success(form, { contains_diagram: true }))
  await promise; app.render(); app.render()
  const gates = app.events.filter(e => e.stage === 'gate_shown')
  assert.equal(gates.length, 0)
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, true)
  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); app.render()
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, false)
})

test('expanded notice, later, compact reminder and resume are tracked', () => {
  const app = mount('../src/components/SmartCreationNoticeBanner.jsx', { storedNotice: {
    kind: 'gate', gateType: 'partial', importId: 7, attemptId: 'attempt-123456789', sourceType: 'text', createdAt: Date.now(), display: 'expanded',
  }, initialPath: '/my-projects' })
  app.render()
  assert.equal(app.events.filter(e => e.stage === 'notice_shown').length, 1)
  app.find(n => n.props?.onClick?.name === 'handleDismiss').props.onClick()
  app.render()
  assert.ok(app.events.some(e => e.stage === 'notice_clicked' && e.action === 'later'))
  assert.ok(app.events.some(e => e.stage === 'notice_shown' && e.display_context === 'compact'))
  app.find(n => n.props?.onClick?.name === 'handleAction').props.onClick()
  assert.equal(app.events.at(-1).action, 'resume')
  assert.equal(app.window.location.pathname, '/smart-project-creator?resume=1')
})

test('ready notice opens the created project and includes its identifiers', () => {
  const app = mount('../src/components/SmartCreationNoticeBanner.jsx', {
    storedNotice: { kind: 'ready', id: 12, importId: 7, attemptId: 'attempt-123456789' },
    initialPath: '/my-projects',
  })
  app.find(n => n.props?.onClick?.name === 'handleAction').props.onClick()
  assert.equal(app.events.at(-1).action, 'open_project')
  assert.equal(app.events.at(-1).project_id, 12)
})

test('global smart creation notice stays hidden inside the smart creator', () => {
  const app = mount('../src/components/SmartCreationNoticeBanner.jsx', { storedNotice: {
    kind: 'gate', gateType: 'diagram', importId: 7, createdAt: Date.now(), display: 'expanded',
  } })
  assert.equal(app.findAll(n => n.type === 'button').length, 0)
  assert.ok(app.storage.has('yf_smart_project_notice'))
})

test('stage allowlist cannot be overridden by event data', () => {
  assert.throws(() => tracking.buildSmartCreationProgress('arbitrary'))
  assert.equal(tracking.buildSmartCreationProgress('gate_shown', { stage: 'arbitrary' }).stage, 'gate_shown')
})

test('blocking precreation helpers expose only one explicit compatible size', () => {
  const issue = { code: 'selected_size_not_available', context: { available_sizes: ['M'] } }
  assert.equal(safety.blockingPrecreationIssue({ validation_issues: { errors: [issue] } }), issue)
  assert.deepEqual(safety.blockingPrecreationIssues({ validation_issues: { errors: [issue, { code: 'second' }] } }), [issue, { code: 'second' }])
  assert.equal(safety.singleCompatibleSize(issue), 'M')
  assert.equal(safety.singleCompatibleSize({ ...issue, context: { available_sizes: ['S', 'M'] } }), null)
  assert.equal(safety.singleCompatibleSize({ code: 'another_error' }), null)
  assert.equal(safety.validSourceUrl('pasted pattern text'), null)
  assert.equal(safety.validSourceUrl('https://example.com/pattern'), 'https://example.com/pattern')
  const repairable = { validation_issues: { errors: [{ code: 'symmetric_piece_missing' }] } }
  assert.equal(safety.blockingPrecreationIssue(repairable), null)
  assert.equal(safety.projectReviewPoints(repairable).length, 1)
  const reanalysis = { validation_issues: { errors: [{ code: 'progression_type_invalid' }] } }
  assert.equal(safety.blockingPrecreationIssue(reanalysis).code, 'progression_type_invalid')
  const ambiguity = { validation_issues: { errors: [{ code: 'structural_ambiguity_unresolved', context: {
    field: 'sections[2].description', source_values: ['29.5 cm cm', '36,5 cm'],
  } }] } }
  assert.deepEqual(safety.projectReviewPoints(ambiguity)[0].values, [{ value: 29.5, unit: 'cm' }, { value: 36.5, unit: 'cm' }])
  const sized = { available_sizes: ['S', 'M', 'L'], validation_issues: { unverifiable: [{ code: 'pattern_size_not_selected' }] } }
  assert.deepEqual(safety.projectReviewPoints(sized, 'partial'), [{
    code: 'pattern_size_not_selected', sectionIndex: null, availableSizes: ['S', 'M', 'L'], values: [],
  }])
  assert.deepEqual(safety.projectReviewPoints({}, 'partial'), [{ code: 'analysis_partial', sectionIndex: null, values: [] }])
})

const button = (app, key) => app.find(n => n.type === 'button' && n.props.children.includes(key))
const confirms = app => app.requests.filter(r => r.path.endsWith('/confirm'))
const flush = () => new Promise(resolve => setImmediate(resolve))

test('mobile review exposes the existing confirmation action only while the main action is off screen', async () => {
  const { app, promise } = await launch(async form => success(form))
  await promise; app.render()

  app.setPrimaryActionVisible(false); app.render()
  const region = app.find(n => n.props?.role === 'region' && n.props['aria-label'] === 'ui.projectValidationAction')
  assert.ok(region.props.className.includes('md:hidden'))
  const stickyAction = app.find(n => n.type === 'button' && n.props?.onClick?.name === 'handleStickyValidation')
  assert.ok(stickyAction.props.children.includes('ui.createProjectCheck'))
  await stickyAction.props.onClick()
  assert.equal(confirms(app).length, 1)

  app.setPrimaryActionVisible(true); app.render()
  assert.equal(app.findAll(n => n.props?.role === 'region' && n.props['aria-label'] === 'ui.projectValidationAction').length, 0)
})

test('mobile review sends an unmet acknowledgement to the existing required control', async () => {
  const issue = { code: 'symmetric_piece_missing', context: { section_name: 'Left front' } }
  const { app, promise } = await launch(async form => success(form, {
    validation_issues: { warnings: [issue] },
  }))
  await promise; app.render()

  app.setPrimaryActionVisible(false); app.render()
  const stickyAction = button(app, 'ui.goToRequiredCheck')
  assert.equal(stickyAction.props.disabled, false)
  stickyAction.props.onClick()
  assert.equal(confirms(app).length, 0)
  assert.deepEqual(app.refActions.slice(-2).map(action => action.type), ['scroll', 'focus'])
  assert.ok(app.find(n => n.props?.id === 'smart-validation-requirement').props.children.includes('ui.reviewPointsConfirmationRequired'))

  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } })
  app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 1)
  assert.equal(confirms(app)[0].data.review_points_confirmed, true)
})

test('size mismatch hides translation and creation actions then reanalyzes with the only compatible size', async () => {
  let analyses = 0
  const { app, promise } = await launch(async form => {
    analyses += 1
    if (analyses === 1) {
      return success(form, {
        language: 'en', contains_diagram: true, diagram_source_accessible: false,
        validation_issues: { errors: [{
          code: 'selected_size_not_available',
          context: { selected_size: 'L', available_sizes: ['M'] },
        }] },
      })
    }
    return success(form, { language: 'fr', validation_issues: { errors: [] } })
  }, { size: 'L' })

  await promise; app.render()
  assert.throws(() => button(app, 'ui.patternTranslateGateCta'))
  assert.throws(() => button(app, 'ui.patternTranslateGateSkip'))
  assert.throws(() => button(app, 'ui.continueAnyway'))
  assert.equal(confirms(app).length, 0)
  app.find(n => n.type === 'h2' && n.props.children.includes('ui.selectedSizeUnavailableTitle'))

  await button(app, 'ui.useAvailableSize').props.onClick()
  await flush(); app.render()

  const analyzeRequests = app.requests.filter(r => r.path.endsWith('/analyze'))
  assert.equal(analyzeRequests.length, 2)
  assert.equal(analyzeRequests[1].data.get('pattern_size'), 'M')
  assert.equal(confirms(app).length, 0)
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 1)
  assert.equal(confirms(app)[0].data.pattern_size, 'M')
})

test('analysis without size offers known sizes and reanalyzes with the selected one', async () => {
  let analyses = 0
  const { app, promise } = await launch(async form => {
    analyses += 1
    if (analyses === 1) {
      assert.equal(form.has('pattern_size'), false)
      const response = success(form, {
        available_sizes: ['S', 'M', 'L'],
        validation_issues: { unverifiable: [{ code: 'pattern_size_not_selected', context: {} }] },
      })
      response.data.ai_status = 'partial'
      return response
    }
    return success(form)
  })

  await promise; app.render()
  app.find(n => JSON.stringify(n.props?.children || '').includes('ui.chooseYourSizeReviewTitle'))
  assert.equal(app.findAll(n => JSON.stringify(n.props?.children || '').includes('ui.reviewPointGeneric')).length, 0)
  assert.equal(app.findAll(n => JSON.stringify(n.props?.children || '').includes('ui.reviewPointPartial')).length, 0)

  await button(app, 'M').props.onClick()
  await flush(); app.render()
  const analyzeRequests = app.requests.filter(request => request.path.endsWith('/analyze'))
  assert.equal(analyzeRequests.length, 2)
  assert.equal(analyzeRequests[1].data.get('pattern_size'), 'M')
  assert.equal(analyzeRequests[1].data.get('pattern_text'), analyzeRequests[0].data.get('pattern_text'))
})

test('size selection precedes translation and preserves pasted text for the new analysis', async () => {
  let analyses = 0
  const { app, promise } = await launch(async form => {
    analyses += 1
    if (analyses === 1) {
      const response = success(form, {
        language: 'en',
        available_sizes: ['S', 'M', 'L'],
        validation_issues: { unverifiable: [{ code: 'pattern_size_not_selected', context: {} }] },
      })
      response.data.ai_status = 'partial'
      return response
    }
    return success(form, { language: 'en' })
  }, {
    translate: async () => ({ data: {
      success: true,
      translated_sections: [{ name: 'Corps', description: 'Tricoter.' }],
    } }),
  })

  await promise; app.render()
  assert.throws(() => button(app, 'ui.patternTranslateGateCta'))
  assert.equal(app.requests.filter(request => request.path.endsWith('/translate-preview')).length, 0)
  await button(app, 'M').props.onClick()
  await flush(); app.render()

  const analyzeRequests = app.requests.filter(request => request.path.endsWith('/analyze'))
  assert.equal(analyzeRequests.length, 2)
  assert.equal(analyzeRequests[1].data.get('pattern_size'), 'M')
  assert.equal(analyzeRequests[1].data.get('pattern_text'), analyzeRequests[0].data.get('pattern_text'))
  button(app, 'ui.patternTranslateGateCta')
  await app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick()
  app.render()
  assert.equal(app.requests.filter(request => request.path.endsWith('/translate-preview')).length, 1)
})

test('an error requiring reanalysis hides every continuation action', async () => {
  const { app, promise } = await launch(async form => success(form, {
    language: 'en',
    validation_issues: { errors: [{ code: 'progression_type_invalid', message: 'Invalid progression type' }] },
  }))
  await promise; app.render()

  assert.throws(() => button(app, 'ui.patternTranslateGateCta'))
  assert.throws(() => button(app, 'ui.patternTranslateGateSkip'))
  assert.throws(() => button(app, 'ui.continueAnyway'))
  assert.equal(confirms(app).length, 0)
  button(app, 'ui.changeSourceOrSize')
})

test('missing symmetric piece opens review, can be duplicated, and requires one acknowledgement', async () => {
  const symmetricIssue = { code: 'symmetric_piece_missing', message: 'Add the right front.', context: { section_name: 'Left front' } }
  const { app, promise } = await launch(async form => success(form, {
    sections: [{ name: 'Left front', description: 'Work left front.', progression_type: 'composite', target: null }],
    validation_issues: { errors: [symmetricIssue], unverifiable: [symmetricIssue] },
  }))
  await promise; app.render()
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, true)
  button(app, 'ui.duplicateThisStep').props.onClick({ currentTarget: { closest: () => ({ removeAttribute() {} }) } }); app.render()
  let names = app.findAll(n => n.type === 'input' && n.props.placeholder === 'ui.phSectionName')
  names[1].props.onChange({ target: { value: 'Right front' } }); app.render()
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, true)
  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); app.render()
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, false)
})

test('section duplication lives in an accessible secondary menu and preserves insertion and counter data', async () => {
  const sections = [
    { name: 'Knit body', description: 'Work.', progression_type: 'simple', unit: 'rangs', target: 4,
      secondary_counter: { label: 'Repeats', target: 2, count: 0, tracking_role: 'required_cycle', cycle_length: 2 } },
    { name: 'Bind off', description: 'Bind off.', progression_type: 'action', target: null },
  ]
  const { app, promise } = await launch(async form => success(form, { sections }))
  await promise; app.render()

  assert.equal(app.findAll(n => n.type === 'summary' && n.props['aria-label'] === 'ui.sectionActions').length, 2)
  assert.equal(app.findAll(n => n.props?.role === 'menu').length, 2)
  const menuItems = app.findAll(n => n.type === 'button' && n.props.role === 'menuitem'
    && n.props.children.includes('ui.duplicateThisStep'))
  assert.equal(menuItems.length, 2)
  assert.equal(app.findAll(n => JSON.stringify(n.props?.children || '').includes('ui.createIdenticalPiece')).length, 0)
  assert.equal(app.findAll(n => n.type === 'button' && n.props['aria-label'] === 'ui.removeSection').length, 2)

  let menuClosed = false
  menuItems[0].props.onClick({ currentTarget: { closest: () => ({ removeAttribute: name => { menuClosed = name === 'open' } }) } })
  app.render()
  assert.equal(menuClosed, true)
  assert.equal(JSON.stringify(
    app.findAll(n => n.type === 'input' && n.props.placeholder === 'ui.phSectionName').map(n => n.props.value)
  ), JSON.stringify(['Knit body', 'Knit body', 'Bind off']))

  await button(app, 'ui.createProjectCheck').props.onClick()
  const submitted = confirms(app).at(-1).data.sections
  assert.equal(JSON.stringify(submitted.map(section => section.name)), JSON.stringify(['Knit body', 'Knit body', 'Bind off']))
  assert.equal(JSON.stringify(submitted[1].secondary_counter), JSON.stringify(submitted[0].secondary_counter))
  assert.notEqual(submitted[1].secondary_counter, submitted[0].secondary_counter)
})

test('changing size after analysis removes reuse and sends the new size on reanalysis', async () => {
  const { app, promise } = await launch(async form => success(form), {
    size: 'S', confirm: async () => { throw new Error('temporary save failure') },
  })
  await promise; await flush(); app.render()
  button(app, 'ui.backArrow4').props.onClick(); app.render()
  button(app, 'ui.continuePrevAnalysis')
  button(app, 'M').props.onClick(); app.render()
  assert.throws(() => button(app, 'ui.continuePrevAnalysis'))
  await app.find(n => n.props?.onClick?.name === 'handleAnalyze').props.onClick()
  app.render()
  assert.equal(app.requests.filter(r => r.path.endsWith('/analyze')).at(-1).data.get('pattern_size'), 'M')
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).at(-1).data.pattern_size, 'M')
})

test('resumed import restores size, allows matching confirmation, and rejects reuse after size change', async () => {
  const pending = { pending: true, import_id: 17, source_type: 'pdf', pattern_size: 'L', ai_status: 'success', data: {
    title: 'Resumed', language: 'fr', sections: [{ name: 'Corps', description: 'Tricoter 10 rangs.' }],
  } }
  const app = mount('../src/pages/SmartProjectCreator.jsx', { resume: true, pending })
  await flush(); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app)[0].data.pattern_size, 'L')
  assert.equal(confirms(app)[0].data.analyze_metadata.import_id, 17)

  const changed = mount('../src/pages/SmartProjectCreator.jsx', { resume: true, pending })
  await flush(); changed.render()
  button(changed, 'ui.backArrow4').props.onClick(); changed.render()
  button(changed, 'ui.continuePrevAnalysis')
  button(changed, 'M').props.onClick(); changed.render()
  assert.throws(() => button(changed, 'ui.continuePrevAnalysis'))
  assert.equal(confirms(changed).length, 0)
})

test('resumed text import restores its session source before reanalyzing a chosen size', async () => {
  const sourceText = 'Original pasted pattern with enough instructions to run a new size analysis.'
  const pending = { pending: true, import_id: 23, source_type: 'text', pattern_size: null, ai_status: 'partial', data: {
    title: 'Resumed text', language: 'fr', available_sizes: ['S', 'M'],
    validation_issues: { unverifiable: [{ code: 'pattern_size_not_selected', context: {} }] },
    sections: [{ name: 'Corps', description: 'Tricoter.' }],
  } }
  const app = mount('../src/pages/SmartProjectCreator.jsx', {
    resume: true,
    pending,
    sessionEntries: [['yf_smart_text_source_23', sourceText]],
    analyze: async form => success(form),
  })
  await flush(); app.render()
  await button(app, 'M').props.onClick()
  await flush(); app.render()

  const request = app.requests.find(entry => entry.path.endsWith('/analyze'))
  assert.equal(request.data.get('pattern_size'), 'M')
  assert.equal(request.data.get('pattern_text'), sourceText)
})

test('resumed import restores an already validated translated preview without translating again', async () => {
  const pending = {
    pending: true, import_id: 19, source_type: 'pdf', pattern_size: 'M', ai_status: 'success',
    translated_lang: 'fr',
    translated_preview: {
      target_lang: 'fr',
      sections: [{ name: 'Corps traduit', description: 'Tricoter 10 rangs.' }],
      pattern_notes: 'Notes traduites.',
    },
    data: {
      title: 'Original', language: 'en', pattern_notes: 'Original notes.',
      sections: [{ name: 'Body', description: 'Work 10 rows.' }],
    },
  }
  const app = mount('../src/pages/SmartProjectCreator.jsx', { resume: true, pending })
  await flush(); app.render()

  assert.throws(() => button(app, 'ui.patternTranslateGateCta'))
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 1)
  assert.equal(confirms(app)[0].data.sections[0].name, 'Corps traduit')
  assert.equal(confirms(app)[0].data.sections[0].description, 'Tricoter 10 rangs.')
  assert.equal(confirms(app)[0].data.project.pattern_notes, 'Notes traduites.')
  assert.equal(app.requests.filter(request => request.path.endsWith('/translate-preview')).length, 0)
})

test('resumed action section keeps manual action semantics through confirmation', async () => {
  const pending = { pending: true, import_id: 18, source_type: 'text', pattern_size: 'M', ai_status: 'success', data: {
    title: 'Resumed action', language: 'fr', sections: [{
      name: 'ASSEMBLY', description: 'Sew the buttons onto the band.',
      progression_type: 'action', unit: null, target: null, secondary_counter: null,
    }],
  } }
  const app = mount('../src/pages/SmartProjectCreator.jsx', { resume: true, pending })
  await flush(); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app)[0].data.sections[0].progression_type, 'action')
  assert.equal(confirms(app)[0].data.sections[0].unit, null)
  assert.equal(confirms(app)[0].data.sections[0].target, null)
})

test('composite section shows free tracking instead of an editable target', async () => {
  const { app, promise } = await launch(async form => success(form, {
    sections: [{
      name: 'Body', description: 'Work several successive steps.',
      progression_type: 'composite', unit: 'cm', target: null,
    }],
  }))
  await promise; app.render()

  app.find(n => JSON.stringify(n.props?.children || '').includes('ui.compositeFreeTracking'))
  assert.equal(app.findAll(n => n.type === 'input' && n.props.placeholder === 'ui.objective').length, 0)
})

test('unitless composite shows manual tracking without inventing a row unit', async () => {
  const { app, promise } = await launch(async form => success(form, {
    sections: [{
      name: 'Body', description: 'Work several successive steps.',
      progression_type: 'composite', unit: null, target: null,
    }],
  }))
  await promise; app.render()

  app.find(n => JSON.stringify(n.props?.children || '').includes('ui.compositeManualTracking'))
  assert.equal(app.findAll(n => n.type === 'select' && n.props.value === 'rangs').length, 0)
  assert.equal(app.findAll(n => n.type === 'input' && n.props.placeholder === 'ui.objective').length, 0)
})

test('transient translation failure never confirms and can be retried manually', async () => {
  let attempts = 0
  const { app, promise } = await launch(async form => success(form, { language: 'en' }), {
    translate: async () => {
      if (++attempts === 1) throw new Error('network')
      return { data: { success: true, translated_sections: [{ name: 'Corps traduit', description: 'Tricoter 10 rangs.' }] } }
    },
  })
  await promise; app.render()
  await app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick(); app.render()
  assert.equal(confirms(app).length, 0)
  button(app, 'ui.patternTranslateGateCta')
  await app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick()
  app.render()
  assert.equal(confirms(app).length, 0)
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 1)
  assert.equal(confirms(app)[0].data.sections[0].name, 'Corps traduit')
  const translationRequests = app.requests.filter(request => request.path.endsWith('/translate-preview'))
  assert.equal(translationRequests[0].config.timeout, 300000)
  assert.equal(translationRequests[0].config.skipAutomaticRetry, true)
})

test('translation loading is visual only, hides actions and sends one request', async () => {
  let resolveTranslation
  const { app, promise } = await launch(async form => success(form, { language: 'en' }), {
    translate: async () => new Promise(resolve => { resolveTranslation = resolve }),
  })
  await promise; app.render()

  const translationPromise = app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick()
  app.render()

  app.find(n => n.type === 'h2' && n.props.children.includes('ui.patternTranslatingTitle'))
  app.find(n => n.type === 'p' && n.props.children.includes('ui.patternTranslatingSections'))
  app.find(n => n.props?.['aria-busy'] === 'true')
  assert.throws(() => button(app, 'ui.patternTranslateGateSkip'))
  assert.throws(() => button(app, 'ui.patternTranslateGateCta'))
  assert.equal(app.requests.filter(request => request.path.endsWith('/translate-preview')).length, 1)

  resolveTranslation({ data: { success: true, translated_sections: [{ name: 'Corps', description: 'Tricoter.' }] } })
  await translationPromise
  app.render()
  assert.equal(app.requests.filter(request => request.path.endsWith('/translate-preview')).length, 1)
})

test('definitive integrity failure makes original language the only primary action', async () => {
  const rejected = new Error('integrity')
  rejected.response = { status: 422, data: { error_code: 'translation_integrity_failed', repair_attempted: true } }
  const { app, promise } = await launch(async form => success(form, { language: 'en', contains_diagram: true }), {
    translate: async () => { throw rejected },
  })
  await promise; app.render()
  await app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick(); app.render()
  assert.equal(confirms(app).length, 0)
  app.find(n => n.type === 'h2' && n.props.children.includes('ui.patternTranslationIntegrityTitle'))
  assert.throws(() => button(app, 'ui.patternTranslateGateCta'))
  assert.throws(() => button(app, 'ui.patternTranslationRetry'))
  assert.equal(app.findAll(n => n.type === 'p' && n.props.children.includes('ui.patternTranslationIntegrityBody')).length, 1)
  button(app, 'ui.patternTranslationContinueOriginal').props.onClick()
  app.render()
  assert.equal(confirms(app).length, 0)
  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 1)
})

test('invalid translation stays blocked until original language is explicitly chosen', async () => {
  for (const data of [
    { success: false },
    { success: true, translated_sections: [] },
    { success: true, translated_sections: [{ name: 'Corps', description: '' }] },
  ]) {
    const { app, promise } = await launch(async form => success(form, { language: 'en' }), { translate: async () => ({ data }) })
    await promise; app.render()
    await app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick(); app.render()
    assert.equal(confirms(app).length, 0)
    button(app, 'ui.patternTranslateGateSkip').props.onClick()
    app.render()
    assert.equal(confirms(app).length, 0)
    await button(app, 'ui.createProjectCheck').props.onClick()
    assert.equal(confirms(app).length, 1)
    assert.equal(confirms(app)[0].data.sections[0].description, 'Tricoter')
  }
})

test('successful translation leads to review with one diagram acknowledgement', async () => {
  const { app, promise } = await launch(async form => success(form, { language: 'en', contains_diagram: true }), {
    translate: async () => ({ data: { success: true, translated_sections: [{ name: 'Corps', description: 'Tricoter.' }] } }),
  })
  await promise; app.render()
  await app.find(n => n.props?.onClick?.name === 'handleTranslatePreview').props.onClick(); app.render()
  assert.equal(confirms(app).length, 0)
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, true)
  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 1)
})

test('measurement warning requires review before confirmation and preserves decimal edits', async () => {
  const { app, promise } = await launch(async form => {
    const response = success(form, {
      sections: [{ name: 'Corps', description: 'Work 10 rows.', unit: 'cm', target: 10 }],
      validation_issues: { section_measurements: [{ context: { section_index: 0, section_name: 'Corps' } }] },
    })
    response.data.ai_status = 'partial'
    return response
  })
  await promise; app.render()
  assert.equal(confirms(app).length, 0)
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, true)
  app.find(n => n.type === 'input' && n.props.placeholder === 'ui.objective').props.onChange({ target: { value: '18.5' } }); app.render()
  assert.equal(app.find(n => n.type === 'input' && n.props.placeholder === 'ui.objective').props.value, 18.5)
  app.find(n => n.type === 'select' && n.props.value === 'cm').props.onChange({ target: { value: 'rangs' } }); app.render()
  assert.equal(app.find(n => n.type === 'input' && n.props.placeholder === 'ui.objective').props.value, '')
  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app)[0].data.review_points_confirmed, true)
  assert.equal(confirms(app)[0].data.sections[0].target, null)
})

test('analysis binding distinguishes source, file identity and size; unit edits never convert targets', () => {
  const base = { mode: 'text', pastedText: 'pattern A', patternSize: 'S' }
  const selection = safety.analysisSelection(base)
  assert.equal(safety.sameAnalysisSelection(selection, safety.analysisSelection({ ...base, patternSize: ' S ' })), true)
  assert.equal(safety.sameAnalysisSelection(selection, safety.analysisSelection({ ...base, patternSize: 'M' })), false)
  assert.equal(safety.sameAnalysisSelection(selection, safety.analysisSelection({ ...base, pastedText: 'pattern B' })), false)
  const file = { name: 'pattern.pdf' }
  assert.equal(safety.sameAnalysisSelection(safety.analysisSelection({ mode: 'pdf', file }), safety.analysisSelection({ mode: 'pdf', file: { ...file } })), false)
  assert.equal(safety.updateSmartSection({ unit: 'cm', target: 18.5 }, 'unit', 'rangs').target, null)
  assert.equal(safety.updateSmartSection({ unit: 'cm', target: 18.5 }, 'unit', 'cm').target, 18.5)
  assert.equal(safety.updateSmartSection({ unit: 'cm' }, 'target', '18,5').target, 18.5)
})

test('server size mismatch invalidates analysis instead of offering confirmation again', async () => {
  const { app, promise } = await launch(async form => success(form), {
    confirm: async () => { throw { response: { status: 409, data: { error_code: 'analysis_size_changed' } } } },
  })
  await promise; await flush(); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  app.render()
  assert.throws(() => button(app, 'ui.continuePrevAnalysis'))
  app.find(n => n.props?.onClick?.name === 'handleAnalyze')
  assert.equal(confirms(app).length, 1)
})

test('translation preserves manual corrections and maps untouched sections by source identity', async () => {
  const sections = safety.bindExtractedSections([
    { name: 'Back', description: 'Original back' },
    { name: 'Front', description: 'Original front' },
  ])
  const edited = safety.updateSmartSection(sections[0], 'description', 'Correction personnelle')
  const result = await safety.translateSmartPreview(async () => ({ data: {
    success: true,
    translated_sections: [
      { name: 'Dos', description: 'Dos traduit' },
      { name: 'Devant', description: 'Devant traduit' },
    ],
  } }), {}, [sections[1], edited])
  assert.equal(result.sections[0].name, 'Devant')
  assert.equal(result.sections[1].description, 'Correction personnelle')
})

test('server review rejection requires acknowledgement before another confirmation', async () => {
  const { app, promise } = await launch(async form => success(form), {
    confirm: async data => {
      if (!data.review_points_confirmed) throw { response: { status: 422, data: {
        error_code: 'review_points_confirmation_required',
      } } }
      return { data: { success: true, project: { id: 12 } } }
    },
  })
  await promise; await flush(); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  app.render()
  assert.equal(button(app, 'ui.createProjectCheck').props.disabled, true)
  app.find(n => n.type === 'input' && n.props.type === 'checkbox').props.onChange({ target: { checked: true } }); app.render()
  await button(app, 'ui.createProjectCheck').props.onClick()
  assert.equal(confirms(app).length, 2)
  assert.equal(confirms(app)[1].data.review_points_confirmed, true)
})
