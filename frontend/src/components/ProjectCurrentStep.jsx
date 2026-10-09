import { sectionIsCompleted } from '../utils/projectJourney'

export function CurrentStepProgress({ current, total, unit, unitLabel, locale }) {
  const format = value => new Intl.NumberFormat(locale, { maximumFractionDigits: unit === 'cm' ? 1 : 0 }).format(
    unit === 'cm' ? Number(value) || 0 : Math.floor(Number(value) || 0))
  return (
    <span className="inline-flex items-baseline justify-center gap-1 whitespace-nowrap">
      <span>{format(current)}</span>
      {Number(total) > 0 && <span className="text-sm sm:text-lg font-semibold text-primary-800"> / {format(total)} {unitLabel}</span>}
    </span>
  )
}

export default function ProjectCurrentStep({ section, nextSection, children, renderInstructions, onInstructionsScroll, t, busy, onToggleComplete, onContinue, onFinishProject, projectCompleted, prioritizeControls = false }) {
  if (!section) return <>{children}</>
  const completed = sectionIsCompleted(section)
  const status = completed ? (
    <>
      <p className="text-sm font-semibold text-primary-900 mb-2">{t('ui.journeyDone')} ✓</p>
      {nextSection ? (
        <button type="button" disabled={busy} onClick={() => onContinue(nextSection.id)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-control text-sm font-semibold">
          {t('ui.journeyContinue', { name: nextSection.name })}
        </button>
      ) : !projectCompleted && (
        <button type="button" disabled={busy} onClick={onFinishProject} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-control text-sm font-semibold">
          {t('ui.journeyFinishProject')}
        </button>
      )}
      <button type="button" disabled={busy} onClick={event => onToggleComplete(section, event)} className="block mt-3 text-xs text-gray-600 hover:underline disabled:opacity-50">
        {t('ui.reopenSection')}
      </button>
    </>
  ) : (
    <>
      <button type="button" disabled={busy} onClick={event => onToggleComplete(section, event)} className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 text-white rounded-control text-sm font-semibold">
        {t(section.progression_type === 'action' ? 'ui.journeyActionDone' : 'ui.journeyFinishStep')}
      </button>
      {nextSection && <p className="text-sm font-medium text-primary-900 mt-4 pl-3 border-l-2 border-primary-300">{t('ui.journeyNext', { name: nextSection.name })}</p>}
    </>
  )

  return (
    <section className="bg-white border border-primary-200 rounded-card shadow-sm mb-4 overflow-hidden" aria-labelledby="current-step-title">
      <div className="p-4 sm:p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary-700">{t('ui.journeyNow')}</p>
        <h2 id="current-step-title" className="text-xl font-semibold text-flow-ink mt-1 mb-3">{section.name}</h2>
        {!prioritizeControls && !completed && section.description && (
          <div className="text-sm text-gray-700 leading-relaxed max-h-[45vh] overflow-y-auto" onScroll={onInstructionsScroll}>{renderInstructions(section.description)}</div>
        )}
      </div>
      {children}
      {completed && <div className="px-4 sm:px-5 py-4 border-t border-primary-100" aria-live="polite">{status}</div>}
      {(prioritizeControls || completed) && section.description && (
        <div className="px-4 sm:px-5 pb-4 text-sm text-gray-700 leading-relaxed max-h-[45vh] overflow-y-auto" onScroll={onInstructionsScroll}>
          {renderInstructions(section.description)}
        </div>
      )}
      {!completed && <div className="px-4 sm:px-5 py-4 border-t border-primary-100" aria-live="polite">{status}</div>}
    </section>
  )
}
