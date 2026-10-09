import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const wizard = fs.readFileSync(new URL('../src/components/CreateProjectWizard/index.jsx', import.meta.url), 'utf8')
const projects = fs.readFileSync(new URL('../src/pages/MyProjects.jsx', import.meta.url), 'utf8')
const counter = fs.readFileSync(new URL('../src/pages/ProjectCounter.jsx', import.meta.url), 'utf8')
const migration = fs.readFileSync(new URL('../../backend/database/migrations/add_rounds_section_counter_unit.sql', import.meta.url), 'utf8')
const counterFr = JSON.parse(fs.readFileSync(new URL('../src/i18n/locales/fr/counter.json', import.meta.url), 'utf8'))
const counterEn = JSON.parse(fs.readFileSync(new URL('../src/i18n/locales/en/counter.json', import.meta.url), 'utf8'))

test('manual wizard exposes rows, rounds and cm per section and keeps a blank target', () => {
  assert.match(wizard, /option value="rows"/)
  assert.match(wizard, /option value="rounds"/)
  assert.match(wizard, /option value="cm"/)
  assert.match(wizard, /total_rows: s\.total_rows \? Number/)
  assert.match(wizard, /counter_unit: s\.counter_unit \|\| counterUnit/)
  assert.match(wizard, /sectionDetails\]/)
})

test('manual project creation sends the section unit to the real API path', () => {
  assert.match(projects, /counter_unit: sections\[i\]\.counter_unit \|\| formData\.counter_unit \|\| 'rows'/)
  assert.match(projects, /newProject\.id.*sections/)
})

test('section add and edit form preserves units and optional targets', () => {
  assert.match(counter, /sectionCounterUnit/)
  assert.match(counter, /option value="rounds"/)
  assert.match(counter, /sectionTargetOptional/)
  assert.match(counter, /sectionData\.counter_unit = sectionForm\.counter_unit \|\| 'rows'/)
  assert.match(counter, /total_rows: sectionForm\.total_rows \? Number/)
})

test('successful section management synchronizes silently while errors remain visible', () => {
  const saveStart = counter.indexOf('const handleSaveSection')
  const notesStart = counter.indexOf('const saveSectionNotes')
  const deleteStart = counter.indexOf('const handleDeleteSection')
  const toggleStart = counter.indexOf('const handleToggleSectionComplete')
  const saveHandler = counter.slice(saveStart, notesStart)
  const notesHandler = counter.slice(notesStart, deleteStart)
  const toggleHandler = counter.slice(toggleStart, counter.indexOf('const handleAllSectionsCompleted'))

  assert.match(saveHandler, /await fetchProject\(\)/)
  assert.match(saveHandler, /await fetchSections/)
  assert.match(saveHandler, /setShowAddSectionModal\(false\)/)
  assert.doesNotMatch(saveHandler, /type: 'success'/)
  assert.match(saveHandler, /sectionSaveFailed/)

  assert.match(notesHandler, /setSections\(prevSections/)
  assert.doesNotMatch(notesHandler, /type: 'success'/)
  assert.match(notesHandler, /notesSaveFailed/)

  assert.match(toggleHandler, /await fetchSections\(\)/)
  assert.match(toggleHandler, /await fetchProject\(\)/)
  assert.doesNotMatch(toggleHandler, /type: 'success'/)
  assert.match(toggleHandler, /updateFailed/)
})

test('section completion never opens a success popup but project completion remains', () => {
  const automaticStart = counter.indexOf('const handleAutomaticSectionCompletion')
  const incrementStart = counter.indexOf('const handleIncrementRow')
  const automaticHandler = counter.slice(automaticStart, incrementStart)
  const toggleStart = counter.indexOf('const handleToggleSectionComplete')
  const projectCompletionStart = counter.indexOf('const handleAllSectionsCompleted')
  const manualHandler = counter.slice(toggleStart, projectCompletionStart)
  const projectCompletionUi = counter.slice(counter.indexOf('{showProjectCompletionModal &&'))

  assert.match(automaticHandler, /await handleEndSession\(maxRows\)/)
  assert.match(automaticHandler, /setSections\(prev/)
  assert.doesNotMatch(automaticHandler, /showAlert/)
  assert.doesNotMatch(manualHandler, /type: 'success'/)
  assert.match(projectCompletionUi, /FlowMascot pose="heureux"/)
})

test('guided project labels use step vocabulary and concise remaining progress', () => {
  assert.equal(counterFr.ui.flowRoundsLeft, 'Encore {{count}} tours')
  assert.equal(counterFr.ui.journeyDone, 'Étape terminée')
  assert.equal(counterFr.ui.sectionsTitle, 'Étapes')
  assert.equal(counterEn.ui.flowRoundsLeft, '{{count}} more rounds')
  assert.equal(counterEn.ui.journeyDone, 'Step completed')
  assert.equal(counterEn.ui.sectionsTitle, 'Steps')
})

test('manual Flow access is not blocked when the project has no imported pattern', () => {
  const openHandler = counter.slice(counter.indexOf('const handleOpenAiHelp'), counter.indexOf('const handleCounterClick'))
  assert.doesNotMatch(openHandler, /setShowAssociatePatternModal/)
  assert.match(openHandler, /openWithProject\(projectId/)
})

test('rounds migration covers section counters and the sectionless project counter', () => {
  assert.match(migration, /ALTER TABLE project_sections/)
  assert.match(migration, /ALTER TABLE projects/)
  assert.equal((migration.match(/ENUM\('rows', 'rounds', 'cm'\)/g) || []).length, 2)
})
