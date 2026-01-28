/**
 * @file Step3Sections.jsx
 * @brief Étape 3 - Gestion des sections avec suggestions selon la catégorie
 * @created 2026-01-27 by [AI:Claude]
 */

const Step3Sections = ({ sections, onSectionsChange, selectedCategory, counterUnit }) => {
  const handleAddSection = () => {
    onSectionsChange([...sections, { name: '', description: '', total_rows: null }])
  }

  const handleRemoveSection = (index) => {
    onSectionsChange(sections.filter((_, i) => i !== index))
  }

  const handleUpdateSection = (index, field, value) => {
    const updated = [...sections]
    updated[index] = { ...updated[index], [field]: value }
    onSectionsChange(updated)
  }

  const handleApplyPreset = (preset) => {
    onSectionsChange([...preset.sections])
  }

  const presets = selectedCategory?.sectionPresets || []

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Sections du projet
        </h3>
        <p className="text-sm text-gray-600">
          Divisez votre projet en parties pour suivre chacune séparément
        </p>
      </div>

      {/* Exemples rapides selon la catégorie */}
      {presets.length > 0 && sections.length === 0 && (
        <div className="mb-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
          <p className="text-sm font-medium text-primary-800 mb-3">
            Exemples rapides :
          </p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.name}
                type="button"
                onClick={() => handleApplyPreset(preset)}
                className="px-4 py-2 bg-white border-2 border-primary-300 text-primary-700 rounded-lg hover:bg-primary-50 transition text-sm font-medium"
              >
                {preset.icon} {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Info si pas de sections */}
      {sections.length === 0 && presets.length === 0 && (
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200 text-center">
          <p className="text-gray-600 mb-2">
            Aucune section nécessaire pour ce type de projet.
          </p>
          <p className="text-xs text-gray-500">
            Ajoutez-en si votre projet comporte plusieurs parties distinctes.
          </p>
        </div>
      )}

      {/* Bouton reset si sections remplies et presets dispo */}
      {presets.length > 0 && sections.length > 0 && (
        <div className="mb-4 flex justify-end">
          <button
            type="button"
            onClick={() => onSectionsChange([])}
            className="text-xs text-gray-500 hover:text-gray-700 hover:underline"
          >
            Tout effacer
          </button>
        </div>
      )}

      {/* Liste des sections */}
      <div className="space-y-3 mb-4">
        {sections.map((section, index) => (
          <div
            key={index}
            className="p-4 bg-gray-50 rounded-lg border border-gray-200"
          >
            <div className="flex items-start gap-3">
              {/* Numéro */}
              <div className="flex-shrink-0 w-8 h-8 bg-primary-100 text-primary-700 rounded-full flex items-center justify-center font-bold text-sm">
                {index + 1}
              </div>

              {/* Champs */}
              <div className="flex-1 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input
                    type="text"
                    placeholder="Nom de la section *"
                    value={section.name}
                    onChange={(e) => handleUpdateSection(index, 'name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                  <input
                    type="number"
                    placeholder={counterUnit === 'cm' ? 'Longueur totale (cm)' : 'Nombre de rangs (optionnel)'}
                    value={section.total_rows || ''}
                    onChange={(e) => handleUpdateSection(index, 'total_rows', e.target.value ? parseFloat(e.target.value) : null)}
                    step={counterUnit === 'cm' ? '0.5' : '1'}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Description (optionnel)"
                  value={section.description || ''}
                  onChange={(e) => handleUpdateSection(index, 'description', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm"
                />
              </div>

              {/* Supprimer */}
              <button
                type="button"
                onClick={() => handleRemoveSection(index)}
                className="flex-shrink-0 p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition"
                title="Supprimer cette section"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Bouton ajouter */}
      <button
        type="button"
        onClick={handleAddSection}
        className="w-full px-4 py-3 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-primary-400 hover:text-primary-600 hover:bg-primary-50 transition flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
        </svg>
        Ajouter une section
      </button>

      {/* Conseil */}
      <p className="mt-4 text-xs text-gray-500 text-center">
        Les sections sont optionnelles. Vous pourrez en ajouter à tout moment depuis le projet.
      </p>
    </div>
  )
}

export default Step3Sections
