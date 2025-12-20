/**
 * @file SatisfactionModal.jsx
 * @brief Modal de notation post-génération (système d'étoiles 1-5)
 * @author Nathalie + Claude
 * @version 0.15.0
 * @date 2025-12-19
 */

import { useState } from 'react'
import PropTypes from 'prop-types'
import api from '../services/api'

const SatisfactionModal = ({ isOpen, photo, onClose, onFeedbackSubmitted }) => {
  const [submitting, setSubmitting] = useState(false)
  const [rating, setRating] = useState(0)
  const [hoveredRating, setHoveredRating] = useState(0)
  const [comment, setComment] = useState('')

  if (!isOpen || !photo) return null

  const handleSubmit = async () => {
    if (rating === 0) {
      alert('Veuillez sélectionner une note')
      return
    }

    setSubmitting(true)

    try {
      const response = await api.post(`/photos/${photo.id}/feedback`, {
        rating,
        comment: comment.trim() || null
      })

      if (response.data.success) {
        onFeedbackSubmitted(response.data)
      }

      onClose()
    } catch (err) {
      console.error('Erreur feedback:', err)
      alert(err.response?.data?.error || 'Erreur lors de l\'envoi du feedback')
    } finally {
      setSubmitting(false)
      setRating(0)
      setHoveredRating(0)
      setComment('')
    }
  }

  const getRatingLabel = (stars) => {
    const labels = {
      1: 'Très insatisfait',
      2: 'Insatisfait',
      3: 'Correct',
      4: 'Satisfait',
      5: 'Excellent !'
    }
    return labels[stars] || ''
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[70] p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 space-y-5 animate-slide-up">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="text-5xl">🎨</div>
          <h2 className="text-2xl font-bold text-gray-900">Votre photo est prête !</h2>
          <p className="text-gray-600">Qu'en pensez-vous ?</p>
        </div>

        {/* Photo preview */}
        <div className="bg-gray-100 rounded-lg p-3 border-2 border-gray-200">
          <img
            src={`${import.meta.env.VITE_BACKEND_URL}${photo.enhanced_path || photo.original_path}`}
            alt={photo.item_name}
            className="w-full h-48 object-contain rounded"
          />
        </div>

        {/* Système d'étoiles */}
        <div className="space-y-3">
          <label className="block text-center text-sm font-medium text-gray-700">
            Notez le résultat :
          </label>

          {/* Étoiles cliquables */}
          <div className="flex justify-center items-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="transition-all transform hover:scale-125 focus:outline-none"
                disabled={submitting}
              >
                <svg
                  className={`w-12 h-12 transition-colors ${
                    star <= (hoveredRating || rating)
                      ? 'text-yellow-400 fill-current'
                      : 'text-gray-300 fill-current'
                  }`}
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                >
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              </button>
            ))}
          </div>

          {/* Label de la note */}
          {(hoveredRating || rating) > 0 && (
            <p className="text-center text-lg font-semibold text-primary-600 animate-fade-in">
              {getRatingLabel(hoveredRating || rating)}
            </p>
          )}
        </div>

        {/* Champ commentaire optionnel */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Commentaire (optionnel)
          </label>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Qu'en pensez-vous ? Qu'auriez-vous aimé améliorer ?"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg resize-none text-sm focus:ring-2 focus:ring-primary-400 focus:border-transparent"
            rows="3"
            maxLength="500"
            disabled={submitting}
          />
          <p className="text-xs text-gray-500">
            💡 Votre retour nous aide à améliorer le service
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col gap-3">
          <button
            onClick={handleSubmit}
            disabled={submitting || rating === 0}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-xl font-bold hover:bg-primary-700 transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? '⏳ Envoi...' : '✨ Envoyer ma note'}
          </button>

          <button
            onClick={onClose}
            disabled={submitting}
            className="w-full px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition disabled:opacity-50"
          >
            Je déciderai plus tard
          </button>
        </div>
      </div>
    </div>
  )
}

SatisfactionModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  photo: PropTypes.object,
  onClose: PropTypes.func.isRequired,
  onFeedbackSubmitted: PropTypes.func.isRequired
}

export default SatisfactionModal
