const secondsValue = value => {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : 0
}

/**
 * Total visible pendant le travail. Le temps de la session courante n'est ajoute
 * que tant qu'elle est active ; une fois enregistree, le total persiste recharge
 * depuis le projet prend le relais sans double comptage.
 */
export const liveProjectTime = (persistedTime, elapsedSessionTime, hasActiveSession) =>
  secondsValue(persistedTime) + (hasActiveSession ? secondsValue(elapsedSessionTime) : 0)
