/**
 * @file AdminOptions.jsx
 * @brief Interface d'administration pour gérer les options de personnalisation des patrons
 * @author Superpictor Team + AI Assistants
 * @created 2025-11-13
 * @modified 2025-11-13 by [AI:Claude] - Création de l'interface admin options
 */

import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const AdminOptions = () => {
  const [optionsGrouped, setOptionsGrouped] = useState([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // create, edit
  const [selectedOption, setSelectedOption] = useState(null)

  const [formData, setFormData] = useState({
    option_key: '',
    option_group: 'dimensions',
    option_label: '',
    option_description: '',
    field_type: 'select',
    available_values: [],
    default_value: '',
    min_value: null,
    max_value: null,
    step_value: null,
    applicable_categories: null,
    applicable_levels: null,
    required_for_categories: null,
    display_order: 0,
    icon: '',
    ai_prompt_template: '',
    affects_price: false,
    price_modifier: 0,
    is_active: true,
    is_premium: false,
    help_text: '',
    placeholder: ''
  })

  const groupLabels = {
    dimensions: 'Dimensions & Ajustement',
    style: 'Style & Esthétique',
    material: 'Fil & Matériel',
    usage: 'Usage & Praticité',
    format: 'Format du patron',
    special: 'Options spéciales',
    creative: 'Personnalisation créative'
  }

  const groupIcons = {
    dimensions: '📐',
    style: '🎨',
    material: '🧶',
    usage: '🎯',
    format: '📋',
    special: '⭐',
    creative: '💡'
  }

  const fieldTypes = [
    { value: 'select', label: 'Liste déroulante' },
    { value: 'radio', label: 'Boutons radio' },
    { value: 'checkbox', label: 'Case à cocher' },
    { value: 'text', label: 'Texte court' },
    { value: 'number', label: 'Nombre' },
    { value: 'range', label: 'Curseur' },
    { value: 'textarea', label: 'Texte long' }
  ]

  useEffect(() => {
    loadOptions()
  }, [])

  const loadOptions = async () => {
    try {
      const response = await adminAPI.getPatternOptions()
      setOptionsGrouped(response.data.data)
    } catch (error) {
      console.error('Erreur chargement options:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateModal = () => {
    setModalMode('create')
    setSelectedOption(null)
    setFormData({
      option_key: '',
      option_group: 'dimensions',
      option_label: '',
      option_description: '',
      field_type: 'select',
      available_values: [],
      default_value: '',
      min_value: null,
      max_value: null,
      step_value: null,
      applicable_categories: null,
      applicable_levels: null,
      required_for_categories: null,
      display_order: 0,
      icon: '',
      ai_prompt_template: '',
      affects_price: false,
      price_modifier: 0,
      is_active: true,
      is_premium: false,
      help_text: '',
      placeholder: ''
    })
    setShowModal(true)
  }

  const openEditModal = (option) => {
    setModalMode('edit')
    setSelectedOption(option)
    setFormData({
      option_key: option.option_key,
      option_group: option.option_group,
      option_label: option.option_label,
      option_description: option.option_description || '',
      field_type: option.field_type,
      available_values: option.available_values || [],
      default_value: option.default_value || '',
      min_value: option.min_value,
      max_value: option.max_value,
      step_value: option.step_value,
      applicable_categories: option.applicable_categories,
      applicable_levels: option.applicable_levels,
      required_for_categories: option.required_for_categories,
      display_order: option.display_order || 0,
      icon: option.icon || '',
      ai_prompt_template: option.ai_prompt_template || '',
      affects_price: Boolean(option.affects_price),
      price_modifier: option.price_modifier || 0,
      is_active: Boolean(option.is_active),
      is_premium: Boolean(option.is_premium),
      help_text: option.help_text || '',
      placeholder: option.placeholder || ''
    })
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (modalMode === 'create') {
        await adminAPI.createPatternOption(formData)
        alert('Option créée avec succès')
      } else if (modalMode === 'edit') {
        await adminAPI.updatePatternOption(selectedOption.id, formData)
        alert('Option mise à jour avec succès')
      }

      setShowModal(false)
      loadOptions()
    } catch (error) {
      console.error('Erreur:', error)
      alert(error.response?.data?.message || 'Erreur lors de l\'opération')
    }
  }

  const handleDelete = async (option) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'option "${option.option_label}" ?`)) return

    try {
      await adminAPI.deletePatternOption(option.id)
      alert('Option supprimée avec succès')
      loadOptions()
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleNumberChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value === '' ? null : parseFloat(value)
    }))
  }

  const handleArrayChange = (e) => {
    const { name, value } = e.target
    // [AI:Claude] Convertir la chaîne en tableau ou null si vide
    const arrayValue = value.trim() === '' ? null : value.split(',').map(s => s.trim()).filter(s => s)
    setFormData(prev => ({ ...prev, [name]: arrayValue }))
  }

  // [AI:Claude] Gestion des valeurs disponibles (format JSON complexe)
  const [valuesText, setValuesText] = useState('')

  useEffect(() => {
    if (formData.available_values && Array.isArray(formData.available_values)) {
      const text = formData.available_values.map(v =>
        `${v.value}|${v.label}|${v.description || ''}`
      ).join('\n')
      setValuesText(text)
    } else {
      setValuesText('')
    }
  }, [showModal]) // Reset quand on ouvre/ferme le modal

  const handleValuesTextChange = (e) => {
    const text = e.target.value
    setValuesText(text)

    // [AI:Claude] Parser le texte en tableau d'objets
    const lines = text.split('\n').filter(line => line.trim())
    const values = lines.map(line => {
      const parts = line.split('|')
      return {
        value: parts[0]?.trim() || '',
        label: parts[1]?.trim() || '',
        description: parts[2]?.trim() || ''
      }
    })

    setFormData(prev => ({ ...prev, available_values: values.length > 0 ? values : [] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">⚙️ Gestion des Options de Personnalisation</h1>
        <button onClick={openCreateModal} className="btn-primary">
          ➕ Nouvelle option
        </button>
      </div>

      {/* Liste des options groupées */}
      <div className="space-y-6">
        {optionsGrouped.map((group) => (
          <div key={group.group_key} className="card">
            {/* En-tête du groupe */}
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <span className="text-4xl">{group.group_icon}</span>
              <div>
                <h2 className="text-xl font-bold">{group.group_label}</h2>
                <p className="text-sm text-gray-600">
                  {group.options.length} option{group.options.length > 1 ? 's' : ''}
                </p>
              </div>
            </div>

            {/* Options du groupe */}
            {group.options.length > 0 ? (
              <div className="space-y-3">
                {group.options.map((option) => (
                  <div key={option.id} className="p-4 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          {option.icon && <span className="text-xl">{option.icon}</span>}
                          <h3 className="font-bold text-lg">{option.option_label}</h3>
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
                            {fieldTypes.find(ft => ft.value === option.field_type)?.label || option.field_type}
                          </span>
                          {option.is_premium && (
                            <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">
                              ⭐ Premium
                            </span>
                          )}
                          {!option.is_active && (
                            <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                              ❌ Inactif
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-2">{option.option_description}</p>

                        <div className="grid grid-cols-2 gap-2 text-xs text-gray-500">
                          <div>
                            <strong>Clé:</strong> <code className="bg-white px-1 rounded">{option.option_key}</code>
                          </div>
                          {option.default_value && (
                            <div>
                              <strong>Défaut:</strong> {option.default_value}
                            </div>
                          )}
                          {option.affects_price && (
                            <div>
                              <strong>Prix:</strong> {option.price_modifier > 0 ? '+' : ''}{option.price_modifier}€
                            </div>
                          )}
                          {option.applicable_categories && (
                            <div>
                              <strong>Catégories:</strong> {option.applicable_categories.join(', ')}
                            </div>
                          )}
                        </div>

                        {option.available_values && option.available_values.length > 0 && (
                          <div className="mt-2 text-xs">
                            <strong className="text-gray-700">Valeurs:</strong>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {option.available_values.slice(0, 5).map((val, idx) => (
                                <span key={idx} className="bg-white px-2 py-1 rounded border text-gray-600">
                                  {val.label}
                                </span>
                              ))}
                              {option.available_values.length > 5 && (
                                <span className="text-gray-500">
                                  +{option.available_values.length - 5} autres
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {option.ai_prompt_template && (
                          <div className="mt-2 text-xs bg-primary-50 p-2 rounded">
                            <strong className="text-primary-700">Prompt IA:</strong>
                            <div className="text-gray-600 mt-1 font-mono text-xs">
                              {option.ai_prompt_template}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 ml-4">
                        <button
                          onClick={() => openEditModal(option)}
                          className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(option)}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                Aucune option dans ce groupe
              </p>
            )}
          </div>
        ))}
      </div>

      {optionsGrouped.length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Aucune option pour le moment</p>
          <button onClick={openCreateModal} className="btn-primary">
            Créer la première option
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'create' ? '➕ Nouvelle option' : '✏️ Modifier l\'option'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Informations de base */}
                <div className="bg-gray-50 p-4 rounded">
                  <h3 className="font-bold mb-3">📋 Informations de base</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Clé de l'option * (en anglais, snake_case)
                      </label>
                      <input
                        type="text"
                        name="option_key"
                        value={formData.option_key}
                        onChange={handleChange}
                        placeholder="ex: fit_type, color_count"
                        required
                        disabled={modalMode === 'edit'}
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Groupe *</label>
                      <select
                        name="option_group"
                        value={formData.option_group}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded"
                      >
                        {Object.entries(groupLabels).map(([key, label]) => (
                          <option key={key} value={key}>
                            {groupIcons[key]} {label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Label (affiché) *</label>
                      <input
                        type="text"
                        name="option_label"
                        value={formData.option_label}
                        onChange={handleChange}
                        placeholder="ex: Ajustement, Nombre de couleurs"
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Type de champ *</label>
                      <select
                        name="field_type"
                        value={formData.field_type}
                        onChange={handleChange}
                        required
                        className="w-full p-2 border rounded"
                      >
                        {fieldTypes.map(ft => (
                          <option key={ft.value} value={ft.value}>{ft.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">Description</label>
                      <textarea
                        name="option_description"
                        value={formData.option_description}
                        onChange={handleChange}
                        placeholder="Description de l'option"
                        rows="2"
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Icône (emoji)</label>
                      <input
                        type="text"
                        name="icon"
                        value={formData.icon}
                        onChange={handleChange}
                        placeholder="ex: 📏, 🎨, 🧶"
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Ordre d'affichage</label>
                      <input
                        type="number"
                        name="display_order"
                        value={formData.display_order}
                        onChange={handleChange}
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Valeurs disponibles */}
                {['select', 'radio', 'checkbox'].includes(formData.field_type) && (
                  <div className="bg-blue-50 p-4 rounded">
                    <h3 className="font-bold mb-3">🎯 Valeurs disponibles</h3>
                    <label className="block text-sm font-medium mb-2">
                      Format: une valeur par ligne avec value|label|description
                    </label>
                    <textarea
                      value={valuesText}
                      onChange={handleValuesTextChange}
                      placeholder="fitted|Ajusté|Près du corps&#10;regular|Normal|Ajustement standard&#10;loose|Ample|Large et décontracté"
                      rows="6"
                      className="w-full p-2 border rounded font-mono text-sm"
                    />
                    <p className="text-xs text-gray-600 mt-1">
                      Exemple: fitted|Ajusté|Près du corps
                    </p>
                  </div>
                )}

                {/* Valeurs par défaut et limites */}
                <div className="bg-green-50 p-4 rounded">
                  <h3 className="font-bold mb-3">⚙️ Valeurs et limites</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">Valeur par défaut</label>
                      <input
                        type="text"
                        name="default_value"
                        value={formData.default_value}
                        onChange={handleChange}
                        placeholder="ex: regular, auto"
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Placeholder</label>
                      <input
                        type="text"
                        name="placeholder"
                        value={formData.placeholder}
                        onChange={handleChange}
                        placeholder="Texte d'exemple dans le champ"
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    {['number', 'range'].includes(formData.field_type) && (
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Min</label>
                          <input
                            type="number"
                            name="min_value"
                            value={formData.min_value || ''}
                            onChange={handleNumberChange}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Max</label>
                          <input
                            type="number"
                            name="max_value"
                            value={formData.max_value || ''}
                            onChange={handleNumberChange}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Step</label>
                          <input
                            type="number"
                            name="step_value"
                            value={formData.step_value || ''}
                            onChange={handleNumberChange}
                            step="0.1"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </>
                    )}

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">Texte d'aide</label>
                      <input
                        type="text"
                        name="help_text"
                        value={formData.help_text}
                        onChange={handleChange}
                        placeholder="Aide contextuelle pour l'utilisateur"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Applicabilité */}
                <div className="bg-primary-50 p-4 rounded">
                  <h3 className="font-bold mb-3">🎯 Applicabilité (laisser vide = toutes)</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Catégories applicables (virgules)
                      </label>
                      <input
                        type="text"
                        name="applicable_categories"
                        value={formData.applicable_categories?.join(', ') || ''}
                        onChange={handleArrayChange}
                        placeholder="ex: hat, scarf, garment"
                        className="w-full p-2 border rounded"
                      />
                      <p className="text-xs text-gray-600 mt-1">Vide = toutes les catégories</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Niveaux applicables (virgules)
                      </label>
                      <input
                        type="text"
                        name="applicable_levels"
                        value={formData.applicable_levels?.join(', ') || ''}
                        onChange={handleArrayChange}
                        placeholder="ex: beginner, intermediate"
                        className="w-full p-2 border rounded"
                      />
                      <p className="text-xs text-gray-600 mt-1">Vide = tous les niveaux</p>
                    </div>

                    <div className="col-span-2">
                      <label className="block text-sm font-medium mb-2">
                        Obligatoire pour catégories (virgules)
                      </label>
                      <input
                        type="text"
                        name="required_for_categories"
                        value={formData.required_for_categories?.join(', ') || ''}
                        onChange={handleArrayChange}
                        placeholder="ex: garment, bag"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </div>
                </div>

                {/* Prompt IA */}
                <div className="bg-yellow-50 p-4 rounded">
                  <h3 className="font-bold mb-3">🤖 Template de prompt IA</h3>
                  <textarea
                    name="ai_prompt_template"
                    value={formData.ai_prompt_template}
                    onChange={handleChange}
                    placeholder="ex: L'ajustement doit être {label} : {description}"
                    rows="3"
                    className="w-full p-2 border rounded font-mono text-sm"
                  />
                  <p className="text-xs text-gray-600 mt-1">
                    Variables disponibles: {'{value}'}, {'{label}'}, {'{description}'}
                  </p>
                </div>

                {/* Prix et statut */}
                <div className="bg-orange-50 p-4 rounded">
                  <h3 className="font-bold mb-3">💰 Prix et statut</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="affects_price"
                        checked={formData.affects_price}
                        onChange={handleChange}
                        className="h-5 w-5"
                      />
                      <label className="text-sm font-medium">Affecte le prix</label>
                    </div>

                    {formData.affects_price && (
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Modificateur de prix (€)
                        </label>
                        <input
                          type="number"
                          name="price_modifier"
                          value={formData.price_modifier}
                          onChange={handleNumberChange}
                          step="0.01"
                          placeholder="ex: 1.50 ou -0.50"
                          className="w-full p-2 border rounded"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_premium"
                        checked={formData.is_premium}
                        onChange={handleChange}
                        className="h-5 w-5"
                      />
                      <label className="text-sm font-medium">Option premium uniquement</label>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_active"
                        checked={formData.is_active}
                        onChange={handleChange}
                        className="h-5 w-5"
                      />
                      <label className="text-sm font-medium">Option active</label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {modalMode === 'edit' ? '✅ Mettre à jour' : '➕ Créer'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="btn-secondary flex-1"
                  >
                    Annuler
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminOptions
