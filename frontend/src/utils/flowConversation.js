// Une conversation générale et une conversation par projet, isolées par compte.
// Les anciennes clés sans propriétaire ne sont jamais importées.
export function flowConversationKey(userId, projectId) {
  if (userId == null) return null
  return `flow:v2:user:${encodeURIComponent(userId)}:${projectId == null ? 'general' : `project:${encodeURIComponent(projectId)}`}`
}

export function isFlowQuotaBlocked(projectId, usage) {
  return projectId == null && usage?.remaining === 0
}

export function createFlowConversationStore(storage) {
  const conversations = new Map()
  return {
    get(userId, projectId) {
      const key = flowConversationKey(userId, projectId)
      if (!key) throw new Error('Flow requires an identified user')
      if (conversations.has(key)) return conversations.get(key)
      let messages = []
      try {
        const saved = JSON.parse(storage?.getItem(key) || '[]')
        if (Array.isArray(saved)) messages = saved.filter(message =>
          message && ['user', 'assistant'].includes(message.role) && typeof message.content === 'string'
        ).slice(-30)
      } catch { /* Historique absent ou corrompu. */ }
      let state = { messages, loading: false }
      let pending = null
      const listeners = new Set()
      const update = (next) => {
        state = next
        try { storage?.setItem(key, JSON.stringify(state.messages.slice(-30))) } catch { /* Quota local. */ }
        listeners.forEach(listener => listener())
      }
      const conversation = {
        key,
        getSnapshot: () => state,
        subscribe: (listener) => {
          listeners.add(listener)
          return () => listeners.delete(listener)
        },
        begin(content) {
          if (pending) return null
          const request = { key }
          pending = request
          update({ messages: [...state.messages, { role: 'user', content }], loading: true })
          return request
        },
        complete(request, message) {
          if (pending !== request) return false
          pending = null
          update({ messages: [...state.messages, message], loading: false })
          return true
        },
        rate(index, rating) {
          update({ ...state, messages: state.messages.map((message, i) =>
            i === index ? { ...message, rating } : message) })
        },
        clear() {
          pending = null
          update({ messages: [], loading: false })
          try { storage?.removeItem(key) } catch { /* Stockage indisponible. */ }
        },
      }
      conversations.set(key, conversation)
      return conversation
    },
  }
}

// Accès différé : un navigateur qui refuse localStorage garde la session en mémoire.
const browserStorage = {
  getItem: key => globalThis.localStorage?.getItem(key),
  setItem: (key, value) => globalThis.localStorage?.setItem(key, value),
  removeItem: key => globalThis.localStorage?.removeItem(key),
}
export const flowConversations = createFlowConversationStore(browserStorage)
