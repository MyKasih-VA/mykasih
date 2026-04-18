'use client'

import { useState } from 'react'
import { Inbox, Flag } from 'lucide-react'
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
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import { FlagTicketModal } from '@/components/tickets/FlagTicketModal'
import { t, type Language, type TranslationKey } from '@/lib/translations'

interface RecentInteraction {
  id: string
  channel: 'voice' | 'chat'
  caller_name: string | null
  category: string | null
  outcome: string | null
  timestamp: string
  duration: number | null
  message_count: number | null
  ticket_id?: string | null
}

interface RecentInteractionsProps {
  data: RecentInteraction[]
  language: Language
  loading?: boolean
}

function getOutcomeBadgeStyle(outcome: string | null): React.CSSProperties {
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

const CATEGORY_KEYS: Record<string, TranslationKey> = {
  eligibility: 'category.eligibility',
  faq: 'category.faq',
  registration: 'category.registration',
  complaint: 'category.complaint',
  merchant_lookup: 'category.merchantLookup',
  balance_check: 'category.balanceCheck',
}

function formatCategory(raw: string | null, language: Language): string {
  if (!raw) return '--'
  const key = CATEGORY_KEYS[raw]
  if (key) return t(key, language)
  return raw
}

const OUTCOME_KEYS: Record<string, TranslationKey> = {
  resolved: 'outcome.resolved',
  escalated: 'outcome.escalated',
  callback: 'outcome.callback',
  abandoned: 'outcome.abandoned',
}

function formatOutcome(raw: string | null, language: Language): string {
  if (!raw) return '--'
  const key = OUTCOME_KEYS[raw]
  if (key) return t(key, language)
  return raw
}

function formatRelativeTime(timestamp: string, language: Language): string {
  const now = Date.now()
  const then = new Date(timestamp).getTime()
  const diffMs = now - then

  const bm = language === 'bm'

  if (diffMs < 0) return bm ? 'baru sahaja' : 'just now'

  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMins < 1) return bm ? 'baru sahaja' : 'just now'
  if (diffMins < 60) return bm ? `${diffMins}m lalu` : `${diffMins}m ago`
  if (diffHours < 24) return bm ? `${diffHours}j lalu` : `${diffHours}h ago`
  return bm ? `${diffDays}h lalu` : `${diffDays}d ago`
}

export function RecentInteractions({ data, language, loading }: RecentInteractionsProps) {
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [flagCallId, setFlagCallId] = useState<string | null>(null)
  const [flagChannel, setFlagChannel] = useState<'voice' | 'chat'>('voice')
  const [flaggedIds, setFlaggedIds] = useState<Set<string>>(new Set())

  function handleRowClick(id: string) {
    setSelectedCallId(id)
    setModalOpen(true)
  }

  function handleFlagClick(e: React.MouseEvent, row: RecentInteraction) {
    e.stopPropagation()
    setFlagCallId(row.id)
    setFlagChannel(row.channel)
  }

  function handleFlagSuccess() {
    if (flagCallId) {
      setFlaggedIds((prev) => new Set(prev).add(flagCallId))
    }
  }

  const title = t('dashboard.recentInteractions', language)

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
      <p className="text-base font-semibold text-[var(--text-primary)] p-5 pb-3">{title}</p>

      {loading ? (
        <div aria-busy="true" className="px-5 pb-5 space-y-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full bg-[var(--bg-border)]" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-5">
          <Inbox className="w-8 h-8 text-[var(--text-muted)] mb-3" />
          <p className="text-sm font-semibold text-[var(--text-primary)] mb-1">
            {t('empty.noInteractions.heading', language)}
          </p>
          <p className="text-xs text-[var(--text-muted)] text-center max-w-xs">
            {t('empty.noInteractions.body', language)}
          </p>
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow style={{ borderColor: 'var(--bg-border)' }}>
              <TableHead
                scope="col"
                className="w-[72px] text-xs text-[var(--text-muted)]"
              >
                {t('table.channel', language)}
              </TableHead>
              <TableHead
                scope="col"
                className="text-xs text-[var(--text-muted)]"
              >
                {t('table.caller', language)}
              </TableHead>
              <TableHead
                scope="col"
                className="w-[140px] text-xs text-[var(--text-muted)]"
              >
                {t('table.category', language)}
              </TableHead>
              <TableHead
                scope="col"
                className="w-[100px] text-xs text-[var(--text-muted)]"
              >
                {t('table.outcome', language)}
              </TableHead>
              <TableHead
                scope="col"
                className="w-[100px] text-xs text-[var(--text-muted)]"
              >
                {t('table.time', language)}
              </TableHead>
              <TableHead
                scope="col"
                className="w-[90px] text-xs text-[var(--text-muted)]"
              >
                {t('table.durationMsgs', language)}
              </TableHead>
              <TableHead
                scope="col"
                className="w-[100px] text-xs text-[var(--text-muted)]"
              >
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id}
                onClick={() => handleRowClick(row.id)}
                className="h-12 cursor-pointer"
                style={{ borderColor: 'var(--bg-border)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background =
                    'color-mix(in srgb, var(--bg-border) 40%, transparent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = ''
                }}
              >
                <TableCell className="py-0">
                  <ChannelBadge channel={row.channel} language={language} />
                </TableCell>
                <TableCell className="py-0 text-sm text-[var(--text-primary)]">
                  {row.caller_name ?? t('common.unknown', language)}
                </TableCell>
                <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                  {formatCategory(row.category, language)}
                </TableCell>
                <TableCell className="py-0">
                  {row.outcome ? (
                    <span
                      className="text-xs font-semibold px-2 py-1 rounded"
                      style={getOutcomeBadgeStyle(row.outcome)}
                    >
                      {formatOutcome(row.outcome, language)}
                    </span>
                  ) : (
                    <span className="text-xs text-[var(--text-muted)]">--</span>
                  )}
                </TableCell>
                <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                  {formatRelativeTime(row.timestamp, language)}
                </TableCell>
                <TableCell className="py-0 text-xs text-[var(--text-primary)]">
                  {row.channel === 'voice'
                    ? row.duration != null
                      ? `${row.duration}s`
                      : '--'
                    : row.message_count != null
                    ? `${row.message_count} ${language === 'bm' ? 'mesej' : 'msgs'}`
                    : '--'}
                </TableCell>
                <TableCell className="py-0">
                  {!row.ticket_id && !flaggedIds.has(row.id) && (
                    <button
                      type="button"
                      onClick={(e) => handleFlagClick(e, row)}
                      className="flex items-center gap-1 text-xs text-[var(--text-muted)] hover:text-[var(--accent-primary)] transition-colors px-2 py-1 rounded hover:bg-[var(--bg-border)]/60"
                    >
                      <Flag className="w-3.5 h-3.5" />
                      {t('tickets.flagAsTicket', language)}
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}

      <TranscriptModal
        callId={selectedCallId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        language={language}
      />

      {flagCallId && (
        <FlagTicketModal
          callId={flagCallId}
          channel={flagChannel}
          onSuccess={handleFlagSuccess}
          onClose={() => setFlagCallId(null)}
          language={language}
        />
      )}
    </div>
  )
}
