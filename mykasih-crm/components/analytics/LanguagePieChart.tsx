'use client'

import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts'
import type { Language } from '@/lib/translations'

interface LanguagePieChartProps {
  data: Array<{ name: string; value: number }>
  language: Language
}

function getLanguageColor(name: string): string {
  const normalized = name.toLowerCase()
  if (normalized === 'bm') return 'var(--accent-primary)'
  if (normalized === 'en') return 'var(--accent-teal)'
  if (normalized === 'mixed') return 'var(--status-yellow)'
  return 'var(--text-muted)'
}

export function LanguagePieChart({ data }: LanguagePieChartProps) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={50}
          outerRadius={80}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getLanguageColor(entry.name)} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            background: 'var(--bg-surface)',
            border: '1px solid var(--bg-border)',
            fontSize: 12,
            color: 'var(--text-primary)',
            borderRadius: 6,
          }}
        />
        <Legend
          iconType="circle"
          iconSize={10}
          wrapperStyle={{ fontSize: 12, color: 'var(--text-muted)', paddingTop: 8 }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}
