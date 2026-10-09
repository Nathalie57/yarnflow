/**
 * @file AiAssistantContext.jsx
 * @brief Permet d'ouvrir le tiroir de l'assistant IA (monté dans Layout) depuis
 * n'importe quelle page enfant — notamment ProjectCounter, qui a besoin de lui
 * transmettre le contexte du projet en cours ("Aide sur ce rang").
 */

import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const AiAssistantContext = createContext(null)

export function AiAssistantProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id ?? null
  const [ownerId, setOwnerId] = useState(userId)
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState(null)
  const [projectLabel, setProjectLabel] = useState(null)
  // [AI:Claude] Détails structurés (section/rang/total/unité) pour que le message
  // d'accueil du chat puisse formuler une vraie phrase ("Tu travailles sur le corps,
  // rang 24 sur 48") plutôt que de reformater le libellé du chip de contexte.
  const [projectProgress, setProjectProgress] = useState(null)

  useEffect(() => {
    setOwnerId(userId)
    setOpen(false)
    setProjectId(null)
    setProjectLabel(null)
    setProjectProgress(null)
  }, [userId])

  const openGeneral = () => {
    setProjectId(null)
    setProjectLabel(null)
    setProjectProgress(null)
    setOpen(true)
  }

  const openWithProject = (id, label, progress) => {
    setProjectId(id)
    setProjectLabel(label || null)
    setProjectProgress(progress || null)
    setOpen(true)
  }

  // Le panneau peut rester ouvert pendant que le compteur ou la section change.
  // Ne synchroniser que le projet actuellement affiché évite qu'une autre page
  // remplace son contexte local ; le backend reste la source de vérité à l'envoi.
  const syncProjectProgress = useCallback((id, progress) => {
    if (projectId == null || String(projectId) !== String(id)) return
    setProjectProgress(previous => {
      const next = progress || null
      return JSON.stringify(previous) === JSON.stringify(next) ? previous : next
    })
  }, [projectId])

  const close = () => setOpen(false)
  // Masquer immédiatement les métadonnées du compte précédent, avant l’effet.
  const belongsToUser = ownerId === userId

  return (
    <AiAssistantContext.Provider value={{
      open: belongsToUser && open,
      projectId: belongsToUser ? projectId : null,
      projectLabel: belongsToUser ? projectLabel : null,
      projectProgress: belongsToUser ? projectProgress : null,
      openGeneral, openWithProject, syncProjectProgress, close,
    }}>
      {children}
    </AiAssistantContext.Provider>
  )
}

export const useAiAssistant = () => useContext(AiAssistantContext)
