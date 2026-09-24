'use client'

import { useEffect, useRef, useState } from 'react'

interface DailyBarsProps {
  data: { date: string; value: number }[]
  /** What one unit is, for the tooltip ("page views", "adds to cart"). */
  unit: string
  height?: number
}

const BAR_COLOR = '#262626'
const GRID_COLOR = '#ececec'
const AXIS_TEXT = '#9ca3af'
const PAD = { top: 8, right: 4, bottom: 20, left: 28 }

/** Rounds a max up to a clean tick (1, 2, 5 × 10^n) so the axis reads 0 / 50 / 100. */
function niceMax(max: number): number {
  if (max <= 4) return Math.max(1, max)
  const pow = 10 ** Math.floor(Math.log10(max))
  const step = [1, 2, 5, 10].find((m) => m * pow >= max)! * pow
  return step
}

function formatDay(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' })
}

// Single-series daily column chart (no legend: the card title names the series).
// Specs: bars capped at 24px with a 2px gap, 4px rounded tops square at the
// baseline, hairline gridlines, per-bar hover/focus tooltip. Values are also
// in the tables on the same page, so the tooltip never gates data.
export function DailyBars({ data, unit, height = 160 }: DailyBarsProps) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const [width, setWidth] = useState(600)
  const [active, setActive] = useState<number | null>(null)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([entry]) => setWidth(Math.max(200, entry.contentRect.width)))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  if (data.length === 0) {
    return <p className="text-sm text-gray-400 py-10 text-center">No data in this range.</p>
  }

  const max = niceMax(Math.max(...data.map((d) => d.value)))
  const plotW = width - PAD.left - PAD.right
  const plotH = height - PAD.top - PAD.bottom
  const slot = plotW / data.length
  const barW = Math.max(2, Math.min(24, slot - 2))
  const y = (v: number) => PAD.top + plotH - (v / max) * plotH
  const ticks = [0, max / 2, max].filter((t, i, arr) => Number.isInteger(t) && arr.indexOf(t) === i)
  const labelEvery = Math.ceil(data.length / Math.max(1, Math.floor(plotW / 56)))

  const activeDatum = active !== null ? data[active] : null
  const tooltipLeft = active !== null ? PAD.left + slot * active + slot / 2 : 0

  return (
    <div ref={wrapRef} className="relative w-full">
      <svg width={width} height={height} role="img" aria-label={`Daily ${unit}`} className="block">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={PAD.left} x2={width - PAD.right} y1={y(t)} y2={y(t)} stroke={GRID_COLOR} strokeWidth={1} />
            <text x={PAD.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill={AXIS_TEXT}>
              {t.toLocaleString('en-GB')}
            </text>
          </g>
        ))}
        {data.map((d, i) => {
          const x = PAD.left + slot * i + (slot - barW) / 2
          const h = Math.max(0, y(0) - y(d.value))
          const r = Math.min(4, barW / 2, h)
          const top = y(d.value)
          // Rounded top corners, square at the baseline.
          const path = h > 0
            ? `M${x},${y(0)} V${top + r} Q${x},${top} ${x + r},${top} H${x + barW - r} Q${x + barW},${top} ${x + barW},${top + r} V${y(0)} Z`
            : ''
          return (
            <g
              key={d.date}
              tabIndex={0}
              role="img"
              aria-label={`${formatDay(d.date)}: ${d.value} ${unit}`}
              onPointerEnter={() => setActive(i)}
              onPointerLeave={() => setActive(null)}
              onFocus={() => setActive(i)}
              onBlur={() => setActive(null)}
              className="outline-none"
            >
              {/* Hit target: the whole column slot, not just the bar. */}
              <rect x={PAD.left + slot * i} y={PAD.top} width={slot} height={plotH} fill="transparent" />
              {path && <path d={path} fill={BAR_COLOR} opacity={active === null || active === i ? 1 : 0.35} />}
              {i % labelEvery === 0 && (
                <text x={PAD.left + slot * i + slot / 2} y={height - 6} textAnchor="middle" fontSize={10} fill={AXIS_TEXT}>
                  {formatDay(d.date)}
                </text>
              )}
            </g>
          )
        })}
      </svg>
      {activeDatum && (
        <div
          className="pointer-events-none absolute top-0 -translate-x-1/2 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs shadow-sm whitespace-nowrap"
          style={{ left: Math.min(Math.max(tooltipLeft, 60), width - 60) }}
        >
          <span className="font-semibold text-gray-900">{activeDatum.value.toLocaleString('en-GB')}</span>{' '}
          <span className="text-gray-500">{unit} · {formatDay(activeDatum.date)}</span>
        </div>
      )}
    </div>
  )
}
