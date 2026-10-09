import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { liveProjectTime } from '../src/utils/projectTime.js'

const counterSource = readFileSync(new URL('../src/pages/ProjectCounter.jsx', import.meta.url), 'utf8')
const counterFr = JSON.parse(readFileSync(new URL('../src/i18n/locales/fr/counter.json', import.meta.url), 'utf8'))
const counterEn = JSON.parse(readFileSync(new URL('../src/i18n/locales/en/counter.json', import.meta.url), 'utf8'))

test('live project total includes the active session', () => {
  assert.equal(liveProjectTime(3600, 125, true), 3725)
})

test('paused session remains included without changing the calculation rule', () => {
  assert.equal(liveProjectTime(3600, 125, true), 3725)
  assert.equal(liveProjectTime(3600, 125, true), 3725)
})

test('recorded session is not counted twice after refresh', () => {
  const beforeSave = liveProjectTime(3600, 125, true)
  const afterSave = liveProjectTime(3725, 0, false)

  assert.equal(beforeSave, 3725)
  assert.equal(afterSave, 3725)
})

test('stopped session is never added to a persisted total', () => {
  assert.equal(liveProjectTime(3725, 125, false), 3725)
})

test('invalid or absent stored durations safely start at zero', () => {
  assert.equal(liveProjectTime(null, 10, true), 10)
  assert.equal(liveProjectTime('invalid', -5, true), 0)
})

test('mobile timer presents session and live project total while desktop remains unchanged', () => {
  assert.match(counterSource, /liveProjectTime\(\s*project\?\.total_time,\s*elapsedTime,\s*Boolean\(sessionId && isTimerRunning\)/s)
  assert.match(counterSource, /className="sm:hidden text-center border-l[^>]+>[\s\S]+ui\.projectTotalTime/)
  assert.match(counterSource, /hidden sm:block text-center border-l/)
  assert.equal(counterFr.ui.projectTotalTime, 'Total ouvrage')
  assert.equal(counterEn.ui.projectTotalTime, 'Project total')
})

test('per-step duration remains available as a secondary mobile option', () => {
  assert.match(counterSource, /!isFocusMode && showMoreOptions[\s\S]+ui\.stepTime/)
  assert.equal(counterFr.ui.stepTime, "Temps de l'étape")
  assert.equal(counterEn.ui.stepTime, 'Step time')
})
