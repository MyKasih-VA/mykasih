'use client'

import { useState, useEffect, useCallback } from 'react'
import { Inbox } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { FilterBar, type CallFilters, DEFAULT_FILTERS } from '@/components/calls/FilterBar'
import { CallsTable, type CallRow } from '@/components/calls/CallsTable'
import { TranscriptModal } from '@/components/calls/TranscriptModal'
import { useLanguage } from '@/hooks/useLanguage'
import { t } from '@/lib/translations'

export default function AllInteractionsPage() {
  const { language } = useLanguage()

  const [channelTab, setChannelTab] = useState<'' | 'voice' | 'chat'>('')
  const [filters, setFilters] = useState<CallFilters>(DEFAULT_FILTERS)
  const [page, setPage] = useState(1)
  const [data, setData] = useState<CallRow[]>([])
  const [pagination, setPagination] = useState<{ total: number; total_pages: number }>({
    total: 0,
    total_pages: 0,
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [selectedCallId, setSelectedCallId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)

  function getDateRange(
    datePreset: CallFilters['datePreset'],
    dateFrom: string,
    dateTo: string
  ): { from?: string; to?: string } {
    const today = new Date()
    const pad = (n: number) => String(n).padStart(2, '0')
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`

    if (datePreset === 'today') {
      const todayStr = fmt(today)
      return { from: todayStr, to: todayStr }
    }
    if (datePreset === 'week') {
      const day = today.getDay()
      const diff = day === 0 ? -6 : 1 - day
      const monday = new Date(today)
      monday.setDate(today.getDate() + diff)
      return { from: fmt(monday), to: fmt(today) }
    }
    if (datePreset === 'month') {
      const first = new Date(today.getFullYear(), today.getMonth(), 1)
      return { from: fmt(first), to: fmt(today) }
    }
    if (datePreset === 'custom') {
      return {
        from: dateFrom || undefined,
        to: dateTo || undefined,
      }
    }
    return {}
  }

  const fetchCalls = useCallback(async () => {
    setLoading(true)
    setError(false)

    const params = new URLSearchParams()
    if (channelTab) params.set('channel', channelTab)
    params.set('page', String(page))
    params.set('limit', '25')

    if (filters.search) params.set('search', filters.search)
    if (filters.category) params.set('category', filters.category)
    if (filters.outcome) params.set('outcome', filters.outcome)

    const { from, to } = getDateRange(filters.datePreset, filters.dateFrom, filters.dateTo)
    if (from) params.set('from', from)
    if (to) params.set('to', to)

    try {
      const res = await fetch(`/api/calls?${params}`)
      if (!res.ok) throw new Error()
      const json = (await res.json()) as {
        data: CallRow[]
        pagination: { page: number; limit: number; total: number; total_pages: number }
      }
      setData(json.data)
      setPagination({ total: json.pagination.total, total_pages: json.pagination.total_pages })
    } catch {
      setError(true)
    } finally {
      setLoading(false)
    }
  }, [channelTab, filters, page])

  // Reset page when filters or channel tab changes
  useEffect(() => {
    setPage(1)
  }, [filters, channelTab])

  useEffect(() => {
    void fetchCalls()
  }, [fetchCalls])

  async function handleExport() {
    setExporting(true)
    try {
      const params = new URLSearchParams()
      if (filters.dateFrom) params.set('from', filters.dateFrom)
      if (filters.dateTo) params.set('to', filters.dateTo)
      const res = await fetch(`/api/export/calls?${params}`)
      if (!res.ok) throw new Error()
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `mykasih-interactions-${new Date().toISOString().slice(0, 10)}.xlsx`
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      // silently fail — export is best effort
    } finally {
      setExporting(false)
    }
  }

  function handleRowClick(id: string) {
    setSelectedCallId(id)
    setModalOpen(true)
  }

  function handleFiltersChange(newFilters: CallFilters) {
    setFilters(newFilters)
  }

  const startRow = pagination.total === 0 ? 0 : (page - 1) * 25 + 1
  const endRow = Math.min(page * 25, pagination.total)

  return (
    <div>
      <h1 className="text-xl font-semibold text-[var(--text-primary)] mb-4">
        {t('page.allInteractions', language)}
      </h1>

      <div className="mb-4">
        <Tabs
          defaultValue="all"
          onValueChange={v => {
            setChannelTab(v === 'all' ? '' : (v as 'voice' | 'chat'))
            setPage(1)
          }}
        >
          <TabsList className="bg-[var(--bg-surface)] border border-[var(--bg-border)]">
            <TabsTrigger value="all">{t('filter.allChannels', language)}</TabsTrigger>
            <TabsTrigger value="voice">Voice</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="bg-[var(--bg-surface)] border border-[var(--bg-border)] rounded-lg">
        <div className="p-5 pb-3">
          <FilterBar
            filters={filters}
            onFilterChange={handleFiltersChange}
            onExport={handleExport}
            showLanguageFilter={false}
            language={language}
            exporting={exporting}
          />
        </div>

        <CallsTable
          data={data}
          loading={loading}
          error={error}
          language={language}
          onRowClick={handleRowClick}
          showDurMsgs={true}
          emptyIcon={<Inbox className="w-8 h-8" />}
          emptyHeading={t('empty.noInteractionsFiltered.heading', language)}
          emptyBody={t('empty.noInteractionsFiltered.body', language)}
          errorMessage={t('error.loadCalls', language)}
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
