import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const AdminCategories = () => {
  const [categories, setCategories] = useState({})
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [modalMode, setModalMode] = useState('create') // create, edit, createSubtype
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [selectedItem, setSelectedItem] = useState(null)

  const [formData, setFormData] = useState({
    category_key: '',
    category_label: '',
    category_icon: '',
    subtype_key: '',
    subtype_label: '',
    subtype_description: '',
    available_sizes: [],
    display_order: 0
  })

  useEffect(() => {
    loadCategories()
  }, [])

  const loadCategories = async () => {
    try {
      const response = await adminAPI.getCategories()
      setCategories(response.data.data)
    } catch (error) {
      console.error('Erreur chargement catégories:', error)
    } finally {
      setLoading(false)
    }
  }

  const openCreateCategoryModal = () => {
    setModalMode('create')
    setFormData({
      category_key: '',
      category_label: '',
      category_icon: '',
      available_sizes: [],
      display_order: Object.keys(categories).length + 1
    })
    setShowModal(true)
  }

  const openCreateSubtypeModal = (categoryKey) => {
    setModalMode('createSubtype')
    setSelectedCategory(categoryKey)
    const category = categories[categoryKey]
    const subtypesCount = Object.keys(category.subtypes || {}).length

    setFormData({
      subtype_key: '',
      subtype_label: '',
      subtype_description: '',
      display_order: subtypesCount + 1
    })
    setShowModal(true)
  }

  const openEditModal = (categoryKey, subtypeKey = null) => {
    setModalMode('edit')
    const category = categories[categoryKey]

    if (subtypeKey) {
      // Édition d'une sous-catégorie
      const subtype = category.subtypes[subtypeKey]
      setSelectedCategory(categoryKey)
      setSelectedItem(subtypeKey)
      setFormData({
        subtype_label: subtype.label,
        subtype_description: subtype.description,
        display_order: subtype.display_order
      })
    } else {
      // Édition d'une catégorie principale
      setSelectedCategory(categoryKey)
      setFormData({
        category_label: category.label,
        category_icon: category.icon,
        available_sizes: category.sizes || [],
        display_order: 0
      })
    }

    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      if (modalMode === 'create') {
        await adminAPI.createCategory(formData)
        alert('Catégorie créée avec succès')
      } else if (modalMode === 'createSubtype') {
        await adminAPI.createSubtype(selectedCategory, formData)
        alert('Sous-catégorie créée avec succès')
      } else if (modalMode === 'edit') {
        // TODO: Implémenter la mise à jour
        alert('Fonctionnalité de mise à jour à venir')
      }

      setShowModal(false)
      loadCategories()
    } catch (error) {
      console.error('Erreur:', error)
      alert(error.response?.data?.message || 'Erreur lors de l\'opération')
    }
  }

  const handleDelete = async (categoryKey, subtypeKey = null) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) return

    try {
      // TODO: Implémenter la suppression
      alert('Fonctionnalité de suppression à venir')
      loadCategories()
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSizesChange = (e) => {
    const sizesText = e.target.value
    const sizesArray = sizesText.split(',').map(s => s.trim()).filter(s => s)
    setFormData(prev => ({ ...prev, available_sizes: sizesArray }))
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
        <h1 className="text-3xl font-bold">📂 Gestion des Catégories</h1>
        <button onClick={openCreateCategoryModal} className="btn-primary">
          ➕ Nouvelle catégorie
        </button>
      </div>

      {/* Liste des catégories */}
      <div className="space-y-6">
        {Object.entries(categories).map(([categoryKey, category]) => (
          <div key={categoryKey} className="card">
            {/* En-tête de catégorie */}
            <div className="flex items-center justify-between mb-4 pb-4 border-b">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{category.icon}</span>
                <div>
                  <h2 className="text-xl font-bold">{category.label}</h2>
                  <p className="text-sm text-gray-600">
                    Clé: <code className="bg-gray-100 px-2 py-1 rounded">{categoryKey}</code>
                  </p>
                  {category.sizes && category.sizes.length > 0 && (
                    <p className="text-sm text-gray-600 mt-1">
                      Tailles: {category.sizes.join(', ')}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => openEditModal(categoryKey)}
                  className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                >
                  ✏️ Modifier
                </button>
                <button
                  onClick={() => openCreateSubtypeModal(categoryKey)}
                  className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200"
                >
                  ➕ Sous-catégorie
                </button>
                <button
                  onClick={() => handleDelete(categoryKey)}
                  className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200"
                >
                  🗑️
                </button>
              </div>
            </div>

            {/* Sous-catégories */}
            {category.subtypes && Object.keys(category.subtypes).length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {Object.entries(category.subtypes).map(([subtypeKey, subtype]) => (
                  <div key={subtypeKey} className="p-3 bg-gray-50 rounded border border-gray-200">
                    <div className="flex justify-between items-start mb-2">
                      <div className="font-medium">{subtype.label}</div>
                      <div className="flex gap-1">
                        <button
                          onClick={() => openEditModal(categoryKey, subtypeKey)}
                          className="text-blue-600 hover:text-blue-800 text-xs"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDelete(categoryKey, subtypeKey)}
                          className="text-red-600 hover:text-red-800 text-xs"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600">{subtype.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Clé: <code className="bg-white px-1 rounded">{subtypeKey}</code>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {(!category.subtypes || Object.keys(category.subtypes).length === 0) && (
              <p className="text-gray-500 text-center py-4">
                Aucune sous-catégorie. Cliquez sur "➕ Sous-catégorie" pour en ajouter.
              </p>
            )}
          </div>
        ))}
      </div>

      {Object.keys(categories).length === 0 && (
        <div className="card text-center py-12">
          <p className="text-gray-500 mb-4">Aucune catégorie pour le moment</p>
          <button onClick={openCreateCategoryModal} className="btn-primary">
            Créer la première catégorie
          </button>
        </div>
      )}

      {/* Modal de création/édition */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold">
                  {modalMode === 'create' && 'Nouvelle catégorie'}
                  {modalMode === 'createSubtype' && 'Nouvelle sous-catégorie'}
                  {modalMode === 'edit' && 'Modifier'}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {modalMode === 'create' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Clé de catégorie (en anglais, minuscules)
                      </label>
                      <input
                        type="text"
                        name="category_key"
                        value={formData.category_key}
                        onChange={handleChange}
                        placeholder="ex: hat, scarf, bag"
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Label (affiché aux utilisateurs)
                      </label>
                      <input
                        type="text"
                        name="category_label"
                        value={formData.category_label}
                        onChange={handleChange}
                        placeholder="ex: Bonnets, Écharpes"
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Icône (emoji)
                      </label>
                      <input
                        type="text"
                        name="category_icon"
                        value={formData.category_icon}
                        onChange={handleChange}
                        placeholder="ex: 🧢, 🧣, 👜"
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Tailles disponibles (séparées par des virgules)
                      </label>
                      <input
                        type="text"
                        value={formData.available_sizes.join(', ')}
                        onChange={handleSizesChange}
                        placeholder="ex: baby, child, adult"
                        className="w-full p-2 border rounded"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        Exemples: baby, child, adult OU small, medium, large OU XS, S, M, L, XL
                      </p>
                    </div>
                  </>
                )}

                {modalMode === 'createSubtype' && (
                  <>
                    <div className="bg-gray-50 p-3 rounded mb-4">
                      <p className="text-sm text-gray-600">
                        Catégorie parente: <strong>{categories[selectedCategory]?.label}</strong>
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Clé de sous-catégorie (en anglais, minuscules)
                      </label>
                      <input
                        type="text"
                        name="subtype_key"
                        value={formData.subtype_key}
                        onChange={handleChange}
                        placeholder="ex: beanie, slouchy, pompom"
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Label
                      </label>
                      <input
                        type="text"
                        name="subtype_label"
                        value={formData.subtype_label}
                        onChange={handleChange}
                        placeholder="ex: Beanie, Slouchy, À pompon"
                        required
                        className="w-full p-2 border rounded"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Description
                      </label>
                      <textarea
                        name="subtype_description"
                        value={formData.subtype_description}
                        onChange={handleChange}
                        placeholder="Description courte du style"
                        rows="2"
                        className="w-full p-2 border rounded"
                      />
                    </div>
                  </>
                )}

                {modalMode === 'edit' && (
                  <>
                    {selectedItem ? (
                      // Édition sous-catégorie
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Label</label>
                          <input
                            type="text"
                            name="subtype_label"
                            value={formData.subtype_label}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Description</label>
                          <textarea
                            name="subtype_description"
                            value={formData.subtype_description}
                            onChange={handleChange}
                            rows="2"
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </>
                    ) : (
                      // Édition catégorie
                      <>
                        <div>
                          <label className="block text-sm font-medium mb-2">Label</label>
                          <input
                            type="text"
                            name="category_label"
                            value={formData.category_label}
                            onChange={handleChange}
                            required
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Icône</label>
                          <input
                            type="text"
                            name="category_icon"
                            value={formData.category_icon}
                            onChange={handleChange}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Tailles</label>
                          <input
                            type="text"
                            value={formData.available_sizes.join(', ')}
                            onChange={handleSizesChange}
                            className="w-full p-2 border rounded"
                          />
                        </div>
                      </>
                    )}
                  </>
                )}

                <div className="flex gap-3 pt-4">
                  <button type="submit" className="btn-primary flex-1">
                    {modalMode === 'edit' ? 'Mettre à jour' : 'Créer'}
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

export default AdminCategories
