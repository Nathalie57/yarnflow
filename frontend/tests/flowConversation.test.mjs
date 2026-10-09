import assert from 'node:assert/strict'
import test from 'node:test'
import { createFlowConversationStore, flowConversationKey, isFlowQuotaBlocked } from '../src/utils/flowConversation.js'

const storage = () => {
  const data = new Map()
  return { getItem: key => data.get(key), setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) }
}
const reply = content => ({ role: 'assistant', content })
const deferred = () => {
  let resolve
  const promise = new Promise(done => { resolve = done })
  return { promise, resolve }
}

test('local histories are isolated by user and project, including general chat', () => {
  const disk = storage()
  const store = createFlowConversationStore(disk)
  const a = store.get(640, 502)
  a.complete(a.begin('144 rangs / 25 mailles'), reply('Une maille supplémentaire'))
  assert.deepEqual(store.get(641, 502).getSnapshot().messages, [])
  assert.deepEqual(store.get(640, 503).getSnapshot().messages, [])
  assert.deepEqual(store.get(640, null).getSnapshot().messages, [])
  const reloaded = createFlowConversationStore(disk)
  assert.equal(reloaded.get(640, 502).getSnapshot().messages.length, 2)
  assert.deepEqual(reloaded.get(641, 502).getSnapshot().messages, [])
  assert.equal(flowConversationKey(null, 502), null)
  assert.throws(() => store.get(null, 502))
})

test('unowned legacy histories never migrate into an authenticated account', () => {
  const disk = storage()
  disk.setItem('ai_assistant_messages', JSON.stringify([reply('Private legacy message')]))
  disk.setItem('ai_assistant_messages_project_502', JSON.stringify([reply('Private project')]))
  for (const user of [640, 641]) {
    const store = createFlowConversationStore(disk)
    assert.deepEqual(store.get(user, null).getSnapshot().messages, [])
    assert.deepEqual(store.get(user, 502).getSnapshot().messages, [])
  }
})

test('a pending reply stays in its original project after switching projects', async () => {
  const disk = storage()
  const store = createFlowConversationStore(disk)
  const origin = store.get(640, 502)
  const request = origin.begin('Explique ce rang')
  const network = deferred()
  const completion = network.promise.then(content => origin.complete(request, reply(content)))
  const current = store.get(640, 503)
  const otherRequest = current.begin('Autre projet')
  let changes = 0
  const unsubscribe = current.subscribe(() => { changes++ })
  network.resolve('Réponse pour 502')
  await completion
  assert.equal(changes, 0)
  assert.equal(current.getSnapshot().loading, true)
  assert.deepEqual(current.getSnapshot().messages.map(m => m.content), ['Autre projet'])
  assert.equal(store.get(640, 502), origin)
  assert.equal(origin.getSnapshot().loading, false)
  assert.equal(origin.getSnapshot().messages.at(-1).content, 'Réponse pour 502')
  assert.equal(JSON.parse(disk.getItem(origin.key)).at(-1).content, 'Réponse pour 502')
  current.complete(otherRequest, reply('Réponse pour 503'))
  unsubscribe()
})

test('switching accounts during a request cannot deliver the reply to the new account', async () => {
  const store = createFlowConversationStore(storage())
  const origin = store.get(640, 502)
  const request = origin.begin('Question privée')
  const network = deferred()
  const completion = network.promise.then(content => origin.complete(request, reply(content)))
  const newAccount = store.get(641, 502)
  network.resolve('Réponse privée')
  await completion
  assert.deepEqual(newAccount.getSnapshot().messages, [])
  assert.equal(origin.getSnapshot().messages.at(-1).content, 'Réponse privée')
})

test('late errors stay with their request and clearing invalidates pending responses', () => {
  const store = createFlowConversationStore(storage())
  const a = store.get(640, 502)
  const b = store.get(640, 503)
  a.complete(a.begin('Question'), { ...reply('Erreur réseau'), isError: true })
  assert.deepEqual(b.getSnapshot().messages, [])
  const stale = a.begin('Question effacée')
  assert.equal(a.begin('Double envoi'), null)
  a.clear()
  const current = a.begin('Nouvelle question')
  assert.equal(a.complete(stale, reply('Ancienne réponse')), false)
  assert.equal(a.getSnapshot().loading, true)
  assert.equal(a.complete(current, reply('Nouvelle réponse')), true)
  assert.deepEqual(a.getSnapshot().messages.map(m => m.content), ['Nouvelle question', 'Nouvelle réponse'])
})

test('contextual send is independent of monthly general quota', () => {
  assert.equal(isFlowQuotaBlocked(null, { remaining: 0 }), true)
  assert.equal(isFlowQuotaBlocked(undefined, { remaining: 0 }), true)
  assert.equal(isFlowQuotaBlocked(502, { remaining: 0 }), false)
  assert.equal(isFlowQuotaBlocked(null, { remaining: 1 }), false)
  assert.equal(isFlowQuotaBlocked(502, null), false)
})

test('asking for successive rows appends to the same history', () => {
  const conversation = createFlowConversationStore(storage()).get(640, 502)
  conversation.complete(conversation.begin('Explique-moi ce rang'), reply('Rang 1'))
  conversation.complete(conversation.begin('Explique-moi ce rang'), reply('Rang 2'))
  assert.deepEqual(conversation.getSnapshot().messages.map(message => message.content), [
    'Explique-moi ce rang', 'Rang 1', 'Explique-moi ce rang', 'Rang 2'
  ])
})

test('invalid local JSON is ignored and unavailable storage keeps a working in-memory session', () => {
  const disk = storage()
  disk.setItem(flowConversationKey(640, 502), '{bad json')
  assert.deepEqual(createFlowConversationStore(disk).get(640, 502).getSnapshot().messages, [])
  const failingStorage = { getItem() { throw Error() }, setItem() { throw Error() }, removeItem() { throw Error() } }
  const conversation = createFlowConversationStore(failingStorage).get(640, 502)
  conversation.complete(conversation.begin('Question'), reply('Réponse'))
  assert.equal(conversation.getSnapshot().messages.length, 2)
  conversation.clear()
  assert.deepEqual(conversation.getSnapshot().messages, [])
})
