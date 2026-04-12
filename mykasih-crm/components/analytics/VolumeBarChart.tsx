'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
} from 'recharts'
import { t, type Language } from '@/lib/translations'

interface VolumeBarChartProps {
  data: Array<{ date: string; voice: number; chat: number }>
  language: Language
}

export function VolumeBarChart({ data, language }: VolumeBarChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={data} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--bg-border)" strokeDasharray="3 3" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
          axisLine={false}
          tickLine={false}
          allowDecimals={false}
        />
        <Tooltip
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            fontSize: 12,
            color: 'var(--text-primary)',
            borderRadius: 6,
          }}
          cursor={{ fill: 'color-mix(in srgb, var(--bg-border) 40%, transparent)' }}
        />
        <Legend
          iconType="square"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }}
        />
        <Bar
          dataKey="voice"
          stackId="stack"
          fill="var(--chart-voice)"
          name={t('analytics.voice', language)}
        />
        <Bar
          dataKey="chat"
          stackId="stack"
          fill="var(--chart-chat)"
          name={t('analytics.chat', language)}
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}
