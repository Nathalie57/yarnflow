import { useEffect } from 'react'

/**
 * @file useDocumentMeta.js
 * @brief Définit un titre/description propres à une page (SPA à route unique
 * sinon : Google scrape le premier texte visible de la page comme description,
 * ce qui donne des extraits de recherche incohérents pour les pages légales).
 */
export default function useDocumentMeta(title, description) {
  useEffect(() => {
    const previousTitle = document.title
    document.title = title

    let meta = document.querySelector('meta[name="description"]')
    const previousDescription = meta?.getAttribute('content') ?? null
    if (!meta) {
      meta = document.createElement('meta')
      meta.setAttribute('name', 'description')
      document.head.appendChild(meta)
    }
    meta.setAttribute('content', description)

    return () => {
      document.title = previousTitle
      if (previousDescription !== null) {
        meta.setAttribute('content', previousDescription)
      }
    }
  }, [title, description])
}
