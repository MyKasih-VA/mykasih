'use client'

import { TrendingUp } from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  ResponsiveContainer,
} from 'recharts'
import { t, type Language } from '@/lib/translations'

interface CsatTrendChartProps {
  data: Array<{ date: string; avg: number }>
  language: Language
}

export function CsatTrendChart({ data, language }: CsatTrendChartProps) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 h-[240px]">
        <TrendingUp className="w-8 h-8 text-[var(--text-muted)] mb-3" />
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
          {t('analytics.noCSAT.heading', language)}
        </p>
        <p className="text-xs text-[var(--text-muted)]">
          {t('analytics.noCSAT.body', language)}
        </p>
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--bg-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          domain={[1, 5]}
          ticks={[1, 2, 3, 4, 5]}
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
            borderRadius: 6,
          }}
        />
        <ReferenceLine y={3.5} stroke="var(--text-muted)" strokeDasharray="3 3" />
        <Line
          type="monotone"
          dataKey="avg"
          stroke="var(--accent-primary)"
          strokeWidth={2}
          dot={false}
          activeDot={{ r: 4, fill: 'var(--accent-primary)' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
