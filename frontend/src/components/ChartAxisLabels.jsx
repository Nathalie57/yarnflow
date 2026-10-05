import { descendingChartAxisLabels, shouldShowChartAxes } from '../utils/chartAxes'

export function ChartColumnLabels({ width, cellPx }) {
  if (!shouldShowChartAxes(cellPx)) return null

  return (
    <div className="flex" style={{ width: Number(width) * cellPx }} aria-hidden="true">
      {descendingChartAxisLabels(width).map((label, index) => (
        <div key={index} style={{ width: cellPx }} className="text-center text-[8px] text-gray-500 leading-none pt-0.5">
          {label}
        </div>
      ))}
    </div>
  )
}

export function ChartRowLabels({ height, cellPx, activeLabel = null }) {
  if (!shouldShowChartAxes(cellPx)) return null

  return (
    <div className="flex flex-col" style={{ height: Number(height) * cellPx }} aria-hidden="true">
      {descendingChartAxisLabels(height).map((label, index) => (
        <div
          key={index}
          style={{ height: cellPx }}
          className={`flex items-center text-[8px] leading-none pl-0.5 ${Number(activeLabel) === label ? 'font-bold text-primary-700' : 'text-gray-500'}`}
        >
          {label}
        </div>
      ))}
    </div>
  )
}
