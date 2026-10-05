import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getChartProgress, shouldExpandChart } from '../utils/chartProgress'
import { ChartColumnLabels, ChartRowLabels } from './ChartAxisLabels'
import { meaningfulChartName } from '../utils/chartAxes'

const MIN_CELL_PX = 5
const MAX_CELL_PX = 18
const TARGET_CANVAS_WIDTH = 640

/** Grille de consultation uniquement. La progression vient exclusivement de la section. */
export default function ChartProgressView({ chart, currentRow, counterUnit = 'rows', mode = 'compact' }) {
  const { t } = useTranslation('counter')
  const canvasRef = useRef(null)
  const scrollRef = useRef(null)

  const progress = useMemo(
    () => getChartProgress(currentRow, chart?.start_row ?? 0, chart?.height, counterUnit),
    [currentRow, chart?.start_row, chart?.height, counterUnit]
  )
  const [expanded, setExpanded] = useState(() => shouldExpandChart(mode, progress.status))

  useEffect(() => {
    setExpanded(shouldExpandChart(mode, progress.status))
  }, [mode, chart?.id, progress.status])

  const cellPx = useMemo(() => {
    const width = Math.max(1, Number(chart?.width) || 1)
    return Math.max(MIN_CELL_PX, Math.min(MAX_CELL_PX, Math.floor(TARGET_CANVAS_WIDTH / width)))
  }, [chart?.width])

  useEffect(() => {
    if (!expanded || !chart) return
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const width = Number(chart.width) || 0
    const height = Number(chart.height) || 0
    if (!ctx || width <= 0 || height <= 0) return

    canvas.width = width * cellPx
    canvas.height = height * cellPx

    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const colorIndex = chart.cells?.[y]?.[x] ?? 0
        ctx.fillStyle = chart.palette?.[colorIndex] || '#FFFFFF'
        ctx.fillRect(x * cellPx, y * cellPx, cellPx, cellPx)
      }
    }

    ctx.strokeStyle = 'rgba(0,0,0,0.35)'
    ctx.lineWidth = 1
    for (let x = 0; x <= width; x += 1) {
      ctx.beginPath()
      ctx.moveTo(x * cellPx, 0)
      ctx.lineTo(x * cellPx, height * cellPx)
      ctx.stroke()
    }
    for (let y = 0; y <= height; y += 1) {
      ctx.beginPath()
      ctx.moveTo(0, y * cellPx)
      ctx.lineTo(width * cellPx, y * cellPx)
      ctx.stroke()
    }

    if (progress.status === 'active') {
      const y = progress.canvasRow * cellPx
      ctx.fillStyle = 'rgba(250, 204, 21, 0.32)'
      ctx.fillRect(0, y, width * cellPx, cellPx)
      ctx.strokeStyle = '#365f3f'
      ctx.lineWidth = Math.max(2, Math.min(4, cellPx / 3))
      ctx.strokeRect(1, y + 1, width * cellPx - 2, Math.max(1, cellPx - 2))

      requestAnimationFrame(() => {
        const scroller = scrollRef.current
        if (!scroller) return
        const target = y - (scroller.clientHeight / 2) + (cellPx / 2)
        scroller.scrollTop = Math.max(0, target)
      })
    }
  }, [chart, cellPx, expanded, progress.canvasRow, progress.status])

  if (!chart || counterUnit !== 'rows') return null

  const startRow = Math.max(0, Math.floor(Number(chart.start_row) || 0))
  const displayName = meaningfulChartName(chart.name)
  const statusText = progress.status === 'active'
    ? mode === 'work'
      ? t('ui.chartRowToKnit', { row: progress.activeLine })
      : t('ui.chartNextRow', { row: progress.activeLine, total: chart.height })
    : progress.status === 'before'
      ? t('ui.chartStartsAtSectionRow', { row: startRow + 1 })
      : progress.status === 'completed'
        ? t('ui.chartProgressCompleted')
        : t('ui.chartProgressUnavailable')

  return (
    <div className="mt-3 pt-3 border-t border-primary-300/50">
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          {(mode === 'compact' || displayName) && (
            <p className={`${mode === 'work' ? 'text-xs text-gray-500 mt-0.5' : 'text-xs font-semibold text-gray-600 uppercase tracking-wide'} truncate`}>
              {mode === 'compact'
                ? `${t('ui.chartProgressTitle')}${displayName ? ` · ${displayName}` : ''}`
                : `${t('ui.chartProgressTitle')} · ${displayName}`}
            </p>
          )}
          <p className={`${mode === 'work' ? 'text-base font-bold mt-1' : 'text-xs mt-0.5'} ${progress.status === 'completed' ? 'text-green-700' : 'text-primary-800'}`} aria-live="polite">
            {statusText}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setExpanded(value => !value)}
          className="flex-shrink-0 text-xs font-medium text-primary-700 hover:text-primary-900 px-2 py-1 rounded-control hover:bg-primary-50 transition"
          aria-expanded={expanded}
        >
          {expanded ? t('ui.hideChart') : t('ui.showChart')}
        </button>
      </div>

      {expanded && (
        <div
          ref={scrollRef}
          className="mt-2 max-h-[55vh] max-w-full overflow-auto rounded-control border border-primary-200 bg-white p-2"
        >
          <div className="w-max mx-auto flex items-start gap-1.5">
            <div className="flex flex-col">
              <canvas
                ref={canvasRef}
                className="block border border-gray-200"
                aria-label={statusText}
                role="img"
              />
              <ChartColumnLabels width={chart.width} cellPx={cellPx} />
            </div>
            <ChartRowLabels
              height={chart.height}
              cellPx={cellPx}
              activeLabel={progress.status === 'active' ? progress.activeLine : null}
            />
          </div>
        </div>
      )}
    </div>
  )
}
