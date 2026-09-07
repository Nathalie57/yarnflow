import { useState, useEffect, useCallback, useRef } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { ravelryAPI } from '../services/api'

/**
 * [AI:Claude] Carte Profil pour connecter/déconnecter un compte Ravelry (Palier 1).
 * Auto-contenue : gère son propre statut ET le retour de redirection OAuth2
 * (?code=&state= dans l'URL), sans wiring depuis Profile.jsx.
 */
const RavelryConnectionCard = () => {
  const { t, i18n } = useTranslation('tools')
  const [searchParams, setSearchParams] = useSearchParams()
  const [status, setStatus] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [disconnecting, setDisconnecting] = useState(false)
  const [message, setMessage] = useState(null) // { type: 'success' | 'error', text }
  const callbackHandled = useRef(false)

  const loadStatus = useCallback(async () => {
    try {
      const response = await ravelryAPI.getStatus()
      setStatus(response.data.data)
    } catch (error) {
      console.error('Erreur chargement statut Ravelry:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadStatus() }, [loadStatus])

  useEffect(() => {
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    if (!code || !state || callbackHandled.current) return
    callbackHandled.current = true

    // [AI:Claude] Nettoyer l'URL tout de suite pour éviter un retraitement au refresh
    const next = new URLSearchParams(searchParams)
    next.delete('code')
    next.delete('state')
    setSearchParams(next, { replace: true })

    ravelryAPI.connectCallback(code, state)
      .then(() => {
        setMessage({ type: 'success', text: t('ui.ravelryConnectSuccess') })
        loadStatus()
      })
      .catch(() => {
        setMessage({ type: 'error', text: t('ui.ravelryConnectError') })
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleConnect = async () => {
    setConnecting(true)
    setMessage(null)
    try {
      const response = await ravelryAPI.connectStart()
      window.location.href = response.data.data.authorize_url
    } catch (error) {
      setMessage({ type: 'error', text: t('ui.ravelryConnectError') })
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    setDisconnecting(true)
    setMessage(null)
    try {
      await ravelryAPI.disconnect()
      setMessage({ type: 'success', text: t('ui.ravelryDisconnectSuccess') })
      await loadStatus()
    } catch (error) {
      console.error('Erreur déconnexion Ravelry:', error)
    } finally {
      setDisconnecting(false)
    }
  }

  if (loading) return null

  return (
    <div className="card">
      <h2 className="text-lg font-semibold text-gray-900 mb-1">{t('ui.ravelryAccount')}</h2>

      {message && (
        <div className={`mt-3 mb-1 px-3 py-2 rounded-lg text-sm ${
          message.type === 'success'
            ? 'bg-green-50 border border-green-300 text-green-800'
            : 'bg-red-50 border border-red-300 text-red-800'
        }`}>
          {message.text}
        </div>
      )}

      {status?.connected ? (
        <div className="flex items-center justify-between gap-4 mt-4">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {t('ui.ravelryConnectedAs', { username: status.ravelry_username })}
            </p>
            {status.connected_at && (
              <p className="text-xs text-gray-500 mt-0.5">
                {t('ui.ravelryConnectedSince', {
                  date: new Date(status.connected_at).toLocaleDateString(i18n.language)
                })}
              </p>
            )}
          </div>
          <button
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="btn-secondary text-sm flex-shrink-0 disabled:opacity-60"
          >
            {disconnecting ? t('ui.ravelryDisconnecting') : t('ui.ravelryDisconnect')}
          </button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-4 mt-4">
          <p className="text-sm text-gray-500">{t('ui.ravelryConnectDesc')}</p>
          <button
            onClick={handleConnect}
            disabled={connecting}
            className="btn-primary text-sm flex-shrink-0 disabled:opacity-60"
          >
            {connecting ? t('ui.ravelryConnecting') : t('ui.ravelryConnect')}
          </button>
        </div>
      )}
    </div>
  )
}

export default RavelryConnectionCard
