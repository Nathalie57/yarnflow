/**
 * @file AiAssistant.jsx
 * @brief Assistant IA tricot/crochet — réservé aux abonnés PLUS et PRO
 */

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'
import { PLAN_PRICES, upgradeTarget, planLabel } from '../../data/upgradePlans'

const MarkdownText = ({ text }) => {
  const lines = text.split('\n')
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (!line.trim()) return <div key={i} className="h-2" />

        const renderInline = (str) => {
          const parts = str.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g)
          return parts.map((part, j) => {
            if (part.startsWith('**') && part.endsWith('**'))
              return <strong key={j}>{part.slice(2, -2)}</strong>
            if (part.startsWith('*') && part.endsWith('*'))
              return <em key={j}>{part.slice(1, -1)}</em>
            return part
          })
        }

        if (/^#{1,3}\s/.test(line))
          return <p key={i} className="font-semibold mt-2">{renderInline(line.replace(/^#{1,3}\s/, ''))}</p>

        if (/^\d+\.\s/.test(line))
          return <p key={i} className="pl-3">{renderInline(line)}</p>

        if (/^[-•*]\s/.test(line))
          return <p key={i} className="pl-3">· {renderInline(line.slice(2))}</p>

        return <p key={i}>{renderInline(line)}</p>
      })}
    </div>
  )
}

// cles seulement : les libelles sont resolus au rendu, sinon ils se figeraient
// dans la langue du premier chargement (et t n'existe pas ici)
const SUGGESTION_KEYS = ['aiQ1', 'aiQ2', 'aiQ3', 'aiQ4', 'aiQ5', 'aiQ6']
// [AI:Claude] En mode contextuel, les suggestions génériques ("Comment faire un SSK ?")
// n'ont plus de sens — l'utilisatrice vient d'un rang précis, les suggestions doivent
// s'appuyer sur ce contexte plutôt que de proposer une question sans rapport.
const CONTEXTUAL_SUGGESTION_KEYS = ['aiCtxQ1', 'aiCtxQ2', 'aiCtxQ3', 'aiCtxQ4']

export default function AiAssistant({ projectId, projectLabel, projectProgress, open } = {}) {
  const { t, i18n } = useTranslation('tools')
  const { hasActiveSubscription , getSubscriptionPlan } = useAuth()
  const isPro = hasActiveSubscription()

  // [AI:Claude] isPro vaut hasActiveSubscription() : vrai pour PLUS aussi.

  // Le plan reel decide quel palier proposer, ou aucun.

  const currentPlan = getSubscriptionPlan ? getSubscriptionPlan() : (isPro ? 'pro' : 'free')

  const GENERAL_STORAGE_KEY = 'ai_assistant_messages'
  // [AI:Claude] Une session contextuelle (ouverte depuis un projet) a sa propre clé de
  // stockage, distincte de l'historique général — sinon des questions génériques passées
  // pollueraient le contexte du rang courant, et inversement une question posée "à chaud"
  // sur un rang resterait affichée hors contexte plus tard. Persistée quand même (pas
  // seulement en mémoire) pour survivre à un F5, contrairement à l'ancien comportement.
  const isContextual = Boolean(projectId)
  const getStorageKey = (pid) => pid ? `ai_assistant_messages_project_${pid}` : GENERAL_STORAGE_KEY

  const [messages, setMessages] = useState(() => {
    try {
      const saved = localStorage.getItem(getStorageKey(projectId))
      return saved ? JSON.parse(saved) : []
    } catch { return [] }
  })
  // [AI:Claude] AiAssistant reste monté en permanence dans le tiroir (juste masqué via
  // CSS) — sans cet effet, l'initialiseur de useState() ci-dessus ne s'exécutant qu'au
  // tout premier montage, une conversation contextuelle précédente restait affichée à
  // chaque réouverture (et, dans l'autre sens, revenir en mode général après une session
  // contextuelle ne rechargeait pas non plus l'historique général persisté).
  //
  // lastProjectIdRef évite de vider la conversation à CHAQUE réouverture du tiroir —
  // seul un vrai changement de contexte (projet différent, ou bascule contextuel ↔
  // général) doit recharger depuis le stockage ; fermer puis rouvrir sur le même projet
  // doit garder la conversation en cours telle quelle.
  const lastProjectIdRef = useRef(projectId)
  useEffect(() => {
    if (!open) return
    const contextChanged = lastProjectIdRef.current !== projectId
    lastProjectIdRef.current = projectId
    if (!contextChanged) return

    try {
      const saved = localStorage.getItem(getStorageKey(projectId))
      setMessages(saved ? JSON.parse(saved) : [])
    } catch { setMessages([]) }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, projectId])

  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [usage, setUsage] = useState(null) // { used, limit, remaining }
  const bottomRef = useRef(null)

  useEffect(() => {
    api.get('/ai/usage').then(res => setUsage(res.data)).catch(() => {})
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  useEffect(() => {
    try {
      // Garder uniquement les 30 derniers messages pour ne pas surcharger localStorage
      const toSave = messages.slice(-30)
      localStorage.setItem(getStorageKey(projectId), JSON.stringify(toSave))
    } catch { /* quota dépassé, on ignore */ }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages, projectId])

  // [AI:Claude] Message d'accueil du chat contextuel — construit à partir des données
  // réelles du projet (section/rang/total) transmises par ProjectCounter, plutôt qu'une
  // phrase générique : la première chose que voit l'utilisatrice doit prouver que
  // l'assistant sait déjà où elle en est.
  const contextualGreeting = (() => {
    if (!isContextual) return null
    const p = projectProgress || {}
    const isCm = p.unit === 'cm'
    const progressKey = isCm
      ? (p.total ? 'ui.progressCmWithTotal' : 'ui.progressCmNoTotal')
      : (p.total ? 'ui.progressRowsWithTotal' : 'ui.progressRowsNoTotal')
    const progress = t(progressKey, { current: p.currentRow ?? 0, total: p.total })
    return p.sectionName
      ? t('ui.contextualGreetingWithSection', { section: p.sectionName, progress })
      : t('ui.contextualGreetingWithoutSection', { progress })
  })()

  const send = async (text) => {
    const content = text || input.trim()
    // [AI:Claude] Le quota mensuel affiché (usage.remaining) ne concerne que l'assistant
    // général — une session contextuelle n'a pas de compteur à vérifier ici, seul le
    // plafond de débit invisible côté serveur (voir catch ci-dessous) peut la bloquer.
    if (!content || loading || (!isContextual && usage?.remaining === 0)) return

    setInput('')
    const newMessages = [...messages, { role: 'user', content }]
    setMessages(newMessages)
    setLoading(true)

    try {
      const res = await api.post('/ai/assistant', { messages: newMessages, lang: i18n.language, ...(projectId ? { project_id: projectId } : {}) })
      setMessages(prev => [...prev, { role: 'assistant', content: res.data.reply, suggestions: res.data.suggestions || [] }])
      if (res.data.usage) setUsage(res.data.usage)
    } catch (err) {
      const data = err.response?.data
      if (data?.limit_reached && data?.error_code === 'ai_monthly_limit') {
        setUsage({ used: data.used, limit: data.limit, remaining: 0 })
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data.error}`, isError: true }])
      } else {
        setMessages(prev => [...prev, { role: 'assistant', content: `❌ ${data?.error || t('ui.genericErrorShort')}`, isError: true }])
      }
    } finally {
      setLoading(false)
    }
  }

  // FREE avec quota épuisé — CTA upsell (assistant général uniquement, jamais en contextuel)
  if (!isPro && !isContextual && usage?.remaining === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
          </svg>
        </div>
        <h2 className="text-lg font-bold text-gray-900">{t('ui.monthlyQuotaReached')}</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          {t('ui.aiQuotaExhausted')}
        </p>
        <Link
          to="/subscription"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-primary-700 transition"
        >
          {(() => { const p = upgradeTarget('ai_questions', currentPlan); return p && t('ui.goToPlan', { plan: planLabel(p), price: PLAN_PRICES[p].monthlyEquiv }) })()}
        </Link>
        <p className="text-xs text-gray-500">{t('ui.quotaResets')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh] md:h-[600px]" style={{ height: 'var(--ai-height, 560px)' }}>
      {isContextual && (
        <div className="mb-2 inline-flex items-center gap-1.5 self-start px-2.5 py-1 rounded-full bg-primary-50 border border-primary-200 text-xs font-medium text-primary-700">
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z" />
          </svg>
          {t('ui.aiContextChip', { label: projectLabel || t('ui.aiContextChipFallback') })}
        </div>
      )}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 ? (
          <div className="space-y-4 py-2">
            {isContextual ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 text-center leading-relaxed">{contextualGreeting}</p>
                <p className="text-sm text-gray-500 text-center">{t('ui.contextualGreetingClosing')}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">{t('ui.askYourQuestion')}</p>
            )}
            <div className="grid grid-cols-1 gap-2">
              {(isContextual ? CONTEXTUAL_SUGGESTION_KEYS : SUGGESTION_KEYS).map(k => t(`ui.${k}`)).map(s => (
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
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-primary-600 text-white rounded-br-sm'
                    : m.isError
                      ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                      : 'bg-gray-100 text-gray-800 rounded-bl-sm'
                }`}
              >
                {m.role === 'user' ? m.content : <MarkdownText text={m.content} />}
              </div>
            </div>
          ))
        )}

        {/* [AI:Claude] Suggestions de suivi — liées à ce qui vient d'être dit (générées par
            le modèle lui-même dans sa réponse), pas les mêmes questions génériques que
            l'état vide. N'apparaissent qu'après la dernière réponse de l'assistant. */}
        {!loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant' && messages[messages.length - 1].suggestions?.length > 0 && (
          <div className="flex flex-col gap-2 pt-1">
            {messages[messages.length - 1].suggestions.map((s, idx) => (
              <button
                key={idx}
                onClick={() => send(s)}
                className="text-left text-sm px-4 py-2.5 bg-gray-50 hover:bg-primary-50 hover:text-primary-700 border border-gray-200 hover:border-primary-300 rounded-xl transition"
              >
                {s}
              </button>
            ))}
          </div>
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
            onClick={() => { setMessages([]); localStorage.removeItem(getStorageKey(projectId)) }}
            className="text-xs text-gray-400 hover:text-red-400 transition"
          >
            {t('ui.clearConversation')}
          </button>
        </div>
      )}

      {/* Quota — assistant général uniquement, jamais affiché en contextuel */}
      {!isContextual && usage && (
        <div className={`text-xs text-center py-1 ${usage.remaining <= 5 ? 'text-orange-500 font-medium' : 'text-gray-400'}`}>
          {usage.remaining > 0
            ? t('ui.messagesUsedMonth', { used: usage.used, limit: usage.limit })
            : t('ui.monthlyLimitHit')}
        </div>
      )}

      {/* Saisie */}
      <div className="flex gap-2 pt-3 border-t border-gray-200">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send()}
          placeholder={t('ui.phAskQuestion')}
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
