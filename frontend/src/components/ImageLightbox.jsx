/**
 * @file ImageLightbox.jsx
 * @brief Lightbox pour afficher les images en plein écran avec zoom
 * @author Nathalie + AI Assistants
 * @created 2025-11-30
 * @modified 2025-11-30 by [AI:Claude] - Création initiale
 */

import { useState, useEffect } from 'react'

const ImageLightbox = ({ src, alt, onClose }) => {
  const [scale, setScale] = useState(1.0)
  const [rotation, setRotation] = useState(0)

  // Fermer avec Echap
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose()
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const zoomIn = () => {
    setScale((prev) => Math.min(5.0, prev + 0.5))
  }

  const zoomOut = () => {
    setScale((prev) => Math.max(0.5, prev - 0.5))
  }

  const resetZoom = () => {
    setScale(1.0)
  }

  const rotate = () => {
    setRotation((prev) => (prev + 90) % 360)
  }

  const downloadImage = () => {
    const link = document.createElement('a')
    link.href = src
    link.download = alt || 'patron-image.jpg'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-95 flex flex-col">
      {/* Toolbar */}
      <div className="bg-gray-900 border-b border-gray-700 p-3 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={zoomOut}
            disabled={scale <= 0.5}
            className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
          >
            🔍−
          </button>

          <span className="text-sm text-white font-medium px-2">
            {Math.round(scale * 100)}%
          </span>

          <button
            onClick={zoomIn}
            disabled={scale >= 5.0}
            className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition"
          >
            🔍+
          </button>

          {scale !== 1.0 && (
            <button
              onClick={resetZoom}
              className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-xs transition"
            >
              Réinitialiser
            </button>
          )}

          <div className="w-px h-6 bg-gray-700 mx-2"></div>

          <button
            onClick={rotate}
            className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm font-medium transition"
            title="Rotation 90°"
          >
            ↻ Pivoter
          </button>

          <button
            onClick={downloadImage}
            className="px-3 py-1.5 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm font-medium transition"
          >
            📥 Télécharger
          </button>
        </div>

        <button
          onClick={onClose}
          className="px-4 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 text-sm font-medium transition"
        >
          ✕ Fermer
        </button>
      </div>

      {/* Image */}
      <div
        className="flex-1 overflow-auto flex items-center justify-center p-4"
        onClick={onClose}
      >
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          style={{
            transform: `scale(${scale}) rotate(${rotation}deg)`,
            transition: 'transform 0.3s ease',
            maxWidth: scale === 1.0 ? '90%' : 'none',
            maxHeight: scale === 1.0 ? '90%' : 'none',
            cursor: scale > 1.0 ? 'move' : 'default'
          }}
          className="shadow-2xl select-none"
        />
      </div>

      {/* Aide */}
      <div className="bg-gray-900 border-t border-gray-700 p-2 text-xs text-gray-400 text-center">
        💡 Cliquez en dehors de l'image ou appuyez sur Echap pour fermer
      </div>
    </div>
  )
}

export default ImageLightbox
