'use client'

import { useState } from 'react'
import { type LucideIcon, Info } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

interface StatCardProps {
  label: string
  value: string | number
  subInfo?: string
  icon?: LucideIcon
  tooltip?: string
  loading?: boolean
}

export function StatCard({ label, value, subInfo, icon: Icon, tooltip, loading }: StatCardProps) {
  const [showTooltip, setShowTooltip] = useState(false)

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
            <div className="flex items-center gap-1.5">
              <p className="text-xs text-[var(--text-muted)]">{label}</p>
              {tooltip && (
                <div className="relative">
                  <button
                    type="button"
                    aria-label="More info"
                    className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onFocus={() => setShowTooltip(true)}
                    onBlur={() => setShowTooltip(false)}
                  >
                    <Info className="w-3.5 h-3.5" />
                  </button>
                  {showTooltip && (
                    <div
                      role="tooltip"
                      className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 max-w-[280px] bg-[var(--bg-border)] text-xs text-[var(--text-primary)] rounded-md p-2 shadow-lg z-50 whitespace-normal"
                    >
                      {tooltip}
                    </div>
                  )}
                </div>
              )}
            </div>
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
