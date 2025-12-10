/**
 * @file FloatingCounter.jsx
 * @brief Compteur flottant compact qui reste visible en bas de l'écran
 * @author Nathalie + AI Assistants
 * @created 2025-12-10
 */

const FloatingCounter = ({
  currentRow,
  totalRows,
  sectionName,
  onIncrement,
  onDecrement,
  onExpand,
  projectName,
  // Timer props
  elapsedTime,
  isTimerRunning,
  isTimerPaused,
  onStartTimer,
  onPauseTimer,
  onResumeTimer,
  onStopTimer
}) => {
  // Formater le temps (secondes → HH:MM:SS ou MM:SS)
  const formatTime = (seconds) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-2xl z-50 border-t-4 border-primary-800">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 py-2 sm:py-3">
        {/* Version Mobile */}
        <div className="flex sm:hidden flex-col gap-2">
          {/* Ligne 1 : Info section */}
          <div className="flex items-center justify-between">
            <button
              onClick={onExpand}
              className="text-left hover:opacity-80 transition min-w-0 flex-1"
            >
              <div className="text-xs opacity-90 truncate">
                {sectionName || projectName}
              </div>
            </button>
            <button
              onClick={onExpand}
              className="px-2 py-1 bg-white/20 hover:bg-white/30 rounded text-[10px] font-medium"
            >
              ⬆️ Plus
            </button>
          </div>

          {/* Ligne 2 : Compteur + Timer */}
          <div className="flex items-center gap-2">
            {/* Compteur */}
            <button
              onClick={onDecrement}
              disabled={currentRow <= 1}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-xl font-bold flex-shrink-0"
            >
              −
            </button>

            <div className="flex-1 text-center min-w-[60px]">
              <div className="text-3xl font-bold leading-none">
                {currentRow}
              </div>
              {totalRows > 0 && (
                <div className="text-[10px] opacity-75">
                  / {totalRows}
                </div>
              )}
            </div>

            <button
              onClick={onIncrement}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition flex items-center justify-center text-xl font-bold flex-shrink-0"
            >
              +
            </button>

            {/* Timer mobile avec boutons */}
            <div className="flex items-center gap-1 bg-white/10 px-2 py-1.5 rounded-lg border border-white/20 flex-shrink-0">
              <span className="text-sm">⏱️</span>
              <span className="font-mono text-sm font-bold min-w-[40px]">
                {formatTime(elapsedTime || 0)}
              </span>
              {!isTimerRunning ? (
                <>
                  <button
                    onClick={onStartTimer}
                    className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 transition flex items-center justify-center"
                    title="Démarrer"
                  >
                    <span className="text-white text-[10px]">▶</span>
                  </button>
                  {elapsedTime > 0 && (
                    <button
                      onClick={onStopTimer}
                      className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center"
                      title="Arrêter"
                    >
                      <span className="text-white text-[10px]">⏹</span>
                    </button>
                  )}
                </>
              ) : isTimerPaused ? (
                <>
                  <button
                    onClick={onResumeTimer}
                    className="w-6 h-6 rounded-full bg-green-500 hover:bg-green-600 transition flex items-center justify-center"
                    title="Reprendre"
                  >
                    <span className="text-white text-[10px]">▶</span>
                  </button>
                  <button
                    onClick={onStopTimer}
                    className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center"
                    title="Arrêter"
                  >
                    <span className="text-white text-[10px]">⏹</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onPauseTimer}
                    className="w-6 h-6 rounded-full bg-orange-500 hover:bg-orange-600 transition flex items-center justify-center"
                    title="Pause"
                  >
                    <span className="text-white text-xs font-bold">||</span>
                  </button>
                  <button
                    onClick={onStopTimer}
                    className="w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center"
                    title="Arrêter"
                  >
                    <span className="text-white text-[10px]">■</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Ligne 3 : Progression */}
          {totalRows > 0 && (
            <div className="bg-white/20 rounded-full h-1 overflow-hidden">
              <div
                className="bg-white h-full transition-all duration-300 rounded-full"
                style={{ width: `${Math.min((currentRow / totalRows) * 100, 100)}%` }}
              />
            </div>
          )}
        </div>

        {/* Version Desktop */}
        <div className="hidden sm:flex items-center gap-3 lg:gap-4">
          {/* Info section */}
          <button
            onClick={onExpand}
            className="flex-shrink-0 text-left hover:opacity-80 transition min-w-0 max-w-[180px]"
          >
            <div className="text-sm font-semibold opacity-95 truncate">
              {sectionName || projectName}
            </div>
            <div className="text-[10px] opacity-70">
              Rang {currentRow}{totalRows > 0 ? `/${totalRows}` : ''}
            </div>
          </button>

          {/* Timer desktop - toujours visible */}
          <div className="flex items-center gap-2 bg-white/10 px-3 py-2 rounded-lg border border-white/20">
            <span className="text-xl">⏱️</span>
            <span className="font-mono text-base font-bold min-w-[50px]">
              {formatTime(elapsedTime || 0)}
            </span>
            {!isTimerRunning ? (
              <button
                onClick={onStartTimer}
                className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 transition flex items-center justify-center shadow-md"
                title="Démarrer le timer"
              >
                <span className="text-white text-sm">▶</span>
              </button>
            ) : isTimerPaused ? (
              <>
                <button
                  onClick={onResumeTimer}
                  className="w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 transition flex items-center justify-center shadow-md"
                  title="Reprendre"
                >
                  <span className="text-white text-sm">▶</span>
                </button>
                <button
                  onClick={onStopTimer}
                  className="w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 transition flex items-center justify-center shadow-md"
                  title="Arrêter"
                >
                  <span className="text-white text-xs">⏹</span>
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={onPauseTimer}
                  className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 transition flex items-center justify-center shadow-md"
                  title="Pause"
                >
                  <span className="text-white text-sm font-bold">||</span>
                </button>
                <button
                  onClick={onStopTimer}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-700 transition flex items-center justify-center shadow-md"
                  title="Arrêter"
                >
                  <span className="text-white text-xs">■</span>
                </button>
              </>
            )}
          </div>

          {/* Compteur principal */}
          <div className="flex-1 flex items-center justify-center gap-3">
            <button
              onClick={onDecrement}
              disabled={currentRow <= 1}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center text-2xl font-bold"
            >
              −
            </button>

            <div className="text-center min-w-[100px]">
              <div className="text-3xl lg:text-4xl font-bold leading-none mb-1">
                {currentRow}
              </div>
              {totalRows > 0 && (
                <div className="text-xs opacity-75">
                  / {totalRows} rangs
                </div>
              )}
            </div>

            <button
              onClick={onIncrement}
              className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 active:bg-white/40 transition flex items-center justify-center text-2xl font-bold"
            >
              +
            </button>
          </div>

          {/* Bouton expand */}
          <button
            onClick={onExpand}
            className="flex-shrink-0 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition text-sm font-medium whitespace-nowrap"
          >
            ⬆️ Voir plus
          </button>
        </div>

        {/* Indicateur de progression (desktop uniquement) */}
        {totalRows > 0 && (
          <div className="hidden sm:block mt-2 bg-white/20 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300 rounded-full"
              style={{ width: `${Math.min((currentRow / totalRows) * 100, 100)}%` }}
            />
          </div>
        )}
      </div>
    </div>
  )
}

export default FloatingCounter
