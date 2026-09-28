import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import { transform } from 'sucrase'
import * as tracking from '../src/utils/smartCreationTracking.js'

// Lightweight hook harness: executes the real component and its handlers/effects,
// with HTTP/router/storage doubles. No browser, bundle, network or new dependency.
function mount(relativePath, { storedNotice = null, analyze, pending } = {}) {
  const events = [], requests = [], slots = [], effects = [], listeners = new Map()
  const storage = new Map(storedNotice ? [['yf_smart_project_notice', JSON.stringify(storedNotice)]] : [])
  const localStorage = { getItem: k => storage.get(k) ?? null, setItem: (k, v) => storage.set(k, v), removeItem: k => storage.delete(k) }
  let cursor = 0, dirty = false, tree
  const window = {
    location: { pathname: '/smart-project-creator' },
    addEventListener: (name, fn) => listeners.set(name, fn),
    removeEventListener: name => listeners.delete(name),
    dispatchEvent: e => listeners.get(e.type)?.(e), confirm: () => true,
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
    post: async (path, data) => {
      requests.push({ path, data })
      if (path.endsWith('/analyze')) return analyze(data)
      if (path.endsWith('/confirm')) return { data: { success: true, project: { id: 12 } } }
      return { data: {} }
    },
  }
  const params = new URLSearchParams()
  const code = transform(readFileSync(new URL(relativePath, import.meta.url), 'utf8'), { transforms: ['jsx', 'imports'], production: true }).code
  const module = { exports: {} }
  const context = {
    module, exports: module.exports, React: react, window, localStorage, sessionStorage: localStorage,
    URLSearchParams, FormData, Intl, Date, Math, Set, queueMicrotask,
    setTimeout: () => 1, clearTimeout() {}, setInterval: () => 1, clearInterval() {},
    CustomEvent: class { constructor(type, { detail }) { this.type = type; this.detail = detail } },
    console: { error() {} },
    require(name) {
      if (name === 'react') return react
      if (name === 'react-router-dom') return {
        useNavigate: () => path => { window.location.pathname = path }, Link: 'a',
        useSearchParams: () => [params, () => {}], useLocation: () => ({ state: {} }),
      }
      if (name === 'react-i18next') return { useTranslation: () => ({ t: key => key, i18n: { language: 'fr' } }) }
      if (name.includes('AuthContext')) return { useAuth: () => ({ user: { subscription_type: 'free' } }) }
      if (name.includes('useAnalytics')) return { useAnalytics: () => ({ trackSmartAnalysis() {}, trackProjectCreated() {} }) }
      if (name.includes('productEvents')) return { trackPaywallShown() {}, trackProductEvent: (name, data) => events.push({ name, ...data }) }
      if (name.includes('smartCreationTracking')) return tracking
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
  render()
  return { events, requests, window, storage, render, find,
    unmount() { slots.forEach(slot => slot?.cleanup?.()) },
  }
}

async function launch(analyze) {
  const app = mount('../src/pages/SmartProjectCreator.jsx', { analyze })
  app.find(n => /handleModeSelect\(['"]text['"]\)/.test(n.props?.onClick?.toString() || '')).props.onClick()
  app.render()
  app.find(n => n.type === 'textarea').props.onChange({ target: { value: 'Rang 1: tricoter. Rang 2: tricoter. Un patron de test suffisamment long.' } })
  app.render()
  const promise = app.find(n => n.props?.onClick?.name === 'handleAnalyze').props.onClick()
  app.render()
  return { app, promise }
}

const success = (form, extra = {}) => ({ data: {
  success: true, attempt_id: form.get('attempt_id'), import_id: 7, source_type: 'text', ai_status: 'success',
  data: { title: 'Test', language: 'fr', craft_type: 'tricot', sections: [{ name: 'Corps', description: 'Tricoter' }], ...extra },
} })

test('source selection, attempt propagation and automatic confirmation', async () => {
  const { app, promise } = await launch(async form => success(form))
  await promise; await Promise.resolve()
  assert.equal(app.events.filter(e => e.stage === 'source_selected').length, 1)
  assert.equal(app.events.find(e => e.stage === 'source_selected').source_type, 'text')
  const request = app.requests.find(r => r.path.endsWith('/analyze'))
  const confirm = app.requests.find(r => r.path.endsWith('/confirm'))
  assert.equal(confirm.data.analyze_metadata.attempt_id, request.data.get('attempt_id'))
  assert.equal(confirm.data.analyze_metadata.import_id, 7)
})

test('analysis failure never confirms or shows a gate', async () => {
  const { app, promise } = await launch(async () => { throw new Error('network') })
  await promise; app.render()
  assert.ok(!app.requests.some(r => r.path.endsWith('/confirm')))
  assert.ok(!app.events.some(e => e.stage === 'gate_shown'))
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

test('gate_shown is emitted on rendered gate, once across rerenders', async () => {
  const { app, promise } = await launch(async form => success(form, { contains_diagram: true }))
  await promise; app.render(); app.render()
  const gates = app.events.filter(e => e.stage === 'gate_shown')
  assert.equal(gates.length, 1)
  assert.equal(gates[0].gate_type, 'diagram')
  assert.equal(gates[0].import_id, 7)
  assert.equal(gates[0].display_context, 'foreground')
})

test('expanded notice, later, compact reminder and resume are tracked', () => {
  const app = mount('../src/components/SmartCreationNoticeBanner.jsx', { storedNotice: {
    kind: 'gate', gateType: 'partial', importId: 7, attemptId: 'attempt-123456789', sourceType: 'text', createdAt: Date.now(), display: 'expanded',
  } })
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
  const app = mount('../src/components/SmartCreationNoticeBanner.jsx', { storedNotice: { kind: 'ready', id: 12, importId: 7, attemptId: 'attempt-123456789' } })
  app.find(n => n.props?.onClick?.name === 'handleAction').props.onClick()
  assert.equal(app.events.at(-1).action, 'open_project')
  assert.equal(app.events.at(-1).project_id, 12)
})

test('stage allowlist cannot be overridden by event data', () => {
  assert.throws(() => tracking.buildSmartCreationProgress('arbitrary'))
  assert.equal(tracking.buildSmartCreationProgress('gate_shown', { stage: 'arbitrary' }).stage, 'gate_shown')
})
