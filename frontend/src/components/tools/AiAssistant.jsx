/**
 * @file AiAssistant.jsx
 * @brief Assistant IA tricot/crochet — réservé aux abonnés PLUS et PRO
 */

import { useState, useRef, useEffect, useSyncExternalStore } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import api from '../../services/api'
import { useTranslation } from 'react-i18next'
import { PLAN_PRICES, upgradeTarget, planLabel } from '../../data/upgradePlans'
import FlowMascot from '../FlowMascot'

import FlowMarkdown from '../FlowMarkdown'
import { flowConversations, isFlowQuotaBlocked } from '../../utils/flowConversation'
import { canExplainNextRow, FLOW_CONTEXT_ACTION_EXPLAIN_NEXT_ROW } from '../../utils/flowContextActions'

// cles seulement : les libelles sont resolus au rendu, sinon ils se figeraient
// dans la langue du premier chargement (et t n'existe pas ici)
const SUGGESTION_KEYS = ['aiQ1', 'aiQ2', 'aiQ3', 'aiQ4', 'aiQ5', 'aiQ6']
// [AI:Claude] En mode contextuel, les suggestions génériques ("Comment faire un SSK ?")
// n'ont plus de sens — l'utilisatrice vient d'un rang précis, les suggestions doivent
// s'appuyer sur ce contexte plutôt que de proposer une question sans rapport.
const CONTEXTUAL_SUGGESTION_KEYS = ['aiCtxQ2', 'aiCtxQ3', 'aiCtxQ4']
const DEMO_SUGGESTION_KEYS = ['aiDemoQ1', 'aiDemoQ2', 'aiDemoQ3', 'aiDemoQ4']

export default function AiAssistant(props = {}) {
  const { user } = useAuth()
  if (user?.id == null) return null
  const conversation = flowConversations.get(user.id, props.projectId)
  // La clé remonte aussi la saisie et le quota lorsque le compte/projet change.
  return <AiAssistantConversation key={conversation.key} {...props} conversation={conversation} />
}

function AiAssistantConversation({ projectId, projectProgress, conversation }) {
  const { t, i18n } = useTranslation('tools')
  const { hasActiveSubscription , getSubscriptionPlan } = useAuth()
  const isPro = hasActiveSubscription()

  // [AI:Claude] isPro vaut hasActiveSubscription() : vrai pour PLUS aussi.

  // Le plan reel decide quel palier proposer, ou aucun.

  const currentPlan = getSubscriptionPlan ? getSubscriptionPlan() : (isPro ? 'pro' : 'free')

  const isContextual = projectId != null
  const isDemo = isContextual && projectProgress?.isDemo === true
  const { messages, loading } = useSyncExternalStore(conversation.subscribe, conversation.getSnapshot)

  const [input, setInput] = useState('')
  const [usage, setUsage] = useState(null) // { used, limit, remaining }
  const bottomRef = useRef(null)

  useEffect(() => {
    let active = true
    api.get('/ai/usage').then(res => { if (active) setUsage(res.data) }).catch(() => {})
    return () => { active = false }
  }, [])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  // [AI:Claude] Message d'accueil du chat contextuel — construit à partir des données
  // réelles du projet (section/rang/total) transmises par ProjectCounter, plutôt qu'une
  // phrase générique : la première chose que voit l'utilisatrice doit prouver que
  // l'assistant sait déjà où elle en est.
  const contextualGreeting = (() => {
    if (!isContextual) return null
    const p = projectProgress || {}
    const isCm = p.unit === 'cm'
    const isRounds = p.unit === 'rounds'
    const current = Number(p.currentRow) || 0
    const total = p.total != null ? Number(p.total) : null
    const isComplete = Boolean(p.isCompleted) || (total !== null && current >= total)
    let progressKey
    let progressValues = { current, total }

    if (isCm) {
      progressKey = total !== null ? 'ui.progressCmWithTotal' : 'ui.progressCmNoTotal'
    } else if (p.progressionType === 'composite') {
      progressKey = isRounds ? 'ui.progressCompositeRounds' : 'ui.progressCompositeRows'
    } else if (isRounds && isComplete) {
      progressKey = total !== null ? 'ui.progressRoundsCompleteWithTotal' : 'ui.progressRoundsComplete'
    } else if (isRounds) {
      progressKey = total !== null ? 'ui.progressNextRoundWithTotal' : 'ui.progressNextRoundNoTotal'
      progressValues = { ...progressValues, next: current + 1 }
    } else if (isComplete) {
      progressKey = total !== null ? 'ui.progressRowsCompleteWithTotal' : 'ui.progressRowsComplete'
    } else {
      progressKey = total !== null ? 'ui.progressNextRowWithTotal' : 'ui.progressNextRowNoTotal'
      progressValues = { ...progressValues, next: current + 1 }
    }
    const progress = t(progressKey, progressValues)
    return p.sectionName
      ? t('ui.contextualGreetingWithSection', { section: p.sectionName, progress })
      : t('ui.contextualGreetingWithoutSection', { progress })
  })()

  const send = async (text, contextAction = null) => {
    const content = text || input.trim()
    // [AI:Claude] Le quota mensuel affiché (usage.remaining) ne concerne que l'assistant
    // général — une session contextuelle n'a pas de compteur à vérifier ici, seul le
    // plafond de débit invisible côté serveur (voir catch ci-dessous) peut la bloquer.
    if (!content || loading || isFlowQuotaBlocked(projectId, usage)) return

    setInput('')
    const request = conversation.begin(content)
    if (!request) return
    const newMessages = conversation.getSnapshot().messages

    try {
      const res = await api.post('/ai/assistant', {
        messages: newMessages,
        lang: i18n.language,
        ...(isContextual ? { project_id: projectId } : {}),
        ...(contextAction ? { context_action: contextAction } : {})
      })
      conversation.complete(request, { role: 'assistant', content: res.data.reply, suggestions: res.data.suggestions || [], messageId: res.data.message_id || null, rating: null })
      if (res.data.usage) setUsage(res.data.usage)
    } catch (err) {
      const data = err.response?.data
      if (data?.limit_reached && data?.error_code === 'ai_monthly_limit') {
        setUsage({ used: data.used, limit: data.limit, remaining: 0 })
        conversation.complete(request, { role: 'assistant', content: data.error, isError: true })
      } else {
        conversation.complete(request, { role: 'assistant', content: data?.error || t('ui.genericErrorShort'), isError: true })
      }
    }
  }

  // [AI:Claude] Feedback qualité (pouce haut/bas) — seul signal existant à ce jour sur la
  // pertinence réelle des réponses (avant ça, seules les erreurs techniques étaient loguées).
  const rate = async (index, rating) => {
    const msg = messages[index]
    if (!msg?.messageId || msg.rating) return
    conversation.rate(index, rating)
    try {
      await api.post('/ai/feedback', { message_id: msg.messageId, rating })
    } catch {
      // best-effort : on ne redonne pas la main sur le rating en cas d'échec réseau,
      // pas assez important pour interrompre la conversation
    }
  }

  // FREE avec quota épuisé — CTA upsell (assistant général uniquement, jamais en contextuel)
  if (!isPro && !isContextual && usage?.remaining === 0) {
    return (
      <div className="text-center py-10 space-y-4">
        <FlowMascot pose="interrogatif" size={80} className="mx-auto" />
        <h2 className="text-lg font-bold text-flow-ink">{t('ui.monthlyQuotaReached')}</h2>
        <p className="text-sm text-gray-500 max-w-xs mx-auto">
          {t('ui.aiQuotaExhausted')}
        </p>
        <Link
          to="/subscription"
          className="inline-block bg-primary-600 text-white px-6 py-2.5 rounded-control text-sm font-semibold hover:bg-primary-700 transition"
        >
          {(() => { const p = upgradeTarget('ai_questions', currentPlan); return p && t('ui.goToPlan', { plan: planLabel(p), price: PLAN_PRICES[p].monthlyEquiv }) })()}
        </Link>
        <p className="text-xs text-gray-500">{t('ui.quotaResets')}</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-[600px] max-h-[70vh] md:h-[600px]" style={{ height: 'var(--ai-height, 560px)' }}>
      {/* [AI:Claude] Puce de contexte retirée — retour utilisatrice : redondante avec le
          message d'accueil juste en dessous (contextualGreeting), qui dit déjà sur quel
          projet/section/rang porte la conversation, en langage naturel plutôt qu'un nom
          de fichier technique ("smart_import_xxx.pdf"). */}
      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-2">
        {messages.length === 0 ? (
          <div className="space-y-4 py-2">
            <FlowMascot pose="content" size={64} className="mx-auto" />
            {isContextual ? (
              <div className="space-y-1">
                <p className="text-sm text-gray-600 text-center leading-relaxed">{contextualGreeting}</p>
                <p className="text-sm text-gray-500 text-center">{t(isDemo ? 'ui.demoGreetingClosing' : 'ui.contextualGreetingClosing')}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center">{t('ui.askYourQuestion')}</p>
            )}
            <div className="grid grid-cols-1 gap-2">
              {(isDemo ? DEMO_SUGGESTION_KEYS : isContextual ? CONTEXTUAL_SUGGESTION_KEYS : SUGGESTION_KEYS).map(k => t(`ui.${k}`)).map(s => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-left text-sm px-4 py-2.5 bg-flow-mint/40 hover:bg-flow-mint border border-flow-mint rounded-control transition text-flow-ink"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((m, i) => (
            <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className="flex items-end gap-1.5 max-w-[85%]">
                {m.role === 'assistant' && !m.isError && (
                  <FlowMascot pose="content" size={22} className="flex-shrink-0 mb-1" />
                )}
                <div
                  className={`rounded-card px-4 py-3 text-sm leading-relaxed ${
                    m.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-sm'
                      : m.isError
                        ? 'bg-red-50 text-red-700 border border-red-200 rounded-bl-sm'
                        : 'bg-flow-mint/50 text-flow-ink rounded-bl-sm'
                  }`}
                >
                  {m.role === 'user' ? m.content : <FlowMarkdown text={m.content} />}
                </div>
              </div>
              {/* [AI:Claude] Feedback qualité — seul signal existant sur la pertinence
                  réelle des réponses, absent jusqu'ici (seules les erreurs techniques
                  étaient loguées). Masqué sur les messages d'erreur et sans message_id. */}
              {m.role === 'assistant' && !m.isError && m.messageId && (
                <div className="flex items-center gap-2 mt-1 px-1">
                  <button
                    onClick={() => rate(i, 'up')}
                    disabled={Boolean(m.rating)}
                    title={t('ui.feedbackHelpful')}
                    className={`transition ${m.rating === 'up' ? 'text-primary-600' : m.rating ? 'text-gray-300' : 'text-gray-400 hover:text-primary-600'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill={m.rating === 'up' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6.633 10.5c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 012.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 00.322-1.672V3a.75.75 0 01.75-.75A2.25 2.25 0 0116.5 4.5c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 01-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 00-1.423-.23H5.904M14.25 9h2.25M5.904 18.75c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 01-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 10.203 4.167 9.75 5 9.75h1.053c.472 0 .745.556.5.96a8.958 8.958 0 00-1.302 4.665c0 1.194.232 2.333.654 3.375z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => rate(i, 'down')}
                    disabled={Boolean(m.rating)}
                    title={t('ui.feedbackNotHelpful')}
                    className={`transition ${m.rating === 'down' ? 'text-red-500' : m.rating ? 'text-gray-300' : 'text-gray-400 hover:text-red-500'}`}
                  >
                    <svg className="w-3.5 h-3.5" fill={m.rating === 'down' ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={1.75} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17.367 13.5c-.806 0-1.533.446-2.031 1.08a9.041 9.041 0 01-2.861 2.4c-.723.384-1.35.956-1.653 1.715a4.498 4.498 0 00-.322 1.672V21a.75.75 0 01-.75.75 2.25 2.25 0 01-2.25-2.25c0-1.152.26-2.243.723-3.218.266-.558-.107-1.282-.725-1.282H4.023c-1.026 0-1.945-.694-2.054-1.715a12.134 12.134 0 01-.068-1.285c0-2.848.992-5.464 2.649-7.521.388-.482.987-.729 1.605-.729H9.52c.483 0 .964.078 1.423.23l3.114 1.04a4.501 4.501 0 001.423.23h2.526M9.75 15h-2.25M18.096 5.25c-.083-.205-.173-.405-.27-.602-.197-.4.078-.898.523-.898h.908c.889 0 1.713.518 1.972 1.368.339 1.11.521 2.287.521 3.507 0 1.553-.295 3.036-.831 4.398C20.613 13.797 19.833 14.25 19 14.25h-1.053c-.472 0-.745-.556-.5-.96a8.958 8.958 0 001.302-4.665c0-1.194-.232-2.333-.654-3.375z" />
                    </svg>
                  </button>
                  {m.rating && <span className="text-xs text-gray-400">{t('ui.feedbackThanks')}</span>}
                </div>
              )}
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
                className="text-left text-sm px-4 py-2.5 bg-flow-mint/40 hover:bg-flow-mint border border-flow-mint rounded-control transition text-flow-ink"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {loading && (
          <div className="flex items-end gap-1.5">
            <FlowMascot pose="quiReflechit" size={22} className="flex-shrink-0 mb-1" />
            <div className="bg-flow-mint/50 rounded-card rounded-bl-sm px-4 py-3">
              <div className="flex gap-1 items-center h-4">
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-primary-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
            onClick={() => conversation.clear()}
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

      {/* Action de travail permanente, indépendante des suggestions générées. Le
          backend relit la progression persistée au moment de chaque clic. */}
      {isContextual && canExplainNextRow(projectProgress) && (
        <div className="pb-2">
          <button
            type="button"
            onClick={() => send(t('ui.aiCtxQ1'), FLOW_CONTEXT_ACTION_EXPLAIN_NEXT_ROW)}
            disabled={loading}
            className="w-full text-left text-sm px-4 py-2.5 bg-white hover:bg-flow-mint/40 border border-primary-200 rounded-control transition text-primary-700 font-medium disabled:opacity-50"
          >
            {t('ui.aiCtxQ1')}
          </button>
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
          className="flex-1 border border-gray-300 rounded-control px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 disabled:opacity-50"
        />
        <button
          onClick={() => send()}
          disabled={!input.trim() || loading || isFlowQuotaBlocked(projectId, usage)}
          className="bg-primary-600 text-white rounded-control px-4 py-2.5 text-sm font-medium hover:bg-primary-700 transition disabled:opacity-40"
        >
          →
        </button>
      </div>
    </div>
  )
}
