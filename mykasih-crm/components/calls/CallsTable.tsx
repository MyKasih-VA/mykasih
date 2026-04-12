'use client'

import React, { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Skeleton } from '@/components/ui/skeleton'
import { ChannelBadge } from '@/components/calls/ChannelBadge'
import { IntentBadge } from '@/components/chat/IntentBadge'
import { t, type Language } from '@/lib/translations'

// ---------------------------------------------------------------------------
// Shared helpers — extracted from RecentInteractions.tsx
// ---------------------------------------------------------------------------

export function getOutcomeBadgeStyle(outcome: string | null): React.CSSProperties {
  switch (outcome) {
    case 'resolved':
      return {
        background: 'color-mix(in srgb, var(--status-green) 12%, transparent)',
        color: 'var(--status-green)',
      }
    case 'escalated':
      return {
        background: 'color-mix(in srgb, var(--status-red) 12%, transparent)',
        color: 'var(--status-red)',
      }
    case 'pending':
    case 'in_progress':
      return {
        background: 'color-mix(in srgb, var(--status-yellow) 12%, transparent)',
        color: 'var(--status-yellow)',
      }
    case 'callback':
      return {
        background: 'color-mix(in srgb, var(--accent-teal) 12%, transparent)',
        color: 'var(--accent-teal)',
      }
    case 'abandoned':
    default:
      return {
        background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
        color: 'var(--text-muted)',
      }
  }
}

export const CATEGORY_LABELS: Record<string, string> = {
  eligibility: 'Eligibility',
  faq: 'FAQ',
  registration: 'Registration',
  complaint: 'Complaint',
  merchant_lookup: 'Merchant Lookup',
  balance_check: 'Balance Check',
}

export function formatCategory(raw: string | null): string {
  if (!raw) return '--'
  return CATEGORY_LABELS[raw] ?? raw
}

export function formatRelativeTime(timestamp: string): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  if (diffMs < 0) return 'just now'

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return 'just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  return `${diffDays}d ago`
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CallRow {
  id: string
  channel: 'voice' | 'chat'
  caller_name: string | null
  wa_number: string | null
  category: string | null
  outcome: string | null
  timestamp: string
  duration: number | null
  message_count: number | null
}

interface CallsTableProps {
  data: CallRow[]
  loading: boolean
  error: boolean
  language: Language
  onRowClick: (id: string) => void
  showWaNumber?: boolean
  showIntentBadge?: boolean
  showDuration?: boolean
  showDurMsgs?: boolean
  showMessageCount?: boolean
  showTicketRef?: boolean
  ticketRefs?: Record<string, string>
  emptyIcon: React.ReactNode
  emptyHeading: string
  emptyBody: string
  errorMessage: string
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CallsTable({
  data,
  loading,
  error,
  language,
  onRowClick,
  showWaNumber = false,
  showIntentBadge = false,
  showDuration = false,
  showDurMsgs = false,
  showMessageCount = false,
  showTicketRef = false,
  ticketRefs = {},
  emptyIcon,
  emptyHeading,
  emptyBody,
  errorMessage,
}: CallsTableProps) {
  const [hoveredRow, setHoveredRow] = useState<string | null>(null)

  if (loading) {
    return (
      <div
        aria-busy="true"
        className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg px-5 py-4 space-y-3"
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full bg-[var(--bg-border)]" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg flex items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)] text-center">{errorMessage}</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg flex flex-col items-center justify-center py-16 px-5">
        <div className="text-[var(--text-muted)] mb-3">{emptyIcon}</div>
        <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">{emptyHeading}</p>
        <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">{emptyBody}</p>
      </div>
    )
  }

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
      <Table>
        <TableHeader>
          <TableRow style={{ borderColor: 'var(--bg-border)' }}>
            <TableHead scope="col" className="w-[72px] text-xs text-[var(--text-muted)]">
              {t('table.channel', language)}
            </TableHead>
            <TableHead scope="col" className="text-xs text-[var(--text-muted)]">
              {t('table.caller', language)}
            </TableHead>
            {showWaNumber && (
              <TableHead scope="col" className="text-xs text-[var(--text-muted)]">
                {t('table.waNumber', language)}
              </TableHead>
            )}
            {showIntentBadge && (
              <TableHead scope="col" className="w-[140px] text-xs text-[var(--text-muted)]">
                {t('table.intent', language)}
              </TableHead>
            )}
            {!showIntentBadge && (
              <TableHead scope="col" className="w-[140px] text-xs text-[var(--text-muted)]">
                {t('table.category', language)}
              </TableHead>
            )}
            <TableHead scope="col" className="w-[100px] text-xs text-[var(--text-muted)]">
              {t('table.outcome', language)}
            </TableHead>
            {showDuration && (
              <TableHead scope="col" className="w-[90px] text-xs text-[var(--text-muted)]">
                {t('table.duration', language)}
              </TableHead>
            )}
            {showMessageCount && (
              <TableHead scope="col" className="w-[90px] text-xs text-[var(--text-muted)]">
                {t('table.messages', language)}
              </TableHead>
            )}
            {showDurMsgs && (
              <TableHead scope="col" className="w-[90px] text-xs text-[var(--text-muted)]">
                {t('table.durationMsgs', language)}
              </TableHead>
            )}
            {showTicketRef && (
              <TableHead scope="col" className="w-[140px] text-xs text-[var(--text-muted)]">
                {t('table.refNo', language)}
              </TableHead>
            )}
            <TableHead scope="col" className="w-[100px] text-xs text-[var(--text-muted)]">
              {t('table.time', language)}
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map(row => (
            <TableRow
              key={row.id}
              onClick={() => onRowClick(row.id)}
              className="h-12 cursor-pointer"
              style={{
                borderColor: 'var(--bg-border)',
                background:
                  hoveredRow === row.id
                    ? 'color-mix(in srgb, var(--bg-border) 40%, transparent)'
                    : '',
              }}
              onMouseEnter={() => setHoveredRow(row.id)}
              onMouseLeave={() => setHoveredRow(null)}
            >
              <TableCell className="py-0">
                <ChannelBadge channel={row.channel} language={language} />
              </TableCell>
              <TableCell className="py-0 text-sm text-[var(--text-primary)]">
                {row.caller_name ?? 'Unknown'}
              </TableCell>
              {showWaNumber && (
                <TableCell className="py-0 text-sm text-[var(--text-muted)]">
                  {row.wa_number ?? '--'}
                </TableCell>
              )}
              {showIntentBadge ? (
                <TableCell className="py-0">
                  <IntentBadge intent={row.category} />
                </TableCell>
              ) : (
                <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                  {formatCategory(row.category)}
                </TableCell>
              )}
              <TableCell className="py-0">
                {row.outcome ? (
                  <span
                    className="text-xs font-semibold px-2 py-1 rounded"
                    style={getOutcomeBadgeStyle(row.outcome)}
                  >
                    {row.outcome}
                  </span>
                ) : (
                  <span className="text-xs text-[var(--text-muted)]">--</span>
                )}
              </TableCell>
              {showDuration && (
                <TableCell className="py-0 text-xs text-[var(--text-primary)]">
                  {row.duration != null ? `${row.duration}s` : '--'}
                </TableCell>
              )}
              {showMessageCount && (
                <TableCell className="py-0 text-xs text-[var(--text-primary)]">
                  {row.message_count != null ? `${row.message_count} msgs` : '--'}
                </TableCell>
              )}
              {showDurMsgs && (
                <TableCell className="py-0 text-xs text-[var(--text-primary)]">
                  {row.channel === 'voice'
                    ? row.duration != null ? `${row.duration}s` : '--'
                    : row.message_count != null ? `${row.message_count} msgs` : '--'}
                </TableCell>
              )}
              {showTicketRef && (
                <TableCell className="py-0 font-mono text-xs text-[var(--text-muted)]">
                  {ticketRefs[row.id] ?? '--'}
                </TableCell>
              )}
              <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                {formatRelativeTime(row.timestamp)}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
