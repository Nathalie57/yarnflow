/**
 * @file AiAssistantContext.jsx
 * @brief Permet d'ouvrir le tiroir de l'assistant IA (monté dans Layout) depuis
 * n'importe quelle page enfant — notamment ProjectCounter, qui a besoin de lui
 * transmettre le contexte du projet en cours ("Aide sur ce rang").
 */

import { createContext, useContext, useState } from 'react'

const AiAssistantContext = createContext(null)

export function AiAssistantProvider({ children }) {
  const [open, setOpen] = useState(false)
  const [projectId, setProjectId] = useState(null)
  const [projectLabel, setProjectLabel] = useState(null)
  // [AI:Claude] Détails structurés (section/rang/total/unité) pour que le message
  // d'accueil du chat puisse formuler une vraie phrase ("Tu travailles sur le corps,
  // rang 24 sur 48") plutôt que de reformater le libellé du chip de contexte.
  const [projectProgress, setProjectProgress] = useState(null)

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

  const close = () => setOpen(false)

  return (
    <AiAssistantContext.Provider value={{ open, projectId, projectLabel, projectProgress, openGeneral, openWithProject, close }}>
      {children}
    </AiAssistantContext.Provider>
  )
}

export const useAiAssistant = () => useContext(AiAssistantContext)
