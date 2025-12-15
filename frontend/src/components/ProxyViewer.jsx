/**
 * @file ProxyViewer.jsx
 * @brief Affiche un site externe via notre proxy (contourne X-Frame-Options)
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

import { useState } from 'react'

const ProxyViewer = ({ url, onError, onLoad }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  const proxyUrl = `${import.meta.env.VITE_API_URL}/web-fetch/proxy?url=${encodeURIComponent(url)}`

  const handleLoad = () => {
    setLoading(false)
    setError(false)
    if (onLoad) onLoad()
  }

  const handleError = () => {
    setLoading(false)
    setError(true)
    if (onError) onError()
  }

  return (
    <div className="w-full relative">
      {/* Barre d'actions */}
      <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600 flex-1 min-w-0">
          <span>🌐</span>
          <span className="truncate">{url}</span>
        </div>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-primary-600 text-white rounded text-xs font-medium hover:bg-primary-700 transition whitespace-nowrap ml-2"
        >
          Ouvrir l'original
        </a>
      </div>

      {/* Indicateur de chargement */}
      {loading && (
        <div className="flex items-center justify-center bg-white py-20">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-3"></div>
            <p className="text-gray-600">Chargement du patron...</p>
          </div>
        </div>
      )}

      {/* Message d'erreur */}
      {error && (
        <div className="p-8 text-center">
          <div className="text-red-500 mb-4 text-4xl">⚠️</div>
          <p className="text-gray-700 mb-4">
            Impossible de charger ce patron dans l'application.
          </p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition font-medium"
          >
            Ouvrir dans un nouvel onglet
          </a>
        </div>
      )}

      {/* Iframe avec le contenu proxyfié */}
      {!error && (
        <iframe
          src={proxyUrl}
          className="w-full border-0"
          style={{
            height: '80vh',
            minHeight: '500px',
            maxHeight: '1200px',
            display: loading ? 'none' : 'block'
          }}
          title="Patron"
          onLoad={handleLoad}
          onError={handleError}
          sandbox="allow-same-origin allow-scripts allow-popups allow-forms"
        />
      )}

      {/* Note pour l'utilisateur */}
      {!error && !loading && (
        <div className="bg-blue-50 border-t border-blue-200 px-4 py-3 text-sm text-blue-800">
          💡 <strong>Astuce :</strong> Pour une meilleure expérience, téléchargez le PDF du patron depuis le site
          et uploadez-le dans l'app. Vous pourrez alors zoomer et naviguer plus facilement !
        </div>
      )}
    </div>
  )
}

export default ProxyViewer
