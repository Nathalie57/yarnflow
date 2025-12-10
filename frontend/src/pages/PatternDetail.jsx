import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { patternsAPI } from '../services/api'
import api from '../services/api'

const PatternDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const [pattern, setPattern] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [creatingProject, setCreatingProject] = useState(false)

  useEffect(() => {
    loadPattern()
  }, [id])

  const loadPattern = async () => {
    try {
      const response = await patternsAPI.getById(id)
      setPattern(response.data.data)
    } catch (error) {
      console.error('Erreur chargement patron:', error)
      alert('Patron introuvable')
      navigate('/my-patterns')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const response = await patternsAPI.downloadPDF(id)

      // Créer un lien de téléchargement
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `patron-${pattern.title || id}.pdf`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error)
      alert('Erreur lors du téléchargement du PDF')
    } finally {
      setDownloading(false)
    }
  }

  // [AI:Claude] Créer un projet depuis ce patron
  const handleStartCrocheting = async () => {
    setCreatingProject(true)
    try {
      const projectData = {
        name: pattern.title,
        type: pattern.type,
        description: pattern.description || `Projet basé sur le patron "${pattern.title}"`,
        pattern_id: pattern.id,
        status: 'in_progress'
      }

      const response = await api.post('/projects', projectData)
      const project = response.data.project

      // [AI:Claude] Rediriger vers le compteur du nouveau projet
      navigate(`/projects/${project.id}/counter`)
    } catch (error) {
      console.error('Erreur création projet:', error)
      alert(error.response?.data?.error || 'Erreur lors de la création du projet')
    } finally {
      setCreatingProject(false)
    }
  }

  const getTypeIcon = (type) => {
    const icons = {
      hat: '🧢',
      scarf: '🧣',
      amigurumi: '🧸',
      bag: '👜',
      garment: '👕'
    }
    return icons[type] || '🧶'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  if (!pattern) {
    return (
      <div className="card text-center">
        <p className="text-gray-600 mb-4">Patron introuvable</p>
        <Link to="/my-patterns" className="btn-primary">
          Retour à mes patrons
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="mb-6">
        <Link to="/my-patterns" className="text-primary-600 hover:underline mb-2 inline-block">
          ← Retour à mes patrons
        </Link>
        <div className="flex items-center gap-4 mb-2">
          <span className="text-5xl">{getTypeIcon(pattern.type)}</span>
          <div>
            <h1 className="text-3xl font-bold">{pattern.title}</h1>
            <p className="text-gray-600">
              {pattern.level} • {pattern.size} • Créé le {new Date(pattern.created_at).toLocaleDateString('fr-FR')}
            </p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="card mb-6">
        <div className="flex gap-4 flex-wrap">
          <button
            onClick={handleStartCrocheting}
            disabled={creatingProject}
            className="btn-primary bg-green-600 hover:bg-green-700 border-green-600"
          >
            {creatingProject ? 'Création...' : '🧶 Commencer à crocheter'}
          </button>
          <button
            onClick={downloadPDF}
            disabled={downloading}
            className="btn-primary"
          >
            {downloading ? 'Téléchargement...' : '📥 Télécharger en PDF'}
          </button>
          <button
            onClick={() => window.print()}
            className="btn-secondary"
          >
            🖨️ Imprimer
          </button>
        </div>
      </div>

      {/* Contenu du patron */}
      <div className="card mb-6 print-content">
        {/* Description */}
        {pattern.description && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Description</h2>
            <p className="text-gray-700 whitespace-pre-line">{pattern.description}</p>
          </div>
        )}

        {/* Matériel */}
        {pattern.materials && pattern.materials.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Matériel nécessaire</h2>
            <ul className="list-disc list-inside space-y-2">
              {pattern.materials.map((item, index) => (
                <li key={index} className="text-gray-700">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Abréviations */}
        {pattern.abbreviations && Object.keys(pattern.abbreviations).length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Abréviations</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {Object.entries(pattern.abbreviations).map(([abbr, full]) => (
                <div key={abbr} className="text-sm">
                  <span className="font-bold">{abbr}</span> = {full}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Échantillon (gauge) */}
        {pattern.gauge && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Échantillon</h2>
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700">
                {pattern.gauge.stitches && <span className="block">{pattern.gauge.stitches}</span>}
                {pattern.gauge.rows && <span className="block">{pattern.gauge.rows}</span>}
              </p>
            </div>
          </div>
        )}

        {/* Instructions */}
        {pattern.instructions && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Instructions</h2>
            <div className="prose max-w-none">
              <div
                className="text-gray-700 whitespace-pre-line leading-relaxed"
                dangerouslySetInnerHTML={{ __html: pattern.instructions.replace(/\n/g, '<br>') }}
              />
            </div>
          </div>
        )}

        {/* Conseils */}
        {pattern.tips && pattern.tips.length > 0 && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Conseils</h2>
            <div className="bg-warm-100 p-4 rounded-lg border border-primary-200">
              <ul className="list-disc list-inside space-y-2">
                {pattern.tips.map((tip, index) => (
                  <li key={index} className="text-sm text-gray-700">{tip}</li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Temps estimé */}
        {pattern.time_estimate && (
          <div className="mb-6">
            <h2 className="text-2xl font-bold mb-3">Temps de réalisation</h2>
            <p className="text-gray-700">⏱️ {pattern.time_estimate}</p>
          </div>
        )}

        {/* Filigrane */}
        {pattern.watermark && (
          <div className="mt-8 pt-6 border-t text-center text-sm text-gray-500">
            <p>Ce patron a été généré pour : {pattern.watermark}</p>
            <p className="text-xs mt-1">Toute reproduction ou revente est interdite</p>
          </div>
        )}
      </div>

      {/* Métadonnées (admin/debug) */}
      {pattern.ai_provider && (
        <div className="card bg-gray-50 text-sm text-gray-600">
          <h3 className="font-bold mb-2">Informations techniques</h3>
          <div className="space-y-1">
            <div>Provider IA : {pattern.ai_provider}</div>
            {pattern.tokens_used && <div>Tokens utilisés : {pattern.tokens_used}</div>}
            {pattern.price_paid > 0 && <div>Prix payé : {pattern.price_paid.toFixed(2)} €</div>}
          </div>
        </div>
      )}
    </div>
  )
}

export default PatternDetail
