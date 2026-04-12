'use client'

import { useState } from 'react'
import { Inbox } from 'lucide-react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { ChannelBadge } from '@/components/calls/ChannelBadge'
import {
  getOutcomeBadgeStyle,
  formatCategory,
  formatRelativeTime,
} from '@/components/calls/CallsTable'
import { t, type Language } from '@/lib/translations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BeneficiaryCall {
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

export interface BeneficiaryTicket {
  id: string
  reference_no: string | null
  category: string | null
  masked_ic: string | null
  status: string
  created_at: string
}

interface BeneficiaryProfileProps {
  calls: BeneficiaryCall[]
  tickets: BeneficiaryTicket[]
  language: Language
  onCallClick: (callId: string) => void
}

// ---------------------------------------------------------------------------
// Ticket status badge — uses outcome badge style: resolved=green, in_progress=yellow, open=red
// ---------------------------------------------------------------------------

function getTicketStatusStyle(status: string): React.CSSProperties {
  switch (status) {
    case 'resolved':
      return {
        background: 'color-mix(in srgb, var(--status-green) 12%, transparent)',
        color: 'var(--status-green)',
      }
    case 'in_progress':
      return {
        background: 'color-mix(in srgb, var(--status-yellow) 12%, transparent)',
        color: 'var(--status-yellow)',
      }
    case 'open':
    default:
      return {
        background: 'color-mix(in srgb, var(--status-red) 12%, transparent)',
        color: 'var(--status-red)',
      }
  }
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function BeneficiaryProfile({
  calls,
  tickets,
  language,
  onCallClick,
}: BeneficiaryProfileProps) {
  const [hoveredCallRow, setHoveredCallRow] = useState<string | null>(null)

  // Derive profile info from most recent call (first in array — API orders desc)
  const name = calls[0]?.caller_name ?? '?'
  const waNumber = calls[0]?.wa_number ?? '--'
  const lastSeen = calls[0]?.timestamp
  const initial = name !== '?' ? name.charAt(0).toUpperCase() : '?'
  const lastSeenLabel = language === 'en' ? 'Last seen' : 'Terakhir dilihat'

  return (
    <div>
      {/* Profile header card */}
      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg p-6 mb-6">
        <div className="flex items-center gap-4">
          {/* Avatar */}
          <div
            className="w-10 h-10 rounded-full bg-[var(--accent-primary)] flex items-center justify-center shrink-0"
          >
            <span className="text-sm font-semibold text-white">{initial}</span>
          </div>

          {/* Info */}
          <div className="flex flex-col gap-0.5">
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {name !== '?' ? name : (language === 'en' ? 'Unknown' : 'Tidak diketahui')}
            </p>
            <p className="text-sm text-[var(--text-muted)]">{waNumber}</p>
            {lastSeen && (
              <p className="text-xs text-[var(--text-muted)]">
                {lastSeenLabel}: {formatRelativeTime(lastSeen)}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Interaction History */}
      <div className="mb-6">
        <p className="text-base font-semibold text-[var(--text-primary)] mb-3">
          {t('beneficiaries.interactionHistory', language)}{' '}
          <span className="text-[var(--text-muted)] font-normal">({calls.length})</span>
        </p>

        {calls.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg flex flex-col items-center justify-center py-8">
            <Inbox className="w-6 h-6 text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'en' ? 'No interactions' : 'Tiada interaksi'}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: 'var(--bg-border)' }}>
                  <TableHead scope="col" className="w-[72px] text-xs text-[var(--text-muted)]">
                    {t('table.channel', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[140px] text-xs text-[var(--text-muted)]">
                    {t('table.category', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[100px] text-xs text-[var(--text-muted)]">
                    {t('table.outcome', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[90px] text-xs text-[var(--text-muted)]">
                    {t('table.durationMsgs', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[100px] text-xs text-[var(--text-muted)]">
                    {t('table.time', language)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {calls.map((call) => (
                  <TableRow
                    key={call.id}
                    onClick={() => onCallClick(call.id)}
                    className="h-12 cursor-pointer"
                    style={{
                      borderColor: 'var(--bg-border)',
                      background:
                        hoveredCallRow === call.id
                          ? 'color-mix(in srgb, var(--bg-border) 40%, transparent)'
                          : '',
                    }}
                    onMouseEnter={() => setHoveredCallRow(call.id)}
                    onMouseLeave={() => setHoveredCallRow(null)}
                  >
                    <TableCell className="py-0">
                      <ChannelBadge channel={call.channel} language={language} />
                    </TableCell>
                    <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                      {formatCategory(call.category)}
                    </TableCell>
                    <TableCell className="py-0">
                      {call.outcome ? (
                        <span
                          className="text-xs font-semibold px-2 py-1 rounded"
                          style={getOutcomeBadgeStyle(call.outcome)}
                        >
                          {call.outcome}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--text-muted)]">--</span>
                      )}
                    </TableCell>
                    <TableCell className="py-0 text-xs text-[var(--text-primary)]">
                      {call.channel === 'voice'
                        ? call.duration != null
                          ? `${call.duration}s`
                          : '--'
                        : call.message_count != null
                        ? `${call.message_count} msgs`
                        : '--'}
                    </TableCell>
                    <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                      {formatRelativeTime(call.timestamp)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>

      {/* Ticket History */}
      <div>
        <p className="text-base font-semibold text-[var(--text-primary)] mb-3">
          {t('beneficiaries.ticketHistory', language)}{' '}
          <span className="text-[var(--text-muted)] font-normal">({tickets.length})</span>
        </p>

        {tickets.length === 0 ? (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg flex flex-col items-center justify-center py-8">
            <Inbox className="w-6 h-6 text-[var(--text-muted)] mb-2" />
            <p className="text-xs text-[var(--text-muted)]">
              {language === 'en' ? 'No tickets' : 'Tiada tiket'}
            </p>
          </div>
        ) : (
          <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
            <Table>
              <TableHeader>
                <TableRow style={{ borderColor: 'var(--bg-border)' }}>
                  <TableHead scope="col" className="w-[160px] text-xs text-[var(--text-muted)]">
                    {t('table.refNo', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[140px] text-xs text-[var(--text-muted)]">
                    {t('table.category', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[160px] text-xs text-[var(--text-muted)]">
                    {t('table.maskedIc', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[100px] text-xs text-[var(--text-muted)]">
                    {t('table.status', language)}
                  </TableHead>
                  <TableHead scope="col" className="w-[100px] text-xs text-[var(--text-muted)]">
                    {t('table.time', language)}
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tickets.map((ticket) => (
                  <TableRow
                    key={ticket.id}
                    className="h-12"
                    style={{ borderColor: 'var(--bg-border)' }}
                  >
                    <TableCell className="py-0 font-mono text-xs text-[var(--text-primary)]">
                      {ticket.reference_no ?? '--'}
                    </TableCell>
                    <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                      {formatCategory(ticket.category)}
                    </TableCell>
                    <TableCell className="py-0 font-mono text-xs text-[var(--text-muted)]">
                      {ticket.masked_ic ?? '--'}
                    </TableCell>
                    <TableCell className="py-0">
                      <span
                        className="text-xs font-semibold px-2 py-1 rounded"
                        style={getTicketStatusStyle(ticket.status)}
                      >
                        {ticket.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-0 text-xs text-[var(--text-muted)]">
                      {formatRelativeTime(ticket.created_at)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </div>
    </div>
  )
}
