/**
 * @file ProjectFilters.jsx
 * @brief Barre de filtres pour projets (statut, favoris, tags, tri)
 * @author Nathalie + Claude
 * @version 0.15.0
 * @date 2025-12-19
 */

import { useState, useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import TagBadge from './TagBadge'

const ProjectFilters = ({
  onFilterChange,
  availableTags = [],
  canUseTags = false,
  onUpgradeClick,
  userPlan = 'free' // free, plus, pro
}) => {
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortBy, setSortBy] = useState('updated_desc')
  const [selectedTags, setSelectedTags] = useState([])
  const [showTagFilter, setShowTagFilter] = useState(false)
  const [showSortOptions, setShowSortOptions] = useState(false)
  const previousFiltersRef = useRef(null)

  useEffect(() => {
    // Construire les nouveaux filtres
    const newFilters = {
      status: ['all', 'favorite'].includes(activeFilter) ? null : activeFilter,
      favorite: activeFilter === 'favorite' ? true : null,
      tags: selectedTags,
      sort: sortBy
    }

    // Comparer avec les filtres précédents pour éviter les boucles infinies
    const prev = previousFiltersRef.current
    const hasChanged = !prev ||
      prev.status !== newFilters.status ||
      prev.favorite !== newFilters.favorite ||
      prev.sort !== newFilters.sort ||
      JSON.stringify(prev.tags) !== JSON.stringify(newFilters.tags)

    if (hasChanged) {
      previousFiltersRef.current = newFilters
      onFilterChange(newFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFilter, sortBy, selectedTags])

  const filters = [
    { id: 'all', label: 'Tous', icon: '📋' },
    { id: 'in_progress', label: 'En cours', icon: '🔨' },
    { id: 'completed', label: 'Terminés', icon: '✅' },
    { id: 'favorite', label: 'Favoris', icon: '⭐' }
  ]

  // Options de tri : simplifiées pour FREE, complètes pour PLUS/PRO
  const allSortOptions = [
    { value: 'updated_desc', label: 'Dernière modification', plans: ['free', 'plus', 'pro'] },
    { value: 'updated_asc', label: 'Plus anciennes modifications', plans: ['free', 'plus', 'pro'] },
    { value: 'date_desc', label: 'Plus récents', plans: ['plus', 'pro'] },
    { value: 'date_asc', label: 'Plus anciens', plans: ['plus', 'pro'] },
    { value: 'name_asc', label: 'Nom (A-Z)', plans: ['plus', 'pro'] },
    { value: 'name_desc', label: 'Nom (Z-A)', plans: ['plus', 'pro'] }
  ]

  // Filtrer selon le plan utilisateur
  const sortOptions = allSortOptions.filter(option =>
    option.plans.includes(userPlan)
  )

  const handleTagClick = (tag) => {
    if (!canUseTags) {
      onUpgradeClick?.()
      return
    }

    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    )
  }

  // Réinitialiser tous les filtres (PLUS/PRO uniquement)
  const handleResetFilters = () => {
    setActiveFilter('all')
    setSortBy('updated_desc')
    setSelectedTags([])
    setShowTagFilter(false)
  }

  // Vérifier si des filtres sont actifs
  const hasActiveFilters = activeFilter !== 'all' || sortBy !== 'updated_desc' || selectedTags.length > 0

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4 space-y-3 relative">
      {/* Bouton reset (PLUS/PRO uniquement) - Caché sur mobile si espace insuffisant */}
      {userPlan !== 'free' && (
        <div className="absolute top-3 right-3 md:top-4 md:right-4 z-10">
          <button
            onClick={handleResetFilters}
            disabled={!hasActiveFilters}
            className={`flex items-center gap-1.5 px-2 py-1 md:px-3 md:py-1.5 text-xs font-medium rounded-lg transition-all ${
              hasActiveFilters
                ? 'text-white bg-primary-600 hover:bg-primary-700 shadow-md cursor-pointer'
                : 'text-gray-400 bg-gray-100 cursor-not-allowed opacity-50'
            }`}
            title={hasActiveFilters ? "Réinitialiser tous les filtres" : "Aucun filtre actif"}
          >
            <svg className="w-3.5 h-3.5 md:w-4 md:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span className="hidden sm:inline">Réinitialiser</span>
          </button>
        </div>
      )}

      {/* Filtres de statut */}
      <div className="flex flex-wrap gap-1.5 md:gap-2">
        {filters.map((filter) => (
          <button
            key={filter.id}
            onClick={() => setActiveFilter(filter.id)}
            className={`flex items-center gap-1.5 md:gap-2 px-2.5 py-1.5 md:px-4 md:py-2 rounded-lg text-sm md:text-base transition-all ${
              activeFilter === filter.id
                ? 'bg-primary-600 text-white shadow-md hover:bg-primary-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            <span className="text-sm md:text-base">{filter.icon}</span>
            <span className="font-medium text-xs md:text-sm">{filter.label}</span>
          </button>
        ))}
      </div>

      {/* Tri - Pliable sur mobile */}
      <div className="space-y-2">
        <button
          onClick={() => setShowSortOptions(!showSortOptions)}
          className="text-sm font-medium text-gray-700 flex items-center gap-2 w-full md:cursor-default"
        >
          <span>📊</span>
          <span>Trier par :</span>
          <span className="text-xs text-gray-500">
            {sortOptions.find(opt => opt.value === sortBy)?.label}
          </span>
          <svg
            className={`w-4 h-4 ml-auto transition-transform md:hidden ${showSortOptions ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className={`flex flex-wrap gap-1.5 md:gap-2 ${showSortOptions ? '' : 'hidden md:flex'}`}>
          {sortOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                setSortBy(option.value)
                setShowSortOptions(false)
              }}
              className={`px-2.5 py-1.5 md:px-3 md:py-2 rounded-lg text-xs md:text-sm font-medium transition-all ${
                sortBy === option.value
                  ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md hover:shadow-lg'
                  : 'bg-white border border-gray-300 text-gray-700 hover:border-primary-400 hover:bg-primary-50'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tags (PLUS/PRO uniquement) - Pliable sur mobile */}
      <div className="space-y-2">
        <button
          onClick={() => {
            if (!canUseTags) {
              onUpgradeClick?.()
            } else {
              setShowTagFilter(!showTagFilter)
            }
          }}
          className={`flex items-center gap-2 text-sm font-medium w-full ${
            canUseTags ? 'text-primary' : 'text-gray-400'
          }`}
        >
          <span>🏷️</span>
          <span className="text-xs md:text-sm">{canUseTags ? 'Filtrer par tags' : 'Tags (PLUS/PRO)'}</span>
          {!canUseTags && <span className="text-xs bg-yellow-100 text-yellow-800 px-1.5 py-0.5 rounded-full">Premium</span>}
          {canUseTags && availableTags.length > 0 && (
            <svg
              className={`w-4 h-4 ml-auto transition-transform ${showTagFilter ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </button>

        {showTagFilter && canUseTags && availableTags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 md:gap-2 p-2 md:p-3 bg-sage/5 rounded-lg">
            {availableTags.map((tag) => (
              <TagBadge
                key={tag.tag_name}
                tag={`${tag.tag_name} (${tag.count})`}
                onClick={() => handleTagClick(tag.tag_name)}
                className={selectedTags.includes(tag.tag_name) ? 'bg-primary text-white' : ''}
              />
            ))}
          </div>
        )}

        {selectedTags.length > 0 && (
          <div className="flex items-start md:items-center gap-2 flex-col md:flex-row">
            <span className="text-xs text-gray-500 whitespace-nowrap">Tags actifs:</span>
            <div className="flex flex-wrap gap-1">
              {selectedTags.map((tag) => (
                <TagBadge
                  key={tag}
                  tag={tag}
                  onRemove={() => handleTagClick(tag)}
                  className="bg-primary text-white"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

ProjectFilters.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  availableTags: PropTypes.arrayOf(
    PropTypes.shape({
      tag_name: PropTypes.string.isRequired,
      count: PropTypes.number.isRequired
    })
  ),
  canUseTags: PropTypes.bool,
  onUpgradeClick: PropTypes.func,
  userPlan: PropTypes.oneOf(['free', 'plus', 'pro'])
}

export default ProjectFilters
