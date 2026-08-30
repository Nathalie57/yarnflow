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

  const openGeneral = () => {
    setProjectId(null)
    setProjectLabel(null)
    setOpen(true)
  }

  const openWithProject = (id, label) => {
    setProjectId(id)
    setProjectLabel(label || null)
    setOpen(true)
  }

  const close = () => setOpen(false)

  return (
    <AiAssistantContext.Provider value={{ open, projectId, projectLabel, openGeneral, openWithProject, close }}>
      {children}
    </AiAssistantContext.Provider>
  )
}

export const useAiAssistant = () => useContext(AiAssistantContext)
