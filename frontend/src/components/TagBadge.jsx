/**
 * @file TagBadge.jsx
 * @brief Badge pour afficher un tag de projet
 * @author Nathalie + Claude
 * @version 0.15.0
 * @date 2025-12-19
 */

import PropTypes from 'prop-types'

const TagBadge = ({ tag, onRemove, onClick, className = '' }) => {
  return (
    <span
      className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-semibold bg-gradient-to-br from-sage-100 to-sage-200 text-sage-800 border border-sage-300 shadow-sm hover:shadow-md hover:from-sage-200 hover:to-sage-300 transition-all ${
        onClick ? 'cursor-pointer' : ''
      } ${className}`}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      <span className="select-none">🏷️ {tag}</span>

      {onRemove && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            onRemove(tag)
          }}
          className="ml-1 hover:text-warm transition-colors focus:outline-none"
          aria-label={`Supprimer le tag ${tag}`}
          type="button"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-3.5 w-3.5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      )}
    </span>
  )
}

TagBadge.propTypes = {
  tag: PropTypes.string.isRequired,
  onRemove: PropTypes.func,
  onClick: PropTypes.func,
  className: PropTypes.string
}

export default TagBadge
