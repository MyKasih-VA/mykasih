'use client'

import React from 'react'

interface IntentBadgeProps {
  intent: string | null
}

function getIntentStyle(intent: string | null): React.CSSProperties {
  switch (intent) {
    case 'balance_check':
      return {
        background: 'color-mix(in srgb, var(--accent-teal) 12%, transparent)',
        color: 'var(--accent-teal)',
      }
    case 'merchant_lookup':
      return {
        background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
        color: 'var(--accent-primary)',
      }
    case 'complaint':
      return {
        background: 'color-mix(in srgb, var(--status-red) 12%, transparent)',
        color: 'var(--status-red)',
      }
    case 'faq':
      return {
        background: 'color-mix(in srgb, var(--status-yellow) 12%, transparent)',
        color: 'var(--status-yellow)',
      }
    case 'unknown':
    default:
      return {
        background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
        color: 'var(--text-muted)',
      }
  }
}

function formatIntentLabel(intent: string | null): string {
  switch (intent) {
    case 'balance_check':
      return 'Balance Check'
    case 'merchant_lookup':
      return 'Merchant Lookup'
    case 'complaint':
      return 'Complaint'
    case 'faq':
      return 'FAQ'
    case 'unknown':
      return 'Unknown'
    case null:
      return '--'
    default:
      return intent
  }
}

export function IntentBadge({ intent }: IntentBadgeProps) {
  if (intent === null) {
    return <span className="text-xs text-[var(--text-muted)]">--</span>
  }

  return (
    <span
      className="text-xs font-semibold px-2 py-1 rounded"
      style={getIntentStyle(intent)}
    >
      {formatIntentLabel(intent)}
    </span>
  )
}
