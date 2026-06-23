/**
 * @file ExternalPatternPreview.jsx
 * @brief Composant pour afficher un aperçu de patron externe (sans iframe)
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

import { useState, useEffect } from 'react'
import api from '../services/api'

const ExternalPatternPreview = ({ url, savedImage }) => {
  const [metadata, setMetadata] = useState(null)
  const [loading, setLoading] = useState(!savedImage)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Si une image est déjà sauvegardée en base, on l'utilise directement
    // sans appeler le serveur (certains sites bloquent les requêtes server-side)
    if (savedImage) {
      setMetadata({ image: savedImage, title: null, description: null })
      setLoading(false)
      return
    }

    async function loadMetadata() {
      try {
        setLoading(true)
        const response = await api.post('/web-fetch/metadata', { url })

        if (response.data.success) {
          setMetadata(response.data.metadata)
        } else {
          setError(response.data.error)
        }
      } catch (err) {
        console.error('Erreur chargement métadonnées:', err)
        setError('Impossible de charger l\'aperçu')
      } finally {
        setLoading(false)
      }
    }

    if (url) {
      loadMetadata()
    }
  }, [url, savedImage])

  const extractDomain = (url) => {
    try {
      const domain = new URL(url).hostname.replace('www.', '')
      return domain
    } catch {
      return 'Site externe'
    }
  }

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)

  const handleOpenPattern = () => {
    if (isMobile) {
      // Sur mobile, ouvrir dans un nouvel onglet (pas de popup)
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      // Sur desktop, ouvrir dans une fenêtre popup positionnée
      const width = Math.min(800, window.screen.availWidth / 2)
      const height = window.screen.availHeight
      const left = window.screen.availWidth - width
      const top = 0

      window.open(
        url,
        'patron-window',
        `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
      )
    }
  }

  if (loading) {
    return (
      <div className="border-2 border-gray-200 rounded-lg p-8 text-center bg-gray-50">
        <div className="animate-pulse">
          <div className="text-4xl mb-3">🔗</div>
          <p className="text-gray-500">Chargement de l'aperçu...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="border-2 border-gray-200 rounded-lg overflow-hidden bg-white">
      {/* Image d'aperçu si disponible */}
      {metadata?.image && (
        <div className="relative h-64 bg-gray-100">
          <img
            src={metadata.image}
            alt={metadata.title || 'Aperçu du patron'}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Informations */}
      <div className="p-6">
        {metadata?.title && (
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            {metadata.title}
          </h3>
        )}

        {metadata?.description && (
          <p className="text-gray-600 mb-4 line-clamp-3">
            {metadata.description}
          </p>
        )}

        <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
          <span className="inline-flex items-center gap-1">
            🌐 {metadata?.site_name || extractDomain(url)}
          </span>
        </div>

        {/* Message d'information */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
          {isMobile ? (
            <>
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>Astuce :</strong> Sur mobile, vous pouvez basculer entre les onglets pour garder le compteur et le patron accessibles.
              </p>
              <p className="text-xs text-blue-700">
                Encore mieux : téléchargez le PDF du patron et uploadez-le dans l'app pour le consulter directement ici !
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-blue-800 mb-2">
                💡 <strong>Astuce :</strong> Le bouton "📱 Ouvrir en fenêtre à côté" positionne automatiquement le patron à droite de l'écran pour garder le compteur visible.
              </p>
              <p className="text-xs text-blue-700">
                Encore mieux : téléchargez le PDF du patron et uploadez-le dans l'app pour pouvoir le consulter sans changer de fenêtre !
              </p>
            </>
          )}
        </div>

        {error && !metadata && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4">
            <p className="text-xs text-yellow-800">
              ⚠️ Impossible de charger l'aperçu de ce site
            </p>
          </div>
        )}

        {/* Boutons d'ouverture */}
        <div className="flex flex-col gap-2">
          <button
            onClick={handleOpenPattern}
            className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            {isMobile ? '🔗 Ouvrir le patron' : '📱 Ouvrir en fenêtre à côté'}
          </button>

          {!isMobile && (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full text-center px-6 py-2 border-2 border-primary-600 text-primary-600 rounded-lg hover:bg-primary-50 transition font-medium text-sm"
            >
              🔗 Ou ouvrir dans un nouvel onglet
            </a>
          )}
        </div>

        {/* Lien de secours */}
        <p className="text-xs text-gray-500 text-center mt-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-gray-700 underline break-all"
          >
            {url}
          </a>
        </p>
      </div>
    </div>
  )
}

export default ExternalPatternPreview
