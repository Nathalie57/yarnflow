/**
 * @file AiAssistant.jsx
 * @brief Assistant IA tricot/crochet — réservé aux abonnés PLUS et PRO
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'

const SUGGESTIONS = [
  'Comment faire une diminution SSK ?',
  'Quelle différence entre k2tog et SSK ?',
  'Comment calculer les mailles pour une encolure ronde ?',
  'Mon tricot tire vers la droite, pourquoi ?',
  'Comment joindre deux pelotes sans nœud visible ?',
  'C\'est quoi le blocage et comment le faire ?',
]

export default function AiAssistant() {
  const { hasActiveSubscription } = useAuth()
  const isPro = hasActiveSubscription()

  const STORAGE_KEY = 'ai_assistant_messages'

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState(null) // { used, limit, remaining }
  const bottomRef = useRef(null)

  useEffect(() => {
    if (!isPro) return
    api.get('/ai/usage').then(res => setUsage(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    try {
      // Garder uniquement les 30 derniers messages pour ne pas surcharger localStorage
      const toSave = messages.slice(-30)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch { /* quota dépassé, on ignore */ }
  }, [messages])

  const send = async (text) => {
    const content = text || input.trim()
    if (!content || loading || usage?.remaining === 0) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await api.post('/ai/assistant', { messages: newMessages })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply }])
      if (res.data.usage) setUsage(res.data.usage)
    } catch (err) {
      const data = err.response?.data
      if (data?.limit_reached) {
        setUsage({ used: data.used, limit: data.limit, remaining: 0 })
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}`, isError: true }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data?.error || 'Une erreur est survenue.'}`, isError: true }])
      }
    } finally {
      setLoading(false)
    }
  }

  if (!isPro) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="text-5xl">🤖</div>
        <h2 className="text-lg font-bold text-gray-900">Assistant IA tricot & crochet</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          Posez toutes vos questions sur les techniques, les patrons et les points.
          Disponible pour les abonnés PLUS et PRO.
        </p>
        <Link
          to="/subscription"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
        >
          Passer à PLUS ou PRO →
        </Link>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh] md:h-[600px]" style={{ height: 'var(--ai-height, 560px)' }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 ? (
          <div className="space-y-4 py-2">
            <p className="text-sm text-gray-500 text-center">
              Posez votre question sur le tricot ou le crochet 🧶
            </p>
            <div className="grid grid-cols-1 gap-2">
              {SUGGESTIONS.map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-4 py-2.5 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300 rounded-xl transition"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : m.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.content}
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Effacer l'historique */}
      {messages.length > 0 && !loading && (
        <div className="flex justify-end pb-1">
          <button
            onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY) }}
            className="text-xs text-gray-400 hover:text-red-400 transition"
          >
            Effacer la conversation
          </button>
        </div>
      )}

      {/* Quota */}
      {usage && (
        <div className={`text-xs text-center py-1 ${usage.remaining <= 5 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
          {usage.remaining > 0
            ? `${usage.used} / ${usage.limit} messages utilisés ce mois`
            : '⚠️ Limite mensuelle atteinte'}
        </div>
      )}

      {/* Saisie */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder="Posez votre question…"
          disabled={loading}
          className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading || usage?.remaining === 0}
          className="bg-primary-600 text-white rounded-xl px-4 py-2.5 text-sm font-medium hover:bg-primary-700 transition disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  )
}
