/**
 * @file WizardNavigation.jsx
 * @brief Boutons de navigation (Précédent/Suivant) pour le wizard
 * @created 2026-01-27 by [AI:Claude]
 */

const WizardNavigation = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onSkip,
  onSubmit,
  canGoNext,
  isSubmitting,
  submitLabel
}) => {
  const isLastStep = currentStep === totalSteps
  const isFirstStep = currentStep === 1

  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex items-center justify-between gap-3">
      {/* Bouton Précédent */}
      <div className="flex-1">
        {!isFirstStep && (
          <button
            type="button"
            onClick={onPrevious}
            className="px-4 py-2.5 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition font-medium"
          >
            ← Précédent
          </button>
        )}
      </div>

      {/* Boutons centraux */}
      <div className="flex gap-3">
        {/* Bouton Passer (étape 4 uniquement) */}
        {currentStep === 4 && onSkip && (
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="px-4 py-2.5 text-gray-600 hover:text-gray-800 transition font-medium"
          >
            Passer →
          </button>
        )}

        {/* Bouton Suivant ou Créer */}
        {isLastStep ? (
          <button
            type="button"
            onClick={onSubmit}
            disabled={isSubmitting || !canGoNext}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-primary-300"
          >
            {isSubmitting ? submitLabel : '✨ Créer le projet'}
          </button>
        ) : (
          <button
            type="button"
            onClick={onNext}
            disabled={!canGoNext}
            className="px-6 py-2.5 bg-primary-600 text-white rounded-lg font-bold hover:bg-primary-700 transition disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-4 focus:ring-primary-300"
          >
            Suivant →
          </button>
        )}
      </div>
    </div>
  )
}

export default WizardNavigation
