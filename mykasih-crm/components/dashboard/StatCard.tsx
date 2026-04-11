'use client'

import { type LucideIcon } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: string | number
  subInfo?: string
  icon?: LucideIcon
  loading?: boolean
}

export function StatCard({ label, value, subInfo, icon: Icon, loading }: StatCardProps) {
  return (
    <div
      role="region"
      aria-label={label}
      aria-busy={loading ? 'true' : 'false'}
      className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-5"
    >
      {loading ? (
        <>
          <Skeleton className="h-4 w-24 mb-2 bg-[var(--bg-border)]" />
          <Skeleton className="h-9 w-32 bg-[var(--bg-border)]" />
          <Skeleton className="h-3 w-20 mt-1 bg-[var(--bg-border)]" />
        </>
      ) : (
        <>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            {Icon && (
              <Icon className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
            )}
          </div>
          <p className="text-[28px] font-semibold text-[var(--text-primary)] leading-none">{value}</p>
          {subInfo && (
            <p className="text-xs text-[var(--text-muted)] mt-2">{subInfo}</p>
          )}
        </>
      )}
    </div>
  )
}
