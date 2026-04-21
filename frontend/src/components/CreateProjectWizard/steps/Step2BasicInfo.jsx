/**
 * @file Step2BasicInfo.jsx
 * @brief Étape 2 - Informations de base du projet (nom, technique, unité)
 * @created 2026-01-27 by [AI:Claude]
 */

const Step2BasicInfo = ({ formData, onFormChange }) => {
  const handleChange = (field, value) => {
    onFormChange({ ...formData, [field]: value })
  }

  return (
    <div className="p-6 space-y-5">
      {/* Nom du projet */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Nom du projet <span className="text-red-600">*</span>
        </label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
          placeholder="Ex: Bonnet slouchy rouge"
          autoFocus
        />
        {formData.name && formData.name.length < 2 && (
          <p className="mt-1 text-xs text-red-500">Le nom doit contenir au moins 2 caractères</p>
        )}
      </div>

      {/* Technique */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Technique <span className="text-red-600">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('technique', 'crochet')}
            className={`
              px-4 py-3 rounded-lg border-2 font-medium transition
              flex items-center justify-center gap-2
              ${formData.technique === 'crochet'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <span className="text-xl">🪡</span>
            <span>Crochet</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('technique', 'tricot')}
            className={`
              px-4 py-3 rounded-lg border-2 font-medium transition
              flex items-center justify-center gap-2
              ${formData.technique === 'tricot'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <span className="text-xl">🧶</span>
            <span>Tricot</span>
          </button>
        </div>
      </div>

      {/* Unité de comptage */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Unité de comptage
        </label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleChange('counter_unit', 'rows')}
            className={`
              px-4 py-3 rounded-lg border-2 font-medium transition
              flex items-center justify-center gap-2
              ${formData.counter_unit === 'rows'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <span className="text-xl">📏</span>
            <span>Rangs (entiers)</span>
          </button>
          <button
            type="button"
            onClick={() => handleChange('counter_unit', 'cm')}
            className={`
              px-4 py-3 rounded-lg border-2 font-medium transition
              flex items-center justify-center gap-2
              ${formData.counter_unit === 'cm'
                ? 'border-primary-600 bg-primary-50 text-primary-700'
                : 'border-gray-300 hover:border-gray-400'
              }
            `}
          >
            <span className="text-xl">📐</span>
            <span>Centimètres (0.5)</span>
          </button>
        </div>
        <p className="mt-2 text-xs text-gray-500">
          Choisissez comment vous voulez compter votre progression
        </p>
      </div>
    </div>
  )
}

export default Step2BasicInfo
