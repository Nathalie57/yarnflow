import { useState } from 'react'
import api from '../services/api'

/**
 * Hook pour gérer la preview IA gratuite
 */
export function useImagePreview() {
  const [previewImage, setPreviewImage] = useState(null)
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewError, setPreviewError] = useState(null)
  const [previewContext, setPreviewContext] = useState(null) // Context utilisé pour la preview

  const generatePreview = async (photoId, context) => {
    setIsGeneratingPreview(true)
    setPreviewError(null)

    try {
      const response = await api.post(`/photos/${photoId}/preview`, {
        context: context
      })

      if (response.data.success) {
        setPreviewImage(`data:image/jpeg;base64,${response.data.preview_image}`)
        setPreviewContext(context) // Sauvegarder le context pour la génération HD
        return { success: true }
      } else {
        throw new Error(response.data.error || 'Erreur génération preview')
      }
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Erreur lors de la génération'
      setPreviewError(errorMsg)
      return { success: false, error: errorMsg }
    } finally {
      setIsGeneratingPreview(false)
    }
  }

  const clearPreview = () => {
    setPreviewImage(null)
    setPreviewError(null)
    setPreviewContext(null)
  }

  return {
    previewImage,
    isGeneratingPreview,
    previewError,
    previewContext, // Retourner le context pour l'utiliser dans la génération HD
    generatePreview,
    clearPreview
  }
}
