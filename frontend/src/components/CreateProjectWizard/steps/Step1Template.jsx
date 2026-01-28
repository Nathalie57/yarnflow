/**
 * @file Step1Template.jsx
 * @brief Étape 1 - Choix de la catégorie de projet
 * @created 2026-01-27 by [AI:Claude]
 */

import { PROJECT_CATEGORIES } from '../../../data/projectTemplates'
import TemplateCard from '../TemplateCard'

const Step1Template = ({ selectedCategory, onSelectCategory }) => {
  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Quel type de projet créez-vous ?
        </h3>
        <p className="text-sm text-gray-600">
          Choisissez une catégorie pour votre projet
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PROJECT_CATEGORIES.map((category) => (
          <TemplateCard
            key={category.id}
            template={{ icon: category.icon, name: category.value, description: category.description }}
            isSelected={selectedCategory?.id === category.id}
            onClick={() => onSelectCategory(category)}
          />
        ))}
      </div>
    </div>
  )
}

export default Step1Template
