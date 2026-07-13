import { useEffect, useState } from 'react'
import { adminAPI } from '../../services/api'

const AdminPhotoFeedback = () => {
  const [feedback, setFeedback] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    loadFeedback()
  }, [filter])

  const loadFeedback = async () => {
    setLoading(true)
    try {
      const params = filter === 'low' ? { max_rating: 3 } : {}
      const response = await adminAPI.getPhotoFeedback(params)
      setFeedback(response.data.data.feedback || [])
    } catch (error) {
      console.error('Erreur chargement feedback photos:', error)
      setFeedback([])
    } finally {
      setLoading(false)
    }
  }

  const displayedFeedback = filter === 'with_comment'
    ? feedback.filter(f => f.comment && f.comment.trim() !== '')
    : feedback

  const lowRatingCount = feedback.filter(f => f.rating <= 3).length
  const withCommentCount = feedback.filter(f => f.comment && f.comment.trim() !== '').length

  const renderStars = (rating) => (
    <span className={rating <= 3 ? 'text-red-500' : 'text-yellow-500'}>
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )

  const photoUrl = (f) => {
    const path = f.enhanced_path || f.original_path
    return path ? `${import.meta.env.VITE_BACKEND_URL}${path}` : null
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
      <h1 className="text-3xl font-bold mb-6">📸 Feedback Photos IA</h1>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="card">
          <h3 className="text-gray-600 mb-2">Total feedbacks</h3>
          <p className="text-3xl font-bold text-primary-600">{feedback.length}</p>
        </div>
        <div className="card bg-red-50 border-l-4 border-red-500">
          <h3 className="text-gray-600 mb-2">Notes ≤ 3 étoiles</h3>
          <p className="text-3xl font-bold text-red-600">{lowRatingCount}</p>
        </div>
        <div className="card">
          <h3 className="text-gray-600 mb-2">Avec commentaire</h3>
          <p className="text-3xl font-bold text-gray-600">{withCommentCount}</p>
        </div>
      </div>

      {/* Filtres */}
      <div className="card mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded ${filter === 'all' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          >
            Tous
          </button>
          <button
            onClick={() => setFilter('low')}
            className={`px-4 py-2 rounded ${filter === 'low' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          >
            À examiner (≤ 3 étoiles)
          </button>
          <button
            onClick={() => setFilter('with_comment')}
            className={`px-4 py-2 rounded ${filter === 'with_comment' ? 'bg-primary-500 text-white' : 'bg-gray-100'}`}
          >
            Avec commentaire
          </button>
        </div>
      </div>

      {/* Tableau des feedbacks */}
      <div className="card">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left p-3">Photo</th>
                <th className="text-left p-3">Utilisateur</th>
                <th className="text-left p-3">Note</th>
                <th className="text-left p-3">Commentaire</th>
                <th className="text-left p-3">Contexte</th>
                <th className="text-left p-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayedFeedback.map((f) => (
                <tr key={f.id} className={f.rating <= 3 ? 'bg-red-50 hover:bg-red-100' : 'hover:bg-gray-50'}>
                  <td className="p-3">
                    {photoUrl(f) ? (
                      <a href={photoUrl(f)} target="_blank" rel="noreferrer">
                        <img
                          src={photoUrl(f)}
                          alt={f.item_name || 'Photo générée'}
                          className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                        />
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400">Photo introuvable</span>
                    )}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{[f.first_name, f.last_name].filter(Boolean).join(' ') || 'Utilisateur'}</div>
                    <div className="text-xs text-gray-600">{f.user_email}</div>
                    <div className="text-xs text-gray-400">ID {f.user_id}</div>
                  </td>
                  <td className="p-3 whitespace-nowrap">{renderStars(f.rating)}</td>
                  <td className="p-3 max-w-xs">
                    {f.comment ? <span className="italic text-gray-700">"{f.comment}"</span> : <span className="text-gray-400">—</span>}
                  </td>
                  <td className="p-3 text-xs text-gray-500">
                    {f.item_name && <div>{f.item_name}</div>}
                    {(f.ai_style || f.ai_purpose) && <div>{[f.ai_style, f.ai_purpose].filter(Boolean).join(' · ')}</div>}
                  </td>
                  <td className="p-3">
                    {new Date(f.created_at).toLocaleDateString('fr-FR')}
                    <div className="text-xs text-gray-500">
                      {new Date(f.created_at).toLocaleTimeString('fr-FR')}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {displayedFeedback.length === 0 && (
          <p className="text-center text-gray-500 py-8">Aucun feedback trouvé</p>
        )}
      </div>
    </div>
  )
}

export default AdminPhotoFeedback
