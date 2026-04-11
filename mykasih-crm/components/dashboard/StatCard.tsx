'use client'

import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: string | number
  subInfo?: string
  loading?: boolean
}

export function StatCard({ label, value, subInfo, loading }: StatCardProps) {
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
          <p className="text-xs text-[var(--text-muted)] mb-2">{label}</p>
          <p className="text-[28px] font-semibold text-[var(--text-primary)]">{value}</p>
          {subInfo && (
            <p className="text-xs text-[var(--text-muted)] mt-1">{subInfo}</p>
          )}
        </>
      )}
    </div>
  )
}
