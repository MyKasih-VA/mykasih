'use client'

import React from 'react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { t, type Language } from '@/lib/translations'

export interface Ticket {
  id: string
  call_id: string | null
  channel: string | null
  category: string | null
  description: string | null
  status: 'open' | 'in_progress' | 'resolved'
  reference_no: string | null
  masked_ic: string | null
  assigned_to: string | null
  created_at: string
  updated_at: string
}

type TicketStatus = 'open' | 'in_progress' | 'resolved'

interface TicketCardProps {
  ticket: Ticket
  onStatusChange: (ticketId: string, newStatus: TicketStatus) => void
  language: Language
}

function getCategoryBadgeStyle(category: string | null): React.CSSProperties {
  switch (category) {
    case 'complaint':
      return {
        background: 'color-mix(in srgb, var(--status-yellow) 12%, transparent)',
        color: 'var(--status-yellow)',
      }
    case 'faq':
      return {
        background: 'color-mix(in srgb, var(--accent-teal) 12%, transparent)',
        color: 'var(--accent-teal)',
      }
    case 'merchant_lookup':
      return {
        background: 'color-mix(in srgb, var(--accent-primary) 12%, transparent)',
        color: 'var(--accent-primary)',
      }
    case 'balance_check':
      return {
        background: 'color-mix(in srgb, var(--status-green) 12%, transparent)',
        color: 'var(--status-green)',
      }
    case 'eligibility':
    case 'registration':
    default:
      return {
        background: 'color-mix(in srgb, var(--text-muted) 12%, transparent)',
        color: 'var(--text-muted)',
      }
  }
}

const CATEGORY_LABELS: Record<string, string> = {
  eligibility: 'Eligibility',
  faq: 'FAQ',
  registration: 'Registration',
  complaint: 'Complaint',
  merchant_lookup: 'Merchant Lookup',
  balance_check: 'Balance Check',
}

function formatCategory(category: string | null): string {
  if (!category) return '--'
  return CATEGORY_LABELS[category] ?? category
}

function formatRelativeTime(timestamp: string): string {
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

export function TicketCard({ ticket, onStatusChange, language }: TicketCardProps) {
  return (
    <Card className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg shadow-none">
      <CardContent className="p-4 flex flex-col gap-2">
        {/* Row 1: reference_no + category badge */}
        <div className="flex justify-between items-start">
          <span className="font-mono text-xs text-[var(--text-primary)]">
            {ticket.reference_no ?? '--'}
          </span>
          {ticket.category ? (
            <span
              className="text-xs font-semibold px-2 py-1 rounded"
              style={getCategoryBadgeStyle(ticket.category)}
            >
              {formatCategory(ticket.category)}
            </span>
          ) : (
            <span className="text-xs text-[var(--text-muted)]">--</span>
          )}
        </div>

        {/* Row 2: masked_ic */}
        <div>
          <span className="font-mono text-xs text-[var(--text-muted)]">
            {ticket.masked_ic ?? '--'}
          </span>
        </div>

        {/* Row 3: relative time */}
        <div>
          <span className="text-xs text-[var(--text-muted)]">
            {formatRelativeTime(ticket.created_at)}
          </span>
        </div>

        {/* Separator */}
        <hr className="border-[var(--bg-border)]" />

        {/* Row 4: Status Select */}
        <Select
          value={ticket.status}
          onValueChange={(v) => onStatusChange(ticket.id, v as TicketStatus)}
        >
          <SelectTrigger className="w-full text-xs h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="open">{t('kanban.open', language)}</SelectItem>
            <SelectItem value="in_progress">{t('kanban.inProgress', language)}</SelectItem>
            <SelectItem value="resolved">{t('kanban.resolved', language)}</SelectItem>
          </SelectContent>
        </Select>
      </CardContent>
    </Card>
  )
}
