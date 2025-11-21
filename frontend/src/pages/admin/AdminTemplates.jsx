import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const AdminTemplates = () => {
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)

  const [formData, setFormData] = useState({
    name: '',
    type: 'hat',
    subtype: '',
    level: 'beginner',
    size: 'adult',
    content: '',
    tags: '',
    is_active: true
  })

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const response = await adminAPI.getTemplates()
      setTemplates(response.data.data)
    } catch (error) {
      console.error('Erreur chargement templates:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    try {
      // Parser les tags
      const tags = formData.tags.split(',').map(t => t.trim()).filter(t => t)

      // Parser le content JSON
      let content
      try {
        content = JSON.parse(formData.content)
      } catch {
        alert('Le contenu doit être un JSON valide')
        return
      }

      const data = {
        ...formData,
        tags,
        content: JSON.stringify(content)
      }

      if (editingId) {
        await adminAPI.updateTemplate(editingId, data)
      } else {
        await adminAPI.createTemplate(data)
      }

      loadTemplates()
      resetForm()
    } catch (error) {
      console.error('Erreur sauvegarde template:', error)
      alert(error.response?.data?.message || 'Erreur lors de la sauvegarde')
    }
  }

  const editTemplate = (template) => {
    setFormData({
      name: template.name,
      type: template.type,
      subtype: template.subtype || '',
      level: template.level,
      size: template.size,
      content: typeof template.content === 'string' ? template.content : JSON.stringify(template.content, null, 2),
      tags: Array.isArray(template.tags) ? template.tags.join(', ') : '',
      is_active: template.is_active
    })
    setEditingId(template.id)
    setShowForm(true)
  }

  const deleteTemplate = async (id) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce template ?')) {
      return
    }

    try {
      await adminAPI.deleteTemplate(id)
      loadTemplates()
    } catch (error) {
      console.error('Erreur suppression:', error)
      alert('Erreur lors de la suppression')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: 'hat',
      subtype: '',
      level: 'beginner',
      size: 'adult',
      content: '',
      tags: '',
      is_active: true
    })
    setEditingId(null)
    setShowForm(false)
  }

  const exampleContent = {
    title: "Bonnet slouchy facile",
    description: "Un bonnet décontracté parfait pour les débutants",
    abbreviations: {
      ml: "maille en l'air",
      mc: "maille coulée",
      ms: "maille serrée",
      bs: "bride simple"
    },
    materials: [
      "200g de fil acrylique épais (épaisseur 5)",
      "Crochet 5mm",
      "Aiguille à laine"
    ],
    gauge: {
      stitches: "14 ms = 10cm",
      rows: "16 rangs = 10cm"
    },
    instructions: "**TOUR 1:**\\n6 ms dans cercle magique [6]\\n\\n**TOUR 2:**\\n2 ms dans chaque maille [12]",
    tips: [
      "Utilisez un marqueur de mailles",
      "Ne serrez pas trop vos mailles"
    ],
    time_estimate: "3-4 heures"
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
        <h1 className="text-3xl font-bold">📋 Gestion des Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary"
        >
          {showForm ? 'Annuler' : '+ Nouveau template'}
        </button>
      </div>

      {/* Formulaire */}
      {showForm && (
        <div className="card mb-6">
          <h2 className="text-xl font-bold mb-4">
            {editingId ? 'Modifier le template' : 'Nouveau template'}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block font-medium mb-1">Nom</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                  placeholder="Bonnet slouchy débutant"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="hat">Bonnet</option>
                  <option value="scarf">Écharpe</option>
                  <option value="amigurumi">Amigurumi</option>
                  <option value="bag">Sac</option>
                  <option value="garment">Vêtement</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Sous-type (optionnel)</label>
                <input
                  type="text"
                  name="subtype"
                  value={formData.subtype}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="slouchy, beanie, etc."
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Niveau</label>
                <select
                  name="level"
                  value={formData.level}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                >
                  <option value="beginner">Débutant</option>
                  <option value="intermediate">Intermédiaire</option>
                  <option value="advanced">Avancé</option>
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Taille</label>
                <input
                  type="text"
                  name="size"
                  value={formData.size}
                  onChange={handleChange}
                  required
                  className="w-full p-2 border rounded"
                  placeholder="adult, child, baby, etc."
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Tags (séparés par virgule)</label>
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                  placeholder="facile, rapide, débutant"
                />
              </div>
            </div>

            <div>
              <label className="block font-medium mb-1">
                Contenu JSON
                <button
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, content: JSON.stringify(exampleContent, null, 2) }))}
                  className="ml-2 text-sm text-primary-600 hover:underline"
                >
                  Charger exemple
                </button>
              </label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                required
                rows="15"
                className="w-full p-2 border rounded font-mono text-sm"
                placeholder={JSON.stringify(exampleContent, null, 2)}
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                name="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="mr-2"
              />
              <label>Template actif (utilisé par l'IA)</label>
            </div>

            <div className="flex gap-2">
              <button type="submit" className="btn-primary">
                {editingId ? 'Mettre à jour' : 'Créer'}
              </button>
              <button type="button" onClick={resetForm} className="btn-secondary">
                Annuler
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Liste des templates */}
      <div className="card">
        <h2 className="text-xl font-bold mb-4">Templates existants ({templates.length})</h2>

        {templates.length === 0 ? (
          <p className="text-gray-600 text-center py-8">Aucun template pour le moment</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left p-3">Nom</th>
                  <th className="text-left p-3">Type</th>
                  <th className="text-left p-3">Niveau</th>
                  <th className="text-left p-3">Taille</th>
                  <th className="text-left p-3">Tags</th>
                  <th className="text-left p-3">Utilisations</th>
                  <th className="text-left p-3">Statut</th>
                  <th className="text-left p-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {templates.map((template) => (
                  <tr key={template.id} className="hover:bg-gray-50">
                    <td className="p-3 font-medium">{template.name}</td>
                    <td className="p-3 capitalize">{template.type}</td>
                    <td className="p-3 capitalize">{template.level}</td>
                    <td className="p-3 uppercase">{template.size}</td>
                    <td className="p-3">
                      {Array.isArray(template.tags) && template.tags.length > 0 ? (
                        <div className="flex gap-1 flex-wrap">
                          {template.tags.slice(0, 3).map((tag, i) => (
                            <span key={i} className="px-2 py-1 bg-gray-100 rounded text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="p-3">{template.usage_count || 0}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs ${
                        template.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {template.is_active ? 'Actif' : 'Inactif'}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex gap-2">
                        <button
                          onClick={() => editTemplate(template)}
                          className="text-blue-600 hover:underline text-xs"
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => deleteTemplate(template.id)}
                          className="text-red-600 hover:underline text-xs"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdminTemplates
