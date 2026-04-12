'use client'

import { useState, useEffect } from 'react'
import { Skeleton } from '@/components/ui/skeleton'
import { TicketCard, type Ticket } from '@/components/tickets/TicketCard'
import { t, type Language } from '@/lib/translations'

type TicketStatus = 'open' | 'in_progress' | 'resolved'

interface TicketKanbanProps {
  language: Language
}

const COLUMNS: Array<{ key: TicketStatus; labelKey: 'kanban.open' | 'kanban.inProgress' | 'kanban.resolved'; dotColor: string }> = [
  { key: 'open', labelKey: 'kanban.open', dotColor: 'var(--status-red)' },
  { key: 'in_progress', labelKey: 'kanban.inProgress', dotColor: 'var(--status-yellow)' },
  { key: 'resolved', labelKey: 'kanban.resolved', dotColor: 'var(--status-green)' },
]

export function TicketKanban({ language }: TicketKanbanProps) {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [updateError, setUpdateError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchTickets() {
      try {
        const res = await fetch('/api/tickets?limit=100')
        if (!res.ok) throw new Error('Failed to fetch')
        const json = (await res.json()) as { data: Ticket[] }
        setTickets(json.data)
      } catch {
        setError(true)
      } finally {
        setLoading(false)
      }
    }
    void fetchTickets()
  }, [])

  async function handleStatusChange(ticketId: string, newStatus: TicketStatus) {
    // Save old state for revert
    const prevTickets = [...tickets]
    // Optimistic update — move card immediately
    setTickets((prev) =>
      prev.map((ticket) =>
        ticket.id === ticketId ? { ...ticket, status: newStatus } : ticket
      )
    )
    setUpdateError(null)
    // PATCH in background
    try {
      const res = await fetch(`/api/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (!res.ok) throw new Error()
    } catch {
      // Revert on failure
      setTickets(prevTickets)
      setUpdateError(t('error.statusUpdate', language))
      setTimeout(() => setUpdateError(null), 3000)
    }
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-16">
        <p className="text-sm text-[var(--text-muted)]">{t('error.loadTickets', language)}</p>
      </div>
    )
  }

  return (
    <div>
      {/* Update error bar */}
      {updateError && (
        <div className="mb-4 bg-[var(--status-red)]/10 border border-[var(--status-red)]/30 rounded p-2 text-xs text-[var(--status-red)]">
          {updateError}
        </div>
      )}

      <div className="grid grid-cols-3 gap-6">
        {COLUMNS.map((column) => {
          const columnTickets = tickets.filter((ticket) => ticket.status === column.key)
          const label = t(column.labelKey, language)

          return (
            <div key={column.key}>
              {/* Column header */}
              <div className="flex items-center gap-2 mb-3">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: column.dotColor }}
                />
                <span className="text-xs font-semibold uppercase text-[var(--text-muted)]">
                  {label}
                </span>
                <span className="text-xs text-[var(--text-muted)]">
                  ({loading ? '…' : columnTickets.length})
                </span>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-3">
                {loading ? (
                  <>
                    <Skeleton className="h-24 w-full bg-[var(--bg-border)] rounded-lg" />
                    <Skeleton className="h-24 w-full bg-[var(--bg-border)] rounded-lg" />
                    <Skeleton className="h-24 w-full bg-[var(--bg-border)] rounded-lg" />
                  </>
                ) : columnTickets.length === 0 ? (
                  <div className="border border-dashed border-[var(--bg-border)] rounded-lg flex items-center justify-center h-24">
                    <p className="text-xs text-[var(--text-muted)]">
                      {t('empty.noTickets', language)}
                    </p>
                  </div>
                ) : (
                  columnTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticket={ticket}
                      onStatusChange={handleStatusChange}
                      language={language}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
