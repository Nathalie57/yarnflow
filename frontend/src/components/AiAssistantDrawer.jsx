/**
 * @file AiAssistantDrawer.jsx
 * @brief Drawer slide-up pour l'assistant IA (PLUS/PRO) — bouton dans BottomNav
 */

import AiAssistant from './tools/AiAssistant'
import { useAiAssistant } from '../contexts/AiAssistantContext'
import FlowMascot from './FlowMascot'

export default function AiAssistantDrawer({ open, onClose }) {
  const { projectId, projectLabel, projectProgress } = useAiAssistant()
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer slide-up en mobile ; panneau flottant en bas à droite à partir de sm
          (sinon, sur un grand écran, un seul message isolé tout à droite d'un panneau
          pleine largeur donne une impression de mise en page cassée) */}
      <div
        className={`fixed bottom-0 left-0 right-0 sm:left-auto sm:right-6 sm:bottom-6 sm:w-[420px] z-50 bg-white rounded-t-card sm:rounded-card shadow-2xl transition-[transform,visibility] duration-300 ease-out ${
          open ? 'translate-y-0 visible' : 'translate-y-full invisible delay-300'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* [AI:Claude] Titre retiré — retour utilisatrice : troisième reformulation de la
            même idée après le bouton qui ouvre l'assistant et le message d'accueil
            contextuel, sans apporter d'info en plus. Le bouton fermer reste seul.
            L'etincelle generique est remplacee par Flow (charte section 13 : l'assistant
            est l'endroit ou sa presence doit etre la plus forte). */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
          <FlowMascot pose="content" size={26} />
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1"
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="px-4 pt-3 pb-6" style={{ height: 'calc(85vh - 56px)', '--ai-height': 'calc(85vh - 80px)' }}>
          <AiAssistant projectId={projectId} projectLabel={projectLabel} projectProgress={projectProgress} open={open} />
        </div>
      </div>
    </>
  )
}
