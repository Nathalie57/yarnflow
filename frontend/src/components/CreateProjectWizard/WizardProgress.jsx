/**
 * @file WizardProgress.jsx
 * @brief Indicateur de progression (dots) pour le wizard
 * @created 2026-01-27 by [AI:Claude]
 */

const STEPS = [
  { id: 1, label: 'Catégorie' },
  { id: 2, label: 'Infos' },
  { id: 3, label: 'Sections' },
  { id: 4, label: 'Options' }
]

const WizardProgress = ({ currentStep, onStepClick, canNavigate }) => {
  return (
    <div className="flex items-center justify-center gap-2 py-4">
      {STEPS.map((step, index) => {
        const isActive = currentStep === step.id
        const isCompleted = currentStep > step.id
        const isClickable = canNavigate(step.id)

        return (
          <div key={step.id} className="flex items-center">
            <button
              type="button"
              onClick={() => isClickable && onStepClick(step.id)}
              disabled={!isClickable}
              className={`
                flex items-center justify-center w-8 h-8 rounded-full
                transition-all duration-200 font-medium text-sm
                ${isClickable ? 'cursor-pointer' : 'cursor-default'}
                ${isActive
                  ? 'bg-primary-600 text-white ring-4 ring-primary-100'
                  : isCompleted
                    ? 'bg-primary-500 text-white hover:bg-primary-600'
                    : 'bg-gray-200 text-gray-500'
                }
              `}
              title={step.label}
            >
              {isCompleted ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              ) : (
                step.id
              )}
            </button>
            {index < STEPS.length - 1 && (
              <div className={`
                w-8 h-0.5 mx-1
                ${currentStep > step.id ? 'bg-primary-500' : 'bg-gray-200'}
              `} />
            )}
          </div>
        )
      })}
    </div>
  )
}

export default WizardProgress
