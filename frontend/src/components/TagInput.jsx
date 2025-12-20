/**
 * @file TagInput.jsx
 * @brief Input pour ajouter des tags avec autocomplete
 * @author Nathalie + Claude
 * @version 0.15.0
 * @date 2025-12-19
 */

import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import TagBadge from './TagBadge'

const TagInput = ({ tags, onAddTag, onRemoveTag, suggestions = [], placeholder = 'Ajouter un tag...' }) => {
  const [inputValue, setInputValue] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filteredSuggestions, setFilteredSuggestions] = useState([])
  const inputRef = useRef(null)

  useEffect(() => {
    if (inputValue.length >= 2) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(suggestion)
      )
      setFilteredSuggestions(filtered)
      setShowSuggestions(filtered.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }, [inputValue, suggestions, tags])

  const handleAddTag = (tag) => {
    const cleanTag = tag.trim().toLowerCase()

    // Validation
    if (cleanTag.length < 2 || cleanTag.length > 50) {
      return
    }

    if (!/^[a-z0-9\s\-éèêàâôûç]+$/i.test(cleanTag)) {
      return
    }

    if (tags.includes(cleanTag)) {
      return
    }

    onAddTag(cleanTag)
    setInputValue('')
    setShowSuggestions(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      if (inputValue.trim()) {
        handleAddTag(inputValue)
      }
    }
  }

  const handleSuggestionClick = (suggestion) => {
    handleAddTag(suggestion)
    inputRef.current?.focus()
  }

  return (
    <div className="space-y-2">
      {/* Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2 && filteredSuggestions.length > 0) {
              setShowSuggestions(true)
            }
          }}
          onBlur={() => {
            // Délai pour permettre le clic sur les suggestions
            setTimeout(() => setShowSuggestions(false), 200)
          }}
          placeholder={placeholder}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        {/* Suggestions autocomplete */}
        {showSuggestions && (
          <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2 text-left hover:bg-sage/10 transition-colors text-sm"
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tags existants */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {tags.map((tag, index) => (
            <TagBadge key={index} tag={tag} onRemove={onRemoveTag} />
          ))}
        </div>
      )}

      {/* Aide */}
      <p className="text-xs text-gray-500">
        Appuyez sur Entrée ou virgule pour ajouter un tag (2-50 caractères)
      </p>
    </div>
  )
}

TagInput.propTypes = {
  tags: PropTypes.arrayOf(PropTypes.string).isRequired,
  onAddTag: PropTypes.func.isRequired,
  onRemoveTag: PropTypes.func.isRequired,
  suggestions: PropTypes.arrayOf(PropTypes.string),
  placeholder: PropTypes.string
}

export default TagInput
