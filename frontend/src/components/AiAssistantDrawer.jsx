/**
 * @file AiAssistantDrawer.jsx
 * @brief Drawer slide-up pour l'assistant IA (PLUS/PRO) — bouton dans BottomNav
 */

import AiAssistant from './tools/AiAssistant'

export default function AiAssistantDrawer({ open, onClose }) {
  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
          onClick={onClose}
        />
      )}

      {/* Drawer slide-up */}
      <div
        className={`fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-2xl shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`}
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-3 pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <span className="text-lg">🤖</span>
            <span className="font-semibold text-gray-900 text-sm">Assistant IA tricot & crochet</span>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl leading-none p-1"
          >
            ×
          </button>
        </div>

        {/* Contenu */}
        <div className="px-4 pt-3 pb-6" style={{ height: 'calc(85vh - 56px)', '--ai-height': 'calc(85vh - 80px)' }}>
          <AiAssistant />
        </div>
      </div>
    </>
  )
}
