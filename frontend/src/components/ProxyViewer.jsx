/**
 * @file ProxyViewer.jsx
 * @brief Affiche un site externe via notre proxy (contourne X-Frame-Options)
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

import { useState, useEffect } from 'react'

const getYouTubeEmbedUrl = (url) => {
  try {
    const u = new URL(url)
    let videoId = null
    if (u.hostname === 'youtu.be') {
      videoId = u.pathname.slice(1)
    } else if (u.hostname.includes('youtube.com')) {
      videoId = u.searchParams.get('v')
    }
    if (videoId) return `https://www.youtube.com/embed/${videoId}?rel=0`
  } catch {}
  return null
}

const ProxyViewer = ({ url, onError, onLoad }) => {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [proxyReady, setProxyReady] = useState(false)

  const youtubeEmbedUrl = getYouTubeEmbedUrl(url)
  const proxyUrl = `${import.meta.env.VITE_API_URL}/web-fetch/proxy?url=${encodeURIComponent(url)}`

  useEffect(() => {
    setLoading(true)
    setError(false)
    setProxyReady(false)

    if (youtubeEmbedUrl) {
      setLoading(false)
      setProxyReady(true)
      return
    }
    // Pre-check : vérifie que le proxy peut charger l'URL.
    // L'iframe ne démarre qu'après ce check — sinon deux requêtes simultanées
    // partent vers le site cible et la deuxième se prend un 403 (rate-limit).
    // Quand le pre-check réussit, WebFetchService a mis la réponse en cache,
    // donc l'iframe la sert depuis le cache sans retoucher le site distant.
    fetch(proxyUrl)
      .then(res => {
        if (!res.ok) {
          setLoading(false)
          setError(true)
          if (onError) onError()
        } else {
          setProxyReady(true)
        }
      })
      .catch(() => {
        setLoading(false)
        setError(true)
        if (onError) onError()
      })
  }, [url])

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
          <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-1">Ce site ne peut pas être affiché ici</p>
          <p className="text-gray-400 text-sm mb-5">Il bloque l'affichage intégré — ouvrez-le dans un nouvel onglet.</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition font-medium text-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Ouvrir le patron
          </a>
        </div>
      )}

      {/* Iframe YouTube embed ou proxy — ne monte qu'après que le pre-check ait réussi */}
      {!error && proxyReady && (
        <iframe
          src={youtubeEmbedUrl || proxyUrl}
          className="w-full border-0"
          style={{
            height: youtubeEmbedUrl ? '56vw' : '80vh',
            minHeight: '300px',
            maxHeight: youtubeEmbedUrl ? '500px' : '1200px',
            display: loading ? 'none' : 'block'
          }}
          title={youtubeEmbedUrl ? 'Vidéo YouTube' : 'Patron'}
          onLoad={handleLoad}
          onError={handleError}
          allow={youtubeEmbedUrl ? 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture' : undefined}
          sandbox={youtubeEmbedUrl ? 'allow-same-origin allow-scripts allow-popups' : 'allow-same-origin allow-scripts allow-popups allow-forms'}
        />
      )}
    </div>
  )
}

export default ProxyViewer
