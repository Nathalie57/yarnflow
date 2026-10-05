import assert from 'node:assert/strict'
import test from 'node:test'
import { readFileSync } from 'node:fs'
import { canAccessJacquard } from '../src/config/features.js'

test('jacquard beta accepts admins and user 30 with numeric or string ids', () => {
  assert.equal(canAccessJacquard({ id: 8, role: 'admin', subscription_type: 'free' }), true)
  assert.equal(canAccessJacquard({ id: 30, role: 'user', subscription_type: 'free' }), true)
  assert.equal(canAccessJacquard({ id: '30', role: 'user', subscription_type: 'free' }), true)
})

test('jacquard beta refuses other PLUS, PRO and FREE users', () => {
  assert.equal(canAccessJacquard({ id: 31, role: 'user', subscription_type: 'plus' }), false)
  assert.equal(canAccessJacquard({ id: 32, role: 'user', subscription_type: 'pro' }), false)
  assert.equal(canAccessJacquard({ id: 33, role: 'user', subscription_type: 'free' }), false)
})

test('direct chart routes are guarded before chart pages can mount', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  assert.match(app, /path="\/projects\/:projectId\/charts" element=\{<JacquardRoute><ProjectCharts \/><\/JacquardRoute>\}/)
  assert.match(app, /path="\/projects\/:projectId\/charts\/:chartId" element=\{<JacquardRoute><ChartEditor \/><\/JacquardRoute>\}/)

  const guard = readFileSync(new URL('../src/components/JacquardRoute.jsx', import.meta.url), 'utf8')
  const permissionCheck = guard.indexOf('canAccessJacquard(user)')
  const childRender = guard.indexOf('return children')
  assert.ok(permissionCheck >= 0 && permissionCheck < childRender)
})

test('tools and project counter use the centralized permission without subscription access', () => {
  const tools = readFileSync(new URL('../src/pages/Tools.jsx', import.meta.url), 'utf8')
  const counter = readFileSync(new URL('../src/pages/ProjectCounter.jsx', import.meta.url), 'utf8')

  assert.match(tools, /canAccessJacquard\(user\)/)
  assert.doesNotMatch(tools, /hasActiveSubscription/)
  assert.match(tools, /badge: 'Bêta'/)
  assert.match(counter, /canAccessJacquard\(user\)/)
  assert.doesNotMatch(counter, /user\?\.id\s*===\s*30/)
})
