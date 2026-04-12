'use client'

import { useState, useEffect, useCallback } from 'react'
import { MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CallsTable, type CallRow } from '@/components/calls/CallsTable'
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

interface TicketRow {
  id: string
  call_id: string | null
  reference_no: string | null
}

export default function ChatMessagesPage() {
  const { language } = useLanguage()

  const [page, setPage] = useState(1)
  const [data, setData] = useState<CallRow[]>([])
  const [pagination, setPagination] = useState<{ total: number; total_pages: number }>({
    total: 0,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [ticketRefMap, setTicketRefMap] = useState<Record<string, string>>({})
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  const fetchCalls = useCallback(async () => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams()
    params.set('channel', 'chat')
    params.set('page', String(page))
    params.set('limit', '25')

    try {
      const res = await fetch(`/api/calls?${params}`)
      if (!res.ok) throw new Error()
      const json = (await res.json()) as {
        data: CallRow[]
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }
      setData(json.data)
      setPagination({ total: json.pagination.total, total_pages: json.pagination.total_pages })

      // Fetch tickets to build call_id -> reference_no map
      try {
        const ticketRes = await fetch('/api/tickets?limit=100')
        if (ticketRes.ok) {
          const ticketJson = (await ticketRes.json()) as { data?: TicketRow[] } | TicketRow[]
          const tickets: TicketRow[] = Array.isArray(ticketJson)
            ? ticketJson
            : (ticketJson.data ?? [])
          const map = tickets.reduce<Record<string, string>>((acc, ticket) => {
            if (ticket.call_id && ticket.reference_no) {
              acc[ticket.call_id] = ticket.reference_no
            }
            return acc
          }, {})
          setTicketRefMap(map)
        }
      } catch {
        // ticket map is best-effort — table still renders without it
      }
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    void fetchCalls()
  }, [fetchCalls])

  function handleRowClick(id: string) {
    setSelectedCallId(id)
    setModalOpen(true)
  }

  const startRow = pagination.total === 0 ? 0 : (page - 1) * 25 + 1
  const endRow = Math.min(page * 25, pagination.total)

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        {t('page.chatMessages', language)}
      </h1>

      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
        <CallsTable
          data={data}
          loading={loading}
          error={error}
          language={language}
          onRowClick={handleRowClick}
          showWaNumber={true}
          showIntentBadge={true}
          showMessageCount={true}
          showTicketRef={true}
          ticketRefs={ticketRefMap}
          emptyIcon={<MessageSquare className="w-8 h-8" />}
          emptyHeading={t('empty.noChatMessages.heading', language)}
          emptyBody={t('empty.noChatMessages.body', language)}
          errorMessage={t('error.loadChat', language)}
        />

        <div className="p-4 border-t border-[var(--bg-border)] flex items-center justify-between text-xs text-[var(--text-muted)]">
          <span>
            {t('pagination.showing', language)} {startRow}–{endRow} {t('pagination.of', language)}{' '}
            {pagination.total}
          </span>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
            >
              Prev
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage(p => p + 1)}
              disabled={page >= pagination.total_pages || loading}
            >
              Next
            </Button>
          </div>
        </div>
      </div>

      <TranscriptModal
        callId={selectedCallId}
        open={modalOpen}
        onOpenChange={setModalOpen}
        language={language}
      />
    </div>
  )
}
