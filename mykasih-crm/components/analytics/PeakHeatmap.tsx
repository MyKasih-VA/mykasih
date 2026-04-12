'use client'

import { t, type Language } from '@/lib/translations'

interface HeatmapCell {
  day: number
  hour: number
  count: number
}

interface PeakHeatmapProps {
  data: HeatmapCell[]
  language: Language
}

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export function PeakHeatmap({ data, language }: PeakHeatmapProps) {
  // Build a lookup map: day-hour -> count
  const cellMap: Record<string, number> = {}
  for (const cell of data) {
    cellMap[`${cell.day}-${cell.hour}`] = cell.count
  }

  const maxCount = data.length > 0 ? Math.max(...data.map(d => d.count)) : 0

  function getCellColor(count: number): string {
    const intensity = maxCount > 0 ? Math.max(5, Math.round((count / maxCount) * 100)) : 5
    return `color-mix(in srgb, var(--accent-primary) ${intensity}%, var(--bg-surface))`
  }

  return (
    <div style={{ overflowX: 'auto' }}>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'auto repeat(7, 28px)',
          gridTemplateRows: 'auto repeat(24, 28px)',
          gap: '2px',
          minWidth: 'fit-content',
        }}
      >
        {/* Top-left empty corner */}
        <div />

        {/* Day labels (header row) */}
        {DAY_LABELS.map(day => (
          <div
            key={day}
            className="text-xs text-center flex items-center justify-center"
            style={{ color: 'var(--text-muted)', fontSize: 11 }}
          >
            {day}
          </div>
        ))}

        {/* Rows: 24 hours */}
        {Array.from({ length: 24 }, (_, hour) => {
          const hourLabel = `${String(hour).padStart(2, '0')}:00`
          return (
            <>
              {/* Hour label */}
              <div
                key={`label-${hour}`}
                className="text-xs flex items-center justify-end pr-2"
                style={{ color: 'var(--text-muted)', fontSize: 10, whiteSpace: 'nowrap' }}
              >
                {hourLabel}
              </div>

              {/* 7 day cells for this hour */}
              {Array.from({ length: 7 }, (_, day) => {
                const count = cellMap[`${day}-${hour}`] ?? 0
                const dayName = DAY_LABELS[day]
                const label = `${dayName} ${hourLabel} — ${count} ${t('analytics.interactions', language)}`
                return (
                  <div
                    key={`${day}-${hour}`}
                    title={label}
                    aria-label={label}
                    className="rounded-sm hover:brightness-125 transition-all"
                    style={{
                      width: 28,
                      height: 28,
                      background: getCellColor(count),
                      cursor: count > 0 ? 'default' : 'default',
                    }}
                  />
                )
              })}
            </>
          )
        })}
      </div>
    </div>
  )
}
