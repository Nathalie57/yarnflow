/**
 * @file useMediaSession.js
 * @brief Hook pour afficher le compteur de rangs sur l'écran de verrouillage
 *
 * Utilise la Media Session API pour afficher le rang courant dans le player
 * système (écran verrouillé, notification audio). Les boutons piste précédente /
 * suivante sont mappés sur décrément / incrément du compteur.
 *
 * Nécessite un audio silencieux en lecture pour que le système affiche les contrôles.
 * L'audio est généré via AudioContext (pas de fichier MP3 externe).
 */

import { useEffect, useRef, useCallback } from 'react'

export const useMediaSession = ({
  isActive,        // bool — true quand le compteur tourne
  projectName,     // string
  sectionName,     // string|null
  currentRow,      // number
  targetRows,      // number|null
  onIncrement,     // () => void
  onDecrement,     // () => void
}) => {
  const audioCtxRef = useRef(null)
  const sourceRef = useRef(null)
  const isSupported = typeof navigator !== 'undefined' && 'mediaSession' in navigator

  // Crée un buffer audio silencieux de 1 seconde et le joue en boucle
  const startSilentAudio = useCallback(() => {
    if (audioCtxRef.current) return // déjà démarré

    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)()
      audioCtxRef.current = ctx

      const sampleRate = ctx.sampleRate
      const buffer = ctx.createBuffer(1, sampleRate, sampleRate) // 1s mono silencieux

      const playLoop = () => {
        if (!audioCtxRef.current) return
        const source = ctx.createBufferSource()
        source.buffer = buffer
        source.connect(ctx.destination)
        source.onended = playLoop
        source.start()
        sourceRef.current = source
      }

      playLoop()
    } catch (e) {
      // AudioContext non supporté ou bloqué — pas critique
    }
  }, [])

  const stopSilentAudio = useCallback(() => {
    if (sourceRef.current) {
      try { sourceRef.current.onended = null; sourceRef.current.stop() } catch (_) {}
      sourceRef.current = null
    }
    if (audioCtxRef.current) {
      try { audioCtxRef.current.close() } catch (_) {}
      audioCtxRef.current = null
    }
  }, [])

  // Démarrer / arrêter l'audio silencieux selon isActive
  useEffect(() => {
    if (!isSupported) return
    if (isActive) {
      startSilentAudio()
    } else {
      stopSilentAudio()
      navigator.mediaSession.metadata = null
      navigator.mediaSession.setActionHandler('previoustrack', null)
      navigator.mediaSession.setActionHandler('nexttrack', null)
    }
    return () => {
      if (!isActive) return
      stopSilentAudio()
    }
  }, [isActive, isSupported, startSilentAudio, stopSilentAudio])

  // Mettre à jour les métadonnées à chaque changement de rang
  useEffect(() => {
    if (!isSupported || !isActive) return

    const title = targetRows
      ? `Rang ${currentRow} / ${targetRows}`
      : `Rang ${currentRow}`

    const artist = sectionName
      ? `${projectName} — ${sectionName}`
      : projectName

    navigator.mediaSession.metadata = new window.MediaMetadata({
      title,
      artist,
      album: 'YarnFlow',
    })

    navigator.mediaSession.playbackState = 'playing'
  }, [isActive, isSupported, currentRow, targetRows, projectName, sectionName])

  // Enregistrer les handlers une seule fois (onIncrement/onDecrement peuvent changer)
  const onIncrementRef = useRef(onIncrement)
  const onDecrementRef = useRef(onDecrement)
  useEffect(() => { onIncrementRef.current = onIncrement }, [onIncrement])
  useEffect(() => { onDecrementRef.current = onDecrement }, [onDecrement])

  useEffect(() => {
    if (!isSupported || !isActive) return

    navigator.mediaSession.setActionHandler('nexttrack', () => onIncrementRef.current?.())
    navigator.mediaSession.setActionHandler('previoustrack', () => onDecrementRef.current?.())

    return () => {
      navigator.mediaSession.setActionHandler('nexttrack', null)
      navigator.mediaSession.setActionHandler('previoustrack', null)
    }
  }, [isActive, isSupported])

  // Nettoyage au démontage
  useEffect(() => {
    return () => stopSilentAudio()
  }, [stopSilentAudio])
}
