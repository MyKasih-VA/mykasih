'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'
import { t, type Language } from '@/lib/translations'

interface CallVolumeChartProps {
  data: Array<{ day: string; voice: number; chat: number }>
  title: string
  language: Language
  loading?: boolean
}

export function CallVolumeChart({ data, title, language, loading }: CallVolumeChartProps) {
  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-5">
      <p className="text-base font-semibold text-[var(--text-primary)]">{title}</p>
      <div className="flex items-center gap-4 mt-2 mb-4">
        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: 'var(--chart-voice)' }}
          />
          {t('dashboard.chart.voice', language)}
        </span>
        <span className="flex items-center gap-1 text-xs text-[var(--text-muted)]">
          <span
            className="inline-block w-3 h-3 rounded-sm"
            style={{ background: 'var(--chart-chat)' }}
          />
          {t('dashboard.chart.chat', language)}
        </span>
      </div>
      {loading ? (
        <Skeleton className="w-full h-[240px] bg-[var(--bg-border)]" />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <BarChart data={data}>
            <XAxis
              dataKey="day"
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                background: 'var(--bg-surface)',
                border: '1px solid var(--bg-border)',
                fontSize: 12,
                color: 'var(--text-primary)',
              }}
            />
            <Bar
              dataKey="voice"
              stackId="a"
              fill="var(--chart-voice)"
              name={t('dashboard.chart.voice', language)}
            />
            <Bar
              dataKey="chat"
              stackId="a"
              fill="var(--chart-chat)"
              name={t('dashboard.chart.chat', language)}
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
