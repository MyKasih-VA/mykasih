'use client'

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import { Skeleton } from '@/components/ui/skeleton'

const CATEGORY_LABELS: Record<string, string> = {
  eligibility: 'Eligibility',
  faq: 'FAQ',
  registration: 'Registration',
  complaint: 'Complaint',
  merchant_lookup: 'Merchant Lookup',
  balance_check: 'Balance Check',
}

function formatCategory(name: string): string {
  return CATEGORY_LABELS[name] ?? name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

// 6 visually distinct colors — no duplicates (--accent-teal and --chart-chat are both #00897B)
const COLORS = [
  'var(--status-green)',    // bright green
  'var(--accent-teal)',     // teal
  'var(--status-yellow)',   // golden yellow
  'var(--accent-primary)',  // dark green
  'var(--chart-voice)',     // medium green
  'var(--status-red)',      // coral red — distinct from all others
]

interface CategoryDonutProps {
  data: Array<{ name: string; value: number }>
  title: string
  loading?: boolean
}

export function CategoryDonut({ data, title, loading }: CategoryDonutProps) {
  const total = data.reduce((sum, entry) => sum + entry.value, 0)

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-5">
      <p className="text-base font-semibold text-[var(--text-primary)]">{title}</p>
      {loading ? (
        <div className="flex items-center justify-center mt-4">
          <Skeleton className="w-[160px] h-[160px] rounded-full bg-[var(--bg-border)]" />
        </div>
      ) : (
        <div className="flex items-center gap-4 mt-4">
          <ResponsiveContainer width="60%" height={240}>
            <PieChart>
              <Pie
                data={data}
                dataKey="value"
                nameKey="name"
                cx="40%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--bg-border)',
                  fontSize: 12,
                  color: 'var(--text-primary)',
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-col gap-2 flex-1">
            {data.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2">
                <span
                  className="inline-block w-2.5 h-2.5 rounded-sm flex-shrink-0"
                  style={{ background: COLORS[index % COLORS.length] }}
                />
                <span className="text-xs text-[var(--text-muted)] truncate">
                  {formatCategory(entry.name)}
                </span>
                <span className="text-xs text-[var(--text-muted)] ml-auto">
                  {entry.value}
                  {total > 0 && (
                    <span className="ml-1">
                      ({Math.round((entry.value / total) * 100)}%)
                    </span>
                  )}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
