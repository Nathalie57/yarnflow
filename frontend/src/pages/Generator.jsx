import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { patternsAPI, categoriesAPI, patternOptionsAPI } from '../services/api'

const Generator = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [categoriesLoading, setCategoriesLoading] = useState(true)
  const [optionsLoading, setOptionsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [priceInfo, setPriceInfo] = useState(null)
  const [step, setStep] = useState(1)
  const [categories, setCategories] = useState({})
  const [optionsGrouped, setOptionsGrouped] = useState([])
  const [expandedGroups, setExpandedGroups] = useState({})

  const [formData, setFormData] = useState({
    type: '',
    subtype: '',
    level: '',
    size: '',
    specificRequest: '',
    custom_options: {}
  })

  // [AI:Claude] Chargement des catégories depuis la base de données
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await categoriesAPI.getAll()
        setCategories(response.data.data)
      } catch (err) {
        console.error('Erreur chargement catégories:', err)
        setError('Erreur lors du chargement des catégories')
      } finally {
        setCategoriesLoading(false)
      }
    }
    loadCategories()
  }, [])


  const levels = [
    { value: 'beginner', label: 'Débutant', description: 'Mailles de base, instructions détaillées', icon: '⭐' },
    { value: 'intermediate', label: 'Intermédiaire', description: 'Techniques variées, assemblage', icon: '⭐⭐' },
    { value: 'advanced', label: 'Avancé', description: 'Techniques complexes, création libre', icon: '⭐⭐⭐' }
  ]

  const handleCategorySelect = (type) => {
    setFormData({
      ...formData,
      type,
      subtype: '',
      size: categories[type]?.sizes?.[0] || ''
    })
    setStep(2)
  }

  const handleSubtypeSelect = (subtype) => {
    setFormData({ ...formData, subtype })
    setStep(3)
  }

  const handleLevelSelect = (level) => {
    setFormData({ ...formData, level })
    setStep(4)
  }

  // [AI:Claude] Passer à l'étape 5 (personnalisation)
  const goToCustomization = () => {
    setStep(5)
  }

  // [AI:Claude] Passer directement à l'étape finale
  const skipCustomization = () => {
    setStep(6)
  }

  // [AI:Claude] Charger les options de personnalisation quand on arrive à l'étape 5
  useEffect(() => {
    if (step === 5 && formData.type && formData.level) {
      loadOptions()
    }
  }, [step, formData.type, formData.level])

  const loadOptions = async () => {
    setOptionsLoading(true)
    try {
      const response = await patternOptionsAPI.getAll({
        category: formData.type,
        level: formData.level
      })
      setOptionsGrouped(response.data.data)
      // [AI:Claude] Ouvrir le premier groupe par défaut
      if (response.data.data.length > 0) {
        setExpandedGroups({ [response.data.data[0].group_key]: true })
      }
    } catch (err) {
      console.error('Erreur chargement options:', err)
    } finally {
      setOptionsLoading(false)
    }
  }

  // [AI:Claude] Toggle d'un groupe d'options
  const toggleGroup = (groupKey) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupKey]: !prev[groupKey]
    }))
  }

  // [AI:Claude] Gérer le changement d'une option
  const handleOptionChange = (optionKey, value) => {
    setFormData(prev => ({
      ...prev,
      custom_options: {
        ...prev.custom_options,
        [optionKey]: value
      }
    }))
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
    setError(null)
  }

  // [AI:Claude] Génération asynchrone avec polling du status
  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      // [AI:Claude] Lancer la génération (retourne immédiatement)
      const response = await patternsAPI.generate(formData)
      const { pattern_id } = response.data.data

      // [AI:Claude] Rediriger vers la page de patterns avec polling
      navigate(`/patterns?generating=${pattern_id}`)
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur lors de la génération du patron')
      setLoading(false)
    }
  }

  // Calculer le prix quand type et level changent
  useEffect(() => {
    if (!formData.type || !formData.level) return

    const fetchPrice = async () => {
      try {
        const response = await patternsAPI.calculatePrice({
          type: formData.type,
          level: formData.level
        })
        setPriceInfo(response.data.data)
      } catch (err) {
        console.error('Erreur calcul prix:', err)
      }
    }
    fetchPrice()
  }, [formData.type, formData.level])

  const resetSelection = () => {
    setFormData({
      type: '',
      subtype: '',
      level: '',
      size: '',
      specificRequest: '',
      custom_options: {}
    })
    setStep(1)
    setPriceInfo(null)
    setOptionsGrouped([])
    setExpandedGroups({})
  }

  // [AI:Claude] Afficher un loader pendant le chargement des catégories
  if (categoriesLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
        <p className="text-gray-600">Chargement des catégories...</p>
      </div>
    )
  }

  // [AI:Claude] Afficher une erreur si les catégories n'ont pas pu être chargées
  if (Object.keys(categories).length === 0 && !categoriesLoading) {
    return (
      <div className="card text-center py-12">
        <p className="text-red-600 mb-4">Impossible de charger les catégories.</p>
        <p className="text-gray-600 mb-4">Veuillez vérifier que la base de données contient des catégories actives.</p>
        <button onClick={() => window.location.reload()} className="btn-primary">
          Réessayer
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Titre avec badge BETA proéminent */}
      <div className="flex flex-wrap justify-between items-center mb-6 gap-4">
        <div className="flex items-center gap-3">
          <h1 className="text-3xl font-bold">🤖 Générateur de Patrons IA</h1>
          <span className="bg-orange-500 text-white px-4 py-2 rounded-full font-bold text-lg animate-pulse">
            🧪 BETA
          </span>
        </div>
        {step > 1 && (
          <button onClick={resetSelection} className="text-primary-600 hover:underline">
            ← Recommencer
          </button>
        )}
      </div>

      {/* Disclaimer Beta - v0.8.0 TRACKER-FIRST */}
      <div className="card bg-orange-50 border-2 border-orange-400 mb-6">
        <div className="flex items-start gap-3">
          <span className="text-3xl">🧪</span>
          <div className="flex-1">
            <h3 className="font-bold text-orange-900 mb-3 text-lg">Fonctionnalité BETA - En cours de validation</h3>
            <p className="text-sm text-orange-900 mb-2">
              <strong>⚠️ Important :</strong> Le générateur de patrons IA est en phase de test.
              Les patrons générés peuvent contenir des erreurs ou des imprécisions.
            </p>
            <p className="text-sm text-orange-800 mb-3">
              <strong>Recommandation :</strong> Vérifiez attentivement les instructions avant de commencer.
              Si vous trouvez des problèmes, merci de nous les signaler pour nous aider à améliorer la qualité !
            </p>
            <div className="bg-purple-100 border-l-4 border-purple-500 p-3 rounded">
              <p className="text-sm text-purple-900">
                💡 <strong>Vous cherchez juste à suivre vos projets ?</strong> Allez sur{' '}
                <a href="/my-projects" className="underline font-bold">Mes Projets</a> pour utiliser le tracker de rangs
                (notre fonctionnalité principale, 100% fiable) !
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Indicateur de progression */}
      <div className="card mb-6">
        <div className="flex items-center justify-between overflow-x-auto">
          {['Catégorie', 'Style', 'Niveau', 'Détails', 'Personnalisation', 'Génération'].map((label, index) => (
            <div key={label} className="flex items-center flex-1 min-w-0">
              <div className={`flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0 ${
                step > index + 1 ? 'bg-green-500 text-white' :
                step === index + 1 ? 'bg-primary-500 text-white' :
                'bg-gray-200 text-gray-500'
              }`}>
                {step > index + 1 ? '✓' : index + 1}
              </div>
              <span className={`ml-2 text-xs md:text-sm font-medium truncate ${
                step === index + 1 ? 'text-primary-600' : 'text-gray-500'
              }`}>
                {label}
              </span>
              {index < 5 && (
                <div className={`flex-1 h-1 mx-2 md:mx-4 flex-shrink ${
                  step > index + 1 ? 'bg-green-500' : 'bg-gray-200'
                }`} />
              )}
            </div>
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ÉTAPE 1 : Catégorie principale */}
        {step === 1 && (
          <div className="card">
            <h2 className="text-2xl font-bold mb-4">Choisissez une catégorie</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {Object.entries(categories).map(([key, cat]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleCategorySelect(key)}
                  className="flex flex-col items-center p-6 border-2 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <span className="text-5xl mb-3">{cat.icon}</span>
                  <span className="font-bold text-lg">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 2 : Sous-catégorie */}
        {step === 2 && formData.type && categories[formData.type] && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">
                {categories[formData.type].icon} {categories[formData.type].label}
              </h2>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-primary-600 hover:underline text-sm"
              >
                ← Changer de catégorie
              </button>
            </div>
            <p className="text-gray-600 mb-4">Choisissez un style spécifique</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories[formData.type].subtypes && Object.entries(categories[formData.type].subtypes).map(([key, subtype]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleSubtypeSelect(key)}
                  className="text-left p-4 border-2 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition"
                >
                  <div className="font-bold text-lg mb-1">{subtype.label}</div>
                  <div className="text-sm text-gray-600">{subtype.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 3 : Niveau */}
        {step === 3 && formData.subtype && (
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold">Choisissez votre niveau</h2>
              <button
                type="button"
                onClick={() => setStep(2)}
                className="text-primary-600 hover:underline text-sm"
              >
                ← Changer de style
              </button>
            </div>
            <div className="space-y-4">
              {levels.map((level) => (
                <button
                  key={level.value}
                  type="button"
                  onClick={() => handleLevelSelect(level.value)}
                  className="w-full text-left p-4 border-2 rounded-lg hover:border-primary-500 hover:bg-primary-50 transition flex items-start"
                >
                  <span className="text-2xl mr-4">{level.icon}</span>
                  <div>
                    <div className="font-bold text-lg">{level.label}</div>
                    <div className="text-sm text-gray-600">{level.description}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ÉTAPE 4 : Détails finaux */}
        {step === 4 && formData.level && (
          <>
            {/* Récapitulatif de la sélection */}
            <div className="card bg-primary-50">
              <h3 className="font-bold mb-3">Votre sélection :</h3>
              <div className="flex flex-wrap gap-3">
                <span className="px-4 py-2 bg-white rounded-full text-sm font-medium">
                  {categories[formData.type]?.icon} {categories[formData.type]?.label}
                </span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-medium">
                  {categories[formData.type]?.subtypes?.[formData.subtype]?.label}
                </span>
                <span className="px-4 py-2 bg-white rounded-full text-sm font-medium">
                  {levels.find(l => l.value === formData.level)?.label}
                </span>
              </div>
            </div>

            {/* Taille */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Taille</h2>
              <select
                name="size"
                value={formData.size}
                onChange={handleChange}
                required
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {categories[formData.type]?.sizes?.map(size => (
                  <option key={size} value={size}>
                    {size.toUpperCase()}
                  </option>
                ))}
              </select>
            </div>

            {/* Demande spécifique */}
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Demande spécifique (optionnel)</h2>
              <textarea
                name="specificRequest"
                value={formData.specificRequest}
                onChange={handleChange}
                rows="4"
                placeholder={`Exemple : Je voudrais ${categories[formData.type]?.subtypes?.[formData.subtype]?.label?.toLowerCase() || 'ce patron'} avec des motifs de fleurs...`}
                className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>

            {/* Prix estimé */}
            {priceInfo && priceInfo.total !== undefined && (
              <div className="card bg-primary-50 border-2 border-primary-200">
                <h2 className="text-xl font-bold mb-4">💰 Prix estimé</h2>
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {priceInfo.total.toFixed(2)} €
                </div>
                {priceInfo.is_free && (
                  <p className="text-green-600 font-medium text-lg mb-4">
                    ✓ Gratuit avec votre quota actuel
                  </p>
                )}
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div>Prix de base : {priceInfo.base_price?.toFixed(2)} €</div>
                  <div>Multiplicateur type : ×{priceInfo.type_multiplier}</div>
                  <div>Multiplicateur niveau : ×{priceInfo.level_multiplier}</div>
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={goToCustomization}
                className="btn-primary flex-1 text-lg py-4"
              >
                ⚙️ Personnaliser davantage
              </button>
              <button
                type="button"
                onClick={skipCustomization}
                className="btn-secondary flex-1 text-lg py-4"
              >
                Passer cette étape →
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE 5 : Personnalisation (optionnel) */}
        {step === 5 && (
          <>
            <div className="card bg-purple-50">
              <h2 className="text-2xl font-bold mb-2">⚙️ Personnalisation avancée</h2>
              <p className="text-gray-600">
                Affinez votre patron selon vos préférences. Toutes ces options sont optionnelles !
              </p>
            </div>

            {optionsLoading ? (
              <div className="card text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4 mx-auto"></div>
                <p className="text-gray-600">Chargement des options...</p>
              </div>
            ) : optionsGrouped.length === 0 ? (
              <div className="card text-center py-12">
                <p className="text-gray-500">Aucune option de personnalisation disponible pour cette catégorie.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {optionsGrouped.map((group) => (
                  <div key={group.group_key} className="card">
                    {/* En-tête du groupe (accordéon) */}
                    <button
                      type="button"
                      onClick={() => toggleGroup(group.group_key)}
                      className="w-full flex items-center justify-between p-4 hover:bg-gray-50 rounded transition"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{group.group_icon}</span>
                        <span className="font-bold text-lg">{group.group_label}</span>
                        <span className="text-sm text-gray-500">({group.options.length} option{group.options.length > 1 ? 's' : ''})</span>
                      </div>
                      <span className="text-2xl">{expandedGroups[group.group_key] ? '▼' : '▶'}</span>
                    </button>

                    {/* Contenu du groupe */}
                    {expandedGroups[group.group_key] && (
                      <div className="px-4 pb-4 space-y-4">
                        {group.options.map((option) => (
                          <div key={option.option_key} className="border-t pt-4">
                            <label className="block">
                              <div className="flex items-center gap-2 mb-2">
                                {option.icon && <span>{option.icon}</span>}
                                <span className="font-medium">{option.option_label}</span>
                                {option.is_premium && (
                                  <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded">⭐ Premium</span>
                                )}
                              </div>
                              {option.option_description && (
                                <p className="text-sm text-gray-600 mb-2">{option.option_description}</p>
                              )}

                              {/* Render selon le type de champ */}
                              {option.field_type === 'select' && (
                                <select
                                  value={formData.custom_options[option.option_key] || option.default_value || ''}
                                  onChange={(e) => handleOptionChange(option.option_key, e.target.value)}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
                                >
                                  <option value="">-- Choisir --</option>
                                  {option.available_values?.map((val) => (
                                    <option key={val.value} value={val.value}>
                                      {val.label}
                                    </option>
                                  ))}
                                </select>
                              )}

                              {option.field_type === 'radio' && option.available_values && (
                                <div className="space-y-2">
                                  {option.available_values.map((val) => (
                                    <label key={val.value} className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="radio"
                                        name={option.option_key}
                                        value={val.value}
                                        checked={formData.custom_options[option.option_key] === val.value}
                                        onChange={(e) => handleOptionChange(option.option_key, e.target.value)}
                                        className="mt-1"
                                      />
                                      <div>
                                        <div className="font-medium">{val.label}</div>
                                        {val.description && (
                                          <div className="text-sm text-gray-500">{val.description}</div>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {option.field_type === 'text' && (
                                <input
                                  type="text"
                                  value={formData.custom_options[option.option_key] || ''}
                                  onChange={(e) => handleOptionChange(option.option_key, e.target.value)}
                                  placeholder={option.placeholder || ''}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
                                />
                              )}

                              {option.field_type === 'number' && (
                                <input
                                  type="number"
                                  value={formData.custom_options[option.option_key] || ''}
                                  onChange={(e) => handleOptionChange(option.option_key, e.target.value)}
                                  min={option.min_value}
                                  max={option.max_value}
                                  step={option.step_value}
                                  placeholder={option.placeholder || ''}
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
                                />
                              )}

                              {option.field_type === 'range' && (
                                <div>
                                  <input
                                    type="range"
                                    value={formData.custom_options[option.option_key] || option.default_value || option.min_value || 0}
                                    onChange={(e) => handleOptionChange(option.option_key, e.target.value)}
                                    min={option.min_value}
                                    max={option.max_value}
                                    step={option.step_value}
                                    className="w-full"
                                  />
                                  <div className="text-center text-sm text-gray-600 mt-1">
                                    {formData.custom_options[option.option_key] || option.default_value || option.min_value}
                                  </div>
                                </div>
                              )}

                              {option.field_type === 'textarea' && (
                                <textarea
                                  value={formData.custom_options[option.option_key] || ''}
                                  onChange={(e) => handleOptionChange(option.option_key, e.target.value)}
                                  placeholder={option.placeholder || ''}
                                  rows="3"
                                  className="w-full p-2 border rounded focus:ring-2 focus:ring-primary-500"
                                />
                              )}

                              {option.field_type === 'checkbox' && option.available_values && (
                                <div className="space-y-2">
                                  {option.available_values.map((val) => (
                                    <label key={val.value} className="flex items-start gap-2 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        value={val.value}
                                        checked={(formData.custom_options[option.option_key] || []).includes(val.value)}
                                        onChange={(e) => {
                                          const currentValues = formData.custom_options[option.option_key] || []
                                          const newValues = e.target.checked
                                            ? [...currentValues, val.value]
                                            : currentValues.filter(v => v !== val.value)
                                          handleOptionChange(option.option_key, newValues)
                                        }}
                                        className="mt-1"
                                      />
                                      <div>
                                        <div className="font-medium">{val.label}</div>
                                        {val.description && (
                                          <div className="text-sm text-gray-500">{val.description}</div>
                                        )}
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}

                              {option.help_text && (
                                <p className="text-xs text-gray-500 mt-1">💡 {option.help_text}</p>
                              )}
                            </label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(4)}
                className="btn-secondary px-6 py-3"
              >
                ← Retour
              </button>
              <button
                type="button"
                onClick={() => setStep(6)}
                className="btn-primary flex-1 text-lg py-4"
              >
                Continuer →
              </button>
            </div>
          </>
        )}

        {/* ÉTAPE 6 : Génération finale */}
        {step === 6 && (
          <>
            {/* Récapitulatif complet */}
            <div className="card bg-primary-50">
              <h3 className="font-bold mb-3">📋 Récapitulatif de votre patron :</h3>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                    {categories[formData.type]?.icon} {categories[formData.type]?.label}
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                    {categories[formData.type]?.subtypes?.[formData.subtype]?.label}
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                    {levels.find(l => l.value === formData.level)?.label}
                  </span>
                  <span className="px-3 py-1 bg-white rounded-full text-sm font-medium">
                    Taille: {formData.size?.toUpperCase()}
                  </span>
                </div>
                {Object.keys(formData.custom_options).length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm text-gray-600 mb-1">
                      ⚙️ {Object.keys(formData.custom_options).length} option{Object.keys(formData.custom_options).length > 1 ? 's' : ''} de personnalisation
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Prix estimé */}
            {priceInfo && priceInfo.total !== undefined && (
              <div className="card bg-primary-50 border-2 border-primary-200">
                <h2 className="text-xl font-bold mb-4">💰 Prix estimé</h2>
                <div className="text-4xl font-bold text-primary-600 mb-2">
                  {priceInfo.total.toFixed(2)} €
                </div>
                {priceInfo.is_free && (
                  <p className="text-green-600 font-medium text-lg mb-4">
                    ✓ Gratuit avec votre quota actuel
                  </p>
                )}
                <div className="mt-4 text-sm text-gray-600 space-y-1">
                  <div>Prix de base : {priceInfo.base_price?.toFixed(2)} €</div>
                  <div>Multiplicateur type : ×{priceInfo.type_multiplier}</div>
                  <div>Multiplicateur niveau : ×{priceInfo.level_multiplier}</div>
                </div>
              </div>
            )}

            {/* Erreur */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-lg">
                {error}
              </div>
            )}

            {/* Boutons de navigation */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setStep(step === 6 && Object.keys(formData.custom_options).length > 0 ? 5 : 4)}
                className="btn-secondary px-6 py-3"
              >
                ← Retour
              </button>
              <button
                type="submit"
                disabled={loading}
                className="btn-primary flex-1 text-xl py-6"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Génération en cours...
                  </span>
                ) : (
                  '🎨 Générer mon patron maintenant'
                )}
              </button>
            </div>
          </>
        )}
      </form>
    </div>
  )
}

export default Generator
