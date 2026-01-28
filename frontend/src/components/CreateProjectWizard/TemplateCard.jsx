/**
 * @file TemplateCard.jsx
 * @brief Carte de template cliquable pour le wizard
 * @created 2026-01-27 by [AI:Claude]
 */

const TemplateCard = ({ template, isSelected, onClick }) => {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        w-full p-4 rounded-xl border-2 transition-all duration-200
        flex flex-col items-center text-center
        hover:shadow-md hover:border-primary-400
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        ${isSelected
          ? 'border-primary-600 bg-primary-50 shadow-md'
          : 'border-gray-200 bg-white hover:bg-gray-50'
        }
      `}
    >
      <span className="text-4xl mb-2">{template.icon}</span>
      <span className={`font-semibold text-sm ${isSelected ? 'text-primary-700' : 'text-gray-900'}`}>
        {template.name}
      </span>
      <span className="text-xs text-gray-500 mt-1 line-clamp-2">
        {template.description}
      </span>
      {isSelected && (
        <span className="mt-2 text-xs font-medium text-primary-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
          Sélectionné
        </span>
      )}
    </button>
  )
}

export default TemplateCard
